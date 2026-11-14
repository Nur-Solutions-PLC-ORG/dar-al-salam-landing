/**
 * Enquiry form (DESIGN §5.8): validate, build the message, open the chosen channel. Never posts anywhere.
 * - WhatsApp: wa.me/{number}?text=…   - Telegram: t.me/{username} + the text copied to the clipboard + toast
 * - Email: mailto: with subject and body
 * Prefill: ?unit=BL05&floor=7 on load, and `enquiry:prefill` events (focus moves to Name).
 */
import { toast } from './toast';

type Channel = 'whatsapp' | 'telegram' | 'email';

export function initEnquiry() {
  const form = document.querySelector<HTMLFormElement>('[data-enquiry]');
  if (!form) return;
  const t = JSON.parse(form.dataset.i18n ?? '{}') as Record<string, string> & { channels: Record<Channel, string> };
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

  /* ---------- prefill ---------- */
  const prefill = (u?: string | null, fl?: string | number | null, focus = false) => {
    if (u && [...unit.options].some((o) => o.value === u.toUpperCase())) unit.value = u.toUpperCase();
    if (fl && [...floor.options].some((o) => o.value === String(fl))) floor.value = String(fl);
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

  /* ---------- submit ---------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errs = validate();
    if (errs.length) {
      summary.textContent = t.summary ?? '';
      errs[0]!.focus();
      return;
    }
    summary.textContent = '';
    const channel = (form.querySelector<HTMLInputElement>('input[name="channel"]:checked')?.value ?? '') as Channel;
    if (!channel || !cfg[channel]) return;

    const text = f(t.template ?? '', {
      name: name.value.trim(),
      phone: phone.value.trim(),
      unit: unit.value ? unit.selectedOptions[0]!.textContent!.trim() : (t.anyUnit ?? ''),
      floor: floor.value ? f(t.floorN ?? '', { n: floor.value }) : (t.anyFloor ?? ''),
      message: message.value.trim(),
    });

    status.textContent = f(t.opening ?? '', { channel: t.channels[channel] });
    if (dove) {
      dove.removeAttribute('data-fly');
      void dove.getBoundingClientRect();
      dove.setAttribute('data-fly', '');
    }

    if (channel === 'whatsapp') {
      window.open(`https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    } else if (channel === 'telegram') {
      try {
        await navigator.clipboard.writeText(text);
        toast(t.copied ?? '');
      } catch {
        /* clipboard blocked: the user can still type the message */
      }
      window.open(`https://t.me/${cfg.telegram}`, '_blank', 'noopener');
    } else {
      const params = new URLSearchParams({ subject: t.subject ?? '', body: text }).toString().replace(/\+/g, '%20');
      window.location.href = `mailto:${cfg.email}?${params}`;
    }
  });
}
