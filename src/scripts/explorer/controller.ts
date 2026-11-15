/**
 * Tower explorer state machine (DESIGN §9.2). Lazy-loaded by loader.ts.
 *
 *   IDLE ──hover/focus──▶ preview(n)            Back/Esc: UNIT → FLOOR → IDLE
 *     └─click/Enter/View─▶ FLOOR(n) ──hotspot/chip──▶ UNIT(n, code)
 *
 * URL: #explore · #explore/f7 · #explore/f7/bl05 (· /3d or /plan, rev 8) via history.replaceState (shareable, never scrolls).
 * The DOM is server-rendered; this module only toggles views/classes and drives a model tier
 * (rev 9: the photoreal tower stage first; from FLOOR state the WebGL slab when available, see loadScene();
 * the SVG maquette is fetched only if the render fails).
 */
import { gsap, ScrollTrigger, prefersReducedMotion, scrollToTarget } from '../motion';
import { prefersLightweight, supportsWebGL, onVisibility } from '../lazy';
import { createSvgModel } from './svg-model';
import { createPhotoModel } from './photo-model';
import { toast } from '../toast';
import type { Anchor, Level, ModelAdapter, ModelCallbacks } from './types';
import css3d from '../../styles/explore3d.css?inline';

const CODES = ['BL01', 'BL02', 'BL03', 'BL04', 'BL05', 'BL06', 'BL07', 'BL08', 'BL09'] as const;
type Code = (typeof CODES)[number];

type I18n = Record<
  | 'floorN'
  | 'viewFloor'
  | 'keyplanLabel'
  | 'requestFor'
  | 'unitOnFloor'
  | 'backToFloor'
  | 'floorTooltip'
  | 'bedShort'
  | 'hintTouch'
  | 'hintPointer'
  | 'hintHover'
  | 'tbc'
  | 'tbcAria'
  | 'tbcBody'
  | 'seeOn'
  | 'view3d'
  | 'viewPlan'
  | 'viewLabel'
  | 'towerHover'
  | 'towerTap'
  | 'towerLoad'
  | 'towerDrag'
  | 'towerNote'
  | 'towerPlanned',
  string
>;

type View = 'plan' | '3d';

const f = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));

interface State {
  level: Level;
  floor: number;
  unit: Code | null;
  /** Rev 8: the visitor's explicit "3D | Plan" choice (null = the default rule, DESIGN §9.6.2). */
  pref?: View | null;
  /** Rev 9: walk-in mode, the room the visitor stands in (#explore/f7/bl05/3d/in/living). */
  walk?: string | null;
}

