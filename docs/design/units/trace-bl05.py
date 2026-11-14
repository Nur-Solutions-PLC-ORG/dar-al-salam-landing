"""Build docs/design/units/bl05.json from px tracings of brand-source/plans/bl05.jpg, and a check overlay."""
import json, sys
from PIL import Image, ImageDraw
import os; ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../../..'))+'/'
SX,SY=145.0,140.5          # px per metre (the plan raster is ~3% stretched horizontally)
OX,OY=197,17               # px of the unit's outer top-left corner = (0,0) m
def m(x,y): return [round((x-OX)/SX,3), round((y-OY)/SY,3)]

# Axis-aligned rects (px) -> centreline segments in metres
def rect_seg(x0,y0,x1,y1):
    w=(x1-x0)/SX; h=(y1-y0)/SY
    if w>=h:
        yc=(y0+y1)/2; return m(x0,yc), m(x1,yc), round(h,3)
    xc=(x0+x1)/2; return m(xc,y0), m(xc,y1), round(w,3)

walls=[]
def W(id,r,kind='interior',h=2.8,note=None):
    a,b,t=rect_seg(*r); d={'id':id,'a':a,'b':b,'t':t,'h':h,'kind':kind}
    if note: d['note']=note
    walls.append(d)
# perimeter (facade or corridor side)
W('p-top-w',(197,17,812,47),'corridor')
W('p-top-e',(992,25,1617,50),'corridor')
W('p-kit-e1',(1598,25,1617,118),'lightwell')
W('p-kit-e2',(1598,329,1617,405),'lightwell')
W('p-store-n',(1470,388,1730,408),'lightwell')
W('p-east',(1748,440,1772,1525),'facade')
W('p-south-w',(1074,1505,1100,1525),'facade')
W('p-south-e',(1740,1505,1772,1525),'facade')
W('p-west',(197,17,225,1330),'facade')
# interior
W('bed1-shower1',(597,47,611,555))
W('shower1-hall',(795,47,809,555))
W('shower1-s-w',(597,545,662,558))
W('shower1-s-e',(777,545,809,558))
W('bed1-s-stub',(445,548,460,648))
W('wardrobes-split',(205,645,460,663))
walls.append({'id':'mbed-hall-diag','a':m(457,655),'b':m(540,760),'t':0.15,'h':2.8,'kind':'interior'})
W('mbed-n-stub',(676,745,691,762))
W('mbed-bed2',(689,745,707,1310))
W('bed2-n',(845,745,1089,760))
W('bed2-living',(1074,745,1089,1505))
W('mbed-s-1',(445,1310,490,1330))
W('mbed-s-2',(620,1310,707,1332))
W('bed2-s-w',(707,1310,888,1332))
W('shower2-w',(476,1330,489,1580))
W('shower2-e',(870,1330,888,1580))
W('shower2-s',(476,1568,888,1580),'facade')
W('hall-kitchen-1',(995,25,1015,175))
W('hall-kitchen-2',(995,300,1015,405))
W('kitchen-s',(1113,385,1340,405))
W('store-w',(1337,405,1352,583))
W('store-s',(1337,568,1748,583))

openings=[]
def O(id,r,type,wall,sill,head,leaves=None,basis='plan',note=None):
    a,b,t=rect_seg(*r); d={'id':id,'type':type,'a':a,'b':b,'t':t,'sill':sill,'head':head,'wall':wall,'basis':basis}
    if leaves: d['leaves']=leaves
    if note: d['note']=note
    openings.append(d)
O('entry',(812,17,992,47),'door','corridor',0,2.1,2,note='Main entrance, double leaf (unequal) from the building corridor')
O('d-kitchen',(995,175,1015,300),'door','hall-kitchen',0,2.1,1)
O('d-store',(1340,388,1470,408),'door','kitchen-store',0,2.1,1)
O('d-shower1',(662,545,777,558),'door','shower1-hall',0,2.1,1)
O('d-bed1',(460,540,597,555),'door','bed1-hall',0,2.1,1)
O('d-mbed',(540,745,676,762),'door','mbed-hall',0,2.1,1)
O('d-bed2',(707,745,845,760),'door','bed2-hall',0,2.1,1)
O('d-shower2',(490,1310,620,1330),'door','mbed-shower2',0,2.1,1)
O('g-mbed-balcony',(225,1310,445,1330),'glazed-door','mbed-balcony',0,2.4,basis='inferred',note='Only access to the 1.9 m² balcony; the plan dimensions the gap (156) but draws no leaf')
O('g-living-balcony',(1100,1505,1740,1525),'glazed-door','living-balcony',0,2.4,basis='inferred',note='Living room to the 6.7 m² balcony; thin double line on the plan')
O('w-kitchen',(1598,118,1617,329),'window','kitchen-lightwell',1.05,2.2,basis='plan',note='150 cm, dimensioned on the plan (63 | 150 | 41); sill and head heights assumed')
O('w-bed2',(888,1310,1074,1332),'window','bed2-balcony',0.9,2.4,basis='inferred',note='10 cm line facing the balcony; reads as glazing')

