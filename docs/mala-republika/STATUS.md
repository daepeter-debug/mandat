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

## 1. 10. 2026 — ilustrovaný vstup do Malej republiky

- Nová AI ilustrácia štvrte pri stanici, výtvarne zladená s `town-seasons-v2.webp` hry Do decembra. Nahrádza tri samostatné objekty na karte Herne a malú kresbu vo vstupnom privítaní.
- Privítanie je na desktope dvojstĺpcové, na mobile obrázok nad textom. Po „Pomôcť Eve pri škole“ alebo „Chcem objavovať sám“ sa zobrazí skutočná mapa. Rozpracovaná štvrť privítanie preskočí podľa existujúceho postupu; herné jadro, uloženie a grafika samotných objektov ostali nezmenené.
- Asset má 1440 px a 720 px WebP variant (506 / 157 KiB), `srcSet`, rozmery pre stabilný layout a prioritné načítanie len v úvode. Exact prompt je `research/republic-cover-v2.prompt.txt`, pôvod a prompt sú zaznamenané aj pri obrázkoch.
- TypeScript, cielený ESLint, produkčný build, Impeccable detector (`[]`) a Wrangler dry-run PASS. Nezávislý vizuálny review: **ship**, rozsah úvod a karta, nie nezmenená herná mapa. Dokumentácia rozšírená v DESIGN.md.
- Lokálny produkčný náhľad: desktop 1280 × 900 a mobil 390 × 844, bez horizontálneho pretekania; primárne tlačidlo 46 px, preskočenie 44 px. Overené oba vstupy na mapu a presun klávesnicového fokusu. Screenshoty `previews/cover-desktop.png`, `previews/cover-mobile.png`.
- Na pokyn „ok pokracuj a nasad“ nasadené na existujúci Workers web; verzia `eb9289f0-dd8a-4dd6-a0db-fdbc53366755`. Online sa nová ilustrácia načítava. Nejde o zjednotenie všetkých budov na hernej mape; to zostáva samostatnou možnou úpravou.

## 1. 10. 2026 — Sol: dokončený súvislý terén (lokálne)

- `components/republic-map.tsx`, `app/republic-game.css`, `public/images/games/republic-terrain-v1.webp`: ilustrovaná lúka s okolitou zeleňou a potokom nahrádza drevenú platformu a trvalú šachovnicu. Domy aj cesty ostávajú skutočné uložené objekty. Mriežka je voliteľná, pri stavbe automatická; odporúčané miesta a klávesnicový výber zostali zachované. Obrázok sa načíta až v okolí viditeľnej mapy; pri chybe ostáva použiteľný zelený podklad.
- Náhľady: `previews/terrain-desktop.png`, `previews/terrain-mobile.png`. Mobilná emulácia nastavená na 375 px (IAB raster 360 px): bez vodorovného posunu stránky. Pri zoom 1,5 je vodorovný posun iba v mape; zvislá mapa má scrollHeight = clientHeight. Koliesko nad mapou posunulo stránku z 545 na 681 px. Ťah na fyzickom telefóne zatiaľ NEOVERENÝ.
- PASS: verify-republic (73 ciest + úložisko), verify-festival (2250 plánov), verify-journey (3866 plánov), verify-data (38 meraní), tsc --noEmit, ESLint nad mapou a npm run build. Build má existujúce upozornenie na veľké balíky. Impeccable detector: []; nezávislá kontrola terénu: ship, bez materiálnych opráv.
- Presný prompt a pôvod ilustrácie: `research/republic-terrain-v1.prompt.txt`, sidecar pri WebP. Ekonomika, save ani politická časť sa nemenili. Bez pushu a nasadenia.

**Ďalší krok:** rozšírenie 1 — Živá štvrť, najprv čisté časové/cestné jadro a verify-living, potom obyvatelia a sezónna grafika. Rozšírenia 2/3/4 čakajú v poradí; nasadenie až po Petrovom OK. Fyzický mobil treba otestovať pri lokálnej ukážke/následnom schválenom nasadení.

## 1. 10. 2026 — Sol: rozšírenie 1, Živá štvrť (lokálna ukážka)

- Najprv hotové a overené čisté `lib/republic-living.ts` + `scripts/verify-living.mjs`, potom UI v `components/republic-living.tsx`, zapojenie do `components/republic-map.tsx` a scoped `app/republic-game.css`. Bez nových saved polí, bez zmien ekonomiky alebo politickej časti.
- Deterministické napojené domy/destinácie a najkratšie ortogonálne cestné trasy vrátane námestia. Najviac14 chodcov, v noci najviac1venčiaci sused so psom. Školáci idú ráno do školy len v pracovné dni; dospelí do dielne/trhu/stanice, seniori do ambulancie/parku; popoludní park/záhrada/knižnica, večer kultúrny dom/námestie. Chodci idú pod budovami, ľudia pri parku/záhrade/trhu/fontáne sú pri prednom okraji objektu. Pri parku sa deti hrajú s loptou.
- Skutočný Bratislavský čas cez Intl, bez pevného UTC posunu; NOAA východ/západ48.149N17.108E a plynulý súmrak. Päť kontrolných októbrových dátumov vrátane24./25.10. porovnaných s timeanddate ±5min; zdroje a konkrétne hodnoty v `research/republic-sunlight.md`. Večer sa rozsvietia okná domov/školy. Pôvodná opustená stanica so zabednenými oknami zostáva bez nového osvetlenia.
- Jeseň lístie s maximom koncom októbra, niektoré zimné dni sneh, jar kvety, leto svetlušky pri súmraku. Efekty sú herné dekorácie, nie predpoveď počasia. Voliteľný jasne označený náhľad rána/popoludnia/súmraku/noci nemení postup ani zdroje a predvolený režim je skutočný čas.
- Raster atlas `public/images/games/republic/residents-v1.webp`: dieťa/dospelá/senior/pes, každý3fázy,384×640, skutočný alpha,71976B. Pôvod/exaktný prompt/reference/ořez normalizácie: sidecar a `research/republic-residents-v1.*`. Obrázok sa žiada iba pri viditeľnej scéne. Chôdza má limit12FPS; IntersectionObserver + visibilitychange zastavia rAF, mimo mapy sa živé vrstvy nevykresľujú. Reduced-motion ruší rAF a všetky nové CSS animácie.

### Overenie tejto verzie

- PASS: verify-republic73ciest+úložisko, verify-festival2250plánov, verify-journey3866plánov, verify-data38meraní, nový verify-living (deterministické trasy/interpolácia, nočné limity, pracovné dni, DST, slnko/sezóny, nezmenený save), tsc --noEmit, celý `npm run lint`, `npm run build`. Existujúce upozornenie buildu na veľké chunky zostáva.
- Impeccable detector [] (raz nad novým UI); nezávislý finish reviewer: ship, žiadne materiálne opravy. Documenter doplnil lokálne DESIGN.md, globálne dizajnové súbory zostali zachované.
- Ukážky: `previews/living-desktop.png`, `living-desktop-night.png`, `living-mobile.png`, `living-mobile-night.png`, `living-mobile-park.png`. Desktop1280×900; mobil375×844 (IAB raster360px), stránka nepresahuje viewport. Stavanie parkuB4 cez náhľad/potvrdenie funguje; v reálnom popoludní9chodcov a2deti pri parku. Pri editácii mapa640px vodorovne posuvná, clientHeight=scrollHeight480px, stránka bez overflow. Testované v samostatnej lokálnej testovacej štvrti na5176, produkčné uloženie nebolo resetované.
- Reálne odrolovanie mapy mimo viewport: mapBottom=-251.78px, počet vykreslených chodcov0; návrat ich obnoví. Fyzický telefón a manuálna zmena systémového reduced-motion/skrytie karty zatiaľ NEOVERENÉ; podpora je v zdrojovom kóde. Nevyhlasovať tieto manuálne skúšky za hotové.
- Lokálny produkčný náhľad: http://127.0.0.1:5176/?v=game&g=republic . Bez pushu/nasadenia; Git push by cez existujúce Cloudflare prepojenie mohol spustiť deploy, preto tiež čaká na OK.

