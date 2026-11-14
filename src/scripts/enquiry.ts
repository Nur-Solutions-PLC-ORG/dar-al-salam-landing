/**
 * Enquiry form (DESIGN §5.8): validate, build the message, open the chosen channel. Never posts anywhere.
 * - WhatsApp: wa.me/{number}?text=…   - Email: mailto: with subject and body
 * - Telegram (rev 7): t.me/{user}?text=… prefills the draft; the text is also copied (older clients ignore `text`).
 *   window.open runs synchronously in the submit handler (an awaited copy first loses the user activation and
 *   Safari blocks the pop-up). Then a persistent "Finish in Telegram" panel, until the form is edited.
 * Prefill: ?unit=BL05&floor=7 on load, and `enquiry:prefill` events (focus moves to Name).
 */
import { toast } from './toast';

type Channel = 'whatsapp' | 'telegram' | 'email';

export function initEnquiry() {
  const form = document.querySelector<HTMLFormElement>('[data-enquiry]');
  if (!form) return;
  type MsgKey = 'hello' | 'intro' | 'phone' | 'home' | 'floor' | 'floorN' | 'message' | 'sign';
  const t = JSON.parse(form.dataset.i18n ?? '{}') as Record<string, string> & {
    channels: Record<Channel, string>;
    msg: Record<MsgKey, string>;
    units: Record<string, string>;
  };
  const cfg = JSON.parse(form.dataset.config ?? '{}') as Record<Channel, string>;
  const f = (s: string, v: Record<string, string | number>) =>
    s.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? '')).replace(/\s+/g, ' ').trim();
  const el = <T extends Element>(name: string) => form.elements.namedItem(name) as T | null;
  const name = el<HTMLInputElement>('name')!;
  const phone = el<HTMLInputElement>('phone')!;
  const unit = el<HTMLSelectElement>('unit')!;
  const floor = el<HTMLSelectElement>('floor')!;
  const message = el<HTMLTextAreaElement>('message')!;
  const summary = form.querySelector<HTMLElement>('[data-summary]')!;
  const status = form.querySelector<HTMLElement>('[data-status]')!;
  const dove = form.querySelector<SVGElement>('[data-dove]');

  // the server renders submit disabled; enable it only when a channel is configured
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]');
  if (submit) submit.disabled = !(cfg.whatsapp || cfg.telegram || cfg.email);

  /* ---------- rev 5: a home not confirmed on the chosen floor (BL01 off 4, 6, 8, 10, 11): a hint, never an error ---------- */
  const confirmed = JSON.parse(form.dataset.confirmed ?? '{}') as Record<string, number[]>;
  const hint = form.querySelector<HTMLElement>('[data-floor-hint]');
  const unitTbc = () => {
    const list = confirmed[unit.value];
    return Boolean(list && floor.value && !list.includes(Number(floor.value)));
  };
  const updateHint = () => {
    if (!hint) return;
    const on = unitTbc();
    hint.hidden = !on;
    hint.textContent = on ? f(t.tbcHint ?? '', { code: unit.value, n: floor.value }) : '';
    if (on) floor.setAttribute('aria-describedby', hint.id);
    else floor.removeAttribute('aria-describedby');
  };
  unit.addEventListener('change', updateHint);
  floor.addEventListener('change', updateHint);

  /* ---------- prefill ---------- */
  const prefill = (u?: string | null, fl?: string | number | null, focus = false) => {
    if (u && [...unit.options].some((o) => o.value === u.toUpperCase())) unit.value = u.toUpperCase();
    if (fl && [...floor.options].some((o) => o.value === String(fl))) floor.value = String(fl);
    updateHint();
    if (focus) name.focus({ preventScroll: true });
  };
  const q = new URLSearchParams(location.search);
  prefill(q.get('unit'), q.get('floor'));
  window.addEventListener('enquiry:prefill', (e) => {
    const d = (e as CustomEvent<{ unit?: string; floor?: number }>).detail ?? {};
    prefill(d.unit, d.floor, true);
  });

  /* ---------- validation ---------- */
  const setError = (input: HTMLInputElement, msg: string) => {
    const err = form.querySelector<HTMLElement>(`#${input.id}-err`);
    input.setAttribute('aria-invalid', String(Boolean(msg)));
    if (err) {
      err.textContent = msg;
      err.hidden = !msg;
    }
  };
  const validate = () => {
    const errs: HTMLInputElement[] = [];
    const nameOk = name.value.trim().length > 0;
    const phoneOk = phone.value.replace(/\D/g, '').length >= 9; // lenient: ≥ 9 digits
    setError(name, nameOk ? '' : t.errName ?? '');
    setError(phone, phoneOk ? '' : t.errPhone ?? '');
    if (!nameOk) errs.push(name);
    if (!phoneOk) errs.push(phone);
    return errs;
  };
  [name, phone].forEach((i) =>
    i.addEventListener('blur', () => {
      if (i.getAttribute('aria-invalid') === 'true') validate();
    }),
  );

  /* ---------- Telegram finish panel (rev 7) ---------- */
  const done = form.querySelector<HTMLElement>('[data-tg-done]');
  const again = done?.querySelector<HTMLAnchorElement>('[data-tg-again]');
  const copyBtn = done?.querySelector<HTMLButtonElement>('[data-tg-copy]');
  const fallback = done?.querySelector<HTMLElement>('[data-tg-fallback]');
  const fallbackText = done?.querySelector<HTMLTextAreaElement>('[data-tg-text]');
  const copyLabel = copyBtn?.textContent?.trim() ?? '';
  let lastText = '';
  let copyTimer = 0;

  /** "@user" as an ltr, untranslated span, inside a translated sentence. */
  const withHandle = (s: string, user: string) => {
    const [before = '', after = ''] = s.split('{handle}');
    const h = document.createElement('span');
    h.dir = 'ltr';
    h.lang = 'en';
    h.translate = false;
    h.textContent = `@${user}`;
    return [before, h, after];
  };
  const showFallback = () => {
    if (!fallback || !fallbackText) return;
    fallback.hidden = false;
    fallbackText.value = lastText;
    fallbackText.style.height = 'auto';
    fallbackText.style.height = `${fallbackText.scrollHeight + 2}px`;
  };
  const showDone = (copied: boolean) => {
    if (!done) return;
    const title = document.createElement('strong');
    title.textContent = t.tgDoneTitle ?? '';
    status.replaceChildren(title, ' ', ...withHandle(t.tgDoneBody ?? '', cfg.telegram));
    done.hidden = false;
    if (fallback) fallback.hidden = true;
    if (!copied) showFallback();
  };
  const hideDone = () => {
    if (!done || done.hidden) return;
    done.hidden = true;
    status.textContent = '';
  };
  form.addEventListener('input', (e) => e.target !== fallbackText && hideDone());
  form.addEventListener('change', (e) => e.target !== fallbackText && hideDone());
  copyBtn?.addEventListener('click', () => {
    const p = navigator.clipboard?.writeText(lastText);
    if (!p) return showFallback();
    p.then(
      () => {
        copyBtn.textContent = t.copiedShort ?? '';
        clearTimeout(copyTimer);
        copyTimer = window.setTimeout(() => (copyBtn.textContent = copyLabel), 2000);
      },
      showFallback,
    );
  });

  /* ---------- the message (rev 8.5, R2): one line per field; a line whose field is empty is skipped ---------- */
  /**
   * The visitor's own line breaks survive (review r7 nit 1): the first line follows "💬 Message:", later ones are
   * indented under it; spaces inside a line are tidied and blank lines dropped.
   */
  const messageLines = (msg: string, label: string): string[] => {
    const lines = msg
      .split(/\r?\n/)
      .map((l) => l.replace(/[ \t]+/g, ' ').trim())
      .filter(Boolean);
    if (!lines.length) return [];
    return [f(label, { message: lines[0]! }), ...lines.slice(1).map((l) => `   ${l}`)];
  };
  /** `f` collapses whitespace, which keeps every other user value on its own line. */
  const compose = (msg: string) => {
    const m = t.msg;
    const home = unit.value ? (unitTbc() ? f(t.unitTbc ?? '', { code: unit.value }) : (t.units[unit.value] ?? unit.value)) : '';
    const lines: (string | null)[] = [
      m.hello,
      f(m.intro, { name: name.value.trim() }),
      '',
      f(m.phone, { phone: phone.value.trim() }),
      home ? f(m.home, { unit: home }) : null,
      floor.value ? f(m.floor, { floor: f(m.floorN, { n: floor.value }) }) : null,
      ...messageLines(msg, m.message),
      '',
      m.sign,
    ];
    return lines.filter((l): l is string => l !== null).join('\n');
  };
  /**
   * t.me/{user}?text=… kept under ~2,000 characters: if longer, only the message field is shortened (with "…") in
   * the URL; the copied text stays complete.
   */
  const MAX_URL = 2000;
  const telegramUrl = (full: string) => {
    const url = (s: string) => `https://t.me/${cfg.telegram}?text=${encodeURIComponent(s)}`;
    if (url(full).length <= MAX_URL) return url(full);
    const msg = message.value.trim();
    let lo = 0;
    let hi = msg.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (url(compose(`${msg.slice(0, mid).trimEnd()}…`)).length <= MAX_URL) lo = mid;
      else hi = mid - 1;
    }
    return url(compose(lo ? `${msg.slice(0, lo).trimEnd()}…` : ''));
  };

  /* ---------- submit ---------- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const errs = validate();
    if (errs.length) {
      summary.textContent = t.summary ?? '';
      errs[0]!.focus();
      return;
    }
    summary.textContent = '';
    // a radio group with 2+ channels; a hidden input with exactly one
    const picked = form.elements.namedItem('channel') as RadioNodeList | HTMLInputElement | null;
    const channel = (picked?.value ?? '') as Channel;
    if (!channel || !cfg[channel]) return;

    const text = compose(message.value.trim());

    status.textContent = f(t.opening ?? '', { channel: t.channels[channel] });
    if (dove) {
      dove.removeAttribute('data-fly');
      void dove.getBoundingClientRect();
      dove.setAttribute('data-fly', '');
    }

    if (channel === 'whatsapp') {
      window.open(`https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    } else if (channel === 'telegram') {
      // both synchronously, in this order, with no await before window.open (user activation)
      let copy: Promise<void>;
      try {
        copy = navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject(new Error('no clipboard'));
      } catch (err) {
        copy = Promise.reject(err);
      }
      const url = telegramUrl(text);
      window.open(url, '_blank', 'noopener');
      lastText = text;
      if (again) again.href = url;
      copy.then(
        () => {
          toast(t.copied ?? '');
          showDone(true);
        },
        () => showDone(false),
      );
    } else {
      const params = new URLSearchParams({ subject: t.subject ?? '', body: text }).toString().replace(/\+/g, '%20');
      window.location.href = `mailto:${cfg.email}?${params}`;
    }
  });
}
