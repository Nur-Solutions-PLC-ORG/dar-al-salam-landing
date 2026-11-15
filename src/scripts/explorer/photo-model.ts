/**
 * Photoreal tower stage (DESIGN §9.7 A1, rev 9): the model adapter for the render + SVG bands
 * (src/components/explorer/TowerStage.astro). The controller owns state; this only lights bands and reports picks.
 * - Pointer: hover lights a band and shows the chip; click picks.
 * - Touch: the first tap previews (chip + "View floor n"), a second tap on the same band picks. A vertical swipe
 *   scrolls the page (review r8 L8: the old scrub could never fire under touch-action pan-y, so it was removed).
 * - The ground storey shows a muted "Ground floor: commercial" chip and is never picked.
 * - A2, choosing a floor: the image pushes in (scale 2.4, the band's centre to 50% / 46% of the stage, 1.1 s
 *   power3.inOut) while navy veils over the floors above and below fade to 0.5; then a copy of the image clipped to the
 *   band lifts −28 px and scales 1.04 (0.5 s power3.out, overlapping the last 0.2 s). Back to the tower reverses it in
 *   0.8 s; another floor glides to its band (0.6 s). Reduced motion: no push-in or lift, the band is highlighted.
 *   Transform and opacity only.
 */
import { gsap, prefersReducedMotion } from '../motion';
import type { ModelAdapter, ModelCallbacks } from './types';

const VB = { w: 1350, h: 1850 };
const SCALE = 2.4;
const NS = 'http://www.w3.org/2000/svg';

