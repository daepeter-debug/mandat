# Herňa

Záložka **Herňa** (`?v=game`) združuje hry webu. Výber hry je v adrese ako `g=majority` alebo `g=december`, takže sa dá zdieľať odkaz priamo na hru; návrat „Všetky hry“ vráti fokus na kartu, z ktorej sa odišlo. Herňa je ľahká — každá hra sa načíta až pri otvorení.

## Denná väčšina (`components/daily-game.tsx`, `lib/daily-game.ts`)

Logický hlavolam: šesť fiktívnych strán, zostav najtesnejšiu koalíciu, ktorá splní pravidlá. Denná výzva zo zrnka dátumu + tréning. Uloženie `mandat:daily-majority:v1:<deň>`.

## Do decembra (`components/december-game.tsx`, `components/december-town-art.tsx`, `lib/december-game.ts`)

Verzia 2 (20. 9. 2026): dvanásť mesiacov, každý mesiac jedna mestská správa s **troma možnosťami**. Všetkých 30 udalostí má samostatne napísaný tretí kompromis. Školy, Zdravie a Doprava sú na stupnici 0–10. Mesto vyberá +1 mincu mesačne, rozhodnutia môžu bilanciu zmeniť; odložené účty a odmeny prídu v uvedenom mesiaci. V apríli, júli a októbri klesnú všetky oblasti o 1 bod vplyvom opotrebovania; hra mesiac vopred varuje. Dlh pridáva ďalší mesačný pokles o bod. Nula končí hru. Tri hviezdy = všetko aspoň 7 a rezerva aspoň 3 mince; dve = všetko aspoň 5 a bez dlhu; jedna = prežitie.

- **Sezóna zo zrnka.** Denná sezóna je pre všetkých rovnaká (zrnko z dátumu v slovenskom čase). Správa mesiaca sa vyberá zo správ povolených v danom mesiaci, ktoré ešte neprišli a nekolidujú s tým, čo je už vyriešené (opravený most sa druhýkrát nepokazí). Výber je deterministický: rovnaké rozhodnutia = rovnaký rok.
- **Férovosť.** Pri troch možnostiach existuje až 531 441 ciest. Generátor používa ohraničené hľadanie (96 stavov na vrstvu), ktoré musí nájsť konkrétnu cestu na tri hviezdy; potom overuje, že opakovanie samotnej možnosti 0, 1 alebo 2 na tri hviezdy nestačí. Nie je to vyčerpávajúca analýza všetkých ciest. Funkcia `survey` vzorkuje 256 deterministických náhodných ciest na vyhodnotenie náročnosti, neprezentovať ich ako úspešnosť reálnych hráčov. Nový generátor používa Mulberry32 a cache najviac 32 plánov. Overený záložný plán ostáva pri vyčerpaní 24 pokusov.
- **Scéna.** Nový obrazový atlas `public/images/games/town-seasons-v2.webp` (približne 671 KiB) má štyri ročné obdobia a nahrádza pôvodný SVG render v hre, pohľadnici aj Herni. Interaktívne značky školy, polikliniky a dopravy ukazujú presné zmeny z príznakov. Ilustrácia je sezónna; netvrdíme, že samotné budovy v obrázku fyzicky menia tvar pri každej investícii. Pôvodný SVG komponent ostáva v zdrojoch, ale tieto obrazovky ho už neimportujú. PNG originál je v `research/town-seasons-v2-source.png`, mimo verejných súborov.
- **Uloženie.** `mandat:do-decembra:v2:<deň>` = `{ choices: (0|1|2)[], stars }`; replay vytvorí stav podľa nových pravidiel. V1 sa nemení ani neprenáša, keďže rovnaké voľby už nemajú rovnaké následky. Pri neplatnej voľbe sa načíta iba platný prefix, aby sa neposunuli mesiace. Tréning sa neukladá.
- **Pôvod.** ImageGen, referenčný návrh Codexu z 19. 9. 2026. Nový atlas je AI ilustrácia fiktívneho mesta, nie fotografia; nemá UI ani popisky. Presný generačný prompt a súbor pôvodu sú v `research/december-art-v2.json`. UI texty a tlačidlá sú samostatné HTML prvky.

## Overenie

`node scripts/verify-data.mjs` stráži tri možnosti, lacnú voľbu, dĺžky textov, termíny, konkrétne víťazné cesty, neúspech opakovania jednej voľby, replay, nemennosť vstupu, opotrebovanie, rezervu a ignorovanie ťahov po konci. TypeScript, ESLint a dátové kontroly prešli pre V2. Pôvodná V1 bola vizuálne overená na 1280 a 375 px; toto NIE JE overenie V2. Lokálny Vite v Codexe zatiaľ blokuje `spawn EPERM`; vizuál V2 treba overiť pri funkčnom náhľade alebo po zostavení na Cloudflare. Používateľ autorizoval priame nasadenie po kontrolách.