**Konkrétny ďalší krok:** Peter si pozrie rozšírenie1 a potvrdí nasadenie (alebo úpravy). Potom pull --rebase pred pushom vlastných commitov, kontrola fyzického telefónu, následne rozšírenie2: scénická slávnosť a PNGpohľadnica. Úplný kontrakt a poradie2→3→4 v `LIVING-EXPANSIONS.md`; voľby majú termín pred24.10.2026. Tieto tri rozšírenia ešte nie sú implementované.

## 1. 10. 2026 — terén a Živá štvrť nasadené

- Peter potvrdil nasadenie slovom „Ok“. Pred pushom vykonaný `git pull --rebase` (main už aktuálny), potom push vlastných commitov `30b235f` (terén) a `256121c` (Živá štvrť). Existujúce Cloudflare Workers Builds prepojenie nasadilo verejný web: https://mandat-preview.mandat.workers.dev/?v=game&g=republic .
- Oba verejné WebP súbory vracajú HTTP 200; SHA-256 nasadeného terénu aj atlasu obyvateľov zodpovedá lokálnym súborom. Obnovený verejný prehliadač zobrazuje nový terén a ovládač Živej štvrte. V rannom náhľade sa vykreslilo 9 chodcov; po kontrole vrátený predvolený skutočný čas. Existujúca štvrť a rozpracovaný príbeh zostali dostupné, bez resetu uloženia.
- Mobilný viewport 375 × 844: scrollWidth stránky 360 px, bez horizontálneho pretekania. Dôkaz verejnej verzie: `previews/living-deployed-mobile.png`. Predchádzajúce overenia jadra, dát, TypeScriptu, ESLintu a produkčného buildu sú uvedené vyššie; od ich vykonania sa kód nemenil.
- Ťah cez mapu na fyzickom telefóne naďalej NEOVERENÝ; Peter ho má vyskúšať na verejnom odkaze. Ručné prepnutie systémového reduced-motion a skrytie karty zostávajú neoverené manuálne skúšky.

**Ďalší krok:** rozšírenie 2 — slávnosť na mape a zdieľateľná PNG pohľadnica, najprv čisté jadro a testy, potom UI a lokálna ukážka. Nasadenie tejto ďalšej časti až po novom Petrovom OK. Návšteva suseda a komunálne voľby ešte nie sú implementované; zachovať poradie 2 → 3 → 4 a termín volieb pred 24. 10. 2026.

## 1. 10. 2026 — Sol: rozšírenie 2, slávnosť a pohľadnica; tečúca rieka

- Najprv čisté `lib/republic-celebration.ts` a `scripts/verify-celebration.mjs`, potom `components/republic-celebration.tsx`, `components/republic-postcard.ts` a zapojenie do existujúcej mapy/slávnosti. Bez nových polí uloženia, bez zmeny ekonomiky, príkazov alebo politickej časti. Staré readSave ostáva funkčné.
- Po festival-response sa odohrá 24-sekundová scéna. Pred otvorením sú traja zvedavci; po otvorení 4 + 5 × počet spokojných susedov, obmedzené kapacitou napojených cestných políčok v okolí programu (najviac 19). Čítanie má knihy, piknik taniere, hudba drobný tanec a rytmus; lampióny sa rozsvietia po začatí. Postavy sú pod vrstvou budov. Scéna používa existujúci ilustrovaný atlas, žiadny nový raster. Po dohraní ostáva pokojný dav; obnovenie dokončenej slávnosti nezačína scénu znova, tlačidlo „Prehrať scénu“ áno.
- PNG 1080 × 1350 používa skutočný aktuálny pokus: názov štvrte/programu, dátum slávnosti, hviezdy, spokojnosť a reakcie Evy, Milana a Niny, mapu s finálnym davom a verejnú adresu. Klon SVG načíta fonty, vloží všetky mapové image ako data URL a odstráni vstupnú/mriežkovú vrstvu. Pôvodnú mapu nemení. Počas exportu sú herné príkazy zablokované, aby výsledok a mapa zostali zhodné. Najprv vznikne náhľad; ďalší klik zachová aktiváciu používateľa pre navigator.share so súborom, nedostupné zdieľanie má download fallback. Samostatné „Stiahnuť PNG“ ostáva dostupné.
- Peter doplnil požiadavku tečúcej rieky. Tri jemné SVG prúdy sledujú potok v existujúcom teréne; žiadny nový obrázok ani náhodné častice. Animácia je deterministická CSS, mimo mapy sa vrstva nevykresľuje, pri skrytej karte sa pozastaví. Reduced-motion zakáže animácie rieky aj slávnosti. Rieka nepreberá vstup a nemení herné údaje.

### Overenie rozšírenia 2

- PASS: verify-republic (73 ciest + úložisko), verify-festival (2250 plánov), verify-journey (3866 plánov), verify-data (38 meraní), verify-living, nový verify-celebration (všetky témy, veľkosť davu podľa spokojnosti/kapacity, deterministické napojené pozície, priebeh a pokojné finále, skutočné údaje pohľadnice, staré uloženie). PASS tsc --noEmit, celý ESLint, produkčný build; po doplnení rieky znovu tsc, ESLint nad dotknutými komponentmi, verify-celebration a build. Existujúce upozornenie na veľké chunky ostáva.
- Browser QA na samostatnej lokálnej štvrti: čitateľský program, tri ciele, 14 hostí pri dvoch spokojných susedoch, otvorenie a prehratie scény, pokojné finále po obnovení, skutočný PNG náhľad 1080 × 1350. Desktop 1280 × 900, mobilný viewport 375 × 844 (IAB raster 360 px), bez horizontálneho pretekania stránky. Pri dokončenom mobile je mapa pred výsledkami. Konzola bez error/warn. CSS offset prúdu sa pri viditeľnej mape menil, pohyb rieky je aktívny.
- Náhľady: `previews/celebration-desktop.png`, `celebration-mobile.png`, `celebration-postcard-mobile.png`. Impeccable detector raz nad novým UI: []; rieka pridaná následne a zahrnutá do záverečnej vizuálnej kontroly.
- Finish reviewer najprv `fix`: našiel chýbajúce publikovanie konečného rámca pri 12 FPS a neprehratie po prepnutí zo zoznamu Miesta. Obe opravené v useCelebrationOpening. Finálny hudobný pokus s 19 hosťami overený v prehliadači: počas scény running=true/rytmus prítomný, po skončení running=false/rytmus neprítomný; Miesta → Prehrať scénu obnoví postupné príchody (15 z 19 počas priebehu). Nová pohľadnica koncertu je kompletný PNG 1080 × 1350. Náhľady recapturované z opraveného buildu; doplnkový `previews/celebration-music-still.png`. Bounded verdict pass: `ship`, bez zostávajúcich materiálnych opráv. Znova PASS build a ESLint dotknutého hooku.
- Vytvorenie PNG je overené jeho reálnym obrazovým náhľadom a rozmermi. IAB nevrátil udalosť download; uloženie súboru na disk a natívne zdieľanie na fyzickom telefóne ostávajú NEOVERENÉ. Rovnako ťah cez mapu na fyzickom telefóne a ručné systémové reduced-motion/skrytie karty. Neoznačovať ich za manuálne PASS.
- Peter počas práce výslovne autorizoval rovno nasadzovať overené rozšírenia. Táto aktualizácia nahrádza skoršie čakajúce OK; zachytená aj v `LIVING-EXPANSIONS.md`. Nasadenie tejto verzie sa zapíše po kontrole verejného webu.

**Ďalší krok:** rozšírenie 3 — návšteva suseda cez krátky prísne validovaný odkaz, iba na čítanie a bez zásahu do vlastného uloženia. Potom rozšírenie 4 — fiktívne komunálne voľby, s overením aktuálnych právnych zdrojov a termínom pred 24. 10. Tieto dve časti zatiaľ nie sú implementované.

