import sys, json
from PIL import Image, ImageFilter, ImageChops, ImageDraw
import os; ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../../..'))+'/'
CX,CY=180,0
im=Image.open(ROOT+'brand-source/plans/bl05.jpg').convert('RGB').crop((CX,CY,1800,1765))
d=json.load(open(ROOT+'docs/design/units/bl05.json'))
SX,SY=d['pxPerM']; OX,OY=d['originPx']
P=lambda p:(p[0]*SX+OX-CX,p[1]*SY+OY-CY)
allow=Image.new('L',im.size,0); A=ImageDraw.Draw(allow)
for r in d['rooms']:
    if r['id'] in ('bed1','mbed','bed2','living','store'): A.polygon([P(p) for p in r['poly']],fill=255)
A.polygon([P(p) for p in d['hall']['poly']],fill=255)
for s in d['solids']:
    if s['kind'] in ('furniture','counter','wardrobe'):
        pts=[P(p) for p in s['poly']]; xs=[p[0] for p in pts]; ys=[p[1] for p in pts]
        A.rectangle((min(xs)-10,min(ys)-10,max(xs)+10,max(ys)+10),fill=0)
A.rectangle((1320-CX,965,1605-CX,1335),fill=0)   # rug
A.rectangle((1600-CX,1330,1720-CX,1420),fill=0)  # side lamp table
r,g,b=im.split()
mx=ImageChops.lighter(ImageChops.lighter(r,g),b); mn=ImageChops.darker(ImageChops.darker(r,g),b)
dark=mx.point(lambda v:255 if v<120 else 0); neutral=ImageChops.subtract(mx,mn).point(lambda v:255 if v<40 else 0)
M=ImageChops.multiply(dark,neutral)
thin=ImageChops.subtract(M,M.filter(ImageFilter.MinFilter(9)).filter(ImageFilter.MaxFilter(9)))
mask=ImageChops.multiply(thin.filter(ImageFilter.MaxFilter(5)),allow)
out=im
for k in (9,15,21,27):
    out=Image.composite(out.filter(ImageFilter.MedianFilter(k)),out,mask)
out.resize((1024,1116),Image.LANCZOS).save(ROOT+'docs/design/units/bl05-floor.webp',quality=74,method=6)
