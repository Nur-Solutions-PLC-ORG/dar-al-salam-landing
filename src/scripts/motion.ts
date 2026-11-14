/**
 * Global motion (DESIGN §7, §8). One gsap.matchMedia() so every scene sets up once and reverts cleanly
 * when the reduced-motion setting or breakpoint changes.
 *
 * Safety (DESIGN §7.1): CSS default = final state. Initial "from" states are applied only here, at init,
 * to elements that are below the fold; the hero entrance is pure CSS (amendment 5). html.motion-ready marks
 * a successful init (the inline head script drops html.js after 2.5 s otherwise).
 *
 * Markup hooks:
 *   [data-eyebrow]           S4 rule draws, label slides in
 *   [data-split]             S5 SplitText lines reveal (H2s below the fold only)
 *   [data-reveal]            S6 fade + rise; [data-reveal="stagger"] staggers children
 *   [data-count]             S2 count-up ("14", or "158,171" for a range)
 *   [data-facts-rule]        S3 hairline draw
 *   [data-hero-*]            S1 hero scrub
 *   [data-story-arch]        S7/S8 arch clip + parallax
 *   [data-dusk-veil]         S9 ivory → navy veil into #explore
 *   [data-magnetic]          §6 magnetic buttons (fine pointers)
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);
ScrollTrigger.config({ ignoreMobileResize: true });

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

let lenis: Lenis | null = null;

export const getLenis = () => lenis;
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
  window.scrollTo({ top: y, behavior: reducedQuery.matches || opts.immediate ? 'auto' : 'smooth' });
}

/* ---------- Lenis ---------- */

function startLenis() {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
  lenis.on('scroll', ScrollTrigger.update);
  const raf = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(raf);
    lenis?.destroy();
    lenis = null;
  };
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

/* ---------- One-shot reveals (IntersectionObserver, not ScrollTrigger: no refresh/layout cost) ---------- */

type Reveal = { el: Element; hide: () => void; play: () => void };

/**
 * Elements below the fold get their hidden "from" state up front (one batched layout read), then play
 * when they cross 85 % of the viewport. Elements already on screen at init are left alone (no flash).
 */
function revealOnce(items: Reveal[], cleanups: (() => void)[]) {
  if (!items.length) return;
  const vh = window.innerHeight;
  const tops = items.map((r) => r.el.getBoundingClientRect().top); // reads first…
  const pending = new Map<Element, Reveal>();
  items.forEach((r, i) => {
    if ((tops[i] ?? 0) > vh * 0.85) {
      r.hide(); // …then writes
      pending.set(r.el, r);
    }
  });
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        pending.get(e.target)?.play();
        pending.delete(e.target);
      }
    },
    { rootMargin: '0px 0px -15% 0px' },
  );
  pending.forEach((_, el) => io.observe(el));
  cleanups.push(() => io.disconnect());
}

function eyebrowReveals(): Reveal[] {
  return gsap.utils.toArray<HTMLElement>('[data-eyebrow]').flatMap((el) => {
    if (el.closest('#top')) return [];
    const rule = el.querySelector('.eyebrow__rule');
    const label = el.querySelectorAll(':scope > span:not(.eyebrow__rule)');
    return [
      {
        el,
        hide: () => {
          if (rule) gsap.set(rule, { scaleX: 0 });
          gsap.set(label, { autoAlpha: 0, x: -8 });
        },
        play: () => {
          if (rule) gsap.to(rule, { scaleX: 1, duration: 0.7, ease: 'power3.out' });
          gsap.to(label, { autoAlpha: 1, x: 0, duration: 0.7, ease: 'power3.out', stagger: 0.06, delay: 0.1 });
        },
      },
    ];
  });
}

/** S5: SplitText only for H2s below the fold, split at reveal time (no work for headings never reached). */
function headingReveals(): Reveal[] {
  return gsap.utils.toArray<HTMLElement>('[data-split]').map((el) => ({
    el,
    hide: () => gsap.set(el, { autoAlpha: 0 }),
    play: () => {
      gsap.set(el, { autoAlpha: 1 });
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        // lines keep whole words, so the text reads normally; no aria-label on non-heading elements
        aria: 'none',
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 110,
            duration: 1,
            ease: 'expo.out',
            stagger: 0.08,
            // revert to the original markup afterwards (no stale line wrappers on resize)
            onComplete: () => self.revert(),
          }),
      });
    },
  }));
}

function blockReveals(): Reveal[] {
  return gsap.utils.toArray<HTMLElement>('[data-reveal]').map((el) => {
    const targets = el.dataset.reveal === 'stagger' ? Array.from(el.children) : [el];
    return {
      el,
      hide: () => gsap.set(targets, { autoAlpha: 0, y: 24 }),
      play: () => gsap.to(targets, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 }),
    };
  });
}

/** S2/S3: count-up (text is pre-rendered final; widths fixed so nothing reflows) + hairlines. */
function factsReveal(): Reveal[] {
  const section = document.querySelector<HTMLElement>('#facts');
  if (!section) return [];
  const counters = gsap.utils.toArray<HTMLElement>('[data-count]', section);
  const rules = gsap.utils.toArray<HTMLElement>('[data-facts-rule]', section);
  return [
    {
      el: section,
      hide: () => {
        const widths = counters.map((el) => el.getBoundingClientRect().width);
        counters.forEach((el, i) => {
          el.style.display = 'inline-block';
          el.style.minWidth = `${widths[i]}px`;
          el.dataset.final = el.textContent ?? '';
          el.textContent = (el.dataset.count ?? '').split(',').map(() => '0').join('–');
        });
        gsap.set(rules, { scaleX: 0 });
      },
      play: () => {
        counters.forEach((el, i) => {
          const ends = (el.dataset.count ?? '').split(',').map(Number);
          const state = ends.map(() => 0);
          gsap.to(state, {
            ...Object.fromEntries(ends.map((v, k) => [k, v])),
            duration: 1.4,
            ease: 'power2.out',
            delay: i * 0.12,
            onUpdate: () => (el.textContent = state.map((v) => Math.round(v)).join('–')),
            onComplete: () => (el.textContent = el.dataset.final ?? el.textContent),
          });
        });
        gsap.to(rules, { scaleX: 1, duration: 1, ease: 'power3.inOut', stagger: 0.12 });
      },
    },
  ];
}