### Rozšírenie 2 nasadené

- Vlastné súbory commitnuté ako `02deab6`, pred pushom `git pull --rebase` (aktuálny main), push na GitHub úspešný. Verejný web potom ešte ukazoval staré CSS, preto overený build nasadený priamo cez `npm run deploy:preview` s existujúcim `wrangler.preview.jsonc` do mandat-preview. Cloudflare verzia `6cfe9a8a-e13a-4db6-bbab-9e5c881ee946`.
- Nový verejný herný JS vracia HTTP 200 a SHA-256 je zhodné s lokálnym overeným buildom. Obnovená verejná hra vykresľuje všetky tri aktívne prúdy rieky; mobil 375 × 844 má scrollWidth 360 px a konzola nemá error/warn. Verejná rozpracovaná slávnosť nebola resetovaná ani dokončená počas kontroly. Dôkaz `previews/celebration-deployed-mobile.png`.
- Verejný odkaz: https://mandat-preview.mandat.workers.dev/?v=game&g=republic . Natívne zdieľanie a posúvanie prstom ostávajú na vyskúšanie na fyzickom telefóne.

## 1. 10. 2026 večer — kontrola nasadenia a opravy (Claude, commit `bed6f5a`)

- Kontrola nasadeného `26f4c25`: všetky verify skripty, TypeScript, ESLint aj build prešli; konzola na živom webe bez chýb. Zastaraný bol tmavý režim (`theme-dark.css` neobsahoval `republic-festival.css` ani nové štýly hry).
- Opravené a nasadené:
  - **pohľadnica** kreslí terén, hostí a lampióny aj vtedy, keď mapa ešte nebola na obrazovke (`festivalStill` v `republic-map.tsx`);
  - **ľudia pri budovách** (gatherings) sa radia s budovami podľa hĺbky x + y v jednej vrstve (`layers` + `GatheringPerson` v `republic-map.tsx`), v noci ich stmaví rovnaký závoj;
  - **tmavý režim** pregenerovaný;
  - **dátum** „1. 10. 2026“ (`slovakDate` v `lib/republic-celebration.ts`, test vo `verify-celebration`);
  - **„Chcem objavovať sám“** sa pamätá v `localStorage` kľúči `mandat:republic:v1:explore` (mimo uloženia štvrte; reset štvrte ho zmaže).
- Overené naživo na mobile 375 px: pohľadnica vytvorená bez posúvania k mape má terén aj hostí; po obnovení stránky sa Eva po „objavovať sám“ neukáže; ľudia sú v DOM medzi budovami podľa hĺbky.
- **Pre Codex:** necommitnuté zmeny v pracovnom strome (zoznam miest slávnosti, potok) vznikli nad `26f4c25`. Pred pokračovaním: `git stash` → `git pull --ff-only` → `git stash pop` (zmeny sú v iných častiach súborov). Po každej zmene CSS spustiť `node scripts/build-dark.mjs`.
- Netestované: animácia slávnosti v reálnom čase (v skrytom paneli nebeží requestAnimationFrame) a pohľadnica/zdieľanie na fyzickom iPhone.

## 1. 10. 2026 noc — prehľadnosť, plán hráča, spokojnosť susedov a voľby (Claude, commit `ce88964`)

Podnet: Petrova spätná väzba z testovania hry — hráč má vždy vedieť, *kde je, čo má teraz urobiť, čo už splnil a čo mu ešte chýba*; výrazné potvrdenie po splnení; jasné upozornenie, keď je zablokovaný; mapa a menu bez neustáleho približovania; zrozumiteľné podmienky postupu (napr. 2/3 spokojní susedia na slávnosti). Peter výslovne požiadal všetko dátové spraviť a hneď nasadiť, graficky náročné časti nechať na Codex.

- **Panel „Kde som a čo ďalej“** (`components/republic-plan.tsx`, dáta v čistom `lib/republic-plan.ts`): hlavný cieľ s meradlami Projekt x/7, Slávnosti x/7, Spokojnosť %, odkaz na voľby s odpočtom; karta „Teraz môžeš / Ďalší krok“ s odmenou a jedným tlačidlom. Priorita: krok projektu > finále > objednávka > zásielka > slávnosť. Keď nič nečaká: „Na dnes máš projekt aj objednávky hotové“ + preplánovanie alebo slávnosť.
- **„Dnes v štvrti“** na začiatku bočného panela: krok projektu, tri objednávky, zásielka a slávnosť so stavom (dá sa hneď / ešte chýba / hotové), pokrokom (napr. 1/3), odmenou a priamym tlačidlom. Nahradil starý zoznam objednávok a mobilný odkaz `.republic-current-goal`.
- **Potvrdenie po splnení** (`WinBanner`): „Hotovo: … · Získal si +2 mince, +1 materiál · Ďalej: …“, zmizne po 8 s; počas úvodu s Evou sa neukazuje. Jemné zvuky cez Web Audio bez súborov (`lib/republic-sound.ts`, vypínač v hlavičke, kľúč `mandat:republic:v1:sound`), len po kliknutí hráča.
- **Zablokovanie**: oranžové upozornenie v paneli aj nad mapou, keď štvrť nemá voľné políčko, keď žiadne voľné políčko nie je pri ceste, alebo keď cieľ kroku nemá kam (`blockers`: `full`, `no-road`, `goal-space`). Pri umiestňovaní budovy to isté priamo v paneli stavby (`placementOptions` je len priestorové, peniaze nerieši).
- **Podmienky postupu slávnosti** (`FestivalGaps` v `republic-festival.tsx`): pod výsledkom dňa „Na deň N ešte chýba · Splnené x z 3 cieľov“ a pri každom chýbajúcom cieli konkrétne, čo chýba (kto zo susedov má koľko, spokojnosť začína od 3, čo mu pomôže). Tlačidlo ďalšieho dňa ostáva zamknuté ako doteraz.
- **Spokojnosť a priania** (`lib/republic-trust.ts`): každý dom chce cestu, zeleň a lekára do 2 políčok, školu a obchod v sieti; chýbajúce prianie je bublina nad domom (`WishGlyph` v `republic-map.tsx`). Spokojnosť = 70 % domy, 15 % projekt, 15 % slávnosti. Nič sa neukladá, všetko sa počíta zo stavu štvrte.
- **Mapa**: okno mapy najviac `min(64vh, 600px)` so scrollom, v sústredenom režime na mobile lepkavý panel akcií dole (menu bez odzoomovania), na displeji do 560 px štart s priblížením 1,5×.
- **Rozšírenie 4 — komunálne voľby 24. 10. 2026** (`lib/republic-election.ts`, `components/republic-election.tsx`), spravené pred rozšírením 3 na Petrovu žiadosť; zákon č. 180/2014 Z. z. overený v plnom znení:
  - Eva/Milan/Nina na starostu, 6 kandidátov do zastupiteľstva (Spolok Lipová 2, Stanica žije 2, 2 nezávislí), 3 mandáty v 1 obvode, lístky abecedne;
  - voliči z domov (napojený dom 6, nenapojený 3, základ 24, max. 90), účasť 35–80 % podľa spokojnosti, preferencie podľa napojených služieb a slávností (hrdina dňa získa dôveru), deterministicky podľa seedu;
  - § 182 ods. 4 (najviac 3 / jeden), § 184 ods. 1 (nikto alebo priveľa = neplatný) a ods. 2 (viac lístkov rovnakého druhu v obálke = neplatné všetky), § 189 ods. 1–3 (rovnosť v strane → poradie na listine, inak zaznamenaný žreb), § 189 ods. 4 (rovnosť pri starostovi → nové voľby), § 192 ods. 1 (náhradníci);
  - pred 24. 10. skúšobné hlasovanie (neukladá sa), od 24. 10. ostré hlasovanie uložené pod `mandat:republic:v1:election` (mimo uloženia štvrte, prísne overené `parseStoredElection`, poškodené sa zahodí), sčítanie po 4 obálkach, výsledky s dôvodmi neplatnosti a paragrafmi. Kandidáti aj strany sú vymyslení.
