# Stav odovzdania

## 21. 9. 2026 — Astra: návrh

- Hotový balík START/GAME/DESIGN/TECH/ACCEPTANCE/TERRA/LUNA.
- Skontrolovaný aktuálny zdrojový kód Herne, oboch hier, ElectionLab, CSS tokeny, package.json, Wrangler a prázdna DB schéma.
- Grafická referencia: vizuálne prezretý `public/images/games/town-seasons-v2.webp`. Nové sprity ani mockup ešte neexistujú.
- Verejné účty, Supabase projekt, e-mailové doručovanie a migrácie ešte nie sú nakonfigurované. V repozitári zatiaľ nie je kód Malej republiky.
- Spustené `node docs/mala-republika/verify-plan.mjs`: PASS. Všetky 3 vetvy majú platné rozloženie a na každom dni dostatok garantovaných zdrojov, konečná rezerva 40 C / 20 M bez objednávok/duplikátov. Toto je iba nezávislý návrhový výpočet, nie test ešte neexistujúceho jadra, save či účtov.
- V tejto fáze sa nemení aplikácia, jej závislosti, existujúce uloženia ani nasadenie. Overenie build/browser novej hry ešte nebolo možné: hra ešte neexistuje.

**Ďalší krok:** prepnúť na Terra / medium a zadať prompt A z TERRA.md. Implementovať lokálny prototyp. Luna je voliteľná a nie je blokujúcou závislosťou.

## Zápis ďalšieho modelu

Pridaj dátum, presné dokončené funkcie, zmenené súbory/commit, spustené kontroly a ich výsledok, screenshoty, zostávajúce chyby a jeden konkrétny ďalší krok. Staršie výsledky nemaž ani ich nepripisuj novému kódu.

## 22. 9. 2026 — priechod A: lokálny prototyp

- Pridaná tretia hra Herne na adrese `?v=game&g=republic`: `components/games-room.tsx`, `components/republic-game.tsx`, `components/republic-map.tsx`, `app/republic-game.css` a úprava `app/games-room.css`.
- Pridané čisté herné jadro `lib/republic.ts`, lokálny adaptér `lib/republic-storage.ts` a skript `scripts/verify-republic.mjs`. Save má verziu, revíziu a bezpečný fallback pri neplatných dátach; neobsahuje účty ani cloud.
- Hotová mapa 6 × 6 so skutočnými uloženými objektmi, cestami, kolíziami, bezplatným presunom do zásoby, katalógom, zbierkou a stabilnou ponukou zásielky. Mapa je interaktívne SVG, nie pozadie s prekrytými tlačidlami.
- Dokončená prvá kapitola so všetkými siedmimi krokmi, denným limitom jedného kroku, tromi vetvami haly, dennými objednávkami vo fixnom 7-dňovom cykle a jednorazovou voľbou finálnej dekorácie. Duplikát zásielky dáva presne 2 materiály.
- Doplnený popis v `GAMES.md`. Nezmenené zostali existujúce dve hry, ich save kľúče, politické dáta, nasadenie a externé účty.

### Overenie

- `node scripts/verify-republic.mjs` — PASS. Kryje mapu, spojenia, zdroje, zásoby, pevné body, zásielky, duplicitu, časové pásmo, denné limity, objednávky, všetky tri vetvy a finálnu odmenu.
- `node scripts/verify-data.mjs` — PASS (35 meraní, 16 subjektov, 25 subjektov volieb 2023, 5 scenárov kresiel).
- `node node_modules/typescript/bin/tsc --noEmit` — PASS.
- `node node_modules/eslint/bin/eslint.js components/republic-game.tsx components/republic-map.tsx components/games-room.tsx lib/republic.ts lib/republic-storage.ts scripts/verify-republic.mjs` — PASS.
- `npm run build` — PASS. `npm run check:preview` nebol spustený, pretože priechod A má výslovne zostať bez nasadenia a vzdialeného Workers príkazu.
- Impeccable detector nad novým UI — bez nálezov (`[]`).
- Manuálna kontrola v lokálnom in-app prehliadači na `http://localhost:5173/?v=game&g=republic`: priamy vstup do hry, výber Parku, umiestnenie na mape a potvrdenie prvého kroku fungujú. Prehliadačový screenshot zostal v náhľade Codexu, nebol uložený ako súbor v repozitári.

