/**
 * Tower film (DESIGN §5.1 + §5.11, rev 6): the film dialog and the sound toggle. Loaded after load + idle
 * (Base.astro); an opener clicked earlier is caught by the tiny delegate there. The background loop itself is
 * src/scripts/hero-bg.ts (it listens for `film:dialog` to pause while the dialog is open).
 *
 * Dialog: a circle reveal from the hero play disc (clip-path circle 44 px → 150%), a rise from any other opener
 * (the Story link), a 0.2 s cross-fade with reduced motion. Unshaded: just the scrim around the frame.
 * Animations use the Web Animations API with GSAP's curves, so an early click works without GSAP.
 */
import { getLenis, prefersReducedMotion } from './motion-api';
import { toast } from './toast';

const EASE = {
  power3Out: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  power3InOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
};

let dialogOpen = false;
/** The music's visibility rule (hero fully out of view → fade out), set up by initSound. */
let syncSound: (ms: number) => void = () => {};

export function initFilm() {
  wireOpeners();
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const btn = hero?.querySelector<HTMLButtonElement>('[data-film-sound]');
  if (hero && btn) initSound(hero, btn);
}

/* ---------- dialog ---------- */

let dialogCtl: ReturnType<typeof createDialog> | undefined;

/** Open the film dialog from an opener. Synchronous, so the click's user activation allows sound. */
export function openFilm(opener: HTMLElement) {
  dialogCtl ??= createDialog();
  dialogCtl?.open(opener);
}

/** Direct listeners run before the early delegate in Base.astro, which then stands down (defaultPrevented). */
function wireOpeners() {
  document.querySelectorAll<HTMLElement>('[data-film-open]').forEach((a) =>
    a.addEventListener('click', (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      openFilm(a);
    }),
  );
}

const announce = (open: boolean) => {
  dialogOpen = open;
  window.dispatchEvent(new CustomEvent('film:dialog', { detail: { open } }));
  syncSound(300);
};

function createDialog() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-film-dialog]');
  if (!dialog) return null;
  const scrim = dialog.querySelector<HTMLElement>('[data-film-scrim]')!;
  const frame = dialog.querySelector<HTMLElement>('[data-film-frame]')!;
  const video = dialog.querySelector<HTMLVideoElement>('[data-film-video]')!;
  const chrome = Array.from(dialog.querySelectorAll<HTMLElement>('[data-film-chrome]'));

  let opener: HTMLElement | null = null;
  let closing = false;
  let anims: Animation[] = [];
  const stop = () => {
    anims.forEach((a) => a.cancel());
    anims = [];
  };
  const run = (el: Element, k: Keyframe[], o: KeyframeAnimationOptions) => {
    const a = el.animate(k, o);
    anims.push(a);
    return a;
  };
  const discOf = (el: HTMLElement | null) => el?.closest('[data-hero-play]')?.querySelector<HTMLElement>('.hero__play-disc') ?? null;
  /** clip-path circles centred on the disc, in the (untransformed) frame's coordinates. */
  const circles = (disc: HTMLElement) => {
    const d = disc.getBoundingClientRect();
    const f = frame.getBoundingClientRect();
    const at = `at ${d.left + d.width / 2 - f.left}px ${d.top + d.height / 2 - f.top}px`;
    return [`circle(44px ${at})`, `circle(150% ${at})`] as const;
  };
  /** The play control is on screen and not faded by S1. */
  const onScreen = (disc: HTMLElement) => {
    const r = disc.getBoundingClientRect();
    const play = disc.closest<HTMLElement>('[data-hero-play]');
    return r.bottom > 0 && r.top < window.innerHeight && Number(getComputedStyle(play ?? disc).opacity) > 0.1;
  };

  function open(from: HTMLElement) {
    if (dialog!.open) return;
    opener = from;
    closing = false;
    stop();
    // same task as the click: poster + captions on first open, showModal, Lenis, pause the loop + music, play
    if (!video.poster) video.poster = video.dataset.poster ?? '';
    const track = video.querySelector<HTMLTrackElement>('track[data-src]');
    if (track && !track.getAttribute('src')) track.src = track.dataset.src ?? '';
    dialog!.showModal();
    getLenis()?.stop();
    document.documentElement.classList.add('has-dialog');
    announce(true);
    if (video.ended) video.currentTime = 0;
    void video.play().catch(() => undefined); // rejected → the native play button is the fallback

    if (prefersReducedMotion()) {
      run(dialog!, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
      video.focus({ preventScroll: true });
      return;
    }
    const disc = discOf(from);
    let main: Animation;
    if (disc) {
      const [small, big] = circles(disc);
      main = run(frame, [{ clipPath: small }, { clipPath: big }], { duration: 700, easing: EASE.power3InOut });
    } else {
      main = run(frame, [{ opacity: 0, transform: 'translateY(24px) scale(0.96)' }, { opacity: 1, transform: 'none' }], {
        duration: 600,
        easing: EASE.power3Out,
      });
    }
    run(scrim, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: EASE.power3Out });
    chrome.forEach((el) =>
      run(el, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], {
        duration: 400,
        delay: 350,
        easing: EASE.power3Out,
        fill: 'backwards',
      }),
    );
    void main.finished.then(
      () => dialog!.open && !closing && video.focus({ preventScroll: true }),
      () => undefined,
    );
  }

  function close() {
    if (!dialog!.open || closing) return;
    closing = true;
    video.pause(); // the sound stops on the first frame of the close
    stop();
    const disc = discOf(opener);
    const fade = (ms: number) => run(dialog!, [{ opacity: 1 }, { opacity: 0 }], { duration: ms, fill: 'forwards' });
    let done: Animation;
    if (prefersReducedMotion()) done = fade(200);
    else if (disc && onScreen(disc)) {
      const [small, big] = circles(disc);
      done = run(frame, [{ clipPath: big }, { clipPath: small }], { duration: 450, easing: EASE.power3InOut, fill: 'forwards' });
      run(scrim, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
      chrome.forEach((el) => run(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }));
    } else done = fade(250);
    void done.finished.then(
      () => dialog!.close(),
      () => dialog!.close(),
    );
  }

  // final cleanup runs on every close path (button, Esc, scrim, a forced close)
  dialog.addEventListener('close', () => {
    stop();
    closing = false;
    video.pause();
    getLenis()?.start();
    document.documentElement.classList.remove('has-dialog');
    announce(false);
    opener?.focus({ preventScroll: true });
  });
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault(); // Esc: animate first, then close
    close();
  });
  dialog.querySelector('[data-film-close]')!.addEventListener('click', close);
  dialog.addEventListener('click', (e) => {
    if (!(e.target as Element).closest('.film__frame, .film__top, .film__desc')) close(); // the scrim
  });

  return { open, close };
}

