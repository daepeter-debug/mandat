# Vizuálne objavovanie Mandátu · 10. 10. 2026

Mode: Read / Operate. Rozšírenie existujúceho redakčného sveta: krémový papier, zelený atrament, IBM Plex Sans, pôvodné farby politických dát. Schválený celý balík piatich prvkov: perspektívny ľahký náhľad sály v úvode, zdrojované udalosti pri trende, presúvateľné koaličné kartičky, interaktívne rozdelenie 100 € verejných výdavkov a značka v poďakovaní po serverom overenej platbe. Opraviť orezanie mobilného platobného panela.

Náhľad je označený ako historické kluby k 1. 10.; živé 3D sa načíta až po vstupe. Udalosti nesmú naznačovať príčinnosť. COFOG je existujúci zdroj za 2024; nemení sa ekonomický výpočet ani zdrojové dáta. Kartičky majú alternatívu obyčajným klikom a klávesnicou; ťahanie dotykom je len na samostatnom úchyte. Zachovať režimy hlasovania a bezpečnostné brány Stripe. Prednosť mobilu 375/402 px, oba motívy, reduced motion. Žiadne nové ťažké knižnice alebo dekoratívne celostránkové scény.

Code-led build, bez schváleného nového vizuálneho compu. Podklad sály je už existujúci render v public/models/chamber-clubs-2026-10-01.webp.

## Dokončený kontrakt

- **THESIS:** Kompaktné vizuálne objavovanie, ktoré zachováva fakty, zdroje a rozdiel medzi historickým náhľadom, modelom a vlastným výberom.
- **OWN-WORLD:** Existujúci krémový papier a zelený atrament, IBM Plex Sans a dátové farby. Autentické logá z `lib/party-logos.json`; existujúci rastrový render sály, nie nový vytvorený asset alebo náhradná scéna.
- **STORY:** Vstup do sály → zdrojovaný kontext pri trende → vlastný koaličný výber a rozdelenie verejných výdavkov. Poďakovanie patrí výhradne serverom potvrdenej platbe.
- **FIRST VIEWPORT:** Titulok s kompaktným náhľadom pod ním v ľavom stĺpci vedľa denných správ; mobil skladá obsah. Skorší polkruh vydania pod titulkom je nahradený náhľadom. Titulok a 150-kreslový scenár ostávajú.
- **FORM:** Bežné rozšírenie existujúcej redakčnej kompozície, bez nového vizuálneho sveta. Lokálne CSS rozširuje natívne ovládanie a viditeľný fokus; na mobile sú koaličné kartičky v jednom stĺpci a výdavky majú textové hodnoty.

## Shipped správanie a pôvod podkladov

`components/chamber-preview.tsx` a integrácia v `national-intro.tsx` používajú `public/models/chamber-clubs-2026-10-01.webp`, ktorý už bol v projekte. Caption priznáva historické kluby k 1. 10. 2026; odkaz vedie na `/parlament?sala=3d`, úvod nemontuje WebGL. Náhľad má 190 px na desktope a 160 px na mobile; podklad je orezaný pomocou `object-fit`, nie prekreslený.

`components/trend-events.tsx` používa `politicalNews` a deterministický `timelineEvents` z `lib/discovery.ts`: v zobrazenom období vyberá správu s najvyššou prioritou z každej sedemdňovej skupiny, vynechá kategóriu Prieskumy a zobrazí najviac osem. Integrácia `poll-aggregator.tsx` vedie samostatný dátum udalosti, presnú publikačnú čiaru a pripne najbližší existujúci modelový bod. Originálny článok, dátum a vysvetlenie nepreukázanej príčinnosti sú dostupné pri udalosti.

`components/coalition-cards.tsx` dostáva výber a `onChange` od rodiča. `mandat-magazine.tsx` a `parliament-ar.tsx` pripájajú ten istý výber na kreslá a súčet. Klik aj klávesnica majú rovnakú zmenu stavu; desktopový drag a dotykový pointer drag sú na samostatnom 44 px úchyte. Logá majú vlastný svetlý podklad; vybraný stav používa text, ikonu a `aria-pressed`, nie iba farbu.

