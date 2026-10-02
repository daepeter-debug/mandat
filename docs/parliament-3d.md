# Parlament v 3D — Večerná sála

Záznam rozšírení z 2. 10. 2026. Peter potvrdil smer **C — Večerná sála**, overené logá na operadlách pri zachovaní pôvodných farieb strán, päť úprav hlbšieho zážitku a následne tri prvky: prechod cez skutočné kreslá, spätnú väzbu väčšiny a pohľad zvnútra. Ide o rozšírenie existujúceho parlamentu a magazínového rozhrania Mandátu. Koncepčné rendery v `../../parliament-3d-concepts/` sú referenciou atmosféry, nie overenou geometriou alebo dátami. Najnovší kontrakt je v `.impeccable/parliament-motion-brief.md`, evidencia v `.impeccable/review/parliament-motion/`; skorší kontrakt a evidencia `parliament-experience` zostávajú historickým záznamom.

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

`scripts/build-parliament-glb.mjs` generuje `public/models/parlament.glb` s `KHR_materials_variants`. Dve faktické obsadenia sú `prieskumy`, `volby-2023`, materiály `strana:<id>` a animácia `obsadenie`; samostatné značky majú materiály `logo:<id>`. Varianty prepínajú farbu aj značku každého kresla. Tretí interný variant `prechod` má 150 samostatných dvojíc `prechod:<index>` a `prechod-logo:<index>`; slúži iba animácii a nie je ďalším dátovým scenárom. `asset.extras` obsahuje `asOf`, `updated`, `seats` a `seats2023`.

`scripts/parliament-textures.mjs` deterministicky vytvára malé zdieľané textúry dreva, tkaniny a kameňa, ich normálové mapy, značky a lokálnu analytickú panorámu `public/models/parlament-evening.hdr` (128 × 64). HDR nie je vložené v GLB. PBR materiály kombinujú zaoblené sedáky a operadlá s textúrou tkaniny, jemnejší lesk orecha a rozdielnu drsnosť lavíc, obkladu a pódia. Smerovejšie teplé panely a okrajové svetlo HDR dopĺňa kontaktné tieňovanie. Geometria má UV, tangenty a statické kontaktné tiene. Aktuálny GLB má **1 417 048 B**; generátor aj kontrola strážia limit **1 500 000 B**. Počty, pôvodné farby strán, logá, mierka a názvy dvoch faktických variantov zostávajú zachované.

## Ovládanie a stavy

| Stav | Správanie |
| --- | --- |
| Otvorenie | Knižnica sa importuje pri otvorení; môže sa prednačítať pri prejdení nad tlačidlom. GLB sa načíta až po otvorení dialógu. Obsadené kreslá vidno hneď; približne trojsekundový prejazd začína pri čalúnení, pokračuje krátkym oblúkom a končí celou sálou. |
| Strany | Základný pohľad je čistý, bez plávajúcich čísiel, hotspotov a vodiacich čiar. Textový zoznam pod scénou obsahuje názov, značku a počet. Výber stlmí ostatné čalúnenie a priblíži kameru k stredu skutočných kresiel strany. Panel detailu má dostupné overené logo, názov, počet a návrat „Celá sála“; historický subjekt bez overeného spoločného loga používa názov. |
| Ťuknutie na kreslo | `materialFromPoint` rozpozná čalúnenie `strana:<id>` aj značku `logo:<id>`. V režime Strany otvorí detail, v Koalícii pridá alebo odoberie subjekt. Posun väčší než 7 CSS px, viac dotykov alebo gesto dlhšie než 500 ms výber nespustí; otáčanie a pinch ostávajú ovládaním kamery. |
| Koalícia | Používateľ môže vybrať ľubovoľnú kombináciu strán z aktuálneho obsadenia cez zoznam alebo kreslá. Vybrané kreslá si zachovajú pôvodné farby, ostatné sú neutrálne. Súčet sa plynulo mení počas 320 ms, pruh a text uvádzajú hranicu väčšiny 76, počet chýbajúcich kresiel a „Vymazať výber“. UI výslovne označuje vlastnú kombináciu: nejde o odporúčanie ani predpoveď dohody strán. |
| Bloky | Čalúnenie používa koalíciu `#c4553f`, opozíciu `#3c6db4` a ostatných `#aab2ac`; textový súčet a pruh uvádzajú hranicu väčšiny 76. Prepínač partnerov zostáva označený ako redakčný predpoklad. |
| Zmena obsadenia | Prepne obsadenie tej istej sály, zruší detail aj vlastnú kombináciu a vráti celú sálu. V režime Strany postupujú nové farby a logá cez skutočných 150 kresiel počas 1 050 ms; označený prechod má „Preskočiť“. Iné ovládanie ho ukončí v zvolenom faktickom variante. |
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

