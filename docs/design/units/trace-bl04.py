"""BL04 (3 bedroom; the brief's "store/bedroom" is labelled STORE on this plan) dollhouse data, traced on
brand-source/plans/bl04.jpg (1596×1425). The drawing is BL01's layout plus the store, placed 8 px higher, so the
BL01 coordinates are reused through Y(). Areas are the plan's labels verbatim; two are illegible (None)."""
import os, sys; sys.path.insert(0, os.path.dirname(__file__))
from trace_lib import Unit

D = -8
def R(x0, y0, x1, y1): return (x0, y0 + D, x1, y1 + D)          # a BL01 rectangle on this sheet
def Pt(*pts): return [(x, y + D) for x, y in pts]                # BL01 points on this sheet

u = Unit('bl04', 'BL04', '3 bedroom', 166.97, 117.0, sx=122.5, sy=122.5, ox=73, oy=126, crop=(60, 112, 1545, 1442),
         measured='as BL01: bedroom 430 = 531 px, 413 = 510 px, corridor 130 = 161 px; store 323 = 409 px (≈1.23 px/cm; the plan\'s own dimensions vary ±3%)')
# perimeter
u.wall('p-top', R(255, 134, 1150, 160), 'facade')
u.wall('p-shower2-n', R(1149, 277, 1529, 304), 'facade')
u.wall('p-east', R(1494, 304, 1529, 1000), 'facade')
u.wall('p-living-e', R(1255, 1000, 1280, 1300), 'facade')
u.wall('p-living-s', R(496, 1362, 1280, 1377), 'facade')
u.wall('p-shower1-w', R(73, 350, 86, 690), 'corridor')
u.wall('p-shower1-n', R(86, 340, 262, 352), 'facade')
u.wall('p-store-w', (73, 843, 86, 1206), 'facade')
u.wall('p-store-s', (73, 1193, 509, 1206), 'facade')
u.wall('p-living-w', (496, 1206, 509, 1369), 'facade')
# interior
u.wall('shower1-kitchen', R(264, 330, 286, 690))
u.wall('shower1-s', R(86, 668, 170, 690))
u.wall('kitchen-s', R(405, 668, 573, 688))
u.wall('kitchen-bed1', R(573, 160, 604, 688))
u.wall('bed1-s', R(720, 668, 963, 688))
u.wall('bed1-bed2', R(963, 491, 977, 690))
u.wall('bed2-n', R(963, 491, 1494, 510))
u.wall('bed1-shower2-a', R(1135, 277, 1149, 304))
u.wall('bed1-shower2-b', R(1135, 420, 1149, 491))
u.wall('living-n', R(690, 822, 1280, 862))
u.wall('store-n-w', (73, 843, 280, 860)); u.wall('store-n-e', (380, 843, 509, 860))
u.wall('store-living', (496, 860, 509, 1206))
# openings
u.door('entry', R(73, 690, 86, 851), 'corridor', note='Main entrance at the corridor end, single leaf (read from the swing)')
u.door('d-shower1', R(170, 668, 262, 690), 'shower1-corridor')
u.door('d-kitchen', R(290, 668, 405, 688), 'kitchen-corridor')
u.door('d-bed1', R(604, 668, 720, 688), 'bed1-corridor')
u.door('d-shower2', R(1135, 304, 1149, 420), 'bed1-shower2', note='En-suite to the larger bedroom')
u.door('d-bed2', R(835, 690, 850, 815), 'bed2-corridor')
u.door('d-store', (280, 843, 380, 860), 'store-corridor')
u.opening('g-kitchen-balcony', R(262, 160, 286, 330), 'glazed-door', 'kitchen-balcony', 0, 2.4, 'inferred', note='Thin double line between the kitchen and the 1.31 m² balcony')
u.opening('g-bed1-balcony', R(1135, 160, 1150, 277), 'glazed-door', 'bed1-balcony', 0, 2.4, 'inferred', note='Thin double line between the bedroom and the 1.06 m² balcony')
u.opening('g-bed2-balcony', R(1280, 815, 1494, 830), 'glazed-door', 'bed2-balcony', 0, 2.4, 'inferred', note='Thin double line between the bedroom and the 2.68 m² balcony')
u.opening('g-living-balcony', R(1265, 864, 1280, 1000), 'glazed-door', 'living-balcony', 0, 2.4, 'inferred', note='Thin double line between the living room and the 2.68 m² balcony')
u.open('o-living-corridor', R(509, 851, 690, 864), 'living-corridor')
# balconies
u.railing('r-b1-n', *Pt((140, 147), (262, 147))); u.railing('r-b1-w', *Pt((140, 147), (140, 268)))
u.railing('r-b2-n', *Pt((1150, 140), (1315, 140))); u.railing('r-b2-e', *Pt((1315, 140), (1315, 277)))
u.railing('r-b3-s', *Pt((1280, 1000), (1494, 1000)))
# solids
u.solid('shaft', 'shaft', Pt((77, 268), (158, 268), (158, 350), (77, 350)), 2.8, note='Enclosed duct; purpose not stated on the plan')
for i, r in enumerate([R(63, 450, 110, 535), R(563, 440, 615, 530), R(1225, 465, 1315, 515), R(1252, 1290, 1301, 1410), (118, 1206, 506, 1244), (466, 1244, 506, 1369)]):
    u.column(f'col-{i+1}', r)
