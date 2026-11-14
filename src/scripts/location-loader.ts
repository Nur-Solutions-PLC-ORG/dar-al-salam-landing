/**
 * Satellite map loader (DESIGN §5.6 rev 7), in the initial bundle, so it stays tiny: it decides when to fetch the
 * map chunk (src/scripts/location-map.ts, with Leaflet and its CSS).
 * - Normal: when #location's map is within 800 px, add a preconnect to the tile host, then import the chunk.
 * - Save-Data, or effectiveType slow-2g / 2g / 3g: no automatic load; a "Show the satellite map" pill over the
 *   diagram loads it on press and moves focus to the map. `?map-debug` skips this check (headless QA reports 3g).
 */
type Connection = { saveData?: boolean; effectiveType?: string };

function slowConnection() {
  if (new URLSearchParams(location.search).has('map-debug')) return false;
  const c = (navigator as Navigator & { connection?: Connection }).connection;
  return Boolean(c && (c.saveData || /^(slow-2g|2g|3g)$/.test(c.effectiveType ?? '')));
}

export function initLocationMap() {
  const fig = document.querySelector<HTMLElement>('[data-map-config]');
  const media = fig?.querySelector<HTMLElement>('.location__media');
  if (!fig || !media || !('IntersectionObserver' in window)) return;

  const load = (focus: boolean) => {
    try {
      const tiles = JSON.parse(fig.dataset.mapConfig ?? '{}').tiles as string;
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = new URL(tiles.replace(/[{}]/g, '')).origin;
      document.head.append(link);
    } catch {
      /* the preconnect is only a hint */
    }
    void import('./location-map').then((m) => m.mountMap(fig, focus));
  };

  if (slowConnection()) {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'btn btn--secondary location__show';
    pill.textContent = fig.dataset.showMap ?? '';
    pill.addEventListener('click', () => {
      pill.remove();
      load(true);
    });
    media.append(pill);
    return;
  }

  const io = new IntersectionObserver(
    ([e]) => {
      if (!e?.isIntersecting) return;
      io.disconnect();
      load(false);
    },
    { rootMargin: '800px 0px' },
  );
  io.observe(fig);
}
