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
- High-rise residential tower, "two block layout". Basement: parking + offices. Ground floor: offices/commercial. **126 apartments** across the residential floors (see the 2026-11-14 update below: 16 floors, 2-bedroom floors).
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
- **Update 2026-11-14 (from the client, via the user):**
  - **16 floors.** The client is adding a 16th floor; the site says **16 floors** and keeps **126 homes**. We only have plans for the typical residential floors 1–14, so the explorer shows those and notes "16th floor planned". Don't invent a per-floor breakdown for floors 15–16.
  - **2-bedroom homes (BL01) only on floors 4, 6, 8, 10 and 11.** What sits in the BL01 corner on the other floors is **not confirmed yet**: show it as "To be confirmed" in the explorer, never as a 3-bedroom or as missing.
  - **Exact location:** https://maps.app.goo.gl/4Ed5VBCaYGvbbY6X9 (the client's pin; Google place id `0x164b81003f901365:0x2aba21e4438756c4`). Use this link for "Open in Google Maps" / "Get directions" instead of the "Haile Garment" search. Still no hand-typed coordinates; the location diagram stays "not to scale".
  - **Coordinates (from the client's own pin, resolved 2026-11-14):** the link opens the Google place "Dar al Salam Real Estate" at **8.9356809, 38.7299505**. These replace "no coordinates": the location section may now show a real satellite map with a pin there, and "Get directions" can use `https://www.google.com/maps/dir/?api=1&destination=8.9356809,38.7299505`.
  - **Satellite map (client request):** "realistic satellite image with a pin", e.g. Leaflet or Mapbox. No Mapbox token exists, so use a keyless imagery source with its required attribution (e.g. Esri World Imagery via Leaflet), loaded lazily only near the section, with a static fallback.
  - **Telegram contacts (client request):** add a "Contact us on Telegram" block to the Book a visit section with **@abdulaziz_a12** and **@monur14** (links `https://t.me/abdulaziz_a12`, `https://t.me/monur14`). These are the first confirmed contacts, so the enquiry form can now send via Telegram. No names or roles are given for them; don't invent any.
  - **Building features (confirmed):** garbage chute on every floor, standby lift, underground water, parking. Basement parking is also shown on the plans. Use the wording "underground water"; don't specify borehole vs tank.
- **Tower film:** `brand-source/video/` (rendered fly-through, 41 s, 640×352, H.264 with a music track). It's low resolution, so never show it full-bleed or stretched; see DESIGN for the treatment.
- **Prices: do not publish.** Use "Request pricing". Payment is flexible (pay any amount over time until fully paid; a unit is reserved with an initial payment). It's OK to say "Flexible payment plans".
- **Unknown (put in `src/data/site.ts` as `TODO(client)` and render gracefully):** phone, WhatsApp, Telegram, email, office address, social links, completion date, amenities beyond what the plans show.

## Languages
English (default) + Amharic toggle (`/am` or a client-side switch). Amharic copy is a draft until the client checks it; keep strings in one dictionary. Keep "m²" as is.

## Sections (starting point; design can refine)
1. Hero: the tower, brand, one-line promise, primary CTA (Book a visit) and secondary (Explore apartments).
2. Key facts strip: 16 floors, 126 apartments, 2 & 3 bedroom homes, 158–171 m².
3. The tower / story: "House of Peace", calm living in the heart of Garment.
4. **Interactive tower model** (the "creative model"): a 3D or 2.5D massing of the tower; hover/tap a floor to select it, then the floor's key plan with the 9 apartments, then the apartment's plan + specs. Must have a lightweight non-WebGL fallback.
5. Apartment types gallery: 9 plans with filters (2 bed / 3 bed), zoomable plan viewer.
6. Location: real satellite map with a pin at the client's coordinates (see update) + nearby landmarks; "Open in Google Maps" and "Get directions".
7. Why Dar Al Salam / payment flexibility.
8. Enquiry form (name, phone, preferred unit, message) → opens WhatsApp/Telegram/mailto from config; no backend for now. Plus a "Contact us on Telegram" block (@abdulaziz_a12, @monur14).
9. Footer.

## Stack (coordinator's choice)
Astro (static output, zero JS by default, `astro:assets` for AVIF/WebP responsive images) + TypeScript + GSAP (ScrollTrigger, SplitText if useful; GSAP is free now) + Lenis smooth scroll + Three.js loaded lazily only for the tower model section. Plain CSS with custom properties (no Tailwind needed). Deployable as static files (GitHub Pages / Render static / Netlify).