`components/spending-hundred.tsx` číta existujúce `tax-receipt` a `cofog.data`. Celé políčka sú označené ako zaokrúhlené; suma vybranej oblasti a zoznam majú dve desatinné miesta. Zdroj, dátový rok 2024, dátum stiahnutia a rozsah celej verejnej správy ostávajú pri zobrazení. Osobná daň ani plán rozpočtu 2025 sa z tohto pomeru nevyvodzujú.

`components/support-thanks-mark.tsx` používa geometriu značky z existujúcej funkcie `hemicycleSeats`; `support-sheet.tsx` ho renderuje len vo vetve serverom potvrdeného `paid`. `app/support.css` nastavuje panel na `min(500px,100%)`; pohyb poďakovania je vypnutý pri reduced motion. Toto nie je potvrdenie vykonanej transakcie.

## Dôkazy a limity

Dokončovací reviewer odporučil **ship**, bez materiálnej opravy; všetkých 13 snímok skutočných funkcií v jeho pakete bolo platných. Screenshoty QA sú uložené v `.impeccable/review/visual-discovery/`, vrátane light/dark úvodu, trendu a výdavkov, koaličných obrazoviek a jasne pomenovaných platobných fixture. Prehliadačová QA pokryla 375/402 px na mobile a 1280 px na desktope v oboch motívoch. Klik a Enter menili rovnaký koaličný súčet. Documenter nevykonával novú prehliadačovú QA.

Implementátor oznámil dva úspešné priechody všetkých 27 verify skriptov a finálne úspešné TypeScript, ESLint, build a generated-dark `--check`. Detektor v `.impeccable/review/visual-discovery-detector.json` obsahuje `[]`. Vizuálna kontrola značky poďakovania a šírky panela použila fixture; verejný `/api/podpora` bol iba prečítaný a uvádzal live režim. Nebola vytvorená nová payment session ani uskutočnená platba. Presun na fyzickom telefóne v Safari zatiaľ nie je overený.

Po review sa opravila funkčná perzistencia vstupu `sala=3d`: callback `change.current` v `components/parliament-page.tsx` uloží aktuálny `view3d` pred `onChange(patch)`, aby odstránenie vstupného URL parametra pri zmene režimu/hlasovania nevrátilo sálu do 2D. Bez vizuálnej zmeny. Následné TypeScript, ESLint a build skončili s exit 0; 27 dátových skriptov prešlo pred touto callback opravou, ktorá nemení dáta. Implementátor cez CUA potvrdil vstup s `sala=3d` → Hlasovania → URL `/parlament?h=58451`: tlačidlo 3D zostalo stlačené a hlasovanie zo 6. októbra malo správnu viditeľnú tabuľu. Dôkaz: `.impeccable/review/visual-discovery/desktop-3d-entry-vote.png`. Dokončovací reviewer následne označil opravu za vyriešenú, bez regresie, a potvrdil **ship**. Lokálna QA tým nepotvrdzuje verejné správanie po nasadení.

## Záznam systému

Existujúci koreňový `../../../DESIGN.md` (workspace `DESIGN.md`) ostáva autoritou; dokumenter skontroloval jeho papierovo-zelený svet, typografiu a komponentové pravidlá oproti `app/visual-discovery.css`, `app/support.css` a piatim komponentom s integráciami. Toto je bežné rozšírenie: nový DESIGN.md ani tokenový sidecar nevzniká.

Predexistujúci rozdiel v DESIGN.md medzi pôvodným veľkým titulkom/exponátom a neskoršími poznámkami o kompaktnom úvode nebol kanonizovaný ani opravovaný. Existujúci support kicker sa neprepisuje na pravidlo pre nové plochy. Tieto položky sú mimo zadanej hranice dokumentácie a nie sú materiálnou opravou tohto balíka.
