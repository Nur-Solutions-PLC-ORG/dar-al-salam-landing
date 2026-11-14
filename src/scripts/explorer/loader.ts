/**
 * Explorer bootstrap (in the initial bundle, ~1 KB). The state machine (controller) and the 3D scene are
 * dynamically imported when #explore comes within one viewport (DESIGN §9.4), on first interaction with
 * the section, or immediately for a deep link (#explore/f7/bl05).
 */
import { whenNear } from '../lazy';
import { scrollToTarget } from '../motion-api';

type Explorer = { find(code: string, opts?: { focus?: boolean }): void };
let pending: Promise<Explorer> | null = null;

export function initExplorerLoader() {
  const root = document.querySelector<HTMLElement>('[data-explore]');
  if (!root) return;
  let ready = false;
  let queued: EventTarget | null = null;
  // review r8 call 1: the tower photo's srcsets are swapped in ~800 px out (TowerStage.astro), before the controller
  const reveal = () =>
    root.querySelectorAll<HTMLElement>('[data-tstage] [data-srcset]').forEach((el) => {
      if (el instanceof HTMLImageElement && el.dataset.src) el.src = el.dataset.src;
      el.setAttribute('srcset', el.dataset.srcset ?? '');
      el.removeAttribute('data-srcset');
    });
  whenNear(root, reveal, '800px 0px');
  const load = () =>
    (reveal(), pending ??= import('./controller').then((m) => {
      const x = m.createExplorer(root);
      ready = true;
      return x;
    }));

  if (location.hash.startsWith('#explore/')) {
    void load();
    requestAnimationFrame(() => scrollToTarget(root, { immediate: true }));
  } else {
    whenNear(root, () => void load(), '100% 0px');
  }
  root.addEventListener('pointerdown', () => void load(), { once: true, passive: true });
  root.addEventListener('focusin', () => void load(), { once: true });

  // Until the controller is ready, hold the first activation and replay it afterwards, so a fast tap on a
  // slow network isn't lost (review M2-L1). Capture phase: runs before the (not yet bound) handlers.
  root.addEventListener(
    'click',
    (e) => {
      if (ready) return;
      const target = (e.target as Element | null)?.closest('button, a, .slab');
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      queued = e.target;
      load()
        .then(() => {
          const t = queued;
          queued = null;
          t?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: (e as MouseEvent).detail }));
        })
        .catch(() => {
          // import failed (offline, stale deploy): let a held link do its native job (#unit-blXX)
          const href = target.closest('a')?.getAttribute('href');
          if (href?.startsWith('#')) location.hash = href;
          queued = null;
        });
    },
    true,
  );

  // "Find on a floor" links from the homes gallery: <a href="#explore" data-find="BL05">
  document.addEventListener('click', (e) => {
    const a = (e.target as Element | null)?.closest<HTMLElement>('[data-find]');
    if (!a) return;
    e.preventDefault();
    const code = a.dataset.find ?? '';
    const keyboard = (e as MouseEvent).detail === 0;
    scrollToTarget(root);
    void load().then((x) => x.find(code, { focus: keyboard }));
  });
}
