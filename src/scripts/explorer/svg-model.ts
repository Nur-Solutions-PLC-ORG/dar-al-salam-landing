/**
 * Tier 1: the build-time SVG maquette made interactive (~2 KB). Hover/click slabs; the controller owns state.
 * Fill changes are instant class swaps; the selected slab's pull-out is a CSS transform transition.
 */
import type { ModelAdapter, ModelCallbacks } from './types';

export function createSvgModel(svg: SVGSVGElement, stage: HTMLElement, cb: ModelCallbacks): ModelAdapter {
  const slabs = new Map<number, SVGGElement>();
  svg.querySelectorAll<SVGGElement>('.slab').forEach((g) => slabs.set(Number(g.dataset.floor), g));
  svg.dataset.interactive = '';

  let hover: number | null = null;
  let external: number | null = null;
  let selected: number | null = null;

  const paint = () => {
    const h = hover ?? external;
    slabs.forEach((g, n) => {
      g.classList.toggle('is-hover', n === h && n !== selected);
      g.classList.toggle('is-selected', n === selected);
    });
  };

  const anchor = (floor: number) => {
    const g = slabs.get(floor);
    if (!g) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const p = svg.createSVGPoint();
    p.x = Number(g.dataset.ax);
    p.y = Number(g.dataset.ay);
    const s = p.matrixTransform(ctm);
    const r = stage.getBoundingClientRect();
    return { x: s.x - r.left + 12, y: s.y - r.top };
  };

  const floorAt = (t: EventTarget | null) => {
    const g = (t as Element | null)?.closest<SVGGElement>('.slab');
    return g ? Number(g.dataset.floor) : null;
  };

  const onMove = (e: PointerEvent) => {
    const n = floorAt(e.target);
    if (n === hover) return;
    hover = n;
    paint();
    cb.onHover(n, n ? (anchor(n) ?? undefined) : undefined);
  };
  const onLeave = () => {
    hover = null;
    paint();
    cb.onHover(null);
  };
  const onClick = (e: MouseEvent) => {
    const n = floorAt(e.target);
    cb.onInteract();
    if (n) cb.onPick(n);
  };

  svg.addEventListener('pointermove', onMove);
  svg.addEventListener('pointerleave', onLeave);
  svg.addEventListener('click', onClick);

  return {
    preview(floor) {
      external = floor;
      paint();
    },
    select(floor) {
      selected = floor;
      svg.toggleAttribute('data-has-selected', floor !== null);
      paint();
    },
    anchor,
    destroy() {
      svg.removeEventListener('pointermove', onMove);
      svg.removeEventListener('pointerleave', onLeave);
      svg.removeEventListener('click', onClick);
      delete svg.dataset.interactive;
      svg.removeAttribute('data-has-selected');
      slabs.forEach((g) => g.classList.remove('is-hover', 'is-selected'));
    },
  };
}
