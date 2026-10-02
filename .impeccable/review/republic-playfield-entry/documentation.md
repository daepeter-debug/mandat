# Republic playfield entry — continuity check

Disposition: narrow discovery correction within the existing visual system. Only this documentation record was written. Workspace-root `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json` and local `docs/mala-republika/DESIGN.md` remain preserved; no system refresh or new sidecar is owed.

## Evidence checked

- `components/republic-map.tsx:179–184`: zoom/center controls retain their own row; a separate labeled button immediately below them reads “Hra na celú obrazovku”, calls the existing `playfield.open(event.currentTarget)`, and retains `data-playfield-open`. Its Lucide SVG is decorative (`aria-hidden`); the visible words identify the action.
- `app/republic-playfield.css:2–4`: near-full-width control with 10px side margins, 48px minimum height, 8px corners, green `#245c48`, light text `#fffefa`, existing IBM Plex Sans Variable at 13px/600 with 1.4 line-height; hover deepens to `#1c4939`, focus uses a 3px lime `#dcf59b` outline with 2px offset.
- `components/republic-playfield.tsx:65–68`: closing restores the connected original trigger or the remounted `[data-playfield-open]` node. The discovery correction changes the visible entry, without changing the expansion handler or focus-return selector.
- Incumbent root `DESIGN.md` palette/family, root `.impeccable/design.json` palette metadata and local game `docs/mala-republika/DESIGN.md` miniature-town direction were compared with these sources. Previously checked PRODUCT constraints and system-history evidence remain recorded in `../republic-playfield/documentation.md`.

Source confirms continuity with the incumbent green controls, paper text, local font and soft corner vocabulary. The label resolves the user's difficulty finding an icon-only entry while the same mounted game opens. The button is a task-local discovery improvement, not a new global action style or layout rule. No imagery, identity, game economy or saved fields are added.

The parent reports a 375px browser check: the label is visible, opens the same plan and receives focus after closing. The parent also reports passing tests and build. These are attributed verification results; this documenter pass independently checks source and system continuity only.

## Five-line system summary

1. Palette: incumbent green `#245c48`, paper `#fffefa`, lime focus `#dcf59b`; deeper green hover `#1c4939` remains a local action state.
2. Type: existing IBM Plex Sans Variable, visible 13px/600 action text at 1.4 line-height; no new type ramp.
3. Map-is-the-object rule: the same diorama and mounted saved town remain the focal material.
4. Discoverable-action rule: “Hra na celú obrazovku” appears directly below map zoom controls with a 48px minimum target.
5. Visible-state rule: text identifies the action, SVG supports it, focus remains visible and returns to the remounted entry when needed.

## Not canonized or repaired

No new craft defect or visual-system divergence was found in this narrow entry correction. Earlier recorded global metadata/history drift remains unrepaired because the authorized work concerns entry discoverability; no compact label, hover value or task-specific positioning is promoted into global DESIGN tokens. Physical-phone/Safari verification remains outside the reported browser check.