## Skoršie overenie hlbšieho zážitku

Nasledujúca evidencia zachytáva predchádzajúcu verziu; najnovšie overenie a nasadenie rozšírenia je v závere dokumentu.

Pri aktuálnom rozšírení prešli `verify-parliament-experience`, `verify-data`, kontrola GLB, TypeScript, úplný ESLint, kontrola generovaného tmavého CSS a produkčný build. Khronos hlásil **0 chýb a 0 varovaní**; Impeccable detector vrátil prázdny zoznam nálezov. Nová kontrola pokrýva oba varianty, platné aj neznáme ID, duplikáty, hranicu väčšiny a deterministický fokus na skutočné kreslá.

Finálne browser captures sú v `.impeccable/review/parliament-experience/`: desktop **1280 × 800** v svetlej a tmavej téme, mobil **402 × 874 CSS px** v svetlej a **375 × 874 CSS px** v tmavej téme. Parent otvoril všetky súbory a potvrdil správny aktuálny stav. Desktopové súbory sú `desktop.png`, `desktop-detail.png`, `desktop-coalition.png`, `desktop-blocs.png`, `desktop-2023.png`, `desktop-dark.png` a `desktop-dark-detail.png`. Mobilné sú `mobile.png`, `mobile-detail.png`, `mobile-coalition.png`, `mobile-dark.png`, `mobile-dark-detail.png`, `mobile-dark-coalition.png`, `mobile-dark-2023.png` a `mobile-intro.png`. Provider škáluje mobilné bitmapy; CSS viewporty nepredstavujú test fyzických telefónov.

Interakčná kontrola v prehliadači potvrdila klik na modré kreslo → PS, 34 kresiel; ťahanie kamery bez výberu; návrat „Celá sála“; opakovanie a preskočenie úvodu; vymazanie výberu na 0; kombináciu PS + REPUBLIKA + SaS + KDH so súčtom 81; vo voľbách 2023 SMER + HLAS + SNS so súčtom 79; reset kombinácie na 0 pri zmene variantu a opätovné otvorenie so všetkými 150 kreslami. Zoznam chýb konzoly bol prázdny. Tieto kombinácie sú testovacie vstupy, nie odporúčanie. Reduced-motion vetva je implementovaná a skontrolovaná v zdroji; browser emulácia nebola dostupná.

Finálny reviewer v `.impeccable/review/parliament-experience/review.md` uzavrel potvrdených päť úprav verdiktom **disposition: ship**, bez požadovaných opráv. Otvoril všetkých pätnásť požadovaných snímok a hodnotil rozšírenie voči zdedenému smeru a potvrdenému rozsahu; samostatná QUALITY BAR karta nebola súčasťou podkladov. Predchádzajúce snímky s hotspotmi a pôvodný `parliament-review.md` dokumentujú skoršiu verziu.

