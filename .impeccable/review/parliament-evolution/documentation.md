# Dokumentačné odovzdanie — 2. 10. 2026

## Rozsah a porovnanie

Čerstvý documenter prečítal root `PRODUCT.md`, `DESIGN.md`, `reference/document.md`, kontrakt `.impeccable/parliament-evolution-brief.md`, prijatú evidenciu `ui-proof.md`, záverečný `finish-review.md`, existujúcu dokumentáciu a aktuálny diff `components/parliament-ar.tsx`, `app/parliament-ar.css`, generovaného `app/theme-dark.css`. Nepoužil prehliadač ani nevykonal nový audit; vizuálne závery nižšie odkazujú na prijatú evidenciu reviewera.

Kontrakt požaduje presné dátumy/počty, fyzickú sálu bez prekrývania, Večernú sálu v zdedenom papierovom a zelenom rozhraní a rovnaké zaobchádzanie so všetkými stranami. Implementácia presúva tabuľu hlasovania a detail strany/poslanca pod scénu, zvyšuje tabuľkové počty a zachováva textové kategórie. Päť mobilných režimov tvorí jednu mriežku. Tlmenie stĺpikov (BLEND, alfa 0,32, emisívny faktor 0,45) platí pri každom hlasovaní. Text hlasu poslanca zdedí sekundárny text témy; namerané kontrasty v podkladoch sú 5,47 : 1 / 8,43 : 1. Adaptive minimum 0,6 používa najnižší krok knižnice 0,62; dokumentácia z toho nevyvodzuje namerané FPS.

Incumbent systém ostáva rozpoznateľný: IBM Plex Sans, papier a zelený atrament, existujúce focus/textové tokeny a ilustračná orechová sála. Ide o ordinary extension. Root `PRODUCT.md`, `DESIGN.md` a `.impeccable/design.json` sa zachovali; nevzniká nový dizajnový systém. Ich preexistujúce tvrdenia o svetlej téme, nedostupných logách, odloženom nasadení a zdieľaní nezachytávajú dnešnú implementáciu. Tento drift sa iba eviduje, bez nevyžiadanej opravy.

## Zachované podklady a proveniencia

- Claudova dokončená logika vývoja, zdieľania, nepostúpenia a 348 hlasovaní ostáva pôvodnou funkčnou vrstvou. Jeho historické záznamy v dokumentácii/changelogu neboli prepísané.
- GLB bez kompresie a bez regenerovania v tejto úprave: 1 444 616 B, 150 kresiel, 165 animačných kanálov; zachované názvy a poradie variantov `…modely, prechod, hlasovanie`, materiály a časovanie. Khronos 0 chýb / 0 varovaní podľa prijatých podkladov.
- Žiadne nové bitmapové assety sa nedodávajú. Existujúce materiálové textúry a lokálne stranícke značky sú zdedené z generátora a `lib/party-logos.json`; hlasovací atlas vzniká za behu. Koncepčné rendery ostávajú historickou referenciou atmosféry.
- Zdieľací PNG vzniká za behu z reálnej scény `toBlob` a dát kombinácie. Prijatý `final/coalition-card.png` má 1080 × 1350; uloženie z DOM dataURL a náhľad boli overené. Nejde o novú dodávanú marketingovú bitmapu.

## Dôkazy a ich hranice

Záverečný reviewer prijal 14 pôvodných snímok pre úzky grafický rozsah a štyri snímky opraveného detailu poslanca na desktope 1280 a mobile 375 v oboch témach. Všetky štyri otvoril individuálne, kontrast uzavrel ako resolved a nenašiel viditeľné regresie; **disposition: ship**. Rozsah zahŕňa čitateľnú tabuľu a detaily mimo scény, nie nový audit celej aplikácie. Mobilné CSS šírky 375/402 a obsahové šírky 360/387 s provider posuvníkom nie sú test skutočného telefónu.

Mesačné stable frames neboli prijaté: automatický fokus/posúvanie alebo prechod menili kameru. Live playback január → september so zastavením podporuje interakčné správanie; zdroj a `verify-parliament-evolution` podporujú dáta, ale review necertifikuje ustálenú kompozíciu prvého/posledného mesiaca ani plynulosť zo snímok. Exclusion a mobilné party detaily majú prijaté stabilné dôkazy. Konzola posledného čistého načítania bola podľa `ui-proof.md` bez chýb.

Rodič potvrdil finálne úspešné kontroly: všetkých 16 `verify-*.mjs`, TypeScript `--noEmit`, úplný ESLint v `app`, `components`, `lib`, `scripts`, `worker`, `build-dark --check` (`0358096b9c`) a produkčný build. Existujúce vinext upozornenia na veľkosť/classification chunkov ostávajú. Detector bol jediný pred synchronizáciou s Claude (`[]`). Commit `7a7af24` je odoslaný na `main`; úspešný `npm run deploy:preview` nasadil 2. 10. 2026 verziu `dc3f63cb-faa9-4c79-8ddd-72349d38c20f`. Verejná kontrola rodiča potvrdila scénu, tabuľu pod ňou, výber Faič, Vladimír / SMER / za a konzolu `[]`; `final/online-votes.png` a `final/online-deputy.png` sú lokálne dôkazy. Verejný GLB má HTTP 200, 1 444 616 B a SHA-256 `dc6cf7b358cc281eab8a8513d9f7a71f44160b72851e00f6623a36483a353b53`, zhodný s lokálnym súborom. PNG dôkazy ostávajú lokálne mimo Gitu; odovzdávajú sa iba správy a dokumentácia.

Natívny share a fyzický download nie sú odskúšané; IAB download ostal bez udalosti. Žiadne externé zdieľanie neprebehlo. Fyzické Safari/Android, AR, FPS, živé reduced-motion a end-to-end screen-reader overenie ostávajú neoverené. Reduced-motion/visibility sú posúdené v zdroji.

## Zapísané súbory

`docs/parliament-3d.md`: pridaná datovaná sekcia grafického spresnenia a presné hranice dôkazov. `DATA-CHANGELOG.md`: nový stručný horný záznam. Tento súbor: porovnanie kontraktu, implementácie a incumbent systému, proveniencia a limity. Dokumentačné odovzdanie nemení root systém, brief, UI ani model.
