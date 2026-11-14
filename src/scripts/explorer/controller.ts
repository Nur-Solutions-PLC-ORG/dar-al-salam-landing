/**
 * Tower explorer state machine (DESIGN §9.2). Lazy-loaded by loader.ts.
 *
 *   IDLE ──hover/focus──▶ preview(n)            Back/Esc: UNIT → FLOOR → IDLE
 *     └─click/Enter/View─▶ FLOOR(n) ──hotspot/chip──▶ UNIT(n, code)
 *
 * URL: #explore · #explore/f7 · #explore/f7/bl05 via history.replaceState (shareable, never scrolls).
 * The DOM is server-rendered; this module only toggles views/classes and drives a model tier
 * (tier 1 SVG always; tier 2 Three.js swapped in when available, see loadScene()).
 */
import { gsap, ScrollTrigger, prefersReducedMotion, scrollToTarget } from '../motion';
import { prefersLightweight, supportsWebGL, onVisibility } from '../lazy';
import { createSvgModel } from './svg-model';
import type { Level, ModelAdapter, ModelCallbacks } from './types';

const CODES = ['BL01', 'BL02', 'BL03', 'BL04', 'BL05', 'BL06', 'BL07', 'BL08', 'BL09'] as const;
type Code = (typeof CODES)[number];

type I18n = Record<
  | 'floorN'
  | 'viewFloor'
  | 'keyplanLabel'
  | 'requestFor'
  | 'unitOnFloor'
  | 'backToFloor'
  | 'floorTooltip'
  | 'bedShort'
  | 'hintTouch'
  | 'hintPointer'
  | 'hintHover'
  | 'tbc'
  | 'tbcAria'
  | 'tbcBody'
  | 'seeOn',
  string
>;

const f = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));

interface State {
  level: Level;
  floor: number;
  unit: Code | null;
}

