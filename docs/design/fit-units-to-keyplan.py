"""Fit each traced unit (docs/design/units/bl0X.json, local metres) onto its key-plan polygon
(docs/design/keyplan-hotspots.json, px at 35.7 px/m). Tries the 8 rigid orientations (4 rotations × mirror) and a
translation search, scores by raster IoU at 0.1 m, and returns per-unit transforms: world = R·(local) + t, where
R is `rot` degrees counter-clockwise applied after an optional x-mirror. Used by build-tower3d.py."""
import json, math, os
from PIL import Image, ImageDraw
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')) + '/'
RES = 10  # px per metre for scoring

def xf(p, mirror, rot):
    x, y = p
    if mirror: x = -x
    c, s = round(math.cos(math.radians(rot))), round(math.sin(math.radians(rot)))
    return (c * x - s * y, s * x + c * y)

def raster(poly, ox, oy, w, h):
    im = Image.new('1', (w, h), 0)
    ImageDraw.Draw(im).polygon([((x - ox) * RES, (y - oy) * RES) for x, y in poly], fill=1)
    return im

def fit_all():
    kp = json.load(open(ROOT + 'docs/design/keyplan-hotspots.json')); S = kp['pxPerMetre']
    out = {}
    for code, u in kp['units'].items():
        target = [(x / S, y / S) for x, y in u['points']]
        d = json.load(open(ROOT + f'docs/design/units/{code.lower()}.json'))
        txs = [p[0] for p in target]; tys = [p[1] for p in target]
        ox, oy = min(txs) - 3, min(tys) - 3; w = int((max(txs) - min(txs) + 6) * RES); h = int((max(tys) - min(tys) + 6) * RES)
        T = raster(target, ox, oy, w, h); ta = sum(T.getdata()) if hasattr(T, 'getdata') else 0
        tcx, tcy = (min(txs) + max(txs)) / 2, (min(tys) + max(tys)) / 2
        best = None
        for mirror in (False, True):
            for rot in (0, 90, 180, 270):
                P = [xf(p, mirror, rot) for p in d['footprint']]
                xs = [p[0] for p in P]; ys = [p[1] for p in P]
                bx, by = tcx - (min(xs) + max(xs)) / 2, tcy - (min(ys) + max(ys)) / 2
                for step, span in ((0.4, 6), (0.1, 4)):
                    cands = []
                    for i in range(-span, span + 1):
                        for j in range(-span, span + 1):
                            dx, dy = bx + i * step, by + j * step
                            U = raster([(x + dx, y + dy) for x, y in P], ox, oy, w, h)
                            a = Image.new('1', (w, h)); 
                            from PIL import ImageChops
                            inter = sum(ImageChops.logical_and(T, U).getdata()); union = sum(ImageChops.logical_or(T, U).getdata())
                            cands.append((inter / union if union else 0, dx, dy))
                    iou, bx, by = max(cands)
                if best is None or iou > best[0]: best = (iou, mirror, rot, bx, by)
        iou, mirror, rot, tx, ty = best
        out[code] = {'mirror': mirror, 'rot': rot, 't': [round(tx, 2), round(ty, 2)], 'iou': round(iou / 255 if iou > 1 else iou, 3)}
    return out

if __name__ == '__main__':
    import warnings; warnings.simplefilter('ignore')
    r = fit_all(); print(json.dumps(r, indent=1))
