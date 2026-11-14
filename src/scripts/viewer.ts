/**
 * Plan viewer (DESIGN §5.5), imported on first "View plan". Transform-only pan/zoom (translate3d + scale),
 * no library: pointer drag pans, pinch zooms, wheel zooms inside the dialog only, double-click/tap toggles
 * 1× ↔ 2.5×, +/−/reset buttons; range 1–4×. Keys: ←/→ step, +/− zoom, 0 reset, Esc closes.
 */
import { getLenis, prefersReducedMotion, scrollToTarget } from './motion-api';

interface UnitData {
  code: string;
  type: string;
  gross: string;
  net: string;
  rooms: string[];
  full: string;
  thumb: string;
  w: number;
  h: number;
  alt: string;
  floors: string;
}

const MIN = 1;
const MAX = 4;

let ctrl: ReturnType<typeof create> | null = null;

export function openViewer(code: string, codes: string[], opener: HTMLElement | null) {
  ctrl ??= create();
  ctrl?.open(code, codes, opener);
}

function create() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-viewer]');
  if (!dialog) return null;
  const $ = <T extends Element = HTMLElement>(s: string) => dialog.querySelector<T>(s)!;
  const units = JSON.parse(dialog.dataset.units ?? '[]') as UnitData[];
  const t = JSON.parse(dialog.dataset.i18n ?? '{}') as Record<string, string>;
  const f = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '');

  const stage = $('[data-viewer-stage]');
  const pan = $('[data-viewer-pan]');
  const img = $<HTMLImageElement>('[data-viewer-img]');
  const loading = $('[data-viewer-loading]');

  let codes: string[] = [];
  let idx = 0;
  let opener: HTMLElement | null = null;
  let s = 1;
  let x = 0;
  let y = 0;

  /* ---------- transform ---------- */
  const clamp = () => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    s = Math.min(MAX, Math.max(MIN, s));
    x = Math.min(0, Math.max(w - w * s, x));
    y = Math.min(0, Math.max(h - h * s, y));
  };
  const apply = (smooth = false) => {
    clamp();
    pan.style.transition = smooth && !prefersReducedMotion() ? 'transform 0.3s cubic-bezier(0.215,0.61,0.355,1)' : 'none';
    pan.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
  };
  const zoomAt = (next: number, cx: number, cy: number, smooth = true) => {
    const n = Math.min(MAX, Math.max(MIN, next));
    x = cx - ((cx - x) * n) / s;
    y = cy - ((cy - y) * n) / s;
    s = n;
    apply(smooth);
  };
  const centre = () => ({ cx: stage.clientWidth / 2, cy: stage.clientHeight / 2 });
  const reset = (smooth = true) => {
    s = 1;
    x = y = 0;
    apply(smooth);
  };

  /* ---------- pointers: drag, pinch, double-tap ---------- */
  const pts = new Map<number, { x: number; y: number }>();
  let pinch: { d: number; s: number } | null = null;
  let lastTap = { t: 0, x: 0, y: 0 };
  const local = (e: PointerEvent | MouseEvent | WheelEvent) => {
    const r = stage.getBoundingClientRect();
    return { cx: e.clientX - r.left, cy: e.clientY - r.top };
  };

  stage.addEventListener('pointerdown', (e) => {
    if ((e.target as Element).closest('button')) return;
    stage.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      pinch = { d: Math.hypot(a!.x - b!.x, a!.y - b!.y), s };
    }
  });
  stage.addEventListener('pointermove', (e) => {
    const prev = pts.get(e.pointerId);
    if (!prev) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2 && pinch) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      const r = stage.getBoundingClientRect();
      zoomAt(pinch.s * (d / pinch.d), (a!.x + b!.x) / 2 - r.left, (a!.y + b!.y) / 2 - r.top, false);
    } else if (pts.size === 1) {
      x += e.clientX - prev.x;
      y += e.clientY - prev.y;
      apply();
    }
  });
  const up = (e: PointerEvent) => {
    pts.delete(e.pointerId);
    if (pts.size < 2) pinch = null;
    if (e.pointerType !== 'mouse' && e.type === 'pointerup') {
      const now = performance.now();
      if (now - lastTap.t < 300 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 25) {
        const { cx, cy } = local(e);
        zoomAt(s > 1.01 ? 1 : 2.5, cx, cy);
        lastTap.t = 0;
      } else lastTap = { t: now, x: e.clientX, y: e.clientY };
    }
  };
  stage.addEventListener('pointerup', up);
  stage.addEventListener('pointercancel', up);
  stage.addEventListener('dblclick', (e) => {
    const { cx, cy } = local(e);
    zoomAt(s > 1.01 ? 1 : 2.5, cx, cy);
  });
  stage.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault(); // zoom inside the dialog only; the page never scrolls behind it
      const { cx, cy } = local(e);
      zoomAt(s * Math.exp(-e.deltaY * 0.0022), cx, cy, false);
    },
    { passive: false },
  );

  dialog.querySelectorAll<HTMLButtonElement>('[data-zoom]').forEach((b) =>
    b.addEventListener('click', () => {
      const { cx, cy } = centre();
      if (b.dataset.zoom === 'in') zoomAt(s * 1.5, cx, cy);
      else if (b.dataset.zoom === 'out') zoomAt(s / 1.5, cx, cy);
      else reset();
    }),
  );

  /* ---------- content ---------- */
  let loadToken = 0;
  let current: UnitData | null = null;
  const steps = dialog.querySelectorAll<HTMLButtonElement>('[data-viewer-step]');

  /** Contain-fit the whole plan with 24 px padding; this size is zoom 1× (the floor), reset returns to it. */
  const fitImage = () => {
    if (!current) return;
    const W = stage.clientWidth - 48;
    const H = stage.clientHeight - 48;
    const k = Math.max(0.01, Math.min(W / current.w, H / current.h));
    img.style.width = `${Math.round(current.w * k)}px`;
    img.style.height = `${Math.round(current.h * k)}px`;
  };

  const show = (i: number) => {
    idx = (i + codes.length) % codes.length;
    const u = units.find((x) => x.code === codes[idx]) ?? units[0]!;
    current = u;
    fitImage();
    reset(false);
    steps.forEach((b) => (b.disabled = codes.length < 2));
    $('[data-viewer-code]').textContent = u.type;
    $('[data-viewer-title]').textContent = f(t.title ?? '', { code: u.code });
    $('[data-viewer-gross]').textContent = u.gross;
    $('[data-viewer-net]').textContent = u.net;
    const floors = $('[data-viewer-floors]');
    floors.textContent = u.floors;
    floors.hidden = !u.floors;
    const rooms = $('[data-viewer-rooms]');
    rooms.replaceChildren(...u.rooms.map((r) => Object.assign(document.createElement('li'), { textContent: r })));
    $('[data-viewer-request-text]').textContent = f(t.requestFor ?? '', { code: u.code });
    $<HTMLAnchorElement>('[data-viewer-request]').dataset.unit = u.code;
    $('[data-viewer-pos]').textContent = `${idx + 1} / ${codes.length}`;
    // announce plan changes (←/→, prev/next) without moving focus
    $('[data-viewer-live]').textContent = `${f(t.title ?? '', { code: u.code })}, ${u.type}, ${idx + 1} / ${codes.length}`;

    // blurred thumbnail first; the full plan (WebP q82) only now
    const token = ++loadToken;
    img.alt = u.alt;
    img.width = u.w;
    img.height = u.h;
    img.src = u.thumb;
    img.setAttribute('data-blur', '');
    loading.hidden = false;
    const hi = new Image();
    hi.decoding = 'async';
    hi.src = u.full;
    void hi
      .decode()
      .catch(() => undefined)
      .then(() => {
        if (token !== loadToken) return;
        img.src = u.full;
        img.removeAttribute('data-blur');
        loading.hidden = true;
        fitImage();
      });
  };

  steps.forEach((b) => b.addEventListener('click', () => show(idx + Number(b.dataset.viewerStep))));

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' && codes.length > 1) show(idx + 1);
    else if (e.key === 'ArrowLeft' && codes.length > 1) show(idx - 1);
    else if (e.key === '+' || e.key === '=') zoomAt(s * 1.5, centre().cx, centre().cy);
    else if (e.key === '-' || e.key === '_') zoomAt(s / 1.5, centre().cx, centre().cy);
    else if (e.key === '0') reset();
    else return;
    e.preventDefault();
  });

  /* ---------- open / close ---------- */
  const close = () => dialog.close();
  $('[data-viewer-close]').addEventListener('click', close);
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close(); // backdrop
  });
  dialog.addEventListener('close', () => {
    getLenis()?.start();
    document.documentElement.classList.remove('has-dialog');
    opener?.focus({ preventScroll: true });
  });

  $<HTMLAnchorElement>('[data-viewer-request]').addEventListener('click', (e) => {
    e.preventDefault();
    const unit = (e.currentTarget as HTMLElement).dataset.unit ?? '';
    opener = null; // focus goes to the form instead
    close();
    history.replaceState(null, '', `${location.pathname}?unit=${unit}#enquire`);
    window.dispatchEvent(new CustomEvent('enquiry:prefill', { detail: { unit } }));
    const form = document.querySelector('#enquire');
    if (form) scrollToTarget(form);
  });

  window.addEventListener('resize', () => {
    if (!dialog.open) return;
    fitImage();
    apply();
  });

  return {
    open(code: string, list: string[], from: HTMLElement | null) {
      codes = list.length ? list : units.map((u) => u.code);
      opener = from;
      document.documentElement.classList.add('has-dialog');
      getLenis()?.stop();
      if (!dialog.open) dialog.showModal();
      show(Math.max(0, codes.indexOf(code)));
      $<HTMLButtonElement>('[data-viewer-close]').focus();
    },
  };
}
