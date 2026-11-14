/**
 * Photoreal tower stage (DESIGN §9.7 A1, rev 9): the model adapter for the render + SVG bands
 * (src/components/explorer/TowerStage.astro). The controller owns state; this only lights bands and reports picks.
 * - Pointer: hover lights a band and shows the chip; click picks.
 * - Touch: the first tap previews (chip + "View floor n"), a second tap on the same band picks. A vertical drag that
 *   starts on the tower scrubs the preview floor.
 * - The ground storey shows a muted "Ground floor: commercial" chip and is never picked.
 */
import type { ModelAdapter, ModelCallbacks } from './types';

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

  // touch: tap to preview, tap again to pick; a vertical drag that starts on the tower scrubs the preview
  let dragFrom: number | null = null;
  const onDown = (e: PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    dragFrom = floorAt(e.target) !== null ? e.clientY : null;
  };
  const onTouchMove = (e: PointerEvent) => {
    if (e.pointerType !== 'touch' || dragFrom === null) return;
    const n = floorAt(document.elementFromPoint(e.clientX, e.clientY));
    if (n !== null && n !== touchPreview) {
      touchPreview = n;
      show(n);
      cb.onInteract();
    }
  };
  const onUp = () => {
    dragFrom = null;
  };

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

  svg.addEventListener('pointermove', onMove);
  svg.addEventListener('pointerleave', onLeave);
  svg.addEventListener('pointerdown', onDown);
  svg.addEventListener('pointermove', onTouchMove);
  window.addEventListener('pointerup', onUp);
  svg.addEventListener('click', onClick);

  return {
    preview(n) {
      external = n;
      paint();
    },
    select(n) {
      selected = n;
      touchPreview = null;
      paint();
    },
    anchor,
    destroy() {
      svg.removeEventListener('pointermove', onMove);
      svg.removeEventListener('pointerleave', onLeave);
      svg.removeEventListener('pointerdown', onDown);
      svg.removeEventListener('pointermove', onTouchMove);
      window.removeEventListener('pointerup', onUp);
      svg.removeEventListener('click', onClick);
      bands.forEach((p) => p.classList.remove('is-hover', 'is-selected'));
    },
  };
}
