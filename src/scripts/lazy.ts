/**
 * Run `load` once when `el` comes within `rootMargin` of the viewport.
 * Used to dynamically import heavy modules (three.js tower model) only when needed.
 */
export function whenNear(el: Element, load: () => void, rootMargin = '600px 0px'): () => void {
  if (!('IntersectionObserver' in window)) {
    load();
    return () => {};
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        load();
      }
    },
    { rootMargin },
  );
  io.observe(el);
  return () => io.disconnect();
}

/**
 * Track whether `el` is on screen; pause rAF loops when it isn't.
 */
export function onVisibility(el: Element, cb: (visible: boolean) => void, rootMargin = '0px'): () => void {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) cb(e.isIntersecting);
  }, { rootMargin });
  io.observe(el);
  const onHidden = () => cb(document.visibilityState === 'visible' && isInViewport(el));
  document.addEventListener('visibilitychange', onHidden);
  return () => {
    io.disconnect();
    document.removeEventListener('visibilitychange', onHidden);
  };
}

function isInViewport(el: Element) {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight;
}

/** Cheap WebGL2 capability check (no context kept alive). */
export function supportsWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    if (!gl) return false;
    (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** DESIGN §9.4 tier 1 conditions: Save-Data, 2g/slow-2g/3g, or < 4 GB device memory → lightweight model. */
export function prefersLightweight(): boolean {
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };
  const conn = nav.connection;
  if (conn?.saveData) return true;
  if (conn?.effectiveType && ['slow-2g', '2g', '3g'].includes(conn.effectiveType)) return true;
  return typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4;
}
