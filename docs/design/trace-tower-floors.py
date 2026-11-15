"""Floor bands on the tower render for the rev 9 tower stage (DESIGN §9.7).
Writes docs/design/tower-floors.json and docs/design/tower-floors-check.jpg.
The render (brand-source/tower-render.jpg, 2251×2163) draws 13 typical storeys with balconies above a tall ground
storey. The explorer has typical floors 1–14, so the 14 bands divide the same façade height evenly: they are an
indicator, not a storey-accurate trace. `drawn` keeps the 13 storeys as drawn, for reference."""
import json, os
from PIL import Image, ImageDraw
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')) + '/'
# three vertical building edges in image px: x, y at the roof underside, y at the top of the ground storey
L, C, R = (224, 640, 1560), (986, 250, 1757), (1390, 485, 1630)
CROP = (150, 110, 1500, 1960)
def bands(n):
    out = []
    for k in range(n):            # k = 0 is the top band
        f0, f1 = k / n, (k + 1) / n
        y = lambda e, f: round(e[1] + (e[2] - e[1]) * f)
        out.append([[L[0], y(L, f0)], [C[0], y(C, f0)], [R[0], y(R, f0)], [R[0], y(R, f1)], [C[0], y(C, f1)], [L[0], y(L, f1)]])
    return out
b14, b13 = bands(14), bands(13)
data = {
    'image': 'brand-source/tower-render.jpg', 'imageSize': [2251, 2163], 'cropPx': list(CROP),
    'edges': {'left': L, 'corner': C, 'right': R},
    'note': 'Polygons are in full-image px (subtract cropPx[0], cropPx[1] for the cropped stage image). The render draws 13 storeys with balconies above its podium; `floors` splits that height into the 14 selectable floors, 16 (top) to 3 (bottom), so bands are approximate (up to about half a storey off). Floors 1-2 and the ground floor are the podium (`ground.poly`), which is not selectable.',
    'floors': [{'floor': 16 - k, 'poly': p} for k, p in enumerate(b14)],  # rev 11: homes are on floors 3-16
    'ground': {'poly': [[L[0], L[2]], [C[0], C[2]], [R[0], R[2]], [R[0], 1790], [C[0], 1995], [L[0], 1700]]},
    'drawn': {'storeys': 13, 'bands': b13},
}
open(ROOT + 'docs/design/tower-floors.json', 'w').write(json.dumps(data, separators=(',', ':')))
im = Image.open(ROOT + 'brand-source/tower-render.jpg').convert('RGBA'); ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
for k, p in enumerate(b14):
    d.polygon([tuple(q) for q in p], fill=(181, 148, 88, 110) if k % 2 == 0 else (26, 39, 63, 70), outline=(230, 211, 168, 255))
    d.text((R[0] + 12, (p[2][1] + p[3][1]) // 2 - 6), f'Floor {16 - k}', fill=(255, 255, 255, 255))
out = Image.alpha_composite(im, ov).convert('RGB').crop(CROP)
out.resize((900, round(out.height * 900 / out.width))).save(ROOT + 'docs/design/tower-floors-check.jpg', quality=80)
print(len(json.dumps(data, separators=(',', ':'))), 'bytes')