export function createPhotoModel(root: HTMLElement, stage: HTMLElement, cb: ModelCallbacks & { onGround: (at: { x: number; y: number; center?: boolean } | null) => void }): ModelAdapter {
  const svg = root.querySelector<SVGSVGElement>('[data-tstage-svg]')!;
  const bands = new Map<number, SVGPolygonElement>();
  svg.querySelectorAll<SVGPolygonElement>('.tband[data-floor]').forEach((p) => bands.set(Number(p.dataset.floor), p));
  const ground = svg.querySelector<SVGPolygonElement>('[data-ground]');
  const narrow = () => stage.clientWidth < 640;

  let hover: number | null = null;
  let external: number | null = null;
  let selected: number | null = null;
  let touchPreview: number | null = null;

  const paint = () => {
    const h = hover ?? external;
    bands.forEach((p, n) => {
      p.classList.toggle('is-hover', n === h && n !== selected);
      p.classList.toggle('is-selected', n === selected);
    });
  };

  /** Chip anchor, stage-relative: the band's right end (≥ 640 px), or centred under the band on phones. */
  const anchorOf = (poly: SVGPolygonElement) => {
    const ctm = poly.getScreenCTM();
    if (!ctm) return null;
    const s = stage.getBoundingClientRect();
    const pts = Array.from(poly.points).map((p) => new DOMPoint(p.x, p.y).matrixTransform(ctm));
    if (narrow()) {
      const xs = pts.map((p) => p.x);
      return { x: (Math.min(...xs) + Math.max(...xs)) / 2 - s.left, y: Math.max(...pts.map((p) => p.y)) - s.top + 18, center: true };
    }
    const right = pts.reduce((a, p) => (p.x > a.x ? p : a));
    const rightPts = pts.filter((p) => Math.abs(p.x - right.x) < 1);
    const y = rightPts.reduce((a, p) => a + p.y, 0) / rightPts.length;
    return { x: right.x - s.left + 12, y: y - s.top };
  };
  const anchor = (n: number) => {
    const p = bands.get(n);
    return p ? anchorOf(p) : null;
  };

  const floorAt = (t: EventTarget | null) => {
    const p = (t as Element | null)?.closest?.('.tband[data-floor]') as SVGPolygonElement | null;
    return p ? Number(p.dataset.floor) : null;
  };
  const isGround = (t: EventTarget | null) => Boolean((t as Element | null)?.closest?.('[data-ground]'));

  const show = (n: number | null) => {
    if (n === hover) return;
    hover = n;
    paint();
    cb.onHover(n, n ? (anchor(n) ?? undefined) : undefined);
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    show(floorAt(e.target));
    cb.onGround(isGround(e.target) && ground ? anchorOf(ground) : null);
  };
  const onLeave = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    show(null);
    cb.onGround(null);
  };

  // touch: tap to preview, tap again to pick (vertical swipes scroll the page)
  const onClick = (e: MouseEvent) => {
    const n = floorAt(e.target);
    cb.onInteract();
    if (isGround(e.target)) {
      if (ground) cb.onGround(anchorOf(ground));
      return;
    }
    if (!n) return;
    // the click's own pointer type decides (a mouse on a hybrid device picks at once); fall back to the media query
    const type = (e as PointerEvent).pointerType;
    const touch = type ? type !== 'mouse' : matchMedia('(hover: none)').matches;
    if (touch && touchPreview !== n) {
      touchPreview = n;
      show(n);
      return;
    }
    touchPreview = null;
    cb.onPick(n);
  };

  /* ---------- A2: push-in, veils, slab lift ---------- */
  const frame = root.querySelector<HTMLElement>('.tstage__frame')!;
  const zoom = root.querySelector<HTMLElement>('[data-tstage-zoom]')!;
  const pts = (n: number) => Array.from(bands.get(n)!.points).map((p) => [p.x, p.y] as const);
  const veil = (cls: string) => {
    const v = document.createElementNS(NS, 'polygon');
    v.setAttribute('class', `tveil ${cls}`);
    svg.insertBefore(v, svg.querySelector('.tband'));
    return v;
  };
  const veilUp = veil('tveil--up');
  const veilDown = veil('tveil--down');
  // the lifted slab: a copy of the picture clipped to the band (the drop shadow sits on the unclipped wrapper)
  const lift = document.createElement('div');
  lift.className = 'tstage__lift';
  lift.setAttribute('aria-hidden', 'true');
  const liftImg = document.createElement('div');
  liftImg.className = 'tstage__lift-img';
  lift.append(liftImg);
  zoom.append(lift);

  /** Veils over everything above and below band n (6 points: left-top, corner-top, right-top, right-bottom, …). */
  const shapeVeils = (n: number) => {
    const [a, b, c, d, e, f] = pts(n) as [readonly [number, number], ...(readonly [number, number])[]] & { length: 6 };
    const s = (q: readonly (readonly [number, number])[]) => q.map(([x, y]) => `${x},${y}`).join(' ');
    veilUp.setAttribute('points', s([[0, 0], [VB.w, 0], [VB.w, c![1]], c!, b!, a, [0, a[1]]]));
    veilDown.setAttribute('points', s([[0, f![1]], f!, e!, d!, [VB.w, d![1]], [VB.w, VB.h], [0, VB.h]]));
  };
  const shapeLift = (n: number) => {
    if (!liftImg.firstChild) {
      const pic = zoom.querySelector('picture, img');
      if (pic) liftImg.append(pic.cloneNode(true));
    }
    const poly = pts(n).map(([x, y]) => `${((x / VB.w) * 100).toFixed(2)}% ${((y / VB.h) * 100).toFixed(2)}%`).join(', ');
    liftImg.style.clipPath = `polygon(${poly})`;
    const c = centroid(n);
    lift.style.transformOrigin = `${(c[0] / VB.w) * 100}% ${(c[1] / VB.h) * 100}%`;
  };
  /** The band's visual centre: its bounding-box middle (the vertex mean leans toward the corner's two points). */
  const centroid = (n: number) => {
    const q = pts(n);
    const xs = q.map((p) => p[0]);
    const ys = q.map((p) => p[1]);
    return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2] as const;
  };
  /** Zoom-wrapper transform that puts band n's centre at 50% / 46% of the stage at SCALE (origin 0 0). */
  const pushFor = (n: number) => {
    const k = frame.offsetWidth / VB.w;
    const [cx, cy] = centroid(n);
    // rev 10.7: the frame is centred in .tstage (contain fit), which can sit offset inside the stage; aim at 50% / 46%
    // of the stage, in .tstage's coordinates
    const r = root.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    const fx = (root.clientWidth - frame.offsetWidth) / 2;
    const fy = (root.clientHeight - frame.offsetHeight) / 2;
    return { x: s.left - r.left + s.width * 0.5 - fx - SCALE * cx * k, y: s.top - r.top + s.height * 0.46 - fy - SCALE * cy * k, scale: SCALE };
  };

  let tl: gsap.core.Timeline | null = null;
  function focusBand(from: number | null, to: number | null) {
    tl?.kill();
    const reduced = prefersReducedMotion();
    if (to === null) {
      // back to the tower: the reverse, 0.8 s
      tl = gsap
        .timeline()
        .to(lift, { opacity: 0, y: 0, scale: 1, duration: reduced ? 0 : 0.25, ease: 'power2.in' })
        .to(zoom, { x: 0, y: 0, scale: 1, duration: reduced ? 0 : 0.8, ease: 'power3.inOut' }, reduced ? 0 : 0.1)
        .to([veilUp, veilDown], { opacity: 0, duration: reduced ? 0 : 0.6 }, '<');
      return;
    }
    if (reduced) {
      gsap.set(zoom, { x: 0, y: 0, scale: 1 });
      gsap.set([veilUp, veilDown, lift], { opacity: 0 });
      return;
    }
    shapeVeils(to);
    shapeLift(to);
    const push = pushFor(to);
    if (from === null) {
      gsap.set(zoom, { transformOrigin: '0 0' });
      gsap.set(lift, { opacity: 0, y: 0, scale: 1 });
      tl = gsap
        .timeline()
        .to(zoom, { ...push, duration: 1.1, ease: 'power3.inOut' })
        .to([veilUp, veilDown], { opacity: 0.5, duration: 0.8, ease: 'power2.out' }, 0.3)
        // the lift overlaps the last 0.2 s of the push-in; −28 screen px inside a 2.4× zoom
        .set(lift, { opacity: 1 }, 0.9)
        .to(lift, { y: -28 / SCALE, scale: 1.04, duration: 0.5, ease: 'power3.out' }, 0.9);
    } else {
      // another floor: glide to its band; the slab drops and lifts again
      gsap.set(lift, { opacity: 0, y: 0, scale: 1 });
      tl = gsap
        .timeline()
        .to(zoom, { ...push, duration: 0.6, ease: 'power3.inOut' })
        .set(lift, { opacity: 1 }, 0.4)
        .to(lift, { y: -28 / SCALE, scale: 1.04, duration: 0.5, ease: 'power3.out' }, 0.4);
    }
  }
  // keep the push centred when the stage resizes (rotation, desktop layout change)
  const ro = new ResizeObserver(() => {
    if (selected !== null && !prefersReducedMotion() && !tl?.isActive()) gsap.set(zoom, pushFor(selected));
  });
  ro.observe(stage);

  svg.addEventListener('pointermove', onMove);
  svg.addEventListener('pointerleave', onLeave);
  svg.addEventListener('click', onClick);

  return {
    preview(n) {
      external = n;
      paint();
    },
    select(n) {
      if (n === selected) return;
      const from = selected;
      selected = n;
      touchPreview = null;
      paint();
      if (n !== null) cb.onHover(null); // the chip would sit stale over a moving image
      focusBand(from, n);
    },
    anchor,
    destroy() {
      svg.removeEventListener('pointermove', onMove);
      svg.removeEventListener('pointerleave', onLeave);
      svg.removeEventListener('click', onClick);
      bands.forEach((p) => p.classList.remove('is-hover', 'is-selected'));
      tl?.kill();
      ro.disconnect();
      gsap.set(zoom, { clearProps: 'transform' });
      veilUp.remove();
      veilDown.remove();
      lift.remove();
    },
  };
}