export function createExplorer(root: HTMLElement) {
  const $ = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel);
  const $$ = <T extends Element = HTMLElement>(sel: string) => Array.from(root.querySelectorAll<T>(sel));
  const t = JSON.parse(root.dataset.i18n ?? '{}') as I18n;

  const stage = $('[data-stage]')!;
  const panel = $('[data-panel]')!;
  const tooltip = $('[data-tooltip]')!;
  const hint = $('[data-hint]')!;
  const views = new Map($$('[data-view]').map((v) => [v.dataset.view as Level, v]));
  const floorRows = $$<HTMLButtonElement>('.floors__row');
  // per plan floor, server-rendered on the floor list: composition text + positions still to be confirmed
  const rowOf = (n: number) => floorRows.find((r) => Number(r.dataset.floor) === n);
  const FLOORS = floorRows.length || 14;
  const mixOf = (n: number) => rowOf(n)?.querySelector('.floors__mix')?.textContent?.trim() ?? '';
  const tbcOf = (n: number) => new Set((rowOf(n)?.dataset.tbc ?? '').split(' ').filter(Boolean));
  const hotspots = $$<SVGAElement>('.hotspot');
  const chips = $$<HTMLButtonElement>('.chip');
  const cards = new Map($$('[data-unit-card]').map((c) => [c.dataset.unitCard as Code, c]));
  const keyplan = $('[data-keyplan]')!;
  const keyplanSvg = $<SVGSVGElement>('[data-keyplan-svg]');
  const pill = $('[data-keyplan-pill]')!;
  const tbcCard = $('[data-unit-tbc]');
  // server-rendered accessible names of the hotspots (a TBC position swaps to t.tbcAria)
  const stdAria = new Map(hotspots.map((h) => [h.dataset.unit, h.getAttribute('aria-label') ?? '']));
  /** Floors where `code` is confirmed, read from the floor rows' data-tbc. */
  const confirmedFloors = (code: Code) =>
    floorRows.map((r) => Number(r.dataset.floor)).filter((n) => !tbcOf(n).has(code)).sort((a, b) => a - b);
  /** Nearest confirmed floor; ties go to the lower floor (DESIGN §9.2 rev 5: 1–5 → 4, 7 → 6, 12–14 → 11). */
  const nearestFloor = (n: number, code: Code) =>
    confirmedFloors(code).reduce<number | null>((best, f) => (best === null || Math.abs(f - n) < Math.abs(best - n) ? f : best), null) ?? n;
  const isTbc = (code: string | null, n = state.floor) => Boolean(code && tbcOf(n).has(code));

  // unit facts for pills, read once from the hotspot labels the server rendered
  const unitInfo = new Map(
    hotspots.map((h) => {
      const code = h.dataset.unit as Code;
      const chip = chips.find((c) => c.dataset.unit === code);
      return [code, chip?.dataset.pill ?? ''];
    }),
  );

  const state: State = { level: 'idle', floor: 1, unit: null };
  let introProgress = 1; // S10 scrub progress, handed to the 3D scene when it arrives
  let previewFloor = 1; // stepper / list preview while idle

  /* ---------- model tiers ---------- */

  const callbacks: ModelCallbacks = {
    onHover: (n, at) => {
      setPreview(n, false);
      showTooltip(n, at);
    },
    onPick: (n) => go({ level: 'floor', floor: n, unit: null }, { focus: false, scroll: true }),
    onInteract: () => hint.setAttribute('data-done', ''),
  };

  const svg = $<SVGSVGElement>('[data-maquette]')!;
  let model: ModelAdapter = createSvgModel(svg, stage, callbacks);
  stage.dataset.tier = 'svg';

  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const webgl = supportsWebGL();
  const setHint = (text: string) => {
    hint.textContent = text;
    hint.hidden = false;
  };
  setHint(fine ? t.hintHover : t.hintTouch);

  const loadBtn = $<HTMLButtonElement>('[data-load-3d]')!;
  let sceneLoading = false;
  const loadScene = () => {
    if (sceneLoading) return;
    sceneLoading = true;
    loadBtn.hidden = true;
    import('./scene')
      .then(({ createScene }) => createScene($('[data-canvas]')!, stage, callbacks))
      .then((scene) => {
        model.destroy();
        model = scene;
        model.select(state.level === 'idle' ? null : state.floor);
        model.setIntro?.(introProgress);
        stage.dataset.tier = '3d';
        if (fine) setHint(t.hintPointer);
        ScrollTrigger.refresh();
      })
      .catch((err: unknown) => {
        console.warn('[explorer] 3D unavailable, keeping the SVG model', err);
      });
  };
  if (webgl && !prefersLightweight()) loadScene();
  else if (webgl) {
    loadBtn.hidden = false;
    loadBtn.addEventListener('click', loadScene, { once: true });
  }
  // context loss → back to tier 1
  stage.addEventListener('explorer:fallback', () => {
    model.destroy();
    model = createSvgModel(svg, stage, callbacks);
    model.select(state.level === 'idle' ? null : state.floor);
    stage.dataset.tier = 'svg';
  });

  /* ---------- tooltip / preview ---------- */

  function showTooltip(n: number | null, at?: { x: number; y: number }) {
    if (!n) {
      tooltip.hidden = true;
      return;
    }
    const p = at ?? model.anchor(n);
    if (!p) return;
    tooltip.textContent = f(t.floorTooltip, { n, mix: mixOf(n) });
    tooltip.style.setProperty('--tx', `${Math.min(p.x, stage.clientWidth - 140)}px`);
    tooltip.style.setProperty('--ty', `${p.y}px`);
    tooltip.hidden = false;
  }

  function setPreview(n: number | null, fromList: boolean) {
    floorRows.forEach((r) => r.classList.toggle('is-preview', Number(r.dataset.floor) === n));
    if (fromList) model.preview(n);
    if (n && state.level === 'idle') {
      previewFloor = n;
      renderStepper();
    }
  }

  /* ---------- rendering ---------- */

  function renderStepper() {
    const n = state.level === 'idle' ? previewFloor : state.floor;
    $$('[data-stepper-label]').forEach((el) => (el.textContent = f(t.floorN, { n })));
    $$('[data-view-floor] .btn__text').forEach((el) => (el.textContent = f(t.viewFloor, { n })));
    $$<HTMLButtonElement>('[data-step="-1"]').forEach((b) => (b.disabled = n <= 1));
    $$<HTMLButtonElement>('[data-step="1"]').forEach((b) => (b.disabled = n >= FLOORS));
  }

  function renderHotspots() {
    hotspots.forEach((h) => h.classList.toggle('is-selected', h.dataset.unit === state.unit));
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.unit === state.unit)));
    if (state.unit) keyplan.setAttribute('data-has-selection', '');
    else keyplan.removeAttribute('data-has-selection');
    showPill(state.unit, true);
  }

  function showPill(code: string | null, selected: boolean) {
    const h = hotspots.find((x) => x.dataset.unit === code);
    if (!code || !h) {
      pill.hidden = true;
      return;
    }
    pill.textContent = `${code} · ${isTbc(code) ? t.tbc : (unitInfo.get(code as Code) ?? '')}`;
    pill.style.setProperty('--x', h.style.getPropertyValue('--cx'));
    pill.style.setProperty('--y', h.style.getPropertyValue('--cy'));
    pill.toggleAttribute('data-selected', selected);
    pill.hidden = false;
  }

  /** The article shown for UNIT(n, code): the TBC card on a floor where the home isn't confirmed. */
  const activeCard = () => (isTbc(state.unit) ? tbcCard : state.unit ? cards.get(state.unit) : undefined);

  function renderUnit() {
    const where = state.unit ? f(t.unitOnFloor, { n: state.floor, code: state.unit }) : '';
    const tbc = isTbc(state.unit);
    if (tbcCard) {
      tbcCard.hidden = !tbc;
      if (tbc && state.unit) {
        const code = state.unit;
        const m = nearestFloor(state.floor, code);
        tbcCard.querySelector('[data-unit-where]')!.textContent = where;
        tbcCard.querySelector('[data-tbc-body]')!.textContent = f(t.tbcBody, { n: state.floor });
        const see = tbcCard.querySelector<HTMLElement>('[data-see-confirmed]')!;
        see.dataset.floor = String(m);
        see.querySelectorAll('.btn__text').forEach((el) => (el.textContent = f(t.seeOn, { code, n: m })));
      }
    }
    cards.forEach((card, code) => {
      const on = code === state.unit && !tbc;
      card.hidden = !on;
      if (!on) return;
      const w = card.querySelector('[data-unit-where]');
      if (w) w.textContent = where;
      // visible label stays "Request pricing"; the full "…for Floor 7 · BL05" is the accessible name
      card.querySelector('[data-request]')?.setAttribute('aria-label', f(t.requestFor, { n: state.floor, code }));
    });
    $$('[data-back-floor-text]').forEach((el) => (el.textContent = f(t.backToFloor, { n: state.floor })));
  }

  function renderCrumbs() {
    const crumbs = $('[data-crumbs]')!;
    crumbs.hidden = state.level === 'idle';
    const floorLi = $('[data-crumb-floor-li]')!;
    const unitLi = $('[data-crumb-unit-li]')!;
    floorLi.hidden = state.level === 'idle';
    unitLi.hidden = state.level !== 'unit';
    const floorBtn = $('[data-crumb="floor"]')!;
    floorBtn.textContent = f(t.floorN, { n: state.floor });
    if (state.level === 'floor') floorBtn.setAttribute('aria-current', 'location');
    else floorBtn.removeAttribute('aria-current');
    $('[data-crumb-unit]')!.textContent = state.unit ?? '';
  }

  let activeView: HTMLElement | undefined;
  function renderView(animate: boolean) {
    const next = views.get(state.level);
    if (!next || next === activeView) return;
    views.forEach((v) => v.classList.toggle('is-active', v === next));
    activeView = next;
    if (!animate) return;
    const reduce = prefersReducedMotion();
    gsap.fromTo(
      next,
      // opacity only (never visibility): the focus() that follows must land inside this view (review M2-H1)
      { opacity: 0, x: reduce ? 0 : 24 },
      { opacity: 1, x: 0, duration: reduce ? 0.2 : 0.5, ease: 'power3.out', clearProps: 'opacity,transform' },
    );
  }

  function render(animate = true) {
    root.dataset.state = state.level;
    $('[data-floor-title]')!.textContent = f(t.floorN, { n: state.floor });
    // rev 5: positions not confirmed on this floor (BL01 off floors 4, 6, 8, 10, 11) — in text, not only the hatch
    hotspots.forEach((h) => {
      const tbc = isTbc(h.dataset.unit ?? null);
      h.toggleAttribute('data-tbc', tbc);
      h.setAttribute('aria-label', tbc ? f(t.tbcAria, { code: h.dataset.unit ?? '', n: state.floor }) : (stdAria.get(h.dataset.unit) ?? ''));
    });
    chips.forEach((c) => c.toggleAttribute('data-tbc', isTbc(c.dataset.unit ?? null)));
    keyplanSvg?.setAttribute('aria-label', f(t.keyplanLabel, { n: state.floor, mix: mixOf(state.floor) }));
    renderView(animate);
    renderStepper();
    renderHotspots();
    renderUnit();
    renderCrumbs();
    model.select(state.level === 'idle' ? null : state.floor);
    model.preview(state.level === 'idle' ? null : state.floor);
  }

  /* ---------- transitions ---------- */

  const hashFor = (s: State) =>
    s.level === 'idle' ? '#explore' : `#explore/f${s.floor}${s.level === 'unit' && s.unit ? `/${s.unit.toLowerCase()}` : ''}`;

  function go(next: State, opts: { focus?: boolean; scroll?: boolean; animate?: boolean } = {}) {
    const changedLevel = next.level !== state.level;
    Object.assign(state, next);
    render(opts.animate !== false && changedLevel);
    const url = `${location.pathname}${location.search}${hashFor(state)}`;
    if (location.hash.startsWith('#explore') || state.level !== 'idle') history.replaceState(null, '', url);

    if (opts.scroll && window.innerWidth < 1024) scrollToTarget(panel);
    if (opts.focus && changedLevel) {
      const target =
        state.level === 'floor'
          ? $('[data-floor-title]')
          : state.level === 'unit'
            ? activeCard()?.querySelector<HTMLElement>('[data-unit-title]')
            : floorRows.find((r) => Number(r.dataset.floor) === state.floor);
      target?.focus({ preventScroll: true });
    }
  }

  const back = () => {
    if (state.level === 'unit') go({ ...state, level: 'floor', unit: null }, { focus: true });
    else if (state.level === 'floor') go({ level: 'idle', floor: state.floor, unit: null }, { focus: true });
  };

  const clampFloor = (n: number) => Math.min(FLOORS, Math.max(1, n));

  /* ---------- events ---------- */

  // floor list
  floorRows.forEach((row) => {
    const n = Number(row.dataset.floor);
    row.addEventListener('pointerenter', () => setPreview(n, true));
    row.addEventListener('pointerleave', () => setPreview(null, true));
    row.addEventListener('focus', () => setPreview(n, true));
    row.addEventListener('blur', () => setPreview(null, true));
    row.addEventListener('click', () => go({ level: 'floor', floor: n, unit: null }, { focus: true, scroll: true }));
  });

  // steppers (model column on mobile/tablet; panel on desktop)
  $$<HTMLButtonElement>('[data-step]').forEach((b) =>
    b.addEventListener('click', () => {
      const d = Number(b.dataset.step);
      if (state.level === 'idle') {
        previewFloor = clampFloor(previewFloor + d);
        model.preview(previewFloor);
        showTooltip(previewFloor);
        renderStepper();
      } else {
        go({ ...state, floor: clampFloor(state.floor + d) });
      }
    }),
  );
  $$('[data-view-floor]').forEach((b) =>
    b.addEventListener('click', () => {
      const n = state.level === 'idle' ? previewFloor : state.floor;
      go({ level: 'floor', floor: n, unit: null }, { focus: true, scroll: true });
    }),
  );

  // hotspots + chips
  const pickUnit = (code: Code, focus: boolean) => go({ level: 'unit', floor: state.floor, unit: code }, { focus, scroll: true });
  hotspots.forEach((h) => {
    const code = h.dataset.unit as Code;
    h.addEventListener('click', (e) => {
      e.preventDefault();
      pickUnit(code, e.detail === 0); // keyboard activation moves focus; pointer doesn't
    });
    const enter = () => {
      h.classList.add('is-preview');
      showPill(code, code === state.unit);
    };
    const leave = () => {
      h.classList.remove('is-preview');
      showPill(state.unit, true);
    };
    h.addEventListener('pointerenter', enter);
    h.addEventListener('pointerleave', leave);
    h.addEventListener('focus', enter);
    h.addEventListener('blur', leave);
  });
  chips.forEach((c) => {
    const code = c.dataset.unit as Code;
    c.addEventListener('click', () => pickUnit(code, true));
    c.addEventListener('pointerenter', () => hotspots.find((h) => h.dataset.unit === code)?.classList.add('is-preview'));
    c.addEventListener('pointerleave', () => hotspots.forEach((h) => h.classList.remove('is-preview')));
  });

  // unit prev/next on the same floor
  $$<HTMLButtonElement>('[data-unit-step]').forEach((b) =>
    b.addEventListener('click', () => {
      const i = CODES.indexOf(state.unit ?? 'BL01');
      const next = CODES[(i + Number(b.dataset.unitStep) + CODES.length) % CODES.length]!;
      go({ ...state, unit: next });
    }),
  );

  // TBC card: "See BL01 on floor m" (the nearest floor where it is confirmed)
  tbcCard?.querySelector<HTMLElement>('[data-see-confirmed]')?.addEventListener('click', (e) => {
    const b = e.currentTarget as HTMLElement;
    go({ level: 'unit', floor: Number(b.dataset.floor) || state.floor, unit: b.dataset.seeConfirmed as Code });
    // same level, so go() doesn't move focus: the TBC card just hid, land on the full card's title
    activeCard()?.querySelector<HTMLElement>('[data-unit-title]')?.focus({ preventScroll: true });
  });

  // back buttons + breadcrumb
  $$<HTMLButtonElement>('[data-back]').forEach((b) =>
    b.addEventListener('click', () => {
      const to = b.dataset.back as Level;
      go({ level: to, floor: state.floor, unit: null }, { focus: true });
    }),
  );
  $$<HTMLButtonElement>('[data-crumb]').forEach((b) =>
    b.addEventListener('click', () => go({ level: b.dataset.crumb as Level, floor: state.floor, unit: null }, { focus: true })),
  );

  // Esc steps back while the explorer is on screen (not while a dialog is open; dialogs own their Esc)
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || state.level === 'idle' || root.hasAttribute('data-offscreen')) return;
    if (document.querySelector('dialog[open]')) return;
    const active = document.activeElement;
    if (active && active !== document.body && !root.contains(active)) return;
    e.preventDefault();
    back();
  };
  document.addEventListener('keydown', onKey);

  // request pricing → prefill the enquiry form (DESIGN §5.8: ?unit=BL05&floor=7, hash-safe)
  $$<HTMLAnchorElement>('[data-request]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const unit = a.dataset.request ?? '';
      history.replaceState(null, '', `${location.pathname}?unit=${unit}&floor=${state.floor}#enquire`);
      window.dispatchEvent(new CustomEvent('enquiry:prefill', { detail: { unit, floor: state.floor } }));
      const form = document.querySelector('#enquire');
      if (form) scrollToTarget(form);
    }),
  );

  // plan image → plan viewer (M3 claims the event with preventDefault); fallback: the home card
  $$<HTMLButtonElement>('[data-open-plan]').forEach((b) =>
    b.addEventListener('click', () => {
      const ev = new CustomEvent('plan:open', { detail: { code: b.dataset.openPlan, opener: b }, cancelable: true });
      if (window.dispatchEvent(ev)) {
        const card = document.getElementById(`unit-${(b.dataset.openPlan ?? '').toLowerCase()}`);
        if (card) scrollToTarget(card);
      }
    }),
  );

  // hint chip fades after the first interaction anywhere in the explorer
  root.addEventListener('pointerdown', () => hint.setAttribute('data-done', ''), { once: true });

  // stop model work when offscreen
  const stopVis = onVisibility(root, (v) => root.toggleAttribute('data-offscreen', !v));

  /* ---------- init from the URL ---------- */

  const fromHash = (): State | null => {
    const m = /^#explore(?:\/f(\d{1,2})(?:\/(bl0[1-9]))?)?$/i.exec(location.hash);
    if (!m) return null;
    if (!m[1]) return { level: 'idle', floor: 1, unit: null };
    const floor = clampFloor(Number(m[1]));
    const unit = (m[2]?.toUpperCase() as Code | undefined) ?? null;
    return { level: unit ? 'unit' : 'floor', floor, unit };
  };

  root.dataset.ready = '';
  const initial = fromHash();
  if (initial) Object.assign(state, initial);
  render(false);
  window.addEventListener('hashchange', () => {
    const s = fromHash();
    if (s) go(s, { animate: true });
  });

  /* ---------- S10 intro (desktop, motion allowed) ---------- */

  // Every ScrollTrigger.refresh() re-parents the pinned grid in/out of its pin-spacer, which blurs anything
  // focused inside it (resize, browser zoom, fonts, scene mount). Save and restore focus around it (review M2).
  let savedFocus: HTMLElement | null = null;
  const saveFocus = () => {
    const a = document.activeElement as HTMLElement | null;
    savedFocus = a && root.contains(a) ? a : null;
  };
  const restoreFocus = () => {
    if (savedFocus?.isConnected && document.activeElement !== savedFocus) savedFocus.focus({ preventScroll: true });
    savedFocus = null;
  };
  ScrollTrigger.addEventListener('refreshInit', saveFocus);
  ScrollTrigger.addEventListener('refresh', restoreFocus);

  const mm = gsap.matchMedia();
  mm.add({ desktop: '(min-width: 1024px)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
    const { desktop, motion } = ctx.conditions as { desktop: boolean; motion: boolean };
    if (!motion) return;
    const modelCol = $('[data-model-col]');
    const grid = $('[data-explore-grid]')!;
    const headerH = document.querySelector<HTMLElement>('.site-header')?.offsetHeight ?? 72;
    // Pin only the model+panel grid, and only if it fits under the header (review M2-M1); else S10m.
    const fits = grid.offsetHeight <= window.innerHeight - headerH;
    if (desktop && state.level === 'idle' && fits) {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: grid, start: `top top+=${headerH}`, end: '+=60%', pin: true, scrub: 0.8, anticipatePin: 1 },
        defaults: { ease: 'none' },
        onUpdate: () => {
          introProgress = tl.progress();
          model.setIntro?.(introProgress);
        },
      });
      introProgress = tl.progress();
      // the panel only slides (no fade): visitors arriving via the nav land at progress 0 and must read it
      tl.fromTo(panel, { x: 40 }, { x: 0 }, 0).fromTo(
        svg,
        { scale: 0.94, y: 30, transformOrigin: '50% 100%' },
        { scale: 1, y: 0 },
        0,
      );
      ScrollTrigger.refresh();
    } else {
      gsap.from(modelCol, {
        opacity: 0,
        y: 40,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: root, start: 'top 75%', once: true },
      });
    }
  });

  return {
    /** "Find on a floor" from the homes gallery: current floor (default 1), unit highlighted + pulse. */
    find(code: string, opts: { focus?: boolean } = {}) {
      const c = code.toUpperCase() as Code;
      if (!CODES.includes(c)) return;
      // the floor view with the unit highlighted (selected) on the current floor, default floor 1;
      // a home not confirmed there (BL01) opens its first confirmed floor instead (rev 5: floor 4)
      const current = state.level === 'idle' ? 1 : state.floor;
      const floor = isTbc(c, current) ? (confirmedFloors(c)[0] ?? current) : current;
      go({ level: 'floor', floor, unit: c }, { focus: false });
      const h = hotspots.find((x) => x.dataset.unit === c);
      if (h && opts.focus) h.focus({ preventScroll: true });
      if (h && !prefersReducedMotion()) {
        h.classList.remove('is-pulse');
        void h.getBoundingClientRect();
        h.classList.add('is-pulse');
      }
    },
    destroy() {
      document.removeEventListener('keydown', onKey);
      ScrollTrigger.removeEventListener('refreshInit', saveFocus);
      ScrollTrigger.removeEventListener('refresh', restoreFocus);
      stopVis();
      mm.revert();
      model.destroy();
    },
  };
}