- **Tmavý režim**: hra má vlastnú svetlú paletu (`republic-game.css` sa neprevádzal a sústredený režim drží svetlý podklad). Automatický prevod `republic-festival.css` robil v hre tmavé karty s tmavým textom (napr. „Deň 1: Pozvánka pre susedov“ bol nečitateľný). Do `SKIP_FILES` v `scripts/build-dark.mjs` pribudli `republic-festival.css` a `republic-guide.css`; ich ďalšie zmeny už tmavý režim nezastarajú.
- Testy: nový `scripts/verify-guide.mjs` (plán, odmeny, chýbajúce veci, blokovanie, medzery slávnosti, spokojnosť, voľby vrátane obálky a uloženia). Všetkých 8 verify skriptov, tsc, ESLint, `build-dark --check` a build PASS.
- Overené lokálne na produkčnom builde (wrangler, 127.0.0.1) na mobile 375 px a desktope 1280 px: panel a „Teraz môžeš“, vyzdvihnutie odmeny (mince 12 → 14) s oznámením, ostrov bez ciest (upozornenie v paneli aj nad mapou, priania „cesta“), slávnosť pod 3/3 (medzery, zamknutý ďalší deň), skúšobné voľby (neplatné lístky, žreb, náhradníci), tmavý režim, konzola bez chýb, šírka stránky 375 px.
- Nasadené cez Cloudflare Workers Builds po pushi `ce88964` (verejný chunk `republic-game-Cm792ZA_.js`). Overené naživo na mobile 375 px: panel s meradlami a odpočtom volieb, „Teraz môžeš: Zapoj školu“, vyzdvihnutie odmeny (12 → 14 mincí, 8 → 9 materiálov) s oznámením „Hotovo: Zapoj školu … Ďalej: Zapoj tri domy“, „Dnes v štvrti · 1 hotová“, priania zelene nad tromi domami, skúšobné voľby (výsledok sa neuložil), konzola bez chýb, šírka stránky 375 px.
- NEOVERENÉ: zvuky na fyzickom telefóne (iOS Safari môže Web Audio pustiť až po prvom dotyku), ostré hlasovanie v deň volieb (logika je testovaná, UI v deň volieb ešte nikto nevidel).

**Pre Codex — synchronizácia:** pred pokračovaním `git stash` → `git pull --ff-only` → `git stash pop`. Zlúčenie s tvojimi necommitnutými zmenami (zoznam miest slávnosti, `republic-game.css`, `republic-living.tsx`) som nasimuloval v samostatnej kópii: bez konfliktu, tsc, `build-dark --check` aj verify PASS. V `republic-festival.tsx` sú moje zmeny len import `FestivalGaps` a jeden riadok pod `festival-tip`. Po každej zmene CSS mimo herných súborov stále `node scripts/build-dark.mjs`. Pri lokálnom testovaní som raz spustil vite dev z inej pracovnej kópie so zdieľaným `node_modules` (junction); ak `npm run dev` pri ďalšom štarte znova optimalizuje závislosti (`node_modules/.vite-dev`), je to len pomalší prvý štart.

**Pre Codex — čo ostáva (grafika a dizajn):**
1. Ilustrované priania nad domami namiesto jednoduchých bublín `WishGlyph` (cesta, zeleň, lekár, škola, obchod) v štýle `RepublicArt`.
2. Ilustrácie volieb: volebná miestnosť, plenta, urna, lístok s krúžkami; volebná noc ako scéna (teraz pruhy v `Count`).
3. Rozpočet štvrte s kompromismi medzi prianiami susedov a pamäť postáv (Eva/Milan/Nina si pamätajú rozhodnutia) — mení ekonomiku, potrebuje návrh v `GAME.md` a voliteľné, prísne validované polia v `readSave`.
4. Vizuálne doladiť panel plánu na desktope a lepkavé akcie na mobile (fungujú, ale sú kreslené jednoducho), prípadne animovať prílet odmeny k počítadlu mincí.
5. Rozšírenie 3 (návšteva suseda) ostáva neimplementované.

## 1. 10. 2026 — Codex: priania, voľby, návšteva suseda a dokončenie vody

- Synchronizácia podľa odovzdávky: pomenovaný stash vlastných zmien → `git pull --ff-only` (26f4c25 → 289da46, vrátane ce88964) → `git stash pop`; bez konfliktov. Claudove jadrá plánu, spokojnosti a volieb ostali nezmenené.
- **Priania domov** (`components/republic-map.tsx`): malé medailóny používajú existujúce `TownPiece` ilustrácie parku/školy a štýl ambulancie/trhu; cesta je malá dlažba. Žiadne nové nekonečné poskakovanie. Prianie z `homeWishes` je aj v prístupnom popise políčka a v nadpise mapy pri zameraní domu.
- **Voľby** (`components/republic-election.tsx`, `app/republic-guide.css`): vlastná ilustrovaná miestnosť s plentou, urnou, obálkami a zakrúžkovaným lístkom (`public/images/games/republic/election-room-v1.webp`, 960×640, 143 kB, imagegen). Lenivé načítanie. `Count` má scénu s aktuálnym počtom obálok a číselné zoznamy kandidátov; zvolení sa označia až na konci. Bez zmeny hlasovacích lístkov, dávok, výpočtu, žrebu, výsledkov alebo zákonných pravidiel.
- **Sprievodca** (`components/republic-plan.tsx`, guide CSS): spoločný papierový prehľad cieľa a tmavozelený ďalší krok, jasné meradlá a odmena, mobilné prilepené akcie s bezpečným spodným odstupom. Nepoužívané CSS starých volebných pruhov a 3px farebný statusový okraj odstránené. Voliteľná letiaca odmena nepridaná; spätnú väzbu dáva existujúci WinBanner.
- **Rozšírenie 3**: najprv čisté `lib/republic-visit.ts` + `scripts/verify-visit.mjs`, potom `components/republic-visit.tsx`, zapojenie v `republic-game.tsx`, `app/republic-visit.css` (v SKIP_FILES). Wire v1, 36 políčok, variant domu podľa pôvodného hash, UTF-8 názov ≤40 jednotiek, podoba haly, počet krokov a checksum. Celý kanonický workers.dev odkaz <300 znakov aj pri 40 trojbajtových znakoch. Prísne base64url/veľkosť/verzia/UTF-8/checksum a následne existujúci `readSave`. Checksum iba odhalí poškodenie; nesľubuje autenticitu. Odkaz je snímka, bez zásob, inventára, súkromných výsledkov či histórie slávností.
- Návšteva je samostatný pohľad iba na čítanie. Pôvodná hra s úložiskom sa vôbec nemontuje; žiadne herné príkazy ani lokálne zápisy z návštevy. Jasné označenie, poškodený odkaz, návrat do svojej štvrte a „Postaviť si vlastnú“ bez resetu hráčovho postupu. „Pozvať suseda“ použije native share alebo kopírovanie/ručný výber odkazu.
- **Voda a Miesta** (zachovaný rozpracovaný diel): `republic-living.tsx` + game CSS — plynúca vodná textúra a svetlé prúdy, alpha maska odvodená zo skutočnej vody v teréne, pôda ani skaly sa neposúvajú. Pauza cez existujúce visible/active/reduced-motion. Žiadny nový veľký obrázok. `republic-festival.tsx` + festival CSS — záložka Miesta vždy ukáže pripravený program a zázemie (alebo budovy), dostupné pozície na výber a presné pokyny vo fáze príprav; ani hotová slávnosť nezostáva prázdna.
- **IBA návrh** rozpočtu a pamäte postáv v GAME.md. Nie je implementovaný; presné ceny/odmeny a voliteľné validované polia čakajú na Petrovo OK. Save formát ani ekonomika sa týmto priechodom nemenia.

