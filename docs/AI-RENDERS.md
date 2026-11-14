# AI renders: shot list and prompts

For the 3D apartment room cards (DESIGN §9.6, BRIEF "3D apartments"). Every image ships labelled **"Artist's impression; finishes may vary."** and only after it has been checked against the plan (`approved: true` in `src/data/units3d/bl0X.ts`).

## Plan for the 72-hour Higgsfield trial
Start the trial only when this list is final. Generate everything in one sitting, then cancel before it renews (it renews into the paid Ultra plan).

1. Generate the **shared interiors** (section A). The finishes are the same across the tower, so one set serves all 9 types.
2. Generate one **isometric cutaway** per type (section B), using that type's plan as the reference image.
   - Optional: if there is an edit/inpaint mode, run the 9 plan clean-ups (section C). They improve the live 3D floors.
3. Make 2–3 variations of each and keep the best.
4. Download originals at the largest size offered (PNG or JPG) into `brand-source/renders/` (not `public/`). Impl converts them to AVIF/WebP.
5. Cancel the trial.

## Rules for every prompt
- **Confirmed facts only:** floor finishes exactly as the plan labels them (ceramic tile; **parquet in BL01's bedrooms and living/dining**); a high-rise apartment in Addis Ababa; balconies where the plan shows them. Nothing else is confirmed: no brands, marble, wood floors, smart-home kit or appliances by name.
- No text, logos, watermarks or people. No sea, beach or skyline that reads as another city: city views are of low-rise Addis with green hills on the horizon.

## Art direction (matches the site; DESIGN §2–§3, §9.6.5)
Append the **style line** below to every interior prompt (section A) unchanged, and the **negative line** wherever the tool takes one.

- **Mood:** calm, quiet and warm, like a well-kept hotel suite photographed for an editorial, not a showroom. Uncluttered, and lived-in only lightly (a folded throw, one book, one plant).
- **Palette (the site's tokens):**
  - Walls: ivory `#FBF7F2` and sand `#F3ECE2`, warm off-white, never pure white.
  - Floors: ceramic tile in the plan's own tones. Light warm-grey large-format tiles in the living room, kitchen and hall. Warm oak-look ceramic plank tiles in the bedrooms, as the plans colour them. Light grey veined ceramic tiles in the shower rooms.
  - Furniture: linen and light oak.
  - The **one deep colour is navy** (`#1A273F` to `#0F1828`) in a few textiles (cushions, a throw, a rug border).
  - **Gold** (`#B59458`) only as small brushed-metal accents (lamp bases, handles, a tap), never large surfaces.
  - No other saturated colour; greens only from one plant or the hills outside.
- **Light:** soft late-afternoon daylight (about 4500 K) from the room's window or balcony side, with gentle bounce and soft shadows. Low contrast, with no hard sun patches. The window is exposed so the view still reads; no blown-out glass. Lamps can be on, but they are dimmer than the daylight.
- **Lens and camera:**
  - 24 mm for rooms up to about 10 m², 28 mm for the living room.
  - Camera height 1.45 m, level, so **vertical lines stay vertical** (two-point perspective, no keystone, no fisheye).
  - The camera stands near the room's door, looking toward the window or balcony wall.
  - 3:2 landscape, generated as large as the tool allows (at least 1600 × 1067).
- **Composition:** put the window or balcony on a vertical third. **Keep the bottom-left corner (about 30% wide × 15% tall) calm and low-detail**, because the label chip "Artist's impression; finishes may vary." sits there on the site.
- **Grade:** soft and slightly warm. Whites sit at ivory, blacks are lifted slightly, saturation is about 10% below natural. No teal-and-orange grade, HDR halos, plastic CGI sheen or bloom.
- **View outside:** low-rise Addis Ababa rooftops and trees with green hills on the horizon, under a soft hazy sky. Never sea, beach, desert or a skyline of towers.

**Style line (A):** `photoreal architectural interior photograph, calm warm editorial mood, ivory and sand walls, ceramic tile floor, linen and light oak furniture, navy textiles as the only deep colour, small brushed-gold accents, soft late-afternoon daylight 4500K from the window side, low contrast, soft shadows, 1.45 m camera height, level two-point perspective with straight verticals, 3:2, quiet bottom-left corner`

**Negative line:** `text, letters, logo, watermark, people, pets, brand names, marble, hardwood floor, carpet, chrome, bright colours, teal and orange grade, HDR, bloom, fisheye, tilted verticals, wide-angle distortion, clutter, sea, beach, skyscraper skyline, night`
- Use the room's plan crop as the reference image when the tool accepts one, so the shape and door/window positions follow the plan.

## A. Shared interiors (5 shots + 2 parquet variants for BL01)
| # | Room (plan label) | Size reference | Prompt |
|---|---|---|---|
| A1 | Living / dining | BL05 26.41 m² | Photoreal interior of a bright modern living and dining room in a high-rise apartment in Addis Ababa. Light beige ceramic tile floor, warm ivory walls, a low linen sofa facing a slim TV wall unit, a round coffee table on a soft rug, a six-seat light-wood dining table near the kitchen door. Floor-to-ceiling glazed door to a balcony with a view over low-rise city and green hills. Soft late-afternoon daylight, brushed-gold lamp, navy cushions. No people, no text. 3:2, eye level, 24 mm. |
| A2 | Kitchen | BL05 9.05 m² | Photoreal interior of a compact L-shaped kitchen in a modern apartment. Light ceramic tile floor and splashback, matte ivory cabinets with slim brushed-gold handles, stone-look worktop, the hob and sink on the counter run that faces into the room, a tall run of cabinets along the back wall, and a single window above the side counter (the plan shows the window on the short side wall, not over the sink). Clean, uncluttered, soft daylight. No brands, no people, no text. 3:2, eye level, 24 mm. |
| A3 | Master bedroom | BL05 15.82 m² | Photoreal interior of a calm master bedroom in a modern apartment. Light ceramic tile floor, warm ivory walls, a double bed with linen bedding and a navy throw, two nightstands with small brushed-gold lamps, a built-in wardrobe along one wall. A glazed door to a small balcony with soft daylight. No people, no text. 3:2, eye level, 26 mm. |
| A4 | Bedroom | BL05 9.74 m² | Photoreal interior of a cosy secondary bedroom in a modern apartment. Light ceramic tile floor, ivory walls, a double bed with light linen, a nightstand and a wall wardrobe, soft daylight from a window. No people, no text. 3:2, eye level, 24 mm. |
| A1p | Living / dining, parquet (BL01) | BL01 | Same as A1, but with a warm light **parquet** floor instead of tile (BL01's plan labels its living/dining "PARQUET"). |
| A3p | Bedroom, parquet (BL01) | BL01 15.65 m² | Same as A3, but with a warm light **parquet** floor (BL01's plan labels both bedrooms "PARQUET"). |
| A5 | Shower room | BL05 2.71 m² | Photoreal interior of a small modern shower room. Large-format light grey ceramic tiles on floor and walls, a walk-in shower with a clear glass screen, a wall-hung basin with a round mirror and a brushed-gold tap, a wall-hung WC. Soft even light. No people, no text. 3:2, eye level, 24 mm. |

## B. Isometric cutaway per type (9 shots)
Reference image: `brand-source/plans/bl0X.jpg`. Use one prompt for all nine and change only the type line.

> Isometric 3D architectural cutaway of a single apartment, a physical-model look. The camera looks down at about 55–60° from the lower-left corner (a three-quarter view), with a long lens close to orthographic. All walls are cut at about door-head height, there is no ceiling, and the unit sits on a clean ivory base about 30 cm thick. Follow the attached floor plan exactly: same rooms, wall positions, doors and balconies. {TYPE: e.g. "3 bedrooms, living/dining, kitchen, store, 2 shower rooms, 2 balconies"}. Wall tops and faces in warm ivory (#FBF7F2), never grey. Ceramic tile floors in the plan's tones (light warm-grey living areas, oak-look plank tiles in bedrooms, light grey veined tiles in shower rooms). Linen and light-oak furniture placed as on the plan, navy textiles as the only deep colour, tiny brushed-gold accents. Soft warm daylight from the upper left with gentle contact shadows. Floating on a plain deep navy (#0F1828) background with a soft darker shadow under the base. No text, labels, dimensions, people or logos. Square 1:1, at least 2048 px, high detail.

This matches the site's own 3D dollhouse (DESIGN §9.6), so the stills and the live model read as one family.

Check each cutaway against its plan: room count, room order, door positions and balconies. Reject any image that adds or moves a room.

## C. Plan clean-up for the 3D floor textures (optional, 9 edits)
The live 3D model (DESIGN §9.6) uses each furnished plan as its floor. The plans carry dimension lines, numbers and room labels, and a script can only remove some of them cleanly (`docs/design/units/clean-bl05-texture.py`, v1.5). If the trial has an **edit / inpaint** mode, use it on `brand-source/plans/bl0X.jpg`:

> Remove all dimension lines, dimension numbers, tick marks, room names, area labels and "ceramic tile ff." text from this floor plan. Fill those areas with the surrounding floor, rug or furniture texture so they continue naturally. Change nothing else: keep every wall, door swing, piece of furniture, colour and shadow exactly where it is. Same image size, no crop, no shift.

- Keep the output at **exactly the input's pixel size** (BL05: 2000 × 1765). The 3D geometry is aligned to the plan's pixels.
- Check it by toggling over the original: walls and furniture must not move by even a pixel. Reject any image that redraws or restyles furniture.
- Save the result as `brand-source/plans/clean/bl0X.jpg`. Design re-crops it into `docs/design/units/bl0X-floor.webp`.

## Acceptance checklist (per image)
- [ ] Matches the plan's room shape and openings (cutaways: room count and layout).
- [ ] Only confirmed facts: no brands; floor material matches the plan label (ceramic or parquet).
- [ ] No text, logos, people or foreign skyline.
- [ ] Shipped with "Artist's impression; finishes may vary."
- [ ] Original saved in `brand-source/renders/`; `approved: true` set only after this checklist passes.