### Zostáva

- Priechod B až na samostatný pokyn: verejné účty, cloudové uloženie a migrácie podľa `TERRA.md`/`TECH.md`. Pred tým treba vytvoriť Supabase projekt; nežiadať ani nepridávať tajomstvá do repozitára.
- Pre úplný manuálny audit pred vydaním treba opakovať vizuálnu kontrolu na fyzickom 360/390 px mobile a s čítačkou obrazovky. Responzívne pravidlá, veľké dotykové ciele, fokus a live región sú už v implementácii.

**Konkrétny ďalší krok:** používateľ otvorí lokálnu hru na mobile, vyskúša prvú dennú úlohu a potvrdí, či tempo a ekonomika siedmich návštev vyhovujú; potom sa rozhodne medzi doladením hry a priechodom B.

## 22. 9. 2026 — kontrolný a opravný priechod (Astra → Claude)

Astra začala opravný priechod (pravidlá odmien, presun až po potvrdení, rozlíšiteľná grafika budov, náhľad pred potvrdením, zoznam políčok, ochrana uloženia pri dvoch kartách) a skončila na limite s rozpracovanými súbormi, ktoré neprešli TypeScriptom. Claude priechod dokončil:

- Opravené typy: odmena kroku sa odovzdáva ako dve čísla (`reward(s, step.reward[0], step.reward[1])`), zámok Web Locks má explicitný generický typ; odstránený nepoužitý import. `tsc --noEmit`, ESLint (app, components, lib, scripts), `verify-republic` (73 celých ciest kapitoly s bežnými zdrojmi, tri vetvy, dátumy, geometria, odmeny, uloženie, súbeh dvoch kariet) a `verify-data` prechádzajú.
- Režim Cesty ostáva zapnutý aj po potvrdení políčka, aby sa dalo kresliť viac políčok za sebou; ukončí ho Escape, krížik alebo opätovné klepnutie na Cesty.
- Overené v prehliadači na 1280 px aj 375 px: vstup z Herne (tretia karta), stavba parku cez Stavať → políčko → náhľad ceny a napojenia → Potvrdiť, dokončenie prvého kroku (+2/+1, ďalší krok až zajtra), otvorenie zásielky (tri karty bežnej triedy, výber, +8/+4, ponuka prežije zatvorenie dialógu), vyzdvihnutie objednávky Zapoj školu (+2/+1, druhýkrát zamknuté), detail domu → Presunúť s pôvodnou polohou až do potvrdenia, položenie cesty, prepínač Zoznam a políčka (36 políčok, 8 budov), zbierka s odomknutou lavičkou, obnovenie stránky so zachovaným stavom. Mobil: bez horizontálneho posunu stránky, akčné tlačidlá 48 px, katalóg 3 stĺpce, dialóg zásielky sa zmestí na šírku.
- Hra je nasadená spolu s Herňou (odkaz `?v=game&g=republic`); ukladá sa len v prehliadači, účty nie sú súčasťou.

**Konkrétny ďalší krok:** Peter si zahrá prvé dni na mobile; podľa pocitu z tempa sa rozhodne o priechode B (účty a cloudové uloženie podľa TERRA.md/TECH.md) alebo o ďalšom ladení obsahu (Luna).

## 23. 9. 2026 — grafika stolovej diorámy (Claude Opus 5.5)