### Overenie aktuálneho výsledku

- Všetkých **9** `scripts/verify-*.mjs` PASS: app-launch, celebration, data (38 meraní), festival (2250 plánov), guide (plán/spokojnosť/volebná validácia a remízy), journey (3866 plánov), living (cesty/DST/NOAA), republic (73 ciest + adaptér), visit (všetky objekty/vetvy/varianty, Unicode, dĺžka, poškodené a podvrhnuté snímky, zamknutý kultúrny dom). `tsc --noEmit`, ESLint, `build-dark --check`, build PASS. Zostáva zdedené upozornenie buildu na veľký bundle.
- Lokálny produkčný náhľad na 127.0.0.1:5176: 375×844 a 1280×900. Bez vodorovného pretekania stránky (šírka obsahu 360/1265). Skúšobné lístky: prázdne neplatné, Eva + Jakub/Mária/Zuzana platné; sčítanie 19 obálok, konečný výsledok a náhradníci. Návšteva vytvorená skutočným tlačidlom, úspešné otvorenie, návrat zachováva 9 mincí/6 materiálov a pôvodné rozloženie; chybný odkaz má správnu chybu. Miesta po dokončení slávnosti: C3 program, D4 tichý kútik, C4 uvítací stolík; návrat na mapu. Reálne vygenerovaná pohľadnica PNG1080×1350 po Claudovom zlúčení. Konzola bez chýb/varovaní.
- Snímky finálneho UI: `.impeccable/review/republic-neighbours/{desktop,mobile,desktop-night,mobile-night,desktop-visit,mobile-visit}.png`; pracovný kontrakt v packet.md. Detektor spustený raz; dva nálezy v starom guide CSS odstránené. Finálny vizuálny verdikt a nasadenie budú zaznamenané nižšie.
- **NEOVERENÉ:** fyzický telefón (prst cez mapu, natívne zdieľanie/sťahovanie), reálne ostré hlasovanie 24.10. v prehliadači; logika dátumu je testovaná. Odkazy návštev nie sú živá synchronizácia ani potvrdený súťažný výsledok.

**Ďalší krok:** Peter na fyzickom mobile overí potiahnutie prstom cez mapu a návštevu zo zdieľaného odkazu; následne posúdi návrh rozpočtu v GAME.md. Implementovať ho až po jeho OK.

### Dokončenie vizuálnej kontroly

- Čerstvý Impeccable finish reviewer: celá nová časť zodpovedá zdedenému svetu; jedna materiálna korekcia označenia skúšobného výsledku. Po oprave a nových snímkach verdikt **ship** pre skórovanú opravu, bez regresií (`review.md`, `verdict.md`). Označenie skúšky je obyčajný text pod výsledkovým nadpisom, nie ďalší štítok nad ním.
- Po poslednej korekcii znovu všetkých 9 verify skriptov, tsc, ESLint a build PASS. Dokumentácia výslednej obyčajnej nadstavby sa dopĺňa samostatnou kontrolou do lokálneho DESIGN.md; globálna identita Mandátu sa nemení.

### Nasadenie a verejné overenie

- Implementácia commitnutá menovite v `3ece01a`, pred pushom `git pull --rebase` (bez nových zmien), push do main úspešný. Nasadené cez `npm run deploy:preview`, Worker `mandat-preview`, verzia `e908803d-09b8-489e-a0de-9c90c111c645`.
- Verejná ilustrácia miestnosti aj nový herný chunk odpovedajú HTTP 200. Na workers.dev overený skutočný návštevný odkaz: „Štvrť od suseda · iba na prezeranie“, správna mapa a návrat do pôvodne rozpracovaného príbehu Pozvánka pre susedov (8/8 prípravných bodov). Konzola bez chýb a varovaní. Fyzický mobil zostáva na Petrovo overenie.
- Dokumenter dokončil lokálny DESIGN.md a evidenciu documentation.md; globálne PRODUCT.md, DESIGN.md a design.json ostali zachované. Návrh ekonomiky sa stále neimplementuje bez Petrovho OK.

## 2. 10. 2026 — prehľadnosť obrazovky a mapy (Claude, commit `ca4865a`)

Podnet od Petra: informácie sú „nahádzané“, človek ich musí hľadať; nevie, ktorá budova je aká a čo robí; po kliknutí na budovu sa na mape nič neukáže; budovy sa ťažko rozlišujú.

- **Poradie obrazovky** (`components/republic-game.tsx`):
  - pás stavu (`StatusBar`): mince, materiál, spokojnosť, projekt, slávnosti a voľby; cieľ v podnadpise; tlačidlo „Ako hra funguje“;
  - jedna hlavná akcia (`PlanPanel`): názov, štítok, veta „prečo“ z pohľadu susedov (pri krokoch projektu slová postavy), čo presne treba urobiť a odmena;
  - hneď pod tým mapa. Na mobile začína na 606 px, predtým na 982 px.
- **Presunuté prvky:**
  - slávnosť a „Pozvať suseda“ sú v bočnom paneli pod projektom;
  - „Čo spolu funguje“ je vo vysvetlivke a v detaile budov;
  - prepínač grafiky (ukážka ilustrácií) je v nastaveniach;
  - „Ukázať prvé kroky s Evou“ je vo vysvetlivke.
- **Štítky budov** (`MapBadges` v `components/republic-info.tsx`):
  - každá budova má ikonu, krátky názov a bodku napojenia; farba podľa druhu (bývanie, vzdelanie, zdravie, zeleň, obchod, kultúra, srdce štvrte, stanica; farby v `categories` v `lib/republic-info.ts`);
  - tlačidlo so štítkom v nástrojoch mapy ich skryje (kľúč `mandat:republic:v1:labels`). Potom ostane krúžok s ikonou a pôvodná bodka napojenia;
  - na pohľadnici sa nekreslia.
- **Detail po ťuknutí** (`InfoCard`, dáta v `lib/republic-info.ts`) sa zobrazí pod mapou:
  - pri budove: čo to je a čo robí; komu pomáha (domy so súradnicami); čo jej chýba (✓/✗); súvis s krokom projektu a s dnešnými objednávkami; rady;
  - rýchle akcie pri budove: Postaviť park/ambulanciu/tržnicu, Položiť cestu, Presunúť, Odložiť;
  - pri voľnom políčku: či je pri ceste, koľko napojených domov je do 2 políčok, „Postaviť sem“ (katalóg s predvoleným políčkom) a „Cesta sem“;
  - pri ceste: či je spojená s námestím a „Odstrániť cestu“;
  - na mape sa podfarbí dosah 2 políčok. Štítky toho, komu budova pomáha, majú zelený okraj, nefunkčné budovy oranžový.
- **Kde to pomôže** (`siteAdvice`): pri stavaní aj mimo úvodu s Evou dostanú fajku políčka, kde stavba hneď niečo splní. Pod mapou a pri potvrdení je dôvod, napr. „pri škole splní krok projektu Školský dvor“ alebo „dosiahne na najviac domov bez lekára“.
- **Katalóg** má pri každej stavbe vetu o účinku. Ceny sú v správnom tvare (3 mince, 5 mincí).
- **Oprava:** pravidlo `.republic-map-window svg` zasahovalo aj do vnorených SVG, preto boli medailóny prianí menšie a mimo stredu. Teraz je to `.republic-map-window>svg`.
- **Návšteva suseda:** rovnaký detail, iba na čítanie (bez rád a úloh pre majiteľa).
- **Testy:** `verify-guide` pokrýva aj detail budov, políčok a ciest, „kde to pomôže“ a vety „prečo“. Všetkých 9 verify skriptov, tsc, ESLint, `build-dark --check` aj build PASS.
- **Overené lokálne** na produkčnom builde (mobil 375 px, desktop 1280 px):
  - úvod s Evou (zjednodušený pás);
  - návšteva suseda (detail bez akcií);
  - „Postaviť sem“ → „Čo postavíme na C4?“;
  - fajky pri parku a ambulancii.
