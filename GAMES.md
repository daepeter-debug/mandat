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

## Malá republika (`components/republic-game.tsx`, `lib/republic.ts`)

Lokálna pokojná staviteľská hra v `?v=game&g=republic`. Hráč buduje Lipovú štvrť na mape 6 × 6; zapojenie ciest začína na námestí a služby majú dosah dve políčka. Prvá kapitola „Stanica znova žije“ má sedem denných krokov a tri rovnocenné podoby starej haly.

- **Uloženie.** Stav je verziovaný a uložený iba v `localStorage` pod vlastným kľúčom. Účty a cloudové uloženie nie sú súčasťou tejto verzie.
- **Denný rytmus.** Dátum používa časové pásmo Europe/Bratislava. Zásielky sa kumulujú najviac tri, tri objednávky sa otáčajú v pevnom sedemdňovom cykle. Prvé dva kroky obnovy stanice možno dokončiť v ten istý deň, neskoršie najviac jeden za deň.
- **Príbeh štvrte (lokálna revízia 1. 10.).** Po úvode s Evou nasleduje sedem herných dní so slávnosťami. Každý mení ciele, rozpočet alebo potrebné zázemie. Tri splnené ciele odomknú okamžitý posun na ďalší deň; po siedmom hráč získa slávnostnú bránu. Tieto dni neposúvajú kalendár ani zásielky. Samostatná výzva podľa skutočného dátumu zostáva dostupná. Ukladá sa do existujúceho v1 mesta cez voliteľné `festivalJourney`; účty sa nepridávajú. Overenie: `node scripts/verify-journey.mjs`, `node scripts/verify-festival.mjs`.
- **Zásielky.** Ponuka je stabilná aj po obnovení stránky. Bežná/neobvyklá/vzácna/epická trieda má podiel 60/25/12/3; nová dekorácia dá 8 mincí a 4 materiály, duplikát 2 materiály. Po finále si hráč zvolí ľubovoľnú dekoráciu.
- **Vizuál a ovládanie.** Mapa je SVG postavené zo skutočného herného stavu, nie jeden ilustračný obrázok. Tlačidlá majú dotykové rozmery, klávesnicový fokus a pokojné live oznámenia o potvrdených zmenách.
- **Stolová dioráma (`components/republic-art.tsx`).** Všetky kúsky sa kreslia v jednej izometrii s mapou (políčko 86 × 48 px, výška v px) zo spoločných stavebníc: kváder, sedlová a valbová strecha s radmi škridiel, rizalit napojený úžľabím, komín a vežička z hrebeňa, okná, dvere, hodiny, stromy. Svetlo ide zľava hore, tiene doprava dolu a nepresahujú políčko. Každá budova má vlastnú siluetu, dom tri podoby (podľa `instanceId`, takže sa nemení pri stavbe inde) a stanica štyri stavy. Mapa je drevená doska so zeminou, lesom za štvrťou, železnicou s priecestím, potokom a vyrytým názvom štvrte. Súradnice sa zaokrúhľujú a nepoužíva sa goniometria, aby server aj prehliadač vykreslili rovnaké čísla.

## Tridsiatka (`components/quiz-game.tsx`, `lib/quiz.ts`, `lib/quiz-bank.ts`, online: `lib/quiz-online.ts`, `lib/quiz-store.ts`)

Politický kvíz v `?v=game&g=quiz`: kolo má 30 otázok o slovenskej politike od roku 1989, od ľahkých po expertné.

- **Banka:** 300 otázok v `lib/quiz-bank.ts`, každá má úroveň 1 – 4, tému, správnu odpoveď, tri nesprávne, vysvetlenie a zdroj.
  - témy: štát a ústava, prezidenti, vlády, voľby, parlament, EÚ a svet, dejiny, ekonomika, samospráva, strany;
  - zámerne bez káuz, trestných vecí a hodnotení, len overiteľné fakty k 1. 10. 2026;
  - pred zverejnením ich nezávisle overili štyria overovatelia proti oficiálnym zdrojom (nrsr.sk, prezident.sk, vlada.gov.sk, volby.statistics.sk, Slov-Lex, Eurostat).
