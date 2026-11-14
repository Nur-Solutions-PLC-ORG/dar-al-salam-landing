"""Build docs/design/tower3d.json (DESIGN §9.9, rev 10) and docs/design/tower3d-check.jpg.
Inputs: keyplan-hotspots.json (floor outline, 35.7 px/m), the nine units/bl0X.json, and the placements found by
fit-units-to-keyplan.py (hard-coded below after review, so this script is fast and deterministic).
Coordinates: metres; x right and z down the key plan; y up. Subtract `centre` to centre the tower on the origin."""
import json, math, os
from PIL import Image, ImageDraw
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')) + '/'
PLACE = {  # world = R(rot, ccw, after optional x-mirror)·local + t   (from fit-units-to-keyplan.py, IoU in comments)
    'BL01': (False, 0, [23.54, 3.42]),   # 0.89
    'BL02': (False, 0, [10.01, 3.36]),   # 0.94
    'BL03': (False, 0, [7.32, 16.88]),   # 0.94
    'BL04': (True, 180, [23.61, 23.42]), # 0.94  (= the BL04 sheet flipped top-to-bottom)
    'BL05': (False, 0, [13.94, 39.74]),  # 0.95
    'BL06': (False, 0, [24.44, 27.21]),  # 0.99
    'BL07': (False, 0, [24.41, 40.10]),  # 0.98
    'BL08': (False, 0, [7.48, 27.56]),   # 0.97
    'BL09': (False, 0, [4.61, 36.82]),   # 0.95
}
IOU = {'BL01': .888, 'BL02': .941, 'BL03': .936, 'BL04': .937, 'BL05': .945, 'BL06': .989, 'BL07': .975, 'BL08': .968, 'BL09': .947}
kp = json.load(open(ROOT + 'docs/design/keyplan-hotspots.json')); S = kp['pxPerMetre']
r2 = lambda p: [round(p[0], 2), round(p[1], 2)]
def place(code, p):
    mirror, rot, t = PLACE[code]; x, y = p
    if mirror: x = -x
    c, s = round(math.cos(math.radians(rot))), round(math.sin(math.radians(rot)))
    return r2((c * x - s * y + t[0], s * x + c * y + t[1]))
outline = [r2((x / S, y / S)) for x, y in kp['floorOutline']]
xs = [p[0] for p in outline]; zs = [p[1] for p in outline]
centre = r2(((min(xs) + max(xs)) / 2, (min(zs) + max(zs)) / 2))
units, balconies, glazing = {}, [], []
for code in PLACE:
    d = json.load(open(ROOT + f'docs/design/units/{code.lower()}.json'))
    mirror, rot, t = PLACE[code]
    units[code] = {'src': f'{code.lower()}.json', 'mirror': mirror, 'rot': rot, 't': t, 'fitIoU': IOU[code],
                   'keyplanPoly': [r2((x / S, y / S)) for x, y in kp['units'][code]['points']],
                   'centroid': r2((kp['units'][code]['centroid'][0] / S, kp['units'][code]['centroid'][1] / S))}
    for r in d['rooms']:
        if r['name'] == 'balcony':
            balconies.append({'unit': code, 'id': r['id'], 'poly': [place(code, p) for p in r['poly']]})
    for o in d['openings']:
        if o['type'] in ('window', 'glazed-door'):
            glazing.append({'unit': code, 'id': o['id'], 'a': place(code, o['a']), 'b': place(code, o['b']), 'sill': o['sill'], 'head': o['head'], 'basis': o['basis']})
G, T = 6.3, 3.0
levels = [{'id': 'ground', 'label': 'Ground floor', 'y0': 0, 'h': G, 'status': 'built', 'use': 'commercial', 'selectable': False}]
for n in range(1, 15):
    levels.append({'id': f'f{n}', 'floor': n, 'y0': G + (n - 1) * T, 'h': T, 'status': 'plan', 'selectable': True})