- **Overené naživo:** chunk `republic-game-B7_PEX6m.js`, pás stavu, „Teraz“ s vetou prečo, mapa od 606 px, 7 štítkov, detail domu po ťuknutí, konzola bez chýb, šírka stránky 375 px.

**Pre Codex — grafika (odporúčané poradie):**
1. **Rozlíšiteľnosť budov priamo v kresbe** — dnes najväčší problém. Domy, škola, knižnica, ambulancia a dielňa sú si tvarom aj farbou podobné.
   - Farba strechy alebo fasády podľa druhu, ideálne v odtieňoch z `categories`.
   - Jeden typický prvok: kríž na ambulancii, hodiny alebo zvonček na škole, knihy vo výklade knižnice, markíza tržnice, komín a drevo pri dielni.
2. **Štítky na mape** (`MapBadges`):
   - ilustrované odznaky namiesto ikon lucide;
   - typografia a jemný tieň;
   - zvýraznenie vybranej budovy (dnes žltý okraj podstavy) napríklad svetlom.
3. **Karta detailu a vysvetlivka** (`InfoCard`, `HowItWorks`): vizuálne doladenie, prípadne malá kresba budovy (`RepublicArt`) v hlavičke karty.
4. **Pás stavu a karta „Teraz“:** fungujú, ale sú nakreslené jednoducho.

## 1. 10. 2026 — Codex: čistá mapa a interaktívny detail budov

- Petrov pokyn: trvalé názvy budov sa mu nepáčia, informácie chce až po kliknutí. Synchronizácia čistého stromu `git pull --ff-only`: 80b8b12 → e140e72. Claudove `lib/republic-info.ts`, plán, účinky, spokojnosť, voľby a testované pravidlá ostali zachované.
- Z mapy odstránené všetky trvalé štítky aj krúžky s ikonami a prepínač popisov. Staré nastavenie labels sa ignoruje; uloženie mesta sa nemení. Ostávajú priania domov a malá hnedá značka pri nenapojenej budove. Výber, dosah a budovy, ktorým pomáha, sa zvýraznia až pri otvorení detailu.
- Detail používa skutočnú RepublicArt ilustráciu, názov, účinky, napojenie, komu pomáha a čo chýba. Úlohy a rady sú rozbaliteľné; rýchle akcie z Claudovho Report zostali funkčné. Na desktope od 960 px kompaktný panel pri opačnom okraji mapy, na mobile pod mapou. Bez modálneho prekrytia a bez novej animácie.
- Rovnaký klik detail zavrie; funguje X aj Escape. Zatvorenie z detailu vráti klávesnicový fokus na budovu. Klikateľná oblasť vysokých budov zahŕňa aj kresbu nad podstavcom a radí sa podľa hĺbky; režim stavania zostal len nad políčkami. Návšteva suseda má rovnaký detail bez herných akcií.
- PASS všetkých 9 verify skriptov, tsc --noEmit, celý ESLint, build-dark --check a produkčný build. Zdedené upozornenie na veľké chunky zostáva. Jeden manuálny detektor nad upravenými mapovými súbormi našiel iba existujúci 3px ľavý okraj Claudovej citácie v karte plánu, mimo tejto úpravy; neopravuje sa mimo zadania.
- Finálne browser QA: 375×844 a 1280×900, šírka stránky 360/1265 bez pretekania, žiadny SVG text v pokojnej mape. Škola: účinky, 3 napojené domy a chýbajúce bonusy. Dom: 2/5 prianí a rýchle stavanie parku; režim sa otvorí a dá zrušiť, uloženie ostáva 9 mincí/6 materiálov. Opakovaný klik, Enter, Escape z detailu a návrat fokusu na B2; skutočný klik na kresbu školy; rozbalenie projektových úloh. Detail školy pri návšteve iba na čítanie. Konzola bez chýb/varovaní.
- Snímky finálneho výsledku: `.impeccable/review/republic-inspector/desktop.png`, `mobile.png`. Fyzický telefón naďalej neoverený. Návrh rozpočtu/pamäte postáv sa neimplementuje.

**Nasadené:** commit `96c9270`, pred pushom pull --rebase bez ďalších zmien. Priame nasadenie overeného buildu do `mandat-preview`, Cloudflare verzia `0c65cada-f4c9-4d68-86e2-aeb5e2e682c3`. Verejný web po obnovení: SVG mapy nemá trvalé textové štítky, klik B2 otvorí Detail: Škola so skutočnými účinkami a tromi napojenými domami. Návšteva ostáva iba na čítanie; konzola bez chýb/varovaní. Zachované Claudove údaje a funkcie; zmenené iba zobrazenie a interakcia. Fyzický mobil ostáva na Petrovo vyskúšanie.

## 1. 10. 2026 — Codex: oprava detailov na mobilnej stavebnej mape

- Peter hlási, že po vstupe rovno na stavebnú mapu ťuknutie nič viditeľné neurobí. Reprodukované na verejnej verzii pri 375 px: detail školy vznikol pod mapou, ale jeho hlavička bola pri spodnom okraji a telo mimo výhľadu za prilepenými akciami. Režim umiestňovania navyše potláčal Report a klik na budovu bral ako cieľové políčko.
- `components/republic-info.tsx`: na mobile sa hlavička otvoreného detailu posunie do stredu výhľadu, aby boli hneď viditeľné aj účinky a napojenie. Reduced-motion používa okamžitý posun; desktopový panel neposúva stránku.
- `components/republic-game.tsx`, `components/republic-map.tsx`: existujúce budovy otvárajú detail aj pri stavaní, presune alebo režime Cesty; klikateľná ostáva aj kresba nad podstavcom. Nevykoná sa žiadny herný príkaz a výber stavby zostáva zachovaný. Ďalšie voľné políčko zavrie detail a pokračuje v umiestňovaní; opakovaný klik detail zavrie. Výber je správne označený aj pre čítačku. Opravená zastaraná veta o odstránených štítkoch v nastaveniach.
- `components/republic-festival.tsx`: samostatná mapa slávnosti predtým vôbec nemala zapojený InfoCard. Teraz ukáže detail existujúcich budov iba na čítanie. Platné programové miesto má prednosť pred prezeraním (aj námestie alebo park), takže miesto a zázemie sa stále vyberajú pôvodným spôsobom. Export pohľadnice detail vynechá. Pravidlá, ekonomika a formát uloženia bez zmeny; politická časť bez zásahu.
- PASS všetky `scripts/verify-*.mjs`, TypeScript, celý ESLint, build-dark --check, diff --check a produkčný build. Bez zmeny CSS; zdedené upozornenie buildu na veľké chunky zostáva.
- Browser QA 375×844: škola má hneď viditeľný názov, účinky, tri napojené domy aj chýbajúce bonusy. Pri vybratej knižnici funguje detail školy, C4 potom opäť ukáže cenu a potvrdenie stavby. Opakovaný klik zavrie detail; bez potvrdenia sa zdroje nemenia (9 mincí/6 materiálov). Na lokálnom testovacom postupe overená aj slávnosť: detail po dokončení, ďalší deň, výber pikniku → škola bez spotreby prípravných bodov → C3 → potvrdenie programu → výber zázemia. Desktop 1280×900 zachováva panel pri mape. Šírky stránky 360/1265 bez pretekania, konzola bez chýb/varovaní.
- Snímky: `.impeccable/review/republic-mobile-taps/mobile.png`, `desktop.png`. Fyzický telefón nebol dostupný; ďalší krok: Peter overí ťuknutie na budovu na svojom mobile po načítaní aktualizácie. Uloženie na jeho zariadení sa nemaže ani nemigruje.