- Prekreslené všetky kúsky v `components/republic-art.tsx` v rovnakej izometrii ako mapa (políčko 86 × 48 px). Spoločné stavebnice: `Box`, `GableX/GableY/Hip` s radmi škridiel alebo drážkami plechu, `Bay` (predstavaný štít napojený úžľabím), `Stack` (komín, vežička z hrebeňa), `Win/Door/Arch/Clock`, `Tree/Bush/Lamp`. Svetlo zľava hore, plochy otočené k svetlu majú odtieň `hi`.
- Budovy: dom v troch podobách (podľa `instanceId`), škola s rizalitom, hodinami a zvonicou, knižnica so stĺporadím, kultúrny dom s mozaikou a plagátovým stĺpom, ambulancia s červeným krížom, tržnica so stánkami, hrazdená dielňa s plechovou strechou a drevom, park, záhrada s hriadkami a plotom, radnica s vežou a medenou helmicou, námestie s fontánou, stanica v štyroch stavoch so zasklenou strieškou. 12 ozdôb nakreslených nanovo (napr. otvorený hudobný pavilón, jedna mohutná lipa, kamenná slávnostná brána).
- `components/republic-map.tsx`: drevená doska so zeminou a vyrytým názvom štvrte, les na zadných okrajoch, železnica s podvalmi, priecestím (keď vedie cesta z F3) a návestidlom, potok vpredu, pestrá lúka, mäkké svetlo. Odznak napojenia len pri budovách. Viewbox `-6 16 572 386`, okno mapy má pomer strán dosky.
- `RepublicArt` kreslí kúsok na vlastnom podstavci; výrez je tesnejší (okrem radnice), takže karty v katalógu a v dialógoch sú väčšie. Karta hry v Herni má kúsky väčšie a posadené na spodok.
- `TownPiece` je `memo`, nepoužíva goniometriu ani `Math.hypot`; všetky súradnice sa zaokrúhľujú na 0,1 px.

### Overenie

- `node scripts/verify-republic.mjs` — PASS (73 ciest, uloženie). `node scripts/verify-data.mjs` — PASS. `tsc --noEmit` — PASS. ESLint (app, components, lib, scripts) — PASS. `npm run build` — PASS (herný balík 51 kB, gzip 17,6 kB).
- V prehliadači: plná štvrť so všetkými 24 typmi kúskov aj začiatočná štvrť na 800 px a 375 px (mobil bez vodorovného posunu), katalóg Stavať, dialóg zásielky, pohľadnica stanice, karta v Herni. Plná mapa má okolo 2 400 SVG prvkov.

**Konkrétny ďalší krok:** Peter si pozrie štvrť na mobile; ak sa páči, zlúčiť vetvu `republika-grafika` do main (nasadenie).

## 30. 9. 2026 — lokálna ilustrovaná ukážka a priestor pre hru

- Zapnutý režim sústredenia ukryje politický panel a horné záložky, zmenší hlavičku. Na úzkom mobile ukryje aj globálnu spodnú navigáciu. Návrat cez „Zobraziť celý web“, značku Mandát alebo „Všetky hry“ zostáva dostupný. CSS je podmienené aktívnou republikou; ostatné sekcie sa nemenia.
- Mobil má kompaktné zdroje, aktuálny cieľ nad mapou s odkazom na celý projekt a štyri herné akcie v jednom rade. Katalóg do 800 px používa horizontálny rad, neodsúva projekt mnohými riadkami kariet.
- Dom, škola, park a pôvodná opustená stanica majú nové transparentné ilustrácie. Prepínač „Ilustrácie / Pôvodná kresba“ umožní porovnanie v tej istej štvrti. Zrekonštruované stanice zachovávajú svoje odlišné SVG varianty. Sada je označená ako ukážka štyroch objektov, ďalšie budovy zatiaľ nie sú prekreslené.
- Tlmená lúka, teplejší podklad, krátke objavenie budovy a hover katalógu; rešpektuje sa reduced-motion. Herný model, ekonomika a formát uloženia bez zmeny.
- Ilustrácie majú spolu ~804 kB; zdroj a zadanie v `public/images/games/republic/README.md`. V prípade chyby načítania sa použije existujúca SVG grafika.

### Overenie

