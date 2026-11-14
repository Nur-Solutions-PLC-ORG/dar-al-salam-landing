/**
 * The tower maquette as a static SVG (DESIGN §9.7 A4, rev 9.1): the fallback stage when the tower render fails to load.
 * Fetched and injected inline by the explorer only in that case, so it costs the page HTML nothing (40 KB budget). Its
 * styles are embedded; inline, it inherits the page's CSS custom properties. Decorative (aria-hidden): the floor list
 * and stepper are the controls; src/scripts/explorer/svg-model.ts wires hover/click on its [data-floor] groups.
 */
import type { APIRoute } from 'astro';
import { buildMaquette, PULL_OUT } from '../../lib/maquette';

const CSS = `.maquette {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .maquette polygon {
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }

  /* ground = section background with a faint lift, so it reads as a shadow, not a saucer (design QA #4) */
  .maquette__ground {
    fill: url(#maquette-shadow);
  }

  .maquette__basement {
    fill: none;
    stroke: var(--gold-500);
    stroke-opacity: 0.45;
    stroke-width: 1;
    stroke-dasharray: 4 4;
    vector-effect: non-scaling-stroke;
  }

  .maquette .top {
    fill: var(--sand-100);
    stroke: var(--gold-500);
    stroke-opacity: 0.7;
    stroke-width: 1;
  }

  .maquette .side-l {
    fill: var(--ivory-50);
    stroke: var(--gold-500);
    stroke-opacity: 0.35;
    stroke-width: 0.75;
  }

  .maquette .side-m {
    fill: var(--sand-100);
    stroke: var(--gold-500);
    stroke-opacity: 0.35;
    stroke-width: 0.75;
  }

  .maquette .side-r {
    fill: var(--sand-200);
    stroke: var(--gold-500);
    stroke-opacity: 0.35;
    stroke-width: 0.75;
  }

  .maquette .glaze {
    fill: #abb0bc;
  }

  .maquette__podium .side-l,
  .maquette__podium .side-m,
  .maquette__podium .side-r {
    fill: var(--navy-700);
    stroke-opacity: 0.6;
  }

  .maquette__podium .top {
    fill: var(--navy-600);
  }

  /* slab states: instant fills (no colour tweens); the pull-out is a transform transition */
  .slab {
    transition: transform 0.6s var(--ease-out);
  }

  .slab.is-hover .top,
  .slab.is-selected .top {
    fill: var(--gold-300);
    stroke: var(--gold-600);
    stroke-opacity: 1;
  }

  .slab.is-hover :is(.side-l, .side-m, .side-r),
  .slab.is-selected :is(.side-l, .side-m, .side-r) {
    fill: var(--gold-400);
    stroke: var(--gold-600);
    stroke-opacity: 1;
  }

  .slab.is-selected {
    transform: translate(var(--pull-x), var(--pull-y));
  }

  /* while a floor is selected, the others step back so the gold slab stands out */
  .maquette[data-has-selected] .slab:not(.is-selected, .is-hover) :is(.top, .side-l, .side-m) {
    fill: #e9e2d6;
  }

  .maquette[data-interactive] .slab {
    cursor: pointer;
  }`;

export const GET: APIRoute = () => {
  const m = buildMaquette();
  const poly = (f: { kind: string; points: string }) => `<polygon class="${f.kind}" points="${f.points}"/>`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" class="maquette" viewBox="${m.viewBox}" aria-hidden="true" focusable="false" data-maquette style="--pull-x: ${PULL_OUT.x}px; --pull-y: ${PULL_OUT.y}px">` +
    `<style>${CSS}</style>` +
    '<defs><radialGradient id="maquette-shadow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#0b1220" stop-opacity="0.7"/><stop offset="0.5" stop-color="#0b1220" stop-opacity="0.35"/><stop offset="1" stop-color="#0b1220" stop-opacity="0"/></radialGradient></defs>' +
    `<path class="maquette__ground" d="${m.ground}"/>` +
    `<polygon class="maquette__basement" points="${m.basement}"/>` +
    `<g class="maquette__podium">${m.podium.faces.map(poly).join('')}</g>` +
    m.floors
      .map((f) => `<g class="slab" data-floor="${f.n}" data-ax="${f.prism.anchor[0].toFixed(1)}" data-ay="${f.prism.anchor[1].toFixed(1)}">${f.prism.faces.map(poly).join('')}</g>`)
      .join('') +
    `<g class="maquette__parapet">${m.parapet.faces.map(poly).join('')}</g>` +
    '</svg>';
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' } });
};
