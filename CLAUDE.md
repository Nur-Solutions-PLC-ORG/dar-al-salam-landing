# Dar Al Salam Real Estate: landing page

Public marketing site for Dar Al Salam Real Estate's Garment tower in Addis Ababa. Brief and facts: `docs/BRIEF.md`. Design spec: `docs/DESIGN.md` (owned by the design session).

## Team (Claude sessions on this machine)
- `landingpage-design` (coordinator): owns git, `CLAUDE.md`, `docs/BRIEF.md`, `brand-source/`.
- `realstate-frontend-design`: owns `docs/DESIGN.md` (direction, tokens, sections, motion spec).
- `realstate-frontend-impl`: owns the app code (`src/**`, `public/**`, config files).
- `realstate-frontend-review`: reviews milestones against BRIEF + DESIGN, writes no feature code, sends findings to impl and the coordinator.
- Only the coordinator runs git commands (add/commit/push). Others report "milestone ready" via SendMessage to `landingpage-design`.

## Git
- Commit as **Henok Enyew** (the global git identity). **Never** add `Co-Authored-By`, "Generated with Claude", or any AI attribution to commits or PR bodies.
- Commit subject: imperative, sentence case ("Add the unit explorer"), no conventional-commit prefixes. Body: short "why" bullets.
- Branch `main`. Remote: `Nur-Solutions-PLC-ORG/dar-al-salam-landing` (private).
- Never commit the client file `Abdi ppt.pdf`.

## Quality bar
- Fully responsive 360 → 1920 px, no sideways scroll, ≥ 44 px tap targets on touch, form controls ≥ 16 px (iOS zoom). Never `maximum-scale` / `user-scalable=no`.
- Check at 360 / 390 / 768 / 1024 / 1366 / 1920 px.
- Performance: Lighthouse mobile ≥ 90 performance, ≥ 95 accessibility/best-practices/SEO. LCP image preloaded and responsive (AVIF/WebP). Heavy libraries (Three.js etc.) loaded lazily and only when their section is near the viewport. Animate only `transform`/`opacity`/`clip-path`. Pause rAF loops off-screen.
- `prefers-reduced-motion`: every animation has a calm fallback; content is never hidden behind JS (no-JS shows everything).
- WCAG AA contrast, visible focus rings, semantic landmarks, alt text.
- Don't invent facts (phones, addresses, prices, amenities). Missing values live in one config file (`src/data/site.ts`) marked `TODO(client)`.
- No published prices: "Contact for price" / "Request pricing".
