/**
 * Satellite map (DESIGN §5.6 + S13/S14, rev 7). Imported by location-loader.ts; brings Leaflet 1.9.4 and its CSS.
 * - Esri World Imagery, no labels overlay; the attribution is always visible (bottom right).
 * - Built at z15 at opacity 0 over the diagram (z17 with reduced motion). The entrance runs once the first tiles
 *   have loaded AND the map is at top 75%: fade in (the diagram is then hidden and the caption swaps), flyTo z17
 *   over 2 s, then the pin drops, the card follows and the ground ring pulses (CSS, map.css).
 * - Failure (no first `load` within 10 s, or more than half of the first view's tiles erroring): the map is removed
 *   and the diagram stays, silently.
 * - No scroll trap: no wheel zoom; on a coarse pointer one finger scrolls the page (no dragging), two fingers pinch
 *   and pan, and a one-finger touch shows the "two fingers" hint.
 */
import L from 'leaflet';
// as strings, injected on mount: a plain CSS import would be inlined into every page's HTML (inlineStylesheets)
import leafletCss from 'leaflet/dist/leaflet.css?inline';
import mapCss from '../styles/map.css?inline';

interface MapConfig {
  lat: number;
  lng: number;
  tiles: string;
  t: Record<'region' | 'card' | 'caption' | 'two' | 'in' | 'out' | 'centre', string>;
}

const ATTRIBUTION =
  'Powered by <a href="https://www.esri.com">Esri</a> | Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community';
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const KEYHOLE = 'M0-8a4.6 4.6 0 0 1 2.6 8.4L4.4 8h-8.8l1.8-7.6A4.6 4.6 0 0 1 0-8Z'; // the diagram pin's keyhole
const FADE = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'; // power2.out

let mounted = false;