export function createExplorer(root: HTMLElement) {
  const $ = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel);
  const $$ = <T extends Element = HTMLElement>(sel: string) => Array.from(root.querySelectorAll<T>(sel));
  const t = JSON.parse(root.dataset.i18n ?? '{}') as I18n;
  const style = document.createElement('style');
  style.textContent = css3d;
  document.head.append(style);

  const stage = $('[data-stage]')!;
  const panel = $('[data-panel]')!;
  const tooltip = $('[data-tooltip]')!;
  const hint = $('[data-hint]')!;
  const views = new Map($$('[data-view]').map((v) => [v.dataset.view as Level, v]));
  const floorRows = $$<HTMLButtonElement>('.floors__row');
  // per plan floor, server-rendered on the floor list: composition text + positions still to be confirmed
  const rowOf = (n: number) => floorRows.find((r) => Number(r.dataset.floor) === n);
  const FLOORS = floorRows.length || 14;
  const mixOf = (n: number) => rowOf(n)?.querySelector('.floors__mix')?.textContent?.trim() ?? '';
  const tbcOf = (n: number) => new Set((rowOf(n)?.dataset.tbc ?? '').split(' ').filter(Boolean));
  const hotspots = $$<SVGAElement>('.hotspot');
  const chips = $$<HTMLButtonElement>('.chip');
  const cards = new Map($$('[data-unit-card]').map((c) => [c.dataset.unitCard as Code, c]));
  const keyplan = $('[data-keyplan]')!;
  const keyplanSvg = $<SVGSVGElement>('[data-keyplan-svg]');
  const pill = $('[data-keyplan-pill]')!;
  const tbcCard = $('[data-unit-tbc]');
  // server-rendered accessible names of the hotspots (a TBC position swaps to t.tbcAria)
  const stdAria = new Map(hotspots.map((h) => [h.dataset.unit, h.getAttribute('aria-label') ?? '']));
  /** Floors where `code` is confirmed, read from the floor rows' data-tbc. */
  const confirmedFloors = (code: Code) =>
    floorRows.map((r) => Number(r.dataset.floor)).filter((n) => !tbcOf(n).has(code)).sort((a, b) => a - b);
  /** Nearest confirmed floor; ties go to the lower floor (DESIGN §9.2 rev 5: 1–5 → 4, 7 → 6, 12–14 → 11). */
  const nearestFloor = (n: number, code: Code) =>
    confirmedFloors(code).reduce<number | null>((best, f) => (best === null || Math.abs(f - n) < Math.abs(best - n) ? f : best), null) ?? n;
  const isTbc = (code: string | null, n = state.floor) => Boolean(code && tbcOf(n).has(code));

  // unit facts for pills, read once from the hotspot labels the server rendered
  const unitInfo = new Map(
    hotspots.map((h) => {
      const code = h.dataset.unit as Code;
      const chip = chips.find((c) => c.dataset.unit === code);
      return [code, chip?.dataset.pill ?? ''];
    }),
  );

  const state: State = { level: 'idle', floor: 1, unit: null };
  let introProgress = 1; // S10 scrub progress, handed to the 3D scene when it arrives
  let previewFloor = 1; // stepper / list preview while idle

  /* ---------- model tiers ---------- */

  const callbacks: ModelCallbacks = {
    onHover: (n, at) => {
      setPreview(n, false);
      showTooltip(n, at);
    },
    onPick: (n) => go({ level: 'floor', floor: n, unit: null }, { focus: false, scroll: true }),
    onInteract: () => hint.setAttribute('data-done', ''),
  };

  // rev 9: the photoreal tower stage is the first view on every tier. If the render fails to load, the SVG maquette is
  // fetched (/explorer/maquette.svg, A4: not in the page HTML) and wired as the stage instead.
  const photo = $('[data-tstage]');
  const photoImg = photo?.querySelector('img');
  const ground = (at: Anchor | null) => {
    if (!at) {
      if (tooltip.hasAttribute('data-muted')) tooltip.hidden = true;
      return;
    }
    tooltip.textContent = photo?.dataset.groundLabel ?? "";
    tooltip.setAttribute('data-muted', '');
    placeTooltip(at);
  };
  const usePhoto = () => Boolean(photo && photoImg && !(photoImg.getAttribute('src') && photoImg.complete && photoImg.naturalWidth === 0)); // no src yet = still gated
  /** A model that does nothing (no visual stage): the floor list and stepper keep working. */
  const noModel: ModelAdapter = { preview() {}, select() {}, anchor: () => null, destroy() {} };
  let model: ModelAdapter = usePhoto() ? createPhotoModel(photo!, stage, { ...callbacks, onGround: ground }) : noModel;
  stage.dataset.tier = usePhoto() ? 'photo' : 'svg';
  const useMaquette = () => {
    model.destroy();
    model = noModel;
    if (photo) photo.hidden = true;
    stage.dataset.tier = 'svg';
    fetch('/explorer/maquette.svg')
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`maquette ${r.status}`))))
      .then((text) => {
        stage.insertAdjacentHTML('afterbegin', text);
        const svg = stage.querySelector<SVGSVGElement>('[data-maquette]');
        if (!svg || model !== noModel) return;
        model = createSvgModel(svg, stage, callbacks);
        model.select(state.level === 'idle' ? null : state.floor);
      })
      .catch((err: unknown) => console.warn('[explorer] no tower visual; the floor list stays the control', err));
  };
  if (photo && !usePhoto()) useMaquette(); // the render already failed
  else if (!photo) useMaquette();
  photoImg?.addEventListener('error', () => stage.dataset.tier === 'photo' && useMaquette(), { once: true });

  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const webgl = supportsWebGL();
  const setHint = (text: string) => {
    hint.textContent = text;
    hint.hidden = false;
  };
  setHint(stage.dataset.tier === 'photo' ? (fine ? t.towerHover : t.towerTap) : fine ? t.hintHover : t.hintTouch);

  /* ---------- rev 9 (A3): the WebGL floor slab, FLOOR state onward; it owns the renderer the dollhouse borrows ---------- */
  let gl: import('./slab').SlabAdapter | null = null;
  let scenePromise: Promise<boolean> | null = null;
  /** The floor view's key-plan image (the slab's texture), loaded now if the floor view hasn't shown it yet. */
  const keyplanImage = async () => {
    const el = keyplan.querySelector('img');
    if (!el) throw new Error('no key-plan image');
    // the panel's own <img> may still be lazy in a hidden view: load its best source into a fresh image
    el.loading = 'eager';
    const pick = el.currentSrc || el.srcset.split(',').pop()?.trim().split(' ')[0] || el.src;
    const img = new Image();
    img.decoding = 'async';
    img.src = pick;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`key-plan image failed: ${pick}`));
    });
    return img;
  };
  /** The 3D tower's renderer, once it is up (tier 2); otherwise the slab makes its own. */
  const sharedRenderer = async () => {
    if (!towerWanted) return undefined;
    syncTower();
    await towerJob;
    return tower?.renderer;
  };
  /** Tier 2; resolves false when it can't run (the photo stage stays). */
  const loadScene = () =>
    (scenePromise ??= (Promise.all([import('./slab'), keyplanImage(), sharedRenderer()])
      .then(([{ createSlab }, texture, renderer]) =>
        createSlab(host, stage, {
          texture,
          renderer, // rev 10: one WebGL context — the slab and the dollhouse borrow the 3D tower's renderer
          onUnit: (code) => pickUnit(code as Code, false),
          onInteract: () => hint.setAttribute('data-done', ''),
        }),
      )
      .then((slab) => {
        gl = slab;
        ScrollTrigger.refresh();
        syncSlab();
        void syncView(); // a unit waiting for 3D (deep link, or the default once tier 2 arrives)
        return true;
      })
      .catch((err: unknown) => {
        console.warn('[explorer] 3D unavailable, keeping the photo stage', err);
        // review r6 #2b: no tier 2 means no unit 3D either: stop offering the toggle
        failed3d = true;
        renderToggle();
        return false;
      })));

  /**
   * The slab shows from FLOOR state on (tier 2: WebGL, no Save-Data, not a slow connection or low memory). Coming from
   * the tower it waits for the push-in and lift (A2), then cross-fades in (0.45 s, CSS); back to the tower it goes first.
   */
  let slabTimer = 0;
  let prevLevel: Level = 'idle';
  let leftTowerAt = 0; // when the visitor left the tower view (the push-in + lift take ~1.25 s)
  function syncSlab() {
    // with the 3D tower as the stage, the floor shows inside it (T5); the slab canvas only hosts the unit dollhouse
    // (and only once the dollhouse exists: the slab's own key-plan plate must never show in its place)
    const want = tower ? state.level === 'unit' && viewFor() === '3d' && Boolean(dh) : state.level !== 'idle';
    if (want && !gl && webgl && !failed3d && !prefersLightweight()) void loadScene();
    clearTimeout(slabTimer);
    if (gl) {
      gl.setTbc(new Set(CODES.filter((c) => isTbc(c))));
      gl.setSelected(state.level === 'unit' ? state.unit : null);
    }
    const on = want && Boolean(gl);
    if (on === stage.hasAttribute('data-slab')) return;
    const apply = () => {
      stage.toggleAttribute('data-slab', on);
      gl?.show(on);
    };
    // the photo's push-in and lift take ~1.25 s; the 3D tower hands over to the dollhouse at once (T5)
    const wait = on && !prefersReducedMotion() && !tower ? 1250 - (performance.now() - leftTowerAt) : 0;
    if (wait > 0) slabTimer = window.setTimeout(apply, wait);
    else apply();
  }
  /**
   * Rev 10 (T1–T6): the real 3D tower is the explorer's first view on tier 2 (WebGL2, no Save-Data, not a slow
   * connection, deviceMemory ≥ 4). The photo stage paints first and stays as the fallback; the tower cross-fades over
   * it with its first frame and becomes the tower stage (`model`). Tier 1 keeps the photo with a "Load the 3D tower"
   * button; tier 0 (no WebGL) and any failure keep the photo.
   */
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const towerTier = !webgl ? 0 : !prefersLightweight() && memory >= 4 ? 2 : 1;
  let towerWanted = towerTier === 2;
  let tower: import('./tower3d').TowerAdapter | null = null;
  let towerJob: Promise<void> | null = null;
  let towerFailed = false; // review r9a M3: after a failure the photo stage stays (no load button)
  let towerHide = 0;
  let loadBtn: HTMLButtonElement | null = null;
  let towerNote: HTMLElement | null = null;
  function syncTower() {
    if (!photo || towerTier === 0 || towerFailed || stage.dataset.tier !== 'photo') return;
    if (!towerWanted) {
      // tier 1: offer it
      if (!loadBtn) {
        loadBtn = document.createElement('button');
        loadBtn.type = 'button';
        loadBtn.className = 'btn btn--secondary tower-load';
        loadBtn.textContent = t.towerLoad;
        loadBtn.addEventListener('click', () => {
          towerWanted = true;
          loadBtn?.remove();
          syncTower();
        });
        stage.append(loadBtn);
      }
      loadBtn.hidden = state.level !== 'idle';
      return;
    }
    towerJob ??= import('./tower3d')
      .then((m) =>
        m.createTower(photo, stage, {
          ...callbacks,
          label: (n) => f(t.floorTooltip, { n, mix: mixOf(n) }),
          plannedLabel: t.towerPlanned,
          unitLabel: (code) => `${code} · ${isTbc(code) ? t.tbc : (unitInfo.get(code as Code) ?? '')}`,
          onUnit: (code) => pickUnit(code as Code, false),
          onFail: () => {
            tower?.destroy();
            tower = null;
            towerWanted = false; // no retry this session; the photo stage stays
            towerFailed = true;
            failed3d = true; // review r9a note: no fresh WebGL (slab, dollhouse) after a loss; the photo and 2D plan stay
            loadBtn?.remove();
            towerNote?.remove();
            setHint(fine ? t.towerHover : t.towerTap);
            model = createPhotoModel(photo, stage, { ...callbacks, onGround: ground });
            model.select(state.level === 'idle' ? null : state.floor);
          },
        }),
      )
      .then((tw) => {
        tower = tw;
        model.destroy(); // the photo stays underneath as the first paint and the fallback
        model = tw;
        tw.select(state.level === 'idle' ? null : state.floor);
        syncSlab(); // review r9a M2: a slab shown before the tower arrived (a floor deep link) gives way to it
        // T7: the hint, and a muted note under the stage
        setHint(t.towerDrag);
        towerNote = document.createElement('p');
        towerNote.className = 'explore__strip small muted';
        towerNote.textContent = t.towerNote;
        $('.explore__strip')?.after(towerNote);
        syncTower();
      })
      .catch((err: unknown) => console.warn('[explorer] 3D tower unavailable; keeping the photo stage', err));
    // T5: the assembled floor marks the chosen unit and hatches the ones to be confirmed
    tower?.setTbc(new Set(CODES.filter((c) => isTbc(c))));
    tower?.selectUnit(state.level === 'unit' ? state.unit : null);
    // it keeps drawing through the push-in and slide-out, and rests once the dollhouse has covered it
    clearTimeout(towerHide);
    if (state.level === 'idle' || !stage.hasAttribute('data-slab')) tower?.show(true);
    else if (tower) towerHide = window.setTimeout(() => stage.hasAttribute('data-slab') && tower?.show(false), 2600);
  }

  // context loss → the photo stage (pushed in on the floor) stays; no WebGL for the rest of the session
  stage.addEventListener('explorer:fallback', () => {
    // review r8 L6: the dollhouse or the walk was on screen → say so (§9.8 "3D view stopped")
    if (dh || state.walk) void strings?.then((s) => toast((s as unknown as { walk: Record<string, string> }).walk.stopped ?? ''));
    fail3d();
    gl?.destroy();
    gl = null;
    stage.removeAttribute('data-slab');
    // the plan shows now: drop a /3d from the hash (the same rule as the first render, review r6 #4)
    if (location.hash.startsWith('#explore')) history.replaceState(null, '', `${location.pathname}${location.search}${hashFor(state)}`);
  });

  /* ---------- tooltip / preview ---------- */

  function placeTooltip(p: Anchor) {
    // a centred chip (phones, under the band) stays inside the stage; a left-anchored one keeps 140 px of room
    const w = stage.clientWidth;
    const x = p.center ? Math.min(Math.max(p.x, 90), w - 90) : Math.min(p.x, w - 140);
    tooltip.toggleAttribute('data-center', Boolean(p.center));
    tooltip.style.setProperty('--tx', `${x}px`);
    tooltip.style.setProperty('--ty', `${p.y}px`);
    tooltip.hidden = false;
  }

  function showTooltip(n: number | null, at?: Anchor) {
    if (!n) {
      tooltip.hidden = true;
      return;
    }
    const p = at ?? model.anchor(n);
    if (!p) return;
    tooltip.removeAttribute('data-muted');
    tooltip.textContent = f(t.floorTooltip, { n, mix: mixOf(n) });
    placeTooltip(p);
  }

  function setPreview(n: number | null, fromList: boolean) {
    floorRows.forEach((r) => r.classList.toggle('is-preview', Number(r.dataset.floor) === n));
    if (fromList) model.preview(n);
    if (n && state.level === 'idle') {
      previewFloor = n;
      renderStepper();
    }
  }

  /* ---------- rendering ---------- */

  function renderStepper() {
    const n = state.level === 'idle' ? previewFloor : state.floor;
    $$('[data-stepper-label]').forEach((el) => (el.textContent = f(t.floorN, { n })));
    $$('[data-view-floor] .btn__text').forEach((el) => (el.textContent = f(t.viewFloor, { n })));
    $$<HTMLButtonElement>('[data-step="-1"]').forEach((b) => (b.disabled = n <= 1));
    $$<HTMLButtonElement>('[data-step="1"]').forEach((b) => (b.disabled = n >= FLOORS));
  }

  function renderHotspots() {
    hotspots.forEach((h) => h.classList.toggle('is-selected', h.dataset.unit === state.unit));
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.unit === state.unit)));
    if (state.unit) keyplan.setAttribute('data-has-selection', '');
    else keyplan.removeAttribute('data-has-selection');
    showPill(state.unit, true);
  }

  function showPill(code: string | null, selected: boolean) {
    const h = hotspots.find((x) => x.dataset.unit === code);
    if (!code || !h) {
      pill.hidden = true;
      return;
    }
    pill.textContent = `${code} · ${isTbc(code) ? t.tbc : (unitInfo.get(code as Code) ?? '')}`;
    pill.style.setProperty('--x', h.style.getPropertyValue('--cx'));
    pill.style.setProperty('--y', h.style.getPropertyValue('--cy'));
    pill.toggleAttribute('data-selected', selected);
    pill.hidden = false;
  }

  /** The article shown for UNIT(n, code): the TBC card on a floor where the home isn't confirmed. */
  const activeCard = () => (isTbc(state.unit) ? tbcCard : state.unit ? cards.get(state.unit) : undefined);

  function renderUnit() {
    const where = state.unit ? f(t.unitOnFloor, { n: state.floor, code: state.unit }) : '';
    const tbc = isTbc(state.unit);
    if (tbcCard) {
      tbcCard.hidden = !tbc;
      if (tbc && state.unit) {
        const code = state.unit;
        const m = nearestFloor(state.floor, code);
        tbcCard.querySelector('[data-unit-where]')!.textContent = where;
        tbcCard.querySelector('[data-tbc-body]')!.textContent = f(t.tbcBody, { n: state.floor });
        const see = tbcCard.querySelector<HTMLElement>('[data-see-confirmed]')!;
        see.dataset.floor = String(m);
        see.querySelectorAll('.btn__text').forEach((el) => (el.textContent = f(t.seeOn, { code, n: m })));
      }
    }
    cards.forEach((card, code) => {
      const on = code === state.unit && !tbc;
      card.hidden = !on;
      if (!on) return;
      const w = card.querySelector('[data-unit-where]');
      if (w) w.textContent = where;
      // visible label stays "Request pricing"; the full "…for Floor 7 · BL05" is the accessible name
      card.querySelector('[data-request]')?.setAttribute('aria-label', f(t.requestFor, { n: state.floor, code }));
    });
    $$('[data-back-floor-text]').forEach((el) => (el.textContent = f(t.backToFloor, { n: state.floor })));
  }

  function renderCrumbs() {
    const crumbs = $('[data-crumbs]')!;
    crumbs.hidden = state.level === 'idle';
    const floorLi = $('[data-crumb-floor-li]')!;
    const unitLi = $('[data-crumb-unit-li]')!;
    floorLi.hidden = state.level === 'idle';
    unitLi.hidden = state.level !== 'unit';
    const floorBtn = $('[data-crumb="floor"]')!;
    floorBtn.textContent = f(t.floorN, { n: state.floor });
    if (state.level === 'floor') floorBtn.setAttribute('aria-current', 'location');
    else floorBtn.removeAttribute('aria-current');
    $('[data-crumb-unit]')!.textContent = state.unit ?? '';
  }

  let activeView: HTMLElement | undefined;
  function renderView(animate: boolean) {
    const next = views.get(state.level);
    if (!next || next === activeView) return;
    views.forEach((v) => v.classList.toggle('is-active', v === next));
    activeView = next;
    if (!animate) return;
    const reduce = prefersReducedMotion();
    gsap.fromTo(
      next,
      // opacity only (never visibility): the focus() that follows must land inside this view (review M2-H1)
      { opacity: 0, x: reduce ? 0 : 24 },
      { opacity: 1, x: 0, duration: reduce ? 0.2 : 0.5, ease: 'power3.out', clearProps: 'opacity,transform' },
    );
  }

  function render(animate = true) {
    root.dataset.state = state.level;
    $('[data-floor-title]')!.textContent = f(t.floorN, { n: state.floor });
    // rev 5: positions not confirmed on this floor (BL01 off floors 4, 6, 8, 10, 11) — in text, not only the hatch
    hotspots.forEach((h) => {
      const tbc = isTbc(h.dataset.unit ?? null);
      h.toggleAttribute('data-tbc', tbc);
      h.setAttribute('aria-label', tbc ? f(t.tbcAria, { code: h.dataset.unit ?? '', n: state.floor }) : (stdAria.get(h.dataset.unit) ?? ''));
    });
    chips.forEach((c) => c.toggleAttribute('data-tbc', isTbc(c.dataset.unit ?? null)));
    keyplanSvg?.setAttribute('aria-label', f(t.keyplanLabel, { n: state.floor, mix: mixOf(state.floor) }));
    renderView(animate);
    renderStepper();
    renderHotspots();
    renderUnit();
    renderCrumbs();
    renderToggle();
    model.select(state.level === 'idle' ? null : state.floor);
    model.preview(state.level === 'idle' ? null : state.floor);
    if (prevLevel === 'idle' && state.level !== 'idle') leftTowerAt = performance.now();
    syncSlab();
    syncTower();
    prevLevel = state.level;
    void syncView();
  }

  /* ---------- rev 8: the unit dollhouse (DESIGN §9.6) ---------- */

  const host = $('[data-canvas]')!;
  const has3d = (code: Code | null) => Boolean(code && cards.get(code)?.hasAttribute('data-has3d'));
  let failed3d = false; // any failure hides the toggle for the session
  /** 3D can be offered at all for the current unit. */
  const can3d = () => webgl && !failed3d && state.level === 'unit' && has3d(state.unit) && !isTbc(state.unit);
  /** The view the current unit shows (the default rule unless the visitor chose). */
  const viewFor = (): View => {
    if (!can3d()) return 'plan';
    if (state.pref) return state.pref;
    // tier 2 is up once the slab or the 3D tower runs (with the tower, the slab loads for the dollhouse on demand)
    return (gl || tower) && !prefersReducedMotion() && !prefersLightweight() ? '3d' : 'plan';
  };

  // the "3D | Plan" radiogroup, built per card on first use (it shows only when 3D can run)
  const toggles = new Map<Code, HTMLElement>();
  function toggleFor(code: Code) {
    let g = toggles.get(code);
    if (g) return g;
    g = document.createElement('div');
    g.className = 'viewtoggle';
    g.setAttribute('role', 'radiogroup');
    g.setAttribute('aria-label', t.viewLabel);
    for (const v of ['3d', 'plan'] as const) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'viewtoggle__btn';
      b.setAttribute('role', 'radio');
      b.dataset.v = v;
      b.textContent = v === '3d' ? t.view3d : t.viewPlan;
      b.addEventListener('click', () => choose(v, false));
      b.addEventListener('keydown', (e) => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
        e.preventDefault();
        choose(v === '3d' ? 'plan' : '3d', true);
      });
      g.append(b);
    }
    cards.get(code)!.querySelector('.unit__body')!.prepend(g);
    toggles.set(code, g);
    return g;
  }
  function renderToggle() {
    toggles.forEach((g) => (g.hidden = true));
    if (!can3d() || !state.unit) return;
    const g = toggleFor(state.unit);
    g.hidden = false;
    const v = viewFor();
    g.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
      const on = b.dataset.v === v;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    });
  }
  function choose(v: View, focus: boolean) {
    go({ ...state, pref: v });
    if (focus) toggleFor(state.unit!).querySelector<HTMLButtonElement>(`[data-v="${v}"]`)?.focus();
  }

  let dh: import('./unit3d').Dollhouse | null = null;
  let dhCode: Code | null = null;
  let viewJob = 0; // newest transition wins
  let strings: Promise<import('./unit3d-panel').PanelStrings> | null = null;
  let rooms: import('./unit3d-panel').RoomsPanel | null = null;
  let room: string | null = null;
  /** U5: select a room (hotspot, list or a tap on its floor); the same room again, or null, deselects. */
  const selectRoom = (id: string | null) => {
    if (state.walk && id) {
      if (id !== state.walk) go({ ...state, walk: id }); // walking: the room list moves you there
      return;
    }
    if (id && id === room) id = null;
    room = id;
    dh?.select(id);
    rooms?.select(id);
    if (id) rooms?.hideHint();
  };
  window.addEventListener('unit3d:room', (e) => selectRoom((e as CustomEvent<{ id: string | null }>).detail.id));
  const lang = root.dataset.lang ?? 'en';
  const area = (m2: number) =>
    `${m2.toLocaleString(lang === 'am' ? 'am-ET' : 'en-US', { maximumFractionDigits: 2 })} m²`; // as the plan writes it: 5, 1.9, 15.82

  /** Prefetch on idle once FLOOR is reached and a has3d hotspot is hovered or focused (DESIGN §9.6.3). */
  let prefetched = false;
  const prefetch3d = () => {
    if (prefetched || !webgl || failed3d) return;
    prefetched = true;
    const idle = window.requestIdleCallback ?? ((f: () => void) => setTimeout(f, 200));
    idle(() => void import('./unit3d').catch(() => undefined));
  };

  const fade = (to: number, ms: number) =>
    host.animate([{ opacity: to ? 0 : 1 }, { opacity: to }], { duration: prefersReducedMotion() ? 200 : ms, fill: 'forwards' }).finished;

  function fail3d(err?: unknown) {
    if (err) console.warn('[explorer] unit 3D unavailable, showing the plan', err);
    failed3d = true;
    endWalk();
    room = null;
    rooms?.destroy();
    rooms = null;
    dh?.destroy();
    dh = dhCode = null;
    gl?.suspend(false);
    host.getAnimations().forEach((a) => a.cancel());
    layoutWant = false; // a Flip still loading must not turn the 3D layout back on (review r6 #2)
    flip?.progress(1).kill(); // finishing it clears Flip's inline sizes (S10's panel transform is left alone)
    flip = null;
    root.removeAttribute('data-view3d');
    renderToggle();
  }

  async function leave3d(job: number) {
    if (!dh) return;
    const d = dh;
    endWalk();
    selectRoom(null);
    rooms?.destroy();
    rooms = null;
    await d.leave();
    if (job !== viewJob) return;
    await fade(0, 300);
    d.destroy();
    if (dh === d) dh = dhCode = null;
    gl?.suspend(false);
    await fade(1, 300);
    host.getAnimations().forEach((a) => a.cancel());
  }

  async function enter3d(code: Code, job: number) {
    if (!(await loadScene())) throw new Error('tier 2 unavailable'); // review r6 #2b: → fail3d → the plan
    if (job !== viewJob) return;
    const tier = gl;
    if (!tier) throw new Error('no tier 2 renderer');
    strings ??= fetch(`/i18n/unit3d.${lang}.json`).then((r) => r.json());
    const [{ createDollhouse, loadFloorImage }, { createRoomsPanel }, { units3d }, s] = await Promise.all([
      import('./unit3d'),
      import('./unit3d-panel'),
      import('../../data/units3d'),
      strings,
    ]);
    const pack = await units3d[code]!();
    walkPanos = pack.panos;
    const image = await loadFloorImage(code.toLowerCase());
    if (job !== viewJob) return;
    // A3: the camera pushes toward the unit on the slab for 0.5 s before the cross-fade
    if (stage.hasAttribute('data-slab') && !prefersReducedMotion()) await tier.pushTo(code);
    if (job !== viewJob) return;
    await fade(0, 400);
    if (job !== viewJob) return;
    tower?.freeze(); // review r9a low: the tower's last frame stays on the stage while the canvas moves to the dollhouse
    tier.suspend(true);
    dh = createDollhouse({
      renderer: tier.renderer,
      host,
      stage,
      data: pack.geo,
      image,
      names: s.rooms,
      area,
      reduced: prefersReducedMotion(),
      onRoom: (id) => window.dispatchEvent(new CustomEvent('unit3d:room', { detail: { id } })),
      onInteract: () => {
        hint.setAttribute('data-done', '');
        rooms?.hideHint();
      },
    });
    dhCode = code;
    room = null;
    rooms = createRoomsPanel({
      card: cards.get(code)!,
      code,
      geo: pack.geo,
      images: pack.images,
      floorImage: image,
      s,
      area,
      lang,
      onSelect: selectRoom,
      onHover: (id) => dh?.highlight(id),
      // rev 9 B1: walking needs WebGL (here already) and isn't offered on Save-Data or a slow connection
      onStepInside: prefersLightweight() ? undefined : (id) => go({ ...state, walk: id }),
    });
    const entering = dh.enter({ skipLift: Boolean(tower) }); // rev 10 T5: from the assembled floor the walls are already up
    if (tower) syncSlab(); // the dollhouse is drawing: now the stage cross-fades from the tower to it
    await fade(1, 200);
    await entering;
  }

  /* ---------- rev 9 (B1–B6): walk-in mode, "Step inside" ---------- */
  let walk: import('./walk').Walk | null = null;
  let walkMod: Promise<typeof import('./walk')> | null = null;
  let walkStrings: Record<string, string> = {};
  let walkPanos: Partial<Record<string, import('../../data/units3d/types').RoomPano>> = {};
  /** Focus fell to the page (its control vanished) or was on a control that is about to vanish. */
  const lostFocus = () => {
    const a = document.activeElement;
    return !a || a === document.body || Boolean(a.closest('.u3d-enter, .u3d-step, .walk-ui, .u3d-sheet, .u3d-card'));
  };
  /** Walk to match state.walk: step inside, move between rooms, or back to the 3D model. */
  async function syncWalk() {
    const want = dh && state.walk && viewFor() === '3d' ? state.walk : null;
    if (!want) {
      const wasIn = Boolean(walk?.room);
      if (walk?.room) await walk.exit();
      setWalking(false);
      // review r8 M4: the walk's buttons are gone; give focus back to "Enter the home" if it was lost
      if (wasIn && lostFocus()) $('.u3d-enter')?.focus({ preventScroll: true });
      return;
    }
    if (!walk) {
      const [m, s] = await Promise.all([(walkMod ??= import('./walk')), strings!]);
      if (!dh || walk) return;
      walkStrings = (s as unknown as { walk: Record<string, string> }).walk;
      walk = m.createWalk(dh.walkHost(), {
        strings: walkStrings,
        names: (s as unknown as { rooms: Record<string, string> }).rooms,
        lang,
        // a ring took the visitor elsewhere: the state (and hash) follow; the panel marks the room and announces it
        onArrive: (id) => {
          if (!state.walk) return; // left the walk meanwhile (review r8 H1)
          if (state.walk !== id) go({ ...state, walk: id });
          rooms?.setWalk(id);
        },
        onBack: () => go({ ...state, walk: null }),
        panos: walkPanos,
        aiLabel: (s as unknown as { aiLabel: string }).aiLabel,
        onPick: (id) => go({ ...state, walk: id }),
      });
    }
    if (!walk.room) {
      selectRoom(null);
      setWalking(true);
      const lost = lostFocus(); // "Enter the home" hides and "Step inside" closes its card as the walk starts
      await walk.enter(want);
      if ((lost || lostFocus()) && state.walk) stage.focus({ preventScroll: true }); // arrow keys look around
    } else if (walk.room !== want) await walk.goTo(want);
  }
  /** Drop the walk at once (the dollhouse is going away). */
  function endWalk() {
    walk?.destroy();
    walk = null;
    if (state.walk) state.walk = null;
    setWalking(false);
  }
  let insideLi: HTMLLIElement | null = null;
  function setWalking(on: boolean) {
    if (!on) rooms?.setWalk(null);
    if (on === root.hasAttribute('data-walk')) return;
    document.documentElement.classList.toggle('is-walking', on);
    void walkLayout(on);
    // breadcrumb: … › BL05 › Inside
    if (on && !insideLi) {
      insideLi = document.createElement('li');
      insideLi.style.cssText = 'display:flex;align-items:center;gap:var(--space-2)'; // the crumbs' scoped style misses JS-made items
      insideLi.innerHTML = '<span aria-hidden="true" class="crumbs__sep">›</span><span class="crumbs__current" aria-current="location"></span>';
      $('[data-crumb-unit-li]')!.after(insideLi);
    }
    if (insideLi) {
      insideLi.hidden = !on;
      insideLi.lastElementChild!.textContent = walkStrings.inside ?? '';
    }
    $('[data-crumb-unit]')!.toggleAttribute('aria-current', !on);
  }
  /** Walk layout: desktop stage cols 1–8 and panel 9–12 (Flip 0.5 s); phones: a 70svh stage. */
  async function walkLayout(on: boolean) {
    const desktop = window.matchMedia('(min-width: 1024px)').matches;
    if (!desktop || prefersReducedMotion()) {
      root.toggleAttribute('data-walk', on);
      return;
    }
    const { Flip } = await import('gsap/Flip');
    gsap.registerPlugin(Flip);
    const st = Flip.getState([$('[data-model-col]')!, panel]);
    root.toggleAttribute('data-walk', on);
    Flip.from(st, { duration: 0.5, ease: 'power3.inOut', scale: false });
  }

  /** Bring the stage in line with the state: tower ↔ dollhouse (U1/U2), and the desktop layout (U7). */
  async function syncView() {
    const want = viewFor() === '3d' ? state.unit : null;
    if (want === dhCode && (want !== null) === root.hasAttribute('data-view3d')) {
      await syncWalk();
      return;
    }
    const job = ++viewJob;
    void layout(want !== null);
    try {
      if (dh && dhCode !== want) await leave3d(job);
      if (want && job === viewJob && !dh) await enter3d(want, job);
    } catch (err) {
      fail3d(err);
      go({ ...state }); // re-render as plan
    }
    // review r6 #1: the default rule can switch to 3D after go() rendered (tier 2 arrives later), so once the stage
    // has settled, the toggle and the hash follow the view actually shown
    if (job !== viewJob) return;
    await syncWalk();
    renderToggle();
    if (location.hash.startsWith('#explore')) history.replaceState(null, '', `${location.pathname}${location.search}${hashFor(state)}`);
  }

  /** U7: desktop stage cols 1–5 → 1–7 with a GSAP Flip; the plan image hides in 3D. */
  // review r6 #2: the Flip is async (dynamic import), so it applies the LATEST wanted state when it lands; a fast
  // failure (fail3d) in between must not be undone by a Flip that was started before it
  let layoutWant = false;
  let flip: gsap.core.Timeline | null = null;
  async function layout(on: boolean) {
    layoutWant = on;
    if (on === root.hasAttribute('data-view3d')) return;
    const desktop = window.matchMedia('(min-width: 1024px)').matches;
    if (!desktop || prefersReducedMotion()) {
      root.toggleAttribute('data-view3d', on);
      return;
    }
    const [{ Flip }] = await Promise.all([import('gsap/Flip')]);
    if (layoutWant !== on || on === root.hasAttribute('data-view3d')) return; // superseded meanwhile
    gsap.registerPlugin(Flip);
    const targets = [$('[data-model-col]')!, panel];
    const st = Flip.getState(targets);
    root.toggleAttribute('data-view3d', on);
    flip?.kill();
    flip = Flip.from(st, { duration: 0.6, ease: 'power3.inOut', scale: false });
  }

  /* ---------- transitions ---------- */

  const hashFor = (s: State) => {
    if (s.level === 'idle') return '#explore';
    if (s.level !== 'unit' || !s.unit) return `#explore/f${s.floor}`;
    // rev 8: /3d while the dollhouse shows; /plan when the visitor chose the plan of a unit that has 3D
    const v = viewFor();
    const suffix = v === '3d' ? (s.walk ? `/3d/in/${s.walk}` : '/3d') : can3d() && s.pref === 'plan' ? '/plan' : '';
    return `#explore/f${s.floor}/${s.unit.toLowerCase()}${suffix}`;
  };

  function go(next: State, opts: { focus?: boolean; scroll?: boolean; animate?: boolean } = {}) {
    const changedLevel = next.level !== state.level;
    // rev 9: walking belongs to one unit's 3D view; another level, unit or the Plan view ends it
    if (next.level !== 'unit' || next.unit !== state.unit || next.pref === 'plan') next = { ...next, walk: next.walk && next.unit === state.unit ? next.walk : null };
    Object.assign(state, next);
    render(opts.animate !== false && changedLevel);
    const url = `${location.pathname}${location.search}${hashFor(state)}`;
    if (location.hash.startsWith('#explore') || state.level !== 'idle') history.replaceState(null, '', url);

    if (opts.scroll && window.innerWidth < 1024) scrollToTarget(panel);
    if (opts.focus && changedLevel) {
      const target =
        state.level === 'floor'
          ? $('[data-floor-title]')
          : state.level === 'unit'
            ? activeCard()?.querySelector<HTMLElement>('[data-unit-title]')
            : floorRows.find((r) => Number(r.dataset.floor) === state.floor);
      target?.focus({ preventScroll: true });
    }
  }

  const back = () => {
    if (state.level === 'unit') go({ ...state, level: 'floor', unit: null }, { focus: true });
    else if (state.level === 'floor') go({ level: 'idle', floor: state.floor, unit: null }, { focus: true });
  };

  const clampFloor = (n: number) => Math.min(FLOORS, Math.max(1, n));

  /* ---------- events ---------- */

  // floor list
  floorRows.forEach((row) => {
    const n = Number(row.dataset.floor);
    row.addEventListener('pointerenter', () => setPreview(n, true));
    row.addEventListener('pointerleave', () => setPreview(null, true));
    row.addEventListener('focus', () => setPreview(n, true));
    row.addEventListener('blur', () => setPreview(null, true));
    row.addEventListener('click', () => go({ level: 'floor', floor: n, unit: null }, { focus: true, scroll: true }));
  });

  // steppers (model column on mobile/tablet; panel on desktop)
  $$<HTMLButtonElement>('[data-step]').forEach((b) =>
    b.addEventListener('click', () => {
      const d = Number(b.dataset.step);
      if (state.level === 'idle') {
        previewFloor = clampFloor(previewFloor + d);
        model.preview(previewFloor);
        showTooltip(previewFloor);
        renderStepper();
      } else {
        go({ ...state, floor: clampFloor(state.floor + d) });
      }
    }),
  );
  $$('[data-view-floor]').forEach((b) =>
    b.addEventListener('click', () => {
      const n = state.level === 'idle' ? previewFloor : state.floor;
      go({ level: 'floor', floor: n, unit: null }, { focus: true, scroll: true });
    }),
  );

  // hotspots + chips
  const pickUnit = (code: Code, focus: boolean) => go({ level: 'unit', floor: state.floor, unit: code }, { focus, scroll: true });
  hotspots.forEach((h) => {
    const code = h.dataset.unit as Code;
    h.addEventListener('click', (e) => {
      e.preventDefault();
      pickUnit(code, e.detail === 0); // keyboard activation moves focus; pointer doesn't
    });
    const enter = () => {
      h.classList.add('is-preview');
      showPill(code, code === state.unit);
      if (has3d(code)) prefetch3d();
    };
    const leave = () => {
      h.classList.remove('is-preview');
      showPill(state.unit, true);
    };
    h.addEventListener('pointerenter', enter);
    h.addEventListener('pointerleave', leave);
    h.addEventListener('focus', enter);
    h.addEventListener('blur', leave);
  });
  chips.forEach((c) => {
    const code = c.dataset.unit as Code;
    c.addEventListener('click', () => pickUnit(code, true));
    c.addEventListener('pointerenter', () => hotspots.find((h) => h.dataset.unit === code)?.classList.add('is-preview'));
    c.addEventListener('pointerleave', () => hotspots.forEach((h) => h.classList.remove('is-preview')));
  });

  // unit prev/next on the same floor
  $$<HTMLButtonElement>('[data-unit-step]').forEach((b) =>
    b.addEventListener('click', () => {
      const i = CODES.indexOf(state.unit ?? 'BL01');
      const next = CODES[(i + Number(b.dataset.unitStep) + CODES.length) % CODES.length]!;
      go({ ...state, unit: next });
    }),
  );

  // TBC card: "See BL01 on floor m" (the nearest floor where it is confirmed)
  tbcCard?.querySelector<HTMLElement>('[data-see-confirmed]')?.addEventListener('click', (e) => {
    const b = e.currentTarget as HTMLElement;
    go({ level: 'unit', floor: Number(b.dataset.floor) || state.floor, unit: b.dataset.seeConfirmed as Code });
    // same level, so go() doesn't move focus: the TBC card just hid, land on the full card's title
    activeCard()?.querySelector<HTMLElement>('[data-unit-title]')?.focus({ preventScroll: true });
  });

  // back buttons + breadcrumb
  $$<HTMLButtonElement>('[data-back]').forEach((b) =>
    b.addEventListener('click', () => {
      const to = b.dataset.back as Level;
      go({ level: to, floor: state.floor, unit: null }, { focus: true });
    }),
  );
  $$<HTMLButtonElement>('[data-crumb]').forEach((b) =>
    b.addEventListener('click', () => go({ level: b.dataset.crumb as Level, floor: state.floor, unit: null }, { focus: true })),
  );

  // Esc steps back while the explorer is on screen (not while a dialog is open; dialogs own their Esc)
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || state.level === 'idle' || root.hasAttribute('data-offscreen')) return;
    if (document.querySelector('dialog[open]')) return;
    const active = document.activeElement;
    if (active && active !== document.body && !root.contains(active)) return;
    e.preventDefault();
    if (state.walk) go({ ...state, walk: null }); // rev 9: Esc first steps back out to the 3D model
    else if (room) selectRoom(null); // rev 8: then deselects the room
    else back();
  };
  document.addEventListener('keydown', onKey);

  // request pricing → prefill the enquiry form (DESIGN §5.8: ?unit=BL05&floor=7, hash-safe)
  $$<HTMLAnchorElement>('[data-request]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const unit = a.dataset.request ?? '';
      history.replaceState(null, '', `${location.pathname}?unit=${unit}&floor=${state.floor}#enquire`);
      window.dispatchEvent(new CustomEvent('enquiry:prefill', { detail: { unit, floor: state.floor } }));
      const form = document.querySelector('#enquire');
      if (form) scrollToTarget(form);
    }),
  );

  // plan image → plan viewer (M3 claims the event with preventDefault); fallback: the home card
  $$<HTMLButtonElement>('[data-open-plan]').forEach((b) =>
    b.addEventListener('click', () => {
      const ev = new CustomEvent('plan:open', { detail: { code: b.dataset.openPlan, opener: b }, cancelable: true });
      if (window.dispatchEvent(ev)) {
        const card = document.getElementById(`unit-${(b.dataset.openPlan ?? '').toLowerCase()}`);
        if (card) scrollToTarget(card);
      }
    }),
  );

  // hint chip fades after the first interaction anywhere in the explorer
  root.addEventListener('pointerdown', () => hint.setAttribute('data-done', ''), { once: true });

  // stop model work when offscreen
  const stopVis = onVisibility(root, (v) => root.toggleAttribute('data-offscreen', !v));

  /* ---------- init from the URL ---------- */

  const fromHash = (): State | null => {
    const m = /^#explore(?:\/f(\d{1,2})(?:\/(bl0[1-9])(?:\/(3d|plan)(?:\/in\/([a-z0-9-]+))?)?)?)?$/i.exec(location.hash);
    if (!m) return null;
    if (!m[1]) return { level: 'idle', floor: 1, unit: null };
    const floor = clampFloor(Number(m[1]));
    const unit = (m[2]?.toUpperCase() as Code | undefined) ?? null;
    return { level: unit ? 'unit' : 'floor', floor, unit, pref: (m[3]?.toLowerCase() as View | undefined) ?? null, walk: m[4]?.toLowerCase() ?? null };
  };

  root.dataset.ready = '';
  const initial = fromHash();
  if (initial) Object.assign(state, initial);
  render(false);
  // review r6 #4: a deep link's /3d stays only where 3D can show (not without WebGL, not on a TBC position)
  if (initial && state.level !== 'idle') history.replaceState(null, '', `${location.pathname}${location.search}${hashFor(state)}`);
  window.addEventListener('hashchange', () => {
    const s = fromHash();
    if (s) go(s, { animate: true });
  });

  /* ---------- S10 intro (desktop, motion allowed) ---------- */

  // Every ScrollTrigger.refresh() re-parents the pinned grid in/out of its pin-spacer, which blurs anything
  // focused inside it (resize, browser zoom, fonts, scene mount). Save and restore focus around it (review M2).
  let savedFocus: HTMLElement | null = null;
  const saveFocus = () => {
    const a = document.activeElement as HTMLElement | null;
    savedFocus = a && root.contains(a) ? a : null;
  };
  const restoreFocus = () => {
    if (savedFocus?.isConnected && document.activeElement !== savedFocus) savedFocus.focus({ preventScroll: true });
    savedFocus = null;
  };
  ScrollTrigger.addEventListener('refreshInit', saveFocus);
  ScrollTrigger.addEventListener('refresh', restoreFocus);

  const mm = gsap.matchMedia();
  mm.add({ desktop: '(min-width: 1024px)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
    const { desktop, motion } = ctx.conditions as { desktop: boolean; motion: boolean };
    if (!motion) return;
    const modelCol = $('[data-model-col]');
    const grid = $('[data-explore-grid]')!;
    const headerH = document.querySelector<HTMLElement>('.site-header')?.offsetHeight ?? 72;
    // Pin only the model+panel grid, and only if it fits under the header (review M2-M1); else S10m.
    const fits = grid.offsetHeight <= window.innerHeight - headerH;
    if (desktop && state.level === 'idle' && fits) {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: grid, start: `top top+=${headerH}`, end: '+=60%', pin: true, scrub: 0.8, anticipatePin: 1 },
        defaults: { ease: 'none' },
        onUpdate: () => {
          introProgress = tl.progress();
          model.setIntro?.(introProgress);
        },
      });
      introProgress = tl.progress();
      // the panel only slides (no fade): visitors arriving via the nav land at progress 0 and must read it
      tl.fromTo(panel, { x: 40 }, { x: 0 }, 0);
      // rev 9: the photo stage takes the maquette's place in the intro
      if (photo) tl.fromTo(photo, { scale: 0.94, y: 30, transformOrigin: '50% 100%' }, { scale: 1, y: 0 }, 0);
      ScrollTrigger.refresh();
    } else if (state.level === 'idle') {
      // (a deep link opens straight on a floor, unit or walk: the stage shows at once, no fade — review r9b N1)
      gsap.from(modelCol, {
        opacity: 0,
        y: 40,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: root, start: 'top 75%', once: true },
      });
    }
  });

  return {
    /** "Find on a floor" from the homes gallery: current floor (default 1), unit highlighted + pulse. */
    find(code: string, opts: { focus?: boolean } = {}) {
      const c = code.toUpperCase() as Code;
      if (!CODES.includes(c)) return;
      // the floor view with the unit highlighted (selected) on the current floor, default floor 1;
      // a home not confirmed there (BL01) opens its first confirmed floor instead (rev 5: floor 4)
      const current = state.level === 'idle' ? 1 : state.floor;
      const floor = isTbc(c, current) ? (confirmedFloors(c)[0] ?? current) : current;
      go({ level: 'floor', floor, unit: c }, { focus: false });
      const h = hotspots.find((x) => x.dataset.unit === c);
      if (h && opts.focus) h.focus({ preventScroll: true });
      if (h && !prefersReducedMotion()) {
        h.classList.remove('is-pulse');
        void h.getBoundingClientRect();
        h.classList.add('is-pulse');
      }
    },
    destroy() {
      document.removeEventListener('keydown', onKey);
      ScrollTrigger.removeEventListener('refreshInit', saveFocus);
      ScrollTrigger.removeEventListener('refresh', restoreFocus);
      stopVis();
      mm.revert();
      model.destroy();
    },
  };
}
