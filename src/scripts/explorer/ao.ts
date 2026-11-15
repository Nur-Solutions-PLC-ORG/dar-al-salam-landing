/**
 * Desktop ambient occlusion for the dollhouse (DESIGN §9.10 F5, rev 10): three's own GTAOPass (full resolution: half
 * resolution left grainy halos around edges),
 * radius 0.5 m, drawn only while the camera rests (orbit and tweens render without it). A lazy chunk; phones never
 * load it (they keep the rev 9 gradient strips). The composer renders into a 4× MSAA half-float target, and
 * OutputPass applies the renderer's tone mapping and sRGB.
 */
import { HalfFloatType, WebGLRenderTarget, type Camera, type Scene, type WebGLRenderer } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export interface Ao {
  render(): void;
  setSize(w: number, h: number): void;
  dispose(): void;
}

export function createAo(renderer: WebGLRenderer, scene: Scene, camera: Camera, w: number, h: number): Ao {
  const target = new WebGLRenderTarget(w, h, { type: HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const gtao = new GTAOPass(scene, camera, w, h);
  // design (F5 tuning): twice as strong, so corners and the bases of furniture show a soft shadow at rest
  gtao.updateGtaoMaterial({ radius: 0.5, distanceExponent: 1.5, thickness: 1, scale: 1.6, samples: 16 });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
  gtao.blendIntensity = 1;
  composer.addPass(gtao);
  composer.addPass(new OutputPass());
  const size = (cw: number, ch: number) => {
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(cw, ch);
    gtao.setSize(cw * renderer.getPixelRatio(), ch * renderer.getPixelRatio()); // full resolution: half left grainy halos
  };
  size(w, h);
  return {
    render: () => composer.render(),
    setSize: size,
    dispose() {
      gtao.dispose();
      composer.dispose();
      target.dispose();
    },
  };
}
