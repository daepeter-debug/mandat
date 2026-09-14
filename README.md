# Mandát — lokálna prvá edícia

Nezávislý slovenský prehľad prieskumov. Pracovný názov, 11. september 2026.

## Online náhľad a lokálne otvorenie

Testovacie nasadenie beží na **https://mandat-preview.mandat.workers.dev**. Produkčný postup a konfigurácia Cloudflare sú opísané v `DEPLOYMENT.md`.

Počas lokálnej vývojovej relácie beží stránka na **http://localhost:5173/**.

Po reštarte počítača otvorte terminál v tomto priečinku a spustite:

```powershell
node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js" run dev -- --host 127.0.0.1
```

Terminál nechajte otvorený. Zastavenie: Ctrl+C. Na inom počítači s funkčným npm postačuje `npm ci` a `npm run dev -- --host 127.0.0.1`. Potrebný je Node.js 22.13 alebo novší. Závislosti sú už nainštalované.

## Čo prvá verzia obsahuje

- Nový magazínový úvod s hornou navigáciou, dostupnými výsledkami nad 1 % a jednoduchým výberom strán. Podrobné pôvodné zobrazenie ostáva v Dátovom prehľade.
- Vlastný model: percentá cez posuvník a pole, prepočet kresiel a výber ľubovoľných partnerov. Nad 100 % sa výsledok nevykreslí. Vlastné úpravy sa obnovia pri odchode z modelu alebo zmene agentúry.
- Mesačné vydanie s dvomi polkruhmi: oficiálne mandáty z volieb 2023 a orientačný scenár jednej z piatich agentúr. Zoznam kresiel, percentá, subjekty bez mandátu a pôvodné zdroje.
- Vlastný responzívny vizuál; graf prepína samostatné série AKO, FOCUS, INFOSTAT, IPSOS a NMS, výber strán, počtu meraní a tabuľkový ekvivalent.
- Archív 35 meraní od NMS, AKO, FOCUS, INFOSTAT, IPSOS a SANEP, vyhľadávanie a filter agentúry.
- Detail merania s dátumami, vzorkou, metódou, zadávateľom a priamym zdrojom.
- Abecedný adresár 16 subjektov, každý s podporou podľa jednotlivých meraní.
- Metodiku, register zdrojov a vysvetlenie vlastných výpočtov.
- Stav rozhrania v adrese (záložka, agentúra, filtre, otvorený detail), takže odkaz, obnovenie aj tlačidlo Späť zachovajú výber.
- Lokálne hostované písmo IBM Plex Sans (OFL 1.1) bez externých požiadaviek.
- Knižnicu 6 oficiálnych programových dokumentov s vyhľadávaním a filtrami tém a ročníka; dokumenty sú prepojené aj s profilmi strán. Päť má doložený ročník 2023, jeden je živá webová verzia bez doloženého dátumu.

## Rozsah a presnosť

Je to prvý výber ručne prepísaných reálnych dát, nie úplný archív a nie automatický agregátor. Časť menších subjektov zatiaľ nie je prepísaná. Chýbajúce číslo nie je nula. Modely odlišných agentúr sa nespájajú do jedného trendu. Prepočet kresiel je označený ako orientačný scenár z publikovaných percent s predpokladom 5 % pre každý subjekt; nie je predpoveďou výsledku volieb. Databáza kandidátov a úplné biografické a programové profily zostávajú ďalšou etapou.

Každý výsledok má zdroj v `lib/polls.ts` alebo `lib/additional-polls.ts`. Podrobné pokrytie a medzery sú v `SOURCES-2026.md` a priamo v metodike webu. NMS žiada pri publikovaní výsledkov názov NMS Market Research Slovakia a aktívny odkaz na konkrétny článok. Vlastné grafy toto zachovávajú. Povolenie na neobmedzené automatické preberanie databáz alebo grafík tým nepovažujeme za potvrdené. Pri AKO a SANEP sú evidované pôvodné publikácie; širšie licenčné podmienky zostávajú na preverenie pred pravidelnou verejnou prevádzkou.

## Súbory a ďalšia práca

- `app/page.tsx`: zobrazenia a interakcie.
- `app/globals.css`: vizuálny systém a mobilné rozloženie.
- `app/magazine.css`, `components/mandat-magazine.tsx`: nový úvod, horný shell a model. Kontrola skutočného renderu a klikov zostáva otvorená pre nedostupnosť prehliadača v tejto relácii; build, typy a dáta boli overené.
- `lib/polls.ts`: základné údaje a výpočty.
- `lib/additional-polls.ts`: 25 pridaných meraní s konkrétnymi zdrojmi.
- `lib/coverage.ts`: pokrytie a známe medzery každej agentúry.
- `lib/programmes.ts`: zdrojované programy a časové zaradenie.
- `lib/parliament.ts`: oficiálne výsledky volieb 2023 (ŠÚ SR), orientačný prepočet kresiel podľa princípu § 68 a geometria polkruhu.
- `components/hemicycle.tsx`: prístupný polkruh s číselným zoznamom a voliteľnými lokálnymi logami.
- `public/fonts`: IBM Plex Sans Latin a Latin Extended z Fontsource 5.3.0 s OFL licenciou, súčasť produkčného výstupu.
- `../HANDOFF.md`: odovzdávací plán redizajnu prvej obrazovky na mesačné vydanie (rozhodnutia, hotové časti, ďalšie kroky).
- `components/programme-library.tsx`: knižnica a dokumenty v profiloch.
- `scripts/verify-data.mjs`: kontrola dátových invariantov a známych citlivých prípadov.
- `../zaklady-projektu.md`: úvodná rešerš, zdroje, právne a produktové poznámky.
- `../datovy-model.md`: návrh budúceho modelu prieskumov, strán, programov a kandidátov.
- `../DESIGN.md`: zachytený vizuálny systém (tokeny, typografia, komponenty) pre ďalšie obrazovky.

Ďalej: dokončiť chýbajúce vlny a metadáta podľa `SOURCES-2026.md`, zaviesť evidenciu opráv a licenčného stavu, rozšíriť knižnicu programov a doplniť vedenie a rovnako štruktúrované profily. Moratórium a nasadenie sú podľa zadania odložené na neskôr.

## Technické overenie

```powershell
node node_modules/typescript/bin/tsc --noEmit
node scripts/verify-data.mjs
node node_modules/eslint/bin/eslint.js app components lib
node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js" run build
```

Základ je React + TypeScript, Vinext/Vite, Recharts a prístupné komponenty Radix/shadcn. Dáta sú lokálne; žiadny externý účet, doména ani API kľúč nie sú potrebné. Voliteľný WebMCP nástroj `filter_poll_archive` používa rovnaké filtre ako rozhranie a aktivuje sa iba v podporovanom prehliadači.

Lokálny server a zostavenie používajú oddelené priečinky vyrovnávacej pamäte (`.vite-dev` a `.vite-build` v `node_modules`). Zostavenie tak neprepisuje optimalizované React moduly, ktoré používa otvorený náhľad. Po reštarte servera prípadnú starú chybovú stránku obnovte cez Reload.

V prehliadači boli skontrolované desktopové zobrazenie so šírkou 1770 px a mobilné zobrazenie 390 × 844 px, prepínanie agentúr a grafu/tabuľky, vyhľadávanie v archíve, prázdny výsledok a detail merania s chýbajúcimi metadátami. Mobilný prehľad a detail sa zmestia do šírky obrazovky. Manuálna kontrola čítačkou obrazovky zatiaľ nebola vykonaná.
