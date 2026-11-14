/**
 * Homes gallery (DESIGN §5.5): filters (radiogroup, roving tabindex), sort by size, mobile carousel progress,
 * plan viewer hookup. GSAP Flip and the viewer are imported on first use, so the initial cost is ~1 KB.
 */
import { prefersReducedMotion } from './motion-api';

export function initHomes() {
  const root = document.querySelector<HTMLElement>('[data-homes]');
  const list = root?.querySelector<HTMLElement>('[data-cards]');
  if (!root || !list) return;
  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-card]'));
  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-filter]'));
  const sortBtn = root.querySelector<HTMLButtonElement>('[data-sort]');
  let filter = 'all';
  let sorted = false;

  const shows = (c: HTMLElement) => filter === 'all' || c.dataset.beds === filter;
  const ordered = () =>
    [...cards].sort((a, b) =>
      sorted
        ? Number(a.dataset.gross) - Number(b.dataset.gross) || Number(a.dataset.index) - Number(b.dataset.index)
        : Number(a.dataset.index) - Number(b.dataset.index),
    );

  const commit = () => {
    ordered().forEach((c) => list.append(c));
    cards.forEach((c) => c.classList.toggle('is-out', !shows(c)));
    list.scrollLeft = 0;
    updateProgress();
  };

  async function apply() {
    if (prefersReducedMotion()) return commit();
    const [{ gsap }, { Flip }] = await Promise.all([import('gsap'), import('gsap/Flip')]);
    gsap.registerPlugin(Flip);
    const state = Flip.getState(cards);
    commit();
    Flip.from(state, {
      duration: 0.6,
      ease: 'power3.inOut',
      absolute: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.96, duration: 0.25 }),
    });
  }

  // radiogroup: click / arrows (roving tabindex)
  const select = (chip: HTMLButtonElement, focus = false) => {
    chips.forEach((c) => {
      const on = c === chip;
      c.setAttribute('aria-checked', String(on));
      c.tabIndex = on ? 0 : -1;
    });
    if (focus) chip.focus();
    if (filter === chip.dataset.filter) return;
    filter = chip.dataset.filter ?? 'all';
    void apply();
  };
  chips.forEach((chip, i) => {
    chip.addEventListener('click', () => select(chip));
    chip.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      select(chips[(i + d + chips.length) % chips.length]!, true);
    });
  });

  sortBtn?.addEventListener('click', () => {
    sorted = !sorted;
    sortBtn.setAttribute('aria-pressed', String(sorted));
    void apply();
  });

  // carousel progress hairline (< 640 px)
  const bar = root.querySelector<HTMLElement>('[data-cards-progress]');
  function updateProgress() {
    if (!bar) return;
    const max = list!.scrollWidth - list!.clientWidth;
    const p = max > 0 ? (list!.scrollLeft + list!.clientWidth) / list!.scrollWidth : 1;
    bar.style.setProperty('--p', p.toFixed(3));
  }
  list.addEventListener('scroll', () => requestAnimationFrame(updateProgress), { passive: true });
  updateProgress();

  // plan viewer: gallery links + the explorer's cancelable `plan:open`
  const visibleCodes = () => Array.from(list.querySelectorAll<HTMLElement>('[data-card]:not(.is-out)')).map((c) => c.dataset.code!);
  const open = (code: string, opener: HTMLElement | null) => {
    const codes = visibleCodes().includes(code) ? visibleCodes() : cards.map((c) => c.dataset.code!);
    void import('./viewer').then((m) => m.openViewer(code, codes, opener));
  };
  root.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLElement>('a[data-open-plan]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    open(a.dataset.openPlan!, a);
  });
  window.addEventListener('plan:open', (e) => {
    const { code, opener } = (e as CustomEvent<{ code: string; opener: HTMLElement }>).detail;
    e.preventDefault();
    open(code, opener);
  });
}
