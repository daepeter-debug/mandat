# Parlament v 3D — Večerná sála

Záznam rozšírenia z 2. 10. 2026. Peter potvrdil smer **C — Večerná sála**, overené logá na operadlách pri zachovaní pôvodných farieb strán a následne všetkých päť úprav hlbšieho zážitku. Ide o rozšírenie existujúceho parlamentu a magazínového rozhrania Mandátu. Koncepčné rendery v `../../parliament-3d-concepts/` sú referenciou atmosféry, nie overenou geometriou alebo dátami. Aktuálny kontrakt je v `.impeccable/parliament-experience-brief.md`; finálna evidencia v `.impeccable/review/parliament-experience/`.

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

`scripts/parliament-textures.mjs` deterministicky vytvára malé zdieľané textúry dreva, tkaniny a kameňa, ich normálové mapy, značky a lokálnu analytickú panorámu `public/models/parlament-evening.hdr` (128 × 64). HDR nie je vložené v GLB. PBR materiály kombinujú zaoblené sedáky a operadlá s textúrou tkaniny, jemnejší lesk orecha a rozdielnu drsnosť lavíc, obkladu a pódia. Smerovejšie teplé panely a okrajové svetlo HDR dopĺňa kontaktné tieňovanie. Geometria má UV, tangenty a statické kontaktné tiene. Aktuálny GLB má **1 326 416 B**; generátor aj kontrola strážia limit **1 500 000 B**. Počty, pôvodné farby strán, logá, mierka a názvy variantov zostávajú zachované.

## Ovládanie a stavy

| Stav | Správanie |
| --- | --- |
| Otvorenie | Knižnica sa importuje pri otvorení; môže sa prednačítať pri prejdení nad tlačidlom. GLB sa načíta až po otvorení dialógu. Obsadené kreslá vidno hneď; približne trojsekundový prejazd začína pri čalúnení, pokračuje krátkym oblúkom a končí celou sálou. |
| Strany | Základný pohľad je čistý, bez plávajúcich čísiel, hotspotov a vodiacich čiar. Textový zoznam pod scénou obsahuje názov, značku a počet. Výber stlmí ostatné čalúnenie a priblíži kameru k stredu skutočných kresiel strany. Panel detailu má dostupné overené logo, názov, počet a návrat „Celá sála“; historický subjekt bez overeného spoločného loga používa názov. |
| Ťuknutie na kreslo | `materialFromPoint` rozpozná čalúnenie `strana:<id>` aj značku `logo:<id>`. V režime Strany otvorí detail, v Koalícii pridá alebo odoberie subjekt. Posun väčší než 7 CSS px, viac dotykov alebo gesto dlhšie než 500 ms výber nespustí; otáčanie a pinch ostávajú ovládaním kamery. |
| Koalícia | Používateľ môže vybrať ľubovoľnú kombináciu strán z aktuálneho obsadenia cez zoznam alebo kreslá. Vybrané kreslá si zachovajú pôvodné farby, ostatné sú neutrálne. Súčet sa plynulo mení počas 320 ms, pruh a text uvádzajú hranicu väčšiny 76, počet chýbajúcich kresiel a „Vymazať výber“. UI výslovne označuje vlastnú kombináciu: nejde o odporúčanie ani predpoveď dohody strán. |
| Bloky | Čalúnenie používa koalíciu `#c4553f`, opozíciu `#3c6db4` a ostatných `#aab2ac`; textový súčet a pruh uvádzajú hranicu väčšiny 76. Prepínač partnerov zostáva označený ako redakčný predpoklad. |
| Voľby 2023 | Prepne obsadenie tej istej sály, zruší detail aj vlastnú kombináciu a vráti celú sálu. Krátka neutrálna svetelná vlna používa rovnaké pravidlá pre každý subjekt. |
| Kamera, opakovanie a preskočenie | Po úvode je pohľad stabilný. Používateľ scénu otáča a približuje sám. Tlačidlo nad scénou úvod zopakuje, „Preskočiť úvod“ vráti celú sálu. Dotyk, výber strany, režimu alebo obsadenia prejazd preruší. |
| Reduced motion a skrytá scéna | Reduced-motion otvorí rovno obsadenú sálu, vypne interpoláciu kamery, animáciu súčtu, dekoratívnu vlnu a CSS prechody. Skrytá karta alebo scéna mimo obrazovky pozastaví animáciu; rozbehnutý úvod ukončí v celkovom pohľade. |
| Načítanie a chyba | Stavový text oznamuje načítanie, pri zlyhaní sa zobrazí textová chyba. Dialóg má pomenovaný titulok, popis a zatváracie tlačidlo. |

Prepínače obsadenia a režimu a tlačidlo opakovania sú nad scénou v toku dokumentu. Popis, vlastná koalícia, zoznam a poznámka sú pod scénou; detail, preskočenie úvodu a podporované AR sú lokálne akcie pri modeli. Na mobile do 760 px je dialóg cez celú obrazovku so safe-area odsadením a posunom obsahu. Scéna má explicitnú výšku `min(calc((100vw - 32px) * .95), 48dvh)`. Od 761 px má dialóg najviac 860 × 720 px a zachováva okraje viewportu. Názvy a počty sú dostupné v textovom zozname aj bez priameho výberu kresla; farba nenesie význam sama.

