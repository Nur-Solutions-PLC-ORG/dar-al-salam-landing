# Brief: Dar Al Salam Real Estate landing page

## Goal
A single, premium, highly animated but very fast landing page that sells apartments in the **Garment tower** (Addis Ababa) and generates enquiries ("Book a visit", "Request floor plans & pricing"). Audience: Ethiopian families and diaspora buyers (on phones, often on slow 3G/4G), investors.

Feel: calm, luxurious, trustworthy. "Dar Al Salam" means "House of Peace". The logo is a gold line-art dome/arch with a keyhole door, a dove carrying an olive branch, inside a circle, with a navy serif wordmark. The brochure uses elegant script headings ("Apartment", "Easy to Live").

## Brand
| Token | Value | Source |
|---|---|---|
| Navy (wordmark) | `#1A273F` | sampled from logo |
| Gold (mark) | `#B59458` mid, highlights toward `#D9BE86`, shadows `#8C6B32` | sampled from logo |
| Ivory (paper) | `#FBF7F2` | logo background |
| Fonts | Serif display for headings (match the classic wordmark, e.g. Cormorant Garamond / Marcellus / Cinzel-like), Manrope for body, Noto Sans Ethiopic for Amharic | app uses Manrope + Noto Sans Ethiopic; files in `brand-source/fonts/` |

Assets in `brand-source/`:
- `logo/logo-full-original.png` full logo on off-white (1280×700); `logo/logo.png` (for light bg), `logo/logo-dark.png` (light text, for dark bg), `logo/mark.png` (transparent gold mark, 256 px). No vector yet; an SVG re-trace of the mark is welcome (keep it faithful).
- `tower-render.jpg`: aerial render of the tower (cropped from the brochure cover, 2251×2163). `brochure-cover-original.jpg`: the uncropped cover (has baked-in text; don't use as-is).
- `plans/bl01.jpg … bl09.jpg`: furnished, rendered top-down plans of each apartment type. `plans/keyplan-typical-floor.png`: colour-coded typical floor key plan (transparent PNG; legend BL01–BL09). `plans/basement-floor.png`, `plans/ground-floor.png`.
- `location-map-brochure.jpg`: brochure map (has "Easy to Live" baked in; reference only).
- `icons/`: favicon set from the sales app.

## Project facts (only these; don't invent more)
- **Garment tower**, Garment area, Addis Ababa. Landmarks nearby: Haile Garment roundabout, Garment taxi station, Lafto square, Africa CDC headquarters.
- High-rise residential tower, "two block layout". Basement: parking + offices. Ground floor: offices/commercial. **Residential floors 1–14, 9 apartments per floor = 126 apartments.**
- Unit types (gross / net m²):

| Code | Type | Gross m² | Net m² | Rooms |
|---|---|---|---|---|
| BL01 | 2 bedroom | 158.54 | 108.57 | living/dining, master bed, 1 bed, kitchen, 2 baths |
| BL02 | 3 bedroom | 166.97 | 117.00 | living/dining, master, 1 bed, kitchen, 2 baths, store/bedroom |
| BL03 | 3 bedroom | 166.97 | 117.00 | living/dining, master, 2 beds, kitchen, 2 baths, store |
| BL04 | 3 bedroom | 166.97 | 117.00 | living/dining, master, 1 bed, kitchen, 2 baths, store/bedroom |
| BL05 | 3 bedroom | 169.23 | 119.05 | living/dining, master, 2 beds, kitchen, 2 baths, store |
| BL06 | 3 bedroom | 171.18 | 121.21 | living/dining, master, 2 beds, kitchen, 2 baths, store |
| BL07 | 3 bedroom | 169.24 | 119.27 | living/dining, master, 2 beds, kitchen, 2 baths, store |
| BL08 | 3 bedroom | 167.63 | 117.66 | living/dining, master, 2 beds, kitchen, 2 baths, store |
| BL09 | 3 bedroom | 168.55 | 118.54 | living/dining, master, 2 beds, kitchen, 2 baths, store |

  Plans show balconies, a separate shower room per bath, ceramic tile finishes, lift lobby with 2+ lifts and stairs per block.
- **Prices: do not publish.** Use "Request pricing". Payment is flexible (pay any amount over time until fully paid; a unit is reserved with an initial payment). It's OK to say "Flexible payment plans".
- **Unknown (put in `src/data/site.ts` as `TODO(client)` and render gracefully):** phone, WhatsApp, Telegram, email, office address, social links, completion date, amenities beyond what the plans show.

## Languages
English (default) + Amharic toggle (`/am` or a client-side switch). Amharic copy is a draft until the client checks it; keep strings in one dictionary. Keep "m²" as is.

## Sections (starting point; design can refine)
1. Hero: the tower, brand, one-line promise, primary CTA (Book a visit) and secondary (Explore apartments).
2. Key facts strip: 14 residential floors, 126 apartments, 2 & 3 bedroom homes, 158–171 m².
3. The tower / story: "House of Peace", calm living in the heart of Garment.
4. **Interactive tower model** (the "creative model"): a 3D or 2.5D massing of the tower; hover/tap a floor to select it, then the floor's key plan with the 9 apartments, then the apartment's plan + specs. Must have a lightweight non-WebGL fallback.
5. Apartment types gallery: 9 plans with filters (2 bed / 3 bed), zoomable plan viewer.
6. Location: stylised map + nearby landmarks; "Open in Google Maps" link (search "Haile Garment, Addis Ababa"; no invented coordinates).
7. Why Dar Al Salam / payment flexibility.
8. Enquiry form (name, phone, preferred unit, message) → opens WhatsApp/Telegram/mailto from config; no backend for now.
9. Footer.

## Stack (coordinator's choice)
Astro (static output, zero JS by default, `astro:assets` for AVIF/WebP responsive images) + TypeScript + GSAP (ScrollTrigger, SplitText if useful; GSAP is free now) + Lenis smooth scroll + Three.js loaded lazily only for the tower model section. Plain CSS with custom properties (no Tailwind needed). Deployable as static files (GitHub Pages / Render static / Netlify).
