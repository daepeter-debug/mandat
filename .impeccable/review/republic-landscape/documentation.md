# Malá republika — landscape adaptation record

Date: 2 October 2026. Documentation outcome: local implementation record only. The finish review in `review.md` has disposition **ship** for the scoped landscape adaptation. No new visual world or system token change was approved or found, so the workspace `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, and `docs/mala-republika/DESIGN.md` remain untouched.

## Current contract

Peter's current request is a complete board in the expanded landscape phone view, with tasks on the **right** to accommodate the iPhone sensor housing on the left. This supersedes the predecessor `.impeccable/review/republic-playfield/packet.md` instructions for a portrait layout, left task rail, and viewport-only expansion. There is no `packet.md` in this landscape review directory; the current contract is recorded in the supplied finish review and implemented source.

## Implementation record

- `components/republic-map.tsx` fits the existing SVG world (`viewBox="-40 0 640 480"`) to its available expanded pane. `lib/republic-display.ts` returns the largest integer width that fits both pane dimensions; `ResizeObserver` updates the fit when the pane changes. Expanded zoom has its own initial value of 1; deliberate zoom still permits panning. The town, map geometry, saved coordinates, and mounted game children are reused.
- `app/republic-playfield.css` places the map in the left column and the task/legend rail in the right column at landscape widths up to 1100px. The short landscape breakpoint supplies a 190px expanded rail; its content scrolls independently. The permanent upper map heading is hidden, and the compact header and map controls sit over the scenery. Desktop keeps the incumbent left rail.
- Portrait phones up to 600px show “Otoč telefón na šírku,” instructions about the rotation lock, and “Späť k bežnej mape.” The header also retains a close action. This is the fallback when the player has not rotated the phone.
- The expanded shell uses the dynamic viewport (`100dvh`) and CSS safe-area insets. `app/layout.tsx` supplies `viewportFit: "cover"`. These are implemented accommodations for available viewport and inset information; they are not evidence of physical notch behavior.
- `components/republic-playfield.tsx` attempts native fullscreen from the mobile opening gesture only when the browser reports support and another fullscreen session is absent. After success it attempts a supported landscape orientation lock. Rejection leaves the expanded viewport view available, and unsupported locking leaves manual rotation available. Closing releases fullscreen and orientation state owned by this view, restores background inert/overflow state and scroll position, and returns focus. Safari and Chrome compatibility therefore rests on a viewport fallback rather than guaranteed native fullscreen or automatic rotation.

## Inherited system preserved

Palette: warm task paper (`#fffaf0`), dark green ink (`#20392f`), green controls (`#245c48`), pale green shell (`#eaf0de`), and the existing illustrated terrain.

Typography: IBM Plex Sans continues the inherited voice; the rail uses compact 11–15px task text in the narrow treatment, with larger 14–18px headings where the wider breakpoint applies. Portrait rotation guidance uses a 25px heading and 15px body text.

Material: the woodland, stream, grass, miniature architecture, and residents remain the scene's visual substance. This pass introduces no image generation or new asset family.

Layout rule: base expanded zoom fits the whole playable board; the landscape phone task rail occupies the right edge and scrolls separately. This is a local surface behavior, not a new global design-system rule.

Interaction rule: expansion reuses the mounted game and pending action; clear close/return controls and the portrait rotation instruction provide recovery paths.

## Evidence and limits

The finish review validates four current captures: `mobile.png` (844 × 390), `portrait.png` (375 × 844), `desktop.png` (1280 × 900), and `confirmation.png` (844 × 390). It records the complete playable diamond at base zoom, readable right-rail tasks, the C4 placement confirmation beside the map, the portrait return action, and the preserved desktop composition. The rejected portrait crop in Peter's supplied phone photo is reference evidence, not a test of the new implementation on that device.

Source sampling for this documentation covered the playfield component and stylesheet, map fitting and sizing, viewport metadata, the display verification script, root product/design documents, and the inherited local game design document. `scripts/verify-display.mjs` checks fitting bounds, largest integer fit, invalid/hidden dimensions, and representative pane sizes. The finish review reports parent-run verification scripts, typecheck, lint, and build passed; this documentation pass did not rerun those checks.

Native Fullscreen API execution, native orientation locking, physical Safari and Chrome operation, actual iPhone notch insets, touch behavior on physical phones, and browser/status-bar removal remain **unverified**. The ship disposition applies to the supplied browser captures and sampled implementation, with those device limits explicit.

Defects or drift not canonized or repaired: none introduced by this adaptation in the accepted review; the superseded predecessor topology and untested native/device behavior are recorded as scope and evidence limits, not promoted into design-system rules.
