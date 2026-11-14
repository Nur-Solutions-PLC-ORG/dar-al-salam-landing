/**
 * Tiny, GSAP-free motion API in the initial bundle (review H1b): scroll helpers and in-page anchor handling
 * that work before (or without) motion.ts, which is loaded after `load` + idle. motion.ts registers Lenis here.
 */
import type Lenis from 'lenis';

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

let lenis: Lenis | null = null;

export const getLenis = () => lenis;
export const setLenis = (l: Lenis | null) => {
  lenis = l;
};
export const prefersReducedMotion = () => reducedQuery.matches;

const headerOffset = () => document.querySelector<HTMLElement>('.site-header')?.offsetHeight ?? 64;

/** Scroll to an element, honouring Lenis, the header height and reduced motion. */
export function scrollToTarget(target: Element, opts: { offset?: number; immediate?: boolean } = {}) {
  const offset = -(opts.offset ?? headerOffset());
  if (lenis) {
    lenis.scrollTo(target as HTMLElement, { offset, duration: 1.2, immediate: opts.immediate });
    return;
  }
  const y = target.getBoundingClientRect().top + window.scrollY + offset;
  // 'instant', not 'auto': 'auto' inherits the CSS scroll-behavior: smooth
  window.scrollTo({ top: y, behavior: reducedQuery.matches || opts.immediate ? 'instant' : 'smooth' });
}

// In-page anchors: offset by the header, smooth via Lenis when available. Components that own their
// links (explorer hotspots, menu) call preventDefault first and are left alone.
document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
  if (!a || a.hasAttribute('data-no-scroll')) return;
  const hash = a.getAttribute('href') ?? '';
  if (hash.length < 2) return;
  const target = document.getElementById(decodeURIComponent(hash.slice(1)));
  if (!target) return;
  e.preventDefault();
  scrollToTarget(target);
  history.pushState(null, '', hash);
  // move focus for keyboard and screen-reader users without a second scroll
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
});