- **Kolo:**
  - 8 ľahkých + 9 stredných + 9 ťažkých + 4 expertné; z jednej témy najviac 3 na úroveň; poradie možností sa mieša;
  - body 1/2/3/5 (najviac 73), titul od Voliča po Prezidenta;
  - bez časového limitu, po každej odpovedi vysvetlenie a odkaz na zdroj;
  - žolíky 50 : 50 a výmena otázky, každý raz za kolo.
- **Kvíz dňa:** rovnakých 30 otázok pre všetkých (zrnko zo slovenského dátumu). Počíta sa raz za deň a výsledok sa dá zdieľať: body, titul a 30 štvorčekov bez otázok.
- **Voľný kvíz:** náhodných 30 otázok; prednosť majú otázky, ktoré hráč nevidel v posledných 150.
- **Uloženie v zariadení:** `mandat:quiz:v1:progress` (rozohrané kolo), `…:results` (posledných 60 výsledkov, z nich osobné poradie a séria dní) a `…:seen`. Čítanie je prísne; poškodené dáta sa zahodia.
- **Online (od 2. 10. 2026): rebríček kvízu dňa, porovnanie s ostatnými a výzvy pre kamarátov.**
  - **Porovnanie:** po kvíze dňa sa hneď ukáže miesto („3. miesto z 412“), podiel ostatných hráčov s menej bodmi a rozloženie bodov dňa po päťbodových pásmach.
  - **Rebríček dňa:** prvých 10 hráčov, ktorí sa zapísali prezývkou; miesto počíta všetkých hráčov dňa. Prezývka sa dá zmeniť aj odstrániť.
  - **Úspešnosť otázok:** pri vysvetlení každej otázky je, koľko hráčov ju trafilo (kvíz dňa: dnes, voľný kvíz a výzvy: zo všetkých kôl). Od 5 odpovedí počty, od 20 percentá.
  - **Výzva:** z dohraného kola vznikne odkaz `?v=game&g=quiz&vyzva=KÓD`.
    - Kamarát dostane presne tie isté otázky (výmena otázky je vo výzve vypnutá).
    - Pri vysvetlení vidí, ako odpovedal vyzývateľ, a na konci súboj „Ty : Jana“ s 30 štvorčekmi pod sebou.
    - Výzva z dnešného kvízu dňa sa kamarátovi rovno počíta aj ako jeho kvíz dňa; kto ho už hral, zapíše sa svojím výsledkom.
    - Autor vidí výsledky kamarátov na úvode Tridsiatky (posledná vlastná výzva za 7 dní) a po otvorení odkazu.
  - **Body počíta server** z odpovedí (`verifyRound` v `lib/quiz-online.ts`):
    - kvíz dňa musí sedieť s kolom dňa (najviac jedna výmena žolíkom), výzva s otázkami výzvy, voľné kolo s plánom úrovní;
    - prijíma sa len dnešné a včerajšie kolo, opakované odoslanie nič nezdvojí.
  - **Súkromie:**
    - kolo má nový náhodný kód z prehliadača; server pozná len body, správne/nesprávne a prezývku, ak ju hráč zadá;
    - žiadne mená, e-maily ani IP adresy, IP slúži iba ako odtlačok (SHA-256 s dátumom) na limit 60 zápisov za minútu v pamäti;
    - pri „Do Not Track“ alebo GPC sa výsledok pošle až po kliknutí.
  - **Prezývky:** 2 – 20 znakov, bez vulgarizmov a urážok, bez mien a skratiek strán a politikov (neutralita) a bez vydávania sa za web.
    - Zoznamy sú v `lib/quiz-online.ts` (`BAD_PARTS` ako časti slov, `BAD_WORDS` ako celé slová).
    - Test overuje všetkých politikov s portrétom v `public/people` a skratky strán.
  - **Moderácia:** nevhodnú prezývku stačí doplniť do `BAD_PARTS` alebo `BAD_WORDS` a nasadiť. V úložisku sa nič nemení: zakázaná prezývka zmizne z rebríčka a vo výzvach sa ukáže ako „Hráč“.
  - **Architektúra:**
    - API `app/api/kviz/route.ts` → jedna inštancia Durable Object `QuizBoard` (`worker/quiz-board.ts`) so SQLite v jurisdikcii EÚ; SQL a logika sú v `lib/quiz-store.ts`.
    - Tabuľky vytvára `SCHEMA` v `lib/quiz-store.ts` (`CREATE … IF NOT EXISTS` pri štarte objektu). Pri zmene tvaru doplniť `ALTER TABLE` tamtiež, staré údaje ostávajú.
    - Nasadenie a lokálne skúšanie: DEPLOYMENT.md, časť Tridsiatka online.
  - **V zariadení** navyše `mandat:quiz:v1:online`: prezývka, posledných 8 kôl s kódom a odpoveďami (aby sa dali poslať aj neskôr) a výzvy.
  - **Vedomé limity:** banka otázok je v prehliadači, takže odhodlaný podvodník si odpovede nájde; rebríček je pre zábavu. Kvíz dňa sa dá zahrať znova v inom prehliadači.