export function mountMap(fig: HTMLElement, focus: boolean) {
  if (mounted) return;
  mounted = true;
  const style = document.createElement('style');
  style.textContent = leafletCss + mapCss;
  document.head.append(style);
  const cfg = JSON.parse(fig.dataset.mapConfig ?? '{}') as MapConfig;
  const media = fig.querySelector<HTMLElement>('.location__media')!;
  const diagram = media.querySelector<HTMLElement>('.map');
  const caption = fig.querySelector<HTMLElement>('[data-map-caption]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const centre = L.latLng(cfg.lat, cfg.lng);
  const d = 0.02;

  const el = document.createElement('div');
  el.className = 'lmap';
  el.inert = true; // invisible until the entrance: no focus, no hits
  media.append(el);

  const map = L.map(el, {
    center: centre,
    // rev 7.1: opened from the Save-Data / slow-connection pill → straight at z17 (no z15 tiles), like reduced motion
    zoom: reduced || focus ? 17 : 15,
    minZoom: 14,
    maxZoom: 19,
    maxBounds: L.latLngBounds([cfg.lat - d, cfg.lng - d], [cfg.lat + d, cfg.lng + d]),
    maxBoundsViscosity: 1,
    zoomControl: false,
    attributionControl: true,
    scrollWheelZoom: false,
    dragging: !coarse,
    touchZoom: true,
    doubleClickZoom: true,
    boxZoom: false,
    keyboard: true,
    fadeAnimation: !reduced,
  });
  map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
  el.setAttribute('role', 'region');
  el.setAttribute('aria-label', cfg.t.region);

  const tiles = L.tileLayer(cfg.tiles, {
    attribution: ATTRIBUTION,
    maxZoom: 19,
    maxNativeZoom: 19,
    detectRetina: false,
    keepBuffer: 1,
    updateWhenIdle: true,
    updateWhenZooming: false,
    errorTileUrl: BLANK,
  });

  /* ---------- failure → the diagram stays ---------- */
  let started = 0;
  let failed = 0;
  let loaded = false;
  // deferred: fail() can run inside Leaflet's own tile 'load' event, and GridLayer._tileReady reads this._map
  // after the event returns (review r5 #1: an uncaught TypeError on every tile outage)
  const fail = () => {
    window.clearTimeout(timer);
    tiles.off();
    window.setTimeout(() => {
      map.remove();
      el.remove();
    }, 0);
  };
  const timer = window.setTimeout(() => !loaded && fail(), 10_000);
  tiles.on('tileloadstart', () => !loaded && started++);
  tiles.on('tileerror', () => !loaded && failed++);
  tiles.once('load', () => {
    loaded = true;
    window.clearTimeout(timer);
    if (failed > started / 2) fail();
    else ready();
  });
  tiles.addTo(map);

  /* ---------- entrance: first tiles loaded AND the map at top 75% ---------- */
  let inView = false;
  let tilesReady = false;
  let entered = false;
  function ready() {
    tilesReady = true;
    enter();
  }
  const io = new IntersectionObserver(
    ([e]) => {
      inView = Boolean(e?.isIntersecting);
      enter();
    },
    { rootMargin: '0px 0px -25% 0px' },
  );
  io.observe(fig);

  function enter() {
    if (entered || !tilesReady || !(inView || focus)) return;
    entered = true;
    io.disconnect();
    el.inert = false;
    el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduced ? 200 : 600, easing: FADE, fill: 'forwards' })
      .finished.then(() => {
        if (diagram) diagram.hidden = true;
        if (caption) caption.textContent = cfg.t.caption;
        if (reduced || focus) return drop();
        map.once('moveend', drop);
        map.flyTo(centre, 17, { duration: 2 });
      })
      .catch(() => undefined);
    if (focus) el.focus({ preventScroll: true });
  }

  /* ---------- pin, card, ground ring ---------- */
  const [a = '', b = ''] = cfg.t.card.split('·');
  const card = document.createElement('span');
  card.className = 'lpin__card';
  const dot = document.createElement('span');
  dot.textContent = '·';
  card.append(a.trim(), ' ', dot, ' ', b.trim());

  function drop() {
    const icon = L.divIcon({
      className: 'lpin',
      iconSize: [40, 52],
      iconAnchor: [20, 52],
      html:
        '<span class="lpin__ring"></span><svg class="lpin__drop" viewBox="0 0 40 52"><path d="M20 50C14 40 3 31 3 20a17 17 0 1 1 34 0c0 11-11 20-17 30Z"/>' +
        `<path class="lpin__key" transform="translate(20 20) scale(1.4)" d="${KEYHOLE}"/></svg>`,
    });
    const marker = L.marker(centre, { icon, keyboard: false, interactive: false }).addTo(map);
    const pin = marker.getElement();
    if (!pin) return;
    pin.setAttribute('aria-hidden', 'true');
    pin.append(card);
    if (!reduced) pin.classList.add('is-dropping');
    pulseWhileVisible(pin);
  }

  // S14: the ring pulses only on screen and while the tab is visible
  function pulseWhileVisible(pin: HTMLElement) {
    let onScreen = true;
    const sync = () => pin.classList.toggle('is-paused', !onScreen || document.hidden);
    new IntersectionObserver(([e]) => {
      onScreen = Boolean(e?.isIntersecting);
      sync();
    }).observe(el);
    document.addEventListener('visibilitychange', sync);
  }

  /* ---------- controls: zoom in, zoom out, centre on the tower (44 px, localised) ---------- */
  const ctl = document.createElement('div');
  ctl.className = 'lmap__ctl';
  const button = (label: string, glyph: string, act: () => void) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', label);
    btn.innerHTML = `<svg viewBox="0 0 20 20" aria-hidden="true">${glyph}</svg>`;
    btn.addEventListener('click', act);
    ctl.append(btn);
  };
  button(cfg.t.in, '<path d="M10 4v12M4 10h12"/>', () => map.zoomIn());
  button(cfg.t.out, '<path d="M4 10h12"/>', () => map.zoomOut());
  button(cfg.t.centre, `<path class="fill" transform="translate(10 10) scale(.9)" d="${KEYHOLE}"/>`, () =>
    reduced ? map.setView(centre, 17) : map.flyTo(centre, 17, { duration: 0.8 }),
  );
  L.DomEvent.disableClickPropagation(ctl);
  el.insertBefore(ctl, el.querySelector('.leaflet-control-container')); // tab order: map, controls, attribution

  /* ---------- two-finger hint (touch) ---------- */
  if (coarse) {
    const hint = document.createElement('div');
    hint.className = 'lmap__hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.textContent = cfg.t.two;
    el.append(hint);
    let last = -Infinity;
    let hide = 0;
    el.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length !== 1 || (e.target as Element).closest('.lmap__ctl, .leaflet-control')) return;
        const now = performance.now();
        if (now - last < 4000) return;
        last = now;
        // rev 7.1: centred at 70% height, but at least 12 px above the attribution's top edge (it may wrap)
        const attr = el.querySelector('.leaflet-control-attribution');
        const box = el.getBoundingClientRect();
        const limit = (attr ? attr.getBoundingClientRect().top - box.top : box.height) - 12 - hint.offsetHeight / 2;
        hint.style.top = `${Math.min(box.height * 0.7, limit)}px`;
        hint.classList.add('is-on');
        window.clearTimeout(hide);
        hide = window.setTimeout(() => hint.classList.remove('is-on'), 1600); // 0.2 in + 1.4 hold
      },
      { passive: true },
    );
  }
}
