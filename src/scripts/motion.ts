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
 *   [data-magnetic]          §6 magnetic buttons (fine pointers)
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { setLenis } from './motion-api';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

let lenis: Lenis | null = null;

export { getLenis, prefersReducedMotion, scrollToTarget } from './motion-api';

/* ---------- Lenis ---------- */

function startLenis() {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
  setLenis(lenis);
  lenis.on('scroll', ScrollTrigger.update);
  const raf = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(raf);
    lenis?.destroy();
    lenis = null;
    setLenis(null);
  };
}

/* ---------- One-shot reveals (IntersectionObserver, not ScrollTrigger: no refresh/layout cost) ---------- */

type Reveal = { el: Element; hide: () => void; play: (delay: number) => unknown };

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
      // elements entering together (a row of cards) stagger by 0.08 s, like ScrollTrigger.batch (S11)
      let n = 0;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        void pending.get(e.target)?.play(Math.min(n++, 3) * 0.08);
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
          gsap.set(label, { opacity: 0, x: -8 });
        },
        play: () => {
          if (rule) gsap.to(rule, { scaleX: 1, duration: 0.7, ease: 'power3.out' });
          gsap.to(label, { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out', stagger: 0.06, delay: 0.1 });
        },
      },
    ];
  });
}

/** S5: SplitText only for H2s below the fold, split at reveal time (no work for headings never reached). */
function headingReveals(): Reveal[] {
  return gsap.utils.toArray<HTMLElement>('[data-split]').map((el) => ({
    el,
    hide: () => gsap.set(el, { opacity: 0 }),
    play: async () => {
      // SplitText is only needed below the fold: its own chunk, fetched on first use (DESIGN §10)
      const { SplitText } = await import('gsap/SplitText');
      gsap.registerPlugin(SplitText);
      gsap.set(el, { opacity: 1 });
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
      hide: () => gsap.set(targets, { opacity: 0, y: 24 }),
      play: () => gsap.to(targets, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 }),
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


/** S11/S12: home cards rise in batches; the plan inside settles from 1.1. */
function cardReveals(): Reveal[] {
  return gsap.utils.toArray<HTMLElement>('[data-card]').map((el) => {
    const img = el.querySelector('img');
    return {
      el,
      hide: () => {
        gsap.set(el, { opacity: 0, y: 40 });
        if (img) gsap.set(img, { scale: 1.1 });
      },
      play: (delay) => {
        gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay, clearProps: 'transform' });
        if (img) gsap.to(img, { scale: 1, duration: 1.2, ease: 'expo.out', delay, clearProps: 'transform' });
      },
    };
  });
}

/** S13: roads draw (clip-path), pins pop, labels fade. */
function mapReveal(): Reveal[] {
  const map = document.querySelector<HTMLElement>('[data-map]');
  if (!map) return [];
  const roads = map.querySelector('[data-map-roads]');
  const pins = map.querySelectorAll('[data-map-pin]');
  const labels = map.querySelectorAll('[data-map-label]');
  return [
    {
      el: map,
      hide: () => {
        gsap.set(roads, { clipPath: 'inset(0% 100% 0% 0%)' });
        gsap.set(pins, { scale: 0, transformOrigin: '50% 50%' });
        gsap.set(labels, { opacity: 0 });
      },
      play: () => {
        gsap
          .timeline()
          .to(roads, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power2.inOut' })
          .to(pins, { scale: 1, duration: 0.5, ease: 'back.out(2)', stagger: 0.1 }, '-=0.4')
          .to(labels, { opacity: 1, duration: 0.5, stagger: 0.06 }, '-=0.2');
      },
    },
  ];
}

/** S15: pillar icons draw left → right (clip-path), text follows. */
function pillarReveals(): Reveal[] {
  const grid = document.querySelector<HTMLElement>('[data-pillars]');
  if (!grid) return [];
  const items = Array.from(grid.children) as HTMLElement[];
  return [
    {
      el: grid,
      hide: () =>
        items.forEach((it) => {
          gsap.set(it.querySelector('svg'), { clipPath: 'inset(0% 100% 0% 0%)' });
          gsap.set(it.querySelectorAll(':scope > :not(svg)'), { opacity: 0, y: 12 });
        }),
      play: () =>
        items.forEach((it, i) => {
          gsap.to(it.querySelector('svg'), { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'power3.out', delay: i * 0.12 });
          gsap.to(it.querySelectorAll(':scope > :not(svg)'), {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            delay: i * 0.12 + 0.15,
            stagger: 0.06,
          });
        }),
    },
  ];
}

/** S18: form fields rise in sequence. */
function formReveal(): Reveal[] {
  const form = document.querySelector<HTMLElement>('[data-enquiry]');
  if (!form) return [];
  const fields = Array.from(form.children).filter((c) => !(c as HTMLElement).matches('[data-summary], noscript'));
  return [
    {
      el: form,
      hide: () => gsap.set(fields, { opacity: 0, y: 16 }),
      play: () => gsap.to(fields, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.05, clearProps: 'transform' }),
    },
  ];
}

/** S16: the payment timeline line draws with scroll; each step dot fills as the line passes it. */
function paymentTimeline(desktopish: boolean) {
  const wrap = document.querySelector<HTMLElement>('[data-steps]');
  if (!wrap) return;
  const line = wrap.querySelector('[data-steps-line]');
  const dots = gsap.utils.toArray<HTMLElement>('[data-step-dot] > span', wrap);
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: wrap, start: 'top 75%', end: 'bottom 55%', scrub: true },
  });
  tl.fromTo(line, desktopish ? { scaleX: 0 } : { scaleY: 0 }, desktopish ? { scaleX: 1, duration: 1 } : { scaleY: 1, duration: 1 }, 0);
  dots.forEach((d, i) => tl.fromTo(d, { scale: 0 }, { scale: 1, duration: 0.12 }, (i / Math.max(1, dots.length - 1)) * 0.88));
}

