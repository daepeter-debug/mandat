# Finish packet — Parliament page polish

User: Claude started and left part of Mandát; continue his handoff. Exact handoff ../../../../SPRAVA-pre-codex-parlament.md (3 Oct 14:07): graphical finish of /parlament, actual evening render, 2D appearance/motion, phone controls, share PNG, dark theme. No news update or new visual world. User standing authorization permits deployment after verification.

Direction contract: ../../parliament-page-polish-brief.md. Authority: workspace root ../../../../../DESIGN.md, PRODUCT.md. No standalone QUALITY BAR card, approved comp, comp reproduction or new-world seed applies to this ordinary extension. Preserve paper/green ink/IBM Plex and the existing evening GLB. The small raster is an actual model-viewer toBlob export, not an AI picture. Origin sidecar: public/models/chamber-clubs-2026-10-01.webp.json. Preview date remains explicitly 1 Oct 2026 even when later data changes.

Sources in outputs/web: components/parliament-page.tsx, chamber-2d.tsx, parliament-ar.tsx, vote-share.ts; app/parliament-page.css, parliament-ar.css, theme-dark.css. The incoming deputy/vote logic and 150-seat geometry are unchanged. Material naming, voting wave and camera navigation remain compatible with Claude. The new neutral hotspot marks a selected deputy; same treatment for every deputy. Expanded chamber traps Tab and restores focus on Escape. The 2D selected pulse now ends after two repeats; reduced-motion disables it and entrance motion.

Required captures, all in this directory, opened by builder after capture:
- desktop-light.jpg and desktop-dark.jpg: final introduction / 2D, 1280 × 900 requested (provider returns 1265 × 889 with scrollbar). The light capture includes keyboard focus on 2D.
- 375-light.jpg, 375-dark.jpg: final introduction / 2D, 375 × 812 requested (provider bitmap 360 × 780).
- 402-light.jpg, 402-dark.jpg: introduction / full 2D, 402 × 874 requested (provider bitmap 387 × 841).
- desktop-light-fullscreen.jpg: actual 3D / current clubs, 1280 × 900.
- 375-dark-fullscreen.jpg, 402-dark-fullscreen.jpg, 402-light-fullscreen.jpg: actual 3D clubs with three rows of controls. The SVG positions and 3D camera are unchanged; no claim of official seating.
- 375-dark-selected.jpg: selected deputy, club colors, visible neutral hotspot.
- 375-light-vote-selected.jpg: selected deputy who voted differently, actual vote colors and dimming.
- desktop-light-differing.jpg: matching 2D selection, one undimmed / 149 dimmed seats and one club-difference ring (vote 57911).
- vote-card-long.png: actual exported 1080 × 1350 with long title (vote 58388), all five totals, rule and specific /parlament?h= link. Long legal titles intentionally ellipsize to four lines; complete title stays in linked page.

Do not review chamber-source.jpg: preliminary screenshot clip was malformed (provider ignored crop origin). chamber-render.png is clean toBlob source material only, not a page capture. Every required capture above is genuine, settled and shows the named state. Mobile tests use viewport sizing, not physical touch hardware. No physical Safari/Chrome iPhone, AR, FPS, VoiceOver or live reduced-motion emulation was available. Reduced-motion and offscreen/visibility handling checked in source only.

Browser DOM: no horizontal overflow at 375/402; all 150 2D dots; selected URL retains poslanec=1114, vote h=57911; camera target/marker correspond to seat; Tab and Shift+Tab wrap within dialog, Escape restores .par3d-expand. No browser error logs; existing development warnings from Lit/HDRLoader only. No timing/FPS claim. UI PNG generation verified; native device sharing not invoked.

One detector run on six changed targets: two pre-existing accent-border warnings in page CSS, both removed in the final correction. No second detector run. 18 verify scripts, tsc and ESLint passed before final source diff; final lint/build in progress. GLB validator zero errors/warnings, model byte-for-byte unchanged at 1,444,616 B. Generated validation timestamp churn restored.

Finish reviewer: read your definition C:/Users/peter.madar/Documents/Codex/2026-09-10/b/.agents/skills/impeccable/agents/impeccable_finish_reviewer.toml and craft-floor.md in the adjacent reference directory. No browser. Scope is the inherited visual finish, not a general audit of the whole site or the deputy dataset. Return five contract sections and disposition ship/fix/recapture/rebuild, save review.md in this directory. No source edits.
