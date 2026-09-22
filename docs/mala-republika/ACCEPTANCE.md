# Kritériá dokončenia

Zaznamenať skutočné výsledky do STATUS.md. Nespúšťať opakovane úspešné kontroly bez novej zmeny alebo konkrétnej pochybnosti. Pri zlyhaní spúšťania kvôli prostrediu uviesť presný príkaz a chybu; neoznačiť build/browser ako overený iba na základe TypeScriptu.

## A — hrateľný lokálny prototyp

- Tretia karta v Herni → `?v=game&g=republic`; refresh a Back zachovajú správnu hru, návrat do Herne obnoví fokus. Ostatné dve hry sa nezmenili.
- Nový hráč pochopí prvú úlohu z mapy a dvoch viet; do prvého úspešného umiestnenia nepotrebuje účet ani návod na celej obrazovke.
- Mapa zobrazuje skutočne uložené objekty. Kúpiť, presunúť, odložiť a znovu umiestniť budovu funguje myšou, dotykom aj klávesnicou/zoznamom.
- Cesta susedí iba hranou; oddelená sieť nezapojí budovu. Hraničný dosah 2 platí, 3 nie. Kolízia, mimo mapy, neznáme ID, chýbajúce zdroje a presun pevných objektov sa odmietnu aj v jadre.
- Celá kapitola má spustiteľnú sekvenciu pre všetky 3 vetvy, minimálne jednu bez náhodných odmien, objednávok a duplikátov. Žiadny krok nevyžaduje rare/epic.
- Odmena kroku/objednávky/finále nejde vyzdvihnúť dvakrát, ani po presune stavieb, obnovení stránky alebo opakovaní príkazu.
- Zásielka zachová tri ponúknuté karty pri refreshi. Žiadne opätovné pridanie 8/4 pri otvorení alebo zrušení. Výber dá odmenu len raz a správne vyrieši duplikát.
- Čas: rovnaký deň, nasledujúci deň, vynechaných 10 dní (zásoba najviac 3), cesta späť v čase, zmena mesiaca/roka, bratislavský prechod na letný aj zimný čas. Seed replay je rovnaký.
- Stav sa obnoví po zatvorení prehliadača. Neplatný JSON, neznáma verzia a plné/zablokované localStorage nezničia starý save. Druhý tab nesmie potichu prepísať novšiu revíziu.
- 360/390 px mobil a 1280 px desktop: bez horizontálneho scrollu stránky, prekrytých tlačidiel, nečitateľných cien a nechcených presunov pri scrollovaní. Mapa sa dá centrovať. Reduced motion a 200 % zoom rozhrania fungujú.
- Reálne artwork, 44 px ovládanie, viditeľný fokus, rarity pomenované aj slovne. Potvrdené zmeny čítačka dostane cez pokojný live region. Manuálny test čítačkou je samostatný výsledok, nie automatická vlastnosť aria-label.

## B — účet a serverové uloženie

- Registrácia, potvrdenie e-mailu, prihlásenie, recovery hesla, expirácia, odhlásenie a odstránenie účtu sú otestované; používať vlastné testovacie adresy autorizované používateľom, neposielať nevyžiadané testovacie e-maily iným ľuďom.
- Dva účty A/B: cez UI aj priamy požiadavok A nečíta/neupravuje mesto, modely a výsledky B. Anon nečíta nič osobné. Priame volanie write RPC s public key / user JWT zlyhá.
- Server odmietne podvrhnutý userId, čas, inventár, odmenu a skóre. Reláciu skutočne overuje. Tajné kľúče nie sú v dist/client, source mapách ani browser odpovediach.
- Dve paralelné žiadosti na výber zásielky → presne jedna odmena. Rovnaký commandId a payload po timeout → pôvodný výsledok. Rovnaké ID s iným payload → odmietnutie. Konflikt revízií → 409, nie strata zmien.
- Dva taby a dve zariadenia: konzistentná revízia, zachovaná pending ponuka. Pri výpadku account hry read-only; retry nezvýši zostatok dvakrát. Súkromné odpovede no-store.
- Uložený model zachová názov, pôvodný baseline, chýbajúce hodnoty a výber partnerov. Po zmene agregátu sa pôvodný scenár neprepíše. Maximálny počet a vlastníctvo sa vynucujú aj na serveri/databáze.
- Denné výsledky existujúcich hier prepočíta server podľa správnej verzie; staré lokálne výsledky a tréning sa nestratia. Klientské skóre sa nepovažuje za autoritatívne.
- Lokálny hosť sa pri prihlásení nevymaže. Import nie je predstieraný; rozhranie jasne vysvetlí oddelené mestá.
- Bez configu funguje lokálna hra a verejný Mandát; účet ukáže dostupnosť pravdivo. Bez SMTP testu nepovažovať všeobecnú registráciu za hotovú.

## Primerané príkazy (v outputs/web)

```
node scripts/verify-data.mjs
node scripts/verify-republic.mjs                  # vytvorí Terra; skutočné jadro
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js <upravené .ts/.tsx/.mjs súbory>
npm run build
npm run check:preview
```

Skript `docs/mala-republika/verify-plan.mjs` je iba nezávislé overenie plánovanej geometrie a ekonomiky. Nenahrádza herné ani serverové testy. Účty potrebujú databázové/integračné testy s reálnymi rolami a súbehmi.

## Odovzdanie

STATUS.md obsahuje zmenené súbory/commit, dokončené a chýbajúce funkcie, presné výsledky kontrol a cesty screenshotov. Žiadny dlhý prepis celej konverzácie. Zdokumentovať migrácie, env názvy, nasadenie a rollback v novej kapitole DEPLOYMENT.md. Nedotknúť sa starých historických zápisov ako keby boli aktuálnou validáciou.