/** Custom cursor (DESIGN §6): fine pointers only, native cursor stays; hidden while a dialog is open. */
function cursor() {
  const labels = JSON.parse(document.body.dataset.cursorLabels ?? '{}') as Record<string, string>;
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  ring.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  ring.append(label);
  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  dot.setAttribute('aria-hidden', 'true');
  document.body.append(ring, dot);
  const dx = gsap.quickTo(dot, 'x', { duration: 0.15, ease: 'power3.out' });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.15, ease: 'power3.out' });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });
  let mode = '';
  const move = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    document.documentElement.classList.add('has-cursor');
    dx(e.clientX);
    dy(e.clientY);
    rx(e.clientX);
    ry(e.clientY);
    const t = e.target as Element;
    const next = t.closest('[data-cursor="view"]') ? 'view' : t.closest('[data-cursor="drag"], [data-tier="3d"] canvas') ? 'drag' : t.closest('a, button, [role="radio"], label, select, input, textarea') ? 'link' : '';
    if (next !== mode) {
      mode = next;
      ring.dataset.mode = mode;
      label.textContent = mode === 'view' || mode === 'drag' ? (labels[mode] ?? '') : '';
    }
  };
  const leave = () => document.documentElement.classList.remove('has-cursor');
  window.addEventListener('pointermove', move, { passive: true });
  document.documentElement.addEventListener('pointerleave', leave);
  return () => {
    window.removeEventListener('pointermove', move);
    document.documentElement.removeEventListener('pointerleave', leave);
    ring.remove();
    dot.remove();
    leave();
  };
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
    const outline = arch.querySelector('.arch__outline');
    const img = arch.querySelector('img');
    const par = arch.querySelector('[data-parallax-media]');
    const tl = gsap
      .timeline({ scrollTrigger: { trigger: arch, start: 'top 85%', end: 'top 35%', scrub: 0.6 }, defaults: { ease: 'none' } })
      .fromTo(clip, { clipPath: 'inset(18% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }, 0)
      .fromTo(img, { scale: 1.2 }, { scale: 1 }, 0);
    // the outline reveals with the media, never floating over empty sand (design QA #10)
    if (outline) tl.fromTo(outline, { clipPath: 'inset(18% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }, 0);
    if (par)
      gsap.fromTo(
        par,
        { yPercent: -6 },
        { yPercent: 6, ease: 'none', scrollTrigger: { trigger: arch, start: 'top bottom', end: 'bottom top', scrub: true } },
      );
  }
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
        guard(() => revealOnce([...cardReveals(), ...mapReveal(), ...pillarReveals(), ...formReveal()], cleanups)),
        guard(() => {
          storyArch();
          paymentTimeline(window.matchMedia('(min-width: 768px)').matches);
        }),
        guard(() => {
          if (fine) cleanups.push(magnetic(), cursor());
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
