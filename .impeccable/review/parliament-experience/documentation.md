# Parliament experience — documentation handoff

2 October 2026. Ordinary extension of the confirmed Večerná sála direction. Documentation, final browser evidence, reviewer disposition and deployment confirmation are recorded.

## Evidence checked

- Read the confirmed five-change contract in `.impeccable/parliament-experience-brief.md`, the Impeccable document reference and new-work finish instructions.
- Compared `components/parliament-ar.tsx`, `app/parliament-ar.css`, `lib/parliament-experience.ts`, `scripts/parliament-textures.mjs` and `scripts/build-parliament-glb.mjs` against the contract, current `docs/parliament-3d.md`, latest `DATA-CHANGELOG.md` entry and inherited root product/design context.
- The parent supplied completed verification: `verify-parliament-experience`, `verify-data`, GLB checks with Khronos 0 errors/0 warnings, TypeScript, full ESLint, generated dark CSS checks and production build; detector findings were `[]`. This documenter did not rerun those checks.
- Current GLB is reported as 1,326,416 bytes, under the 1,500,000-byte budget. Counts, original party colors, logos, scale and `prieskumy` / `volby-2023` variants remain unchanged.

## Documentation updated

`docs/parliament-3d.md` now describes the clean stage without floating seat labels, controls above it, the interruptible approximately three-second camera introduction with replay/skip, focus calculated from actual seats, detail logo/name/count and “Celá sála”, material hit-testing for both upholstery and seat logos, and drag/pinch exclusion.

It documents any-party user coalition selection, retained selected party colors, neutral remaining upholstery, animated count, 76-seat majority, clear selection, reset on variant change and explicit wording that the combination is neither an endorsement nor a prediction. It records PBR rounded upholstery, walnut roughness, directional warm HDR/contact shadows and the current mobile stage height. The regeneration instructions include `verify-parliament-experience`.

Source recheck confirms explicit `animation-name="obsadenie"` and clip activation via `play()`, then `pause()` and seek to 3 seconds before the camera tour. The browser reopen check confirmed all 150 seats. This sequencing is documented to preserve the fix.

Historical screenshots and hotspot review are explicitly distinguished from the current interaction model. The final review and deployment evidence below complete this documentation handoff.

## Inherited identity preserved

The extension continues the paper/sage/green ink palette, IBM Plex Sans, existing focus/text/border tokens, compact controls and factual party-color treatment. The evening material world belongs to this stage; no new application identity is introduced. Root `PRODUCT.md`, `DESIGN.md` and `.impeccable/design.json` were preserved. Their earlier claims about unavailable logos, light-only UI, browser evidence and deployment are pre-existing drift, reported without repair.

## Final browser evidence

The parent supplied the final validated captures, opened individually and confirmed current: 1280 × 800 desktop in light/dark, 402 × 874 mobile CSS viewport in light, 375 × 874 in dark. Desktop files are `desktop.png`, `desktop-detail.png`, `desktop-coalition.png`, `desktop-blocs.png`, `desktop-2023.png`, `desktop-dark.png` and `desktop-dark-detail.png`. Mobile files are `mobile.png`, `mobile-detail.png`, `mobile-coalition.png`, `mobile-dark.png`, `mobile-dark-detail.png`, `mobile-dark-coalition.png`, `mobile-dark-2023.png` and `mobile-intro.png`, all under this review directory.

Actual UI checks supplied by the parent passed: blue-chair click at (735, 302) opened PS with 34 seats; drag from (735, 302) to (670, 352) did not select; “Celá sála”, replay/skip, clear to 0, PS + REPUBLIKA + SaS + KDH = 81, election 2023 SMER + HLAS + SNS = 79, variant reset to 0 and reopen with all 150 seats. Console errors were `[]`. These combinations are test inputs, not endorsements.

## Final review and deployment

Read `review.md`: **disposition: ship**, no material fixes within the confirmed five-part extension scope. The reviewer opened all fifteen required captures and assessed the inherited evening-chamber direction; the missing separate QUALITY BAR card limits comparison to the inherited direction and confirmed brief. Physical AR, device performance and live reduced motion remain outside the review evidence.

The parent supplied successful `npm run deploy:preview`: version `137391a5-2663-4159-ae97-0b3582c93d92` at [Mandát preview](https://mandat-preview.mandat.workers.dev/). Functional commit after rebase: `01b203c`; evidence: `a8a79e9`. Merged Claude commit `2d015a8` (Tridsiatka online) was preserved. After rebase, all parliament/data/quiz checks, dark CSS check, TypeScript, ESLint for `app`, `components`, `lib`, `scripts`, `worker` and production build passed again.

Public GLB size is 1,326,416 bytes; SHA-256 `41D82EC5F36DF932C882212208BD88E44E8FC24967B95E0895F46637795B588C` matches the local model. The parent verified the online coalition PS 34 + REPUBLIKA 21 + SaS 14 + KDH 12 = 81 and majority attained; `online.png` records this state, with console errors `[]`. This deployment evidence does not extend the physical-device or reduced-motion coverage.

## Verification limits

Reduced-motion handling is implemented and source-checked; browser emulation was unavailable. Physical Safari/Android, AR and 60 fps remain unverified on real devices. Those limits must remain explicit after deployment.

## Write boundary

Only `docs/parliament-3d.md` and this documentation handoff were edited. No implementation source, global product/design artifacts, generated models or Git state were changed by this documenter.