- TypeScript, ESLint troch upravených komponentov, produkčný build a `verify-republic` PASS. Testy pokrývajú 73 ciest kapitolou aj ukladanie. Impeccable detector: `[]`. Build ponecháva upozornenie na veľké balíky aplikácie.
- Lokálny prehliadač: desktop a mobilný override 390 × 844 (reálna šírka obsahu 375 px kvôli scrollbar); šírka dokumentu neprekračuje viewport. Katalóg 8 položiek má výšku 223,5 px. Overené otvorenie a zavretie katalógu, výber Parku, náhľad C4 s napojením a cenou, zrušenie bez zápisu, prepínač ilustrácií a obnovenie politického panelu. Konzola bez chýb.
- Náhľady v `docs/mala-republika/previews/`: mobile-illustrations.png, desktop-illustrations.png. Nejde o test fyzického telefónu ani kompletný audit čítačky obrazovky.

**Stav:** 30. 9. nasadené na `https://mandat-preview.mandat.workers.dev/?v=game&g=republic` (commit `6e7b3ae`, Cloudflare Worker verzia `c074086d-554d-411a-bcc9-4ed49bb8ba5c`). Git push aj priamy Wrangler deploy prešli, verejná stránka ukázala nové ilustrácie a prepínač grafiky bez chyby v konzole. Peter môže posúdiť výtvarný smer; až potom rozšíriť ilustrácie na zvyšné budovy a postavy. Účty a cloudové uloženie zostávajú samostatný priechod B.

## 30. 9. 2026 — hrateľný úvod s Evou (lokálna revízia)

Používateľ odsúhlasil prerobiť začiatok tak, aby bolo jasné čo, prečo a ako robiť, pri zachovaní doterajšej hry. Tento priechod mení prvé dve úlohy, nie celú kapitolu.

- Nový `components/republic-intro.tsx`: krátky cieľ obnovy štvrte, učiteľka Eva, voľba parku alebo záhrady, priestorová úloha s knižnicou, reakcia po splnení a okamžité pokračovanie. Sprievodcu možno preskočiť a počas prvých dvoch krokov znovu zapnúť.
- Počas úvodu je viditeľná jedna úloha a mapa. Katalóg, zbierka a objednávky sa ukážu po úvode alebo jeho preskočení. Desktop má zadanie vedľa mapy, mobil nad mapou. Pôvodná grafika aj ilustrácie zostali zachované.
- `lib/republic-intro.ts` overuje odporúčané políčka cez skutočné herné príkazy a podmienky cieľa. Rovnaká nápoveda je vizuálne na mape aj v názvoch tlačidiel mriežky pre asistívne technológie. Stavba/presun stále vyžaduje potvrdenie. Po potvrdení sa pohľad vráti k zadaniu.
- Školský dvor aj knižnicu možno dokončiť v ten istý deň; ďalšie kroky ostávajú denné. Pravidlo je v jadre, bez resetu alebo migrácie uloženia. Presun parku uvoľní jediné počiatočné miesto pre knižnicu pri škole a naučí bezplatné úpravy štvrte. Nedostatok zdrojov odkáže na dostupné zásielky/objednávky.
- Nové automatizované scenáre: park aj záhrada → prvá odmena → načítanie uloženia → vhodný presun → knižnica → druhá odmena v ten istý deň; tretí krok a posun času dozadu ostávajú zamknuté.

### Overenie tejto revízie

- `node scripts/verify-republic.mjs` — PASS vrátane nového úvodu, pôvodných 73 ciest kapitoly a testov lokálneho uloženia/súbehu.
- TypeScript a ESLint nad zmenenými TS/TSX/testami — PASS.
- `npm run build` — PASS po spustení mimo Windows sandboxu (pôvodný pokus skončil spawn EPERM). Zostáva upozornenie na veľké chunky aplikácie.
- Impeccable detector nad UI — bez nálezov. Finálne desktopové rozloženie overené snímkou.
- Prehliadač: celý parkový úvod vrátane presunu, stavby knižnice, dvoch odmien, prechodu do voľnej hry a reloadu. Overený výber políčka klávesnicou v zozname, preskočenie sprievodcu a návrat. Bez chýb v konzole. Mobilné viewporty 390/360 px (šírka obsahu 375/345 px kvôli scrollbar): bez horizontálneho pretekania, karty voľby približne 78 px vysoké. Nejde o test fyzického telefónu ani plný audit čítačkou obrazovky.
- Snímky: `previews/intro-desktop.png`, `previews/intro-choice-mobile.png`, `previews/intro-success-mobile.png`.
- Test prebiehal na samostatnom lokálnom origine `http://[::1]:5173/?v=game&g=republic`. Vlastná testovacia štvrť je po kontrole vynulovaná cez bežnú funkciu s automatickou zálohou a pripravená na prvé hranie. Uloženie používateľa na localhost ani verejnom webe nebolo resetované.

