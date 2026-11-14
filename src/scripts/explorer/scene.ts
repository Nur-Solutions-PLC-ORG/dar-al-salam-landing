/**
 * Tier 2: Three.js "maquette" (DESIGN §9.4). Dynamically imported by controller.ts only; never in the
 * initial JS graph. Named imports so `three` tree-shakes.
 *
 * - Ivory Lambert slabs with gold edge lines and a recessed navy glazing band per floor; darker podium;
 *   parapet; dashed basement outline; navy ground disc with a soft radial shadow. No real-time shadows.
 * - fov 28 camera, 3/4 view (azimuth −35°, elevation 18°), horizontal orbit ±40° by drag with inertia.
 *   No zoom; the wheel always scrolls the page; `touch-action: pan-y` keeps vertical swipes scrolling.
 * - Render on demand: frames only on pointer events, tweens, the S10 scrub and the idle sway, which runs
 *   only while visible and motion is allowed. Everything stops offscreen / in a hidden tab.
 * - Heights are illustrative (src/data/tower.ts) and never shown in the UI.
 */
import {
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  DirectionalLight,
  EdgesGeometry,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Shape,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import {
  GLAZING_BAND,
  GROUND_HEIGHT,
  GROUND_INSET,
  PARAPET,
  RESIDENTIAL_FLOORS,
  SLAB_DEPTH,
  floorBase,
  floorOutlineM,
  insetPolygon,
  towerTop,
} from '../../data/tower';
import { gsap, prefersReducedMotion } from '../motion';
import { onVisibility } from '../lazy';
import type { ModelAdapter, ModelCallbacks } from './types';

const DEG = Math.PI / 180;
const AZIMUTH = -35 * DEG;
const ELEVATION = 18 * DEG;
const ORBIT_LIMIT = 40 * DEG;
const PULL = 3; // metres toward the camera

const COLORS = {
  ivory: new Color('#F3ECE2'),
  hover: new Color('#E6D3A8'), // gold-300
  gold: new Color('#B59458'),
  glaze: new Color('#34466A'), // navy-600
  podium: new Color('#24344F'),
  ground: new Color('#1A273F'),
};

type P2 = readonly [number, number];

/** Plan (x east, y south) → Shape in XY with y flipped, so after rotateX(−90°) plan y maps to world +z. */
function shapeOf(ring: readonly P2[]) {
  const s = new Shape();
  ring.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, -y) : s.lineTo(x, -y)));
  s.closePath();
  return s;
}

