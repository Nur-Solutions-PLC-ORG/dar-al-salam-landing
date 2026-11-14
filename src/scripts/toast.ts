/** Toast (DESIGN §6): bottom-centre navy pill, role="status", auto-dismiss after 4 s. */
let el: HTMLElement | null = null;
let timer = 0;

export function toast(message: string) {
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.append(el);
  }
  el.textContent = message;
  el.dataset.show = '';
  clearTimeout(timer);
  timer = window.setTimeout(() => el && delete el.dataset.show, 4000);
}