levels.append({'id': 'planned', 'label': '16th floor planned', 'y0': G + 14 * T, 'h': T, 'status': 'planned', 'selectable': False})
two_bed = [4, 6, 8, 10, 11]
data = {
    'source': 'Built by docs/design/build-tower3d.py from keyplan-hotspots.json and units/bl0X.json. Nov 2026.',
    'units_note': 'metres; x right, z down the key plan; y up. Subtract `centre` to centre the tower on the origin.',
    'centre': centre, 'outline': outline,
    'heights': {'ground': G, 'typical': T, 'slab': 0.3, 'parapet': 1.2, 'plantRoom': 3.0,
                'basis': 'Illustrative. No section or elevation drawing exists. Ground 6.3 m: on the render the ground storey is about 2.1 typical storeys tall at the corner (245 px against 117 px). Typical 3.0 m is an assumption.'},
    'levels': levels,
    'floorCountReading': 'Ground + typical floors 1-14 (the plans) = 15 storeys, drawn solid. The client is "adding a 16th floor", so ONE more storey sits on top in the lighter "planned" style, with no units and no selection. The render draws ground + 13 typical storeys, so the 3D tower is one storey taller than the picture before the planned storey. Confirm with the client.',
    'units': units,
    'twoBedFloors': two_bed,
    'lit': {'rule': 'On hover or selection of floor n, light the glazing of every unit on that floor. BL01 lights only on twoBedFloors; on other floors its bay stays unlit (to be confirmed).'},
    'balconies': balconies, 'glazing': glazing,
    'glazing_note': 'Only openings the unit plans draw or imply (basis says which). The plans dimension almost no windows, so the tower\'s other window bays are illustrative, from `facadeStyle`, and must not be read as measured.',
    'facadeStyle': {
        'basis': 'Illustrative, read off brand-source/tower-render.jpg and the tower film. Not measured.',
        'wall': '#F4F1EC', 'fin': {'colour': '#FFFFFF', 'depth': 0.35, 'width': 0.25, 'spacing': 3.6, 'note': 'vertical white fins, full height of the typical floors'},
        'glass': {'colour': '#4F6E8C', 'opacity': 0.75, 'litColour': '#FFD9A0'},
        'windowBay': {'width': 1.8, 'sill': 0.9, 'head': 2.4, 'spacing': 3.6, 'note': 'one punched window per bay on walls with no traced opening'},
        'balconyFront': {'colour': '#7D7872', 'height': 1.1, 'railColour': '#2A2A2A', 'slab': 0.2},
        'groundCladding': {'colour': '#8C857C', 'shopfrontGlass': '#3B4A5A', 'shopfrontHead': 4.8, 'canopy': {'depth': 2.5, 'height': 4.2, 'colour': '#FFFFFF'}},
        'roof': {'parapet': 1.2, 'plantRoom': {'inset': 6.0, 'h': 3.0}},
    },
    'azimuth': 'Camera azimuth is measured from south (+z, the bottom of the key plan) toward west (-x). The default -35 degrees stands south-west and sees the south and west faces. Every explorer scene (tower, floor slab, assembled floor, dollhouse) uses this one convention. "South" and "west" here are plan directions only: true north is not on the plans.',
    'context': {'basis': 'Generic. No real neighbouring buildings, road names or distances are modelled.',
                'ground': {'radius': 90, 'colour': '#C9C4BA'}, 'road': {'width': 9, 'colour': '#4A4D55', 'sides': ['south', 'west']},
                'pavement': {'width': 3, 'colour': '#D8D2C6'}, 'palms': 14, 'trees': 18,
                'blocks': {'count': 10, 'minH': 9, 'maxH': 30, 'colour': '#E3DED4', 'minDistance': 28}},
}
s = json.dumps(data, separators=(',', ':'))
open(ROOT + 'docs/design/tower3d.json', 'w').write(s)
# check image: the placed units over the key plan
im = Image.open(ROOT + 'brand-source/plans/keyplan-typical-floor.png').convert('RGBA'); ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
P = lambda p: (p[0] * S, p[1] * S)
d.line([P(p) for p in outline + [outline[0]]], fill=(0, 0, 0, 255), width=4)
for code in PLACE:
    u = json.load(open(ROOT + f'docs/design/units/{code.lower()}.json'))
    d.polygon([P(place(code, p)) for p in u['footprint']], outline=(255, 0, 0, 255))
    for w in u['walls']: d.line([P(place(code, w['a'])), P(place(code, w['b']))], fill=(200, 0, 0, 230), width=3)
    for r in u['rooms']:
        if r['name'] == 'balcony': d.polygon([P(place(code, p)) for p in r['poly']], fill=(0, 90, 255, 110))
    for o in u['openings']:
        if o['type'] in ('window', 'glazed-door'): d.line([P(place(code, o['a'])), P(place(code, o['b']))], fill=(255, 170, 0, 255), width=6)
    c = units[code]['centroid']; d.text(P(c), code, fill=(0, 0, 0, 255))
out = Image.alpha_composite(im, ov).convert('RGB'); out.resize((958, 1200)).save(ROOT + 'docs/design/tower3d-check.jpg', quality=82)
print(len(s), 'bytes;', len(balconies), 'balconies;', len(glazing), 'glazed openings; outline', len(outline), 'pts; size', round(max(xs) - min(xs), 1), 'x', round(max(zs) - min(zs), 1), 'm')
