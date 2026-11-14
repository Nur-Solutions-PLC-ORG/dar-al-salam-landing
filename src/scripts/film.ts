/**
 * Tower film (DESIGN §5.11 rev 5): the hero card's muted preview loop and its pause toggle.
 * Loaded after `load` + idle (Base.astro), so nothing here touches the LCP window.
 *
 * The loop plays only when ALL hold: motion allowed, no Save-Data, effectiveType 4g or unknown, hero on screen.
 * Otherwise the card stays a poster: no <source>s are added, zero video bytes, the pause toggle stays hidden.
 * `?film-debug` skips the connection checks only (headless Chrome reports 3g); never the motion check.
 */
import { prefersReducedMotion } from './motion-api';

type Connection = { saveData?: boolean; effectiveType?: string };

const LOOPS = 3;

/** Shared state other film parts (dialog, sound) read and change. */
export const film = {
  card: null as HTMLElement | null,
  /** The film dialog is open: the loop and the music pause. */
  dialogOpen: false,
  /** The card is visible (IO; on desktop also S1f's fade-out window). */
  cardVisible: false,
  /** Re-evaluate whether the loop should be playing. */
  update: () => {},
};

function connectionAllows() {
  if (new URLSearchParams(location.search).has('film-debug')) return true;
  const c = (navigator as Navigator & { connection?: Connection }).connection;
  if (c?.saveData) return false;
  return !c?.effectiveType || c.effectiveType === '4g';
}

export function initFilm() {
  const card = document.querySelector<HTMLElement>('[data-film-card]');
  if (!card) return;
  film.card = card;
  const video = card.querySelector<HTMLVideoElement>('[data-film-loop]')!;
  const pauseBtn = card.querySelector<HTMLButtonElement>('[data-film-pause]')!;
  const pauseLabel = pauseBtn.querySelector('[data-film-pause-label]')!;
  const hero = document.querySelector('#top') ?? card;

  let heroVisible = false;
  let s1fVisible = true; // desktop S1f: false once the card has faded out (motion.ts dispatches film:s1f)
  let userPaused = false;
  let loops = 0;
  let loaded = false;
  let revealed = false;

  // the card's CSS reveal (§7.2) must finish first, so the loop never starts mid-reveal (no jump cut)
  void Promise.all(card.getAnimations().map((a) => a.finished.catch(() => undefined))).then(() => {
    revealed = true;
    update();
  });

  const allowed = !prefersReducedMotion() && connectionAllows();

  const setPaused = (paused: boolean) => {
    pauseBtn.toggleAttribute('data-paused', paused);
    pauseLabel.textContent = (paused ? card.dataset.labelPlay : card.dataset.labelPause) ?? '';
  };

  const load = () => {
    if (loaded) return;
    loaded = true;
    // AV1 WebM first, H.264 MP4 fallback
    for (const [src, type] of [
      ['/video/film-loop.webm', 'video/webm; codecs="av01.0.05M.08"'],
      ['/video/film-loop.mp4', 'video/mp4; codecs="avc1.4d401e"'],
    ] as const) {
      const s = document.createElement('source');
      s.src = src;
      s.type = type;
      video.append(s);
    }
    video.loop = false; // counted by hand: auto-stop after 3 loops
    video.preload = 'auto';
    video.load();
    video.addEventListener('canplay', update, { once: true });
  };

  function update() {
    film.cardVisible = heroVisible && s1fVisible;
    if (!allowed) return;
    if (heroVisible && !loaded) load();
    const play = loaded && revealed && film.cardVisible && !document.hidden && !film.dialogOpen && !userPaused;
    if (play && video.paused && video.readyState >= 2) void video.play().catch(() => undefined);
    else if (!play && !video.paused) video.pause();
  }
  film.update = update;

  video.addEventListener('ended', () => {
    loops += 1;
    video.currentTime = 0;
    if (loops < LOOPS) {
      void video.play().catch(() => undefined);
      return;
    }
    // auto-stop: rest on the poster frame, the toggle offers "Play preview"
    userPaused = true;
    setPaused(true);
    video.pause();
  });

  if (allowed) {
    pauseBtn.hidden = false;
    pauseBtn.addEventListener('click', () => {
      userPaused = !userPaused;
      if (!userPaused) loops = 0; // a fresh start after the auto-stop
      setPaused(userPaused);
      update();
    });
  }

  new IntersectionObserver(([e]) => {
    heroVisible = Boolean(e?.isIntersecting);
    update();
  }).observe(hero);
  window.addEventListener('film:s1f', (e) => {
    s1fVisible = (e as CustomEvent<{ visible: boolean }>).detail.visible;
    update();
  });
  document.addEventListener('visibilitychange', update);
}
