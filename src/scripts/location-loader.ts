/**
 * Satellite map loader (DESIGN §5.6 rev 7, rev 8.5), in the initial bundle, so it stays tiny: it decides when to fetch
 * the map chunk (src/scripts/location-map.ts, with Leaflet and its CSS).
 * - Always automatic (rev 8.5, user request: no opt-in pill): when #location's map is within 800 px, add a preconnect
 *   to the tile host, then import the chunk. Nothing map-related loads at page load.
 * - Save-Data, or effectiveType slow-2g / 2g / 3g: the map opens straight at z17 (no fly-in, so no z15 tiles), like
 *   reduced motion.
 */
type Connection = { saveData?: boolean; effectiveType?: string };

function slowConnection() {
  const c = (navigator as Navigator & { connection?: Connection }).connection;
  return Boolean(c && (c.saveData || /^(slow-2g|2g|3g)$/.test(c.effectiveType ?? '')));
}

export function initLocationMap() {
  const fig = document.querySelector<HTMLElement>('[data-map-config]');
  if (!fig || !('IntersectionObserver' in window)) return;

  const load = () => {
    try {
      const tiles = JSON.parse(fig.dataset.mapConfig ?? '{}').tiles as string;
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = new URL(tiles.replace(/[{}]/g, '')).origin;
      document.head.append(link);
    } catch {
      /* the preconnect is only a hint */
    }
    void import('./location-map').then((m) => m.mountMap(fig, slowConnection()));
  };

  const io = new IntersectionObserver(
    ([e]) => {
      if (!e?.isIntersecting) return;
      io.disconnect();
      load();
    },
    { rootMargin: '800px 0px' },
  );
  io.observe(fig);
}
