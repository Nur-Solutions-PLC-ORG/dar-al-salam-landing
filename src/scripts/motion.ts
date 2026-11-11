/**
 * Global motion: Lenis smooth scroll driven by GSAP's ticker, plus ScrollTrigger reveals.
 *
 * Rules (CLAUDE.md quality bar):
 * - Content is never hidden by CSS. Initial "from" states are applied by JS only, so no-JS
 *   (or a failed script) shows everything.
 * - prefers-reduced-motion: no Lenis, no reveals/parallax; native scrolling and static layout.
 * - Animate only transform / opacity / clip-path.
 *
 * Markup hooks:
 *   [data-reveal]               fade + rise when entering the viewport
 *   [data-reveal="stagger"]     reveal direct children one after another
 *   [data-parallax="0.15"]      vertical drift (fraction of element height) while scrolling past
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

let lenis: Lenis | null = null;

export const getLenis = () => lenis;
export const prefersReducedMotion = () => reducedQuery.matches;

function initLenis() {
  lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    anchors: { offset: 0 },
    // Touch devices keep native momentum scrolling (better on low-end phones).
    syncTouch: false,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function initReveals() {
  const items = gsap.utils.toArray<HTMLElement>('[data-reveal]');
  for (const el of items) {
    const targets = el.dataset.reveal === 'stagger' ? Array.from(el.children) : [el];
    gsap.from(targets, {
      autoAlpha: 0,
      y: 28,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.08,
      clearProps: 'transform,opacity,visibility',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  }
}

function initParallax() {
  const items = gsap.utils.toArray<HTMLElement>('[data-parallax]');
  for (const el of items) {
    const amount = Number.parseFloat(el.dataset.parallax ?? '0.12') || 0.12;
    gsap.fromTo(
      el,
      { yPercent: -amount * 50 },
      {
        yPercent: amount * 50,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  }
}

let started = false;

export function initMotion() {
  if (started) return;
  started = true;
  document.documentElement.classList.add('js-motion');

  if (reducedQuery.matches) return;

  initLenis();
  initReveals();
  initParallax();

  // Late-loading images/fonts change layout; recalc trigger positions once settled.
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  void document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

// If the user turns on reduced motion mid-session, stop smoothing and settle everything.
reducedQuery.addEventListener('change', (e) => {
  if (!e.matches) return;
  lenis?.destroy();
  lenis = null;
  ScrollTrigger.getAll().forEach((t) => t.kill(true));
  gsap.globalTimeline.progress(1);
  gsap.set('[data-reveal], [data-reveal] > *, [data-parallax]', { clearProps: 'all' });
});

export { gsap, ScrollTrigger };
