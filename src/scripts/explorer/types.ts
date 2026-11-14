/** Shared contract between the explorer state machine and its tower stages (photo / SVG maquette fallback). */
/** A chip anchor in stage px: at its left edge, or centred on x when `center` (rev 9: phones, under the band). */
export type Anchor = { x: number; y: number; center?: boolean };

export interface ModelCallbacks {
  /** Pointer hovers a floor (null = none). `at` = tooltip anchor in stage-relative CSS px. */
  onHover: (floor: number | null, at?: Anchor) => void;
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
  anchor(floor: number): Anchor | null;
  destroy(): void;
}

export type Level = 'idle' | 'floor' | 'unit';
