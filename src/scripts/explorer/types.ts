/** Shared contract between the explorer state machine and its model tiers (SVG / Three.js). */
export interface ModelCallbacks {
  /** Pointer hovers a floor (null = none). `at` = tooltip anchor in stage-relative CSS px. */
  onHover: (floor: number | null, at?: { x: number; y: number }) => void;
  /** Pointer picks a floor. */
  onPick: (floor: number) => void;
  /** First user interaction with the model (hides the hint chip). */
  onInteract: () => void;
}

export interface ModelAdapter {
  /** Highlight a floor from outside (floor list / stepper hover). */
  preview(floor: number | null): void;
  /** Pull out the selected floor (null = none). */
  select(floor: number | null): void;
  /** S10 intro progress 0 → 1 (desktop scrub). */
  setIntro?(progress: number): void;
  /** Screen anchor for a floor's tooltip, stage-relative px. */
  anchor(floor: number): { x: number; y: number } | null;
  /** Tier 2 only (rev 8): the shared renderer for the unit dollhouse (one WebGL context). */
  renderer?: import('three').WebGLRenderer;
  /** Tier 2 only (rev 8): stop rendering and ignore the pointer while the dollhouse owns the canvas. */
  suspend?(on: boolean): void;
  destroy(): void;
}

export type Level = 'idle' | 'floor' | 'unit';
