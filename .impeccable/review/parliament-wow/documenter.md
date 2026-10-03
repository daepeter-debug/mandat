# Documenter — parlament A + B

**Stav: prvý lokálny prototyp; čaká na Petrovu vizuálnu spätnú väzbu.** Žiadne nasadenie ani commit v tomto dokumentačnom kroku.

## Hranica a dôkazy

Dokumentácia opisuje implementáciu schválenú v `../../parliament-wow-brief.md`. Bola prečítaná rola `impeccable_documenter.toml` aj celá referencia `reference/document.md`. Tento rozsah je schválené lokálne rozšírenie; koreňové `PRODUCT.md`, `DESIGN.md` a `.impeccable/design.json` sa nemenili.

Skontrolované zdroje: `scripts/build-parliament-glb.mjs`, `scripts/parliament-textures.mjs`, `components/parliament-display.tsx`, `lib/parliament-display.ts`, vzorka `components/parliament-ar.tsx`, celý `app/parliament-ar.css` a oba overovacie skripty pre tabuľu a GLB. Vizuálne boli otvorené `1280-light.png` a `375-dark.png`. Správa o 19 overovacích skriptoch, TypeScript, linte, dark CSS, builde a glTF validácii vychádza z výsledkov implementačnej kontroly; dokumenter tieto príkazy neopakoval.

## Päťriadkový súhrn systému

1. Paleta: zdedený papier a zelený atrament v ovládaní; teplé drevo, mosadz a večerné okná v sále; politické farby nesú len údaje.
2. Typografia: IBM Plex Sans; canvas používa váhu 600 a základ 68 px v textúre, statický súhrn sa prispôsobí jej šírke; ovládanie má zdedenú kompaktnú škálu.
3. Pravidlo architektúry: panoráma patrí za okenné rámy; tabuľa patrí do dreveného obkladu pod oknami a nad zadné kreslá.
4. Pravidlo faktov: 150 spoločných kresiel a kontrakty variantov ostávajú; 348 súhrnov a väčšiny sa zobrazujú presne bez mutácie dát.
5. Pravidlo pohybu: posun ide zľava doprava, zastaví sa pri neviditeľnosti alebo používateľskej pauze; obmedzený pohyb má statický súhrn.

## Výstup a hranice

Napísané: `docs/parliament-wow-preview.md` a tento záznam. Handoff rozlišuje lokálny prototyp od celej roadmapy, uvádza skutočné veľkosti GLB/JPG/HDR, vlastný analytický HDR bez externého sťahovania a hranice zariadení, FPS, AR a videa.

**Nekanonizované a neopravované:** staršie rozpory koreňových systémových dokumentov a malý náhľad z predchádzajúceho renderu. Prvé sú mimo schváleného rozsahu; obnova náhľadu čaká na Petrovu spätnú väzbu. Fotorealistická zhoda s návrhovými obrázkami ani dokončenie celej roadmapy sa netvrdí.
