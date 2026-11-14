/**
 * UNIT 3D panel (DESIGN §9.6.4–§9.6.5 rev 8): the Rooms list (the accessible path into the model), the hint, and the
 * room card. Loaded with the dollhouse; everything it adds is removed again on leave.
 * - Order (rev 8.1 E): toggle → eyebrow → type → areas → actions → hint → [room card] → rooms, so Request pricing and
 *   Book a visit stay in view; the rooms list is 2 columns from 1024 px.
 * - Room card: in the panel above the rooms list (clip-path reveal) from 768 px; below that a bottom-sheet <dialog>
 *   (Esc, close button or a swipe down closes it; focus returns to whatever opened it).
 * - Image rule: an AI interior only when `approved`, always labelled "Artist's impression; finishes may vary.";
 *   until then the room's own crop of the floor plan, labelled "From the floor plan".
 */
import { getLenis, prefersReducedMotion } from '../motion';
import { roomCrop } from './unit3d';
import type { RoomImage, Unit3d } from '../../data/units3d/types';

export interface PanelStrings {
  roomsTitle: string;
  closeRoom: string;
  aiLabel: string;
  planLabel: string;
  altAi: string;
  altPlan: string;
  hint: string;
  rooms: Record<string, string>;
}

export interface RoomsPanel {
  select(id: string | null): void;
  hideHint(): void;
  destroy(): void;
}

const EASE = 'cubic-bezier(0.215, 0.61, 0.355, 1)'; // power3.out
const f = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '');

