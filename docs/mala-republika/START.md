# Malá republika — odovzdanie Astra → Terra → Luna

Pripravené 21. 9. 2026. **Návrh, nie implementovaná funkcia.** Pracovný názov odsúhlaseného konceptu; konkrétne čísla nižšie sú rozhodnutia návrhu pre prvý prototyp, nie výsledky používateľského testovania.

## Čo Peter chce

Mobilnú hru v existujúcej Herni Mandátu: vlastné mestečko, budovanie, krátke denné návštevy, ciele, prekvapenia, zbierateľné predmety common/uncommon/rare/epic. Jednoduché ovládanie, hĺbka z kombinácií a dôsledkov. Následne účet e-mail/heslo pre hru, výsledky existujúcich hier, vlastné volebné modely a nastavenia. Zachovať existujúci web aj obe hry. Priorita je krásny vizuál a dobrá hrateľnosť. Cieľ spotreby: približne dve päťhodinové limitové okná; nie záruka času ani dostupného výkonu.

## Čo je pripravené

| Dokument | Kto ho potrebuje |
| --- | --- |
| [GAME.md](GAME.md) | Terra: mechaniky, ekonomika, prvá kapitola a konkrétne riešenie |
| [DESIGN.md](DESIGN.md) | Terra: vizuál, mobil, interakcie a zadanie grafických podkladov |
| [TECH.md](TECH.md) | Terra: integrácia, ukladanie, účty a serverové pravidlá |
| [ACCEPTANCE.md](ACCEPTANCE.md) | Terra: presné kritériá dokončenia a overenie |
| [TERRA.md](TERRA.md) | Zadanie hlavnej implementácie; dva samostatné priechody |
| [LUNA.md](LUNA.md) | Voliteľná úzko vymedzená obsahová úloha |
| [STATUS.md](STATUS.md) | Stav a ďalší krok; dopĺňa každý ďalší model |

## Poradie a úspora spotreby

1. **Terra / medium, priechod A:** hra lokálne, jeden vizuálny smer, kompletná prvá kapitola. Účty zatiaľ iba rozhranie úložiska, žiadne predstierané prihlasovanie.
2. **Luna / low alebo medium, voliteľne:** textové varianty podľa LUNA.md. Ak sa nechcete prepínať, Terra použije základné texty v GAME.md a túto časť odloží. Luna nemení mechaniky, autentifikáciu ani grafiku.
3. **Terra / medium, priechod B:** účty, cloudové ukladanie a uložené volebné modely; až po splnení A. Potrebuje nakonfigurovaný Supabase projekt. Bez neho pripraví migrácie a lokálne overenie, ale nevyhlási účty za funkčné online.
4. **Astra / high:** krátka záverečná kontrola konkrétneho diffu, dôkazov z testov a mobilných screenshotov. Neopakovať návrh od začiatku.

Nevytvárať armádu pomocných agentov, nové varianty dizajnu ani všeobecnú rešerš. Najprv čítať tento balík, potom len relevantný kód. Pri nejasnosti zvoliť najmenšiu verziu v súlade s pravidlami a rozhodnutie zapísať. Pri skutočnej technickej prekážke ju pomenovať; neobchádzať sandbox a nežiadať heslá či tajné kľúče do chatu.

## Overený stav repozitára

- Git root je `outputs/web`, nie nadradený pracovný priečinok. Posledný lokálny commit pri príprave `7483b87`; pracovný strom bol čistý a lokálna evidencia vetiev ukazovala main zhodné s origin/main. V tejto príprave nebol robený fetch ani overenie online nasadenia.
- React 19 + TypeScript, Vinext 1.0.0-beta.5 / Vite 8, Node >=22.13, Cloudflare Worker `mandat-preview`. Neprepisovať na nový framework.
- `components/games-room.tsx`: Herňa, lazy importy hier, GameId majority/december. `app/page.tsx`: URL parser berie gameIds, parameter `g` a záložku `v=game`.
- Nová cesta: `/?v=game&g=republic`. Pridať tretiu kartu a explicitné vetvenie, inak aktuálny ternárny výraz zobrazí Do decembra pre každý nový identifikátor.
- Aktuálne hry: `lib/daily-game.ts`, `lib/december-game.ts`, komponenty rovnakých názvov. Ukladajú do localStorage; ich kľúče ani pravidlá nemeníme.
- `components/mandat-magazine.tsx`, export `ElectionLab`: percentá a výber partnerov dnes existujú len v useState. Výsledky kresiel sa počítajú z `lib/parliament.ts`.
- `db/schema.ts` je prázdny, existujúci Drizzle je nastavený na SQLite. `wrangler.preview.jsonc` nemá databázové bindingy. Nezamieňať to za pripravenú produkčnú databázu.
- `app/chatgpt-auth.ts` je helper pôvodnej šablóny založený na hlavičkách oai-authenticated-*. **Nepoužiť na verejné účty workers.dev a nedôverovať takýmto hlavičkám od návštevníka.**
- Skutočný vizuálny systém je vo finálnych CSS pravidlách `app/magazine.css` + `app/games-room.css`, nie v pôvodných modrých tokenoch na začiatku globals.css. Koreňový `../../PRODUCT.md` zachytáva staršie rozhodnutia; obsahuje už neaktuálne údaje o nasadení. Tieto rozpory neprepisovať ako vedľajšiu úlohu.
- `DEPLOYMENT.md` opisuje Workers a Git build. Push na main môže spustiť nasadenie: počas lokálneho prototypu nepushovať automaticky. Starší súhlas na nasadenie Do decembra nepovažovať za požiadavku nasadiť nedokončené účty novej hry.

## Čo v prvej verzii nebude

Multiplayer, verejné profily a rebríčky, chat, platby, obchodovanie s kartami, AI generované denné príbehy, reálne politické strany, voľby v meste, animovaná doprava so simuláciou trás, 3D engine, druhá mapa. Žiadne platené boxy, stratené streaky, znehodnocovanie mesta počas neprítomnosti ani umelé čakanie na dokončenie budovy.

Samotný prototyp overí, či sa človek chce vrátiť. Dĺžka návštevy 10–15 minút je produktový cieľ, nie odmeraná vlastnosť. Po siedmej návšteve je možné pokračovať v úpravách a zbieraní; ďalšia kapitola zatiaľ nemá predstierané tlačidlo.
