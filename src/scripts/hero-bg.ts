/**
 * Hero background loop (DESIGN §5.1 rev 6). Runs at DOMContentLoaded (a deferred module), because the
 * background is the hero itself; the poster <img> is the LCP and paints first regardless.
 *
 * Sources are added only when ALL hold: motion allowed, no Save-Data, effectiveType 4g or unknown, hero on
 * screen. Otherwise: poster only, zero video bytes, the pause toggle stays hidden.
 * `?film-debug` skips only the connection checks (headless test harness), never the motion check.
 *
 * Plays on canplaythrough; fades in on the first `playing`, but not before the intro curtain is up.
 * Pauses off-screen (threshold 0), on a hidden tab and while the film dialog is open (`film:dialog`).
 * Auto-stops after 3 loops: fades back onto the poster, then pauses; the toggle offers "Play".
 * #top[data-bg-playing] mirrors actual playback (the play disc's breath runs only then).
 */
import { prefersReducedMotion } from './motion-api';

const LOOPS = 3;

type Connection = { saveData?: boolean; effectiveType?: string };

export function connectionAllows() {
  if (new URLSearchParams(location.search).has('film-debug')) return true;
  const c = (navigator as Navigator & { connection?: Connection }).connection;
  if (c?.saveData) return false;
  return !c?.effectiveType || c.effectiveType === '4g';
}

export function initHeroBg() {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const video = hero?.querySelector<HTMLVideoElement>('[data-hero-video]');
  if (!hero || !video) return;
  const toggle = hero.querySelector<HTMLButtonElement>('[data-bg-toggle]');
  const toggleLabel = toggle?.querySelector('[data-bg-toggle-label]');

  const allowed = !prefersReducedMotion() && connectionAllows();
  let visible = false;
  let userPaused = false;
  let dialogOpen = false;
  let loaded = false;
  let ready = false;
  let loops = 0;
  let lastTime = 0;
  let fadeTimer = 0;

  // the fade-in waits for the intro curtain (if any) to finish lifting
  const intro = document.documentElement.classList.contains('intro') ? document.querySelector('#intro') : null;
  let curtainUp = !intro;
  if (intro) {
    void Promise.all(intro.getAnimations().map((a) => a.finished.catch(() => undefined))).then(() => {
      curtainUp = true;
      reveal();
    });
  }

  const setToggle = (paused: boolean) => {
    if (!toggle) return;
    toggle.toggleAttribute('data-paused', paused);
    if (toggleLabel) toggleLabel.textContent = (paused ? toggle.dataset.labelPlay : toggle.dataset.labelPause) ?? '';
  };

  function reveal() {
    if (curtainUp && !video!.paused && !userPaused) video!.classList.add('is-playing');
  }

  function load() {
    if (loaded) return;
    loaded = true;
    for (const [src, type] of [
      ['/video/hero-bg.webm', 'video/webm; codecs="av01.0.01M.08"'],
      ['/video/hero-bg.mp4', 'video/mp4'],
    ] as const) {
      const s = document.createElement('source');
      s.src = src;
      s.type = type;
      video!.append(s);
    }
    video!.preload = 'auto';
    video!.load();
    video!.addEventListener(
      'canplaythrough',
      () => {
        ready = true;
        update();
      },
      { once: true },
    );
  }

  function update() {
    if (!allowed) return;
    if (visible && !loaded) load();
    const play = ready && visible && !document.hidden && !dialogOpen && !userPaused;
    if (play && video!.paused) void video!.play().catch(() => undefined);
    else if (!play && !video!.paused) video!.pause();
  }

  video.addEventListener('playing', () => {
    hero.setAttribute('data-bg-playing', '');
    reveal();
  });
  video.addEventListener('pause', () => hero.removeAttribute('data-bg-playing'));

  // count loops on the seamless native loop (no restart hitch): a wrap is time jumping backwards
  video.addEventListener('timeupdate', () => {
    const t = video.currentTime;
    if (t + 1 < lastTime) loops += 1;
    lastTime = t;
    if (loops < LOOPS || userPaused) return;
    // auto-stop: fade back onto the poster (its first frame), then pause
    userPaused = true;
    setToggle(true);
    video.classList.remove('is-playing');
    clearTimeout(fadeTimer);
    fadeTimer = window.setTimeout(() => {
      video.pause();
      video.currentTime = 0;
    }, 600);
  });

  if (allowed && toggle) {
    toggle.hidden = false;
    toggle.addEventListener('click', () => {
      userPaused = !userPaused;
      clearTimeout(fadeTimer);
      if (!userPaused) {
        loops = 0;
        lastTime = video.currentTime;
      }
      setToggle(userPaused);
      update();
      if (!userPaused) reveal();
    });
  }

  window.addEventListener('film:dialog', (e) => {
    dialogOpen = (e as CustomEvent<{ open: boolean }>).detail.open;
    update();
  });
  document.addEventListener('visibilitychange', update);
  new IntersectionObserver(
    ([e]) => {
      visible = Boolean(e?.isIntersecting);
      update();
    },
    { threshold: 0 },
  ).observe(hero);
}
