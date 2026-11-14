# AI renders: shot list and prompts

For the 3D apartment room cards (DESIGN §9.6, BRIEF "3D apartments"). Every image ships labelled **"Artist's impression; finishes may vary."** and only after it has been checked against the plan (`approved: true` in `src/data/units3d/bl0X.ts`).

## Plan for the 72-hour Higgsfield trial
Start the trial only when this list is final. Generate everything in one sitting, then cancel before it renews (it renews into the paid Ultra plan).

1. Generate the **shared interiors** (section A). The finishes are the same across the tower, so one set serves all 9 types.
2. Generate one **isometric cutaway** per type (section B), using that type's plan as the reference image.
3. Make 2–3 variations of each and keep the best.
4. Download originals at the largest size offered (PNG or JPG) into `brand-source/renders/` (not `public/`). Impl converts them to AVIF/WebP.
5. Cancel the trial.

## Rules for every prompt
- **Confirmed facts only:** ceramic tile floors; a high-rise apartment in Addis Ababa; balconies where the plan shows them. Nothing else is confirmed: no brands, marble, wood floors, smart-home kit or appliances by name.
- No text, logos, watermarks or people. No sea, beach or skyline that reads as another city: city views are of low-rise Addis with green hills on the horizon.
- Palette: warm ivory walls, soft natural light, light wood and linen, small brushed-gold accents, navy textiles as the one deep colour (brand: navy #1A273F, gold #B59458, ivory #FBF7F2).
- Camera: eye level (1.5 m), 24–28 mm, two-point perspective, 3:2 landscape, photoreal architectural visualisation.
- Use the room's plan crop as the reference image when the tool accepts one, so the shape and door/window positions follow the plan.

## A. Shared interiors (5 shots)
| # | Room (plan label) | Size reference | Prompt |
|---|---|---|---|
| A1 | Living / dining | BL05 26.41 m² | Photoreal interior of a bright modern living and dining room in a high-rise apartment in Addis Ababa. Light beige ceramic tile floor, warm ivory walls, a low linen sofa facing a slim TV wall unit, a round coffee table on a soft rug, a six-seat light-wood dining table near the kitchen door. Floor-to-ceiling glazed door to a balcony with a view over low-rise city and green hills. Soft late-afternoon daylight, brushed-gold lamp, navy cushions. No people, no text. 3:2, eye level, 24 mm. |
| A2 | Kitchen | BL05 9.05 m² | Photoreal interior of a compact L-shaped kitchen in a modern apartment. Light ceramic tile floor and splashback, matte ivory cabinets with slim brushed-gold handles, stone-look worktop, built-in hob and sink under a single window. Clean, uncluttered, soft daylight. No brands, no people, no text. 3:2, eye level, 24 mm. |
| A3 | Master bedroom | BL05 15.82 m² | Photoreal interior of a calm master bedroom in a modern apartment. Light ceramic tile floor, warm ivory walls, a double bed with linen bedding and a navy throw, two nightstands with small brushed-gold lamps, a built-in wardrobe along one wall. A glazed door to a small balcony with soft daylight. No people, no text. 3:2, eye level, 26 mm. |
| A4 | Bedroom | BL05 9.74 m² | Photoreal interior of a cosy secondary bedroom in a modern apartment. Light ceramic tile floor, ivory walls, a double bed with light linen, a nightstand and a wall wardrobe, soft daylight from a window. No people, no text. 3:2, eye level, 24 mm. |
| A5 | Shower room | BL05 2.71 m² | Photoreal interior of a small modern shower room. Large-format light grey ceramic tiles on floor and walls, a walk-in shower with a clear glass screen, a wall-hung basin with a round mirror and a brushed-gold tap, a wall-hung WC. Soft even light. No people, no text. 3:2, eye level, 24 mm. |

## B. Isometric cutaway per type (9 shots)
Reference image: `brand-source/plans/bl0X.jpg`. Use one prompt for all nine and change only the type line.

> Isometric 3D architectural cutaway of a single apartment, viewed from above at about 45°, walls cut at waist-to-head height, no ceiling, following the attached floor plan exactly: same rooms, wall positions, doors and balconies. {TYPE: e.g. "3 bedrooms, living/dining, kitchen, store, 2 shower rooms, 2 balconies"}. Light ceramic tile floors, warm ivory walls, light-wood and linen furniture as on the plan, small brushed-gold accents, soft daylight with gentle shadows. Floating on a plain deep navy (#1A273F) background. No text, labels, dimensions, people or logos. Square, high detail.

Check each cutaway against its plan: room count, room order, door positions and balconies. Reject any image that adds or moves a room.

## Acceptance checklist (per image)
- [ ] Matches the plan's room shape and openings (cutaways: room count and layout).
- [ ] Only confirmed facts: no brands, no named materials beyond ceramic tile.
- [ ] No text, logos, people or foreign skyline.
- [ ] Shipped with "Artist's impression; finishes may vary."
- [ ] Original saved in `brand-source/renders/`; `approved: true` set only after this checklist passes.