export function createRoomsPanel(o: {
  card: HTMLElement;
  code: string;
  geo: Unit3d;
  images: Partial<Record<string, RoomImage>>;
  floorImage: HTMLImageElement;
  s: PanelStrings;
  area: (m2: number) => string;
  lang: string;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
}): RoomsPanel {
  const { card, geo, s } = o;
  const body = card.querySelector('.unit__body')!;
  const specs = body.querySelector('.unit__specs')!;
  const actions = body.querySelector('.unit__actions')!;
  const nameOf = (key: string) => s.rooms[key] ?? key;
  // rev 8.4: a room whose plan label is illegible (area null) shows its name only, never a guessed area
  const label = (r: Unit3d['rooms'][number]) => (r.area == null ? nameOf(r.name) : `${nameOf(r.name)} · ${o.area(r.area)}`);
  const added: Element[] = [];

  /* ---------- Rooms list ---------- */
  const rooms = document.createElement('div');
  rooms.className = 'u3d-rooms';
  const h = document.createElement('h4');
  h.className = 'u3d-rooms__title';
  h.textContent = s.roomsTitle;
  const ul = document.createElement('ul');
  ul.className = 'u3d-rooms__list';
  ul.setAttribute('role', 'list');
  const rows = geo.rooms.map((r) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'u3d-room';
    b.setAttribute('aria-pressed', 'false');
    const n = document.createElement('span');
    n.textContent = nameOf(r.name);
    const a = document.createElement('span');
    a.className = 'tabular';
    a.textContent = r.area == null ? '' : o.area(r.area);
    b.append(n, a);
    b.addEventListener('click', () => o.onSelect(r.id));
    b.addEventListener('pointerenter', () => o.onHover(r.id));
    b.addEventListener('pointerleave', () => o.onHover(null));
    b.addEventListener('focus', () => o.onHover(r.id));
    b.addEventListener('blur', () => o.onHover(null));
    li.append(b);
    ul.append(li);
    return { id: r.id, b };
  });
  rooms.append(h, ul);
  added.push(rooms);

  const hint = document.createElement('p');
  hint.className = 'small muted u3d-hint';
  hint.textContent = s.hint;
  actions.after(hint);
  hint.after(rooms);
  added.push(hint);

  /* ---------- room card ---------- */
  const fig = document.createElement('figure');
  fig.className = 'u3d-card';
  const titleId = `u3d-card-${o.code.toLowerCase()}`;
  fig.setAttribute('aria-labelledby', titleId);
  fig.innerHTML =
    '<div class="u3d-card__head"><h4 class="u3d-card__title" tabindex="-1"></h4>' +
    '<button type="button" class="u3d-card__close"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15"/></svg></button></div>' +
    '<div class="u3d-card__frame"><img alt="" decoding="async" /><span class="u3d-card__chip"></span></div>';
  const title = fig.querySelector<HTMLElement>('.u3d-card__title')!;
  title.id = titleId;
  const close = fig.querySelector<HTMLButtonElement>('.u3d-card__close')!;
  close.setAttribute('aria-label', s.closeRoom);
  const img = fig.querySelector('img')!;
  const chip = fig.querySelector<HTMLElement>('.u3d-card__chip')!;
  close.addEventListener('click', () => o.onSelect(null));

  const sheet = document.createElement('dialog');
  sheet.className = 'u3d-sheet theme-paper';
  sheet.setAttribute('aria-labelledby', titleId);
  document.body.append(sheet);
  added.push(sheet);
  sheet.addEventListener('cancel', (e) => {
    e.preventDefault(); // Esc: the same path as the close button (deselect, animate, return focus)
    o.onSelect(null);
  });
  sheet.addEventListener('click', (e) => e.target === sheet && o.onSelect(null)); // the backdrop
  // swipe down to close
  let y0: number | null = null;
  sheet.addEventListener('pointerdown', (e) => (y0 = e.clientY));
  sheet.addEventListener('pointerup', (e) => {
    if (y0 !== null && e.clientY - y0 > 80) o.onSelect(null);
    y0 = null;
  });

  const crops = new Map<string, string>();
  let current: string | null = null;
  let opener: HTMLElement | null = null;
  const reduce = () => prefersReducedMotion();
  const mobile = () => window.matchMedia('(max-width: 767.98px)').matches;

  async function fill(id: string) {
    const r = geo.rooms.find((x) => x.id === id)!;
    title.textContent = label(r);
    const room = nameOf(r.name);
    const vars = { room: o.lang === 'en' ? room.toLowerCase() : room, code: o.code };
    const ai = o.images[id];
    if (ai?.approved) {
      img.src = ai.src;
      img.alt = ai.alt || f(s.altAi, vars);
      chip.textContent = s.aiLabel;
      return;
    }
    chip.textContent = s.planLabel;
    img.alt = f(s.altPlan, vars);
    let url = crops.get(id);
    if (!url) {
      const blob = await roomCrop(o.floorImage, geo, id);
      if (!blob) return;
      url = URL.createObjectURL(blob);
      crops.set(id, url);
    }
    if (current === id) img.src = url;
  }

  function open(id: string) {
    const was = current;
    current = id;
    rows.forEach((r) => r.b.setAttribute('aria-pressed', String(r.id === id)));
    void fill(id);
    if (mobile()) {
      if (!sheet.open) {
        opener = document.activeElement as HTMLElement | null;
        sheet.append(fig);
        sheet.showModal();
        getLenis()?.stop();
        document.documentElement.classList.add('has-dialog');
        sheet.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: reduce() ? 0 : 500, easing: EASE });
        close.focus();
      }
      return;
    }
    if (!was) {
      opener = document.activeElement as HTMLElement | null;
      rooms.before(fig);
      fig.animate(
        reduce() ? [{ opacity: 0 }, { opacity: 1 }] : [{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0)' }],
        { duration: reduce() ? 200 : 500, easing: EASE },
      );
      fig.scrollIntoView({ block: 'nearest' });
    }
  }

  function shut() {
    if (!current) return;
    current = null;
    rows.forEach((r) => r.b.setAttribute('aria-pressed', 'false'));
    const back = opener;
    opener = null;
    if (sheet.open) {
      const done = () => {
        sheet.close();
        fig.remove();
        getLenis()?.start();
        document.documentElement.classList.remove('has-dialog');
        if (back?.isConnected) back.focus({ preventScroll: true });
      };
      if (reduce()) done();
      else sheet.animate([{ transform: 'none' }, { transform: 'translateY(100%)' }], { duration: 300, easing: 'ease-in' }).finished.then(done, done);
      return;
    }
    const hadFocus = fig.contains(document.activeElement);
    fig.remove();
    if (hadFocus && back?.isConnected) back.focus({ preventScroll: true });
  }

  return {
    select(id) {
      if (id) open(id);
      else shut();
    },
    hideHint() {
      hint.hidden = true;
    },
    destroy() {
      if (sheet.open) {
        sheet.close();
        getLenis()?.start();
        document.documentElement.classList.remove('has-dialog');
      }
      fig.remove();
      added.forEach((el) => el.remove());
      crops.forEach((u) => URL.revokeObjectURL(u));
    },
  };
}