/* ---------- Scrubbed scenes (ScrollTrigger) ---------- */

function heroScrub(desktop: boolean) {
  const hero = document.querySelector('#top');
  if (!hero) return;
  const st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
  const media = hero.querySelector('[data-hero-media]');
  if (desktop) {
    const tl = gsap.timeline({ scrollTrigger: st, defaults: { ease: 'none' } });
    tl.to('[data-hero-arch]', { scale: 1.12, transformOrigin: '50% 0%' }, 0)
      .to(media, { yPercent: 8 }, 0)
      .to('[data-hero-copy]', { y: -80, opacity: 0.2 }, 0);
  } else if (media) {
    gsap.to(media, { yPercent: 10, ease: 'none', scrollTrigger: st });
  }
}

function storyArch() {
  for (const arch of gsap.utils.toArray<HTMLElement>('[data-story-arch]')) {
    const clip = arch.querySelector('.arch__clip');
    const img = arch.querySelector('img');
    const par = arch.querySelector('[data-parallax-media]');
    gsap
      .timeline({ scrollTrigger: { trigger: arch, start: 'top 85%', end: 'top 35%', scrub: 0.6 }, defaults: { ease: 'none' } })
      .fromTo(clip, { clipPath: 'inset(18% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }, 0)
      .fromTo(img, { scale: 1.2 }, { scale: 1 }, 0);
    if (par)
      gsap.fromTo(
        par,
        { yPercent: -6 },
        { yPercent: 6, ease: 'none', scrollTrigger: { trigger: arch, start: 'top bottom', end: 'bottom top', scrub: true } },
      );
  }
}

function duskVeil() {
  const veil = document.querySelector<HTMLElement>('[data-dusk-veil]');
  const explore = document.querySelector('#explore');
  if (!veil || !explore) return;
  gsap.set(veil, { visibility: 'visible' });
  gsap.fromTo(
    veil,
    { opacity: 0 },
    { opacity: 1, ease: 'none', scrollTrigger: { trigger: explore, start: 'top 90%', end: 'top 30%', scrub: true } },
  );
  // once the section's own navy fills the viewport, the veil resets
  ScrollTrigger.create({
    trigger: explore,
    start: 'top top',
    onEnter: () => gsap.set(veil, { visibility: 'hidden' }),
    onLeaveBack: () => gsap.set(veil, { visibility: 'visible' }),
  });
}

function magnetic() {
  const cleanups: (() => void)[] = [];
  for (const el of gsap.utils.toArray<HTMLElement>('[data-magnetic]')) {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    const pad = 24;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const inside =
        e.clientX > r.left - pad && e.clientX < r.right + pad && e.clientY > r.top - pad && e.clientY < r.bottom + pad;
      if (!inside) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      xTo(gsap.utils.clamp(-8, 8, dx * 0.25));
      yTo(gsap.utils.clamp(-8, 8, dy * 0.35));
    };
    const leave = () => gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.45)' });
    const parent = el.parentElement ?? el;
    parent.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    cleanups.push(() => {
      parent.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      gsap.set(el, { clearProps: 'transform' });
    });
  }
  return () => cleanups.forEach((c) => c());
}

/* ---------- Init ---------- */

/** Run tasks in separate idle slices so no single long task blocks input. */
function idleQueue(tasks: (() => void)[]) {
  const ric: (cb: () => void) => void =
    'requestIdleCallback' in window
      ? (cb) => window.requestIdleCallback(cb, { timeout: 1200 })
      : (cb) => window.setTimeout(cb, 16);
  const next = () => {
    const task = tasks.shift();
    if (!task) return;
    task();
    ric(next);
  };
  ric(next);
}

let started = false;

export function initMotion() {
  if (started) return;
  started = true;
  const root = document.documentElement;

  const mm = gsap.matchMedia();
  mm.add(
    {
      motion: '(prefers-reduced-motion: no-preference)',
      desktop: '(min-width: 1024px)',
      fine: '(hover: hover) and (pointer: fine)',
    },
    (ctx) => {
      const { motion, desktop, fine } = ctx.conditions as { motion: boolean; desktop: boolean; fine: boolean };
      if (!motion) return; // DESIGN §8: static page, native scroll, final values shown.

      const cleanups: (() => void)[] = [startLenis()];
      let alive = true;
      const guard = (fn: () => void) => () => alive && ctx.add(fn);

      idleQueue([
        guard(() => heroScrub(desktop)),
        guard(() => revealOnce([...factsReveal(), ...eyebrowReveals()], cleanups)),
        guard(() => revealOnce([...headingReveals(), ...blockReveals()], cleanups)),
        guard(() => {
          storyArch();
          duskVeil();
        }),
        guard(() => {
          if (fine) cleanups.push(magnetic());
        }),
        // fonts change line heights → scrubbed trigger positions; one refresh after everything is set up
        guard(() => void document.fonts?.ready.then(() => alive && ScrollTrigger.refresh())),
      ]);

      return () => {
        alive = false;
        cleanups.forEach((c) => c());
      };
    },
  );

  root.classList.add('js', 'motion-ready');
}

export { gsap, ScrollTrigger };
