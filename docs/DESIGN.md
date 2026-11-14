# Dar Al Salam: design spec

Owner: `realstate-frontend-design`. Inputs: `docs/BRIEF.md` (facts and the quality bar) and `CLAUDE.md`. If this spec and the brief disagree on a fact, the brief wins. Everything here is direction and can be refined. If you change direction, say so in this file so the reviewer has something to check against.

**Changelog.** 15 Nov 2026, rev 10.5: on phones, walk-in edge chips show the room name only (§9.8). Rev 10.4: round 8 review decisions (tower photo gated by an observer, mask 50% 45%, no vertical scrub, deep links open the walk on slow connections); walk-in arrival view and edge chips so an exit is always on screen (§9.7, §9.8); the street-side reading from the satellite image (§12). Rev 10.3: one azimuth convention for all explorer scenes; window bays 1.8 m; F2 fixture data delivered for all nine units (§9.9, §9.10 F2). Rev 10.2: F2 data format for fixtures, furniture pieces and floor finish; BL05 delivered (§9.10 F2). Rev 10.1: the tower's ground storey is 6.3 m, matching the render (§9.9, `tower3d.json`). Rev 10 (user feedback, round 9: real 3D, nothing discarded): new §9.9, a real Three.js tower in a generic city scene with floor pins, a push-in, a slide-out floor and a floor assembled from the nine traced units (the rev 9 photo stage becomes the fallback); new §9.10, a parametric furniture library, PBR materials, tiered light and post-processing, the dive, and an optional "Render this view" path-traced still. Data: `docs/design/tower3d.json`. Rev 9.4 (browser walk of BL05 and BL09): every room has a clear `stand` point for the walk-in camera; ring labels are unique; unlabelled spaces get positional ring labels; BL09's 0.8 m² balcony is not a walk destination (§9.6.1). Rev 9.3: panorama strips use a narrower fov (about 47° at 180°) with pitch about ±4°, so the strip's edges never show (§9.8 B5). Rev 9.2: unit data gains `open` archway openings and `walkable[]` unlabelled spaces for the walk-in rings, in all nine units (§9.6.1); walk-in lamp intensity 6 and an emissive ceiling (§9.8 B3). Rev 9.1 (impl's A1 corrections, accepted): band uses normal blending; stage mask is 60% 55%; image widths cap at 1350; the SVG maquette fallback loads lazily; the Amharic ground chip reuses the legend wording (§9.7, §11). Rev 9 (user feedback, round 8): new §9.7, the photoreal tower stage (the real render with 14 selectable floor bands, a push-in and a slab lift; the Three.js massing is removed), and new §9.8, walk-in mode ("Step inside": eye-level look-around, door rings between rooms, a minimap, and a panorama slot). Also §8, §10, §11, §12 and `docs/AI-RENDERS.md` §D–§E. Finding: the tower render draws 13 typical storeys, so the 14 bands are an even split, not a storey-accurate trace. 15 Nov 2026, rev 8.5 (user requests, BRIEF 761faf2): R1 the Location section always shows the satellite map, with a navy fallback card in place of the SVG diagram, its caption and the opt-in pill (§5.6). R2 the Telegram enquiry is a multi-line message that skips empty fields (§5.8). R3 the "Contact us on Telegram" card and its divider are removed (§5.8). All nine unit data sets are delivered (§9.6.1). 14/15 Nov 2026, rev 8.4: other-unit data format notes (illegible areas → `null`; `corridor` room; shared tracer) (§9.6.1). BL01 data delivered. Rev 8.3 (review round 6 #5): the 3D panel's rooms list goes to 2 columns only from 1200 px (§9.6.7 E). Rev 8.2 (re-check of rev 8.1, §9.6.8): stronger camera fill, greige-oak wardrobes, floor texture v1.5. Rev 8.1 (review of 4e7da27): §9.6.7 accepts impl's deviations 1–5. Hotspots now float above the cut, with leader lines. A camera fill light keeps wall faces cream. The model is cut at 2.4 m with a 60° default elevation, and the fit is 100%. BL05 gains 17 furniture blocks whose tops reuse the plan texture. The panel puts the actions above a 2-column room list. Rev 7.1 (round 5 review): the Save-Data/slow opt-in map opens at z17 with no fly; the two-finger hint moves to 70% height; the map glue budget is now 4 KB (§5.6, §10). Rev 8 (BRIEF "3D apartments", 40c474f): new §9.6, the unit dollhouse. When a unit has 3D geometry, its plan lifts into a Three.js cutaway with room hotspots, a slim side panel and a room card with the AI interior slot (placeholder: the room's plan crop). The pilot is BL05: `docs/design/units/bl05.json` plus its floor texture, check overlay and tracing script. Also §9.2 UNIT, §8, §10, §11, §12. Rev 7 (client, BRIEF Update 2026-11-14 and ea0501e): Location becomes a real Leaflet + Esri World Imagery satellite map with a branded pin at 8.9356809, 38.7299505. The SVG diagram is now only the static fallback (no JS, slow or Save-Data until opted in, tile failure), and "Diagram, not to scale." shows only with it. "Get directions" is switched on; there is an optional Esri key, and the attribution is always visible (§5.6 rewritten, §7.3 S13–S14, §8, §10). A "Contact us on Telegram" card shows the two usernames only. The form hands off to Telegram with a prefilled draft, a copy fallback and a persistent "Finish in Telegram" panel (§5.8). Strings with draft Amharic are in §11, open items in §12. Rev 6 (user decision) (user decision): the film becomes the full hero background with a verified shade, grain, a play control and pause/sound controls (§5.1 rewritten, §5.11, §7.2, §7.3 S1, §8, §10). The rev 5 film card is removed. The Story arch now shows the whole tower (§5.3), and the Enquire arch takes the balconies detail. Rev 5 (BRIEF "Update 2026-11-14"): the tower film and its sound toggle (new §5.11, the hero card in §5.1, §7.2, §7.3 S1, §8, §10); building features band (§5.7: three pillars plus four features); 16 floors (§5.1, §5.2, §9.2); BL01 "to be confirmed" off floors 4, 6, 8, 10, 11 (§5.5, §5.8, §9.1–§9.3); the exact Maps pin (§5.6). Each rev 5 change is tagged "rev 5" where it lives, so later client facts can be slotted in one place at a time. Rev 4: §10 HTML budget raised to 40 KB gzipped (inline CSS by choice). Rev 3 (M2 visual QA): S9 dusk is now a static gradient (the fixed veil dimmed the story copy); §9.4 camera framing numbers, ground disc, look-at clamp, glazing colour. 12 Nov 2026, rev 2: applied review findings 1–10 (`.theme-paper`, `--input-border`, no colour tweens, copy fixes, CSS-only hero reveal, server-rendered hotspot hrefs, font subsetting, blocks internal only, pillar and payment copy, mark as `<symbol>`).

**Design assets this spec relies on (all in the repo):**

| File | What it is |
|---|---|
| `brand-source/logo/mark.svg` | The gold mark (dome, keyhole, dove, ring) as a vector. I auto-traced it with potrace from `logo-full-original.png`, so it is faithful to the raster. It is one filled path, 415×319 viewBox. 38 KB raw. In the app: run it through SVGO once (precision 1), set `fill="currentColor"`, **inline it once per page as a `<symbol id="mark">`** in a hidden sprite at the top of `<body>`, and reference it everywhere (intro, footer, watermark, dividers) with `<svg><use href="#mark"/></svg>`. Never inline the full path more than once. |
| `brand-source/plans/keyplan-duotone.png` | The typical-floor key plan recoloured to ink-on-ivory, with the baked-in legend removed and each unit's tone normalised. This is the base image for the floor view; our own SVG hotspots supply the colour. 1549×1940, the same pixel grid as the original. |
| `docs/design/keyplan-hotspots.json` | Polygons and centroids for BL01–BL09 in key-plan pixels, the floor-plate outline (for the 3D massing), the scale (35.7 px/m), and the legend colours. |
| `docs/design/keyplan-hotspots-check.jpg` | The traced polygons drawn over the original plan, for visual verification. |
| `public/video/hero-bg.webm` (AV1), `hero-bg.mp4` (H.264), `hero-bg-poster.webp` / `.jpg` | Rev 6 hero background: a 640×352, 24 fps, 20.6 s loop with no audio and a continuous seam, plus its first frame as the poster (the LCP). The rev 5 `film-loop.*` and `film-poster.*` files are no longer used. |
| `docs/design/hero-grain.png`, `hero-shade-check.jpg`, `hero-shade-contrast.py` | Rev 6: the grain tile, the shade previewed over the poster at 1366 and 360, and the script that verified hero text contrast over every second of the loop. |
| `docs/design/story-arch-check.jpg` | Rev 6: the whole-tower Story crop seen through the dome mask, at rest and at 1.06 overscan. |
| `docs/design/units/bl05.json`, `bl05-floor.webp`, `bl05-check.jpg`, `trace-bl05.py`, `clean-bl05-texture.py` | Rev 8: BL05's 3D geometry (walls, openings, solids, rooms, in metres), its floor texture, the overlay check against the plan, and the script that traced it (§9.6.1). |
| `public/video/film.mp4`, `film-full-poster.webp` / `.jpg` | The full 41 s fly-through (640×352, H.264 + AAC, faststart) and its poster, 640×352. Loaded only when the film dialog opens. The source is `brand-source/video/tower-film-original.mp4`. |

---

## 1. References (checked 12 Nov 2026)

What to borrow, and from whom:

| # | Site | Borrow |
|---|---|---|
| 1 | **Silver Pinewood Residences**: https://silver-pinewood.com/ ([Awwwards SOTD](https://www.awwwards.com/sites/silver-pinewood-residences)) | Calm, even scroll pacing with only 2 to 3 quiet colours. One signature WebGL object that still runs well on phones. Restraint is the luxury signal. Our equivalent object is the tower maquette. |
| 2 | **Sobha Privy Collection**: https://sobha-privy-collection.com/ ([Awwwards SOTD](https://www.awwwards.com/sites/sobha-privy-collection)) | Hero image that scales on scroll (our tower in its arch scales up as the hero scrolls away). A product selector pattern for the unit types. |
| 3 | **ERA Residence (Marbella)**: https://www.era-residence.com/ ([Awwwards SOTD/SOTM](https://www.awwwards.com/sites/era-residence)) | Short preloader, then a scroll-driven page. Key-features strip and property-card layout (our facts strip and plan cards). The day/night toggle is the idea behind our ivory to navy "dusk" transition into the explorer. |
| 4 | **Above the Clouds, 111 W 57**: https://quadplex80.com/ ([Awwwards SOTD](https://www.awwwards.com/sites/above-the-clouds-111-w-57)) | A cinematic intro that rises into the tower. We take only the feeling: a slow vertical camera move in the 3D scene. No gated "enter" screen, because it hurts LCP and conversion. |
| 5 | **Belgrade Arbor**: https://belgradearbor.rs/en ([Awwwards SOTD](https://www.awwwards.com/sites/belgrade-arbor)) | The closest stack match (GSAP, smooth scroll, Three.js building scene). It shows the pacing to aim for: intro, then smooth scroll, then the 3D building. It also has residence filters. |
| 6 | **Poklonnaya 9**: https://poklonnaya9.site/ (floor list at https://poklonnaya9.site/apartments-visual; Awwwards SOTD and FWA per https://videinfra.com/work/poklonnaya-9) | **The floor-selector UX.** Two entry paths ("visual selection" and "select by criteria"), the tower split into labelled floor bands, and each floor row summarising its unit types and counts. Clicking a floor opens the floor plate. We copy this structure but show no prices or sold status. |
| 7 | **Springs**: https://springs.estate/ ([Awwwards SOTD](https://www.awwwards.com/sites/springs)) | Big-number tabs ("138 flats") next to type tabs (our 2-bed / 3-bed filter chips with counts). A visual selector over the full render paired with a parametric search. |
| 8 | **LIKOVA**: https://likova.space ([Awwwards SOTD](https://www.awwwards.com/sites/likova)) | The exact flow we want: building, then select floor (with stats), then floor plan, then a unit card with plan and areas. Panels slide over one another as you scroll. |
| 9 | **ERA quarter (Vide Infra)**: case study at https://videinfra.com/blog/era-premium-real-estate-website-case-study (no live URL found) | The fallback idea: a **pre-rendered, non-WebGL building view** that still feels 3D. Our fallback is a build-time axonometric SVG (§9.4). |
| 10 | **Telha Clarke**: https://telhaclarke.com.au/ ([Awwwards SOTD](https://www.awwwards.com/sites/telha-clarke)) | Clip-path plus translate title reveals and a quiet parallax grid of images. We put the same reveal craft inside **arch-shaped** frames. |

I found no awarded site that uses a dome or arch-shaped mask, so that motif is ours. Common pattern in floor selectors: a visual path and a filter path; a hovered floor slab shows a tint plus a tooltip (floor number and unit mix); a clicked floor opens the plate with unit polygons; a hovered unit shows a mini card; a clicked unit opens a side panel with the plan and specs; a "request" CTA is always visible.

---

## 2. Concept and art direction

**"House of Peace": a calm arrival.** The page is a slow walk from the street, through an arched door, into a quiet home. Three ideas carry it:

1. **The arch is the window.** The dome and arch silhouette from the logo is our only image mask. The hero tower, story images and plan cards all sit inside it. Nothing else on the page uses a decorative frame. Thin gold double lines (the logo's ring is drawn as a thick line plus a thin line) appear as hairline rules and as arch outlines offset 8–12 px around masked media.
2. **Day to dusk.** The page starts on warm ivory paper (day). It deepens to navy for the tower explorer (dusk: the building as a lit maquette in a dark room), returns to ivory for the homes, and ends in navy for the footer. Gold appears only in small, precious amounts: rules, numerals, focus rings, the mark, active states. **Gold is never used as a large background.**
3. **Architectural honesty.** The plans are the hero content. They are presented the way an architect's drawings are: ink on ivory, generous margins, dimensions in m² with tabular numerals, and a single gold highlight for the thing you selected.

Tone of voice: quiet and confident. Short serif statements, factual sans-serif details, no exclamation marks.

**Imagery treatment.** The tower render has a busy collage sky (clouds, birds, rainbow arc). We hide most of it with the arch mask, crop tight to the building, and grade it once at build time: saturation −15%, slightly warmer, slight lift in the shadows. The impl can do this with `sharp().modulate({saturation:0.85}).tint(...)` in a one-off prepare script, or skip the grade if time is short. Suggested crop for the hero (from the 2251×2163 original): `left 190, top 110, width 1560, height 1950` (4:5), with the building centred. For the wide desktop variant, use `object-position: 45% 35%`. A navy-to-transparent gradient (bottom 30%, `rgba(15,24,40,.55)` to 0) sits over the image only where text overlaps it on mobile.

Disclaimer copy (footer and under the plan viewer): "Renders and plans are illustrative and may change."

---

## 3. Design tokens

Put them in `src/styles/tokens.css`. Contrast ratios below are measured (WCAG 2.x).

### 3.1 Colour

```css
:root {
  /* brand ramps */
  --navy-950: #0B1220;  --navy-900: #0F1828;  --navy-800: #1A273F; /* = logo wordmark */
  --navy-700: #24344F;  --navy-600: #34466A;
  --gold-300: #E6D3A8;  --gold-400: #D9BE86;  --gold-500: #B59458; /* = mark mid */
  --gold-600: #8C6B32;  --gold-700: #7A5C28;
  --ivory-50: #FBF7F2;  /* paper */  --sand-100: #F3ECE2;  --sand-200: #E4DACB;
  --stone-500: #5C6270; --mist-300: #A9B0BE;
  --danger-600: #A3362B; --success-600: #2F6B4F;

  /* semantic, light (default) */
  --bg: var(--ivory-50);        --bg-alt: var(--sand-100);
  --text: var(--navy-800);      /* 14.0:1 on ivory */
  --text-muted: var(--stone-500);/* 5.7:1 on ivory, 5.2:1 on sand */
  --accent: var(--gold-500);    /* decorative only: lines, icons ≥ 3:1 not needed */
  --accent-text: var(--gold-700);/* gold text on ivory 5.8:1 (gold-500 is 2.7:1: never for text on light) */
  --line: var(--sand-200);      --line-strong: color-mix(in srgb, var(--navy-800) 18%, transparent); /* decorative only */
  --input-border: color-mix(in srgb, var(--navy-800) 55%, transparent); /* ≥ 3:1 non-text contrast on ivory/sand */
  --focus: var(--gold-600);     /* 4.6:1 on ivory */
  --btn-bg: var(--navy-800);    --btn-text: var(--ivory-50);
  --btn2-border: var(--navy-800);
}
/* dark sections: add class="theme-dusk" on the <section> */
.theme-dusk {
  --bg: var(--navy-900);        --bg-alt: var(--navy-800);
  --text: var(--ivory-50);      /* 14:1 on navy-800 */
  --text-muted: var(--mist-300);/* 6.9:1 on navy-800, 8.2:1 on navy-900 */
  --accent: var(--gold-500);    /* 5.2:1 on navy-800: OK for large text and UI */
  --accent-text: var(--gold-400);/* 8.3:1 on navy-800 */
  --line: color-mix(in srgb, var(--ivory-50) 14%, transparent);
  --focus: var(--gold-300);
  --btn-bg: var(--gold-500);    --btn-text: var(--navy-900); /* 5.2:1+ */
  --btn2-border: var(--gold-400);
  --input-border: color-mix(in srgb, var(--ivory-50) 55%, transparent);
}
/* light "paper" panel nested inside a dusk section (explorer panel, cards on navy) */
.theme-paper {
  --bg: var(--ivory-50);        --bg-alt: var(--sand-100);
  --text: var(--navy-800);      --text-muted: var(--stone-500);
  --accent: var(--gold-500);    --accent-text: var(--gold-700);
  --line: var(--sand-200);      --line-strong: color-mix(in srgb, var(--navy-800) 18%, transparent);
  --input-border: color-mix(in srgb, var(--navy-800) 55%, transparent);
  --focus: var(--gold-600);
  --btn-bg: var(--navy-800);    --btn-text: var(--ivory-50);  --btn2-border: var(--navy-800);
  background: var(--bg); color: var(--text);
}
```

Rules: `--line-strong` is decorative only (rules, map roads). Anything interactive whose boundary identifies it (inputs, hotspot outlines, secondary buttons) uses `--input-border` or stronger. Gold-500 for text only on navy. Body text is never gold. Primary button: navy on light, gold with navy text on dark. Hotspot fill on the key plan is gold-500 at 0.28 when hovered and 0.45 when selected, with a 2 px gold-600 stroke.

### 3.2 Typography

| Role | Family | Notes |
|---|---|---|
| Display / headings | **Cormorant Garamond** (variable wght 300–700, latin subset) plus **one static italic file: weight 500, latin subset** for the one emphasis word per heading | A classic roman that fits the wordmark. Its italic replaces the brochure's script headings ("Apartment", "Easy to Live") without loading a script font. Self-host from Fontsource (`@fontsource-variable/cormorant-garamond`) or the Google woff2, subset to Latin. Never below 24 px (thin hairlines). |
| Body / UI / numerals in UI | **Manrope** variable (files in `brand-source/fonts/`) | Its uppercase with wide tracking matches "REAL ESTATE" in the logo. Use `font-variant-numeric: tabular-nums` for all m² values. |
| Amharic (all roles) | **Noto Sans Ethiopic** variable (`brand-source/fonts/`) | Headings at 600, body at 400. **Subset to the glyphs used in the `am` dictionary** (plus punctuation and digits) at build time, e.g. `pyftsubset --text-file` or `glyphhanger` over the dictionary strings; re-run when the dictionary changes. Load **only** when `lang="am"` (the /am route), with no faux italic (Ethiopic has no italic). Line-height +0.1 relative to Latin. Letter-spacing 0 (no tracking on eyebrows). |

Fluid scale (360 → 1440 px viewport). `font-display: swap`; preload only the Cormorant and Manrope latin files.

```css
:root {
  --fs-display: clamp(2.75rem, 1.6rem + 5.1vw, 6.5rem);   /* 44 → 104 · hero H1 · lh .95 · wght 500 · tracking -0.015em */
  --fs-h2:      clamp(2.25rem, 1.5rem + 3.3vw, 4.5rem);   /* 36 → 72  · lh 1.0 · wght 500 */
  --fs-h3:      clamp(1.5rem, 1.2rem + 1.3vw, 2.25rem);   /* 24 → 36  · lh 1.1 · wght 500 */
  --fs-number:  clamp(3rem, 2rem + 4.4vw, 5.75rem);       /* facts numerals, Cormorant 400, lining */
  --fs-lead:    clamp(1.0625rem, 1rem + .35vw, 1.3125rem);/* Manrope 400 · lh 1.6 */
  --fs-body:    1rem;      /* lh 1.65; never smaller for paragraphs */
  --fs-small:   .875rem;   /* lh 1.5; captions, specs labels */
  --fs-eyebrow: .75rem;    /* Manrope 600 · uppercase · tracking .22em · accent-text colour */
  --fs-input:   1rem;      /* ≥16px, iOS zoom rule */
  --measure: 62ch;
}
```

Eyebrows are numbered: `01 — The tower`, `02 — Explore`, and so on. The number is in gold, followed by a 24 px hairline rule, then the label.

### 3.3 Spacing, grid, radii, elevation

```css
:root {
  --space-1: .25rem; --space-2: .5rem; --space-3: .75rem; --space-4: 1rem; --space-5: 1.5rem;
  --space-6: 2rem;   --space-7: 3rem;  --space-8: 4rem;   --space-9: 6rem;  --space-10: 8rem;
  --section-y: clamp(5rem, 3rem + 9vw, 11rem);      /* 80 → 160 */
  --gutter: clamp(1rem, .6rem + 1.6vw, 1.5rem);     /* 16 → 24 */
  --margin: clamp(1rem, -0.2rem + 5.3vw, 4.5rem);   /* 16 → 72 page side margin */
  --container: 82.5rem;                              /* 1320 */
  --radius-xs: 2px;   /* inputs, chips */
  --radius-s: 6px;    /* cards, panels */
  --radius-pill: 999px; /* buttons */
  --shadow-1: 0 1px 0 var(--line);
  --shadow-2: 0 24px 60px -32px rgb(15 24 40 / .35);
  --header-h: 72px;  /* 64px < 768 */
}
```

Grid: 4 columns under 768 px, 8 columns from 768, 12 columns from 1024. Columns use `--gutter`; the page uses `--margin`. Content is capped at `--container` and centred. Prefer CSS grid with named areas per section.

### 3.4 The arch (dome) shape

The dome is the logo's inner doorway, a pointed ogee arch. One SVG file, `public/shapes/dome.svg` (viewBox `0 0 100 42`), defines the top cap:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 42" preserveAspectRatio="none">
  <path d="M0 42C0 22 22 12 38 7C45 5 49 2.5 50 0C51 2.5 55 5 62 7C78 12 100 22 100 42Z"/>
</svg>
```

The mask keeps the dome's proportions whatever the frame height. The cap is 42% of the width and the body fills the rest:

```css
.arch { container-type: inline-size; }
.arch > .arch__media {
  -webkit-mask: url(/shapes/dome.svg) top / 100% auto no-repeat,
                linear-gradient(#000 0 0) bottom / 100% calc(100% - 41cqi) no-repeat;
          mask: url(/shapes/dome.svg) top / 100% auto no-repeat,
                linear-gradient(#000 0 0) bottom / 100% calc(100% - 41cqi) no-repeat;
}
```

Variants:

- `.arch--outline` draws the same path as an inline SVG stroke (gold-500, 1 px, `vector-effect: non-scaling-stroke`), offset 10 px outside the media. It echoes the double ring.
- `.arch--soft` uses a shallower cap (`--cap: 28%`) for wide landscape frames.

The mask itself is **never animated**. We animate the media inside it (scale and translate) and a `clip-path: inset()` on a wrapper.

Small motifs:
- **Keyhole** (from the mark) as the list bullet and the "located here" pin.
- **Dove** for the form success state.
- The full mark as the section divider in the footer only.

---

## 4. Page structure

```
<header>  sticky nav
<main>
  #top       Hero                     film background + navy shade (rev 6; theme-dusk)
  #facts     Key facts strip          ivory (hairline top/bottom)
  #story     The tower / House of Peace   sand
  #explore   Tower explorer           navy (theme-dusk)
  #homes     Apartment types gallery  ivory
  #location  Location                 sand
  #payment   Why us + flexible payment  navy (theme-dusk)
  #enquire   Enquiry form             ivory
<footer>     navy-950
+ mobile sticky CTA bar (after hero, hidden when #enquire in view)
```

Section transitions: a section's top edge is straight. Only media gets the arch. The ivory-to-navy change before `#explore` is a scroll-scrubbed overlay (§7.4), not a hard cut.

---

## 5. Sections

Copy below is draft English. Keep every string in the i18n dictionary. Amharic drafts are the impl's job, flagged for client review. All numbers come from the brief.

### 5.0 Header / nav

- Left: horizontal logo (`logo.png`, or later an SVG lockup of the mark plus a live-text wordmark; height 40 px desktop, 32 px mobile).
- Centre (≥1024 px): The tower · Explore · Homes · Location · Payment.
- Right: language toggle `EN | አማ`, then a primary pill "Book a visit".
- Behaviour: transparent over the hero. After 80 px of scroll it becomes `--bg` at 0.86 with `backdrop-filter: blur(12px)` and a hairline bottom border. It hides on scroll down (yPercent −100, 0.35 s `power2.out`) and shows on scroll up. Its theme follows the section under it (`data-header-theme` swap via ScrollTrigger `onToggle`). The header has two stacked background layers (light and dusk) that cross-fade on **opacity** (0.3 s); logo and text colours swap instantly at the same moment. No colour transitions.
- Under 1024 px, a 44×44 menu button opens a full-screen navy overlay revealed with `clip-path: circle(0 at <button centre>) → circle(150%)` (0.7 s `power3.inOut`). Links stagger in (y 24 → 0, opacity, 0.06 s apart). The overlay also holds the language toggle, the CTA, and contact links where configured. Focus is trapped while it is open, and Esc closes it.

### 5.1 Hero (`#top`): rev 6, the film as the background

**Rev 6 replaces the rev 1–5 hero** (the still render in a 4:5 arch, and the rev 5 film card). This is the user's decision. The still render moves to the Story arch (§5.3).

**Content** (copy unchanged):
- Eyebrow: "Garment · Addis Ababa".
- H1: "A house of *peace* in the heart of Garment." (italic on *peace*).
- Lead: "126 two- and three-bedroom homes across 16 floors."
- CTAs: "Book a visit" (primary) and "Explore apartments" (secondary, scrolls to `#explore`).
- New: a **play control**, "Watch the film · 0:41".
- New: a **controls cluster** with pause/play for the background and sound on/off.
- Scroll cue on desktop only.

**Theme.** `#top` gets `.theme-dusk` (ivory text tokens, gold-400 accents, the dusk button variants) and `data-header-theme="dark"`. The header therefore starts in its dark variant: transparent, with the ivory and gold logo and ivory links. S20 swaps it to light when `#facts` reaches the header. The page background under the film is navy-950.

**Layers**, bottom to top, all `position:absolute; inset:0` inside `#top` (`position:relative; overflow:clip; isolation:isolate`):

| z | Layer | What |
|---|---|---|
| 0 | `.hero__bg` | The wrapper that the intro scale and S1 transform. It holds:<br>• the **poster** `<picture>`: `/video/hero-bg-poster.webp` with a `.jpg` fallback, `width="640" height="352"`, `fetchpriority="high"`, `alt=""`, eager. It is decorative, because the H1 says what this is.<br>• the **`<video class="hero__video" muted loop playsinline preload="none" disablepictureinpicture disableremoteplayback aria-hidden="true">`**. It has **no `poster` attribute**, because the `<img>` is the poster and a `poster` attribute would fetch it twice. It starts at opacity 0.<br>Both use `object-fit: cover` with the **same** `object-position`, so the cross-fade lines up pixel for pixel. |
| 1 | `.hero__shade` | Navy-950 gradients (values below). One element with several `background-image`s. Static: never animated, never removed. |
| 2 | `.hero__grain` | `background: url(/img/grain.png) 0 0 / 128px 128px repeat; opacity: .35; pointer-events: none`. Static, so there is no rAF loop and no CSS blur. The tile is `docs/design/hero-grain.png`: 128×128, 3 KB, 7% white and 7% black specks at 60% alpha; copy it to `public/img/grain.png`. With the shade, it hides the upscale softness: the eye reads film grain instead of blur. |
| 3 | `.hero__inner` | The content grid, the play control and the controls cluster. |

**Shade values**, with `--ink: 11 18 32` (navy-950), all as `rgb(var(--ink) / a)`:

- **≥ 1024 (landscape layout)**, four layers:
  - **text side**: `linear-gradient(90deg, rgb(var(--ink)/.80) 0%, rgb(var(--ink)/.70) 48%, rgb(var(--ink)/.30) 72%, rgb(var(--ink)/.15) 100%)`
  - **header band**: `linear-gradient(180deg, rgb(var(--ink)/.70) 0, rgb(var(--ink)/.45) 72px, rgb(var(--ink)/0) 200px)`
  - **foot band**: `linear-gradient(0deg, rgb(var(--ink)/.65) 0, rgb(var(--ink)/0) 28%)`
  - **vignette**: `radial-gradient(130% 100% at 70% 45%, rgb(var(--ink)/0) 50%, rgb(var(--ink)/.40) 100%)`
  - **Rule**: all hero text sits within the left **48%** of the hero width, where the text-side layer alone is at least 0.70.
- **< 1024 (portrait layout)**, two layers:
  - **top and floor**: `linear-gradient(180deg, rgb(var(--ink)/.78) 0, rgb(var(--ink)/.62) 64px, rgb(var(--ink)/.30) 25%, rgb(var(--ink)/.30) 100%)`
  - **content scrim**, anchored to the content rather than to the hero height, so it still covers the text on short screens: `.hero__content::before { content:""; position:absolute; left:-100vw; right:-100vw; top:-120px; bottom:-100vh; z-index:-1; background: linear-gradient(180deg, rgb(var(--ink)/0) 0, rgb(var(--ink)/.72) 120px, rgb(var(--ink)/.80) 100%); }`. The hero's `overflow: clip` trims the overhang.
- **Verified**: I composited these exact gradients over **every second of the 20.6 s loop** (21 frames, including the white facade, sky and cloud frames and the poster) at 1366×768, 1920×1080, 360×740, 360×640 and 768×1024. The script is `docs/design/hero-shade-contrast.py`, and the poster-frame preview is `docs/design/hero-shade-check.jpg`. Worst case, using the 99.5th-percentile brightest pixel in each text zone, for ivory `#FBF7F2` text:

| Viewport | Header / nav zone | Text zone |
|---|---|---|
| 1366×768 | 5.6:1 | 6.8:1 |
| 1920×1080 | 5.5:1 | 6.8:1 |
| 360×740 | 6.0:1 | 9.8:1 |
| 360×640 | 6.0:1 | 9.7:1 |
| 768×1024 | 6.0:1 | 9.7:1 |

  All of these clear 4.5:1 for body text and 3:1 for the H1, with margin left over for the grain specks. **If the loop is ever re-cut, re-run the script.** Muted text (`--text-muted`) is not allowed in the hero; use ivory, sand-200 or gold-400 only.

**Crop on phones (`object-position`).**
- **≥ 1024**: `50% 50%`. The 20:11 frame almost fills a 16:9 screen; at 1366×768 about 2% is cropped at the sides.
- **< 1024 (portrait)**: `50% 50%` as well. A 360×740 phone sees the centre **27%** of each frame, about 172 source px upscaled about 2.1×. A 768×1024 tablet sees the centre 41%. Most shots in the loop keep the tower centred (see the contact sheet), so the centre slice is the tower itself. Don't pan with JS: per-shot panning would need a shot list, and any drift is worse than a soft crop. The stronger portrait shade, mostly over the lower 60%, plus the grain, carries the softness.
- No scaling beyond `cover`.

**Layout per viewport.** `#top` has `min-height: 100svh`; at ≥ 1024 it is also capped at `max-height: 1200px`. Content never depends on the video, so there is no CLS: every layer is absolutely positioned and the poster has intrinsic dimensions.

```
360 × 740 (portrait layout; 768 is the same, wider)       1366 × 768 (landscape layout; 1920 the same, larger)
┌──────────────────────┐                                   ┌───────────────────────────────────────────────────────────────┐
│ ▢logo   EN|አማ    ☰  │ ← header, dark variant            │ ▢logo  The tower Explore Homes Location Payment  EN|አማ (Book a visit) │
│                      │                                   │                                                               │
│   film (centre 27%)  │                                   │ GARMENT · ADDIS ABABA                 film, lighter shade      │
│                      │                                   │ A house of peace                                               │
│ ( ▶  Watch the film · 0:41 )   ← play pill, centred      │ in the heart of                            ╭──────╮            │
│   in the free film zone                                  │ Garment.                                    │  ▶   │ ← 88 px    │
│ ░░░░░░ scrim starts 120 px above the eyebrow ░░░░░░      │ 126 two- and three-bedroom homes…           ╰──────╯   play     │
│ GARMENT · ADDIS ABABA│                                   │ (Book a visit) (Explore apartments ↓)  ( Watch the film · 0:41 )│
│ A house of peace in  │                                   │                                                               │
│ the heart of Garment.│                                   │ ── Scroll                                          (⏸) (♪)    │
│ 126 two- and three-  │                                   └───────────────────────────────────────────────────────────────┘
│ bedroom homes …      │                                    text: cols 1–6, ≤ 48% of width   play: centred in cols 8–12
│ (Book a visit)       │                                    controls: bottom-right, 32 px in from the container edge
│ (Explore apartments) │
│                (⏸)(♪)│ ← controls row, right-aligned
└──────────────────────┘
```

- **< 1024** (360, 390, 768): `#top` is a flex column: header spacer (`--header-h`), then the **film zone** (`flex: 1; min-height: 72px; display: grid; place-items: center`), then `.hero__content`.
  - The content is bottom-aligned with `padding-bottom: max(16px, env(safe-area-inset-bottom))`. Its order: eyebrow, H1, lead, CTAs (stacked full width under 480 px, side by side from 480 px), then the controls row (right-aligned, 44 px, `margin-top: 16px`).
  - The scroll cue is hidden.
  - At 768 the text block is capped at 560 px and left-aligned within the container. The film zone is about 420 px tall and shows the tower clearly.
  - Budget check at 360×640: header 64 + content about 448 leaves a film zone of about 128 px, which holds the 48 px play pill. The H1 is above the fold by construction.
- **≥ 1024** (1366, 1920): the 12-column grid.
  - The text is in cols 1–6 (max 48% of the hero width), vertically centred (`align-self: center`) with `padding-top: var(--header-h)`.
  - The play control sits in cols 8–12, centred both ways.
  - The scroll cue is bottom-left at 32 px.
  - The controls cluster is bottom-right: `right` aligned to the container's right edge, `bottom: 32px`.
  - At 1920 the H1 uses the existing `--fs-display` clamp maximum. Nothing else changes, apart from the 88 px play disc becoming 104 px.

**Play control** ("Watch the film · 0:41"). The markup is the rev 5 link, moved here:

```html
<a class="hero__play" href="/video/film.mp4" aria-haspopup="dialog" data-film-open>
  <span class="hero__play-disc" aria-hidden="true"></span>
  <span class="hero__play-label">Watch the film · <span class="tabular">0:41</span></span>
  <span class="visually-hidden">: the tower fly-through with music</span>
</a>
```

- **≥ 1024**:
  - A vertical stack: an 88 px disc (104 px at ≥ 1600) with a 12 px gap above a label pill.
  - The disc is gold-500 with a navy-950 triangle (28 px; optically centred, nudged right by 2 px), plus a 1.5 px ivory ring at 0.7, 8 px outside the disc.
  - Label pill: ivory Manrope 600, 14 px, on `rgb(var(--ink)/.72)`, 36 px tall, padding 0 16 px, `--radius-pill`. The pill gets its own background because the shade is light over there.
  - Hover (fine pointer): the disc scales to 1.08 and the ring to 1.15 (0.45 s, `power3.out`).
  - Idle "breath": the ring scales 1 → 1.25 and fades 0.7 → 0 over 2.4 s, repeating. This is the S14 pulse. It is paused offscreen, while the dialog is open and when the background is paused, and it is off with reduced motion.
- **< 1024**: one 48 px pill, with a 36 px gold disc and triangle, then the label, on `rgb(var(--ink)/.72)`, centred in the film zone. No breath.
- The cursor label is "Play" (§6). Focus: the `--focus` ring around the disc on desktop, or around the pill on phones.
- With no JS it opens `film.mp4` natively. With JS it opens the §5.11 dialog **unshaded, with sound**.

**Controls cluster** (`<div class="hero__controls" role="group" aria-label="Background film">`):
- Two 44 px circles, 8 px apart, each `rgb(var(--ink)/.55)` with a 1 px ivory hairline at 0.35 and a 16 px ivory glyph. Order from the left: **pause/play**, then **sound**.
- **Pause/play** (WCAG 2.2.2):
  - `<button type="button">` whose label swaps between "Pause background film" and "Play background film", with the glyph swapping between two bars and a triangle.
  - It has **no `aria-pressed`**: a swapped label plus `aria-pressed` would announce the state twice. This also corrects rev 5.
  - It is hidden when the background isn't allowed to play (poster-only cases), because then nothing moves.
- **Sound**: the rev 5 sound toggle (§5.11), unchanged in behaviour and markup (constant name "Film music", `aria-pressed`, the equaliser glyph and its states). It is placed here instead of on the card. It is visible whenever JS runs, including in poster-only mode.
- **Clear of the mobile sticky CTA.** The bar (§5.10) only appears once the hero has left the viewport, and the controls are the last thing in the hero to scroll out, so the two are never on screen together. No offset is needed. Still, `.hero__controls` gets `margin-bottom: env(safe-area-inset-bottom)` for iOS.

**Background playback rules** (these replace the rev 5 card rules):
- **Loading.** On `DOMContentLoaded`, if all of the following hold, append the `<source>`s (`hero-bg.webm` with `type='video/webm; codecs="av01.0.01M.08"'` first, then `hero-bg.mp4` with `type="video/mp4"`) and call `load()`:
  - `prefers-reduced-motion: no-preference`
  - `!navigator.connection?.saveData`
  - `effectiveType` is `4g` or unknown
  - the hero is intersecting
  
  No idle wait, because the background is the hero itself. The poster still paints first, and the preload hint goes only to the poster.
- **Fade-in.** `play()` is called on `canplaythrough`. On the first `playing` event, add `.is-playing`, which runs `opacity 0 → 1` over 1.2 s with `cubic-bezier(.455,.03,.515,.955)` on the video. **Not before the curtain is up**: wait for the curtain's `animationend`, or skip the wait if there is no intro. The poster is the loop's first frame, so the cross-fade is invisible apart from the start of motion.
- **Pause** when the hero is fully out of view (IntersectionObserver, threshold 0), when `document.hidden`, or when the film dialog is open. Resume when the condition ends, unless the user pressed pause.
- **Auto-stop after 3 loops (about 62 s).** Fade the video to opacity 0 over 0.6 s back onto the poster, then `pause()`. The toggle shows "Play background film". Pressing it resumes and resets the count. This keeps phones cool and battery use low on a page people leave open.
- **Poster only** (reduced motion, Save-Data, slow connection, no JS): no `<source>` is added and zero video bytes are fetched. The pause toggle is hidden. The play control and the sound toggle work (the sound toggle needs JS).
- QA note: headless Chrome reports `effectiveType: '3g'`, so a poster-only hero is correct in headless screenshots. To test the video, override `navigator.connection` in the test harness.

**LCP and CLS.**
- The LCP element is the **poster `<img>`** (17 KB WebP), or the H1 if Chrome decides otherwise. Both paint early.
- Preload it in `<head>`: `<link rel="preload" as="image" href="/video/hero-bg-poster.webp" type="image/webp" fetchpriority="high">`. The old hero `<Picture>` preload is removed.
- Chrome ignores "low-entropy" images under 0.05 bits per displayed pixel as LCP candidates. At 1920×1080 the 17 KB poster is about 0.066 bpp, which still counts. **Keep the poster ≥ 14 KB**: don't over-compress it, or the LCP silently moves to the H1. That isn't harmful, but it is less predictable.
- The `<video>` is the same size as the poster, so its first frame never creates a later, larger LCP entry.
- CLS is 0: all layers are absolute, the hero has a fixed `min-height`, and the fonts are already handled (§10).

**Removed in rev 6**: the 4:5 hero arch, `.arch--outline` around it, the mark watermark behind the text (it would be lost over the film), the hero `<Picture>` and its preload, and the rev 5 film card with its loop files (`film-loop.*` and `film-poster.*` can be deleted from `public/video/`). `src/assets/generated/hero-tower.jpg` stays for the OG image. The Story arch gets a new, zoomed-out crop of the same render (§5.3). The Enquire arch moves to the balconies detail (`story-balconies.jpg`), so the page doesn't show the same tower view twice.

### 5.2 Key facts (`#facts`)

Four facts in a row (desktop) or a 2×2 grid (mobile), separated by gold hairlines: **16** floors (rev 5; the label is "Floors", not "Residential floors", and the S2 count-up runs 0 → 16) · **126** apartments · **2 & 3** bedroom homes · **158–171** m² gross. Numerals use `--fs-number` (Cormorant); labels are eyebrow style in `--text-muted`. Under the row, a muted note: "Basement parking and offices · Commercial ground floor" (a fact from the brief).

```
Mobile                       Desktop
┌───────────┬───────────┐    ┌────────────┬────────────┬────────────┬──────────────┐
│ 16        │ 126       │    │ 16         │ 126        │ 2 & 3      │ 158–171 m²   │
│ FLOORS    │ APARTMENTS│    │ FLOORS     │ APARTMENTS │ BEDROOM    │ GROSS AREA   │
├───────────┼───────────┤    │            │            │ HOMES      │              │
│ 2 & 3     │ 158–171m² │    └────────────┴────────────┴────────────┴──────────────┘
└───────────┴───────────┘
```

### 5.3 The tower / House of Peace (`#story`, sand)

- Large statement (H2, max 18ch per line): "*Dar Al Salam* means House of Peace. We designed it to feel that way." That claim is brand voice, not a fact, so keep it modest.
- Two short paragraphs drawn only from the facts: Garment location, two-block layout, nine homes per floor, balconies, a lift lobby with 2+ lifts and stairs per block (BRIEF wording), basement parking.
- Media (rev 6): **the whole tower**, a zoomed-out crop of the render in the tall 4:5 arch, so the full building reads (the user's request). Generate `src/assets/generated/story-tower.jpg` from `src/assets/tower-render.jpg` (2251×2163) with the crop `left 95, top 0, width 1730, height 2163`. That is the full height of the render, centred on the tower, which spans x ≈ 240–1680. Output widths 480/640/900/1200. `object-position: 50% 50%`. I checked it through the real dome mask, both at rest and at the S7/S8 overscan, in `docs/design/story-arch-check.jpg`: the roof clears the dome's peak and both shoulders, and the street and entrance stay in. There is no taller source, so this is the furthest zoom-out possible without inventing sky. Alt text: "Render of Garment Tower, the whole building from the street corner". The old balconies detail (`left 560, top 900, width 900, height 1125`) moves to the Enquire arch. Also a small framed **key-plan duotone** thumbnail captioned "Typical floor: nine homes, two blocks".
- Desktop: the statement spans cols 1–7. The arch spans cols 8–12 and is offset 120 px down (staggered editorial layout). Mobile stacks statement, then arch, then paragraphs.
- Rev 5: after the paragraphs, one text link, "Watch the film · 0:41", with a 20 px gold play disc before it. It opens the same film dialog as the hero play control (§5.1, §5.11) and gets the focus back when the dialog closes. It is a second way in for people who scrolled past the hero, **not a second player**: no video and no loop here. Explore gets no film entry, because the fly-through doesn't help anyone pick a floor or a unit.

### 5.4 Tower explorer (`#explore`, navy): see §9 for the full spec

```
Desktop 1440 (section ≈ 100svh, not pinned after intro)
┌──────────────────────────────────────────────────────────────────────────────┐
│ 02 — EXPLORE                                                                  │
│ Find your floor. Find your home.        Tower › Floor 7 › BL05  (breadcrumb)  │
│ ┌──────────────────────────────┐  ┌──────────────────────────────────────────┐│
│ │                              │  │ [state A: floor list]  14 ▸  13 ▸ ... 1 ▸ ││
│ │   3D maquette (canvas)       │  │ [state B: key plan + 9 hotspots + legend]││
│ │   cols 1–5                   │  │ [state C: unit plan + specs + CTA]       ││
│ │   floor slabs hover/select   │  │ cols 6–12, ivory "paper" panel on navy   ││
│ │   ‹ drag to turn ›           │  │                                          ││
│ └──────────────────────────────┘  └──────────────────────────────────────────┘│
│ ▸ Floors 1–14 residential · 16th floor planned · Ground floor commercial · Basement parking │
└──────────────────────────────────────────────────────────────────────────────┘

Mobile 360
┌──────────────────────┐
│ 02 — EXPLORE         │
│ Find your floor.     │
│ ┌──────────────────┐ │
│ │ maquette ~52svh  │ │  tap a slab, or use the stepper
│ └──────────────────┘ │
│ ( − )  Floor 7  ( + )│  44px buttons; select also opens a list
│ [View floor 7 →]     │
│ ── panel (stacked) ──│  key plan full-width, hotspots tappable,
│ unit chips BL01..09  │  chips as a horizontal list under the plan
│ unit card            │
└──────────────────────┘
```

### 5.5 Apartment types (`#homes`, ivory)

- H2 "Nine layouts. *One* calm way of living." Filter chips (`role="radiogroup"`): **All (9)** · **2 bedroom (1)** · **3 bedroom (8)**. Sort toggle: "By size". Chips are 44 px tall, with a gold underline on the active chip.
- Card: an arch-topped frame (`.arch--soft`, sand background) with the plan thumbnail (`object-fit: contain`, 24 px padding), then `BL05` (eyebrow), "3 bedroom" (h3), "169.23 m² gross · 119.05 m² net" (tabular), and a rooms line (small, muted). Two actions: **View plan** (opens the viewer) and **Find on a floor** (scrolls to the explorer with BL05 highlighted on the current floor, default floor 1).
- **BL01 floors (rev 5).** The filter counts stay as they are; they count layouts, not homes. Two additions:
  - When **2 bedroom** is the active filter, a muted note sits under the chip row: "2-bedroom homes are on floors 4, 6, 8, 10 and 11." It is small, in `--text-muted`, inside an `aria-live="polite"` wrapper. It is hidden for All and 3 bedroom.
  - The BL01 card always carries "On floors 4, 6, 8, 10 and 11" under the rooms line, small and in gold-700. The plan viewer's side panel for BL01 repeats it under the type.
  - BL01's **Find on a floor** opens floor 4, the first 2-bedroom floor. The other units keep floor 1.
- Layout: 3 columns at ≥1024, 2 at ≥640, and a horizontal scroll-snap carousel under 640 (card width 82%, a peek of the next card, a progress hairline below, and no scroll-jacking).
- Filtering uses **GSAP Flip**: hidden cards fade and scale to 0.96 over 0.25 s, then the rest reflow over 0.6 s with `power3.inOut`. With reduced motion, it's an instant swap.

```
Desktop
┌────────────────────────────────────────────────────────────┐
│ 03 — HOMES   Nine layouts. One calm way of living.          │
│ (All 9) (2 bedroom 1) (3 bedroom 8)              By size ⇅  │
│ ╭────────╮   ╭────────╮   ╭────────╮                         │
│ │ plan   │   │ plan   │   │ plan   │                         │
│ BL01         BL02         BL03                               │
│ 2 bedroom    3 bedroom    3 bedroom                          │
│ 158.54 m²…   166.97 m²…   166.97 m²…                         │
│ View plan · Find on a floor                                  │
│ … 3×3 …                                                       │
└────────────────────────────────────────────────────────────┘
```

**Plan viewer** (native `<dialog>`, full screen under 1024, otherwise 92vw × 88vh):
- Left: the plan on a sand background with pan and zoom. Pointer drag pans. Pinch zooms on touch. Wheel or trackpad zooms inside the dialog only. Double-click or double-tap toggles 1× and 2.5×. The +/−/reset buttons are 44 px. Zoom range 1–4×. Transforms only (`translate3d` plus `scale`), driven by our own ~2 KB module. No library.
- Right (bottom sheet on mobile): code, type, gross m², net m², room list, "Balcony · separate shower room per bath · ceramic tile finishes" (all shown on the plans), and the CTA "Request pricing for BL05", which closes the dialog, scrolls to `#enquire`, and prefills the unit.
- Prev/next arrows step through the current filter set. Keys: ←/→ step, +/− zoom, 0 resets, Esc closes. Focus returns to the card that opened the dialog.
- The high-resolution image (the original 1604–2000 px, as WebP at quality 82) loads only when the dialog opens. A blurred thumbnail shows until then.

### 5.6 Location (`#location`, sand): rev 7, a real satellite map with a pin

> **Rev 8.5 (user request R1, BRIEF 761faf2) overrides parts of this section.** The Location section **always shows the satellite map**.
> - **Removed:** the SVG diagram, its caption "Diagram, not to scale.", the "Show the satellite map" pill, and the Save-Data / slow-connection opt-in. The map loads for everyone when the section is near the viewport. On Save-Data or a slow connection it opens straight at z17 with no fly (rev 7.1), to keep the download down.
> - **Fallback (no JS, or tile failure):** a small navy card fills the map frame, in the same box, so nothing shifts.
>   - Navy-900 background, with the gold keyhole-pin glyph (40 px) centred.
>   - The place name "Dar Al Salam · Garment Tower" in ivory, Manrope 600 at 17 px.
>   - The two links: **Get directions** (gold primary on dark) and **Open in Google Maps** (secondary on dark). Both are plain links, so they work with no JS.
>   - The card is server-rendered inside the frame. The live map covers it once tiles load, and it stays if they don't (same failure test: no `load` within 10 s, or `tileerror` on more than half of the first tiles).
> - The caption under the frame is now always "Satellite image. It may show the site before construction." It is hidden while only the fallback card shows.
> - Everything else below stands: tiles and licence, map options, pin, card, controls, entrance, the two CTAs in the text column, and the landmark list. In the "What shows when" table, read every "SVG diagram" cell as the fallback card, and ignore the pill row.

Rev 7 replaces the rev 5 rules "Stylised diagram map (not a real map)", "No coordinates" and "Get directions: not yet". The client's pin resolves to the Google place "Dar al Salam Real Estate" at **8.9356809, 38.7299505** (BRIEF, Update 2026-11-14). These are the only coordinates on the page. **Landmarks are not plotted on the satellite map**: we have no coordinates for them, and placing them by eye would be inventing facts. They stay in the text list.

- H2 "Easy to *live*." and the lead are unchanged.
- **Decision: the satellite map replaces the diagram as the visual.** The SVG diagram stays in the markup as the **static fallback**, and nothing else. The two never show side by side, because a schematic "not to scale" drawing next to a true-scale image makes both look wrong.

**What shows when**

| Case | Visual in the frame | Caption under the frame |
|---|---|---|
| No JS | The SVG diagram (server-rendered, as today) | "Diagram, not to scale." |
| JS, before the map is ready or before it is near the viewport | The SVG diagram | "Diagram, not to scale." |
| Save-Data, or `effectiveType` is `slow-2g`, `2g` or `3g` | The SVG diagram, plus a centred secondary pill **"Show the satellite map"** over its lower third. Pressing it loads the map and moves focus to the map. Because the visitor asked to save data, the opted-in map **opens straight at z17** (`setView`, no fly, so no z15 tiles; about 471 KB at 1366 px instead of 936 KB). The fade, pin drop and card still play (§5.6 Entrance). | "Diagram, not to scale." |
| Map loaded | The Leaflet satellite map, cross-faded in over the diagram. The diagram then gets `hidden`. | "Satellite image. It may show the site before construction." |
| Tile failure: no first `load` event within 10 s, or `tileerror` on more than half of the first view's tiles | The SVG diagram. The map container is removed and no error is shown. | "Diagram, not to scale." |

- **The caption:** "Diagram, not to scale." belongs to the diagram only. It shows whenever the diagram shows and is swapped out when the map takes over. The caption is one `<figcaption>`; JS swaps its text from `data-caption-map`. The map caption is needed because Esri's imagery of Addis predates the tower: checked at z17, the pin falls on a cleared plot with foundations, west of the Haile Garment roundabout and the ring road. Without the caption, visitors would read the empty plot as a mistake.
- The pill test reuses the rev 6 hero helper, but with `3g` counted as slow (about 0.6 MB of tiles is too much to fetch unasked). The `?map-debug` query flag skips the connection check, so headless QA (which reports `3g`) sees the live map.

**Tiles and licence**

| | Value |
|---|---|
| Library | Leaflet **1.9.4** (npm), imported dynamically with its CSS. No plugins, and no esri-leaflet. |
| Imagery with a key | `https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?token={key}` |
| Imagery without a key | `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}` |
| Key | `site.map.esriKey`, `''` with `TODO(client)`. When it is set, impl uses the keyed URL. |
| Labels overlay | **None.** Esri's Boundaries and Places and Transportation reference tiles are blank around the site at z17 (checked: every tile came back as an empty 872-byte PNG). The landmark list does that job. |
| Attribution | Leaflet's attribution control, bottom-right, **always visible**. Exact HTML: `Powered by <a href="https://www.esri.com">Esri</a> \| Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community`, with prefix `<a href="https://leafletjs.com">Leaflet</a>`. 11 px Manrope, navy-900 on ivory at 0.88, padding 2 px 6 px. It may wrap to two lines on phones. Nothing may cover it: not the pin card, the controls, or the "two fingers" hint. Never hidden, collapsed or faded. |

The keyless endpoint is for non-commercial use only (review, and Esri's own guidance). Treat it as **development and preview only**: the public launch needs the client's ArcGIS Location Platform API key (§12). The key ships in client JS, as every browser map key does, so the client should restrict it to the production domain (an allowed referrer) in the Esri dashboard. The site has no server and no proxy.

**Map options (Leaflet)**

- `center` [8.9356809, 38.7299505]. Zoom range: `minZoom` 14, `maxZoom` 19 (Esri has imagery here to z19).
- Bounds: `maxBounds` is the centre ± 0.02° (about 2.2 km), with `maxBoundsViscosity: 1`.
- Controls: `zoomControl: false` (custom controls below), `attributionControl: true`.
- **No page-scroll trap:**
  - `scrollWheelZoom: false`.
  - On `(pointer: coarse)`: `dragging: false` and `touchZoom: true`. Leaflet's `.leaflet-touch-zoom` class then sets `touch-action: pan-x pan-y`, so one finger scrolls the page and two fingers pinch to zoom and pan.
  - On a fine pointer: `dragging: true`. Mouse dragging doesn't trap scroll.
- Other handlers: `doubleClickZoom: true`, `boxZoom: false`, `keyboard: true` (arrows pan, + and − zoom once the map has focus).
- Tile layer: `detectRetina: false`, `keepBuffer: 1`, `updateWhenIdle: true`, `updateWhenZooming: false`, `maxNativeZoom: 19`. These keep bytes down: the fly-in reuses the z15 tiles scaled up and fetches only z17 at the end. `errorTileUrl` is a 1×1 transparent GIF data URI over the sand container background, so a gap looks calm, not broken.
- **Two-finger hint (touch):** a one-finger `touchstart` inside the map shows a centred pill, "Use two fingers to move the map". The pill is navy-900 at 0.85 with ivory 14 px text, `pointer-events: none`, and `aria-hidden`, because it only explains a gesture. It fades in over 0.2 s, holds 1.4 s and fades out, at most once every 4 s. It is centred at **70% height** (rev 7.1: at 40% it covered the pin and card for 1.6 s on phones). It must stay at least 12 px above the attribution's top edge; if the attribution wraps, move the hint up to keep that gap.

**Pin, label card and controls**

- **Pin:** an `L.divIcon` with `iconSize [40, 52]` and `iconAnchor [20, 52]` (the tip):
  - A gold-500 teardrop with a 2 px ivory stroke and shadow `0 6px 14px rgb(11 18 32 / .35)`.
  - A navy-900 keyhole inside, the same path as the diagram pin, scaled 1.4. It is the brand's "located here" motif (§3.4).
  - At the tip, a flattened gold ground ring (28 × 10 ellipse) pulses scale 1 → 2.2 and opacity 0.5 → 0 over 2.4 s, repeating. It is paused off-screen and when `document.hidden`, like S14.
  - The marker has `keyboard: false` and `interactive: false`. It is decorative; the region label carries the meaning.
- **Label card:** ivory, navy-900 Manrope 600 at 13/1.2, padding 6 × 10, `--radius-xs`, shadow as the pin. It is centred 10 px above the pin, `white-space: nowrap`. Text: **"Dar Al Salam · Garment Tower"**, with the "·" in gold-600. The card is `aria-hidden`; the same words are in the region's `aria-label`.
- **Controls:** a custom vertical stack, `left: 12px; top: 50%; translateY(-50%)`. It sits clear of the `.arch--soft` cap (28%) and of the attribution. Three 44 × 44 ivory buttons, navy-900 glyphs, 1 px `--input-border`, `--radius-xs`, and the standard focus ring:
  - "Zoom in" (+)
  - "Zoom out" (−)
  - "Centre on the tower" (keyhole glyph): `flyTo` back to the pin at z17 over 0.8 s, or `setView` with reduced motion.

  Each is a `<button>` with a localised `aria-label`. Leaflet's own zoom control isn't used because its titles are English-only.
- **The map region:** the Leaflet container gets `role="region"` and `aria-label` "Satellite map showing where Garment Tower is". It has `tabindex="0"`, which Leaflet sets, and the 2 px `--focus` ring at an inset of 2 px, because the arch would clip an outset ring. The Location landmarks `<ul>` stays the accessible text alternative.

**Entrance (S13, rev 7).** Loading starts when an IntersectionObserver on `#location` fires with a `rootMargin` of 800 px: a preconnect is added to the tile host, then `import('leaflet')` and its CSS, then the map is created at **z15**, at opacity 0, above the diagram. The entrance runs once **both** the first tile `load` has happened **and** the map is at `top 75%` (whichever comes last):

1. The map fades opacity 0 → 1 over 0.6 s (power2.out), over the diagram. The diagram is then `hidden` and the caption swaps.
2. `flyTo(center, 17, { duration: 2.0 })`. The view pushes in on the plot.
3. On `moveend`, the pin drops y −28 → 0 and opacity 0 → 1 over 0.55 s (power3.out). The label card follows 0.15 s later (y 6 → 0, opacity 0 → 1, 0.4 s). Then the ground ring starts pulsing.

**Opted-in map (rev 7.1):** when the map was loaded from the "Show the satellite map" pill (Save-Data or a slow connection), skip step 2: create the map at z17 and keep steps 1 and 3. Reduced motion skips step 2 too (§8).

Nothing animates on scroll after that, and nothing re-runs.

**Calls to action (in the text column).**
1. **"Get directions"**: primary pill (navy on sand). Links to `directionsHref()` = `https://www.google.com/maps/dir/?api=1&destination=8.9356809,38.7299505`. A 16 px route glyph comes before the label.
2. **"Open in Google Maps"**: secondary pill. Links to `site.location.mapsUrl` (the client's link `https://maps.app.goo.gl/4Ed5VBCaYGvbbY6X9`), with the 16 px keyhole-pin glyph. This replaces the rev 5 label "Open exact location in Google Maps": the map on the page already shows the exact spot. If `mapsUrl` is ever empty, `mapsHref()`'s search fallback keeps the same label.

Both open in a new tab with `rel="noopener"`, an external-link arrow, and a visually hidden "(opens in a new tab)". On phones, both are full width and stacked, Directions first. On desktop they sit side by side. Both work with no JS, because they are plain links.

**Layout and landmarks.** Unchanged:
- Desktop: the map sits in cols 1–8 inside the `.arch--soft` frame, at `aspect-ratio: 4 / 5`, with the text, CTAs and landmark list in cols 9–12.
- Mobile: text and CTAs, then the map (4:5), then the list.

The live map fills the same box as the diagram (`position: absolute; inset: 0`), so the swap causes **no layout shift**. The "Nearby" landmark list and its keyhole bullets stay exactly as they are.

**`src/data/site.ts` (rev 7):**
- `location.lat: 8.9356809` and `location.lng: 38.7299505`, commented "from the client's pin, BRIEF update 2026-11-14".
- `location.placeName: 'Dar al Salam Real Estate'`, for reference only and never rendered (the card uses the i18n string).
- `map.esriKey: ''` with `TODO(client)`.
- `directionsHref()` returns `''` when either coordinate is missing; the button then hides.
- `mapsHref()` is unchanged.

### 5.7 Why Dar Al Salam + flexible payment (`#payment`, navy)

Part A, **three pillars** (rev 5: the "Basement parking" pillar is gone, because parking is now a building feature, and the offices and commercial ground floor are already in the facts note), only what the plans and brief support:
1. **Generous homes**: 158–171 m² gross, 2 & 3 bedrooms, separate shower room per bath.
2. **Homes with balconies**: the plans show balconies.
3. **Lift lobbies**: lift lobby with 2+ lifts and stairs per block (the BRIEF's wording; no other counts).

Each pillar has a 32 px line icon (gold-500, 1.25 px stroke), an h3, and one line of text. Pillars sit in 3 columns at ≥768 and 1 column below that.

**Building features band (rev 5)**, directly under the pillars and before the payment H2. It uses the same navy surface and is denser than the pillars, so it reads as a spec list rather than four more pillars.

- Heading: h3 in eyebrow style, "Building features", with the gold rule from S4.
- Items, using **exactly these wordings and nothing else** (no sub-lines, no numbers, no borehole/tank/generator detail):
  1. Garbage chute on every floor
  2. Standby lift
  3. Underground water
  4. Parking
- Markup: a `<ul>` of 4 `<li>`, each holding an icon (`aria-hidden`) and a label.
- Each cell: a 28 px line icon in gold-500 (1.25 px stroke, round caps and joins, `vector-effect: non-scaling-stroke`), then the label in Manrope 500, 16 px, ivory, vertically centred. Cell padding 20 px 24 px.
- Layout:
  - ≥1024: one row of 4 cells between a top and a bottom hairline (gold-500 at 0.35), with vertical hairlines between cells.
  - 640–1023: 2×2, hairlines between.
  - <640: a single-column list, rows at least 56 px, with hairlines between.
- Motion: part of S15. After the pillars, the cells fade in with y 16 → 0 (stagger 0.08), and each icon draws left → right with `clip-path`. With reduced motion, a fade only.
- Icons (viewBox `0 0 24 24`, `fill="none"`, `stroke="currentColor"`). These are our own simple drawings, not a library set:

| Item | SVG |
|---|---|
| Garbage chute on every floor | `<path d="M9 3v18M15 3v18M3 7h6M15 7h6M3 13h6M15 13h6M3 19h6M15 19h6M12 9v6M10.5 13.5 12 15l1.5-1.5"/>` (a shaft through three floors, with a down arrow) |
| Standby lift | `<rect x="3" y="4" width="8" height="16" rx="1"/><path d="M5.5 10.5 7 9l1.5 1.5M5.5 13.5 7 15l1.5-1.5"/><rect x="13" y="4" width="8" height="16" rx="1" stroke-dasharray="2 2"/>` (a lift car with up/down arrows, and a dashed second car "on standby") |
| Underground water | `<path d="M8 9V4h8v5M2 9h20M12 12.5c2.4 3 3.6 4.9 3.6 6.3a3.6 3.6 0 0 1-7.2 0c0-1.4 1.2-3.3 3.6-6.3z"/>` (a building on the ground line, with a drop below it) |
| Parking | `<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9.5 17V7H13a3 3 0 0 1 0 6H9.5"/>` |

```
Desktop (#payment, navy)
 ✦ Generous homes       ✦ Homes with balconies   ✦ Lift lobbies
   158–171 m² gross…      The plans show…          A lift lobby with…
 BUILDING FEATURES ──
 ──────────────────┬──────────────────┬──────────────────┬──────────────
 ⫼ Garbage chute on │ ▣┆ Standby lift   │ ⌂ Underground    │ Ⓟ Parking
   every floor      │                  │   water          │
 ──────────────────┴──────────────────┴──────────────────┴──────────────
 Flexible payment, at your pace.  (Part B)
```

Part B, H2 "Flexible payment, at your *pace*." Three steps on a horizontal hairline timeline (vertical on mobile):

1. **Reserve**: secure your home with an initial payment.
2. **Pay any amount over time**: until your home is fully paid.
3. **Fully paid**: the home is yours.

CTA "Request pricing" (gold primary). Small print: "Prices on request." **No numbers and no percentages.**

### 5.8 Enquiry (`#enquire`, ivory)

```
Desktop (rev 7)                                       Mobile (rev 7)
┌──────────────────────────┬──────────────────────┐   ┌────────────────────┐
│ 05 — ENQUIRE             │ Name                 │   │ Book a visit or    │
│ Book a visit or request  │ [______________]     │   │ request plans…     │
│ floor plans & pricing.   │ Phone                │   │┌ Contact us on ───┐│
│                          │ [+251 __________]    │   ││  Telegram        ││
│ ╭─────╮ balconies arch   │ Preferred home       │   ││ ✈ @abdulaziz_a12↗││
│ │     │                  │ [Any ▾] [Floor: Any▾]│   ││ ✈ @monur14     ↗ ││
│ ╰─────╯                  │ Message [_________]  │   │└──────────────────┘│
│┌ Contact us on Telegram ┐│                      │   │ ── or send us your │
││ Tap a username to chat.││ [ Send on Telegram ] │   │    details ──      │
││ ✈ @abdulaziz_a12     ↗ ││ Opens Telegram to    │   │ Name  [_________]  │
││ ✈ @monur14           ↗ ││ @abdulaziz_a12       │   │ Phone [_________]  │
│└────────────────────────┘│                      │   │ Home / Floor / Msg │
│ Contact lines (if set)   │                      │   │ [Send on Telegram] │
└──────────────────────────┴──────────────────────┘   └────────────────────┘
```

- Fields: name (required, `autocomplete="name"`); phone (required, `type="tel"`, `inputmode="tel"`, `autocomplete="tel"`, placeholder `+251 9…`, lenient validation of ≥ 9 digits); preferred home (`select`: Any, BL01 – 2 bedroom, BL02 – 3 bedroom, …); floor (`select`: Any, 1–14); reply via (radio, showing **only channels configured** in `site.ts`); message (optional textarea, 4 rows).
- Labels sit above inputs and are always visible. Inputs are 52 px tall with 16 px text, a 1 px `--input-border` border, and `--radius-xs`. Focus shows a 2 px `--focus` outline at 2 px offset. Errors appear inline under the field in `--danger-600` with an icon, `aria-describedby`, and one summary sentence in an `aria-live="polite"` region.
- Submit builds the text `"Hello Dar Al Salam, I'm {name} ({phone}). I'm interested in {unit} on {floor}. {message}"` and hands it to the chosen channel: WhatsApp (`https://wa.me/{number}?text=`), Telegram (rev 7, below) or `mailto:`. **If no channel is configured** (all `TODO(client)`), hide the radio and show "Our contact lines are being set up. Please check back soon.", with the submit button disabled. Never post the form anywhere.
- **Reply via (rev 7).** With **two or more** channels configured, the radio shows them as before. With **exactly one**, there's no radio: the submit label names the channel, and a muted helper line sits under the button. Today Telegram is the only channel, so it reads **"Send on Telegram"** with "Opens Telegram to @abdulaziz_a12" under it. That handle is `dir="ltr"`, `translate="no"`.

> **Rev 8.5 (user requests R2 and R3, BRIEF 761faf2) overrides parts of the Telegram text below.**
> - **R3: the "Contact us on Telegram" card is removed** from this section, with its mobile divider "or send us your details". The form's hand-off replaces it. The header and footer Telegram rows stay. The helper line under the submit button stays ("Opens Telegram to @abdulaziz_a12").
> - **Desktop left column without the card:** eyebrow, H2, then the balconies arch, then "Contact lines" only if any non-Telegram line is set. The arch grows to fill the space: `width: min(100%, 320px)` (was 240 px), aspect 4:5. The column is `align-self: start` and sticky at `top: calc(var(--header-h) + 32px)` from 1024 px up, so it stays beside the form and the column never looks empty. Mobile: the arch stays hidden below 768 px, as now; H2, then the form.
> - **R2: the Telegram message is multi-line**, and lines for empty fields are skipped:
>
>   ```
>   Hello Dar Al Salam 👋
>   My name is {name}, and I'd like to know more about Garment Tower.
>
>   📞 Phone: {phone}
>   🏠 Home: {unit}
>   🏢 Floor: {floor}
>   💬 Message: {message}
>
>   Sent from the Dar Al Salam website
>   ```
>
>   - Name and phone are required, so those lines always show. Skip the Home line when the home is "Any", the Floor line when the floor is "Any", and the Message line when it is empty.
>   - `{unit}` keeps the rev 5 rule: "BL01 (to be confirmed)" on a TBC floor.
>   - Build it with real `\n` line breaks and pass it through `encodeURIComponent` (line breaks become `%0A`). The same text goes to the clipboard and to the fallback textarea, which keeps the line breaks.
>   - WhatsApp, when configured, uses the same multi-line text. `mailto:` keeps the text without emoji in the subject; the body is the same.
>   - Amharic (design-checked; the spelling "መልዕክት" and the terms "ወለል" and "ስልክ" match the rest of /am):
>
>   ```
>   ሰላም ዳር አል ሰላም 👋
>   ስሜ {name} ነው፤ ስለ ጋርመንት ታወር የበለጠ ማወቅ እፈልጋለሁ።
>
>   📞 ስልክ፦ {phone}
>   🏠 ቤት፦ {unit}
>   🏢 ወለል፦ {floor}
>   💬 መልዕክት፦ {message}
>
>   ከዳር አል ሰላም ድረ-ገጽ የተላከ
>   ```
>
> The hand-off mechanics below (open synchronously, copy too, the "Finish in Telegram" panel) are unchanged.

**Contact us on Telegram (rev 7; removed in rev 8.5, kept for history).** The client's first confirmed contacts are `site.contact.telegram = ['abdulaziz_a12', 'monur14']`, in display order. **Show the usernames only**: no names, roles or "sales team" wording, because none are given (BRIEF).

- **Placement:**
  - Desktop: the left column, under the balconies arch, in place of the Telegram rows of "Contact lines". Telegram is removed from that list here, so nothing is listed twice. The footer and header menu keep their Telegram rows.
  - Mobile: DOM order puts it right after the H2 and before the form. A divider follows it, a hairline with the centred muted text "or send us your details", and then the form. People who just want to chat get there in one tap.
- **Card:**
  - Ivory on the ivory section, with a 1 px `--input-border` border, `--radius-sm` and 20 px padding. The width is the column (desktop) or the container (mobile).
  - An H3, "Contact us on Telegram", in Manrope 600 at `--fs-h4`, with the muted line "Tap a username to open a chat." under it.
  - Then a `<ul role="list">` of rows, split by hairlines.
- **Row:** an `<a href="https://t.me/{user}" target="_blank" rel="noopener">`, min-height 52 px and full width. Inside, a flex row:
  - a 36 px navy-900 circle with an ivory 18 px paper-plane glyph (`aria-hidden`; our glyph, not the Telegram logo, so it stays in palette)
  - the handle `@abdulaziz_a12` in Manrope 600 at 17 px, navy-900, in a `<span dir="ltr" lang="en" translate="no">`
  - the spacer and a 16 px external arrow ↗

  The accessible name is "@abdulaziz_a12, Telegram (opens in a new tab)", using visually hidden text. On hover, the row background is gold-500 at 0.12 and the arrow moves 2 px up and right over 0.2 s. Focus uses the standard ring. With no JS it is a plain link.
- **Render rule:** the card renders only when `telegramAccounts()` is non-empty. It is a list, so a third account, or one removed, needs no design change.

**Telegram hand-off from the form (rev 7).** Telegram does support a prefilled draft to a username: `https://t.me/{user}?text={urlencoded}` (core.telegram.org/api/links, "public username links"). Older clients ignore `text`, so we prefill **and** copy:
1. On a valid submit, compose the text. Then, **synchronously in the same submit handler, with no `await` before it**:
   - start `navigator.clipboard?.writeText(text)` and keep the promise without awaiting it;
   - call `window.open('https://t.me/' + user + '?text=' + encodeURIComponent(text), '_blank', 'noopener')`.

   Awaiting the clipboard first, as the current code does, loses the user activation, and Safari then blocks the pop-up.
2. `user` is `telegramAccounts()[0].user`: **the first account receives form enquiries**. The client can reorder the list in `site.ts`; that choice is in §12. The form doesn't ask the visitor to pick a person.
3. Status (the existing `aria-live`): "Opening Telegram…". The dove success motion plays as before.
4. When the clipboard promise settles:
   - **Resolved:** toast "Message copied too, in case Telegram doesn't fill it in."
   - **Rejected or unavailable:** no toast.
5. **Persistent panel**, which replaces the status line under the submit button and stays until the form is edited. The visitor has usually switched to the Telegram app and will come back to it. Text:

   > **Finish in Telegram.** Your message should already be in the chat with @abdulaziz_a12. Press send there.

   It has two small actions: **"Open Telegram again"** (the same URL, as a link) and **"Copy message"** (a button; on success its label becomes "Copied" for 2 s). If the clipboard write failed, the panel also shows the message in a read-only, auto-sized `<textarea>` (16 px, selectable), with the line "If the chat is empty, copy this message and paste it there." The panel is an `aria-live="polite"` region, and its first sentence is announced.
6. The message template and `{unit}` and `{floor}` rules (rev 5 TBC) are unchanged. Name and phone go into the draft only because the visitor sends it themselves.

- Success: the mark (`<use href="#mark">`, cropped by viewBox to the dove) lifts 24 px and fades. Status text reads "Opening {channel}…", and for Telegram the panel above follows.
- Explorer, gallery and viewer CTAs deep-link here with `?unit=BL05&floor=7` (hash-safe), which prefills the selects and focuses Name.
- **BL01 and floors (rev 5).** The BL01 option keeps its label "BL01 – 2 bedroom". When BL01 is chosen with a floor that is not 4, 6, 8, 10 or 11, show a **hint, not an error** under the Floor field: small, `--text-muted`, linked with `aria-describedby`, and it never blocks submit. It reads: "BL01 is a 2-bedroom home on floors 4, 6, 8, 10 and 11. On floor 7 this home is still to be confirmed." In that case the message template names the unit "BL01 (to be confirmed)" instead of "BL01 – 2 bedroom". The explorer's "Ask about this home" CTA for a to-be-confirmed position deep-links `?unit=BL01&floor=7`, which lands in exactly this state. The floor select stays 1–14; 15 and 16 are not offered.

### 5.9 Footer (navy-950)

- Top: a large closing line (Cormorant, `--fs-h2`): "Come and see it for *yourself*." with a "Book a visit" button.
- Middle grid: the mark (96 px, gold) plus the wordmark; nav links; contact (phone, WhatsApp, Telegram, email, office address, rendered only when set); language toggle.
- Bottom: "© 2026 Dar Al Salam Real Estate" · "Renders and plans are illustrative and may change." · "Back to top ↑".
- Motion: the closing line reveals by lines (§7.3). The mark ring rotates 0 → 18° with a scroll scrub (subtle).

### 5.10 Mobile sticky CTA

Under 768 px, after the hero has left the viewport: a bottom bar, 64 px plus `env(safe-area-inset-bottom)`, ivory with a hairline top border. It holds "Book a visit" (primary, flex 1) and a WhatsApp icon button (only if configured). It slides in at y 100% → 0 over 0.4 s with `power3.out` and hides while `#enquire` or the footer is in view. Content gets `padding-bottom` so the bar never covers the last element. It also hides while the film dialog is open.

### 5.11 Tower film (rev 5): hero card and film dialog

> **Rev 6:** the **card** in this section is removed. The film is now the hero background (§5.1). What still applies: the **film dialog** (opened by the hero play control and the §5.3 link), the **sound toggle** (now in the hero controls cluster), the captions and the text description. Where the dialog text below says "FLIP from the card", read it as the **circle reveal from the play control**: the frame starts as `clip-path: circle(44px at <play disc centre, relative to the frame>)` and grows to `circle(150% at …)` over 0.7 s `power3.inOut`, the scrim fades in over 0.4 s, and close reverses it over 0.45 s if the play control is on screen, otherwise it fades. The dialog film is **unshaded**: no grain, no gradient, just the scrim around the frame. Opening it pauses the background loop and fades out the music. Closing it resumes both, under the §5.1 rules. Reduced motion uses the 0.2 s cross-fade. The sound toggle's "card out of view" rule becomes "hero fully out of view": the controls are the hero's last element, so the toggle is on screen whenever music is audible.

**The constraint.** The film is 640×352 and the preview loop is 480×264. Both are sharp only at small sizes, so the film is always shown **at or below about 1.5× its source width**. It is never full-bleed, never stretched, and never cropped into the arch. The still render keeps the arch and the LCP.

**Card markup.** The card is server-rendered once in the hero media wrapper. It is a **sibling** of the masked arch, not inside it, so the dome mask and the S1 scale never touch it.

```html
<div class="film-card" data-film-card>
  <video class="film-card__video" muted loop playsinline preload="none" aria-hidden="true"
         width="480" height="264" poster="/video/film-poster.webp">
    <!-- JS adds the <source>s (webm/AV1 first, then mp4) only when autoplay is allowed -->
  </video>
  <a class="film-card__open" href="/video/film.mp4" aria-haspopup="dialog">
    <span class="film-card__play" aria-hidden="true"></span>
    <span class="film-card__label">Watch the film</span>
    <span class="film-card__time">0:41</span>
    <span class="visually-hidden">: the tower fly-through, 41 seconds, with music</span>
  </a>
  <button class="film-card__sound" type="button" aria-pressed="false" aria-label="Film music" hidden>…bars…</button>
  <button class="film-card__pause" type="button" aria-pressed="false" hidden>Pause preview</button>
</div>
```

- **No JS**: the link opens `film.mp4` in the browser's own player, and the card shows the poster. There is no `autoplay` attribute; JS starts the loop.
- **With JS**: the click is intercepted (`preventDefault`) and opens the dialog.
- The pause button is a sibling, not nested inside the link. The link stretches over the whole card (`position:absolute; inset:0`), and the button sits above it (z-index 2).

**Card look.**

- Aspect ratio 20:11, the same as the video, so nothing is cropped (`object-fit: cover` is a no-op).
- `--radius-s`, overflow clip, `--shadow-2`, and a 1 px inset hairline in gold-500 at 0.7 (`box-shadow: inset 0 0 0 1px`). The background is navy-950, which shows while the poster loads.
- Scrim: `linear-gradient(to top, rgb(11 18 32 / .8), rgb(11 18 32 / 0) 62%)` over the video.
- **Bottom-left**: a play disc (28 px; 24 under 640), solid gold-500 with a navy-950 triangle. 8 px after it comes "Watch the film" in Manrope 600, 14 px (13 px under 640), ivory. Check that this label reaches ≥ 4.5:1 against the brightest frame of the loop; if it doesn't, raise the scrim to 0.88.
- **Top-left**: the duration pill "0:41". Manrope 600, 12 px, tabular, ivory on navy-950 at 0.6, `--radius-pill`, padding 2 px 8 px. In the label above, "0:41" is visually moved here (`.film-card__time` positioned absolutely), so it reads as part of the link name.
- **Top-right**: the pause toggle. A 32 px visible circle in navy-950 at 0.55 with a 12 px ivory glyph (two bars, or a triangle when paused), inset 6 px from the corner. Its hit area is 44 px (`::after { inset: -6px }`). The accessible name swaps between "Pause preview" and "Play preview", with `aria-pressed`. It shows only while the loop is allowed to play; otherwise there is nothing moving to pause.
- **Hover** (fine pointer only): the video scales 1 → 1.04 inside the clip and the play disc scales 1 → 1.1, both 0.45 s `power3.out`. The cursor ring label is "Play" (§6).
- **Focus**: the `--focus` ring (2 px at 2 px offset) is drawn around the whole card, via `.film-card:has(.film-card__open:focus-visible)`. The pause button gets its own ring.

**Size and placement.** Steps are by viewport width; positions are relative to the hero media wrapper.

| Viewport | Card width × height | Position | Notes |
|---|---|---|---|
| < 640 (360, 390) | 168 × 92 | inside the arch: `left: 12px; bottom: 12px` | The arch is full content width with text below. The card sits over the render's street level and must not push the H1 below the fold at 360×640. |
| 640–1023 (768) | 200 × 110 | inside the arch: `left: 16px; bottom: 16px` | Stacked layout, as on mobile. |
| 1024–1599 (1024, 1366) | 240 × 132 | straddles the arch's left edge: `left: -40px; bottom: 48px` | 40 px of the card hangs into the gutter. QA check at 1024: if the lead or CTAs come within 24 px of the card, reduce the overhang to 24 px. |
| ≥ 1600 (1920) | 264 × 145 | `left: -48px; bottom: 64px` | 264 CSS px is the 480 px loop at 1.8 device px per CSS px, so it stays sharp at DPR 1–1.8. |

```
Desktop 1366: lower-left of the hero arch          Mobile 360: inside the arch
          │                        │               ┌──────────────────┐
  (CTAs)  │   tower render         │               │  tower render    │
          │                        │               │                  │
     ┌────┼──────────┐             │               │┌────────┐        │
     │0:41│        ⏸ │             │               ││0:41   ⏸│        │
     │    │  loop    │             │               ││ ▶ Watch │        │
     │ ▶ Watch the film            │               │└────────┘        │
     └────┼──────────┘             │               └──────────────────┘
          └────────────────────────┘                GARMENT · ADDIS ABABA
```

**When the loop plays.** Loading is deferred:

- On `window` `load`, wait for `requestIdleCallback` (2 s timeout).
- Then, **only if** all of the following hold, add the `<source>`s, call `load()`, and `play()` on `canplay`:
  - `prefers-reduced-motion: no-preference`
  - `!navigator.connection?.saveData`
  - `effectiveType` is `4g` or unknown
  - the hero is intersecting (IntersectionObserver)
- Pause the loop when:
  - the hero leaves the viewport (resume on re-entry, unless the user paused it)
  - `document.hidden` is true
  - the film dialog is open
- **Auto-stop after 3 loops (about 29 s).** Pause, set `currentTime = 0` so the card rests on the poster frame, and flip the toggle to "Play preview". This saves battery and keeps the card calm.
- Otherwise (reduced motion, Save-Data, slow connection, no JS): the poster only. No sources are added, no bytes of video are fetched, and the pause toggle stays `hidden`. The card still opens the dialog.
- QA note: headless Chrome reports `effectiveType: '3g'`, so a poster-only card in headless screenshots is correct.

**The film dialog.** One `<dialog class="film" aria-labelledby="film-title" aria-describedby="film-desc">` at the end of `<body>` serves both openers (the hero card and the §5.3 link).

- **Shell**: the dialog element itself is full-viewport and transparent (`width:100vw; height:100svh; max-width:none; max-height:none; padding:0; background:transparent`), and its `::backdrop` is transparent. Inside it is a `.film__scrim` (navy-950 at 0.94, fixed, inset 0) that GSAP can fade. This keeps every animated layer tweenable.
- **Layout**, centred in a column:
  1. A top row as wide as the frame: an eyebrow on the left, `<h2 id="film-title">` "The tower film" (eyebrow style, sand-200); on the right, a **Close** button. The close button is 44 px, an ivory × in a hairline circle (ivory at 0.3), with `aria-label="Close film"`.
  2. The frame: `<video controls playsinline preload="none" poster="/video/film-full-poster.webp" src="/video/film.mp4">`, aspect 20:11, `--radius-s`, on navy-950. Native controls, sound on.
  3. The caption, `<p id="film-desc">` in small text, sand-200 at 0.8, max width the same as the frame: "Rendered fly-through, 0:41, music only. It shows the tower from the street, the entrance and ground floor, and the facade up to the roof. Renders are illustrative and may change." This is the text alternative for the visuals; it describes only what is in the film.
- **Frame width**: `min(960px, 100vw − 32px, (100svh − 176px) × 20/11)`. 960 px is 1.5× the 640 px source, which is the ceiling. Reference sizes:
  - 360×640: 328 × 180
  - 768×1024: 736 × 405
  - 1366×768: 960 × 528 (height-limited: (768 − 176) × 20/11 = 1076, so the 960 cap applies)
  - 1920×1080: 960 × 528
- **Short landscape screens** (`max-height: 500px`): the caption becomes visually hidden (it stays as the description). The close button overlays the viewport's top-right corner at 8 px. The width formula becomes `(100svh − 32px) × 20/11`.
- **Captions**: there is no speech, so the track is one cue. `<track kind="captions" srclang="en" label="English" src="/video/film.en.vtt" default>` contains a single cue `00:00.000 --> 00:41.000` reading `[Music]`. On /am the cue reads `[ሙዚቃ]`; this is draft wording, flag it for the client's Amharic review.

**Open: from the card (FLIP).**

1. In the click handler, run these in the same task, so the click's user activation still allows sound:
   - `dialog.showModal()`
   - `lenis.stop()`
   - pause the card loop
   - `video.play()`; if it rejects, the native play button is the fallback
   - hide the custom cursor
2. **First**: the opener card's rect. **Last**: the dialog frame's rect. The aspect ratios are equal, so a pure transform fits it without distortion: `x, y` = centre delta, `scale` = card width ÷ frame width.
3. Tween the frame from that transform to identity: **0.7 s `expo.out`** (large media). During the flight, set the card itself to `opacity: 0`, so it looks as if the card lifts out.
4. The scrim fades opacity 0 → 1 over 0.4 s `power3.out`.
5. The top row and the caption fade in with y 8 → 0 at +0.35 s (0.4 s `power3.out`).
6. Focus moves to the `<video>` at the end of the flight (or immediately with reduced motion), so Space toggles play and the native controls are reachable.

From the §5.3 text link there is no matching card, so the frame rises instead: y 24 → 0, opacity 0 → 1, scale 0.96 → 1, 0.6 s `power3.out`.

**Close** (the Close button, Esc, or a click on the scrim outside the frame):

1. Pause the film immediately, so the sound stops on the first frame of the close.
2. Handle Esc through the dialog's `cancel` event: call `preventDefault()`, run the close animation, then `dialog.close()`.
3. If the opener card is in the viewport, play the reverse FLIP: 0.45 s `power2.inOut`, with the scrim fading out over 0.3 s. Otherwise fade the whole dialog out over 0.25 s.
4. Then:
   - `dialog.close()`
   - `lenis.start()`
   - restore the card's opacity
   - resume the card loop if it was playing and the user hadn't paused it
   - return focus to the opener (the card link or the §5.3 link)
5. On reopen, keep `currentTime`, so the film resumes where it stopped. If it had ended, reset it to 0.
6. Never autoplay the film except as a direct result of the open click.

**Reduced motion.** No FLIP and no rise: the dialog cross-fades in over 0.2 s and out the same way. The film still plays on open, because the user explicitly asked for it. The card shows only its poster (above).

**Sound toggle (rev 5).** The film's music plays as an optional soundtrack under the muted preview loop.

- Assets: `public/video/film-music.webm` (Opus, 252 KB) and `film-music.m4a` (AAC, 258 KB). The track is 41 s, loudness-normalised to −20 LUFS, with fades at both ends so it loops cleanly. The loop video itself has no audio track.

*Placement*

- The toggle goes **on the card**, in the top-right control row, to the left of the pause toggle.
  - Order from the right edge: 6 px inset, pause (32 px), a 12 px gap, sound (32 px). The 12 px gap means the two 44 px hit areas touch but don't overlap.
  - When the pause toggle is hidden (poster-only card), the sound toggle moves into the corner.
  - The row fits the 168 px card at 360: 82 px of controls plus the 0:41 pill.
- Not in the header: on mobile the header is already full, and a control that sits next to the thing it belongs to is clearer.
- Music plays only while the card is visible (rules below), so whenever music is audible, its off switch is on screen.

*Markup and naming*

- `<button class="film-card__sound" type="button" aria-pressed="false" aria-label="Film music" hidden>` sits as another sibling of the link. JS removes `hidden`; there is no sound without JS.
- The accessible name stays constant ("Film music") and `aria-pressed` carries the state, so screen readers announce "Film music, toggle button, not pressed / pressed". Changing the name as well as `aria-pressed` would announce the state twice and contradict itself.
- The visible state is a small tooltip on hover and focus-visible: ivory on navy-950, 12 px, 6 px above the button. It reads "Sound off" or "Sound on" (the current state). It is `aria-hidden`, because the state is already announced.

*Glyph*

- The same 32 px navy-950 circle at 0.55 as the pause toggle, holding three ivory bars (2 px wide, 2 px apart, max 12 px tall, `transform-origin: bottom`).
- **Off**: the bars rest at scaleY 0.25, and a 1.5 px ivory diagonal slash crosses the circle.
- **On**: no slash; the bars run an equaliser keyframe on `transform: scaleY()` only. The three bars use 0.9 s, 1.1 s and 0.7 s, `alternate`, `ease-in-out`, between 0.3 and 1. The animation runs only while audio is actually playing (`animation-play-state: paused` otherwise, for example when the music is paused because the card scrolled away).
- **Loading** (the first press, until `canplay`): the bars at 0.25, no slash, with an opacity pulse of 0.5 ↔ 1 over 0.8 s.
- **Reduced motion**: the toggle works the same. On is shown by static bars at 0.6, 1 and 0.45, with no animation; off is the slash.

*Behaviour*

- **Default OFF on every page load. Nothing is fetched until the first press.**
- **On the first press**, synchronously inside the click handler (that is the user gesture):
  - Create one `AudioContext` and call `resume()` on it.
  - Create `new Audio()` with `loop = true` and `preload = "auto"`. Pick the source with `canPlayType('audio/webm; codecs="opus"')`: the `.webm` if supported, otherwise the `.m4a`.
  - Wire it as `MediaElementAudioSourceNode → GainNode → destination`, starting at gain 0, then call `play()`.
  - Use the gain node for every fade. `audio.volume` is read-only on iOS, so it can't be used.
- **Fades**:
  - On: gain 0 → 0.8 over 600 ms (`linearRampToValueAtTime`).
  - Off: gain → 0 over 600 ms, then `pause()`.
  - A press during a fade cancels it (`cancelScheduledValues`) and ramps from the current value.
- **Errors**: if loading or `play()` fails, set `aria-pressed` back to false, show the off glyph and the toast "Sound couldn't start" (§6). Don't retry automatically.

*When the music pauses and resumes (only while the toggle is on)*

- **Card out of view**:
  - Desktop: when S1f's ScrollTrigger reaches its end (`40% top`), which is when the card has faded out.
  - Mobile and tablet: when an IntersectionObserver on the card reports it fully out of the viewport.
  - Fade out over 600 ms and pause. When the card is back (`onEnterBack`, or intersecting again), fade back in. That is the resume rule: the music follows the visibility of its own control.
- **Tab hidden** (`visibilitychange`): fade out over 200 ms and pause. When the tab is visible again, resume only if the card is in view.
- **Film dialog opens**: fade out over 300 ms and pause. The dialog's film has its own soundtrack, so the two never play together. When the dialog closes, fade back in if the toggle is still on and the card is in view.
- **The pause-preview toggle doesn't affect the music**, and the music doesn't affect the loop. They are separate controls: one for motion (2.2.2), one for audio (1.4.2).

*Memory*

- **No persistence** (refining the coordinator's sessionStorage idea). Browsers block sound that starts without a fresh tap, and "never auto-start" is the stronger rule. A remembered "on" could only ever show the toggle as on while the page stays silent, which is a lie. So every page load, including EN ↔ /am, starts off.
- If the session ever needs to remember something later, store `'on'` and use it only to show a gold 6 px dot on the toggle meaning "you had sound on". Never use it to play.

**Accessibility summary.**

- The card video is `aria-hidden` and has no tab stop. The link is the only control, apart from the pause and sound toggles.
- Audio never starts without a press. It is off by default and has its own toggle (WCAG 1.4.2).
- Moving content that runs longer than 5 s has a pause control (WCAG 2.2.2), and the loop also stops on its own after 3 loops.
- A native modal `<dialog>` makes the rest of the page inert and traps focus. Esc closes it, and focus returns to the opener.
- The film has a text description (`aria-describedby`) and a captions track. No content is available only inside the film.

---

## 6. Interaction details

- **Buttons**: pill, 52 px tall on desktop and 48 px on mobile (both ≥ 44), padding 0 28 px, Manrope 600 15 px, tracking 0.02em. On hover, the label slides up and a duplicate label slides in from below (y 100% → 0, 0.45 s, `power3.out`, `overflow:hidden`). A `::before` overlay (navy-700 on light, gold-400 on dark, sitting under the label) animates **opacity** 0 → 1 (0.3 s). The background colour itself never transitions. Active state: scale 0.98. Focus: the `--focus` ring.
- **Magnetic** (fine pointers only, primary CTAs and the floor stepper): within the button bounds plus 24 px, translate toward the pointer by `dx*0.25, dy*0.35`, clamped to 8 px, via `gsap.quickTo(…, {duration:.5, ease:"power3.out"})`. On leave, return with `elastic.out(1, .45)` over 0.8 s.
- **Cursor** (`(hover:hover) and (pointer:fine)` only; the native cursor stays visible): a 10 px gold-500 dot plus a 36 px gold ring (1 px) following with `quickTo` (dot 0.15 s, ring 0.45 s). Over links and buttons the ring scales to 1.6 and the dot to 0. Over plan cards the ring becomes a 72 px navy disc with the label "View". Over the 3D canvas the label is "Drag". Hidden while a dialog is open. Never used on touch devices.
- **Links**: an underline drawn with a `scaleX` pseudo-element (origin right to left on leave and left to right on hover, 0.4 s).
- **Plan cards**: on hover the image scales 1 → 1.04 (0.8 s `power2.out`), the arch outline offsets 10 → 6 px, and the "View plan" arrow nudges 4 px.
- **Hotspots** (key plan): see §9.3.
- **Toasts**: bottom-centre, navy pill, auto-dismiss after 4 s, `role="status"`.

---

## 7. Motion system

### 7.1 Globals

- GSAP 3.13+ (all plugins are free): `gsap`, `ScrollTrigger`, `SplitText`, `Flip`. Register once in `src/scripts/motion.ts`.
- **Lenis**: `new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false })`, so touch devices keep native scroll. Drive it from `gsap.ticker` (`gsap.ticker.add(t => lenis.raf(t*1000)); gsap.ticker.lagSmoothing(0)`) and call `lenis.on('scroll', ScrollTrigger.update)`. Anchor links use `lenis.scrollTo(target, {offset: -headerH, duration: 1.2})`. Lenis is **disabled** for reduced motion, and `lenis.stop()` runs while a dialog or menu is open.
- Ease vocabulary (use only these):
  - `--ease-out` = `power3.out`: entrances.
  - `--ease-inout` = `power2.inOut`: state changes and camera moves.
  - `expo.out`: hero and large media only.
  - `none`: scrubbed scenes.
  - CSS equivalents: `cubic-bezier(.215,.61,.355,1)` and `cubic-bezier(.455,.03,.515,.955)`.
- Durations: micro 0.2–0.3 s · UI 0.45–0.6 s · reveals 0.9–1.2 s · hero 1.4–1.8 s. Stagger 0.06–0.1 s.
- Animate only `transform`, `opacity` and `clip-path`. No `filter`, `color`, `background-color` or `border-color` tweens or CSS transitions; state colour changes are instant or done by cross-fading stacked layers.
- **No-JS / failure safety**: the default CSS is the final state. An inline `<head>` script sets `html.js`. Hidden initial states apply only under `html.js [data-reveal]`. `motion.ts` adds `html.motion-ready` after init, and a 2.5 s timeout removes `html.js` if init never finished, so content is never stuck invisible.

### 7.2 Intro and hero (first load)

The intro is an ivory curtain (`#intro`, fixed, z 100) holding the gold mark at 96 px. Rev 6: the curtain lifts off the **dark hero**: the poster with its shade and grain, which have been painted underneath from the first frame. The ivory-to-navy reveal is the moment. **It is CSS-driven and starts on first paint, so it never waits for JS.** It shows only when `sessionStorage.introSeen` is unset; the inline head script adds `html.intro`. It never runs when `prefers-reduced-motion` is set. The hero image paints underneath at full opacity, so LCP is not delayed.

**The whole intro and hero reveal is CSS `@keyframes` on one shared clock (the curtain's), with no JS dependency.** The H1 is pre-split into lines at build time (each line wrapped in `<span class="line"><span>` in the markup, with `overflow: clip`), so no SplitText is needed above the fold. On repeat visits (`html.intro` absent) the same keyframes run with `animation-delay` shifted by −0.85 s. With reduced motion or no JS, keyframes are not applied and everything is visible. GSAP takes over only for scroll-linked behaviour after the reveal (S1). The table gives keyframe timings; the eases map to CSS `cubic-bezier` equivalents (power3.out = `cubic-bezier(.215,.61,.355,1)`, expo.out = `cubic-bezier(.16,1,.3,1)`, power2.inOut = `cubic-bezier(.455,.03,.515,.955)`). Confirm this in Lighthouse; if the curtain hurts LCP, remove it and keep step 4 onward.

| t (s) | Element | From → To | Dur | Ease |
|---|---|---|---|---|
| 0.00 | mark: dome and ring | `clip-path: inset(100% 0 0 0)` → `inset(0)` | 0.7 | power3.out |
| 0.25 | mark: dove | y 12, opacity 0 → y 0, 1 | 0.6 | power3.out |
| 0.85 | curtain | yPercent 0 → −100 (lifts like a door) | 0.9 | expo.inOut (`cubic-bezier(.87,0,.13,1)`) |
| 0.85 | `.hero__bg` (poster; the video inherits it later) | scale 1.12 → 1. The shade and grain are not scaled: they are static and always present | 1.8 | expo.out |
| 1.05 | eyebrow | opacity 0, y 12 → 1, 0 | 0.6 | power3.out |
| 1.10 | H1 lines (pre-split in markup, CSS keyframes) | translateY 110% → 0, `animation-delay` +0.08 s per line | 1.1 | expo.out |
| 1.40 | lead, CTAs | opacity 0, y 16 → 1, 0, stagger 0.08 | 0.7 | power3.out |
| 1.55 | play control (rev 6) | opacity 0, scale 0.85 → 1, 1, origin at the disc centre | 0.7 | power3.out |
| 1.70 | header | opacity 0, y −12 → 1, 0 | 0.5 | power3.out |
| 1.90 | scroll cue line | scaleY 0 → 1 loop (origin top, then bottom) | 1.6 | power2.inOut, repeat −1 |
| 1.80 | controls cluster (rev 6) | opacity 0, y 8 → 1, 0 | 0.5 | power3.out |
| ≥ 1.75 | background video (JS, rev 6) | opacity 0 → 1 over the poster, on the first `playing` event and not before the curtain's `animationend` | 1.2 | power2.inOut |

The video fade is the only JS step on this clock, and it only ever adds motion on top of a finished, legible frame. If the video never arrives, the poster is the hero. Total: the poster paints at first paint, the text is readable at about 1.5 s, and the motion starts at about 1.8 s or whenever the data arrives.

Without the curtain (repeat visit), the same keyframes start at t = 0.85 with everything shifted earlier. Total time to interactive content is about 1 s.

### 7.3 Scroll scenes and per-element specs

`start`/`end` use ScrollTrigger syntax (`trigger-position viewport-position`). "Once" means `toggleActions: "play none none none"` and the trigger is killed after it plays.

| # | Element | Animation | Trigger · start → end | Scrub | Dur / ease |
|---|---|---|---|---|---|
| S1 | Hero (desktop ≥1024, rev 6) | `.hero__bg` scale 1 → 1.08 and yPercent 0 → 6; text block y 0 → −80 and opacity 1 → 0.2; play control opacity 1 → 0 by 50%. The shade, grain and controls stay put | `#top` · `top top` → `bottom top` | `true` | ease none |
| S1m | Hero (mobile and tablet, rev 6) | **none**. The page just scrolls over a playing video; a scrub on top of it isn't worth the cost on phones | — | — | — |
| S2 | Facts numerals | count-up from 0 (14, 126; "158–171" counts both ends; "2 & 3" fades only). The text is pre-rendered as the final value and JS tweens from 0, so widths are fixed by tabular-nums and a `min-width` per cell. | `#facts` · `top 80%` | once | 1.4 / power2.out, stagger 0.12 |
| S3 | Facts hairlines | scaleX 0 → 1 (origin left) | `#facts` · `top 85%` | once | 1.0 / power3.inOut |
| S4 | All section eyebrows | rule scaleX 0 → 1, label opacity and x −8 → 0 | each eyebrow · `top 85%` | once | 0.7 / power3.out |
| S5 | H2s below the fold (`[data-split]`; the only SplitText use) | SplitText lines, mask lines, yPercent 110 → 0, stagger 0.08 | heading · `top 82%` | once | 1.0 / expo.out |
| S6 | Body paragraphs and lists (`[data-reveal]`) | opacity 0, y 24 → 1, 0, children stagger 0.08 | block · `top 85%` | once | 0.8 / power3.out |
| S7 | Story arch | wrapper `clip-path: inset(18% 0 0 0)` → `inset(0)`; media scale 1.12 → 1 (rev 6: was 1.2; the whole tower must be in at rest) | arch · `top 85%` → `top 35%` | `0.6` | none |
| S8 | Story arch parallax | media yPercent −2.5 → 2.5 on a media box 106% tall (`inset: -3% 0`). Rev 6: was ±6, which would crop the roof of the whole-tower image | arch · `top bottom` → `bottom top` | `true` | none |
| S9 | Dusk transition into explorer | **Static, no JS** (rev 3; the fixed veil dimmed the end of the story copy). `#explore::before`: `position:absolute; left:0; right:0; bottom:100%; height:32svh; background:linear-gradient(to bottom, rgb(15 24 40 / 0), var(--navy-900)); pointer-events:none`. `#story` gets `padding-bottom: calc(var(--section-y) + 32svh)` so no story content ever sits in the gradient | — | — | — |
| S10 | Explorer intro (desktop ≥1024) | **pin** `#explore` for `+=60%`: camera rises from ground level (y 8 m, looking up) to the 3/4 view, the model rotates −25° → 0°, and the panel slides in x 40 → 0 with opacity. After the pin releases, the model is fully interactive and scroll is never captured again. | `#explore` · `top top` → `+=60%` | `0.8` | none |
| S10m | Explorer intro (mobile and tablet) | no pin; the model fades and rises (y 40 → 0) once | `#explore` · `top 75%` | once | 1.0 / power3.out |
| S11 | Homes cards | opacity 0, y 40 → 1, 0, `ScrollTrigger.batch` with interval 0.1, batchMax 3 | each card · `top 88%` | once | 0.9 / power3.out, stagger 0.08 |
| S12 | Homes card media | inner image scale 1.1 → 1 (in the same batch) | — | — | 1.2 / expo.out |
| S13 | Location map (rev 7) | **Live map:** opacity 0 → 1 over the diagram, then Leaflet `flyTo` z15 → z17, then the pin drop and card (full sequence in §5.6). **Diagram (fallback only):** road group `clip-path: inset(0 100% 0 0)` → `inset(0)`, then landmark pins scale 0 → 1 (`back.out(2)`, stagger 0.1), then labels fade | map · `top 75%`, and for the live map also the first tile `load` | once | live: fade 0.6 / power2.out, fly 2.0, pin 0.55 / power3.out; diagram: roads 1.4 / power2.inOut, pins 0.5 |
| S14 | Location site pin | pulse ring scale 1 → 2.2 with opacity 0.5 → 0, repeating, on whichever pin is showing (the diagram's or the map's ground ring); **paused offscreen** (ScrollTrigger `onToggle`) and when `document.hidden` | — | — | 2.4 / power1.out, repeat −1 |
| S15 | Payment pillars | icons stroke-draw via clip-path inset left → right, text follows, stagger 0.12 | grid · `top 80%` | once | 0.9 / power3.out |
| S16 | Payment timeline | hairline scaleX 0 → 1 tied to scroll; each step dot fills (scale 0 → 1) as the line passes it | timeline · `top 75%` → `bottom 55%` | `true` | none |
| S17 | Enquire arch image | as S7 | — | `0.6` | — |
| S18 | Form fields | opacity, y 16 → 0, stagger 0.05 | form · `top 85%` | once | 0.6 / power3.out |
| S19 | Footer closing line | as S5; the mark ring rotates 0 → 18° | footer · `top bottom` → `bottom bottom` | ring: `true` | — |
| S20 | Header theme swap | toggle `data-theme` when a dark section crosses `top var(--header-h)` | each section · `top 72px` → `bottom 72px` | — | two stacked header background layers cross-fade on opacity (0.3 s); text and logo colours swap instantly. No colour transitions |

Refresh ScrollTrigger after fonts load (`document.fonts.ready.then(() => ScrollTrigger.refresh())`) and after the 3D chunk mounts. Use `ScrollTrigger.matchMedia()` (or `gsap.matchMedia`) for the desktop/mobile splits and the reduced-motion split. All of these go in one `mm.add({...})`.

### 7.4 Section rhythm

The scroll pace varies on purpose: fast and light through the facts; slow and editorial in the story (parallax); one cinematic pinned moment at the explorer; brisk through the gallery; slow again in location (drawing); a confident close.

---

## 8. Reduced motion (`prefers-reduced-motion: reduce`)

- No Lenis, no intro curtain, no pins, no scrubbed parallax or scale, no magnetic effect, no custom cursor, no pulse loop.
- Reveals (S4–S6, S11, S15, S18) become a 0.2 s opacity fade with no movement, or nothing. Headings are not split.
- Counters show the final values immediately.
- Explorer: no camera fly. Floor and unit changes cross-fade over 0.2 s. No auto-rotate. The drag-to-turn control stays, because it is user-initiated.
- Flip filtering is instant. Dialogs open without scale.
- Hero (rev 6): **the poster only**: no video sources, no curtain, no `.hero__bg` scale, no S1, no play-disc breath, and the pause toggle is hidden. The shade and grain stay, because they are static. The play control and the sound toggle work; the sound toggle shows static bars instead of the equaliser animation. The film dialog cross-fades in and out over 0.2 s with no FLIP, and the film plays only because the user opened it.
- Location map (rev 7): the map still loads, because it is content, but it opens straight at z17 with `setView` (no fly, so no z15 tiles), with `fadeAnimation: false`. It cross-fades in over 0.2 s. The pin and card are placed at once, the ground ring doesn't pulse, and "Centre on the tower" uses `setView`. Zoom animations the user starts with the buttons, double-tap or pinch stay.
- Telegram card (rev 7): no hover nudge on the arrow.
- Tower stage (rev 9): no push-in and no slab lift; the band highlights and the stage cross-fades over 0.2 s.
- Walk-in mode (rev 9): offered, but entering and moving between rooms are 0.2 s cross-fades. No inertia on the look drag, no gyro. The "Look left / Look right" buttons turn in one step.
- 3D apartments (rev 8): the default view is `plan`. On request, 3D shows at the static angle (56° / −35°): no lift (U1 becomes a 0.2 s cross-fade at full height), no auto-orbit, instant cutaway, and an instant room look-at. Drag-to-turn stays, because the user starts it.
- `scroll-behavior: auto`. Anchor jumps are instant.
- Use `gsap.matchMedia()` conditions `{ motion: "(prefers-reduced-motion: no-preference)" }` so everything is set up once and reverts cleanly when the setting changes.

---

## 9. Interactive tower explorer (the "creative model")

### 9.1 Data model (`src/data/units.ts`, from `docs/design/keyplan-hotspots.json`)

```ts
type UnitCode = 'BL01'|'BL02'|'BL03'|'BL04'|'BL05'|'BL06'|'BL07'|'BL08'|'BL09';
interface UnitType { code: UnitCode; bedrooms: 2|3; gross: number; net: number;
  rooms: string[];            // i18n keys from the brief table
  plan: ImageMetadata;        // brand-source/plans/blXX.jpg
  hotspot: { points: [number,number][]; centroid: [number,number] };  // key-plan px
  block: 'north'|'south'; }   // internal only (layout logic); never rendered in the UI
const RESIDENTIAL_FLOORS = 14;   // floors 1–14, each uses the typical key plan (9 units)
// Availability is unknown: no status field. If the client later supplies it, add
// `status?: Record<number, Partial<Record<UnitCode,'available'|'reserved'>>>` in site.ts.
```

Blocks, from the plan (internal grouping only; **never shown in the UI**, and the UI never states per-block lift counts):

- **North** block: BL01, BL02, BL03, BL04, around core A (upper centre).
- **South** block: BL05, BL06, BL07, BL08, BL09, around core B (centre).

**Rev 5 (BRIEF update 2026-11-14), as already modelled in `src/data/units.ts`:**

- The tower has **16 floors**. The explorer shows plan floors **1–14** only, because those are the plans we have. There are no slabs, rows or numbers for 15 and 16.
- BL01 (2 bedroom) has `confirmedOn: [4, 6, 8, 10, 11]`. On every other plan floor, that position's `SlotStatus` is `'tbc'`: it is shown as "To be confirmed". It is **never** drawn as a 3-bedroom home, never hidden, and never shown with plan specs.

Assumption, flagged: every residential floor uses the same typical layout. This follows from "9 apartments per floor" and the "typical floor" key plan. Unit naming in the UI: "Floor 7 · BL05". Never "Apartment 705": we don't know the client's numbering, so it is `TODO(client)`.

### 9.2 States and flow (one state machine, URL-synced)

```
IDLE (tower)  --hover slab / focus floor button-->  PREVIEW(floor n)  [tooltip]
     |                                                     |
     +----- click/tap slab, Enter on floor button, stepper "View floor n" ----+
                                                           v
                                              FLOOR(n)  [key plan, 9 hotspots]
                                                 |  hover/focus hotspot → mini card
                                                 |  click/Enter hotspot or chip
                                                 v
                                              UNIT(n, code) [plan, specs, CTAs]
   Back/Esc: UNIT → FLOOR → IDLE.   Breadcrumb buttons jump to any level.
   URL hash: #explore            #explore/f7            #explore/f7/bl05   (replaceState, shareable)
```

**Panel content per state** (right panel on desktop, stacked under the model on mobile; transitions use a 0.5 s cross-fade plus x 24 → 0, `power3.out`):

- **IDLE**: the accessible **floor list** is the primary control. It is a `<ol>` of 14 `<button>`s ordered 14 → 1. Rows are 48 px with hairlines between them. Hovering or focusing a row highlights the matching 3D slab, and vice versa. Below the list sits a muted legend: "Ground floor: commercial · Basement: parking & offices".
  - **Row text (rev 5)** is "Floor n · {mix} ›", where mix comes from `floorMix()`:
    - floors 4, 6, 8, 10, 11: "1 × 2-bed · 8 × 3-bed"
    - other floors: "8 × 3-bed · 1 to be confirmed"
    - The "1 to be confirmed" part is in `--text-muted`. The rest of the row keeps the normal text colour. "9 homes" is dropped from the row.
  - **Above the list (rev 5)**, a non-interactive note: a `<p>` outside the `<ol>`, so it is not a list item and not a button. It reads "16th floor planned".
    - It is 40 px tall, small, in `--text-muted`, with a dashed hairline under it (1 px `--line`, `border-bottom-style: dashed`).
    - It is preceded by a 10 px dashed-outline square glyph (`aria-hidden`), the same "not drawn yet" language as the TBC hatch.
    - No slab is added to the model. The dashed note is the only sign of floors above 14.
  - Under the list, the muted line "2-bedroom homes on floors 4, 6, 8, 10 and 11" (`explore.twoBedOn`) sits above the legend.
- **FLOOR(n)**: heading "Floor 7". Floor stepper (−/+, 44 px, magnetic). The **key plan SVG** (§9.3). Below it, 9 unit chips in a 3×3 grid, or a horizontal scroller on mobile (`BL01 · 2 bed · 158.54 m²`), mirroring the hotspots for keyboard and screen-reader users. A "Back to tower" button.
  - Rev 5, on a TBC floor: the BL01 chip reads "BL01 · To be confirmed". It has a 1 px **dashed** `--input-border` border, `--text-muted` text, and no m². It is still a button and still opens UNIT(n, BL01), which shows the TBC card below.
- **UNIT(n, code)** (rev 8: units with geometry open in the 3D dollhouse, §9.6; the rest, and every fallback, keep this view): the plan image (click opens the plan viewer from §5.5), then code, type, gross and net m², and the room list. Actions: **Request pricing for Floor 7 · BL05** (primary, deep-links the form) and **Book a visit**. Prev/next unit arrows cycle BL01 → BL09 on the same floor, including a TBC position. The 3D model keeps the selected floor pulled out.
- **UNIT(n, BL01) on a TBC floor (rev 5)**: same frame, different content. There are no plan specs, so no plan image, no m², no rooms and no plan-viewer link. It shows:
  - **In place of the plan image**: a sand-100 panel of the same aspect ratio, filled with the TBC hatch (§9.3). A centred status chip sits on it: "To be confirmed".
    - The chip is a non-interactive `<span>`, 32 px tall, `--radius-pill`, gold-700 text with a 1 px dashed gold-700 border on ivory, Manrope 600, 14 px.
  - Eyebrow "Floor 7 · BL01". No type line: never "2 bedroom" or "3 bedroom" here.
  - Body (`--text-muted`): "The home in this position on floor 7 is not confirmed yet. 2-bedroom homes are on floors 4, 6, 8, 10 and 11."
  - Actions:
    - **Ask about this home** (primary): deep-links `?unit=BL01&floor=7` (§5.8 shows the matching hint).
    - **See BL01 on floor 4** (secondary): goes to UNIT(m, BL01), where m is the nearest 2-bedroom floor. Ties go to the lower floor, so: 1–5 → 4, 7 → 6, 9 → 8, 12–14 → 11.
  - Changing floors while in UNIT(·, BL01) keeps BL01 selected and switches between the full card and this TBC card in place, with the usual 0.5 s cross-fade.
- **3D / SVG maquette tooltip (rev 5)**: "Floor 7 · {mix}", using the same strings as the list rows (`explore.floorTooltip`), not "9 homes".

### 9.3 Key plan with hotspots (SVG, works without WebGL)

```html
<svg viewBox="100 60 1200 1840" role="group" aria-label="Floor 7 key plan: 8 × 3-bed · 1 to be confirmed">
  <image href="{keyplan-duotone.webp}" x="0" y="0" width="1549" height="1940" />
  <!-- one per unit, points straight from keyplan-hotspots.json -->
  <a href="#unit-bl05" class="hotspot" data-unit="BL05"
     aria-label="BL05, 3 bedroom, 169.23 m² gross">
    <polygon points="497,1430 497,1796 550,1794 557,1815 673,1815 677,1840 879,1833 877,1511 853,1509 850,1432"/>
    <text x="689" y="1629" class="hotspot__label">BL05</text>
  </a>
</svg>
```

The viewBox `100 60 1200 1840` crops away the empty margin and the grid bubbles. The legend area is already blank in the duotone image.

Hotspot styles:

| State | Fill | Stroke | Label |
|---|---|---|---|
| Rest | sand-100 at 0.5 | `--input-border` 1.5 px (`vector-effect: non-scaling-stroke`) | Manrope 600, 46 px in SVG units, navy |
| Hover/focus | gold-500 at 0.28 | gold-600, 2 px | navy pill showing `BL05 · 3 bed · 169.23 m²` |
| Selected | gold-500 at 0.45 | gold-600, 2 px | gold pill |
| Dimmed (another unit selected) | ivory at 0.35 | — | 50% opacity |
| **To be confirmed** (rev 5: BL01 on floors other than 4, 6, 8, 10, 11) | the TBC hatch: `<pattern id="tbc-hatch" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">`, one line `x1=0 y1=0 x2=0 y2=28`, navy at 0.22, 3 SVG units wide, over ivory at 0.6 | `--input-border` 1.5 px, **dashed** `8 6` (non-scaling) | two lines: "BL01" (46 units, navy at 0.6), then "To be confirmed" (32 units, Manrope 500, navy at 0.6). Below 260 px plan width it is hidden like the other labels. |
| TBC hover/focus | hatch kept, plus gold-500 at 0.18 on the duplicate layer | gold-600, 2 px, still dashed | navy pill "BL01 · To be confirmed" (no type, no m²) |
| TBC selected | hatch kept, plus gold-500 at 0.3 | gold-600, 2 px, dashed | gold pill "BL01 · To be confirmed" |

TBC hotspot accessibility (rev 5): `aria-label="BL01, to be confirmed on floor 7"`. The key plan's group label uses the mix: "Floor 7 key plan: 8 × 3-bed · 1 to be confirmed" (`explore.keyplanLabel`). The server-rendered `href` stays `#unit-bl01`. The no-JS fallback is the BL01 card, which carries "On floors 4, 6, 8, 10 and 11" (§5.5), so the no-JS user is not misled. "Find on a floor" pulses on a TBC position work the same way.

- Fill transitions are CSS opacity on a duplicate polygon layer, so we never tween colour.
- Focus ring: `outline` isn't reliable on SVG `<a>`, so use a `:focus-visible` stroke of 3 px in gold-600.
- Hit areas are the polygons themselves. The smallest unit is about 360×400 SVG px, which is about 75×80 CSS px at mobile width, so tapping works.
- In-plan labels (rev 3, as built): 46 SVG units, shown at rest whenever the rendered plan is ≥ 260 px wide (the height-capped plan is 280–420 px, so the earlier 520 px threshold never triggered). Below 260 px, hide the `<text>` labels and rely on the unit chips, which are always visible, plus the selected-unit pill. Unit polygons have a resting fill of sand-100 at 0.5 under the gold hover layer.
- Hotspots are server-rendered with `href="#unit-blXX"`, which points at the matching card in the homes section (`id="unit-bl05"`), so they work without JS. JS intercepts the click (`preventDefault`), updates the explorer state and writes `#explore/f7/bl05` with `history.replaceState`. The hash must never trigger a native or Lenis scroll jump.
- On "Find on a floor" from the gallery, the target hotspot pulses twice (scale 1 → 1.03 → 1, `transform-origin` at its centroid, 0.4 s ×2).

**Where the polygons come from:**

- I segmented `keyplan-typical-floor.png` by legend hue: BL01 #D3A778, BL02 #5E50C1, BL03 #88624F, BL04 #D07676, BL05 #CAC662, BL06 #7FE96B, BL07 #669E79, BL08 #B36FC4, BL09 #65B5B6.
- Each unit was restricted to its own bounding box, morphologically closed, then simplified with `approxPolyDP` at ε = 6 px.
- The result is checked visually in `docs/design/keyplan-hotspots-check.jpg`.
- Scale: 35.7 px/m. BL05's polygon area works out to about 116 m², close to its 119 m² net, which confirms the scale.

All 9 polygons (image px, viewBox `0 0 1549 1940`):

| Unit | Centroid | Points |
|---|---|---|
| BL01 | 1058,271 | `1202,89 858,96 848,104 848,114 859,116 860,162 842,164 844,283 858,285 860,335 890,338 896,394 920,398 927,361 915,360 916,335 961,336 964,484 1196,489 1191,375 1262,374 1263,167 1204,168` |
| BL02 | 577,295 | `767,99 456,109 456,166 407,168 358,488 658,479 660,427 776,431 775,329 757,327 758,287 779,284 779,163 766,162` |
| BL03 | 497,794 | `338,600 275,981 639,979 640,949 690,947 692,603` |
| BL04 | 1048,667 | `1196,481 960,485 957,497 944,497 943,520 845,527 844,631 864,634 863,675 847,675 841,749 845,781 863,783 863,834 1197,836 1200,796 1262,793 1262,583 1192,583` |
| BL05 | 689,1629 | `497,1430 497,1796 550,1794 557,1815 673,1815 677,1840 879,1833 877,1511 853,1509 850,1432` |
| BL06 | 1069,1139 | `871,938 873,1247 915,1247 912,1337 1263,1341 1262,972 1200,971 1197,954 1082,953 1078,934` |
| BL07 | 1073,1629 | `1261,1428 915,1430 913,1516 878,1515 881,1831 1263,1811` |
| BL08 | 445,1169 | `639,981 273,982 220,1312 273,1314 275,1365 558,1362 551,1317 592,1279 690,1279 690,1178 633,1176 632,1128 645,1127` |
| BL09 | 321,1631 | `217,1314 128,1868 333,1863 338,1851 496,1834 496,1429 379,1428 373,1437 331,1437 330,1366 275,1366 271,1315` |

Floor outline (union of the units and cores, for the 3D slab):
`1202,89 456,109 456,165 407,168 358,485 358,599 337,604 128,1868 333,1863 343,1850 492,1834 691,1840 1263,1811 1262,583 1196,582 1196,376 1262,374 1263,167 1204,166`

### 9.4 The model: three tiers, chosen at runtime

> **Rev 9:** the explorer's first view is now the photoreal tower stage (§9.7), which needs no WebGL. The tier 2 tower massing described below is removed (§9.7 A4). The tier rules still decide whether the floor slab, the dollhouse and walk-in mode load.

| Tier | When | What |
|---|---|---|
| **0: static SVG maquette** (server-rendered, zero JS) | Always present in the HTML. It is the no-JS view and the placeholder until WebGL is ready. | An **axonometric SVG** generated at build time in an Astro component from `floorOutline`: project each floor's outline (x, y in metres, z = floor height) with a 30° iso projection; draw the ground and podium, 14 slabs (top face plus two visible side faces), and a parapet. Each slab is a `<g data-floor="n">` with a gold hover/selected style. About 15 KB of inline SVG, simplified to ~8 vertices per face. |
| **1: SVG interactive** | JS loaded but WebGL unavailable, `navigator.connection.saveData`, `effectiveType` in `2g`/`slow-2g`/`3g`, or `deviceMemory < 4`. | The same SVG with hover, click and tooltip wired by a ~3 KB vanilla module. A small button reads "Load 3D model" (it loads tier 2 on demand). |
| **2: Three.js maquette** | WebGL2 is available and none of the tier-1 conditions apply. Loaded when `#explore` is within 1 viewport (IntersectionObserver `rootMargin: "100% 0px"`), via dynamic `import()`. | Described below. It cross-fades over the SVG (opacity 0 → 1, 0.6 s) once the first frame has rendered. |

**Tier 2 scene spec** (`src/scripts/tower/scene.ts`):

- **Geometry**: convert `floorOutline` to metres (÷ 35.7) and centre it. The plate is about 32 m × 50 m.
  - Each floor is an `ExtrudeGeometry` (depth 2.9 m, gap 0.3 m, illustrative floor-to-floor 3.2 m).
  - Floor 0 (ground, commercial) is 4.8 m tall with a 0.6 m inset (podium/colonnade feel, matching the render's darker ground storey).
  - The roof parapet is 1.2 m.
  - A basement is drawn only as a dashed outline below a ground plane.
  - 14 residential meshes share one geometry. Total under 3k triangles.
  - Label the heights "illustrative" in code comments. Don't show them in the UI.
- **Material, the "maquette" look**:
  - Slabs: `MeshLambertMaterial` in ivory `#F3ECE2`.
  - Floor edges: `EdgesGeometry` → `LineSegments` in gold-500 at 0.55 opacity.
  - Glazing band: a slightly inset second extrusion (0.5 m tall at the top of each floor) in navy-600, which suggests window bands.
  - Ground plane: **no visible disc edge** (rev 3). Radius 30 m, colour = the section background (navy-900), carrying only the soft radial shadow texture (one 256 px canvas texture), so the frame may crop it invisibly. It must not drive the camera fit.
  - Glazing band (rev 3): `#ABB0BC` (navy-600 mixed 40% into ivory) instead of navy-600, so the floors read as a maquette with glass, not dark stripes. Gold edge lines at opacity 0.7.
  - Lights: `HemisphereLight` (sky `#FBF7F2`, ground `#1A273F`, 0.9) plus one `DirectionalLight` (warm `#F5E6C8`, 0.8) from the upper left. **No real-time shadows.**
- **Camera**: `PerspectiveCamera` with fov 28 (architectural, low distortion), a 3/4 view matching the render (azimuth about −35°, elevation about 18°), framing rule (rev 3): fit the tower's **projected bounding box** (outline corners at y = 0 and y = H ≈ 50.5 m) across the whole orbit range (default azimuth ±40°) so it fills **80% of the canvas height and at most 84% of its width**. No extra padding term, and the ground disc is not part of the fit. The look-at target is **y ≈ 0.415·H ≈ 21 m**, not H/2: at 18° elevation the roof pushes the visual mass up, and 21 m centres the projected box. Reference results (fov 28): 497×520 stage → distance 167.5 m; 536×760 → 180.5 m; 370×600 → 205.5 m; 328×385 → 167.5 m. Implement it as a fitting loop (step the distance and project the 8 extreme corners) or as a closed form; then centre the projected box vertically to within ±2% of the canvas centre. **No zoom.** Orbit only horizontally (±40° of the default) by drag, with damped inertia. `touch-action: pan-y` on the canvas, so vertical swipes still scroll the page. **The wheel always scrolls the page.**
- **Interaction**:
  - Raycast on `pointermove` (rAF-throttled) against the 14 floor meshes.
  - Hover sets the slab colour to gold-300, sets its emissive to gold-500 × 0.15, sets its edges to opacity 1, lightens the others slightly, and positions an HTML tooltip at the slab's screen-projected right edge: "Floor 7 · {mix}" (rev 5, §9.2).
  - Click selects the floor: the slab slides out 3 m toward the camera (0.6 s `power3.out`), the camera eases its look-at **partway** toward that floor: `lookY = 0.415·H + (floorMid − H/2) × 0.35` (0.9 s `power2.inOut`), so even floor 14 or floor 1 keeps the whole tower in frame, and the panel moves to FLOOR(n).
  - Selecting a floor from the list or stepper triggers the same animation.
  - The selected floor stays pulled out while you browse units; changing floors slides the old slab back in.
- **Accessibility**: `<canvas aria-hidden="true">`. All control goes through the floor list, stepper and hotspots, which share state with the canvas. The canvas has no tab stop.
- **Rendering**:
  - `renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75))`; `antialias: devicePixelRatio < 2`; `powerPreference: "low-power"`.
  - **Render on demand**: no continuous loop. Request a frame on pointer events, during tweens, and during the S10 scrub. An idle auto-turn (±6° sway, 20 s period) runs only while the section is visible and motion is allowed.
  - Stop everything when the section is offscreen (IntersectionObserver) or the tab is hidden.
  - On resize, observe the canvas box with a ResizeObserver, not window resize.
  - Dispose geometries and materials on Astro page swap (if view transitions are used).
- **Fail-safe**: wrap init in try/catch. On any error or `webglcontextlost`, keep tier 1 visible and log once.

### 9.5 Explorer layout specifics

- Desktop: the model is in cols 1–5 at a height of `min(80svh, 820px)`; the panel is cols 6–12, an ivory "paper" card (`.theme-paper`, `--radius-s`, `--shadow-2`) on navy. The breadcrumb sits at the top right of the section: `Tower › Floor 7 › BL05`, with each segment a button.
- Tablet: the model sits on top at 60svh, with the panel below at full width.
- Mobile: the model is 52svh (tier 2) or the SVG maquette at the same aspect. Below it, the stepper row ("−  Floor 7  +", buttons 48 px) and the primary "View floor 7" button. The panel stacks under that. When a floor or unit is selected, smooth-scroll the panel top into view (offset header).
- Hint chip over the model (fades after the first interaction): "Tap a floor" on touch, "Hover a floor · drag to turn" on pointer devices.

### 9.6 3D apartments (rev 8): the unit "dollhouse"

BRIEF "3D apartments" (approved 14 Nov 2026). The reference is the user's video, where a tower leads to a lifted floor, then an isometric cutaway of one home with a side panel, then a photoreal room. Our version lives **inside the existing explorer**: tower → floor → key plan → unit. When a unit has geometry, its plan "lifts" into a Three.js cutaway built from the plan's own measurements. **Pilot: BL05.** The other eight follow the same data format (§9.6.1) and switch on one at a time.

#### 9.6.1 Data: `docs/design/units/{id}.json` (BL05 delivered)

| File | What |
|---|---|
| `docs/design/units/bl05.json` | The geometry, 11 KB raw and 3.2 KB gzipped with the rev 8.1 furniture (budget 20 KB). Impl copies it to `src/data/units3d/bl05.json` and imports it dynamically. |
| `docs/design/units/bl05-floor.webp` | The floor texture: the plan crop px (180, 0)–(1800, 1765) at 1024 × 1116, 105 KB. Impl makes the AVIF (target ≤ 90 KB) with sharp at build time and keeps this WebP as the fallback. **v1 still shows the plan's dimension lines and labels.** A cleaned v2 (lines and labels painted out, furniture kept) is a design follow-up and changes only this file. |
| `docs/design/units/bl05-check.jpg` | Every wall, opening, solid and room from the JSON drawn over the plan, for review. Red: walls. Green: openings drawn on the plan. Orange: openings inferred. Blue: railings. Purple: solids. Light blue: rooms. Yellow: hall. |
| `docs/design/units/trace-bl05.py` | The tracing script, which writes both the JSON and the check image. Copy it for BL01–BL09: change the px rectangles, rerun, and compare against the check image. |

**Format**: metres; x to the right, z down the plan (plan-aligned, not north-aligned, because north isn't on the plans), y up.
- `pxPerM: [145, 140.5]`: the plan raster is about 3% wider than tall, so x and z scale differently. Measured against the labelled dimensions: kitchen 404, corridor 129 and 355, bedroom 391, living 451, bedroom 255. Tolerance is about ±5 cm.
- `originPx` is the unit's outer top-left corner.
- `texture.plane` is the floor rectangle in metres that the texture covers, with UV = ((x − minX)/(maxX − minX), 1 − (z − minZ)/(maxZ − minZ)).
- `footprint`: the outline of the unit, including balconies. It is the floor and plinth shape.
- `walls[]`: `{id, a, b, t, h, kind}`. A centreline from `a` to `b`, thickness `t` and height `h`. `kind` is `interior | facade | corridor | lightwell` and drives the cutaway (§9.6.3). Door gaps are already left out of the walls.
- `openings[]`: `{id, type: door | glazed-door | window, a, b, t, sill, head, wall, basis, leaves?, note?}`. `basis` is `plan` when the plan draws or dimensions the opening, and `inferred` when we read it from the drawing. Inferred openings are the two balcony glazed doors and the bedroom window to the balcony; their notes say why.
- `railings[]`: `{id, a, b, h: 1.1}`, for the balcony edges.
- `solids[]`: `{id, kind: column | shaft | wardrobe | counter, poly, h}`. Extruded polygons. Wardrobes are 2.2 m and counters 0.9 m.
- `rooms[]`: `{id, name, area, poly, label}`. `name` is an i18n key and `area` is **exactly the plan's label** (BL05: 9.74, 2.71, 9.05, 3.14, 26.41, 15.82, 9.74, 2.71, 1.9, 6.7). We never show an area computed from the polygon. `label` is the hotspot anchor point.
- `hall`: the circulation floor polygon. It is unlabelled on the plan, so it gets **no hotspot**.
- **Rev 8.4 (other units):**
  - `area` may be **`null`** when the plan's label is illegible, for example hidden under a dimension (BL01 kitchen and living room). The room then has a `note` with what it looks like. The UI shows the room name **without m²**, both on the hotspot and in the list, until the client confirms it (§12). Never show the reading in the note.
  - `hall` may be `null` when the plan labels its circulation space as a room, for example BL01's "Corridor 6.84 m²", which is a normal room with `name: "corridor"`.
  - New room name key `corridor`: EN "Corridor", AM draft "ኮሪደር".
  - Areas print as the plan writes them: `5` shows as "5 m²" and `1.9` as "1.9 m²", never padded to two decimals.
  - Some plans have an unlabelled space (BL03, BL06, BL09). It is in the `footprint`, with its walls, doors and railings, but has no `rooms[]` entry, so no hotspot and no list row.
  - All nine units are delivered: `bl01`–`bl09` `.json`, `-floor.webp` and `-check.jpg`.
  - **Rev 9.2 (walk-in rings):**
    - `openings[].type` gains **`open`**: an archway where a room meets the hall, the corridor or another space with no door. It has `a`, `b`, `t`, `sill: 0`, `head: 2.8` and `basis: "plan"` (the plans draw these junctions as plain gaps). Impl treats it like a door for rings and the glide, and draws **no frame and no header**. All nine units have them: one per living room, and two each for BL07, BL08 and BL09. They are cyan in the check images.
    - New top-level **`walkable[]`**: `{id, poly, note}` for unlabelled spaces a visitor can stand in: BL09's lobby and its wet room off the kitchen, and BL03's terrace. They get a standpoint (the polygon's centroid) and can be ring destinations, but **no hotspot, no list row and no announced name** beyond "Hall". It is an empty array for the other units.
    - When testing where an opening leads (§9.8 B4), check `rooms[]`, then `hall`, then `walkable[]`.
  - **Rev 9.4 (after walking BL05 and BL09 in the browser):**
    - Every room and walkable space now has **`stand: [x, z]`** and `standClearance` (metres). It is the point with the most clear floor around it, away from walls and from every solid. The walk-in camera uses it, never `label`: at the label point the BL05 living-room camera stood against the sofa and bedroom cameras stood inside the beds.
    - **A space with `standClearance` under 0.3 m is not a walk destination**: no ring leads there and it can't be entered. Today that is only BL09's 0.8 m² balcony, a ledge about 0.3 m deep. It keeps its hotspot and list row in the dollhouse.
    - `walkable[].name` is a string key for its ring label: `lobby` → "the lobby", `offKitchen` → "the room off the kitchen", `terrace` → "the terrace" (AM drafts: "መተላለፊያው", "ከማእድ ቤቱ ጎን ያለው ክፍል", "ሰገነቱ"). These describe unlabelled spaces by position; they are not plan names and appear only on rings.
    - **Ring labels must be unique within a view.** When a unit has several rooms with the same name, the ring's accessible name adds its position in plan order: "Go to the bedroom, 1 of 2" (`walk.goToN`: "Go to the {room}, {n} of {total}"; AM draft: "ወደ {room} ይሂዱ፣ {n} ከ{total}").
  - The shared tracer is `docs/design/units/trace_lib.py`, with one `trace-bl0X.py` per unit that writes `{id}.json`, `{id}-check.jpg` and `{id}-floor.webp` (cleaned like BL05 v1.5).


**Heights aren't on the plans.** The values used are a 2.8 m storey wall, 2.1 m door head, a 1.05/2.2 m kitchen window, 2.4 m glazed doors, 2.2 m wardrobes, 0.9 m counters and 1.1 m railings. These are standard and illustrative. The UI never states a height.

**Windows:** the plans dimension only the kitchen window (150 cm, onto the light well). Façade walls are drawn without window marks, so **we don't invent window positions**: façade walls render solid, and the cutaway keeps their camera side low anyway. Real window positions per room are in §12. This is the one place the model deliberately shows less than the reference video.

`src/data/units.ts` gains `has3d: boolean`, true only for codes with a JSON (BL05 today). Everything else in UNIT state stays as it is.

#### 9.6.2 Flow and states

- `UNIT(n, code)` gains a **view**: `plan | 3d`, kept in the hash as `#explore/f7/bl05/3d`.
- **Default view:** `3d` when `has3d`, tier 2 is running and motion is allowed. In every other case the default is `plan`, which is the current 2D view, unchanged:
  - `has3d` is false;
  - the unit is a TBC position (§9.2 rev 5), which never gets a 3D view;
  - tier 0/1 (no WebGL, Save-Data, slow connection, `deviceMemory < 4`);
  - reduced motion.
- **Toggle:** a 2-segment control at the top of the unit panel, **"3D | Plan"** (`role="radiogroup"`, 44 px, the pill style of the filter chips). It shows only when `has3d` and WebGL2 is available.
  - With Save-Data or a slow connection, choosing **3D** is the opt-in that loads it.
  - With reduced motion, 3D still works on request, as a **static angle**: no lift animation, no auto-orbit, cross-fades only (§8).
- **Back / Esc**: from UNIT 3D, go to FLOOR (the walls drop flat, then the stage cross-fades to the tower). The breadcrumb reads `Tower › Floor 7 › BL05`, unchanged.
- **Prev/next unit:** if the next unit has 3D, the walls drop (0.3 s) and the new unit rises (0.9 s). If not, the view falls back to `plan` for that unit, without changing the user's preference in the hash.
- **Layout in UNIT 3D (desktop ≥ 1024):** the stage widens from cols 1–5 to **cols 1–7**, and the panel narrows to cols 8–12, with a 0.6 s GSAP Flip and `power3.inOut`. The reference gives the cutaway most of the frame, with a slim side panel. Tablet and mobile keep the stacked layout: stage on top (52svh on mobile, 60svh on tablet), then the panel.

#### 9.6.3 The scene (`src/scripts/explorer/unit3d.ts`)

**One WebGL context.** The dollhouse reuses tier 2's renderer and canvas and swaps scenes. Never create a second context, because phones lose them. It is dynamically imported on the **first UNIT entry with `has3d`**, together with the unit JSON and the texture. It is prefetched on idle once FLOOR state is reached and the hovered or focused hotspot belongs to a `has3d` unit.

- **Floor:** a `ShapeGeometry` of `footprint` with UVs from `texture.plane`, and `MeshLambertMaterial({ map })`. The map uses `SRGBColorSpace` and `anisotropy = min(4, max)`.
- **Plinth:** `footprint` extruded 0.35 m **down** in ivory `#FBF7F2`. This is the white base of the reference model, and it reads as a maquette.
- **Walls:** each wall becomes a box (length |b − a|, height h, depth t) centred on its midpoint and rotated to the segment, in `MeshLambertMaterial` sand-100 `#F3ECE2`.
  - Interior walls are merged into **one** geometry with `mergeGeometries`.
  - Façade, corridor and light-well walls stay separate meshes (about 9), so they can be lowered.
  - Wall tops get no special cap; the light makes them read as the white cut edge.
- **Openings:**
  - A header box from `head` to 2.8 m over every opening.
  - Windows also get a sill box (0 → `sill`).
  - Glazing (windows and glazed doors) is a plane at the wall centre: `MeshBasicMaterial` `#CFE0EA` at opacity 0.28, `depthWrite: false`, with a 3 cm navy-800 frame line.
  - Doors are open gaps; no leaves are modelled, because the floor texture already shows the swing.
- **Solids:**
  - Columns and the shaft: wall material at full height.
  - Wardrobes: warm oak `#B08A63`.
  - Counters: sand-200 `#E4DACB` with a 2 cm darker top.

  The floor texture's furniture shows through around them.
- **Railings:** glass at 1.1 m (same material as glazing) with a 4 cm navy-800 top rail.
- **Cutaway:**
  - No ceiling.
  - On every camera change, each perimeter wall whose outward normal faces the camera (`dot(n, toCamera.xz) > 0.25`) tweens to **1.0 m** (`cutawayH`); walls turning away grow back to 2.8 m. Each tween is 0.35 s, `power2.out`, using `scale.y` with the pivot at the base.
  - Interior walls stay at 2.8 m. A fixed 50–62° camera elevation keeps rooms readable over them, as in the reference.
- **Light (warm, soft, brand):**
  - `HemisphereLight`: sky `#FFF4E6`, ground `#1A273F`, intensity 0.9.
  - **One** `DirectionalLight` `#FFE3BD` at 1.1 from the upper left, (−6, 14, −4) relative to the model centre. It casts shadows with `PCFSoftShadowMap`, a 1024² map, and `radius` 4.
  - The light is fixed to the model, not the camera, so the shadow map is **baked once**: `shadowMap.autoUpdate = false`, with `needsUpdate` only after build and lift.
  - Walls and solids cast; floor and plinth receive. The soft contact shadows are what make it read as the reference's warm interior.
- **Ground:** the stage keeps the explorer's navy-900. Under the plinth sits a 512 px radial canvas texture (navy-950 at 0.6 → 0) as a soft drop shadow. There is no visible ground edge.
- **Camera:**
  - `PerspectiveCamera` fov 30. Elevation 56° by default; dragging can move it between 50° and 62°.
  - Azimuth starts at −35°, the reference's 3/4 view.
  - Framing: fit the footprint's bounding circle (BL05 radius ≈ 8.3 m) so it fills **88% of the stage's shorter side**. The fit is the same at every azimuth, so the model never pops while orbiting.
  - Look-at is the footprint centroid at y = 0.6 m.
  - **No zoom, and the wheel always scrolls the page** (as §9.4). `touch-action: pan-y` on the canvas.
- **Orbit:**
  - Drag rotates (azimuth is free through 360°, elevation is clamped as above), with damped inertia.
  - **Auto-orbit:** 360° in 72 s (5°/s). It starts 0.6 s after the lift completes, stops on `pointerdown`, and resumes 5 s after the last interaction. It pauses offscreen, with the tab hidden, while a room sheet is open, and with reduced motion (never runs).
  - Render on demand: the loop runs only while orbiting, dragging or tweening.
- **The lift (entering UNIT 3D):**
  1. The tower stage cross-fades out (0.4 s). The dollhouse scene appears **flat and top-down**: camera elevation 89°, azimuth −90°, so it matches the key plan's orientation. Walls are at `scale.y` 0.01 and solids at 0.01.
  2. Over 1.4 s, `power3.inOut`, the camera swings to 56° / −35°.
  3. At the same time, walls rise to full height, staggered 0.012 s per wall, ordered by distance from the centroid outward, over 0.7 s each, `power3.out`. Solids rise after a 0.3 s delay.
  4. Then the hotspots fade in (0.3 s, stagger 0.03) and the shadow map bakes.

  Reduced motion: build at full height, show it at the static angle, and cross-fade in over 0.2 s.
- **Budget:** under 6k triangles and under 20 draw calls for BL05. `setPixelRatio(min(dpr, 1.75))`, as §9.4.
- **Fail-safe:** if the import, JSON, texture or WebGL fails, fall back to the `plan` view silently and hide the toggle for the session.

#### 9.6.4 Room hotspots and the side panel

- **Hotspots** are HTML `<button>`s in an overlay, positioned at each room's `label` point (y = 0.05 m) projected to the screen and updated per rendered frame with `transform` only.
  - **At rest:** a 14 px gold-500 dot with a 2 px ivory ring and a 44 × 44 transparent hit area.
  - **On hover or focus:** a pill grows from the dot (0.25 s), ivory with navy-900 text, Manrope 600 at 13 px, for example "Master bedroom · 15.82 m²". `m²` and the numerals are tabular.
  - **Occlusion:** each frame, raycast from the camera to the anchor against the walls and solids. When the anchor is hidden, fade the button to opacity 0 and set it `inert`. The panel's room list keeps every room reachable.
  - Balconies get hotspots too. The hall gets none.
- **Panel (UNIT 3D)**, top to bottom:
  1. The "3D | Plan" toggle.
  2. Eyebrow "Floor 7 · BL05".
  3. H3 "3 bedroom".
  4. "169.23 m² gross · 119.05 m² net" (tabular).
  5. **Rooms list**: a `<ul>` of buttons, "Master bedroom 15.82 m²", in the plan's room order. Hovering or focusing a row highlights the matching floor polygon (a gold-500 overlay at 0.22, y = 0.02) and opens its hotspot pill. It is the screen-reader path into the model.
  6. Actions: **Request pricing for Floor 7 · BL05** (primary, deep-links the form, as §9.2) and **Book a visit**.
  7. A hint line in muted text: "Drag to turn · Tap a room". It hides after the first interaction.

  The canvas stays `aria-hidden`.
- **Selecting a room**, by hotspot or list:
  - The floor polygon highlights.
  - The camera look-at eases 35% of the way toward the room centroid (0.8 s, `power2.inOut`), and auto-orbit pauses.
  - The **room card** opens (§9.6.5).
  - Selecting the same room again, or pressing Esc, deselects.

#### 9.6.5 Room card and the AI interior slot

**Rule (BRIEF):**
- An AI interior image is shown **only when it is marked approved**: checked against the plan for room shape, windows and balcony.
- It is **always** labelled **"Artist's impression; finishes may vary."**
- The only finish we may name is ceramic tile.

The generator isn't chosen yet, so the slot is designed now and filled later.

- **Data:** `rooms[].image?: { src: string; alt: string; approved: boolean }` in `src/data/units3d/{id}.ts` (TS, not the JSON), so images can land without touching the geometry. Only `approved: true` images render.
- **Placeholder, used until then:** the **room's own crop of the furnished plan**, cut from the floor texture with the room polygon's bounding box plus 0.3 m. It is honest and already exists. Its label is **"From the floor plan"**, not the AI label.
- **Card, desktop:** inside the panel, under the specs, as a 3:2 frame with `--radius-s` and `--shadow-1`, revealed by `clip-path: inset(100% 0 0 0)` → `inset(0)` over 0.5 s, `power3.out`.
  - The title row is "Master bedroom · 15.82 m²", plus a close button (44 px, "Close room").
  - On the image, bottom-left, sits a **label chip**: ivory at 0.92, navy-900 at 12 px Manrope 600, `--radius-pill`, 6 × 10 padding. It reads "Artist's impression; finishes may vary." for AI images or "From the floor plan" for the placeholder.
  - The chip is part of the image frame, never a tooltip, and never hidden on hover.
- **Card, mobile (< 768):** a bottom sheet, 88svh max, `role="dialog"`, `aria-modal="true"`, labelled by the title. Esc, the close button or a swipe down close it. Focus moves to the close button and returns to the hotspot. It reuses the §5.5 viewer dialog styles and hides the sticky CTA, as §5.10.
- **Alt text:**
  - AI image: "Artist's impression of the master bedroom in BL05". The `alt` is authored per image.
  - Placeholder: "Floor plan detail of the master bedroom in BL05".
- **AI image spec, for whoever generates them:**
  - 1600 × 1067 (3:2), AVIF ≤ 140 KB with a WebP fallback, loaded lazily on room open.
  - Eye height 1.5 m, looking toward the room's window or balcony wall.
  - Warm daylight; ceramic tile floors.
  - No people, no logos, and no views claiming a specific outlook.
  - Each image is checked against `bl05-check.jpg` for wall count, door and balcony positions before `approved: true` is set.

#### 9.6.6 Motion summary (adds to §7.3)

| ID | Element | Animation | Duration / ease |
|---|---|---|---|
| U1 | Enter UNIT 3D | stage cross-fade, flat plan → camera swing 89°/−90° → 56°/−35°; walls rise staggered from the centre out; solids follow; hotspots fade | 1.4 / power3.inOut; walls 0.7 / power3.out, stagger 0.012; solids +0.3 |
| U2 | Leave UNIT 3D | walls drop to 0.01, then stage cross-fades to the tower | 0.45 / power2.in; fade 0.3 |
| U3 | Cutaway | perimeter walls facing the camera go 2.8 → 1.0 m and back | 0.35 / power2.out |
| U4 | Auto-orbit | 5°/s, resumes 5 s after interaction | linear |
| U5 | Room select | floor highlight 0 → 0.22; look-at 35% toward the room | 0.3; 0.8 / power2.inOut |
| U6 | Room card | `clip-path` reveal (desktop) or sheet y 100% → 0 (mobile) | 0.5 / power3.out |
| U7 | Desktop layout | stage cols 1–5 → 1–7 (Flip) | 0.6 / power3.inOut |


#### 9.6.7 Rev 8.1: implementation review of 4e7da27 and visual fixes

Design eyeballed the dollhouse on :4321 (Explore → floor 7 → BL05 → 3D). This was headless Chrome with `navigator.connection` overridden to 4g, at 1366 × 900 and 390 × 844, at three orbit angles.

**Impl's six deviations:**

1. **Confirmed:** one merged wall mesh, with rise and cutaway done in the shader, and the cutaway clamping vertices to 1.0 m. The look matches the spec, with fewer draw calls.
2. **Confirmed:** shadows update live during the lift, then bake.
3. **Confirmed, and it corrects the spec:** intensities 3.2 / 2.2 are right for r187's physical light units. `shadow.radius` only applies to `PCFShadowMap` (and VSM), not `PCFSoftShadowMap`, so impl's `PCFShadowMap` with radius 4 is right. §9.6.3 is to be read that way.
4. **Confirmed:** orientation matches the key plan (it replaces the "azimuth −90° = sheet orientation" wording in U1).
5. **Confirmed:** 3D strings come from a lazy static JSON, to protect /am's HTML budget.
6. **Replaced** by floating hotspots, below. Four of ten is too few for "close to the video".

**What fell short of the reference, and the fixes:**

| # | Seen | Fix |
|---|---|---|
| A | The camera-facing sides of the full-height back walls render as large flat taupe planes (about `#8C867F`), because they face away from the fixed sun. They hide about half of each bedroom and read as lids, not walls. The reference's wall faces are bright cream. | Add a **camera fill light**: a `DirectionalLight` `#FFF6EA`, no shadows, parented to the camera and offset 25° left and 20° up from the view direction. Tune its intensity (start at 1.6) until camera-facing wall faces read between sand-100 `#F3ECE2` and `#D9CFC0` on a screenshot, never darker. The sun stays fixed, so the shadows still bake once. |
| B | Interior walls at 2.8 m hide too much floor at 56°. | **The model is cut at 2.4 m** (`defaults.modelCutH`), like an architectural section model, which is what the reference looks like. This applies to every full-height element: walls, columns, shaft, and opening headers (door headers run 2.1–2.4 m, glazing heads clamp to 2.4 m). The default elevation is **60°**, and dragging can move it between **52° and 68°**. The perimeter cutaway stays at 1.0 m. |
| C | The model fills only about 65% of the stage's shorter side. The bounding circle is loose, because BL05's corners sit well inside it. | Fit the circle to **100%** of the shorter side, not 88%. The model then fills about 80% and still never pops while orbiting. |
| D | The floor is flat furniture artwork, while the reference has furniture with volume, which is most of what makes it read as real. | **Furniture blocks (new data, BL05 delivered):** `solids[]` with `kind: "furniture"`, `h` and `side`. There are 17 blocks: 3 beds at 0.5 m, 6 nightstands at 0.55 m, the dining table at 0.75 m, 3 chair groups at 0.45 m, 2 sofas at 0.8 m, the TV unit at 0.5 m and a side table at 0.55 m. They are traced over the plan's own furniture (pink in `bl05-check.jpg`). Details below the table. |
| E | Desktop panel: the 10-row room list pushes **Request pricing / Book a visit** below the panel's bottom edge at 1366 × 900. The list was also clipped mid-row. | The new panel order is: toggle → eyebrow → type → areas → **actions** → rooms. The actions must be visible without scrolling at 1366 × 768 and larger. The rooms list is **2 columns** of 40 px rows (name left, m² right, tabular) only at **≥ 1200 px** (rev 8.3: at 1024 a column is too narrow, and "Living and dining room 26.41 m²" wrapped to 3 lines). Below 1200 it is 1 column. The panel never clips its content; if it is taller than the stage, it grows. |
| F | Only about 4 of 10 hotspots are visible at the default angle. Anchors at y = 0.05 m are hidden by walls. | **Floating hotspots:** anchor each dot at **y = 2.75 m** (0.35 m above the cut), over the room's `label` point. A 1 px gold-500 leader line at 0.7 opacity runs down to the floor point (y = 0.05). Both ends are projected every rendered frame, and the line is a 1 px-wide absolutely positioned `div` rotated with `transform`, so there is no canvas work. **No occlusion raycast.** All ten hotspots stay visible and focusable. If two dots come within 28 px of each other on screen, only the one nearer the camera shows, and the other goes `inert` until they separate. The panel's room list stays the full accessible path. |

**Furniture block details (fix D):**
- Each block's **top face uses the floor material** with the same planar UVs, so the plan's furniture artwork becomes the lid of its own block.
- The sides use `side` with `MeshLambertMaterial`.
- Furniture casts and receives shadows.
- In the lift (U1), furniture rises after the walls (delay +0.45 s, 0.5 s, `power3.out`).
- Budget: about 220 extra triangles, merged into one geometry with two material groups: lids and sides.
- Furniture is **illustrative**. It follows the plan's furniture drawing, which is itself a staging suggestion. The "Renders and plans are illustrative" line already under the panel covers it.

Everything else in the scene matches the spec: the lift, cutaway, orbit, ground shadow, plinth, glass railings, warm palette and texture, as well as the mobile layout.

#### 9.6.8 Rev 8.2: re-check of rev 8.1 (b9a1e26 … eecb8cb)

Re-checked on :4321 at 1366 × 900 (three orbit angles) and 390 × 844. All six rev 8.1 fixes are in: all 10 hotspots show with leader lines, the actions sit above the 2-column room list, the furniture has volume, and the model fills the stage well. It now reads close to the reference. Three things remain:

| # | Seen | Fix |
|---|---|---|
| G | Camera-facing wall faces measure about `rgb(178,168,162)` on screen, still below the A target (≥ `#D9CFC0` = 217,207,192). They read as warm grey, not cream. | Raise the camera fill light about 1.5× (start 2.4) and re-measure. If wall tops blow out above 245 before the faces reach the target, raise the hemisphere sky intensity instead. |
| H | Wardrobes render orange, about `rgb(217,170,118)`. Under the warm light, `#B08A63` reads as orange, not oak. | Change the wardrobe colour to greige oak **`#B5A08A`**. |
| I | The floor still shows the plan's dimension lines and labels. | **Texture v1.5 delivered:** `docs/design/units/bl05-floor.webp`, same crop and size (1024 × 1116, 97 KB), so no JSON change. Long dimension lines and labels on open floor (hall, living room, bedrooms, store) are painted out by `docs/design/units/clean-bl05-texture.py`. Labels over furniture, the rug, the kitchen, the shower rooms and the balconies stay: the script smears them. Rebuild the AVIF from it. A full clean-up (v2) is section C of `docs/AI-RENDERS.md`, using the AI trial's inpaint mode with pixel alignment kept. |

### 9.7 Photoreal tower stage (rev 9, items A1–A4)

> **Rev 10.4 (round 8 review decisions, by the coordinator):**
> 1. The tower photo's `src` is set by JS from an IntersectionObserver (about 800 px before the explorer), with a `<noscript>` `<img>` for no-JS. This replaces plain `loading="lazy"`.
> 2. The stage mask radii are **50% 45%** (replacing 60% 55%).
> 3. The vertical-drag scrub on the tower (A1, touch) is **dropped**: page scroll always wins over the tower. The stepper and the floor list are the touch controls.

> **Rev 10:** on devices that run WebGL at tier 2, the real 3D tower (§9.9) replaces this stage once it has loaded. This photo stage stays as the first paint, and as the view on tiers 0 and 1.

User feedback, round 8: "the main building model is the same as before, not like the video". The explorer's first view becomes **our real tower render with selectable floors**, in place of the Three.js massing. It is an image, an SVG overlay and CSS transforms, so it works **without WebGL** on every tier.

**Finding to know first.** The render (`brand-source/tower-render.jpg`) draws **13 typical storeys with balconies above a tall ground storey**: not 14, and not 16. The explorer keeps floors 1–14 (the plans we have). So the 14 bands **divide the façade's height evenly** and can sit up to about half a storey off the drawn balconies. They are a selection highlight, not a storey-accurate trace. The band style is soft for that reason (below), and the existing line "Renders and plans are illustrative and may change." stays under the stage. A render with countable floors is in the AI list (`docs/AI-RENDERS.md` §E) and the client questions (§12). It would replace only the image and the JSON.

**Assets (delivered):**

| File | What |
|---|---|
| `docs/design/tower-floors.json` | 2.6 KB. `cropPx` (150, 110, 1500, 1960) is the stage image crop. `floors[]` has `{floor: 14…1, poly}`, six points each across the left face, the corner and the right face, in full-image px. `ground.poly` is the ground storey. `edges` are the three building edges the bands are interpolated between. `drawn` is the 13 storeys as drawn, for reference only. |
| `docs/design/tower-floors-check.jpg` | The 14 bands over the render, for review. |
| `docs/design/trace-tower-floors.py` | Regenerates both. If the image changes, edit the three edges and rerun. |

**A1. Stage image and overlay.**
- **Image:** the crop above (1350 × 1850, about 3:4), via `astro:assets`: AVIF and WebP at widths 600, 900, 1200 and 1350 (the crop's natural width; `cropPx` is [x0, y0, x1, y1]), `loading="lazy"`, `decoding="async"`, `sizes` matching the stage. It is never the LCP, because the explorer is below the fold.
  - Alt: "Rendering of Garment Tower from the street corner."
  - The image sits in the existing stage box with `object-fit: cover` and `object-position: 50% 40%`.
- **Edges:** the render's collage sky clashes with the navy section, so the image gets a mask: `mask-image: radial-gradient(60% 55% at 50% 45%, #000 62%, transparent 100%)` (rev 9.1: the first value, 120% 100%, left the side edges opaque). The tower stands in the navy stage with no hard photo rectangle.
- **Overlay:** an inline `<svg viewBox="0 0 1350 1850">` positioned exactly over the image (same `preserveAspectRatio` as the cover fit: `xMidYMid slice`, with the same 50% 40% focal offset). It holds one `<polygon data-floor="n">` per floor, from the JSON minus the crop offset. It is server-rendered, so hover works before any JS.
- **Band style:**
  - At rest: invisible (`fill-opacity: 0`).
  - Hover, focus or preview: fill gold-500 at 0.38 with normal blending (rev 9.1: `screen` turned gold white over the near-white façade), a 1.5 px gold-300 stroke, and a 6 px feather (`filter: blur(3px)` on a duplicate fill under the stroke; static, not animated).
  - Selected: fill at 0.5.
  - Transitions: opacity only, 0.2 s.
- **Label chip:** an HTML chip pinned to the band's right end: "Floor 7 · 1 × 2-bed · 8 × 3-bed", using the rev 5 `floorMix()` strings, not "9 homes". Ivory with navy-900 text, 13 px Manrope 600. On phones it sits centred under the band.
- **Ground storey:** hovering it shows the muted chip "Ground floor: commercial". It is not selectable.
- **"16th floor planned"** stays as the note above the floor list (rev 5). Nothing is drawn above the roof.
- **Controls:** the polygons are `aria-hidden` and have no tab stop. The accessible control is still the **floor list** (`<ol>` of 14 buttons) and the stepper. Hovering or focusing a list row lights its band, and vice versa.
- **Touch:** the first tap on a band previews it (chip plus the existing "View floor 7" button). A second tap, or the button, selects it. Bands are thin on phones (about 22 px), so the stepper and list stay the primary touch controls. A vertical drag on the tower scrubs the preview floor (`touch-action: pan-x`; only while the drag started on the tower).
- **Hint chip:** "Hover a floor" (pointer) or "Tap a floor" (touch). It fades after the first interaction.

**A2. Push-in and slab lift (choosing a floor).** No scroll, GSAP, transform and opacity only:
1. **Push-in** (1.1 s, `power3.inOut`): the image and overlay wrapper scales to **2.4** with `transform-origin` at the band's centroid, and translates so the band's centre lands at 50% / 46% of the stage. Two navy-950 veils (the regions above and below the band, as polygons in the same SVG) fade to 0.5, so the rest of the tower recedes. No blur: we animate only transform and opacity.
2. **Slab lift** (0.5 s, `power3.out`, overlapping the last 0.2 s of step 1): a copy of the image clipped to the band's polygon (`clip-path: polygon()`, static) lifts −28 px and scales 1.04, with `drop-shadow(0 18px 24px rgb(11 18 32 / .5))` already set before the motion starts.
3. **Cross-fade** (0.45 s) to the **floor slab** (A3). The panel moves to FLOOR(n) as today.
- **Back to tower:** the reverse, in 0.8 s.
- **Changing floors in FLOOR state** (stepper): no pull-back. The slab cross-fades (0.3 s) and the hidden tower image re-centres on the new band, ready for the way back.
- **Reduced motion:** no push-in and no lift. The band is highlighted and the stage cross-fades over 0.2 s.

**A3. The floor slab (FLOOR state stage).**
- **With WebGL (tier 2):** one extruded slab: `floorOutline` at 0.35 m thick, ivory sides, with `keyplan-duotone` as the top texture. Camera: fov 28, elevation 52°, azimuth −35°, fitted to 86% of the stage. It rises 0.4 m with a soft ground shadow as it fades in.
  - The nine unit hotspots are HTML buttons projected onto it (unit centroids from `keyplan-hotspots.json`), styled like the key-plan hotspots. TBC units keep the rev 5 dashed style.
  - Clicking a unit goes to the dollhouse lift (§9.6.3 U1), which now starts from this slab: the camera pushes toward the unit's centroid for 0.5 s before the cross-fade.
  - Drag turns it ±40°. There is no auto-turn.
- **Without WebGL (tiers 0 and 1):** the stage keeps the pushed-in tower image with the band lit. With no JS, it is the plain image with CSS hover bands.
- The key-plan SVG, chips and stepper in the panel are unchanged in both cases.

**A4. What goes.** The Three.js tower massing scene (`scene.ts`: slabs, glazing bands, camera fit) is **removed**, along with its "Load 3D model" button for the tower. The **SVG maquette is the fallback when the render image fails to load**. Rev 9.1: it moves out of the HTML into a lazily fetched fragment, requested only on the image's `onerror`, to keep the 40 KB HTML budget. With no JS and a failed image, the floor list alone remains, which is still fully usable. Tier 2 now loads `three` only when a floor is chosen (the slab) or a unit opens (the dollhouse), so the explorer's first view costs no WebGL at all. §9.4's tier table applies from FLOOR state onward.

**Later, optional (A5):** an AI image-to-video push-in clip (`docs/AI-RENDERS.md` §E) can replace step 1. It would be a muted, 2–3 s, ≤ 900 KB clip per floor group, played once and then cross-faded to the slab. Only if a clip passes the check there. The transform push-in is the permanent fallback.

**Budget:** render AVIF ≤ 220 KB at 1200 w (≤ 320 KB at 1600 w), lazy; overlay SVG ≤ 3 KB inline; tower-stage JS ≤ 3 KB (replaces about 9 KB of massing scene code).

### 9.8 Walk-in mode: "Step inside" (rev 9, items B1–B6)

> **Rev 10.4:**
> - (Review decision.) An explicit deep link `…/3d/in/{room}` opens the walk even on Save-Data or a slow connection: the visitor, or whoever sent the link, asked for it. The buttons that lead there still don't render on those connections.
> - (Review finding H2: at 5 of BL05's 13 standpoints no ring was in view.) Two rules:
>   1. **Arrival view:** on arriving at a standpoint, the camera faces the nearest ring that is not the one just come through, and pitches down (to at most −20°) until that ring's centre is at least 60 px inside the stage's bottom edge. If the only exit is the way back, face that.
>   2. **Edge chips:** any ring whose centre is outside the stage, behind the camera or under it, is shown as a chip pinned to the nearest stage edge: an arrow and the same label ("← Go to the hall"), 44 px high, the same button as the ring. So every exit is always on screen and one tap away, whatever the view. Chips stack along the edge with 8 px gaps and never cover the toolbar or the minimap. On phones (a stage under 640 px wide) a chip shows the arrow and the room name only ("← Hall"); the full "Go to the …" stays as its accessible name, so a hall with five exits isn't crowded (rev 10.5).

User feedback: "i want to enter in the home and look". From the dollhouse, the visitor steps into a room at eye height, looks around, and moves from room to room through the plan's own doors.

**Movement model: fixed standpoints**, like a street-view tour. One standpoint per room and one in the hall; no free walking and no collision code. It is robust on phones, and it is the model a panorama needs (B5).

**B1. Entering.**
- When a room is selected in the dollhouse (§9.6.4), the room card gains a primary button **"Step inside"** (44 px high). The panel also gets one **"Enter the home"** button under the actions; it starts in the living room.
- **Fly-in** (U8, 1.6 s, `power2.inOut`):
  - The camera leaves the orbit and descends to the room's standpoint at **y = 1.5 m**. The standpoint is `rooms[].stand` if present, else `rooms[].label`.
  - The fov goes 30° → **72°**.
  - During the last 0.6 s, the walls rise from the 2.4 m cut to the full **2.8 m** (the shader's `uCut` values) and the **ceiling** fades in. The camera-side cutaway is switched off.
  - Hotspots and leader lines fade out.
  - The initial yaw faces the room's largest opening onto a balcony if it has one, else the centroid of the room polygon's longest wall.
- **Hash:** `#explore/f7/bl05/3d/in/living`. Back/Esc returns to the dollhouse (U9, 1.0 s, the reverse). The breadcrumb gains a last segment: `… › BL05 › Inside`.
- **Layout:** on desktop the stage widens to cols 1–8 in walk mode, and the panel narrows to cols 9–12 (Flip, 0.5 s). On phones the stage grows to 70svh.
- **When it is offered:** only when `has3d`, WebGL2 is running, and motion is allowed **or** the user asked for it. With reduced motion, entering is a 0.2 s cross-fade to the standpoint, and moving between rooms is a cross-fade too.

**B2. Looking.**
- **Drag or swipe** turns the view: yaw is free through 360°, pitch is clamped to **±25°**. Sensitivity is 0.25° per px, with damped inertia (0.9 per frame). `touch-action: pan-y` stays, so a vertical swipe still scrolls the page unless the drag began horizontally (lock the axis after 8 px).
- **No zoom**, and the wheel scrolls the page.
- **Keyboard and screen readers:** two 44 px buttons at the bottom corners of the stage, "Look left" and "Look right" (30° per press, 0.3 s). Arrow keys do the same while the stage has focus.
- **Gyro (phones, optional):** a toggle "Use motion" in the walk toolbar, off by default. On press it requests `DeviceOrientationEvent.requestPermission()` where needed. If refused or unsupported, the toggle hides. Never automatic, and off with reduced motion.

**B3. The inside look (geometry, until panoramas exist).** Eye level is where the plan-art floor and block furniture look weakest, so the scene is dressed for it:
- **Ceiling:** `ShapeGeometry(footprint)` at y = 2.8 m, ivory `#FBF7F2`, `MeshLambertMaterial` with `emissive: #A39B90` (rev 9.2: lit only from below, it took the hemisphere's navy ground colour; the emissive makes it read as a shaded warm grey), visible only in walk mode.
- **Walls:** full height, sand-100 as now. A 10 cm skirting line in `#E4DACB` at the base (a second thin box per wall, merged) gives the walls scale.
- **Doors:** frames only: a 6 cm `#D9CFC0` frame around each door opening, no leaves.
- **Glazing:** as in the dollhouse, with a 5 cm navy-800 frame. Beyond the glass and off the balconies the scene shows **a plain soft sky**: a vertical gradient `#F3ECE2` at the horizon to `#CFE0EA` overhead, as the scene background in walk mode. **No skyline, no view and no neighbouring buildings**, because we have no facts about the outlook.
- **Light:**
  - The dollhouse lights stay.
  - Add one warm `PointLight` `#FFE9CC` at the current room's centroid, y = 2.4 m, with distance 9 m and decay 2, at intensity **6** (rev 9.2: 30 clipped every wall to white at room scale; 6 reads cream). It moves with the room change.
  - The camera fill drops to 40% in walk mode.
  - Shadows: the baked sun map stays; nothing new casts.
- **Fake ambient occlusion (cheap):** a 0.35 m dark gradient strip (navy-950 at 0.18 → 0) on the floor along every wall base, plus the same in the ceiling corners. These are planes with one shared 64 px gradient texture, merged. No post-processing.
- **Furniture:** the rev 8.1 blocks stay.
  - Beds gain a headboard block (0.9 m high, 8 cm deep, on the side nearest a wall) and a mattress step (the top 0.18 m inset 3 cm, in `#F1ECE4`).
  - Sofas gain a back block (0.75 m, 20 cm deep) on their wall side.
  - Counters gain a 4 cm overhanging top.

  These are derived from each block's rectangle and its nearest wall, so the JSON doesn't change.
- **Floor:** the plan texture stays. From 1.5 m, the remaining dimension text is most visible, so the cleaned v2 textures (AI-RENDERS §C) matter most here.
- **Honest label:** a small chip at the bottom-left of the stage in geometry mode: **"Simplified 3D model from the floor plan"**.

**B4. Moving between rooms.**
- **Door rings:** for every door or glazed-door opening of the current room, a ring sits on the floor 0.7 m inside the room from the opening's centre.
  - 0.9 m across, gold-500 at 0.9 with an ivory inner dot, drawn as an HTML element projected each frame so the hit area is always ≥ 44 px.
  - Label on hover or focus: "Go to the kitchen".
  - Rings behind the camera or further than 9 m are hidden and `inert`.
- **Where a door leads:** computed, not hand-written. Take the two points 0.5 m either side of the opening's centre along its normal, and find which room polygon (or the hall) contains each. An opening with a side in no room and not in the hall gets no ring. That covers the entrance and the unlabelled spaces.
- **Hall standpoints:** the hall has one standpoint per door, 0.9 m into the hall from that door. Moving along the hall goes door to door.
- **The glide** (U10, 1.2 s, `power2.inOut`): the camera moves in a straight line to the door's centre (y stays 1.5 m), then on to the next standpoint, while the yaw eases to the direction of travel. The point light follows. With reduced motion, a 0.2 s cross-fade.
- **Balconies:** a glazed-door ring leads onto the balcony standpoint, facing outward: the railing, then the plain sky.
- **Room list (panel):** in walk mode each row is "Go to …", and the current room is marked `aria-current`. A polite live region announces "Master bedroom, 15.82 m²" on arrival. A room with a null area announces the name only.

**B5. The panorama slot (the photoreal upgrade).** This is what gets it "like the video". Same rule as §9.6.5: shown only when `approved: true`, always with the chip **"Artist's impression; finishes may vary."**
- **Data:** `rooms[].pano?: { src, kind: 'equirect' | 'strip', yawOffset, arc?, alt, approved }` in `src/data/units3d/{id}.ts`.
- **Equirectangular (preferred):** 4096 × 2048, AVIF ≤ 450 KB with a WebP fallback, loaded on entering that room.
  - It is shown on an inside-out sphere (radius 20 m, 48 × 24 segments, `MeshBasicMaterial`) centred on the standpoint.
  - The geometry scene is hidden while it shows.
  - `yawOffset` aligns the image's centre with the plan direction it was generated for, so the **door rings still project to the right bearings**. They are drawn at the bearing and distance of each door from the standpoint, on the sphere's "floor".
- **Strip (fallback if the generator can't do 360°):** a 3:1 image, 4096 × 1365, mapped on a cylinder segment of `arc` degrees (default 180°). Rev 9.3: a 3:1 strip over `arc` degrees only covers ±atan(arc/6) vertically (±27.6° at 180°), so on a strip the camera's vertical fov narrows to `2·atan(arc/6) − 8°` (about 47° at 180°), yaw is clamped to `arc/2` minus half the **horizontal** fov, and pitch is capped at `min(12°, the room left)` (about ±4° at 180°). The wider view is worth more than the pitch range, so the fov is not narrowed further. Door rings show only for doors inside the arc; the room list covers the rest.
- **Transition:** geometry → panorama cross-fades over 0.5 s once the image has decoded. Moving to a room without a panorama cross-fades back to geometry. The chip swaps accordingly.
- **Sharing:** panoramas are shared by room type, as in AI-RENDERS (living, kitchen, master bedroom, bedroom, shower room, with parquet variants). A shared panorama is used in a unit only when that room's plan shape and openings match the shot's reference room. Otherwise the room stays on geometry.

**B6. Walk toolbar and minimap.**
- **Toolbar**, top-left of the stage: **"Back to 3D model"** (secondary pill, 44 px), then the gyro toggle on phones.
- **Minimap**, top-right:
  - The unit's floor texture at 132 px wide (96 px on phones), `--radius-xs`, with a 1 px ivory border at 0.6 opacity.
  - A gold "you are here" dot with a 60° view cone that turns with the yaw.
  - Tapping a room on the minimap jumps there (a 0.3 s cross-fade; no glide through walls).
  - It is `aria-hidden`; the room list is the accessible equivalent.
  - It hides below 360 px of stage width.
- The hint "Drag to look · Tap a ring to move" shows for 4 s on first entry.
- The mobile sticky CTA hides in walk mode. "Request pricing" stays in the panel.

**Motion (adds to §9.6.6):**

| ID | Element | Animation | Duration / ease |
|---|---|---|---|
| T1 | Tower push-in | wrapper scale 1 → 2.4 at the band centroid; veils 0 → 0.5 | 1.1 / power3.inOut |
| T2 | Slab lift | clipped band y 0 → −28, scale 1 → 1.04 | 0.5 / power3.out |
| T3 | Tower → floor slab | cross-fade; slab rises 0.4 m | 0.45 / power2.out |
| U8 | Step inside | camera to the standpoint at 1.5 m; fov 30 → 72; walls to 2.8 m; ceiling fades in | 1.6 / power2.inOut |
| U9 | Back to 3D model | the reverse | 1.0 / power2.inOut |
| U10 | Room to room | glide through the door; yaw to the travel direction | 1.2 / power2.inOut |
| U11 | Geometry ↔ panorama | cross-fade | 0.5 / power2.out |

**Budget:** walk-in code ≤ 7 KB gzip, in its own chunk, loaded on the first "Step inside". Panorama ≤ 450 KB each, one at a time, and the previous one is disposed. Nothing loads before the user enters. Render on demand, as the dollhouse.

**Fallbacks:** no WebGL, Save-Data or a slow connection → the buttons don't render, and the 2D plan and room cards stay. A context loss inside → return to the plan view with the toast "3D view stopped".

### 9.9 Real 3D tower (rev 10, items T1–T7)

User feedback, round 9: "I don't want a hover on just a 2D image… I want the actual real 3D experience… as close as the sample video… don't discard anything, keep improving." The dollhouse stays as it is ("great"). The explorer's first view becomes a **real Three.js tower in a small generic city scene**, on devices that run WebGL. The rev 9 photo stage (§9.7) is kept as the fallback for tiers 0 and 1, and for reduced data.

**Data (delivered): `docs/design/tower3d.json`** (11.9 KB), built by `docs/design/build-tower3d.py`. `docs/design/tower3d-check.jpg` shows the nine traced units placed on the key plan.

| Key | What |
|---|---|
| `outline`, `centre` | The typical floor plate from the key plan, in metres (31.8 × 49.8 m). Subtract `centre` to centre the tower on the origin. |
| `heights` | Ground **6.3 m** (rev 10.1: matched to the client's render, where the ground storey is about 2.1 typical storeys tall), typical 3.0 m, slab 0.3 m, parapet 1.2 m, plant room 3.0 m. **Illustrative**: no section or elevation exists. |
| `levels[]` | Ground (commercial, not selectable), `f1`–`f14` (`status: "plan"`, selectable), and one `planned` storey on top (not selectable). |
| `units{}` | Per unit: `mirror`, `rot`, `t`, which place `units/bl0X.json` on the plate: world = R(rot, counter-clockwise, after an optional x-mirror) · local + t. Also `keyplanPoly`, `centroid` and `fitIoU`. The fit was found by `docs/design/fit-units-to-keyplan.py`: overlap is 0.89–0.99 for all nine. Eight units sit as drawn; BL04 is its sheet flipped top to bottom. |
| `balconies[]` | The 20 balcony polygons of a typical floor, already in tower coordinates. |
| `glazing[]` | The 28 windows and glazed doors the unit plans draw or imply, in tower coordinates, with `basis`. |
| `twoBedFloors`, `lit` | BL01's bay lights only on floors 4, 6, 8, 10 and 11. |
| `facadeStyle`, `context` | Colours and proportions read off the render and the film, and the generic surroundings. **Illustrative, not measured.** |

**Floor count (my reading; confirm with the client).** Ground + typical floors 1–14 = 15 storeys, drawn solid. The brief says the client is "adding a 16th floor", so **one** more storey sits on top in the lighter planned style. The render draws ground + 13, so the 3D tower is one storey taller than the picture even before the planned storey. If the client means something else (for example 16 typical floors), only `levels[]` changes.

**T1. Tower geometry** (`src/scripts/explorer/tower3d.ts`, replacing the removed massing scene).
- **Floors:** each typical floor is one group: a slab (the `outline`, 0.3 m), the façade wall (the outline extruded 3.0 m, `facadeStyle.wall`), balconies and glazing. The 14 groups share geometry through instancing or shared `BufferGeometry`; the group is what slides out in T4.
- **Balconies:** from `balconies[]`: a 0.2 m slab per polygon, a grey front 1.1 m high on its outer edges (the edges not touching the outline), and a dark top rail.
- **Glazing:** each `glazing[]` segment is a glass panel from `sill` to `head`, set 5 cm into the wall, with a dark frame. On outline edges with no traced opening, add the illustrative punched windows from `facadeStyle.windowBay` (one per 3.6 m bay, 1.8 m wide since rev 10.3, to match the film). Balcony edges may sit up to 0.5 m outside the outline (tracing tolerance); treat those as outer edges. Keep the two kinds in **separate meshes**, so the traced openings can be told apart and the illustrative ones can be removed if the client supplies window positions.
- **Fins:** white vertical fins at the bay spacing on the two street faces, running the full height of the typical floors.
- **Ground storey:** the outline inset 0.6 m, stone-grey cladding, dark shopfront glass on the street faces, and a white entrance canopy on the longest street face.
- **Roof:** parapet, and a plant-room box inset 6 m.
- **Planned storey:** the same floor group with all materials at 0.35 opacity, a dashed gold edge line, no lit windows and no pin. Hovering it shows the chip "16th floor planned".
- **Cores:** the lift and stair cores visible on the key plan are not modelled as rooms; inside a floor they are plain slab.
- **Budget:** under 60k triangles for the tower and context together; under 40 draw calls.

**T2. City context.** Generic, as `context` says: a round ground plane (radius 90 m) that fades into the navy section background, a road and pavement on two sides, 14 instanced palms and 18 instanced trees (low-poly cones and spheres on trunks, two meshes each), and ten plain neighbouring blocks 9–30 m tall at least 28 m away. **No real neighbouring buildings, signage, street names or cars.** Sky: a vertical gradient from `#F3ECE2` at the horizon to `#9DB7CC`, as the scene background, feathered into the stage's navy by the same radial mask as §9.7.

**T3. Light and camera.**
- One warm sun (`#FFE3BD`) from the south-west at 38° elevation, casting soft shadows (`PCFShadowMap`, 2048² on desktop, 1024² on phones, baked once because nothing moves at rest), plus a hemisphere light.
- Tone mapping: `ACESFilmicToneMapping`, exposure 1.0, sRGB output. The same settings apply in the dollhouse from rev 10 (§9.10 F5).
- **One azimuth convention for every explorer scene (rev 10.3):** azimuth is measured from the bottom of the key plan (+z, "south") toward its left (−x, "west"). The tower, the rev 9 floor slab, the assembled floor and the dollhouse all use it, so the view never jumps between stages; the slab is turned to match the tower. "South" and "west" are plan directions only, because true north isn't on the plans, and which faces front the street is an assumption (§12).
- Camera: fov 30, a 3/4 view of the street corner (azimuth −35°, elevation 14°), fitted so the tower fills 82% of the stage height. Drag orbits ±50° around the tower with inertia. No zoom, and the wheel scrolls the page. Idle sway ±5° over 24 s.

**T4. Interaction, as in the video.**
- **Floor pins:** five floating pins sit off the street corner at floors 2, 5, 8, 11 and 14: a gold dot with a short leader line to its floor, and an ivory card "Floor 8 · {mix}" (the rev 5 strings). They are HTML, projected each frame, ≥ 44 px. The floor list and stepper remain the complete, accessible control for all 14 floors.
- **Hover or focus a floor** (pin, list row, or the floor itself by raycast): that floor's glazing turns warm (`glass.litColour`, emissive, 0.25 s), its slab edge gets a gold line, and its pin card opens. BL01's bay follows `lit.rule`.
- **Choosing a floor:**
  1. **Push-in** (1.2 s, `power3.inOut`): the camera dollies toward the chosen floor's street corner until the floor is about 30% of the stage height.
  2. **Slide-out** (0.9 s, `power3.out`, starting 0.3 s before the push-in ends): the floors above rise 1.6 m and the floors below drop 1.6 m, and the chosen floor group slides 14 m out along the camera's ground direction.
  3. **Cutaway** (0.6 s): the chosen floor's façade wall and the slab above it fade out, and the **assembled floor** (T5) fades in, in the same place and orientation. The camera then rises to elevation 52° over 0.8 s.
- **Back to tower:** the reverse, in 1.2 s.
- **Changing floors from the stepper:** the tower stays parted; the slid-out floor cross-fades its lit state and label (the geometry is the same on every typical floor).

**T5. The assembled floor.** The nine units' real geometry on one plate:
- For each unit, build its walls, openings and solids from `units/bl0X.json`, as the dollhouse does, transformed by its placement. Use the **low tier** of the furniture library (§9.10 F1) here. Walls are cut at 2.4 m.
- The nine unit JSONs are fetched in parallel on the first floor selection (about 100 KB in total, about 30 KB gzipped). Floor textures are **not** loaded for this view: floors take a flat colour per room kind (living areas light warm grey, bedrooms oak tan or tile as the plan labels, wet rooms cool grey, balconies stone).
- The space between units (corridors, lifts, stairs) is plain slab in `#DAD4C8`.
- **Hover or focus a unit:** its floor area gets the gold tint and a chip "BL05 · 3 bedroom · 169.23 m²". TBC BL01 keeps the rev 5 treatment: hatched tint, "BL01 · To be confirmed".
- **Choosing a unit:** the other eight sink 0.4 m and fade to 0.25 over 0.5 s while the camera centres on the chosen unit. Then the existing dollhouse (§9.6) takes over with its full textures and furniture, by cross-fade (0.4 s). The dollhouse lift U1 is skipped when arriving this way, because the walls are already up.
- The panel's key-plan SVG, unit chips and stepper stay as they are: they are the accessible path.
- **Budget:** under 45k triangles for the assembled floor, with one merged mesh per unit per material.

**T6. Fallbacks and loading.**
- The 3D tower loads when `#explore` is within one viewport **and** tier 2 applies (WebGL2, no Save-Data, not a slow connection, `deviceMemory ≥ 4`). Until its first frame, and on every other device, the **rev 9 photo stage** shows; the 3D tower cross-fades over it (0.6 s).
- Tier 1 keeps the photo stage with a button "Load the 3D tower".
- Reduced motion: the 3D tower shows at a static angle with no sway; choosing a floor cross-fades straight to the assembled floor (no push-in, no slide-out).
- Context loss or any init error: keep the photo stage.
- Budget: tower code ≤ 14 KB gzip in its own chunk; nothing before the explorer is near; LCP untouched.

**T7. Strings.** "Load the 3D tower" / "3D ታወሩን ጫን"; "Drag to turn · Choose a floor" / "ለማዞር ይጎትቱ · ወለል ይምረጡ"; "The surroundings are illustrative." / "አካባቢው ለማሳያ ብቻ ነው።" (a muted line under the stage, beside the existing "Renders and plans are illustrative" line).

### 9.10 Real furniture, materials and light (rev 10, items F1–F8)

User feedback: "make the objects real and 3D, currently they are just something turned from the images of the plan". The plan-art lids on blocks are replaced by **modelled furniture**, real materials and better light, in the dollhouse, the assembled floor and walk-in mode. Furniture stays **illustrative**: it follows the plans' furniture drawings, and the line "Renders and plans are illustrative and may change." covers it.

**F1. Parametric furniture library** (`src/scripts/explorer/furniture.ts`). Every piece is generated in code from a footprint rectangle (`poly`), a `kind`, and the nearest wall (which sets its back). No model files, except one plant. Two tiers: **full** (dollhouse, walk-in) and **low** (assembled floor: the main volumes only).

| Kind | Full tier | Sizes and colours |
|---|---|---|
| `bed` | Frame, mattress, duvet covering the lower two thirds, two pillows, a folded throw across the foot, a headboard against the wall | Frame 0.3 m, oak; mattress 0.22 m, `#F4F0E8`; duvet linen `#E9E2D6`; throw navy `#1A273F`; headboard 1.0 m, upholstered `#CFC3B1` |
| `nightstand` | Box with a drawer line, a lamp (brushed-gold stem, linen shade) | 0.5 m, oak |
| `sofa` | Base, seat cushions (one per 0.7 m), back cushions, two arms | Seat 0.42 m, back 0.8 m, linen `#D8CDBC`; one navy cushion |
| `armchair` | As sofa, one seat | |
| `coffeeTable`, `sideTable` | Top on four legs, or a drum for a side table | 0.4 m / 0.55 m, oak; one gold tray |
| `dining` | Top on four legs, plus chairs placed from the traced chair blocks (seat, back, four legs) | Table 0.75 m, oak; chairs `#B79B74` |
| `tvUnit` | Low cabinet with door lines, a thin TV panel on the wall above | 0.5 m, dark oak; TV black, 1.2 m wide |
| `wardrobe` | Full-height box with door lines every 0.5 m and slim gold handles | 2.2 m (cut at 2.4 m in the dollhouse), greige oak `#B5A08A` |
| `counter` | Base cabinets with door lines, a 4 cm stone worktop with a 2 cm overhang; wall cabinets above where the counter is against a wall (0.7 m high, from 1.5 m; hidden in the dollhouse cut if above 2.4 m) | Cabinets ivory `#EFE9DF`; worktop stone `#CFC8BC` |
| `rug` | A 1 cm slab with a border | From the traced rug rectangle; `#D9D2C6` with a navy border |
| `curtain` | Two gathered panels at each glazed door or window, inside | Linen, 2.4 m; full tier only |
| `pendant` | A small pendant over the dining table; full tier only | Brushed gold |
| `plant` | One CC0 glTF potted plant (≤ 40 KB, from Quaternius, Kenney or Poly Haven; record the source and licence in the repo), instanced at most twice per unit, on balconies or by glazing | |

Fixtures (F2) use the same library: `wc`, `basin` (vanity with a basin and a mirror), `shower` (tray with a clear glass screen), `sink` (inset in the worktop, with a tap), `hob` (a black glass rectangle), `fridge` (a tall box with a door line).

Rules:
- Cushions, pillows and duvets are rounded boxes (`RoundedBoxGeometry`, radius 4–6 cm). Everything else is plain boxes. All of a unit's furniture is merged into **one mesh per material** (at most 8 materials).
- Budget: ≤ 25k triangles per unit at the full tier, ≤ 4k at the low tier.
- The traced furniture rectangles keep driving placement. The plan-art lid is no longer used on furniture.

**F2. Fixtures the plans draw (data follow-up, not yet delivered).** The unit JSONs don't yet carry WCs, basins, shower trays, kitchen sinks, hobs or fridges. Design will trace them from each plan as `solids` of the new kinds above, plus `kind` refinements for existing furniture (`bed`, `nightstand`, `sofa`, `dining`, `chair`, `tvUnit`, `sideTable`, `rug`), **one unit at a time, BL05 first**. Only fixtures the plan draws are added; no fridge unless the plan shows one. **Format (rev 10.2, BL05 delivered):**
- New `solids[].kind` values: `shower` (tray, h 0.08), `basin` (h 0.85), `wc` (h 0.42), `hob` and `sink` (h 0.92, with `on` naming the counter they sit in), `rug` (h 0.01), and later `fridge` where a plan draws one. They are green in the check images; the rug is yellow.
- Every `furniture` solid gains `piece`: `bed`, `nightstand`, `sofa`, `dining`, `chair`, `tvUnit` or `sideTable`.
- Every room gains `finish`: `tile` or `parquet`, from the plan's own label.
- `fixturesNote` says what the plan does and doesn't draw. Every shower room in every unit shows a tray, a WC and a basin (some WCs sit partly under the room label), and every kitchen shows a sink and a hob. **No plan draws a fridge, so none is modelled.** BL09's unlabelled wet room has a WC and a tray.
- All nine units are delivered (rev 10.3).
- Standpoints ignore rugs, trays, hobs and sinks, since they don't block standing room.

Until a unit's data is refined, the library infers the kind from the block's id prefix (`f-bed…`, `f-sofa…`, `f-dining`, `f-chair…`, `f-tv`, `f-side`, and `…-ns…` for nightstands), which every unit already follows.

**F3. Materials (PBR, CC0).** `MeshStandardMaterial` throughout, in place of Lambert.

| Surface | Texture set (1024 px WebP: colour, normal, roughness) | Tiling |
|---|---|---|
| Ceramic tile, large format | ambientCG or Poly Haven tile set, light warm grey | 0.6 m tiles; living rooms, kitchens, halls, balconies |
| Ceramic tile, wet rooms | The same set tinted cool grey; no second download | 0.3 m |
| Floor in rooms the plan labels "PARQUET" (BL01, BL02, BL04 bedrooms and living rooms) | Light oak parquet set | 1.2 m planks |
| Bedroom floors on plans labelled "ceramic tile" but drawn tan | The tile set tinted warm oak-tan. **Not parquet**: the label wins over the drawing's colour. | 0.6 m |
| Walls | Plaster: normal and roughness only, colour from the token | 2 m |
| Fabric | Linen: normal only | 0.5 m |
| Wood | Light oak: colour and roughness | 1 m |
| Worktop | No texture: flat colour, roughness 0.35 | |

- **Budget:** ≤ 1.5 MB in total for all texture files, loaded only on first entering the dollhouse; anisotropy 4; mipmaps on. On phones, load colour maps only (≤ 600 KB) and use constant roughness.
- **The plan image as floor is retired in the dollhouse and walk-in**, which also removes the dimension text and the upside-down labels seen from inside. The plan texture stays for the minimap, the room card placeholder, and the 2D plan view. Per-room floor material comes from `rooms[].name` and the plan's finish label; add `rooms[].finish: "tile" | "parquet"` to the data with the F2 pass (default `tile`).
- Record each texture's source URL and CC0 licence in `public/textures/README.md`.

**F4. Glass and frames.** Glazing gets black mullions (a 4 cm frame, with a vertical every 0.9 m), like the reference. Glass: `MeshPhysicalMaterial` with `transmission` on desktop; on phones a plain transparent material at 0.25 opacity.

**F5. Light and post-processing, by tier.**

| | Phone (coarse pointer, or `deviceMemory` < 8) | Desktop |
|---|---|---|
| Environment | `RoomEnvironment` through PMREM, intensity 0.6 | The same, intensity 0.8 |
| Sun | One directional, shadows 1024², baked at rest | 2048², `PCFSoftShadowMap` with a 3-sample blur |
| Ambient occlusion | The rev 9 gradient strips along wall bases | `GTAOPass` (three's own), half resolution, radius 0.5 m, only while the camera rests; off during orbit and tweens |
| Tone mapping | ACES filmic, exposure 1.0 | The same |
| Pixel ratio | ≤ 1.5 | ≤ 2 |
| Anti-aliasing | MSAA from the context | MSAA, plus SMAA after the AO pass |

The rev 8 camera fill light and the floor tint workaround go away with the PBR materials and the environment; re-tune so walls read cream and floors keep their texture tones.

**F6. The dive** (replaces U8's opening). Camera path from the orbit position: a curve that drops through the cut of the chosen room and levels out at the standpoint at 1.5 m, in 1.8 s (`power2.inOut`), with the fov going 30 → 72. In the last 0.5 s the view fades through ivory (opacity 0 → 0.6 → 0) while the walls rise and the ceiling appears, which hides the pop. No motion-blur shader. Reduced motion: a 0.2 s cross-fade.

**F7. Progressive path tracing: assessed, optional, last.**
- **What it buys:** soft global light, real glass and contact shadows that converge in a few seconds on a desktop GPU. It is the closest we can get to the video's interiors without AI images.
- **What it costs:** `three-gpu-pathtracer` adds about 150–200 KB of code and needs a BVH build of the scene (about 1 s for a unit), WebGL2 with float render targets, and a discrete or recent integrated GPU. It can't run on most phones.
- **Recommendation:** do it, but **not automatically**. A button "Render this view" (desktop only, shown when the GPU check passes) in the dollhouse and walk-in toolbars. On press: the chunk loads, the view converges over up to 300 samples with a thin gold progress line, and any camera movement returns to the normal view at once. The result is the live geometry, so it needs no "artist's impression" label, only the existing illustrative line.
- Build it only after F1–F6 are accepted, and drop it if the first unit takes over 10 s to reach a clean image on the review machine.

**F8. Strings.** "Render this view" / "ይህን እይታ አጥራ"; "Rendering… {n}%" / "በማጥራት ላይ… {n}%"; "Furniture is illustrative." / "የቤት ዕቃዎቹ ለማሳያ ብቻ ናቸው።" (replaces "Simplified 3D model from the floor plan" in walk-in mode).

**Order for impl:** T1 → T3 → T4 → T2 → T5 → T6, then F1 → F3 → F5 → F4 → F6, with F2's data arriving per unit, and F7 last.

---

## 10. Performance budget

| Item | Budget (gzip/brotli) | Notes |
|---|---|---|
| HTML (home) | ≤ 40 KB | Inline CSS by choice: all CSS is inlined into the HTML, because an external stylesheet would block rendering on first visit. Also includes the inline SVG maquette and key-plan markup. (Raised from 35 KB in rev 4.) |
| CSS | ≤ 25 KB total, all inlined (counts within the HTML budget above) | Set via Astro `build.inlineStylesheets`. |
| JS, initial (deferred module) | **≤ 70 KB** | gsap core + ScrollTrigger (about 45 KB), Lenis (about 4 KB), SplitText + Flip (about 12 KB; may be imported on idle), app (about 10 KB). Nothing blocks render. |
| JS, explorer tier 2 | **≤ 170 KB** | `three` imported via named ESM imports (tree-shaken) plus the scene code. Loaded only near `#explore` and only for tier 2. |
| JS, plan viewer | ≤ 4 KB | Dynamic import on first "View plan" (or idle prefetch). |
| Fonts (initial) | ≤ 110 KB | Cormorant (latin, variable) plus Manrope (latin). Ethiopic loads **only** on /am, subset to the `am` dictionary glyphs (target ≤ 60 KB), preloaded there only. Cormorant italic is a static 500-weight latin file (≈ 20 KB), not preloaded. |
| Hero poster (LCP, rev 6) | **14–40 KB** WebP (now 17 KB); JPEG fallback ≤ 40 KB (now 29 KB) | `public/video/hero-bg-poster.*`, 640×352. Preloaded, `fetchpriority="high"`. The lower bound keeps it above Chrome's 0.05 bits-per-pixel LCP threshold at 1920×1080 (§5.1). |
| Hero background loop (rev 6) | ≤ 1.2 MB AV1 WebM (now 1.0 MB), ≤ 1.2 MB H.264 MP4 (now 1.15 MB) | 640×352, 24 fps, 20.6 s, no audio. Requested at `DOMContentLoaded` only under the §5.1 conditions; never preloaded; zero bytes with reduced motion, Save-Data, a slow connection or no JS. Only one of the two files is fetched. |
| Hero grain (rev 6) | ≤ 4 KB PNG (now 3 KB) | `public/img/grain.png`, from `docs/design/hero-grain.png`. |
| Other images | lazy; plan thumbs ≤ 45 KB each (AVIF 600w); viewer images ≤ 250 KB each, loaded on open | `astro:assets` `<Picture formats={['avif','webp']}>` with `widths` and `sizes` on every image. |
| Key-plan duotone | ≤ 120 KB at 1100w WebP | Lazy; loads with the explorer section. |
| Full film (rev 5) | 3.8 MB H.264 + AAC (faststart), plus a ≤ 35 KB poster | `preload="none"`. Fetched only when the dialog opens. Faststart means it plays progressively. |
| Film JS (rev 5, rev 6) | ≤ 4 KB | Part of the app bundle: background loader, dialog, circle reveal, sound toggle. Uses GSAP, which is already loaded. No video or audio library. |
| Leaflet (rev 7) | ≤ 45 KB JS (1.9.4 is about 42 KB) + ≤ 4 KB CSS | Dynamic `import()` when `#location` is within 800 px. Zero bytes with no JS, or until the "Show the satellite map" pill is pressed on slow or Save-Data connections. Not in the initial bundle. |
| Map glue JS (rev 7) | ≤ 4 KB (raised from 3 KB in rev 7.1; the map chunk measured 52.2 KB) | Loader, entrance, custom controls, two-finger hint, failure fallback. |
| Satellite tiles, first view (rev 7) | ≤ 1 MB (about 22 KB per 256 px JPEG, checked) | z15 view plus z17 view, at 1×. `detectRetina: false`, `keepBuffer: 1`, and `updateWhenZooming: false` keep z16 out. Reduced motion fetches z17 only. |
| Unit 3D code (rev 8) | ≤ 12 KB gzip | `unit3d.ts` plus `mergeGeometries`. Reuses the tier 2 `three` chunk and renderer. Loaded on the first UNIT entry with `has3d`; prefetched on idle from FLOOR. Zero bytes on tiers 0 and 1. |
| Unit geometry (rev 8) | ≤ 20 KB raw per unit (BL05: 11 KB raw, 3.2 KB gzip) | JSON, dynamic import. |
| Unit floor texture (rev 8) | AVIF ≤ 90 KB, WebP ≤ 110 KB (BL05 WebP: 105 KB), 1024 px wide | Loaded with the unit. Never on first load, so no LCP impact. |
| Room images (rev 8, later) | AVIF ≤ 140 KB each, 1600 × 1067 | Only on room open, and only `approved: true`. |
| Tower render (rev 9) | AVIF ≤ 220 KB at 1200 w, ≤ 280 KB at 1350 w | Lazy; below the fold; never the LCP. Overlay SVG ≤ 3 KB inline. Tower-stage JS ≤ 3 KB. |
| Walk-in code (rev 9) | ≤ 7 KB gzip | Own chunk, on the first "Step inside". |
| Room panoramas (rev 9, later) | AVIF ≤ 450 KB each (4096 × 2048, or a 4096 × 1365 strip) | One at a time, on entering that room; only `approved: true`. |
| 3D tower (rev 10) | Code ≤ 14 KB gzip; `tower3d.json` 11.9 KB raw; nine unit JSONs about 30 KB gzip in total, on the first floor selection | Own chunk, tier 2 only, when the explorer is near. Under 60k triangles for the tower and context; under 45k for the assembled floor. |
| Furniture library (rev 10) | Code ≤ 12 KB gzip; one plant glTF ≤ 40 KB | Loaded with the dollhouse. ≤ 25k triangles per unit (full tier). |
| PBR textures (rev 10) | ≤ 1.5 MB in total, 1024 px WebP (≤ 600 KB on phones) | On first entering the dollhouse; never before. |
| Post-processing (rev 10) | ≤ 20 KB gzip (GTAO, SMAA, composer) | Desktop tier only. |
| Path tracer (rev 10, optional) | About 150–200 KB | Only on pressing "Render this view", desktop only. |
| Film music (rev 5) | ≤ 260 KB (Opus WebM 252 KB, AAC M4A fallback 258 KB) | Zero bytes until the first press of the sound toggle. Only one of the two files is ever fetched. |

Targets: LCP ≤ 2.5 s and CLS ≤ 0.02 on Lighthouse mobile (slow 4G, Moto G Power); TBT ≤ 150 ms; INP ≤ 200 ms. Lighthouse scores per CLAUDE.md.

Rules:

- Every animated element has reserved space: aspect-ratio on all media; fixed-width numerals.
- No layout reads inside scroll handlers.
- `ScrollTrigger.config({ ignoreMobileResize: true })`.
- All rAF loops (pulse, idle sway, cursor) pause offscreen and when `document.hidden`.

---

## 11. Accessibility and i18n checklist (design-level)

- Landmarks: `header`, `nav`, `main`, `footer`. One H1. Sections use `aria-labelledby` pointing at their H2.
- Skip link "Skip to content", visible on focus.
- Focus ring everywhere: 2 px `--focus` with 2 px offset (3 px stroke on SVG hotspots).
- Hit targets ≥ 44 px: chips, stepper, dialog controls, close buttons.
- The explorer is fully operable by keyboard and screen reader through lists and buttons. The canvas is decorative.
- Plan images: alt text such as "Floor plan of BL05, 3 bedroom: living and dining room, master bedroom, two bedrooms, kitchen, two bathrooms, store, balconies". Build it from the room list.
- Amharic: `lang="am"` on `<html>` for /am, and `lang` attributes on any mixed snippets. Keep "m²", unit codes (BL05) and numerals as-is. Check that the heading scale still fits, since Ethiopic glyphs are wider (allow H1 at 0.85× size on /am via `:lang(am) { --fs-display: … }`).
- Language toggle: real links (`/` and `/am/`) with `hreflang`. The state persists across navigation.
- Film (rev 5): the pause control for the autoplaying loop (2.2.2), the modal dialog's focus behaviour, the text description and the captions track are all specified in §5.11.
- TBC states (rev 5) are conveyed in text, never by the hatch or dashed lines alone.
- New rev 5 strings, to be added to both dictionaries with the Amharic flagged for client review:
  - film: "Watch the film", "The tower film", "Close film", "Pause background film", "Play background film" (rev 6, replacing the "preview" strings), "Background film" (the group label), the film description, `[Music]`
  - sound: "Film music", "Sound on", "Sound off", "Sound couldn't start"
  - features: the four feature labels
  - TBC: "To be confirmed", the TBC body, "Ask about this home", "See BL01 on floor {n}", the form hint
  - location: "Open exact location in Google Maps" (rev 5; retired in rev 7, see below)
- Rev 7 strings (EN, then a draft AM for the client to check):

  | Key (suggested) | EN | AM (draft) |
  |---|---|---|
  | `location.directions` | Get directions | አቅጣጫ ያግኙ |
  | `location.openMaps` (existing) | Open in Google Maps | በጎግል ካርታ ይክፈቱ |
  | `location.mapRegion` | Satellite map showing where Garment Tower is | ጋርመንት ታወር ያለበትን ቦታ የሚያሳይ የሳተላይት ካርታ |
  | `location.pinCard` | Dar Al Salam · Garment Tower | ዳር አል ሰላም · ጋርመንት ታወር |
  | `location.captionMap` | Satellite image. It may show the site before construction. | የሳተላይት ምስል። ቦታውን ከግንባታው በፊት ሊያሳይ ይችላል። |
  | `location.caption` (existing) | Diagram, not to scale. | (existing) |
  | `location.showMap` | Show the satellite map | የሳተላይት ካርታውን አሳይ |
  | `location.twoFingers` | Use two fingers to move the map | ካርታውን ለማንቀሳቀስ ሁለት ጣቶችን ይጠቀሙ |
  | `location.zoomIn` | Zoom in | አጉላ |
  | `location.zoomOut` | Zoom out | አሳንስ |
  | `location.recentre` | Centre on the tower | ወደ ታወሩ ተመለስ |
  | `enquiry.tgTitle` | Contact us on Telegram | በቴሌግራም ያግኙን |
  | `enquiry.tgHint` | Tap a username to open a chat. | ውይይት ለመጀመር የተጠቃሚ ስሙን ይንኩ። |
  | `enquiry.tgOr` | or send us your details | ወይም ዝርዝር መረጃዎን ይላኩልን |
  | `enquiry.submitVia` | Send on {channel} | በ{channel} ይላኩ |
  | `enquiry.opensTo` | Opens Telegram to {handle} | ቴሌግራምን ወደ {handle} ይከፍታል |
  | `enquiry.copied` (changed) | Message copied too, in case Telegram doesn't fill it in. | መልዕክቱ ተቀድቷል፤ ቴሌግራም ባይሞላው ይለጥፉት። |
  | `enquiry.tgDoneTitle` | Finish in Telegram. | በቴሌግራም ይጨርሱ። |
  | `enquiry.tgDoneBody` | Your message should already be in the chat with {handle}. Press send there. | መልዕክትዎ ከ{handle} ጋር ባለው ውይይት ውስጥ ሊኖር ይገባል። እዚያ ላይ ይላኩ። |
  | `enquiry.tgAgain` | Open Telegram again | ቴሌግራምን እንደገና ክፈት |
  | `enquiry.copy` / `enquiry.copiedShort` | Copy message / Copied | መልዕክቱን ቅዳ / ተቀድቷል |
  | `enquiry.copyFallback` | If the chat is empty, copy this message and paste it there. | ውይይቱ ባዶ ከሆነ ይህን መልዕክት ቀድተው እዚያ ይለጥፉት። |

  `{handle}` is always rendered as `<span dir="ltr" lang="en" translate="no">@user</span>`. Telegram, Google Maps, Esri and Leaflet stay untranslated in the attribution.
- Rev 9 strings (EN / AM draft):

  | Key | EN | AM (draft) |
  |---|---|---|
  | `tower.alt` | Rendering of Garment Tower from the street corner. | የጋርመንት ታወር ምስል፣ ከመንገዱ ጥግ እንደሚታይ። |
  | `tower.hintHover` / `tower.hintTap` | Hover a floor / Tap a floor | ወለል ላይ ያንዣብቡ / ወለል ይንኩ |
  | `tower.ground` | Ground floor: commercial | መሬት ወለል፦ ንግድ (rev 9.1: the legend's existing wording, so the ground floor has one name) |
  | `walk.enterHome` | Enter the home | ወደ ቤቱ ይግቡ |
  | `walk.stepInside` | Step inside | ወደ ውስጥ ይግቡ |
  | `walk.back` | Back to 3D model | ወደ 3D ሞዴሉ ተመለስ |
  | `walk.inside` (breadcrumb) | Inside | ውስጥ |
  | `walk.hint` | Drag to look · Tap a ring to move | ለማየት ይጎትቱ · ለመንቀሳቀስ ቀለበቱን ይንኩ |
  | `walk.lookLeft` / `walk.lookRight` | Look left / Look right | ወደ ግራ ይመልከቱ / ወደ ቀኝ ይመልከቱ |
  | `walk.goTo` | Go to the {room} | ወደ {room} ይሂዱ |
  | `walk.useMotion` | Use motion | የስልኩን እንቅስቃሴ ተጠቀም |
  | `walk.geometryLabel` | Simplified 3D model from the floor plan | ከወለል ፕላኑ የተሠራ ቀለል ያለ 3D ሞዴል |
  | `walk.panoAlt` | Artist's impression of the {room}, seen from inside | የ{room} የአርቲስት ምናባዊ ሥዕል፣ ከውስጥ እንደሚታይ |
  | `walk.stopped` | 3D view stopped | የ3D እይታው ቆሟል |
  | `rooms3d.hall` | Hall | መተላለፊያ |

  The AI label reuses `unit3d.aiLabel`. `{room}` is lower-case in "Go to the {room}".
- Rev 8 strings (EN / AM draft):

  | Key | EN | AM (draft) |
  |---|---|---|
  | `unit3d.view3d` / `unit3d.viewPlan` | 3D / Plan | 3D / ፕላን |
  | `unit3d.hint` | Drag to turn · Tap a room | ለማዞር ይጎትቱ · ክፍል ይንኩ |
  | `unit3d.roomsTitle` | Rooms | ክፍሎች |
  | `unit3d.closeRoom` | Close room | ክፍሉን ዝጋ |
  | `unit3d.aiLabel` | Artist's impression; finishes may vary. | የአርቲስት ምናባዊ ሥዕል፤ ማጠናቀቂያዎች ሊለያዩ ይችላሉ። |
  | `unit3d.planLabel` | From the floor plan | ከወለል ፕላኑ |
  | `unit3d.altAi` | Artist's impression of the {room} in {code} | በ{code} ያለው {room} የአርቲስት ምናባዊ ሥዕል |
  | `unit3d.altPlan` | Floor plan detail of the {room} in {code} | በ{code} ያለው {room} የወለል ፕላን ዝርዝር |
  | `rooms3d.bedroom` | Bedroom | መኝታ ክፍል |
  | `rooms3d.masterBedroom` | Master bedroom | ዋና መኝታ ክፍል |
  | `rooms3d.shower` | Shower room | ሻወር ክፍል |
  | `rooms3d.kitchen` | Kitchen | ማእድ ቤት |
  | `rooms3d.store` | Store | ዕቃ ማስቀመጫ |
  | `rooms3d.livingDining` | Living and dining room | ሳሎንና መመገቢያ ክፍል |
  | `rooms3d.balcony` | Balcony | በረንዳ |

  Reuse existing `rooms.*` strings where they already match. `{room}` is lower-case in the alt strings.

---

## 12. Open items for the client (`TODO(client)` in `src/data/site.ts`)

Phone, WhatsApp number, email, office address, social links, completion date, what sits in the BL01 position off floors 4, 6, 8, 10 and 11, plans for floors 15–16, **an ArcGIS Location Platform API key (`site.map.esriKey`, rev 7): needed before the public launch, because the keyless Esri tiles are non-commercial only**, **which Telegram account should receive form enquiries (today the first, @abdulaziz_a12, §5.8)**, names or roles for the two Telegram contacts (optional; until given, usernames only), **the floor count and storey heights (rev 10: the 3D tower is drawn as ground + floors 1–14 + one planned storey, with a 6.3 m ground storey read off the render and 3.0 m typical storeys, both assumed; a section or elevation drawing would settle it)**, **which sides of the building face the street.** Rev 10.4 reading from the satellite image at the client's pin (Esri World Imagery, z19): the plot has **one** adjacent public road, running roughly north–south along its **east** side; the east–west road to the south is separated from the plot by other buildings. So one long side of the building most likely fronts the street. **Which key-plan side that is can't be determined**: the plans carry no north arrow, and the image shows the site as foundations, with no footprint to match. Confidence: medium that there is a single street frontage on a long side; none on left versus right. The client's render shows roads on two faces, and the 3D scene follows the render (roads along the bottom and left of the key plan). That stays an assumption until the client confirms, real window positions on each face of the tower (rev 10: most of the 3D tower's windows are illustrative), **a tower render or elevation with countable floors (rev 9: the current render draws 13 typical storeys above the ground storey, while the site says 16 floors and the plans cover 14)**, what the homes look out on, by side (rev 9: walk-in mode shows a plain sky until we know), **window positions and sizes per room (rev 8: the plans dimension only the kitchen window, so the 3D façades are drawn solid)**, storey and ceiling heights (the 3D uses an illustrative 2.8 m), which unlabelled BL05 duct the 55 cm shaft is (shown as a plain solid), **room areas whose plan labels are hidden under other text (shown without m² until confirmed): BL01 and BL04 kitchen and living room; BL02 en-suite shower, kitchen and living room; BL06 living room, master bedroom and kitchen; BL07 master bedroom and en-suite shower; BL08 living room**, how BL08's 1.6 m² balcony is reached (the plan draws no opening), what the unlabelled areas are (BL03 top-left tiled area, BL06 top-right ledge, BL09 wet room off the kitchen), **BL01's floor finish: its plan labels the bedrooms and living room "PARQUET ff", while the brief says ceramic tile**, unit numbering convention, availability per unit, amenities beyond the plans, and a cleaner high-res render (one without the collage sky) if one exists. The design degrades gracefully when any of these are missing:

- Contact rows hide when unset.
- The form shows a "being set up" message.
- No availability badges are shown.
