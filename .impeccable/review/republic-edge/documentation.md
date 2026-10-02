# Mobile expanded map — implementation record

Disposition: **ship**, as recorded in `review.md`; no material fixes remain in the supplied review. This record describes the finished, narrow adaptation requested after Peter rejected landscape letterboxing and the reserved bottom toolbar band. It creates no new visual world or normative design tokens.

## Implemented behavior

- Expanded landscape at widths up to 1100px uses the full available map pane, with tasks in a separate right rail. The root has no exterior mobile safe-area padding or reserved bottom band. Grass, trees, flowers and stream reach the exposed landscape edges.
- `lib/republic-display.ts` computes the landscape camera from the pane dimensions and left safe inset. One scale fits the unchanged 36-plot board and roof bounds; the camera fills both axes. Non-landscape rendering retains the original 640 × 480 frame and fitted width.
- `components/republic-map.tsx` measures the expanded pane with `ResizeObserver`, reads the CSS left safe inset and applies the camera to the SVG. The raster terrain and river use the same decorative expansion transform. Buildings, plot coordinates, residents and playable overlays retain their original geometry rather than stretching with the terrain.
- `app/republic-playfield.css` floats the compact header over scenery. Four 44px zoom/grid/reset controls stack at left; construction actions stack at right. Controls, task rail and detail panels retain safe insets. Placement and detail panels fit between the control stacks.
- Portrait retains the rotation prompt and return action. Desktop retains its left rail, fitted board and bottom actions. The ordinary page keeps its original map frame; the layout changes are scoped to the expanded surface.

## Incumbent preservation

The existing miniature Central-European town remains the material reference: cream architecture, terracotta roofs, muted green vegetation, illustrated residents and wishes, warm paper panels and green controls. IBM Plex Sans remains the interface family. The inherited ink (`#20392f`), control green (`#245c48`), paper surfaces (`#fffaf0` / `#fffefa`) and pale selected surface (`#e2edce`) continue in the sampled CSS; no replacement palette or type ramp was introduced.

Workspace `PRODUCT.md` and `DESIGN.md`, all local product/design documents including `docs/mala-republika/DESIGN.md`, and all existing `.impeccable/design.json` files are preserved. The documenter's only write is this implementation record. Floating mobile controls are a scoped response to the user's full-playfield request, not a system-wide requirement. Existing identity, content, saves, economy and game rules remain inherited.

## Evidence and validation

Source sampling covered `app/republic-playfield.css`, `components/republic-map.tsx`, `lib/republic-display.ts`, `scripts/verify-display.mjs` and the inherited fullscreen/orientation cleanup in `components/republic-playfield.tsx`. The local design brief and workspace product/design records supplied the incumbent boundary.

All six final captures were inspected for this record: `mobile.png` (festival, 844 × 390), `confirmation.png` (C4 pending confirmation, 844 × 390), `town-mobile.png` (construction, 844 × 390), `small-mobile.png` (construction, 667 × 375), `portrait.png` (rotation prompt, 375 × 844) and `desktop.png` (construction, 1280 × 900). They support the edge-filled mobile landscape, readable right task rail, visible C4 confirmation, floating controls and retained desktop composition. These final images replaced earlier malformed construction captures.

The input packet reports all 13 verification scripts, TypeScript, final ESLint, `build-dark --check`, `diff --check` and production build passing. `verify-display.mjs` checks both-axis coverage, all plot/roof bounds, safe-inset/control clearance and determinism. Reported browser checks cover C4 confirmation, zoom/reset, F1 detail on small mobile, portrait exit focus/overflow and no warnings/errors. Test resources remain 9 coins / 6 materials. This documentation pass does not add independent execution claims.

## Limits and uncanonized drift

The captures are CSS viewport fallback evidence. They do not establish native fullscreen, orientation locking, physical touch, Safari/Chrome device behavior or actual notch clearance. Native fullscreen and landscape lock remain progressive behavior in the inherited component; unsupported or denied requests retain the viewport fallback. Hardware verification remains outstanding.

No defect is promoted into a design rule. The predecessor's acceptance of green mobile margins and a bottom band is superseded by this explicit revision; the preserved desktop fit and unrelated incumbent system are outside that mobile change. The fresh review reports no material fixes, and no unrelated drift was repaired.
