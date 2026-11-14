"""Shared tracer for the unit dollhouse data (DESIGN §9.6.1). One script per unit (trace-bl0X.py) lists px
rectangles/polygons traced on brand-source/plans/bl0X.jpg; this module converts them to metres and writes:
  docs/design/units/{id}.json        geometry (format: DESIGN §9.6.1)
  docs/design/units/{id}-check.jpg   the JSON drawn over the plan (review overlay)
  docs/design/units/{id}-floor.webp  the floor texture, cleaned like BL05 v1.5 (open floors only)
Run from anywhere: python3 -I docs/design/units/trace-bl0X.py
"""
import json, math, os
from PIL import Image, ImageDraw, ImageFilter, ImageChops

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')) + '/'
OUT = ROOT + 'docs/design/units/'
CLEAN_ROOMS = ('bedroom', 'masterBedroom', 'livingDining', 'store', 'corridor')



def _inside(pt, poly):
    x, y = pt; c = False
    for i in range(len(poly)):
        (x1, y1), (x2, y2) = poly[i], poly[(i + 1) % len(poly)]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: c = not c
    return c


def _dseg(p, a, b):
    px, py = p; ax, ay = a; bx, by = b; dx, dy = bx - ax, by - ay
    L = dx * dx + dy * dy
    t = 0 if L == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / L))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)


def stand_point(poly, solids, step=0.1):
    """Rev 9.4: where a visitor stands in a room (metres). The point inside `poly` with the most clearance from
    the room's edges and from every solid (furniture, wardrobes, counters, columns), so the walk-in camera never
    starts inside or against a block. Returns [x, z, clearance]."""
    xs = [p[0] for p in poly]; ys = [p[1] for p in poly]; best = None
    obst = [s['poly'] for s in solids]
    y = min(ys) + step / 2
    while y < max(ys):
        x = min(xs) + step / 2
        while x < max(xs):
            if _inside((x, y), poly) and not any(_inside((x, y), o) for o in obst):
                d = min(_dseg((x, y), poly[i], poly[(i + 1) % len(poly)]) for i in range(len(poly)))
                for o in obst:
                    d = min(d, min(_dseg((x, y), o[i], o[(i + 1) % len(o)]) for i in range(len(o))))
                if best is None or d > best[2]: best = [round(x, 2), round(y, 2), round(d, 2)]
            x += step
        y += step
    return best


