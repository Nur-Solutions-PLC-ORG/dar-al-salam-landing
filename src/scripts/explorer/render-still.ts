/**
 * "Render this view" (DESIGN §9.10 F7, rev 10): a progressive path-traced still of the current dollhouse or walk-in
 * view, desktop only, on press. A lazy chunk with three-gpu-pathtracer 0.0.27 and three-mesh-bvh 0.9.17. The result
 * is the live geometry (not an artist's impression), so only the existing "illustrative" line applies.
 *
 * The dollhouse's model cut (2.4 m) and camera-side cutaway are shader patches the path tracer can't see, so the
 * still traces a proxy scene: every visible mesh copied with those clamps baked into its vertices, the lights and the
 * environment. Up to 300 samples; the caller stops it on any camera movement.
 */
import { BufferAttribute, Mesh, Scene, type BufferGeometry, type Light, type Material, type Object3D, type PerspectiveCamera, type WebGLRenderer } from 'three';
import { GradientEquirectTexture, WebGLPathTracer } from 'three-gpu-pathtracer';

export interface Still {
  stop(): void;
}

/** Desktop GPUs that can take it: a fine pointer, ≥ 8 GB, WebGL2 float render targets. */
export function canRenderStill(renderer: WebGLRenderer) {
  const gl = renderer.getContext();
  return (
    matchMedia('(pointer: fine)').matches &&
    ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) >= 8 &&
    typeof WebGL2RenderingContext !== 'undefined' &&
    gl instanceof WebGL2RenderingContext &&
    Boolean(gl.getExtension('EXT_color_buffer_float'))
  );
}

const visible = (o: Object3D) => {
  for (let x: Object3D | null = o; x; x = x.parent) if (!x.visible) return false;
  return true;
};

/** Bake the dollhouse shader's clamps (uModel; uCut per perimeter side via aSide) into a copy of the geometry. */
function bake(g: BufferGeometry, uModel: number, uCut: number[]) {
  const out = g.clone();
  for (const name of ['aDelay', 'aSide']) out.deleteAttribute(name);
  // the tracer merges colours as 4 components and, for 3-component sources, copies the wrong way round (all zeros:
  // black furniture), so hand it RGBA with alpha 1
  const col = out.getAttribute('color') as BufferAttribute | undefined;
  if (col && col.itemSize === 3) {
    const rgba = new Float32Array(col.count * 4);
    for (let i = 0; i < col.count; i++) rgba.set([col.getX(i), col.getY(i), col.getZ(i), 1], i * 4);
    out.setAttribute('color', new BufferAttribute(rgba, 4));
  }
  const pos = out.getAttribute('position') as BufferAttribute;
  const side = g.getAttribute('aSide') as BufferAttribute | undefined;
  if (side) {
    for (let i = 0; i < pos.count; i++) {
      let y = Math.min(pos.getY(i), uModel);
      const s = side.getX(i);
      if (s > -0.5) y = Math.min(y, uCut[Math.round(s)] ?? y);
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    out.computeVertexNormals();
  }
  return out;
}

/**
 * Rev 10.15: the live view stays on screen while samples accumulate off-screen. At `cleanAt` samples `onClean(show)`
 * is called: the caller freezes the live frame, calls `show()` (the traced image is drawn to the canvas from then on)
 * and cross-fades. Refinement continues to the cap. Not clean within `deadline` ms (counted from the press, scene
 * build included): it stops, frees everything and calls `onTimeout`.
 */
export async function renderStill(o: {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  uniforms: { uModel: { value: number }; uCut: { value: number[] } };
  onProgress: (fraction: number) => void;
  onClean: (show: () => void) => void;
  onTimeout: () => void;
  maxSamples?: number;
  cleanAt?: number;
  deadline?: number;
}): Promise<Still> {
  const t0 = performance.now();
  const max = o.maxSamples ?? 300;
  const cleanAt = o.cleanAt ?? 40;
  const deadline = o.deadline ?? 10000;
  const proxy = new Scene();
  proxy.background = o.scene.background;
  // the live scene's PMREM environment is a cube-UV map the tracer can't convert under three r187; a soft warm sky
  // gradient (equirect) stands in for it
  const sky = new GradientEquirectTexture(64);
  sky.topColor.set('#F6F3EE'); // near-neutral: the sun and materials carry the warmth (a warm sky turned it orange)
  sky.bottomColor.set('#9C9890');
  sky.exponent = 1.5;
  sky.update();
  proxy.environment = sky;
  proxy.environmentIntensity = o.scene.environmentIntensity;
  const own: BufferGeometry[] = [];
  o.scene.updateMatrixWorld(true);
  o.scene.traverse((x) => {
    if (!visible(x)) return;
    if ((x as Light).isLight) {
      const l = (x as Light).clone(false) as Light;
      x.matrixWorld.decompose(l.position, l.quaternion, l.scale);
      const t = (x as Light & { target?: Object3D }).target;
      if (t && (l as Light & { target?: Object3D }).target) {
        t.updateMatrixWorld();
        (l as Light & { target: Object3D }).target.position.setFromMatrixPosition(t.matrixWorld);
        proxy.add((l as Light & { target: Object3D }).target);
      }
      proxy.add(l);
      return;
    }
    const m = x as Mesh;
    if (!m.isMesh || !m.geometry?.getAttribute('position')) return;
    const mats = (Array.isArray(m.material) ? m.material : [m.material]) as Material[];
    if (mats.every((mt) => mt.transparent && mt.opacity < 0.02)) return; // faded-out pieces (a ceiling at 0, …)
    const g = bake(m.geometry, o.uniforms.uModel.value, o.uniforms.uCut.value);
    own.push(g);
    const c = new Mesh(g, m.material);
    m.matrixWorld.decompose(c.position, c.quaternion, c.scale);
    proxy.add(c);
  });

  const pt = new WebGLPathTracer(o.renderer);
  pt.renderDelay = 0;
  pt.minSamples = 1;
  pt.fadeDuration = 0; // the caller cross-fades from the frozen live frame
  pt.renderToCanvas = false; // accumulate off-screen until clean
  pt.rasterizeScene = false;
  pt.bounces = 5;
  pt.filterGlossyFactor = 0.5;
  pt.tiles.set(2, 2);
  // a synchronous BVH build on press (≈1 s for a unit, once): the async path needs a separate BVH worker file
  await new Promise((r) => setTimeout(r, 30)); // let the button's "Rendering… 0%" paint first
  pt.setScene(proxy, o.camera);

  let frame = 0;
  let stopped = false;
  let shown = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (frame) cancelAnimationFrame(frame);
    pt.dispose();
    sky.dispose();
    own.forEach((g) => g.dispose());
  };
  const step = () => {
    frame = 0;
    if (stopped) return;
    pt.renderSample();
    o.onProgress(Math.min(1, pt.samples / max));
    if (!shown && pt.samples >= cleanAt) {
      shown = true;
      o.onClean(() => {
        pt.renderToCanvas = true;
        pt.renderSample(); // draws the accumulated image now
      });
    } else if (!shown && performance.now() - t0 > deadline) {
      stop();
      o.onTimeout();
      return;
    }
    if (pt.samples < max) frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
  return { stop };
}