- **Overenie:** `node scripts/verify-quiz.mjs`:
  - tvar banky, duplicity a dĺžky;
  - krížová kontrola s `lib/cabinets.ts`, voľbami 2023 v `lib/parliament.ts`, Eurostatom v `lib/public-finance.data.ts` a kalkulačkou daní;
  - plán kola, žolíky, zdieľanie a uloženie;
  - online časť: prezývky, overenie kola, poradie, výzvy a moderácia v úložisku nad node:sqlite;
  - API naživo len lokálne: `node scripts/smoke-quiz-api.mjs http://127.0.0.1:8787` proti `wrangler dev` (DEPLOYMENT.md).
- **Aktualizácia faktov:** po zmene vlády, predsedu NR SR, prezidenta, sadzieb (január) či nových voľbách upraviť dotknuté otázky. Otázky s „od roku…“ či „v roku 2026“ prejsť každý rok.
- **Grafika pre Codex:** hra je funkčná so štýlmi v `app/quiz-game.css`, ilustrácie zatiaľ nemá. Chýba titulná grafika karty v Herni (`.games-quiz-art`, teraz veľké „30“), ilustrácie titulov na konci kola (Volič … Prezident), jemná oslava pri vysokom skóre a prípadne ikony tém.

## Koalícia slov (`components/word-game.tsx`, `lib/word-game.ts`, `public/data/koalicia`)

Slovná hra v `?v=game&g=words`: z 12 písmen poskladať koalíciu najviac štyroch slov; každé písmeno sa dá použiť raz. Podobná slovným hrám s písmenami (napr. Slovosleď Denníka N), ale nejde o hľadanie čo najviac slov: písmená treba rozdeliť medzi slová.

- **Mandáty:** slovo = (súčet bodov písmen) × (dĺžka − 1); body 1 – 5 podľa vzácnosti písmena (a o e i n s t r v = 1 … ň ď ô ä ó ĺ ŕ f g = 5). Koalícia má najviac 150 mandátov.
- **Ciele (hviezdy) sa zbierajú počas hry:** väčšina 76 a ústavná väčšina 90 podľa najsilnejšej koalície, tretia hviezda za koalíciu bez opozície (všetkých 12 písmen v slovách, s väčšinou), hoci aj inú ako najsilnejšiu. Po odhalení riešenia sa nič nezapisuje.
- **Zadania:** vopred vygenerované súbory, telefón sťahuje len jeden (do 12 kB) – 12 písmen, všetky platné slová z nich, najlepšia koalícia počítača a najlepšia koalícia zo všetkých 12 písmen.
  - denné `public/data/koalicia/RRRR-MM-DD.json` od 2. 10. 2026 do 31. 12. 2027, rovnaké pre všetkých; chýbajúci deň nahradí voľné zadanie určené dátumom;
  - 200 voľných `public/data/koalicia/volne/<n>.json`; hra ponúkne najprv tie, ktoré hráč ešte neotvoril;
  - každé zadanie má aspoň 120 slov, najlepšiu koalíciu aspoň 100 mandátov a všetkých 12 písmen sa dá použiť s väčšinou (tri ciele vždy splniteľné).
