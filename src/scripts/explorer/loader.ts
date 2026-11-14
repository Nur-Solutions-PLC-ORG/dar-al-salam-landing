/**
 * Explorer bootstrap (in the initial bundle, ~1 KB). The state machine (controller) and the 3D scene are
 * dynamically imported when #explore comes within one viewport (DESIGN §9.4), on first interaction with
 * the section, or immediately for a deep link (#explore/f7/bl05).
 */
import { whenNear } from '../lazy';
import { scrollToTarget } from '../motion-api';

type Explorer = { find(code: string): void };
let pending: Promise<Explorer> | null = null;

export function initExplorerLoader() {
  const root = document.querySelector<HTMLElement>('[data-explore]');
  if (!root) return;
  const load = () => (pending ??= import('./controller').then((m) => m.createExplorer(root)));

  if (location.hash.startsWith('#explore/')) {
    void load();
    requestAnimationFrame(() => scrollToTarget(root, { immediate: true }));
  } else {
    whenNear(root, () => void load(), '100% 0px');
  }
  root.addEventListener('pointerdown', () => void load(), { once: true, passive: true });
  root.addEventListener('focusin', () => void load(), { once: true });

  // "Find on a floor" links from the homes gallery: <a href="#explore" data-find="BL05">
  document.addEventListener('click', (e) => {
    const a = (e.target as Element | null)?.closest<HTMLElement>('[data-find]');
    if (!a) return;
    e.preventDefault();
    const code = a.dataset.find ?? '';
    scrollToTarget(root);
    void load().then((x) => x.find(code));
  });
}
