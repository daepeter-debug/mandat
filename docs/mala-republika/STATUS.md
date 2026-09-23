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