function prism(ring: readonly P2[], depth: number) {
  const g = new ExtrudeGeometry(shapeOf(ring), { depth, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  return g;
}

function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  g.addColorStop(0, 'rgba(11,18,32,0.55)');
  g.addColorStop(0.45, 'rgba(11,18,32,0.25)');
  g.addColorStop(1, 'rgba(11,18,32,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return new CanvasTexture(c);
}

export async function createScene(host: HTMLElement, stage: HTMLElement, cb: ModelCallbacks): Promise<ModelAdapter> {
  const renderer = new WebGLRenderer({
    antialias: window.devicePixelRatio < 2,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.tabIndex = -1;
  canvas.style.touchAction = 'pan-y';
  host.appendChild(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(28, 1, 1, 1000);
  const tower = new Group();
  scene.add(tower);

  scene.add(new HemisphereLight('#FBF7F2', '#1A273F', 2.2));
  const sun = new DirectionalLight('#F5E6C8', 1.9);
  sun.position.set(-60, 90, 40);
  scene.add(sun);

  const disposables: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);

  /* ---------- geometry ---------- */

  // ground disc + soft shadow
  const ground = new Mesh(keep(new CircleGeometry(60, 64)), keep(new MeshBasicMaterial({ color: COLORS.ground })));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  scene.add(ground);
  const shadowTex = keep(shadowTexture());
  const shadow = new Mesh(
    keep(new CircleGeometry(42, 48)),
    keep(new MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  scene.add(shadow);

  // basement: dashed outline below the ground plane
  const basePts = floorOutlineM.map(([x, y]) => new Vector3(x, -3.2, y));
  basePts.push(basePts[0]!.clone());
  const basement = new Line(
    keep(new BufferGeometry().setFromPoints(basePts)),
    keep(new LineDashedMaterial({ color: COLORS.gold, dashSize: 1.2, gapSize: 0.8, transparent: true, opacity: 0.5 })),
  );
  basement.computeLineDistances();
  scene.add(basement);

  // podium (ground floor, commercial)
  const podium = new Mesh(keep(prism(insetPolygon(floorOutlineM, GROUND_INSET), GROUND_HEIGHT)), keep(new MeshLambertMaterial({ color: COLORS.podium })));
  tower.add(podium);

  // residential floors: one shared slab + band geometry
  const bodyDepth = SLAB_DEPTH - GLAZING_BAND;
  const slabGeo = keep(prism(floorOutlineM, bodyDepth));
  const bandGeo = keep(prism(insetPolygon(floorOutlineM, 0.15), GLAZING_BAND));
  const edgeGeo = keep(new EdgesGeometry(slabGeo, 20));
  const bandMat = keep(new MeshLambertMaterial({ color: COLORS.glaze }));

  interface FloorObj {
    n: number;
    group: Group;
    mat: MeshLambertMaterial;
    edges: LineBasicMaterial;
    slab: Mesh;
  }
  const floors: FloorObj[] = [];
  for (let n = 1; n <= RESIDENTIAL_FLOORS; n++) {
    const group = new Group();
    group.position.y = floorBase(n);
    const mat = keep(new MeshLambertMaterial({ color: COLORS.ivory.clone(), emissive: new Color(0x000000) }));
    const slab = new Mesh(slabGeo, mat);
    slab.userData.floor = n;
    const band = new Mesh(bandGeo, bandMat);
    band.position.y = bodyDepth;
    const edges = keep(new LineBasicMaterial({ color: COLORS.gold, transparent: true, opacity: 0.55 }));
    group.add(slab, band, new LineSegments(edgeGeo, edges));
    tower.add(group);
    floors.push({ n, group, mat, edges, slab });
  }

  // parapet
  const parapet = new Mesh(keep(prism(insetPolygon(floorOutlineM, 0.3), PARAPET)), keep(new MeshLambertMaterial({ color: COLORS.ivory })));
  parapet.position.y = towerTop;
  tower.add(parapet);

  /* ---------- camera rig ---------- */

  const H = towerTop + PARAPET;
  let introP = 1; // S10 scrub progress (1 = final 3/4 view)
  let orbit = 0; // user drag offset (rad)
  let orbitVel = 0;
  let sway = 0;
  const look = { y: H * 0.5 };
  let dist = 140;

  const fit = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    camera.aspect = w / h;
    const vfov = camera.fov * DEG;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    const byHeight = H / 0.85 / (2 * Math.tan(vfov / 2));
    const byWidth = 62 / 0.9 / (2 * Math.tan(hfov / 2));
    dist = Math.max(byHeight, byWidth) + 20;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };

  const placeCamera = () => {
    const az = AZIMUTH + orbit + sway;
    // S10: from near ground level looking up → the 3/4 view
    const el = ELEVATION * (0.15 + 0.85 * introP);
    tower.rotation.y = (1 - introP) * -25 * DEG;
    const cy = look.y + Math.sin(el) * dist - (1 - introP) * (look.y - 8);
    camera.position.set(Math.sin(az) * Math.cos(el) * dist, cy, Math.cos(az) * Math.cos(el) * dist);
    camera.lookAt(0, look.y, 0);
  };

  /* ---------- render on demand ---------- */

  let frame = 0;
  let visible = true;
  let destroyed = false;
  const reduce = () => prefersReducedMotion();
  let swayT0 = performance.now();

  const tick = (now: number) => {
    frame = 0;
    if (destroyed || !visible) return;
    let again = false;
    // inertia after a drag
    if (Math.abs(orbitVel) > 1e-4 && !dragging) {
      orbit = Math.max(-ORBIT_LIMIT, Math.min(ORBIT_LIMIT, orbit + orbitVel));
      orbitVel *= 0.92;
      again = true;
    }
    // idle sway: ±6°, 20 s period, only while visible and motion is allowed
    if (!reduce() && !dragging) {
      sway = Math.sin(((now - swayT0) / 20000) * Math.PI * 2) * 6 * DEG;
      again = true;
    }
    placeCamera();
    renderer.render(scene, camera);
    if (again || tweening > 0) request();
  };
  const request = () => {
    if (!frame && !destroyed) frame = requestAnimationFrame(tick);
  };

  let tweening = 0;
  const tween = (target: object, vars: gsap.TweenVars) => {
    tweening++;
    return gsap.to(target, {
      ...vars,
      duration: reduce() ? 0 : vars.duration,
      onUpdate: request,
      onComplete: () => {
        tweening--;
        request();
      },
    });
  };

  /* ---------- interaction ---------- */

  const ray = new Raycaster();
  const ndc = new Vector2();
  let hover: number | null = null;
  let external: number | null = null;
  let selected: number | null = null;
  let dragging = false;
  let downX = 0;
  let lastX = 0;
  let moved = 0;
  let pendingMove: PointerEvent | null = null;

  const paint = () => {
    const h = hover ?? external;
    for (const f of floors) {
      const on = f.n === h || f.n === selected;
      f.mat.color.copy(on ? COLORS.hover : COLORS.ivory);
      f.mat.emissive.copy(on ? COLORS.gold : new Color(0x000000)).multiplyScalar(on ? 0.15 : 0);
      f.edges.opacity = on ? 1 : 0.55;
    }
    request();
  };

  const pick = (e: { clientX: number; clientY: number }) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(
      floors.map((f) => f.slab),
      false,
    )[0];
    return hit ? (hit.object.userData.floor as number) : null;
  };

  const tmp = new Vector3();
  const anchor = (n: number) => {
    const f = floors.find((x) => x.n === n);
    if (!f) return null;
    // rightmost projected corner of the slab's bounding box, at mid height
    f.slab.geometry.computeBoundingBox();
    const bb = f.slab.geometry.boundingBox!;
    let maxX = -Infinity;
    let sumY = 0;
    const corners = [
      [bb.min.x, bb.min.z],
      [bb.max.x, bb.min.z],
      [bb.min.x, bb.max.z],
      [bb.max.x, bb.max.z],
    ] as const;
    const r = canvas.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    for (const [x, z] of corners) {
      tmp.set(x, bodyDepth / 2, z);
      f.group.localToWorld(tmp);
      tmp.project(camera);
      const sx = ((tmp.x + 1) / 2) * r.width + r.left - s.left;
      maxX = Math.max(maxX, sx);
      sumY += ((1 - tmp.y) / 2) * r.height + r.top - s.top;
    }
    return { x: maxX + 12, y: sumY / 4 };
  };

  const onPointerMove = (e: PointerEvent) => {
    if (dragging) {
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      moved = Math.max(moved, Math.abs(e.clientX - downX));
      orbitVel = (dx / canvas.clientWidth) * Math.PI * 0.6;
      orbit = Math.max(-ORBIT_LIMIT, Math.min(ORBIT_LIMIT, orbit + orbitVel));
      request();
      return;
    }
    if (pendingMove) {
      pendingMove = e;
      return;
    }
    pendingMove = e;
    requestAnimationFrame(() => {
      const ev = pendingMove;
      pendingMove = null;
      if (!ev || destroyed) return;
      const n = pick(ev);
      if (n === hover) return;
      hover = n;
      canvas.style.cursor = n ? 'pointer' : 'grab';
      paint();
      cb.onHover(n, n ? (anchor(n) ?? undefined) : undefined);
    });
  };

  const onPointerDown = (e: PointerEvent) => {
    cb.onInteract();
    dragging = true;
    downX = lastX = e.clientX;
    moved = 0;
    orbitVel = 0;
    if (e.pointerType === 'mouse') canvas.setPointerCapture(e.pointerId);
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    if (moved < 6) {
      const n = pick(e);
      if (n) cb.onPick(n);
    }
    request();
  };

  const onLeave = () => {
    dragging = false;
    if (hover !== null) {
      hover = null;
      paint();
      cb.onHover(null);
    }
  };

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onLeave);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.style.cursor = 'grab';

  /* ---------- lifecycle ---------- */

  const ro = new ResizeObserver(() => {
    fit();
    request();
  });
  ro.observe(host);

  const stopVis = onVisibility(stage, (v) => {
    visible = v && document.visibilityState === 'visible';
    if (visible) {
      swayT0 = performance.now() - (Math.asin(Math.max(-1, Math.min(1, sway / (6 * DEG)))) / (Math.PI * 2)) * 20000;
      request();
    } else if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  });

  const onLost = (e: Event) => {
    e.preventDefault();
    console.warn('[explorer] WebGL context lost; falling back to the SVG model');
    stage.dispatchEvent(new CustomEvent('explorer:fallback'));
  };
  canvas.addEventListener('webglcontextlost', onLost);

  fit();
  placeCamera();
  renderer.render(scene, camera); // first frame before the cross-fade
  // make sure the GPU has produced the frame before the controller fades us in
  await new Promise<void>((r) => requestAnimationFrame(() => r()));

  const adapter: ModelAdapter = {
    preview(n) {
      external = n;
      paint();
    },
    select(n) {
      if (n === selected) return;
      const toward = new Vector3(camera.position.x, 0, camera.position.z).normalize().multiplyScalar(PULL);
      for (const f of floors) {
        const out = f.n === n;
        tween(f.group.position, { x: out ? toward.x : 0, z: out ? toward.z : 0, duration: 0.6, ease: 'power3.out' });
      }
      selected = n;
      tween(look, { y: n ? floorBase(n) + SLAB_DEPTH / 2 : H * 0.5, duration: 0.9, ease: 'power2.inOut' });
      paint();
    },
    setIntro(p) {
      introP = Math.max(0, Math.min(1, p));
      request();
    },
    anchor,
    destroy() {
      destroyed = true;
      if (frame) cancelAnimationFrame(frame);
      ro.disconnect();
      stopVis();
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onLeave);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('webglcontextlost', onLost);
      gsap.killTweensOf([look, ...floors.map((f) => f.group.position)]);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      canvas.remove();
    },
  };
  return adapter;
}

