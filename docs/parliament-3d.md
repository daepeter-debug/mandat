# Parlament v 3D — Večerná sála

Záznam dokončeného rozšírenia z 2. 10. 2026. Peter potvrdil smer **C — Večerná sála** a požiadal o overené logá na operadlách pri zachovaní pôvodných farieb strán. Ide o rozšírenie existujúceho parlamentu a magazínového rozhrania Mandátu. Koncepčné rendery v `../../parliament-3d-concepts/` sú referenciou atmosféry, nie overenou geometriou alebo dátami.

## Vizuál a hranice

Otvorená polkruhová sála má orechové lavice a obklad, tlmený koberec, textúrované čalúnenie, mäkké teplé osvetlenie, kontaktné tieňovanie, zaoblené detaily, podrúčky, mikrofóny, schodíky a svetelnú škáru. Je ilustráciou rokovacej sály, nie presnou rekonštrukciou interiéru NR SR. Nemá strop; existujúca mierka približne 70 cm ostáva zachovaná.

Rozhranie používa existujúci papier `#f5f4ee`, svetlé plochy `#fffefa`, zelený atrament `#20392f` a zdedené textové, hraničné a fokusové tokeny. Písmo ostáva IBM Plex Sans Variable. Večerná scéna má vlastnú tmavú materiálovú atmosféru v oboch témach; nie je novou identitou celej aplikácie. Tmavé štýly sa generujú cez `scripts/build-dark.mjs`.

Pôvodné farby strán zostávajú dátovou informáciou. Neutrálna textúra látky sa násobí pôvodným `baseColorFactor`; materiály log sú oddelené, takže výber strany ani režim blokov logá nepremaľujú. Zdrojované lokálne značky vychádzajú z `lib/party-logos.json`. Historická koalícia `election-2023-5` má textový štítok „OĽANO a priatelia · 2023“, keďže spoločné historické logo nie je v overenom archíve; nepoužíva dnešné logo hnutia Slovensko.

## Dáta a model

Autoritou je `lib/parliament-model.ts`, nie koncepčný obrázok ani ručne zapísané čísla v dokumentácii:

- `chamberSeats` vytvára 150 miest v šiestich radoch a piatich sektoroch so štyrmi uličkami. Poradie určuje uhol zľava doprava a potom rad.
- `parliamentVariants()` tvorí `prieskumy` zo `scenarioFromPoll(aggregateAsPoll())` a `volby-2023` zo `seated2023`. Zoradenie ostáva koalícia, ostatní, opozícia; subjekty s nulovým počtom kresiel sa nezobrazujú.
- `seatParty` rozvinie každý počet kresiel do identifikátorov strán. Rovnaké pole určuje čalúnenie, značku kresla aj polohu štítkov; toto rozšírenie nemení počty, poradie, miesta ani pôvodné farby.
- `parliamentSeats()` poskytuje počty, koniec posledného zberu `asOf` a dátum publikovanej aktualizácie `updated`. UI zobrazuje aktualizáciu, nie fiktívnu čerstvosť zberu.

`scripts/build-parliament-glb.mjs` generuje `public/models/parlament.glb` s `KHR_materials_variants`. Zachované názvy sú `prieskumy`, `volby-2023`, materiály `strana:<id>` a animácia `obsadenie`; samostatné značky majú materiály `logo:<id>`. Varianty prepínajú farbu aj značku každého kresla. `asset.extras` obsahuje `asOf`, `updated`, `seats` a `seats2023`.

`scripts/parliament-textures.mjs` deterministicky vytvára malé zdieľané textúry dreva, tkaniny a kameňa, ich normálové mapy, značky a lokálnu analytickú panorámu `public/models/parlament-evening.hdr` (128 × 64). HDR nie je vložené v GLB. Geometria má UV, tangenty a jemné statické tieňovanie. Aktuálny GLB má **1 326 400 B**; generátor aj kontrola strážia limit **1 500 000 B**. Opakované generovanie vytvorilo identický GLB.

## Ovládanie a stavy

| Stav | Správanie |
| --- | --- |
| Otvorenie | Knižnica sa importuje pri otvorení; môže sa prednačítať pri prejdení nad tlačidlom. GLB sa načíta až po otvorení dialógu. Kamera prejde do pohľadu na sálu a kreslá postupne dosadnú. |
| Strany | Hotspot nesie počet a farebnú značku; textový zoznam pod scénou obsahuje názov a počet. Výber zvýrazní subjekt rovnakým jemným svetlom ako ostatné, stlmí ostatné čalúnenie a priblíži kameru. Zobrazuje sa iba hotspot vybranej strany, doplnený jej skratkou. |
| Bloky | Čalúnenie používa koalíciu `#c4553f`, opozíciu `#3c6db4` a ostatných `#aab2ac`; textový súčet a pruh uvádzajú hranicu väčšiny 76. Prepínač partnerov zostáva označený ako redakčný predpoklad. |
| Voľby 2023 | Prepne obsadenie tej istej sály a zruší výber. Krátka neutrálna svetelná vlna používa rovnaké pravidlá pre každý subjekt. |
| Kamera a opakovanie | Pohľad je stabilný, bez automatického otáčania. Používateľ scénu otáča a približuje sám; tlačidlo zopakuje úvod. |
| Reduced motion a skrytá scéna | Úvod sa preskočí na obsadenú sálu, dekoratívna vlna aj CSS pohyb sa vypnú. Skrytá alebo mimo obrazovky umiestnená scéna pozastaví animáciu. |
| Načítanie a chyba | Stavový text oznamuje načítanie, pri zlyhaní sa zobrazí textová chyba. Dialóg má pomenovaný titulok, popis a zatváracie tlačidlo. |