/* ---------- sound toggle: Web Audio gain fades, nothing fetched before the first press ---------- */

function initSound(hero: HTMLElement, btn: HTMLButtonElement) {
  if (!('AudioContext' in window)) return;
  const tip = btn.querySelector('[data-film-sound-tip]')!;
  let ctx: AudioContext | null = null;
  let audio: HTMLAudioElement | null = null;
  let gain: GainNode | null = null;
  let on = false;
  let heroInView = true;
  let pauseTimer = 0;
  let firstPlay = true; // the first load can outlast the 600 ms ramp: fade in from 0 once it actually plays

  const show = (state: 'off' | 'loading' | 'on') => {
    btn.dataset.state = state;
    btn.setAttribute('aria-pressed', String(state !== 'off'));
    tip.textContent = (state === 'off' ? btn.dataset.labelOff : btn.dataset.labelOn) ?? '';
  };

  const fail = () => {
    on = false;
    audio?.pause();
    show('off');
    toast(btn.dataset.labelError ?? '');
  };

  /** Ramp from wherever the gain is now; a press mid-fade cancels the fade. */
  const ramp = (to: number, ms: number) => {
    if (!ctx || !gain || !audio) return;
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(to, now + ms / 1000);
    clearTimeout(pauseTimer);
    if (to === 0) pauseTimer = window.setTimeout(() => audio?.pause(), ms);
  };

  // audible only while on, the hero is in view (the toggle is its last element), the tab is visible, no dialog
  const sync = (ms: number) => {
    if (!audio) return;
    if (!(on && heroInView && !document.hidden && !dialogOpen)) {
      ramp(0, ms);
      return;
    }
    if (audio.paused) {
      void ctx?.resume();
      audio.play().catch(fail);
    }
    ramp(0.8, ms);
  };
  syncSound = sync;

  btn.hidden = false;
  btn.addEventListener('click', () => {
    // first press: everything synchronously inside the click (the user gesture)
    if (!ctx) {
      try {
        ctx = new AudioContext();
        void ctx.resume();
        audio = new Audio();
        audio.loop = true;
        audio.preload = 'auto';
        audio.src = audio.canPlayType('audio/webm; codecs="opus"') ? '/video/film-music.webm' : '/video/film-music.m4a';
        gain = ctx.createGain();
        gain.gain.value = 0;
        ctx.createMediaElementSource(audio).connect(gain).connect(ctx.destination);
        audio.addEventListener('playing', () => {
          btn.setAttribute('data-playing', '');
          if (!on) return;
          show('on');
          if (firstPlay && ctx && gain) {
            firstPlay = false;
            gain.gain.cancelScheduledValues(ctx.currentTime);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            ramp(0.8, 600);
          }
        });
        audio.addEventListener('pause', () => btn.removeAttribute('data-playing'));
        audio.addEventListener('error', () => on && fail());
      } catch {
        fail();
        return;
      }
    }
    on = !on;
    show(on ? (audio && !audio.paused && audio.readyState >= 3 ? 'on' : 'loading') : 'off');
    sync(600);
  });

  new IntersectionObserver(
    ([e]) => {
      heroInView = Boolean(e?.isIntersecting);
      sync(600);
    },
    { threshold: 0 },
  ).observe(hero);
  document.addEventListener('visibilitychange', () => sync(200));
}
