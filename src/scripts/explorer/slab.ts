/**
 * The floor slab (DESIGN §9.7 A3, rev 9): the FLOOR-state stage with WebGL. One extruded plate of the typical floor
 * (0.35 m) with the duotone key plan on top, ivory sides, a soft ground shadow; fov 28, elevation 52°, azimuth −35°,
 * fitted to 86% of the stage; drag turns it ±40° (no auto-turn). The nine units are HTML hotspots projected per frame
 * (decorative: the key plan and chips in the panel are the accessible controls).
 *
 * It also owns the WebGL renderer that the unit dollhouse borrows (one context; `suspend` while the dollhouse draws).
 * Rev 10: with the 3D tower as the stage, the slab borrows the tower's renderer instead (still one context): the one
 * canvas moves into this host whenever the slab or the dollhouse shows, and back to the tower when it shows.
 * Render on demand; nothing runs off-screen or in a hidden tab.
 */
import {
  CanvasTexture,
  NoToneMapping,
  DirectionalLight,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Shape,
  SRGBColorSpace,
  Texture,
  Vector3,
  WebGLRenderer,
} from 'three';
import hotspots from '../../data/keyplan-hotspots.json';
import { gsap, prefersReducedMotion } from '../motion';
import { onVisibility } from '../lazy';

const DEG = Math.PI / 180;
const AZ = -35 * DEG;
const EL = 52 * DEG;
const ORBIT = 40 * DEG;
const DEPTH = 0.35;
const PX = hotspots.pxPerMetre;
// the floor view's key-plan image is the duotone cropped to this viewBox (DESIGN §9.3)
const VIEW = { x: 100, y: 60, w: 1200, h: 1840 };

export interface SlabAdapter {
  renderer: WebGLRenderer;
  /** Show (fade the plate up) or hide; `n` updates which units are to be confirmed on that floor. */
  show(on: boolean): void;
  setTbc(codes: ReadonlySet<string>): void;
  setSelected(code: string | null): void;
  /** Ease the look-at toward a unit before the dollhouse takes over (0.5 s). */
  pushTo(code: string): Promise<void>;
  suspend(on: boolean): void;
  destroy(): void;
}