u.counter('k-top', R(296, 160, 573, 228)); u.counter('k-right', R(505, 228, 573, 668)); u.counter('k-left', R(290, 235, 355, 505))
u.wardrobe('wr-bed1', R(730, 585, 950, 668)); u.wardrobe('wr-bed2', R(977, 506, 1050, 668))
u.bed('f-bed1', R(730, 170, 950, 445)); u.nightstand('f-bed1-ns1', R(685, 165, 742, 225)); u.nightstand('f-bed1-ns2', R(945, 165, 1000, 225))
u.bed('f-bed2', R(1270, 515, 1440, 775)); u.nightstand('f-bed2-ns1', R(1228, 515, 1280, 570)); u.nightstand('f-bed2-ns2', R(1435, 515, 1490, 570))
u.furniture('f-sofa-n', R(820, 850, 1150, 945), 0.8, '#CFC3B1'); u.furniture('f-sofa-e', R(1150, 955, 1255, 1180), 0.8, '#CFC3B1')
u.furniture('f-side', R(1170, 860, 1240, 930), 0.55, '#5C4636'); u.furniture('f-tv', R(780, 1305, 1155, 1360), 0.5, '#5C4636')
u.furniture('f-dining', R(510, 1060, 690, 1200), 0.75, '#4A3A2C')
u.furniture('f-chairs-n', R(510, 1010, 690, 1060), 0.45, '#B79B74'); u.furniture('f-chairs-s', R(510, 1200, 690, 1255), 0.45, '#B79B74')
u.furniture('f-chair-e', R(690, 1080, 745, 1170), 0.45, '#B79B74')
u.protect = [R(820, 960, 1195, 1230)]  # rug
# rooms (plan labels verbatim)
u.room('balcony1', 'balcony', 1.31, Pt((145, 160), (262, 160), (262, 330), (145, 330)), (200, 237))
u.room('kitchen', 'kitchen', None, Pt((286, 160), (573, 160), (573, 668), (286, 668)), (430, 552), note='Area label hidden under the "230" dimension; reads like 8.84 m². Confirm with the client.')
u.room('shower1', 'shower', 3.56, Pt((86, 352), (264, 352), (264, 668), (86, 668)), (175, 512))
u.room('bed1', 'bedroom', 15.65, Pt((604, 160), (1135, 160), (1135, 491), (963, 491), (963, 668), (604, 668)), (800, 512))
u.room('balcony2', 'balcony', 1.06, Pt((1150, 160), (1315, 160), (1315, 277), (1150, 277)), (1230, 212))
u.room('shower2', 'shower', 4.47, Pt((1149, 304), (1494, 304), (1494, 491), (1149, 491)), (1320, 392))
u.room('bed2', 'bedroom', 13.14, Pt((977, 510), (1494, 510), (1494, 815), (850, 815), (850, 690), (977, 690)), (1150, 642))
u.room('corridor', 'corridor', 6.84, Pt((86, 690), (850, 690), (850, 822), (690, 822), (690, 851), (86, 851)), (470, 762))
u.room('living', 'livingDining', None, Pt((509, 864), (1265, 864), (1265, 1362), (509, 1362)), (880, 1112), note='Area label partly hidden under the rug text; reads like 26.25 m². Confirm with the client.')
u.room('store', 'store', 8.43, [(86, 860), (496, 860), (496, 1193), (86, 1193)], (280, 1010))
u.room('balcony3', 'balcony', 2.68, Pt((1280, 830), (1494, 830), (1494, 1000), (1280, 1000)), (1390, 912))
u.footprint([(140, 126), (1315, 126), (1315, 269), (1529, 269), (1529, 992), (1280, 992), (1280, 1369), (496, 1369), (496, 1206), (73, 1206), (73, 260), (140, 260)])
u.build()
