import glob, sys, math
from PIL import Image
NAVY = (11,18,32); IV = 0.934
LUT = [ (c/255)/12.92 if c/255 <= 0.04045 else (((c/255)+0.055)/1.055)**2.4 for c in range(256)]
def linf(v):
    v = max(0, min(255, v)); i = int(v); f = v-i
    return LUT[i] if i == 255 else LUT[i]*(1-f)+LUT[i+1]*f
def ramp(t, stops):
    if t <= stops[0][0]: return stops[0][1]
    for (p0,a0),(p1,a1) in zip(stops, stops[1:]):
        if t <= p1: return a0 + (a1-a0)*(t-p0)/(p1-p0)
    return stops[-1][1]
def comb(*a):
    r = 1
    for x in a: r *= (1-x)
    return 1-r
def desktop(W,H):
    def f(x,y):
        L1 = ramp(x/W, [(0,.80),(.48,.70),(.72,.30),(1,.15)])
        L2 = ramp(y, [(0,.70),(72,.45),(200,0)])
        L3 = ramp((H-y)/H, [(0,.65),(.28,0)])
        d = math.hypot((x/W-.70)/1.30, (y/H-.45)/1.0)
        L4 = ramp(d, [(0,0),(.5,0),(1,.40)])
        return comb(L1,L2,L3,L4)
    return f
def mobile(W,H,ct):
    def f(x,y):
        M1 = ramp(y, [(0,.78),(64,.62),(.25*H,.30),(H,.30)])
        M2 = ramp(y-(ct-120), [(0,0),(120,.72),(1e6,.80)])
        return comb(M1,M2)
    return f
cases = {
 'desktop1366': (1366,768,desktop(1366,768),{'nav':(20,52,420,1180),'text col':(170,640,64,656)}),
 'desktop1920': (1920,1080,desktop(1920,1080),{'nav':(20,52,600,1700),'text col':(240,900,96,920)}),
 'mobile360x740': (360,740,mobile(360,740,292),{'header':(16,48,16,344),'content':(292,724,16,344)}),
 'mobile360x640': (360,640,mobile(360,640,192),{'header':(16,48,16,344),'content':(192,624,16,344)}),
 'tablet768': (768,1024,mobile(768,1024,520),{'header':(16,48,16,752),'content':(520,1000,32,600)}),
}
STEP = 4
frames = [Image.open(f).convert('RGB') for f in sorted(glob.glob(sys.argv[1]))]
for name,(W,H,A,zones) in cases.items():
    worst = {}
    for fr in frames:
        s = max(W/fr.width, H/fr.height)
        im = fr.resize((round(fr.width*s), round(fr.height*s)), Image.BILINEAR)
        x0 = (im.width-W)//2; y0 = (im.height-H)//2
        px = im.load()
        for z,(ya,yb,xa,xb) in zones.items():
            Ls = []
            for y in range(ya,yb,STEP):
                for x in range(xa,xb,STEP):
                    a = A(x,y); r,g,b = px[x+x0,y+y0]
                    c = [a*n+(1-a)*p for n,p in zip(NAVY,(r,g,b))]
                    Ls.append(0.2126*linf(c[0])+0.7152*linf(c[1])+0.0722*linf(c[2]))
            Ls.sort(); Lb = Ls[int(len(Ls)*0.995)-1]
            cr = (IV+.05)/(Lb+.05)
            worst[z] = min(worst.get(z,99), cr)
    print(name, {z: round(v,2) for z,v in worst.items()})