export async function createSlab(
  host: HTMLElement,
  stage: HTMLElement,
  o: { texture: HTMLImageElement; onUnit: (code: string) => void; onInteract: () => void; renderer?: WebGLRenderer },
): Promise<SlabAdapter> {
  const borrowed = Boolean(o.renderer);
  const renderer = o.renderer ?? new WebGLRenderer({ antialias: window.devicePixelRatio < 2, alpha: true, powerPreference: 'low-power' });
  const canvas = renderer.domElement;
  const mine = () => canvas.parentElement === host;
  /** Take the shared canvas (and the renderer state this stage and the dollhouse expect). */
  const claim = () => {
    if (mine()) return;
    host.appendChild(canvas);
    canvas.className = '';
    renderer.toneMapping = NoToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    fit();
  };
  if (!borrowed) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    canvas.setAttribute('aria-hidden', 'true');
    canvas.tabIndex = -1;
    canvas.style.touchAction = 'pan-y';
    host.appendChild(canvas);
  }

  const outline = hotspots.floorOutline.map(([x = 0, y = 0]) => [x, y] as const);
  const xs = outline.map((p) => p[0]);
  const ys = outline.map((p) => p[1]);
  const cxPx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cyPx = (Math.min(...ys) + Math.max(...ys)) / 2;
  const toM = ([x, y]: readonly [number, number]) => [(x - cxPx) / PX, (y - cyPx) / PX] as const;
  const ring = outline.map(toM);
  const R = Math.max(...ring.map(([x, z]) => Math.hypot(x, z)));

  const scene = new Scene();
  const camera = new PerspectiveCamera(28, 1, 1, 400);
  const plate = new Group();
  scene.add(plate);
  const keep: { dispose(): void }[] = [];
  const k = <T extends { dispose(): void }>(x: T) => (keep.push(x), x);

  // the plate: caps carry the key plan (UVs from metres → the floor view's crop), sides ivory
  const shape = new Shape();
  ring.forEach(([x, z], i) => (i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)));
  const geo = k(new ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: false }).rotateX(-Math.PI / 2));
  const pos = geo.getAttribute('position');
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i) * PX + cxPx;
    const py = pos.getZ(i) * PX + cyPx;
    uv[i * 2] = (px - VIEW.x) / VIEW.w;
    uv[i * 2 + 1] = 1 - (py - VIEW.y) / VIEW.h;
  }
  geo.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  const tex = k(new Texture(o.texture));
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  tex.needsUpdate = true;
  plate.add(new Mesh(geo, [k(new MeshBasicMaterial({ map: tex })), k(new MeshLambertMaterial({ color: '#FBF7F2' }))]));

  // soft ground shadow (no visible edge)
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  g.addColorStop(0, 'rgba(11,18,32,0.6)');
  g.addColorStop(1, 'rgba(11,18,32,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const ground = new Mesh(
    k(new PlaneGeometry(R * 2.6, R * 2.6).rotateX(-Math.PI / 2)),
    k(new MeshBasicMaterial({ map: k(new CanvasTexture(c)), transparent: true, depthWrite: false })),
  );
  ground.position.y = -0.45;
  scene.add(ground);
  scene.add(new HemisphereLight('#FFF4E6', '#1A273F', 2.4));
  const sun = new DirectionalLight('#FFE3BD', 1.6);
  sun.position.set(-20, 40, -10);
  scene.add(sun);

  /* ---------- camera ---------- */
  const cam = { az: AZ, x: 0, z: 0 };
  let d = 80;
  const fit = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const half = Math.atan(Math.tan((camera.fov * DEG) / 2) * Math.min(1, camera.aspect));
    d = R / Math.sin(Math.atan(0.86 * Math.tan(half)));
    renderer.setSize(w, h, false);
  };
  const place = () => {
    const ce = Math.cos(EL);
    // rev 10.3: azimuth from +z (the plan's bottom, "south") toward −x, as the 3D tower: no jump between stages
    camera.position.set(cam.x + Math.sin(cam.az) * ce * d, Math.sin(EL) * d, cam.z + Math.cos(cam.az) * ce * d);
    camera.lookAt(cam.x, 0, cam.z);
  };

  /* ---------- unit hotspots (HTML, projected per frame) ---------- */
  const layer = document.createElement('div');
  layer.className = 'slab-spots';
  layer.setAttribute('aria-hidden', 'true');
  stage.append(layer);
  const units = Object.entries(hotspots.units as Record<string, { centroid: number[] }>).map(([code, u]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.tabIndex = -1;
    b.className = 'slab-spot';
    b.textContent = code;
    b.addEventListener('click', () => o.onUnit(code));
    layer.append(b);
    const [x, z] = toM([u.centroid[0] ?? 0, u.centroid[1] ?? 0]);
    return { code, b, at: new Vector3(x, DEPTH + 0.02, z) };
  });
  const v = new Vector3();
  const project = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    for (const u of units) {
      v.copy(u.at);
      plate.localToWorld(v);
      v.project(camera);
      u.b.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px) translate(-50%, -50%)`;
    }
  };

  /* ---------- render on demand ---------- */
  let frame = 0;
  let visible = true;
  let suspended = false;
  let destroyed = false;
  let tweening = 0;
  let dragging = false;
  let vel = 0;
  const tick = () => {
    frame = 0;
    if (destroyed || !visible || suspended || !mine()) return;
    let again = tweening > 0;
    if (!dragging && Math.abs(vel) > 1e-4) {
      cam.az = Math.max(AZ - ORBIT, Math.min(AZ + ORBIT, cam.az + vel));
      vel *= 0.9;
      again = true;
    }
    place();
    renderer.render(scene, camera);
    project();
    if (again) request();
  };
  const request = () => {
    if (!frame && !destroyed) frame = requestAnimationFrame(tick);
  };
  const run = (target: object, vars: gsap.TweenVars) => {
    tweening++;
    return gsap.to(target, {
      ...vars,
      duration: prefersReducedMotion() ? 0 : vars.duration,
      onUpdate: request,
      onComplete() {
        tweening--;
        (vars.onComplete as (() => void) | undefined)?.();
        request();
      },
    });
  };

  // drag ±40° with inertia; vertical swipes keep scrolling the page (touch-action: pan-y)
  let lastX = 0;
  const onDown = (e: PointerEvent) => {
    if (suspended || !mine()) return;
    o.onInteract();
    dragging = true;
    lastX = e.clientX;
    vel = 0;
    if (e.pointerType === 'mouse') canvas.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging || suspended) return;
    vel = -((e.clientX - lastX) / canvas.clientWidth) * Math.PI * 0.6;
    lastX = e.clientX;
    cam.az = Math.max(AZ - ORBIT, Math.min(AZ + ORBIT, cam.az + vel));
    request();
  };
  const onUp = (e: PointerEvent) => {
    dragging = false;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    request();
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.style.cursor = 'grab';
  const onLost = (e: Event) => {
    e.preventDefault();
    console.warn('[explorer] WebGL context lost; falling back to the photo stage');
    stage.dispatchEvent(new CustomEvent('explorer:fallback'));
  };
  canvas.addEventListener('webglcontextlost', onLost);

  const ro = new ResizeObserver(() => {
    if (suspended || !mine()) return; // the dollhouse (or the tower) sizes the shared canvas meanwhile
    fit();
    request();
  });
  ro.observe(host);
  const stopVis = onVisibility(stage, (vis) => {
    visible = vis && document.visibilityState === 'visible';
    if (visible) request();
  });

  if (mine()) fit();
  place();
  plate.position.y = -0.4;
  if (mine()) renderer.render(scene, camera);
  await new Promise<void>((r) => requestAnimationFrame(() => r()));

  return {
    renderer,
    show(on) {
      layer.classList.toggle('is-on', on);
      if (on) {
        claim();
        plate.position.y = -0.4; // it rises 0.4 m as it fades in
        cam.x = cam.z = 0;
        run(plate.position, { y: 0, duration: 0.6, ease: 'power3.out' });
      }
      request();
    },
    setTbc(codes) {
      units.forEach((u) => u.b.toggleAttribute('data-tbc', codes.has(u.code)));
    },
    setSelected(code) {
      units.forEach((u) => u.b.classList.toggle('is-selected', u.code === code));
    },
    pushTo(code) {
      const u = units.find((x) => x.code === code);
      if (!u) return Promise.resolve();
      return new Promise<void>((resolve) => {
        run(cam, { x: u.at.x * 0.6, z: u.at.z * 0.6, duration: 0.5, ease: 'power2.inOut', onComplete: resolve });
      });
    },
    suspend(on) {
      if (on) claim(); // the dollhouse is about to draw here (un-suspending must not take the canvas from the tower)
      suspended = on;
      dragging = false;
      layer.hidden = on;
      if (on) {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
      } else {
        canvas.style.cursor = 'grab';
        cam.x = cam.z = 0;
        fit();
        request();
      }
    },
    destroy() {
      destroyed = true;
      if (frame) cancelAnimationFrame(frame);
      ro.disconnect();
      stopVis();
      gsap.killTweensOf([cam, plate.position]);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('webglcontextlost', onLost);
      layer.remove();
      keep.forEach((x) => x.dispose());
      if (!borrowed) {
        renderer.dispose();
        canvas.remove();
      }
    },
  };
}