O('o-living-hall',(1082,565,1096,745),'open','living-hall',0,2.8,note='Open archway between the living room and the hall (rev 9.2, walk-in rings)')

railings=[
 {'id':'r-balc1-w','a':m(211,1330),'b':m(211,1483),'h':1.1},
 {'id':'r-balc1-s','a':m(211,1483),'b':m(476,1483),'h':1.1},
 {'id':'r-balc2-w','a':m(888,1580),'b':m(888,1690),'h':1.1},
 {'id':'r-balc2-s','a':m(888,1690),'b':m(1765,1660),'h':1.1},
 {'id':'r-balc2-e','a':m(1765,1660),'b':m(1765,1525),'h':1.1},
]
solids=[
 {'id':'col-w','kind':'column','poly':[m(183,352),m(240,352),m(240,448),m(183,448)],'h':2.8},
 {'id':'col-c','kind':'column','poly':[m(1057,380),m(1113,380),m(1113,470),m(1057,470)],'h':2.8},
 {'id':'col-e','kind':'column','poly':[m(1730,350),m(1785,350),m(1785,440),m(1730,440)],'h':2.8},
 {'id':'shaft','kind':'shaft','poly':[m(1000,405),m(1090,405),m(1090,565),m(1000,565)],'h':2.8,'note':'Enclosed duct, 55 cm inside; purpose not stated on the plan'},
 {'id':'wr-bed1','kind':'wardrobe','poly':[m(225,555),m(445,555),m(445,640),m(225,640)],'h':2.2},
 {'id':'wr-mbed','kind':'wardrobe','poly':[m(225,670),m(455,670),m(530,770),m(225,770)],'h':2.2},
 {'id':'wr-bed2','kind':'wardrobe','poly':[m(875,762),m(1074,762),m(1074,840),m(875,840)],'h':2.2},
 {'id':'k-top','kind':'counter','poly':[m(1030,50),m(1598,50),m(1598,130),m(1030,130)],'h':0.9},
 {'id':'k-right','kind':'counter','poly':[m(1515,130),m(1598,130),m(1598,385),m(1515,385)],'h':0.9},
 {'id':'k-island','kind':'counter','poly':[m(1040,300),m(1375,300),m(1375,385),m(1040,385)],'h':0.9},
]
# rev 8.1: furniture as low extrusions. The top face reuses the floor texture (planar UV), so the plan's own
# furniture artwork becomes the top of each block; sides take `side`. Footprints follow the plan drawing.
def F(id,r,h,side):
    x0,y0,x1,y1=r; solids.append({'id':id,'kind':'furniture','poly':[m(x0,y0),m(x1,y0),m(x1,y1),m(x0,y1)],'h':h,'side':side})
F('f-bed1',(232,180,525,410),0.5,'#E8E1D6'); F('f-bed1-ns1',(232,125,292,190),0.55,'#6E4E33'); F('f-bed1-ns2',(232,400,292,465),0.55,'#6E4E33')
F('f-mbed',(232,885,520,1110),0.5,'#E8E1D6'); F('f-mbed-ns1',(232,830,292,890),0.55,'#6E4E33'); F('f-mbed-ns2',(232,1105,292,1170),0.55,'#6E4E33')
F('f-bed2',(718,960,1005,1190),0.5,'#E8E1D6'); F('f-bed2-ns1',(718,905,778,965),0.55,'#6E4E33'); F('f-bed2-ns2',(718,1185,778,1245),0.55,'#6E4E33')
F('f-dining',(1415,600,1540,795),0.75,'#4A3A2C'); F('f-chairs-w',(1340,595,1415,770),0.45,'#B79B74'); F('f-chairs-e',(1540,595,1615,770),0.45,'#B79B74'); F('f-chair-s',(1435,785,1515,860),0.45,'#B79B74')
F('f-sofa-e',(1605,975,1725,1310),0.8,'#CFC3B1'); F('f-sofa-s',(1380,1320,1595,1440),0.8,'#CFC3B1')
F('f-tv',(1098,915,1165,1335),0.5,'#5C4636'); F('f-side',(1625,1335,1710,1410),0.55,'#5C4636')

def R(id,name,area,poly,label_px):
    return {'id':id,'name':name,'area':area,'poly':[m(*p) for p in poly],'label':m(*label_px)}