class Unit:
    def __init__(self, uid, code, typ, gross, net, sx, sy, ox, oy, crop, measured):
        self.uid, self.code, self.typ, self.gross, self.net = uid, code, typ, gross, net
        self.SX, self.SY, self.OX, self.OY, self.crop = sx, sy, ox, oy, crop
        self.measured = measured
        self.plan = ROOT + f'brand-source/plans/{uid}.jpg'
        self.walls, self.openings, self.railings, self.solids, self.rooms = [], [], [], [], []
        self.hall_poly, self.foot, self.protect, self.extra = None, None, [], []
        self.finishes, self.fixtures_note = {}, None

    # px -> metres
    def m(self, x, y):
        return [round((x - self.OX) / self.SX, 3), round((y - self.OY) / self.SY, 3)]

    def _seg(self, x0, y0, x1, y1):
        w = (x1 - x0) / self.SX; h = (y1 - y0) / self.SY
        if w >= h:
            yc = (y0 + y1) / 2; return self.m(x0, yc), self.m(x1, yc), round(h, 3)
        xc = (x0 + x1) / 2; return self.m(xc, y0), self.m(xc, y1), round(w, 3)

    def wall(self, id, r, kind='interior', h=2.8):
        a, b, t = self._seg(*r); self.walls.append({'id': id, 'a': a, 'b': b, 't': t, 'h': h, 'kind': kind})

    def wall_line(self, id, p, q, t, kind='interior', h=2.8):
        self.walls.append({'id': id, 'a': self.m(*p), 'b': self.m(*q), 't': t, 'h': h, 'kind': kind})

    def opening(self, id, r, type, wall, sill=0, head=2.1, basis='plan', leaves=None, note=None):
        a, b, t = self._seg(*r)
        d = {'id': id, 'type': type, 'a': a, 'b': b, 't': t, 'sill': sill, 'head': head, 'wall': wall, 'basis': basis}
        if leaves: d['leaves'] = leaves
        if note: d['note'] = note
        self.openings.append(d)

    def door(self, id, r, wall, leaves=1, note=None):
        self.opening(id, r, 'door', wall, 0, 2.1, 'plan', leaves, note)

    def open(self, id, r, wall, note=None):
        """An open archway: a room meets the hall, corridor or another space with no door (rev 9.2, walk-in rings)."""
        self.opening(id, r, 'open', wall, 0, 2.8, 'plan', None, note)

    def walkable(self, id, poly, note=None, name='hall'):
        """An unlabelled space a visitor can stand in (lobby, unlabelled wet room or terrace): no hotspot, no list row."""
        d = {'id': id, 'name': name, 'poly': [self.m(*p) for p in poly]}
        if note: d['note'] = note
        self.extra.append(d)

    def railing(self, id, p, q):
        self.railings.append({'id': id, 'a': self.m(*p), 'b': self.m(*q), 'h': 1.1})

    def solid(self, id, kind, poly, h, note=None, side=None):
        d = {'id': id, 'kind': kind, 'poly': [self.m(*p) for p in poly], 'h': h}
        if side: d['side'] = side
        if note: d['note'] = note
        self.solids.append(d)

    def box(self, id, kind, r, h, **kw):
        x0, y0, x1, y1 = r; self.solid(id, kind, [(x0, y0), (x1, y0), (x1, y1), (x0, y1)], h, **kw)

    def column(self, id, r): self.box(id, 'column', r, 2.8)
    def wardrobe(self, id, r): self.box(id, 'wardrobe', r, 2.2)
    def counter(self, id, r): self.box(id, 'counter', r, 0.9)
    def bed(self, id, r): self.box(id, 'furniture', r, 0.5, side='#E8E1D6')
    def nightstand(self, id, r): self.box(id, 'furniture', r, 0.55, side='#6E4E33')
    def furniture(self, id, r, h, side): self.box(id, 'furniture', r, h, side=side)

    # rev 10 F2: fixtures the plan draws, rugs, and floor finish
    FIX_H = {'shower': 0.08, 'basin': 0.85, 'wc': 0.42, 'hob': 0.92, 'sink': 0.92, 'fridge': 1.8, 'rug': 0.01}

    def fixture(self, id, kind, r, on=None):
        x0, y0, x1, y1 = r
        d = {'id': id, 'kind': kind, 'poly': [self.m(x0, y0), self.m(x1, y0), self.m(x1, y1), self.m(x0, y1)], 'h': self.FIX_H[kind]}
        if on: d['on'] = on
        self.solids.append(d)

    def rug(self, id, r): self.fixture(id, 'rug', r)

    def finish(self, value, *room_ids):
        """Set the floor finish the plan labels for these rooms ('parquet'); every other room is 'tile'."""
        for i in room_ids: self.finishes[i] = value

    def room(self, id, name, area, poly, label, note=None):
        """area: the plan's label verbatim, or None when the label is illegible (then `note` says what it looks like)."""
        d = {'id': id, 'name': name, 'area': area, 'poly': [self.m(*p) for p in poly], 'label': self.m(*label)}
        if note: d['note'] = note
        self.rooms.append(d)

    def hall(self, poly): self.hall_poly = poly
    def footprint(self, poly): self.foot = poly

    # ---------- outputs ----------
    def build(self):
        c = self.crop
        PIECE = (('-ns', 'nightstand'), ('f-bed', 'bed'), ('f-mbed', 'bed'), ('f-sofa', 'sofa'), ('f-dining', 'dining'), ('f-chair', 'chair'), ('f-tv', 'tvUnit'), ('f-side', 'sideTable'))
        for s_ in self.solids:
            if s_['kind'] == 'furniture': s_['piece'] = next((v for k, v in PIECE if k in s_['id']), 'block')
        for r in self.rooms: r['finish'] = self.finishes.get(r['id'], 'tile')
        blockers = [s_ for s_ in self.solids if s_['kind'] not in ('rug', 'shower', 'hob', 'sink')]
        for r in self.rooms + self.extra:
            sp = stand_point(r['poly'], blockers)
            if sp: r['stand'] = sp[:2]; r['standClearance'] = sp[2]
        data = {
            'unit': self.code, 'type': self.typ, 'grossM2': self.gross, 'netM2': self.net,
            'source': f'brand-source/plans/{self.uid}.jpg. Traced by realstate-frontend-design, Nov 2026; tolerance about ±5 cm.',
            'units': 'metres; x right, z down the plan (plan-aligned, north unknown); y up',
            'pxPerM': [self.SX, self.SY], 'originPx': [self.OX, self.OY], 'scaleCheck': self.measured,
            'texture': {'src': f'{self.uid}-floor', 'cropPx': list(c),
                        'plane': {'minX': self.m(c[0], c[1])[0], 'minZ': self.m(c[0], c[1])[1],
                                  'maxX': self.m(c[2], c[3])[0], 'maxZ': self.m(c[2], c[3])[1]},
                        'note': 'UV = ((x-minX)/(maxX-minX), 1-(z-minZ)/(maxZ-minZ)); the texture is the crop resized to 1024 px wide'},
            'defaults': {'wallH': 2.8, 'modelCutH': 2.4, 'cutawayH': 1.0, 'doorHead': 2.1,
                         'note': 'Heights are not on the plans: 2.8 m storey wall, 2.1 m door head, sills as listed. Illustrative.'},
            'fixturesNote': self.fixtures_note,
            'footprint': [self.m(*p) for p in self.foot], 'walls': self.walls, 'openings': self.openings,
            'railings': self.railings, 'solids': self.solids, 'rooms': self.rooms,
            'walkable': self.extra,
            'hall': {'id': 'hall', 'name': None, 'area': None, 'poly': [self.m(*p) for p in self.hall_poly]} if self.hall_poly else None,
        }
        s = json.dumps(data, separators=(',', ':'), ensure_ascii=False)
        open(OUT + f'{self.uid}.json', 'w').write(s)
        im = Image.open(self.plan).convert('RGB')
        self._check(im)
        self._texture(im)
        print(self.uid, 'json bytes', len(s), 'rooms', len(self.rooms), 'walls', len(self.walls),
              'openings', len(self.openings), 'solids', len(self.solids))

    def _P(self, p): return (p[0] * self.SX + self.OX, p[1] * self.SY + self.OY)

    def _check(self, im):
        ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov); P = self._P
        for r in self.rooms: d.polygon([P(p) for p in r['poly']], fill=(0, 160, 255, 50), outline=(0, 120, 255, 255))
        if self.hall_poly: d.polygon([P(self.m(*p)) for p in self.hall_poly], fill=(255, 200, 0, 40), outline=(200, 150, 0, 255))
        for e in self.extra: d.polygon([P(p) for p in e['poly']], fill=(255, 200, 0, 40), outline=(200, 150, 0, 255))
        f = [P(self.m(*p)) for p in self.foot]; d.line(f + [f[0]], fill=(0, 0, 0, 255), width=3)
        for s in self.solids:
            d.polygon([P(p) for p in s['poly']], fill=(255, 0, 200, 90) if s['kind'] == 'furniture' else (0, 220, 120, 170) if s['kind'] in ('shower', 'basin', 'wc', 'hob', 'sink', 'fridge') else (255, 255, 0, 60) if s['kind'] == 'rug' else (140, 0, 255, 90))
        for r in self.rooms + self.extra:
            if 'stand' in r:
                x, y = P(r['stand']); d.ellipse((x - 9, y - 9, x + 9, y + 9), fill=(255, 255, 255, 255), outline=(0, 0, 0, 255), width=3)

        def seg(a, b, t, col):
            ax, ay = P(a); bx, by = P(b); dx, dy = bx - ax, by - ay; L = math.hypot(dx, dy) or 1
            nx, ny = -dy / L, dx / L; hw = t * (self.SX + self.SY) / 4
            d.polygon([(ax + nx * hw, ay + ny * hw), (bx + nx * hw, by + ny * hw), (bx - nx * hw, by - ny * hw), (ax - nx * hw, ay - ny * hw)], fill=col)
        for w in self.walls: seg(w['a'], w['b'], w['t'], (255, 0, 0, 150))
        for o in self.openings: seg(o['a'], o['b'], o['t'], (0, 230, 230, 220) if o['type'] == 'open' else (0, 200, 0, 200) if o['basis'] == 'plan' else (255, 140, 0, 200))
        for r in self.railings: seg(r['a'], r['b'], 0.05, (0, 0, 255, 255))
        out = Image.alpha_composite(im.convert('RGBA'), ov).convert('RGB')
        w = 1200; out.resize((w, round(im.height * w / im.width)), Image.LANCZOS).save(OUT + f'{self.uid}-check.jpg', quality=80)

    def _texture(self, im):
        CX, CY, CX1, CY1 = self.crop; c = im.crop(self.crop); P = self._P
        allow = Image.new('L', c.size, 0); A = ImageDraw.Draw(allow)
        sh = lambda p: (p[0] - CX, p[1] - CY)
        for r in self.rooms:
            if r['name'] in CLEAN_ROOMS: A.polygon([sh(P(p)) for p in r['poly']], fill=255)
        if self.hall_poly: A.polygon([sh(P(self.m(*p))) for p in self.hall_poly], fill=255)
        for s in self.solids:
            if s['kind'] in ('furniture', 'counter', 'wardrobe', 'rug'):
                pts = [sh(P(p)) for p in s['poly']]; xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
                A.rectangle((min(xs) - 10, min(ys) - 10, max(xs) + 10, max(ys) + 10), fill=0)
        for r in self.protect: A.rectangle((r[0] - CX, r[1] - CY, r[2] - CX, r[3] - CY), fill=0)
        r, g, b = c.split()
        mx = ImageChops.lighter(ImageChops.lighter(r, g), b); mn = ImageChops.darker(ImageChops.darker(r, g), b)
        dark = mx.point(lambda v: 255 if v < 120 else 0); neutral = ImageChops.subtract(mx, mn).point(lambda v: 255 if v < 40 else 0)
        M = ImageChops.multiply(dark, neutral)
        thin = ImageChops.subtract(M, M.filter(ImageFilter.MinFilter(9)).filter(ImageFilter.MaxFilter(9)))
        mask = ImageChops.multiply(thin.filter(ImageFilter.MaxFilter(5)), allow)
        out = c
        for k in (9, 15, 21, 27):
            out = Image.composite(out.filter(ImageFilter.MedianFilter(k)), out, mask)
        h = round(c.height * 1024 / c.width)
        out.resize((1024, h), Image.LANCZOS).save(OUT + f'{self.uid}-floor.webp', quality=74, method=6)
