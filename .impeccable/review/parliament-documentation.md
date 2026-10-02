# Parliament3D documentation finish — 2026-10-02

Scope: completed incumbent-scene extension, selected **C — Večerná sála**, with sourced chair-back logos and original party colors. No new app identity or system-wide design change.

## Evidence checked

- Root `PRODUCT.md` and `DESIGN.md`; Impeccable `reference/document.md` and the new-work finish requirement.
- `components/parliament-ar.tsx`, `app/parliament-ar.css`, `scripts/build-parliament-glb.mjs`, `scripts/parliament-textures.mjs`, shared `lib/parliament-model.ts`, logo registry, validator script/report, package scripts and the first `DATA-CHANGELOG.md` entry.
- `capture-sheet.webp`: the original 21 loaded states, including desktop 1280×800, light/dark themes, parties, selected party, blocs with/without partners and 2023.
- Inspected final `confirm-402-dark-party.png`, `confirm-375-light-leaders.png` and `confirm-402-dark-leaders.png`; matched the final review's bounded `ship` disposition. Its other required confirmations are `confirm-402-light-leaders.png` and `confirm-375-dark-leaders.png`.
- Parent-reported passing verify-data, deterministic regeneration, tsc, full ESLint, build and build-dark check; stored Khronos report independently records 0 errors and 0 warnings. Existing GLB file size is 1,326,400 bytes.
- Parent confirmed deployment at `https://mandat-preview.mandat.workers.dev`, version `8da79398-4892-4a52-8426-dfeae394de27`, pushed main `4f5c896`. Public loaded Parliament had no console errors (`parliament-online.png`); public GLB size and SHA-256 `95EB0AB0EE00E1CA1C250877451197B5BD778B4B4A3446D83AE446257F139330` match local. Physical-device checks remain unverified.

## Recorded outcome

`docs/parliament-3d.md` records final appearance, state behavior, source-of-truth counts, preserved variants/material names, logo provenance and historical fallback, generation commands, responsive layout and evidence limits. `../../parliament-3d-concepts/BRIEF.md` now records confirmed C and the logo requirement.

The mobile confirmation captures use CSS viewports 402×874 and 375×874; provider bitmaps are scaled to 387×841 and 360×839. Physical Safari/Android AR and 60 fps were not verified. The review resolves selected-party clipping, label separation and displaced-label sector association; its `ship` covers that bounded fix list.

## Five-line system summary

Palette: incumbent paper, pale panel and green ink surround a walnut/charcoal chamber with warm local lighting.
Type: existing IBM Plex Sans Variable; modal title 20px, caption title 15px, description 13px, control/count labels approximately 12–12.5px.
Layout: full-screen mobile dialog, explicit stage height and caption/legend in document flow; bounded desktop modal from 761px.
Named rule: party colors identify data; sourced logo materials stay separate from recolored upholstery and every subject gets equal effects.
Motion: one seating introduction, stable camera, short variant wave, reduced-motion bypass and hidden-scene pause.

## Not canonized or repaired

Pre-existing root context drift about absent logos, light-only intent and lack of browser evidence is reported, not repaired outside the write boundary. The local stage gradient and label shadows describe this rendered chamber only; they are not promoted to new global design rules. Root `PRODUCT.md`, `DESIGN.md` and the design sidecar were preserved.