Na mobile do 760 px je dialóg cez celú obrazovku so safe-area odsadením a posunom obsahu. Scéna má explicitnú výšku `min(calc((100vw - 32px) * 1.25), 60dvh)`; popis, legenda a poznámka sú pod ňou v toku dokumentu. Od 761 px má dialóg najviac 860 × 720 px a zachováva okraje viewportu.

Po ustálení kamery alebo zmene veľkosti sa hotspoty rozostúpia v obrazových súradniciach. Posunuté číslo má farebnú vodiacu čiaru a bod pri pôvodnom sektore; metre modelu ani príslušnosť kresiel sa nemenia. Rozostup nevyužíva trvalú animačnú slučku. Vybraný hotspot sa zobrazuje samostatne, aby sa pri priblížení neobjavovali orezané fragmenty ostatných čísiel. Hodnoty sú dostupné aj v textovej legende; farba nenesie význam sama.

## Regenerovanie a kontroly

Príkazy spúšťaj z `outputs/web` s nainštalovanými závislosťami a Node.js podľa projektu (`package.json`: ≥22.13.0; runtime musí podporovať priame importy `.ts`). Pri čistom checkoute použi existujúci postup `npm run install:ci`.

Po zmene dát, materiálov alebo overených značiek:

```sh
node scripts/build-parliament-glb.mjs
node scripts/verify-parliament-glb.mjs
node scripts/verify-data.mjs
```

Po zmene CSS vygeneruj tmavú tému; pred odovzdaním over aktuálnosť a produkčný build:

```sh
node scripts/build-dark.mjs
node scripts/build-dark.mjs --check
npx tsc --noEmit
npm run lint
npm run build
```

Oficiálny Khronos validátor zapisuje výsledok do `.impeccable/review/gltf-validation.json`. Vlastná kontrola overuje limit súboru, 150 uzlov kresiel, mapovanie farby aj loga každého kresla v oboch variantoch, názvy variantov a 150 kanálov animácie `obsadenie`. `verify-data` stráži aktuálnosť počtov v generovanom modeli. Zachovaj `ensureLoaded()` pri materiáloch druhého variantu.

## Overenie a jeho dosah

Pri dokončení prešli `verify-data`, kontrola GLB, TypeScript, úplný ESLint, kontrola generovaného tmavého CSS a produkčný build. Khronos hlásil **0 chýb a 0 varovaní**. Implementačné commity: `e6772be` a `42b5584`; synchronizovaný a pushnutý main: `4f5c896`.

Rozšírenie bolo nasadené na [verejný náhľad Mandátu](https://mandat-preview.mandat.workers.dev), verzia `8da79398-4892-4a52-8426-dfeae394de27`. Parent overil načítaný parlament vo verejnom prehliadači bez chýb konzoly a uložil `parliament-online.png`. Verejný GLB má 1 326 400 B a SHA-256 `95EB0AB0EE00E1CA1C250877451197B5BD778B4B4A3446D83AE446257F139330`, zhodný s lokálnym súborom. Toto potvrdenie nasadenia nerozširuje fyzické AR ani výkonové overenie.

Browser evidence v `.impeccable/review/` pokrýva desktop **1280 × 800**, mobilné CSS viewporty **402 × 874** a **375 × 874**, svetlú aj tmavú tému, strany, výber strany, bloky s partnermi aj bez nich a rok 2023. `capture-sheet.webp` sumarizuje pôvodných 21 načítaných stavov. Neskoršie potvrdenia `confirm-402-dark-party.png` a `confirm-*-leaders.png` nahrádzajú príslušné pôvodné stavy po oprave orezania a rozostupov.

Provider zmenšuje bitmapy mobilných screenshotov na 387 × 841 a 360 × 839 px. Ide o zachytenie potvrdených **CSS viewportov**, nie fyzických telefónov. Záverečný `parliament-review.md` má **disposition: ship** v rozsahu hodnotených opráv: úplný vybraný hotspot, oddelené čísla a vodiace čiary k pôvodným sektorom. Tento verdikt nie je nový audit celého produktu.

Fyzický Safari/Android, AR a cieľ 60 fps zostávajú **neoverené na skutočných zariadeniach**. Zachované režimy sú WebXR, Android Scene Viewer a iOS Quick Look, s umiestnením na podlahu. UI upozorňuje, že Android Scene Viewer načíta pôvodný model prieskumov; iOS exportuje aktuálnu scénu. Knižnica model-viewer vo vývoji upozorňuje na vlastný deprecated RGBELoader; funkčnosť náhľadu to neblokovalo.

Root `PRODUCT.md`, `DESIGN.md` a ich sidecar zostávajú zachované. Ich skoršie tvrdenia o nedostupných logách, iba svetlej téme či neuskutočnenej browser kontrole nezachytávajú dnešný stav tohto rozšírenia. Ide o preexistujúci drift; tento úzko vymedzený záznam ho neopravuje ani z neho nevytvára nové pravidlá.
