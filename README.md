# Dar Al Salam Real Estate: landing page

Marketing site for the Garment tower in Addis Ababa: 16 floors (16th floor planned), 126 apartments, 2- and 3-bedroom homes of 158–171 m². English at `/`, Amharic at `/am/` (the Amharic copy is a draft until the client checks it).

## What's on the page
- **Hero, facts and story**: the tower render inside the logo's dome shape.
- **Tower explorer** (`#explore`): pick a floor, then one of its 9 apartments on the key plan, then see the plan and specs. Links like `#explore/f7/bl05` open a view directly. Three versions: a build-time SVG drawing (no JS), an interactive SVG for slow connections or no WebGL, and a Three.js model that loads only near the section.
- **Apartment types**: 9 plans with filters, size sort and a pan/zoom plan viewer.
- **Location, payment and enquiry**: the enquiry form opens WhatsApp, Telegram or email from config, prefilled with the chosen apartment.

## Run it
Node 22.22+.
```sh
npm install
npm run dev        # http://localhost:4321
npm run check      # type and template checks
npm run build      # static site in dist/
npm run preview    # serve dist/ (Astro 7 runs it as a daemon: `npx astro preview stop` to stop it)
```

## Before launch: fill in the client's details
Everything the client hasn't confirmed is an empty value marked `TODO(client)` in **`src/data/site.ts`**. The page hides anything that's empty.
- `contact.whatsapp`, `contact.telegram` or `contact.email`: **at least one is required**, or the enquiry form stays disabled with a "being set up" note.
- `contact.phone`, `contact.address`, `contact.hours`, `social`, `project.completion`.
- `url`: the production domain, used for canonical, hreflang and Open Graph links.

Prices are never published. The page says "Request pricing" / "Prices on request".

## Deploy
`dist/` is plain static files, so any static host works (Netlify, Cloudflare Pages, Render static site, GitHub Pages). Build command `npm run build`, publish directory `dist`.

## Docs
- `docs/BRIEF.md`: the facts the page may state and the brand.
- `docs/DESIGN.md`: the design spec (tokens, sections, motion, explorer, performance budget).
- `brand-source/`: original assets from the client's brochure and logo.
