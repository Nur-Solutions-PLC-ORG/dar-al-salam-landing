# 3D source assets (rev 10, DESIGN §9.10 F3)

Downloaded originals. `npm run assets:textures` (scripts/prepare-textures.mjs) converts them into the small WebP
files in `public/textures/`, which are what the site loads. Every asset here is **CC0** (public domain); no
attribution is required, but sources are recorded.

| Folder | Source | Licence | Used as |
|---|---|---|---|
| polyhaven-floor_tiles_08 | https://polyhaven.com/a/floor_tiles_08 | CC0 1.0 | Square ceramic tile with grout (also tinted for wet rooms and tile bedrooms) |
| polyhaven-laminate_floor_02 | https://polyhaven.com/a/laminate_floor_02 | CC0 1.0 | Light oak planks (the parquet finish), only where the plan labels PARQUET |
| polyhaven-painted_plaster_wall | https://polyhaven.com/a/painted_plaster_wall | CC0 1.0 | Wall plaster (normal and roughness only; colour from the token) |
| polyhaven-rough_linen | https://polyhaven.com/a/rough_linen | CC0 1.0 | Fabric (normal only) |
| polyhaven-oak_veneer_01 | https://polyhaven.com/a/oak_veneer_01 | CC0 1.0 | Light oak (colour and roughness) |

Licence: https://polyhaven.com/license (CC0). Files are the 1k JPG maps from the Poly Haven API
(`https://api.polyhaven.com/files/<asset>`), downloaded 2026-11-15.

No plant model is used: the CC0 potted plants on Poly Haven are 2–6 MB at their smallest, against the 40 KB budget,
so the plant is generated in code (src/scripts/explorer/furniture.ts) instead.
