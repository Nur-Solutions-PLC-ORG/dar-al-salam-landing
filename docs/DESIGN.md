# Dar Al Salam: design spec

Owner: `realstate-frontend-design`. Inputs: `docs/BRIEF.md` (facts and the quality bar) and `CLAUDE.md`. If this spec and the brief disagree on a fact, the brief wins. Everything here is direction and can be refined. If you change direction, say so in this file so the reviewer has something to check against.

**Changelog.** 14 Nov 2026, rev 6 (user decision): the film becomes the full hero background with a verified shade, grain, a play control and pause/sound controls (§5.1 rewritten, §5.11, §7.2, §7.3 S1, §8, §10). The rev 5 film card is removed. The Story arch now shows the whole tower (§5.3), and the Enquire arch takes the balconies detail. Rev 5 (BRIEF "Update 2026-11-14"): the tower film and its sound toggle (new §5.11, the hero card in §5.1, §7.2, §7.3 S1, §8, §10); building features band (§5.7: three pillars plus four features); 16 floors (§5.1, §5.2, §9.2); BL01 "to be confirmed" off floors 4, 6, 8, 10, 11 (§5.5, §5.8, §9.1–§9.3); the exact Maps pin (§5.6). Each rev 5 change is tagged "rev 5" where it lives, so later client facts can be slotted in one place at a time. Rev 4: §10 HTML budget raised to 40 KB gzipped (inline CSS by choice). Rev 3 (M2 visual QA): S9 dusk is now a static gradient (the fixed veil dimmed the story copy); §9.4 camera framing numbers, ground disc, look-at clamp, glazing colour. 12 Nov 2026, rev 2: applied review findings 1–10 (`.theme-paper`, `--input-border`, no colour tweens, copy fixes, CSS-only hero reveal, server-rendered hotspot hrefs, font subsetting, blocks internal only, pillar and payment copy, mark as `<symbol>`).

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

### 5.6 Location (`#location`, sand)

