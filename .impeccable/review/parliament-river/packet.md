# Parliament river polish — final packet, 3 October 2026

Repository: C:/Users/peter.madar/Documents/Codex/2026-09-10/b/outputs/web.
Authority: workspace PRODUCT.md and DESIGN.md two levels above repository; .impeccable/parliament-river-polish-brief.md and outputs/SPRAVA-pre-codex-pozadie-a-tabula.md (outside repository).

Ordinary refinement of Claude's 91ebc51 whole-stage city and ten-field wall board. No new world, approved comp reproduction, roll seed or standalone QUALITY BAR applies. Earlier A/B comps are superseded by the user's whole-stage request, not a pixel specification. Preserve factual colors, data, 150 coordinates and functional UI.

User requirements: more polished graphics; both Bratislava landmarks visible; floating brown floor replaced with intentional terrace; LED board; ticker full vote title/date without duplicate counts; new real preview. Latest explicit problem: static background while chamber zooms/pans. Controlled camera now drives both scene and layered plate directly, with depth-aware scaling and target translation. This is 2.5D illustration, not a 360-degree city reconstruction.

Required captures in THIS directory, all personally opened by parent after settling camera: final-desktop-light.png, final-desktop-dark.png (1280×720); final-375-light.png, final-375-dark.png, final-402-light.png, final-402-dark.png (height874); vote-desktop.png and vote-402.png. Earlier captures without final prefix are superseded; do not judge transient/cropped earlier shots. Reset and resize now snap camera via public Lit updateComplete / model-viewer jumpCameraToGoal, avoiding a suspended halfway transition. Close button is focused in final captures to keep document top visible.

Functional evidence from browser: city CSS zoom changed from1.00036 to1.06283 after zoom; pan changed0→0.01831 after keyboard translation. Desktop,375,402 document widths equal scrollWidths; console error log empty. Real latest vote shows90 za,0 proti,52 zdržali,0 nehlasovali,8 neprítomní,72 potrebných,0 inak ako klub. Full title/date preserved. Native physical iPhone, Safari, frame rate and continuous animation smoothness not tested.

21 verify scripts passed; TS, ESLint, production build passed; dark CSS current; GLB1492072B, zero Khronos errors/warnings. One targeted Impeccable detector returned[]. Panorama generated at native2172×724, JPEG331KB, actual prompt embedded; no upscaling. Preview is a real viewport crop1209×518, provenance sidecar. Two shipping raster assets scan with zero missing provenance.

Read-only implementation review; source targets components/parliament-ar.tsx, parliament-backdrop.tsx, parliament-wall.tsx, lib/parliament-backdrop.ts, parliament-display.ts, app/parliament-backdrop.css, scripts/build-parliament-glb.mjs. No browser, servers or source edits. Write only review.md here. Scope is this visual/interaction refinement, not politics, games or a site-wide redesign. Return five contract sections and disposition ship/fix/recapture/rebuild, material defects only.