**Zatiaľ iba lokálne, bez pushu a nasadenia.** Účty, nové denné udalosti, postavy pohybujúce sa po mape a prepracovanie neskorších kapitol nie sú súčasťou tejto revízie. Ďalší krok: používateľ vyskúša prvé dve úlohy a posúdi zrozumiteľnosť a tempo pred nasadením.

## 1. 10. 2026 — denná slávnosť (lokálny prototyp)

Na schválený zámer dlhšieho denného eventu nadväzuje jedna viacstupňová výzva: program, miesto v skutočnej štvrti, dve stanovištia, komplikácia a výsledok. Tri susedské priority, obmedzených 8 bodov a priestorové bonusy vytvárajú rozdielne výsledky. Pred potvrdením reakcie vidno jej dopad. Mapové prípravy ostávajú oddelené od budov a ekonomiky pôvodnej hry.

- Nové jadro `lib/republic-festival.ts`, komponent `components/republic-festival.tsx`, samostatné CSS a vrstva príprav v `republic-map.tsx`. Hra má viditeľný vstup do výzvy; pôvodná kapitola aj úvod zostávajú dostupné cez návrat do štvrte.
- Denný cyklus troch cieľov, tri komplikácie a tri reakcie pri každej. Replay zachováva prekvapenie a najlepšie skóre daného dňa; preplánovanie vráti body. Starší rozpracovaný deň možno dokončiť, nový deň začne novým zadaním.
- Uloženie v1 prijíma staré mestá bez `festival`. Nový stav sa validuje a používa pôvodný adaptér s ochranou súbežných zápisov. Zmenené rozloženie štvrte nemôže potichu viesť k finále s neplatnými stanovišťami.
- Herňa má aktualizovaný popis bez neovereného časového sľubu.

### Overenie

- `node scripts/verify-festival.mjs`: 2 250 plánov, 955 výsledkov 3/3, dosiahnuteľné skóre 0/1/2/3; všetkých deväť kombinácií denného cieľa a udalosti má úspešné aj neúspešné plány. Test neprechádza všetky permutácie umiestnenia, pri jednotlivých stanovištiach používa prvé platné miesto.
- Testy rozpočtu, priestorového účinku, zachovania ekonomiky, neplatných ťahov, starých/nových uložených stavov, polnoci, retry/preplánovania a konfliktu revízií. Pôvodný `verify-republic`: 73 ciest kapitoly, úvod a lokálne uloženie PASS.
- TypeScript, ESLint zmenených súborov a produkčný build PASS. Build má existujúce upozornenie na veľké chunky. Impeccable detector UI bez nálezov.
- Prehliadač: kompletná slávnosť kliknutím vrátane mapových miest, oboch stanovišť, reakcie a výsledku 3/3. Reload obnovil pokus z 30. 9.; jeho dohranie a následné otvorenie 1. 10. ukázalo nový cieľ a rozpočet 8/8. Konzola bez chýb. Vývojový server bolo potrebné znovu spustiť po jeho ukončení; čerstvé načítanie reaguje na kliknutia.
- Desktop a mobilný viewport 390 × 844 (obsah 375 px): bez horizontálneho pretekania, päť krokov v jednom rade. Náhľady v `previews/festival-*.png`. Nie je to test fyzického telefónu ani úplný audit čítačky obrazovky.
- QA origin `http://[::1]:5173` používa vlastnú testovaciu štvrť; používateľovo uloženie na localhost/verejnom webe nebolo resetované. Testovací náhľad je pripravený na začiatku výzvy 1. 10.