- **Slovník:** sk-spell 2.4.8 (LibreOffice dictionaries, licencia MPL 1.1, zdroj v `public/data/koalicia/ZDROJ.txt`). Do repa ide len odvodený zoznam slov v zadaniach, nie slovník.
  - `scripts/word-forms.mjs` rozbalí tvary (koncovky, ne-, naj-) a vynechá vlastné mená (okrem jednoslovných štátov a svetadielov, `GEOGRAPHY`), skratky, citoslovcia, vulgarizmy a nadávky;
  - opravuje chyby pravidiel slovníka: rozkazy bez slabiky (zabi nie zab, pomsti nie pomsť), nesprávne skupiny spoluhlások (kotvi nie kotv), príslovky typu pso či sovietsko a zápory prídavných mien od miestnych mien (nemaltský, neazorský).
- **Nové zadania:** stiahnuť `sk_SK.aff` a `sk_SK.dic` z https://github.com/LibreOffice/dictionaries/tree/master/sk_SK do priečinka mimo repa a spustiť
  `node --max-old-space-size=6144 scripts/build-word-game.mjs <priečinok> 2028-12-31 200` (približne 7 minút). Existujúce zadania si nechajú písmená (hráči ich mohli hrať), prepočítajú sa len slová a koalície; nové dni sa generujú deterministicky zo zrnka dátumu. Úplne nové písmená všade: `--fresh`.
- **Uloženie v zariadení:** `mandat:words:v1:day:<deň>` a `…:free:<n>` (slová, najsilnejšia koalícia, koalícia zo všetkých písmen, odhalenie), `…:history` (denné výsledky pre sériu dní) a `…:free-current`. Čítanie je prísne: slová sa overia proti zadaniu a najlepší výsledok sa prepočíta.
- **Zdieľanie:** hlavička s dátumom, mandáty, hviezdy a farebné štvorčeky za písmená (zelená, modrá, oranžová, fialová podľa strán), bez slov.
- **Grafika pre Codex:** polkruh snemovne a kachličky sú funkčné, ale jednoduché. Chýba animácia pridania slova (kreslá sa vyplnia farbou strany), oslava väčšiny a ústavnej väčšiny a titulná grafika karty v Herni (`.games-words-art`).
- **Overenie:** `node scripts/verify-word-game.mjs`:
  - mandáty, kontrola slova a hviezdy;
  - prísne čítanie zadania a uloženia, séria, zdieľanie;
  - všetky zadania: denné bez medzery, dosť slov, tri ciele splniteľné, žiadne vulgarizmy ani známe chybné tvary, veľkosť súboru.

## Overenie

`node scripts/verify-data.mjs` stráži tri možnosti, lacnú voľbu, dĺžky textov, termíny, konkrétne víťazné cesty, neúspech opakovania jednej voľby, replay, nemennosť vstupu, opotrebovanie, rezervu a ignorovanie ťahov po konci. TypeScript, ESLint a dátové kontroly prešli pre V2. Pôvodná V1 bola vizuálne overená na 1280 a 375 px; toto NIE JE overenie V2. Lokálny Vite v Codexe zatiaľ blokuje `spawn EPERM`; vizuál V2 treba overiť pri funkčnom náhľade alebo po zostavení na Cloudflare. Používateľ autorizoval priame nasadenie po kontrolách.
