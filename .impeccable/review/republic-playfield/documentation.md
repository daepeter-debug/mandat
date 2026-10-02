# Republic playfield — system continuity check

Disposition: ordinary extension; no design-system refresh is owed. Only this review record was written. Workspace-root `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json` and `outputs/web/docs/mala-republika/DESIGN.md` are preserved.

## Evidence checked

- System: workspace-root `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`; local `docs/mala-republika/DESIGN.md`.
- Contract and prior findings: `.impeccable/review/republic-playfield/packet.md`, `review.md`. The prior review asks for rail-width and nested-Escape corrections; it is not evidence that the corrected captures have been accepted.
- Extension source: `app/republic-playfield.css` and `components/republic-playfield.tsx` in full; sampled integrations in `components/republic-game.tsx`, `components/republic-map.tsx`, `components/republic-info.tsx`.
- Inheritance source: `app/republic-game.css`, `app/magazine.css`, `app/layout.tsx`. Font files remain the existing local IBM Plex Sans variable assets. Map terrain remains `/images/games/republic-terrain-v1.webp`; the legend and detail use existing `RepublicArt`.

This is a source-based documenter pass. The packet records browser captures and functional observations; those observations are attributed to the parent verification, not independently repeated here. Final corrected visual acceptance belongs in the review verdict.

## Comparison with the incumbent system

The extension continues the miniature Central European town: the diorama is the playable object, with compact paper controls and green actions. It introduces neither a replacement visual identity nor new imagery. The rail/footer paper (`#fffaf0`) is the supplied local extension surface; ink (`#20392f`), green control/header (`#245c48`), light overlay (`#fffefa`) and lime focus (`#dcf59b`) continue the existing family. These observed local surfaces do not replace root normative tokens.

The inherited IBM Plex Sans family remains in force. Extension type is deliberately compact: 10–12px supplementary copy/actions, 12px task titles at 650, 15px rail headings at 650, and a 13px town label at 600. From 700px, rail headings become 18px, task titles 14px and the town label 16px. The parent game heading remains `clamp(30px,3vw,42px)` at 550. This task-specific scale is not a new global type ramp.

Expanded layout uses a fixed `100dvh` viewport with safe-area padding, top resources, the left Tasks/Legend rail and four existing footer actions. The same children remain mounted under `RepublicPlayfield`; the existing town and pending move are reused. Base rail width is 146px, corrected wider-width rule is 230px from 700px, and the subsequent short-landscape rule is 190px at max-height 500px/min-width 560px. Collapsed width stays 48px. Corrected media selectors carry the base specificity and require `data-rail`, so they preserve the collapsed state.

The existing detail, catalog and placement surfaces are pinned above the footer, with 14px corners and a bounded scroll area. Their soft shadow and the footer shadow serve local overlay depth; they are not hard offset shadows or a replacement elevation vocabulary. Terrain and architecture continue to supply scene depth. No new motion rule is authored in the extension stylesheet.

Keyboard behavior preserves the local dialog contract: the expansion trigger is explicitly recorded, initial focus moves to Close, background branches become inert, and cleanup restores page scrolling, background state and trigger focus. Because the toolbar trigger unmounts during expansion, cleanup focuses the recorded trigger only when it remains connected; otherwise it selects the remounted `[data-playfield-open]` button. The corrected Escape handler checks default prevention, original event target/composed path and active nested dialog; the ancestor game handler excludes parcel dialogs. `InfoCard` consumes its own Escape. Source confirms these corrections are present. The parent reports a final browser check after Escape with focus on “Otvoriť herný plán na celú obrazovku” and body overflow restored; this is attributed functional evidence, not an independent documenter browser test.

## Five-line system summary

1. Palette: existing ink `#20392f`, green `#245c48`, paper `#fffaf0`, overlay `#fffefa`, lime focus `#dcf59b` and muted terrain greens.
2. Type: inherited local IBM Plex Sans; supplementary 10–12px, task titles 12/14px, rail headings 15/18px, town label 13/16px; no new global ramp.
3. Map-is-the-object rule: existing RepublicArt, raster terrain and the same mounted saved neighborhood remain the focal material.
4. Experience/Operate rule: immersive map, collapsible task/legend rail, resources above, existing actions below, and price/detail confirmation above the map.
5. Visible-state rule: textual counts/prices, pressed states, SVG control icons, 44px controls, visible focus, protected nested Escape and return focus continue incumbent behavior.

## Not canonized or repaired

Pre-existing record drift remains: root DESIGN frontmatter still describes the original large magazine display ramp while its later intro amendment records the smaller implemented headline; its sidecar is dated 12 September and retains original intro metadata. The local game document also retains earlier composition directions alongside dated later revisions. Existing global dark-theme support is visible in `app/layout.tsx` despite PRODUCT's older light-mode commitment. These are incumbent documentation/history discrepancies, not authorization to refresh the global system. Compact playfield sizes, local overlay shadows and rail dimensions are recorded only as observed extension evidence; no task-local rule is promoted into DESIGN or a new sidecar. Physical-phone gestures and Safari remain unverified as the packet states.