**Iba lokálne, bez pushu a nasadenia.** Rozsah: jeden pilot slávnosti s dennými variantmi; bez účtov, rebríčka, ďalších typov eventov a pohybujúcich sa obyvateľov. Ďalší krok: Peter vyskúša výzvu bez návodu a posúdi rozhodovanie a náročnosť. Až podľa toho rozširovať obsah alebo nasadiť.

## 1. 10. 2026 — nasadenie dennej výzvy a štart mobilnej aplikácie

Peter požiadal nasadiť lokálnu verziu na mobilné vyskúšanie a uviedol, že ikona na ploche otvára Hospodárenie/Viac.

- Nasadený celý schválený lokálny prototyp vrátane úvodu s Evou a dennej slávnosti na `https://mandat-preview.mandat.workers.dev/?v=game&g=republic`. Priamy Wrangler deploy: verzia `b90098ea-06a4-4587-8e91-781ec453d01f`.
- `lib/app-launch.ts` nastaví úvod pred hydratáciou pri novej navigácii v standalone aplikácii, aj keď stará ikona obsahuje query inej sekcie. Reload a back/forward zachovávajú sekciu; bežné odkazy v prehliadači ostávajú funkčné. Manifestové skratky majú `launch=shortcut` a zachovajú explicitný cieľ. Samotný manifest má naďalej `start_url: /`.
- iOS návod na pridanie ikony najprv prepne na Prehľad, aby nová ikona neuložila náhodnú sekciu. Verzia service worker cache zvýšená na `2026-10-01`; herné localStorage dáta sa nemažú.
- `verify-app-launch`, `verify-festival`, `verify-republic`, `verify-data`, TypeScript, ESLint, produkčný build a Wrangler dry-run PASS. Build ponecháva upozornenie na veľké chunky.
- Online mobilný viewport 390 × 844: úvod aktívny Prehľad, Viac zatvorené, obsah 375/375 px; nový bootstrap prítomný. Priamy herný odkaz otvoril novú slávnosť, začatie aj reload zachovali stav, konzola bez chýb. Snímka `previews/festival-online-mobile.png`.
- Standalone štart je overený izolovaným testom bootstrappingu, nie fyzickým iPhonom/Androidom. Oprava sa vykoná pri novom načítaní dokumentu; samotný návrat do už bežiacej aplikácie z pozadia zámerne neprerušuje rozohranú hru.

**Nasadené.** Ďalší krok: Peter otvorí ikonu nanovo a vyskúša slávnosť na svojom mobile. Ak ikona drží starý dokument, najprv obnoviť stránku alebo aplikáciu úplne zavrieť a znovu otvoriť; nepristupovať k mazaniu herných dát.

## 1. 10. 2026 — plynulé pokračovanie, sedem herných dní (iba lokálne)

Peter požiadal o pokračovanie po úvode, väčšiu výzvu a možnosť posunúť herný deň bez čakania. Zostáva existujúca štvrť aj jadro slávnosti.

- Po otvorení knižnice hlavná akcia „Pripraviť prvú slávnosť“ spustí sedemdňový príbeh. Vedľajšia umožní najprv upravovať štvrť. Staršia rozpracovaná denná výzva sa neresetuje.
- Sedem zadaní podľa `journeyDays`: privítať Ninu, lacný piknik, pokoj pre Evu, Milanov deň, spokojnosť všetkých, príprava na dážď a finále so spojením s okolím. Menia sa požadované ciele, rozpočet 7–9 a rezerva 1–2 body. Pravidlá a tabuľka sú v GAME.md.
- Tri splnené ciele odomknú okamžitý ďalší herný deň. Retry zachová komplikáciu aj najlepší výsledok. Po siedmom sa jednorazovo odomkne slávnostná brána s akciou na bezplatné umiestnenie do skutočnej štvrte. Skutočná denná výzva zostáva dostupná zvlášť.
- Herné dni neposúvajú dátum, zásielky, ekonomiku ani neskoršie denné limity obnovy stanice. Uloženie v1 sa rozširuje voliteľným `festivalJourney` a režimom/číslom dňa v `festival`; staré uloženia sa prijímajú bez resetu.
- UI: kompaktná os siedmich dní, náhľad odmeny, susedské zadanie a jasná hlavná akcia po výsledku. Posun dňa otvorí jeho hlavičku; bežné prípravné kroky vracajú pohľad k rozhodnutiam. Zachovaná dioráma, teplá paleta a rozloženie pre mobil.
- Zmeny: `lib/republic-festival.ts`, `lib/republic.ts`, `components/republic-festival.tsx`, `components/republic-game.tsx`, `components/republic-intro.tsx`, `app/republic-festival.css`, nový `scripts/verify-journey.mjs`, GAMES.md a dokumentácia tejto hry.