rooms=[
 R('bed1','bedroom',9.74,[(225,47),(597,47),(597,548),(225,548)],(410,300)),
 R('shower1','shower',2.71,[(611,47),(795,47),(795,545),(611,545)],(703,300)),
 R('kitchen','kitchen',9.05,[(1015,50),(1598,50),(1598,385),(1015,385)],(1300,215)),
 R('store','store',3.14,[(1352,408),(1748,408),(1748,568),(1352,568)],(1550,490)),
 R('living','livingDining',26.41,[(1113,405),(1337,405),(1337,583),(1748,583),(1748,1505),(1089,1505),(1089,470),(1113,470)],(1400,1050)),
 R('mbed','masterBedroom',15.82,[(225,663),(457,663),(540,762),(689,762),(689,1310),(225,1310)],(455,1040)),
 R('bed2','bedroom',9.74,[(707,760),(1074,760),(1074,1310),(707,1310)],(890,1040)),
 R('shower2','shower',2.71,[(489,1332),(870,1332),(870,1568),(489,1568)],(680,1450)),
 R('balcony1','balcony',1.9,[(225,1330),(476,1330),(476,1483),(225,1483)],(350,1410)),
 R('balcony2','balcony',6.7,[(888,1335),(1074,1335),(1074,1525),(1765,1525),(1765,1660),(888,1690)],(1320,1600)),
]
hall={'id':'hall','name':None,'area':None,'poly':[m(*p) for p in [(809,47),(995,47),(995,405),(1000,405),(1000,565),(1089,565),(1089,745),(540,745),(457,655),(460,555),(809,555)]]}
footprint=[m(*p) for p in [(197,17),(1617,17),(1617,390),(1772,390),(1772,1525),(1765,1660),(888,1690),(888,1580),(476,1580),(476,1483),(197,1483)]]
crop=(180,0,1800,1765)
data={
 'unit':'BL05','type':'3 bedroom','grossM2':169.23,'netM2':119.05,
 'source':'brand-source/plans/bl05.jpg (2000×1765). Traced by realstate-frontend-design, 14 Nov 2026; tolerance about ±5 cm.',
 'units':'metres; x right, z down the plan (plan-aligned, north unknown); y up',
 'pxPerM':[SX,SY],'originPx':[OX,OY],
 'texture':{'src':'bl05-floor','cropPx':list(crop),
            'plane':{'minX':m(crop[0],crop[1])[0],'minZ':m(crop[0],crop[1])[1],'maxX':m(crop[2],crop[3])[0],'maxZ':m(crop[2],crop[3])[1]},
            'note':'UV = ((x-minX)/(maxX-minX), 1-(z-minZ)/(maxZ-minZ)); the texture is the crop resized to 1024 px wide'},
 'defaults':{'wallH':2.8,'modelCutH':2.4,'cutawayH':1.0,'doorHead':2.1,'note':'Heights are not on the plans: 2.8 m storey wall, 2.1 m door head, sills as listed. Illustrative.'},
 'footprint':footprint,'walls':walls,'openings':openings,'walkable':[],'railings':railings,'solids':solids,'rooms':rooms,'hall':hall,
}
s=json.dumps(data,separators=(',',':'),ensure_ascii=False)
open(ROOT+'docs/design/units/bl05.json','w').write(s)
print('bytes',len(s))
# overlay
im=Image.open(ROOT+'brand-source/plans/bl05.jpg').convert('RGB')
ov=Image.new('RGBA',im.size,(0,0,0,0)); d=ImageDraw.Draw(ov)
P=lambda p:(p[0]*SX+OX,p[1]*SY+OY)
for r in rooms: d.polygon([P(p) for p in r['poly']],fill=(0,160,255,50),outline=(0,120,255,255))
d.polygon([P(p) for p in hall['poly']],fill=(255,200,0,40),outline=(200,150,0,255))
d.line([P(p) for p in footprint+[footprint[0]]],fill=(0,0,0,255),width=3)
for s_ in solids: d.polygon([P(p) for p in s_['poly']],fill=(255,0,200,90) if s_['kind']=='furniture' else (140,0,255,90))
import math
def seg(a,b,t,col):
    ax,ay=P(a);bx,by=P(b);dx,dy=bx-ax,by-ay;L=math.hypot(dx,dy) or 1
    nx,ny=-dy/L,dx/L; hw=t*(SX+SY)/4
    d.polygon([(ax+nx*hw,ay+ny*hw),(bx+nx*hw,by+ny*hw),(bx-nx*hw,by-ny*hw),(ax-nx*hw,ay-ny*hw)],fill=col)
for w in walls: seg(w['a'],w['b'],w['t'],(255,0,0,150))
for o in openings: seg(o['a'],o['b'],o['t'],(0,230,230,220) if o['type']=='open' else (0,200,0,200) if o['basis']=='plan' else (255,140,0,200))
for r in railings: seg(r['a'],r['b'],0.05,(0,0,255,255))
out=Image.alpha_composite(im.convert('RGBA'),ov).convert('RGB')
out.resize((1200,1059)).save(ROOT+'docs/design/units/bl05-check.jpg',quality=80)