**Nasadené:** implementácia `5ab734d`, pull --rebase bez ďalších zmien, push main a priame `npm run deploy:preview` úspešné. Worker `mandat-preview`, verzia `71e0d896-7cbe-474e-b955-a1f70310b336`. Verejný web 375×844: klik priamo do strechy školy aj výber B2 otvorí Detail: Škola; horný okraj detailu 375 px, účinky od 466 px, teda hneď viditeľné nad prilepenými akciami. Šírka stránky 360 px, konzola bez chýb/varovaní. Snímka `public-mobile.png` v rovnakom priečinku. Toto je kontrola mobilného rozloženia v prehliadači, nie fyzického telefónu.

## 2. 10. 2026 — Codex: voliteľný herný plán na celú obrazovku

- Petrov pokyn: tlačidlo pri zoome pod mapou, mobilný herný plán na celej ploche, úlohy vľavo a legenda. Synchronizácia čistého stromu `df0e738 → c38fea9`; Claudov kvíz ostal zachovaný.
- `components/republic-playfield.tsx`, `app/republic-playfield.css`: tá istá pripojená mapa sa rozšíri na celú dostupnú plochu prehliadača (100dvh), bez systémového Fullscreen API. Hore názov/zdroje/zatvorenie, vľavo zbaliteľné Úlohy/Legenda, dole pôvodné stavanie/cesty/zásielka/zbierka. Úlohy používa pôvodný playerPlan; ich akcie používajú pôvodné planAction. Slávnosť sa otvára po opustení tohto režimu.
- Mapa vyplní výšku scény, ostáva posúvateľná, má samostatný zoom pre tento režim. Bežné zobrazenie a jeho zoom zostávajú zachované. Detail budovy, katalóg a potvrdenie stavby sa zobrazia nad mapou; žiadne automatické rolovanie stránky pri detaile. Žiadne trvalé názvy/ikony budov sa nevracajú.
- Podklad stránky je počas otvorenia inertný, rolovanie zamknuté, klávesnicový fokus v hernom pláne. Escape v zásielke zatvorí iba zásielku; ďalší Escape opustí plán. Návrat na pôvodnú pozíciu stránky a nový uzol vyvolávajúceho tlačidla. Žiadne nové animácie, ekonomika, uložené polia ani herné pravidlá. Herné CSS pridané do SKIP_FILES build-dark.
- Browser QA: 375×844, 844×390, 1280×900. Bez vodorovného pretekania stránky. Šírky ľavého panelu 146/190/230 px, po zbalení 48 px. Úlohy/legenda, zoom 864→1296→864, detail školy, úloha→knižnica→C4→náhľad ceny 6/3→zrušenie bez výdavku. Zásielka nad plánom, Tab v dialógu, Escape nechá plán otvorený a fokus na zásielke. Zatvorenie plánu vráti fokus na jeho tlačidlo a obnoví rolovanie. Konzola bez chýb/varovaní. Uloženie na Petrovom zariadení sa nemaže.
- Všetkých 10 `scripts/verify-*.mjs`, TypeScript, ESLint, build-dark --check, diff --check a produkčný build PASS. Zdedené upozornenie na veľké chunky ostáva. Detektor raz bez nálezov. Nezávislá vizuálna kontrola v `.impeccable/review/republic-playfield/review.md`, skórovanie opráv vo verdict.md a zachovanie dizajnového systému v documentation.md; snímky v rovnakom priečinku.
- **NEOVERENÉ:** fyzický telefón, dotykové posúvanie a Safari/PWA. Režim zaberá plochu stránky; systémové lišty prehliadača ovláda prehliadač. Ďalší krok: Peter otvorí mobilný herný plán cez ikonu rozšírenia pri zoome a overí ovládanie prstom. Samostatná mapa slávnosti a návšteva sa nemenia.

**Dokončenie a nasadenie:** nezávislý reviewer skóroval oba materiálne nálezy ako resolved, verdikt **ship** pre tieto opravy; dokumenter zachoval nadradený aj lokálny systém. Implementácia `412a504`, pull --rebase bez ďalších zmien, push main. Priame `npm run deploy:preview` úspešné: Worker `mandat-preview`, verzia `bb4860d5-9401-4b45-8663-bdac7ed30e35`. Na workers.dev po návrate z rozpracovanej slávnosti overené tlačidlo pod mapou a skutočný mobilný herný plán 375×844, šírka stránky 375, bez chýb/varovaní v konzole. Snímka `public-mobile.png` v rovnakom kontrolnom priečinku. Fyzický telefón stále na Petrovo overenie.

### 2. 10. — oprava viditeľnosti vstupu do herného plánu

- Peter na stavebnej mape nenašiel tlačidlo pod mapou. Na verejnom webe je pôvodná ikona v nástrojoch prítomná; fyzický telefón ani jeho obrazovka nie sú k dispozícii, preto cache alebo konkrétny mobilný problém nepotvrdzujeme.
- Ikona nahradená viditeľným zeleným textovým tlačidlom **Hra na celú obrazovku**, priamo pod riadkom zoomu, výška 48 px. Rovnaký handler a návrat fokusu; žiadne nové pravidlá ani uložené polia. Zmenené iba republic-map.tsx a tri pravidlá republic-playfield.css.
- Synchronizácia `2aca72d → 041c6ef` zachovala Claudovu slovnú hru aj denné údaje. Všetkých 11 verify skriptov, tsc, ESLint, build-dark --check, diff --check a build PASS. Mobil 375 px: tlačidlo čitateľné, otvorí plán bez vodorovného pretekania a po zatvorení dostane fokus. Snímky a nová nezávislá kontrola v `.impeccable/review/republic-playfield-entry/`.

**Nasadené:** nový reviewer **ship** pre úzku opravu viditeľnosti, dokumenter zachoval systémové súbory, detektor bez nálezov. Commit `31adde2`, pull --rebase bez ďalších zmien, push main; Worker verzia `fd448707-23e6-48a9-ad2d-f13db83c63ac`. Na verejnom webe po obnovení overené viditeľné textové tlačidlo, otvorenie aj zatvorenie plánu pri 375 px a konzola bez chýb/varovaní; `public-mobile.png` v kontrolnom priečinku. Fyzický mobil nebol dostupný.

### 2. 10. 2026 — Codex: herný plán aj na mape slávnosti

- Petrova fotografia z fyzického iPhonu ukázala chýbajúci vstup na samostatnej mape Susedský piknik. Predchádzajúca oprava sa týkala iba stavebnej mapy; nejde o potvrdený problém cache.
- RepublicFestival teraz používa RepublicPlayfield: viditeľné tlačidlo **Hra na celú obrazovku** pod zoomom aj počas slávnosti. Vľavo skutočný cieľ, spokojnosť, program, zázemie, potvrdenie miesta a riešenie udalosti; hore prípravné body. Zachované pôvodné rozhodnutia, pravidlá, ceny aj uloženie. Bežná stránka a pohľadnica ostávajú dostupné po zatvorení.
- Rovnaká mapa sa rozšíri, panel sa dá zbaliť, Úlohy/Legenda a Miesta/Mapa fungujú aj v tomto režime. Potvrdenia posúvajú iba ľavý panel, nie zamknuté pozadie. Zatvorenie vráti fokus na vstup alebo prepínač Mapa, ak bola mapa nahradená zoznamom.
- Lokálne UI overenie: 375×844, 844×390, 1280×900. Zázemie Uvítací stolík C4 (5→4 body), Tichý kútik D4 (4→3), reakcia na dážď, otvorenie slávnosti 3/3, prechod na deň 3 bez opustenia herného plánu, výber čítania a potvrdenie programu C3. Miesta/Mapa, legenda, panel 48 px po zbalení, návrat fokusu a obnovenie rolovania. Bez pretekania stránky a chýb/varovaní konzoly.
- Všetkých 12 verify skriptov, TypeScript, ESLint, build-dark --check, diff --check a produkčný build PASS. Detektor bez nálezov. Kontrolné snímky a nezávislá kontrola v .impeccable/review/republic-festival-playfield/. Fyzické dotykové ovládanie, Safari a PWA sa nezávisle neoverovali.