`lib/parliament-experience.ts` oddeľuje výpočet používateľovej kombinácie a polohu detailu od UI. `coalitionSelection` započíta len platné ID z aktuálneho variantu a duplikáty nezvyšujú súčet. `partyFocus` vychádza zo skutočných súradníc `chamberSeats` podľa `seatParty`, nie z polohy odstránených štítkov.

## Regenerovanie a kontroly

Príkazy spúšťaj z `outputs/web` s nainštalovanými závislosťami a Node.js podľa projektu (`package.json`: ≥22.13.0; runtime musí podporovať priame importy `.ts`). Pri čistom checkoute použi existujúci postup `npm run install:ci`.

Po zmene dát, materiálov alebo overených značiek:

```sh
node scripts/build-parliament-glb.mjs
node scripts/verify-parliament-glb.mjs
node scripts/verify-data.mjs
node scripts/verify-parliament-experience.mjs
```

Po zmene CSS vygeneruj tmavú tému; pred odovzdaním over aktuálnosť a produkčný build:

```sh
node scripts/build-dark.mjs
node scripts/build-dark.mjs --check
npx tsc --noEmit
npm run lint
npm run build
```

Oficiálny Khronos validátor zapisuje výsledok do `.impeccable/review/gltf-validation.json`. Vlastná kontrola overuje limit súboru, 150 uzlov kresiel, mapovanie farby aj loga každého kresla v oboch variantoch, názvy variantov a 150 kanálov animácie `obsadenie`. `verify-data` stráži aktuálnosť počtov v generovanom modeli. Zachovaj `ensureLoaded()` pri materiáloch druhého variantu. Viewer musí mať explicitné `animation-name="obsadenie"`; pred nastavením `currentTime = 3` aktivuje klip cez `play()`, potom ho pozastaví. Bez aktivovaného klipu seek nenastaví mierku kresiel a po opätovnom otvorení by sa nemusela zobraziť celá sála.

## Overenie a jeho dosah

Pri aktuálnom rozšírení prešli `verify-parliament-experience`, `verify-data`, kontrola GLB, TypeScript, úplný ESLint, kontrola generovaného tmavého CSS a produkčný build. Khronos hlásil **0 chýb a 0 varovaní**; Impeccable detector vrátil prázdny zoznam nálezov. Nová kontrola pokrýva oba varianty, platné aj neznáme ID, duplikáty, hranicu väčšiny a deterministický fokus na skutočné kreslá.

Finálne browser captures sú v `.impeccable/review/parliament-experience/`: desktop **1280 × 800** v svetlej a tmavej téme, mobil **402 × 874 CSS px** v svetlej a **375 × 874 CSS px** v tmavej téme. Parent otvoril všetky súbory a potvrdil správny aktuálny stav. Desktopové súbory sú `desktop.png`, `desktop-detail.png`, `desktop-coalition.png`, `desktop-blocs.png`, `desktop-2023.png`, `desktop-dark.png` a `desktop-dark-detail.png`. Mobilné sú `mobile.png`, `mobile-detail.png`, `mobile-coalition.png`, `mobile-dark.png`, `mobile-dark-detail.png`, `mobile-dark-coalition.png`, `mobile-dark-2023.png` a `mobile-intro.png`. Provider škáluje mobilné bitmapy; CSS viewporty nepredstavujú test fyzických telefónov.

Interakčná kontrola v prehliadači potvrdila klik na modré kreslo → PS, 34 kresiel; ťahanie kamery bez výberu; návrat „Celá sála“; opakovanie a preskočenie úvodu; vymazanie výberu na 0; kombináciu PS + REPUBLIKA + SaS + KDH so súčtom 81; vo voľbách 2023 SMER + HLAS + SNS so súčtom 79; reset kombinácie na 0 pri zmene variantu a opätovné otvorenie so všetkými 150 kreslami. Zoznam chýb konzoly bol prázdny. Tieto kombinácie sú testovacie vstupy, nie odporúčanie. Reduced-motion vetva je implementovaná a skontrolovaná v zdroji; browser emulácia nebola dostupná.

Nový verdikt reviewera a potvrdenie nasadenia sú pri tomto zápise ešte otvorené. Predchádzajúce snímky s hotspotmi a pôvodný `parliament-review.md` dokumentujú skoršiu verziu, nepotvrdzujú tento nový model interakcie.

Skoršie rozšírenie bolo nasadené na [verejný náhľad Mandátu](https://mandat-preview.mandat.workers.dev), verzia `8da79398-4892-4a52-8426-dfeae394de27`, s GLB 1 326 400 B. Táto historická evidencia nepotvrdzuje nasadenie aktuálneho GLB 1 326 416 B ani nového ovládania.

Fyzický Safari/Android, AR a cieľ 60 fps zostávajú **neoverené na skutočných zariadeniach**. Zachované režimy sú WebXR, Android Scene Viewer a iOS Quick Look, s umiestnením na podlahu. UI upozorňuje, že Android Scene Viewer načíta pôvodný model prieskumov; iOS exportuje aktuálnu scénu. Knižnica model-viewer vo vývoji upozorňuje na vlastný deprecated RGBELoader; funkčnosť náhľadu to neblokovalo.

Root `PRODUCT.md`, `DESIGN.md` a ich sidecar zostávajú zachované. Ich skoršie tvrdenia o nedostupných logách, iba svetlej téme či neuskutočnenej browser kontrole nezachytávajú dnešný stav tohto rozšírenia. Ide o preexistujúci drift; tento úzko vymedzený záznam ho neopravuje ani z neho nevytvára nové pravidlá.
