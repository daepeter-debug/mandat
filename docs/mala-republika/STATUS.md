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
