/**
 * Tower film (DESIGN §5.11 rev 5): the hero card's muted preview loop and its pause toggle, and the film dialog.
 * Animations use the Web Animations API with GSAP's curves, so a click before motion.ts loads still flies.
 * Loaded after `load` + idle (Base.astro), so nothing here touches the LCP window.
 *
 * The loop plays only when ALL hold: motion allowed, no Save-Data, effectiveType 4g or unknown, hero on screen.
 * Otherwise the card stays a poster: no <source>s are added, zero video bytes, the pause toggle stays hidden.
 * `?film-debug` skips the connection checks only (headless Chrome reports 3g); never the motion check.
 */
import { getLenis, prefersReducedMotion } from './motion-api';
import { toast } from './toast';

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
  /** The dialog opened/closed (the sound toggle fades its music around it). */
  onDialog: (_open: boolean) => {},
};

function connectionAllows() {
  if (new URLSearchParams(location.search).has('film-debug')) return true;
  const c = (navigator as Navigator & { connection?: Connection }).connection;
  if (c?.saveData) return false;
  return !c?.effectiveType || c.effectiveType === '4g';
}

export function initFilm() {
  wireOpeners();
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
    sound.sync(600);
  });
  document.addEventListener('visibilitychange', () => {
    update();
    sound.sync(200);
  });

  let cardInView = false;
  const sound = initSound(card, () => cardInView && s1fVisible);
  // music follows its own control: audible only while the card is on screen (and, on desktop, not faded by S1f)
  new IntersectionObserver(([e]) => {
    cardInView = Boolean(e?.isIntersecting);
    sound.sync(600);
  }).observe(card);
  film.onDialog = () => sound.sync(300);
}

/* ---------- sound toggle (item 6): Web Audio gain fades, nothing fetched before the first press ---------- */

function initSound(card: HTMLElement, cardShown: () => boolean) {
  const btn = card.querySelector<HTMLButtonElement>('[data-film-sound]');
  const noop = { sync: (_ms: number) => {} };
  if (!btn || !('AudioContext' in window)) return noop;
  const tip = btn.querySelector('[data-film-sound-tip]')!;
  let ctx: AudioContext | null = null;
  let audio: HTMLAudioElement | null = null;
  let gain: GainNode | null = null;
  let on = false;
  let pauseTimer = 0;
  let firstPlay = true; // the first load can outlast the 600 ms ramp: fade in from 0 once it actually plays

  const show = (state: 'off' | 'loading' | 'on') => {
    btn.dataset.state = state;
    btn.setAttribute('aria-pressed', String(state !== 'off'));
    tip.textContent = (state === 'off' ? btn.dataset.labelOff : btn.dataset.labelOn) ?? '';
  };

  const fail = () => {
    on = false;
    if (audio) audio.pause();
    show('off');
    toast(btn.dataset.labelError ?? '');
  };

  /** Ramp the gain from wherever it is now; a press mid-fade cancels the fade. */
  const ramp = (to: number, ms: number) => {
    if (!ctx || !gain || !audio) return;
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(to, now + ms / 1000);
    clearTimeout(pauseTimer);
    if (to === 0) pauseTimer = window.setTimeout(() => audio?.pause(), ms);
  };

  const sync = (ms: number) => {
    if (!audio) return;
    const audible = on && cardShown() && !document.hidden && !film.dialogOpen;
    if (!audible) {
      ramp(0, ms);
      return;
    }
    if (audio.paused) {
      void ctx?.resume();
      audio.play().catch(fail);
    }
    ramp(0.8, ms);
  };

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
    if (on) show(audio && audio.readyState >= 3 && !audio.paused ? 'on' : 'loading');
    else show('off');
    sync(600);
  });

  return { sync };
}

/* ---------- film dialog (item 5): FLIP from the card, rise from the Story link, cross-fade with reduced motion ---------- */

const EASE = {
  expoOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  power3Out: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  power2InOut: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
};

let dialogCtl: ReturnType<typeof createDialog> | undefined;

/** Open the film dialog from an opener (the card link or the Story link). Synchronous: the click's activation allows sound. */
export function openFilm(opener: HTMLElement) {
  dialogCtl ??= createDialog();
  dialogCtl?.open(opener);
}

/** Direct listeners on the openers (they run before the early delegate in Base.astro, which then stands down). */
function wireOpeners() {
  document.querySelectorAll<HTMLElement>('[data-film-open]').forEach((a) =>
    a.addEventListener('click', (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      openFilm(a);
    }),
  );
}

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
  const cardOf = (el: HTMLElement | null) => el?.closest<HTMLElement>('[data-film-card]') ?? null;
  /** The card's box expressed as a transform of the (untransformed) frame: equal aspect ratios, so no distortion. */
  const flip = (card: HTMLElement) => {
    const a = card.getBoundingClientRect();
    const b = frame.getBoundingClientRect();
    const dx = a.left + a.width / 2 - (b.left + b.width / 2);
    const dy = a.top + a.height / 2 - (b.top + b.height / 2);
    return `translate(${dx}px, ${dy}px) scale(${a.width / b.width})`;
  };
  const inViewport = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
  };

  function open(from: HTMLElement) {
    if (dialog!.open) return;
    opener = from;
    closing = false;
    stop();
    // same task as the click: showModal, Lenis, loop pause, play (user activation allows sound)
    if (!video.poster) video.poster = video.dataset.poster ?? '';
    const track = video.querySelector<HTMLTrackElement>('track[data-src]');
    if (track && !track.getAttribute('src')) track.src = track.dataset.src ?? '';
    dialog!.showModal();
    getLenis()?.stop();
    document.documentElement.classList.add('has-dialog');
    film.dialogOpen = true;
    film.update();
    film.onDialog(true);
    if (video.ended) video.currentTime = 0;
    void video.play().catch(() => undefined); // rejected → the native play button is the fallback

    if (prefersReducedMotion()) {
      run(dialog!, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
      video.focus({ preventScroll: true });
      return;
    }
    const card = cardOf(from);
    const main = card
      ? run(frame, [{ transform: flip(card) }, { transform: 'none' }], { duration: 700, easing: EASE.expoOut })
      : run(frame, [{ opacity: 0, transform: 'translateY(24px) scale(0.96)' }, { opacity: 1, transform: 'none' }], {
          duration: 600,
          easing: EASE.power3Out,
        });
    card?.setAttribute('data-film-away', ''); // the card "lifts out" during the flight
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
    const card = cardOf(opener);
    const fade = (ms: number) => run(dialog!, [{ opacity: 1 }, { opacity: 0 }], { duration: ms, fill: 'forwards' });
    let done: Animation;
    if (prefersReducedMotion()) done = fade(200);
    else if (card && film.cardVisible && inViewport(card)) {
      done = run(frame, [{ transform: 'none' }, { transform: flip(card) }], { duration: 450, easing: EASE.power2InOut, fill: 'forwards' });
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
    cardOf(opener)?.removeAttribute('data-film-away');
    film.dialogOpen = false;
    film.update();
    film.onDialog(false);
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