Aktuálne rozšírenie bolo úspešne nasadené cez `npm run deploy:preview` na [verejný náhľad Mandátu](https://mandat-preview.mandat.workers.dev/), verzia **`137391a5-2663-4159-ae97-0b3582c93d92`**. Funkčný commit po rebase je `01b203c`, evidencia `a8a79e9`; zachované sú aj zlúčené zmeny Tridsiatky online z `2d015a8`. Po rebase znova prešli všetky kontroly parlamentu, dát a kvízu, kontrola tmavého CSS, TypeScript, ESLint v `app`, `components`, `lib`, `scripts`, `worker` a produkčný build.

Verejný GLB má **1 326 416 B** a SHA-256 **`41D82EC5F36DF932C882212208BD88E44E8FC24967B95E0895F46637795B588C`**, zhodné s lokálnym súborom. Parent vo verejnom UI overil Koalíciu PS 34 + REPUBLIKA 21 + SaS 14 + KDH 12 = 81 a stav dosiahnutej väčšiny; snímka je `.impeccable/review/parliament-experience/online.png`, chyby konzoly `[]`. Toto potvrdenie nasadenia nerozširuje fyzické AR, výkonové ani živé reduced-motion overenie.

Fyzický Safari/Android, AR a cieľ 60 fps zostávajú **neoverené na skutočných zariadeniach**. Zachované režimy sú WebXR, Android Scene Viewer a iOS Quick Look, s umiestnením na podlahu. UI upozorňuje, že Android Scene Viewer načíta pôvodný model prieskumov; iOS exportuje aktuálnu scénu. Knižnica model-viewer vo vývoji upozorňuje na vlastný deprecated RGBELoader; funkčnosť náhľadu to neblokovalo.

Root `PRODUCT.md`, `DESIGN.md` a ich sidecar zostávajú zachované. Ich skoršie tvrdenia o nedostupných logách, iba svetlej téme či neuskutočnenej browser kontrole nezachytávajú dnešný stav tohto rozšírenia. Ide o preexistujúci drift; tento úzko vymedzený záznam ho neopravuje ani z neho nevytvára nové pravidlá.

## Najnovšie rozšírenie a dôkazy — 2. 10. 2026

**Prechod kresiel.** `seatSweep` v `lib/parliament-experience.ts` rozloží 1 050 ms cez fyzické poradie 150 kresiel. Čalúnenie interpoluje pôvodnú a cieľovú farbu, logo sa v každom kroku vymení za cieľové; na konci sa obnoví presný `prieskumy` alebo `volby-2023`. Rozhranie zobrazuje smer prechodu a preskočenie. Rýchle prepínanie, zmena režimu a ďalšie ovládanie zachovajú posledný zvolený konečný stav. Reduced motion alebo skrytá scéna prechod dokončia bez animácie. Porovnanie „2023 → Model Mandát“ uvádza REPUBLIKA **+21** a HLAS **−14**; strata sa vyberá medzi porovnateľnými ID, ktoré majú kreslá aj v aktuálnom modeli. Historická koalícia OĽANO a priatelia sa nestotožňuje s dnešným hnutím Slovensko.

**Väčšina.** Pri dosiahnutí 76 kresiel v ľubovoľnej používateľovej kombinácii podlahová intarzia smerom k pultu a vybrané čalúnenie dostanú rovnaký teplý impulz na 1 500 ms. Potom zostane pokojné zvýraznenie; pod hranicou sa intarzia vypne. Ide o emisívny materiálový efekt, nie simuláciu skutočného osvetlenia miestnosti. Bez slučky, zvuku alebo politickej preferencie; text a pruh nesú presný súčet aj hranicu nezávisle od pohybu.

**Z kresla poslanca.** `deputyView()` vyberá skutočné stredové kreslo v rade 3, sektore 2 a položí kameru do úrovne očí nad ním. Zorné pole sa rozšíri na **68°** smerom k pultu. Generátor dopĺňa jednostrannú vnútornú prednú stenu s obkladom a svetelnou škárou. Viditeľné „Celá sála“ vracia celkový pohľad; popis ostáva „Ilustračná sála“. Nie je to presná rekonštrukcia NR SR ani voľný first-person režim.

Najnovšia evidencia je v `.impeccable/review/parliament-motion/`. Reviewer otvoril všetkých **12** platných lokálnych snímok a uzavrel rozsah ako **disposition: ship**, bez opráv. Desktop 1280 × 800: `desktop.png`, `desktop-dark.png`, `desktop-sweep.png`, `desktop-seat.png`, `desktop-majority.png`, `desktop-majority-pulse.png`. Mobil 402 × 874 CSS px vo svetlej a 375 × 874 CSS px v tmavej téme: `mobile-sweep.png`, `mobile-seat.png`, `mobile-majority.png` a ich tri `mobile-dark-*` náprotivky. Sweep snímky zachytávajú **skorý prechod**, nie ustálené rozdelenie; `desktop-majority-pulse.png` má prechodný animovaný súčet **78 smerom k 81**. Ustálené snímky a interakčná kontrola potvrdzujú aktuálnu kombináciu 81 a historickú 79.

Browser kontrola potvrdila rýchle prieskumy → 2023 → prieskumy s výsledným `prieskumy`, preskočenie s výsledným `volby-2023`, prerušenie režimom, vlastnú koalíciu, pohľad zvnútra a návrat, opätovné otvorenie. Pri mobilných CSS šírkach 375/402 px mal obsah šírku 360/387 px bez vodorovného pretekania. Chyby konzoly: `[]`. Statické snímky nedokazujú časovanie; to podporuje zdroj a interakčná kontrola. Reduced motion a skrytá karta boli skontrolované **iba v zdroji**; fyzické mobilné Safari/Android, AR, FPS a živé reduced-motion zostávajú neoverené.

Prešli čisté kontroly zážitku (monotónny sweep, zachovanie súčtu zmien, deterministická kamera), GLB a dát, TypeScript, úplný ESLint v `app`, `components`, `lib`, `scripts`, `worker`, tmavé CSS (`b608f67f13`), detector `[]` a produkčný build. Khronos: **0 chýb, 0 varovaní**. Po rebase so zmenami Claude `9d991af` (refresh aplikácie a iPhone keyboard dock) znova prešli TypeScript, úplný ESLint a build; parlamentové zmeny zostali zachované.

Úspešné `npm run deploy:preview` nasadilo verziu **`6c292992-11a5-4419-ac37-62dcb290d65f`** na [verejný náhľad Mandátu](https://mandat-preview.mandat.workers.dev/). Kód: `0279dc8`; evidencia: `0080f03`. Verejný GLB má **1 417 048 B**, SHA-256 **`087CA7AA921B3FD15F96A5BF446AB91C56F6781A1123793C3E17211CA10BC5A2`**, zhodný s lokálnym súborom. Verejné UI potvrdilo pohľad zvnútra a návrat, prechod ustálený na `volby-2023`, kombináciu 81 a konzolu `[]`; `online-seat.png` a `online-majority.png` sú verejné ustálené stavy. Tieto údaje nahrádzajú staršie nasadenie uvedené vyššie, ktoré zostáva zachované ako historická evidencia.

## Vývoj 2026, strany na hrane a zdieľanie (2. 10. 2026, Codex, dokončil Claude)

**Vývoj 2026** (`parliamentTimeline` v `lib/parliament-model.ts`):
- Každý mesiac je posledný týždenný bod `aggregateSeries` v danom mesiaci; budúce mesiace ani dopočítavanie nie sú.
- Obsadenie počíta `scenarioFromPoll(aggregateAsPoll(bod))`, rovnako ako zvyšok webu.
- Strany, ktoré v bode nemá väčšina agentúr, sú vypísané a do bodu nevstupujú. Bod s menej ako tromi agentúrami je označený ako obmedzené pokrytie.
- Varianty `model-RRRR-MM` generuje `scripts/build-parliament-glb.mjs`. V `asset.extras.timeline` sú počty kresiel každého mesiaca, ktoré `verify-data` porovnáva s dátami.
- Po novom meraní stačí ako doteraz `node scripts/build-parliament-glb.mjs`.

**Strany na hrane** (`parliamentEdges`):
- Strana, ktorej pásmo neistoty pretína 5 % (`thresholdStatus === 'edge'`), dostane variant `bez-<id>`: podpora strany 0, ostatné bez zmeny, prepočet všetkých 150 kresiel.
- Detail uvádza podiel prepočtov s postupom a rozpätie kresiel zo `seatUncertainty`. Kreslá strán na hrane sú jemne rozjasnené, rovnako pre každú stranu.

**Zdieľanie koalície** (`components/parliament-share.ts`):
- Záber `model-viewer` (`toBlob`) a karta 1080 × 1350 so súčtom, väčšinou, stranami a dátumom.
- Dátum: mesiac vývoja „bod k …“, súčasný model „aktualizované …“ (`aggregateUpdated`), voľby 30. 9. 2023.
- Zdieľa sa cez `navigator.share` so súborom, inak sa ponúkne stiahnutie.

**Bez kompresie:**
- Peter kompresiu meshopt odmietol. Ostáva jeden model `public/models/parlament.glb` (1 399 656 B, limit 1,5 MB) pre web aj AR.
- Knižnica `model-viewer` a HDR sa sťahujú vopred, keď sa karta parlamentu objaví na obrazovke. GLB až pri zámere (prejdenie myšou nad tlačidlom) alebo po otvorení, aby úvod nesťahoval 1,4 MB každému návštevníkovi.

**Kontrola:** `node scripts/verify-parliament-evolution.mjs` overuje mesiace (posledný bod mesiaca, súčet zmien 0, zhoda so `scenarioFromPoll`), scenáre bez strany a prítomnosť všetkých variantov v modeli.

**Neoverené:** Claudov prehliadač pri skrytom okne nevykresľuje snímky WebGL. Animácia vývoja, karta koalície a priblíženie na stranu sú overené v kóde a v Codexových snímkach (`.impeccable/review/parliament-evolution/`, mimo repa), nie na skutočnom telefóne.