### Overenie tejto revízie

- `node scripts/verify-journey.mjs` — PASS: šesť celých príbehov po parkovom aj záhradnom úvode pri troch seedoch, 3 866 vyhodnotených plánov pri hľadaní riešenia. Kryje neúspech/retry, blokovanie predčasného posunu, zachovanie najlepšieho skóre, načítanie každého zapísaného stavu, jednorazovú bránu a nezmenený skutočný dátum/ekonomiku. Nejde o vyčerpávajúcu analýzu všetkých rozložení.
- `verify-festival` — PASS (2 250 plánov); `verify-republic` — PASS (73 ciest a adaptér uloženia). TypeScript, ESLint zmenených TS/TSX/testov a produkčný build — PASS. Build ponecháva existujúce upozornenie na veľké chunky.
- Prehliadač: celý parkový úvod vrátane presunu a knižnice → prvá príbehová slávnosť cez mapu → výsledok 3/3 → obnovenie s výsledkom zachovaným → okamžitý druhý deň s rozpočtom 7 a rezervou 2 → reload zachová druhý deň → návrat do štvrte a pokračovanie. Konzola bez chýb.
- Desktop a mobilný viewport 390 × 844 (obsah 375 px), bez horizontálneho pretekania. Uložené `previews/journey-desktop.png` a `previews/journey-mobile.png`. Nejde o kontrolu fyzického telefónu ani plný audit čítačky obrazovky. Odmena po všetkých siedmich dňoch je overená jadrom; v prehliadači sa ručne dohral prvý deň a otvoril druhý.
- Čistý QA origin `http://[::1]:5174` je lokálny HTTP proxy na už bežiaci server 5173; obsahuje vlastnú testovaciu štvrť. Používateľovo uloženie na 5173/localhost/verejnom webe sa neresetovalo. Samotný upravený web naďalej beží na 5173.

**Bez pushu a nasadenia.** Je to sedem variantov jedného priestorového hlavolamu, nie sedem druhov minihier; dlhodobá zábavnosť a návratnosť ešte nie sú overené hráčmi. Ďalší krok: Peter si vyskúša nadväzujúci príbeh lokálne a posúdi tempo aj náročnosť, potom prípadne nasadiť túto revíziu. Účty a cloud zostávajú samostatná etapa.

## 1. 10. 2026 — sedemdňový príbeh nasadený

- Na Petrov pokyn „ok nasad“ publikovaná vyššie overená revízia na `https://mandat-preview.mandat.workers.dev/?v=game&g=republic`. Wrangler dry-run a priamy deploy PASS; Worker verzia `0db06e43-b1a4-4dc8-9479-c661a1c659cb`.
- Verejný prehliadač: existujúca denná slávnosť prijatá bez resetu, dohraná cez mapu na 3/3, otvorený nový sedemdňový príbeh, reload zachová jeho prvý rozpracovaný deň. Konzola bez chýb.
- Mobilný viewport 390 × 844: obsah 375 px bez horizontálneho pretekania; aktuálny deň, os príbehu a odmena sa zobrazujú. `previews/journey-online-mobile.png`. Fyzický telefón zostáva na vyskúšanie používateľom.
- Zdrojové súbory, test a dokumentácia tejto revízie sa synchronizujú do GitHub `main`; následný Cloudflare Build nasadzuje rovnakú implementáciu. Účty ani cloudové uloženie sa nepridávajú.

**Nasadené.** Ďalší krok: Peter si zahrá viac dní na mobile a posúdi rozhodovanie, tempo a zábavnosť; až potom rozširovať druhy udalostí.