**Nasadené:** čerstvá nezávislá kontrola po dodaní Petrovej fotografie: **ship**, dokumenter zachoval pôvodný systém. Implementácia d63d190, pull --rebase bez ďalších zmien, push main a priame deploy:preview úspešné. Worker mandat-preview, verzia 4eb7e6ef-34c4-4e55-9ae6-e0745acf42d3. Verejná mapa slávnosti po obnovení má tlačidlo Hra na celú obrazovku; 375×844 otvorí festivalový cieľ/rozhodnutia vľavo a mapu vpravo, bez pretekania, close obnoví rolovanie a fokus. Konzola bez chýb/varovaní; snímka public-mobile.png v kontrolnom priečinku. Fyzický dotyk ostáva na Petrovo overenie.

### 2. 10. 2026 — Codex: mobilný herný plán na šírku, úlohy vpravo

- Petrova ďalšia fotografia odmietla portrétový výrez a ľavý panel. Nové zadanie: na mobile celá mapa na šírku, úlohy vpravo mimo výrezu iPhonu, podpora Safari a Chrome. Stavebná mapa aj slávnosť používajú rovnakú úpravu; bežná stránka a desktopový ľavý panel ostávajú zachované.
- Nové čisté jadro `lib/republic-display.ts` vypočíta najväčší celý obraz 640×480, ktorý sa zmestí do dostupnej plochy. `verify-display.mjs` overuje rozmery, maximálne využitie plochy a neplatné vstupy. V rozšírenom režime zoom 1 ukáže všetkých 36 políčok; priblíženie ostáva možné a tlačidlo „Zobraziť celú mapu“ obnoví celý pohľad.
- Mobil na šírku má samostatne rolovateľné Úlohy/Legendu vpravo, zbaliteľné na 48 px. Horné ovládanie a zoom sú nad scenériou, čím šetria výšku. Potvrdenie miesta slávnosti je v pravom paneli, detail stavby ostáva nad mapou. Safe-area odsadenie používa existujúce viewportFit: cover.
- Na výšku sa v tomto voliteľnom režime zobrazí „Otoč telefón na šírku“ s návratom k bežnej mape; skryté herné ovládanie nie je fokusovateľné. Pri podporovanom mobilnom prehliadači klik skúsi natívny fullscreen a zámok orientácie, pri odmietnutí/absencii API ostáva režim cez 100dvh a ručné otočenie. Zatvorenie uvoľní iba vlastný fullscreen/zámok, obnoví rolovanie aj fokus. Bez nových animácií a zmien ekonomiky, pravidiel alebo uloženia.
- PASS všetkých 13 verify skriptov, TypeScript, ESLint, build-dark --check, diff --check a produkčný build. Po finálnej úprave rozmerov opäť PASS verify-display, tsc, lint a build. Detektor bez nálezov. Nezávislý nový reviewer: **ship**, bez materiálnych opráv; podklady v `.impeccable/review/republic-landscape/`.
- Browser QA: 375×844 pokyn na otočenie, 844×390 celý SVG 518×388,5 a pravý panel 190 px, 1280×900 pôvodný desktopový panel. Potvrdenie C4 viditeľné vpravo, zoom a návrat na celý obraz, zbalenie panelu, detail školy na stavebnej mape, zatvorenie s návratom fokusu a rolovania. Bez výdavku zdrojov (9 mincí/6 materiálov) a bez chýb/varovaní v konzole. Snímky mobile.png, portrait.png, desktop.png a confirmation.png v kontrolnom priečinku.
- **NEOVERENÉ:** fyzický Safari/Chrome na iPhone alebo Androide, skutočné safe-area hodnoty, natívny fullscreen/zámok orientácie a posúvanie prstom. Safari na iPhone bežný elementový fullscreen nepodporuje (WebKit bug 206854); režim cez ikonu na ploche používa existujúci standalone manifest. Web nesľubuje odstránenie systémových líšt na nepodporovanom zariadení. Peter má overiť otvorenie, otočenie a posúvanie na svojom mobile.

**Nasadené:** implementácia `b32b7a5`, pull --rebase bez ďalších zmien a push main. `npm run deploy:preview` úspešné: Worker `mandat-preview`, verzia `0f858604-d21a-4cc3-a7d5-eb0a22423f3c`. Verejný web po obnovení: mapa slávnosti pri 844×390 má celý SVG 518×388,5, pravý panel 190 px od x=654, stránka široká 844 bez pretekania. Zatvorenie obnovilo rolovanie a fokus na „Hra na celú obrazovku“; konzola bez chýb/varovaní. Snímka `public-mobile.png` v kontrolnom priečinku. Ide o kontrolu responzívneho rozloženia na verejnej verzii, nie overenie fyzického iPhonu alebo natívneho fullscreen API.

### 2. 10. 2026 — Codex: mobilná scenéria po okraje, bez spodného pruhu

- Peter odmietol zelené medzery a rezervovaný spodný pás. Zmenený iba rozšírený mobilný režim na šírku: scenéria siaha po ľavý aj spodný okraj, úlohy ostávajú vpravo. Stavebná mapa a slávnosť používajú tú istú kameru; bežný web a desktopové rozloženie sa nemenia.
- `mapFrame` v lib/republic-display.ts vypĺňa obidva rozmery dostupnej plochy, zachováva pomer strán budov/36 políčok a započítava ľavý bezpečný okraj. Pri 844×390 je scéna 654×390 od x=0/y=0; predtým obrázok široký 518 px s dvomi zelenými medzerami. Budovy sú približne o 20 % väčšie. Dekoratívny terén a vodná vrstva sa rozširujú spoločne; živá voda sa neodpája od svojho rastra. Nočné tónovanie pokrýva celý výhľad. Uložené súradnice, formát pohľadnice v bežnom režime, ekonomika a pravidlá bez zmeny.
- Zoom/mriežka/obnovenie sú kompaktná plávajúca skupina vľavo; stavanie/cesty/zásielka/zbierka plávajú pri pravom okraji mapy. Žiadna rezervovaná spodná lišta. Grafika môže ísť pod výrez telefónu, ovládanie ostáva odsadené; pravý panel má bezpečný spodný/pravý okraj. Detail, katalóg a náhľad umiestnenia používajú priestor medzi ovládaním. Bez nových animácií.
- PASS všetkých 13 verify skriptov; rozšírený verify-display overuje vyplnenie plochy, celé geometrické hranice políčok/striech, deterministický výsledok a krajné stredy políčok mimo ovládania pri ľavom výreze 0/44/59 px. Po finálnej korekcii safe-area opäť PASS verify-display, tsc, ESLint a build; build-dark generovaný a --check aktuálny, diff --check PASS. Jediný manuálny detektor nad zmeneným UI bez nálezov.
- Dve vlastné kontrolné kolá: 844×390 stavebná mapa/slávnosť/potvrdenie C4, 667×375 stavebná mapa a detail F1, 375×844 návrat zo zvislej orientácie, 1280×900 pôvodná desktopová kompozícia. Zoom/reset funguje; zatvorenie vracia fokus a rolovanie. Bez herných výdavkov (9 mincí/6 materiálov), bez chýb/varovaní konzoly. Finálne otvorené snímky v `.impeccable/review/republic-edge/`; skoršie neplatné snímky stavebnej mapy nahradené po znovuotvorení bez natívneho fullscreen v náhľade.
- **NEOVERENÉ:** fyzický iPhone/Android, Safari/Chrome, dotykové posúvanie a natívny fullscreen/orientácia. Náhľadový prehliadač pri natívnom fullscreen poskytoval chybnú malú kresbu vo veľkej snímke; použité validné snímky dokazujú CSS režim cez výhľad. Neoznačujeme to za overenie skutočného mobilného Fullscreen API. Nové fyzické správanie má Peter skúsiť na svojom telefóne.