- H2 "Easy to *live*." (an echo of the brochure). Lead: "In the heart of Garment, close to Haile Garment roundabout, the Garment taxi station, Lafto square and the Africa CDC headquarters."
- **Stylised diagram map (inline SVG, not a real map)**: roads drawn as 2 px `--line-strong` strokes, the Haile Garment roundabout as a ring, labelled nodes for the four landmarks, and the site as a gold keyhole pin with a slow 2.4 s pulse ring. Positions are schematic, taken from the relative layout in the brochure map: site west; taxi station north-east of the site; roundabout east; Lafto square beside the roundabout; Africa CDC east, past the ring road. Caption: "Diagram, not to scale." **No coordinates, distances or travel times.**
- CTA (rev 5): **"Open exact location in Google Maps"** → `site.location.mapsUrl`, the client's pin `https://maps.app.goo.gl/4Ed5VBCaYGvbbY6X9`. Secondary pill style, with a 16 px keyhole-pin glyph before the label and an external-link arrow after it. New tab, `rel="noopener"`, with a visually hidden "(opens in a new tab)". If `mapsUrl` is ever empty, fall back to the search link with the label "Open in Google Maps" (`mapsHref()` already does this).
- **"Get directions": not yet.** The Maps URLs API can target a directions destination exactly only with coordinates or a `ChIJ…` place ID. We have neither: the ID in the brief is the internal hex form, which the URLs API doesn't accept, and we never hand-type coordinates. A "Get directions" button would therefore either repeat the pin link or route to an approximate search result, so leave it out. The pin page already has Google's own Directions button one tap away. It is ready to switch on later: if `site.location.placeId` (a `ChIJ…` ID) is ever added, show a text link "Get directions" after the CTA, pointing to `https://www.google.com/maps/dir/?api=1&destination=Garment%20Tower&destination_place_id={placeId}`.
- The site pin on the diagram stays where it is and keeps its "Diagram, not to scale." caption. The exact pin changes the link only, not the drawing.
- Desktop: map in cols 1–8 inside a soft arch frame, text and landmark list in cols 9–12. Mobile: text, then map (aspect 4:5), then the list.

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
Desktop                                              Mobile
┌──────────────────────────┬─────────────────────┐   ┌────────────────────┐
│ 05 — ENQUIRE             │ Name                │   │ Book a visit or    │
│ Book a visit or request  │ [______________]    │   │ request plans…     │
│ floor plans & pricing.   │ Phone               │   │ Name  [_________]  │
│                          │ [+251 __________]   │   │ Phone [_________]  │
│ ╭─────╮ balconies arch   │ Preferred home      │   │ Home  [Any ▾]      │
│ │     │                  │ [Any ▾] [Floor: Any▾]│  │ Floor [Any ▾]      │
│ ╰─────╯                  │ Reply via           │   │ Reply ( )WA ( )TG  │
│ Contact lines (if set)   │ (•)WhatsApp ( )Telegram (  )Email│ Message [____]│
│                          │ Message [_________] │   │ [ Send enquiry ]   │
│                          │ [ Send enquiry → ]  │   └────────────────────┘
└──────────────────────────┴─────────────────────┘
```

- Fields: name (required, `autocomplete="name"`); phone (required, `type="tel"`, `inputmode="tel"`, `autocomplete="tel"`, placeholder `+251 9…`, lenient validation of ≥ 9 digits); preferred home (`select`: Any, BL01 – 2 bedroom, BL02 – 3 bedroom, …); floor (`select`: Any, 1–14); reply via (radio, showing **only channels configured** in `site.ts`); message (optional textarea, 4 rows).
- Labels sit above inputs and are always visible. Inputs are 52 px tall with 16 px text, a 1 px `--input-border` border, and `--radius-xs`. Focus shows a 2 px `--focus` outline at 2 px offset. Errors appear inline under the field in `--danger-600` with an icon, `aria-describedby`, and one summary sentence in an `aria-live="polite"` region.
- Submit builds the text `"Hello Dar Al Salam, I'm {name} ({phone}). I'm interested in {unit} on {floor}. {message}"` and opens WhatsApp (`https://wa.me/{number}?text=`), Telegram (`https://t.me/{username}`, with the text copied to the clipboard and a toast "Message copied, paste it in Telegram"), or `mailto:`. **If no channel is configured** (all `TODO(client)`), hide the radio and show: "Our contact lines are being set up. Please check back soon." with the submit button disabled. Never post the form anywhere.
- Success: the mark (`<use href="#mark">`, cropped by viewBox to the dove) lifts 24 px and fades. Status text reads "Opening WhatsApp…".
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
| S13 | Location map | road group `clip-path: inset(0 100% 0 0)` → `inset(0)`, then landmark pins scale 0 → 1 (`back.out(2)`, stagger 0.1), then labels fade | map · `top 75%` | once | roads 1.4 / power2.inOut; pins 0.5 |
| S14 | Location site pin | pulse ring scale 1 → 2.2 with opacity 0.5 → 0, repeating; **paused offscreen** (ScrollTrigger `onToggle`) | — | — | 2.4 / power1.out, repeat −1 |
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
- **UNIT(n, code)**: the plan image (click opens the plan viewer from §5.5), then code, type, gross and net m², and the room list. Actions: **Request pricing for Floor 7 · BL05** (primary, deep-links the form) and **Book a visit**. Prev/next unit arrows cycle BL01 → BL09 on the same floor, including a TBC position. The 3D model keeps the selected floor pulled out.
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
  - location: "Open exact location in Google Maps"

---

## 12. Open items for the client (`TODO(client)` in `src/data/site.ts`)

Phone, WhatsApp number, Telegram username, email, office address, social links, completion date, what sits in the BL01 position off floors 4, 6, 8, 10 and 11, plans for floors 15–16, a `ChIJ…` place ID (only needed to switch on "Get directions", §5.6), unit numbering convention, availability per unit, amenities beyond the plans, and a cleaner high-res render (one without the collage sky) if one exists. The design degrades gracefully when any of these are missing:

- Contact rows hide when unset.
- The form shows a "being set up" message.
- No availability badges are shown.
