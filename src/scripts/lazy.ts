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

/** Cheap WebGL capability check (no context kept alive). */
export function supportsWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') ?? c.getContext('webgl');
    if (!gl) return false;
    (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Save-Data / 2G hint: prefer the lightweight fallback. */
export function prefersLightweight(): boolean {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return Boolean(conn?.saveData || (conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType)));
}
