# Parlament — dokončenie grafiky, 3. 10. 2026

## THESIS
Mode: Operate / Read. Rozšírenie hotovej stránky od Clauda: sála je vstupom do skúmania poslancov a hlasovaní, nie dekoráciou bez dát.

## OWN-WORLD
Zachovať autoritu ../../DESIGN.md: papier, zelený atrament, IBM Plex Sans, večerná drevená sála. Farby hlasov a klubov zostávajú faktické a rovnaké pre každého. Žiadna nová vizuálna identita ani kompresia GLB.

## STORY
Úvod → malý skutočný render sály → ľahká interaktívna 2D sála alebo 3D → vybrané kreslo a profil → hlasovanie a jeho zdieľanie. Dáta, URL, pravidlá väčšiny, poradie klubov a geometria 150 kresiel bez zmien.

## FIRST VIEWPORT
Kompaktný nadpis, pôvodný opis a fakty; vedľa nich večerný render aktuálnych klubov s jasným dátumom. Na mobile nízky náhľad, ktorý otvára 3D. 2D ostáva plne použiteľné bez WebGL. Signature interaction: výber poslanca označí konkrétne kreslo neutrálnym prstencom a kamera k nemu priletí.

## FORM
Čistejšia 2D geometria, uličky a pult; pokojný jednorazový vstup. 375/402 px: tri riadky ovládania (obsadenie, režim, ikony), čitateľný model, bez pretekania. Podľa Petrovej revízie 10. 10. 2026 2D pôdorys sleduje papier stránky a motív; rozsiahle tmavé pozadie i rám malého náhľadu sú odstránené. Večerná 3D scéna ostáva. PNG hlasovania 1080 × 1350 má pevné regióny pre názov, sálu, päť výsledkov a zdroj; dlhý názov ich neposunie.

## FINISH
unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Overenie: desktop a 375/402 px v oboch témach, fullscreen, výber poslanca, hlasovanie, export PNG, reduced-motion v zdroji. Fyzický iPhone ani VoiceOver nie sú dostupné; emulácia to nenahrádza. Dve ohraničené vizuálne kontroly, jeden detector, čerstvý reviewer a documenter. Všetky verify skripty, TypeScript, ESLint, build-dark --check, build; menovitý commit a nasadenie.

### Revízia 2D, 10. 10. 2026

Úzky zásah do pôdorysu a náhľadu, bez nového vizuálneho sveta alebo comp round. Dokončovací review a dokumentácia prebehli inline podľa degraded kontraktov skillu; nejde o nezávislé overenie. Disposition: ship. Persistence: PRODUCT.md a existujúci dizajn zachované. Fidelity: TYPE — IBM Plex Sans match; MATERIAL — presná vektorová geometria match; GROUND — papier a zelené motívové tokeny match podľa výslovnej Petrovej revízie; vstup do 3D acceptable adaptation. Ceiling: zámerná pokojná dátová plocha, bez ďalšej dekorácie. Material fixes: none. Keep: geometria 150 kresiel, faktické farby hlasov, pôvodné interakcie, večerná 3D scéna.

Snímky `.impeccable/review/chamber-paper/`: desktop-light/dark, 375-light/dark, 402-light/dark, user-1906-light, 402-vote-dark a 402-selected-dark. Mobilné snímky ukazujú viewport sály, nie celý dokument. 402-dark zámerne zachytáva zvýraznenie SMER. Detektor raz: `[]`. Skontrolované zladenie motívov, vstup, výber klubu, poslanca a hlasovanie; export/fullscreen neboli v tejto úzkej revízii znovu testované.

Documenter: existujúce DESIGN.md zostáva bez zmien; paleta papier/zelený atrament, IBM Plex Sans, transparentná dátová plocha, sémantické chamber premenné a oddelená večerná 3D paleta zodpovedajú kódu. Nová dizajnová identita ani raster sa nekanonizujú.

### Revízia klubov a vizitiek, 10. 10. 2026

Rozsah schváleného pokračovania: logá/počty pri 2D oblúku a vizitka zvoleného poslanca. Počet a umiestnenie označení vychádzajú zo skutočných kresiel; klik používa pôvodný focusClub. Vizitka používa skutočné meno, klub a prípadný hlas, fotku len z existujúcich licencovaných podkladov (osem presne spárovaných ID), inak monogram. Zdroj/licencia sú vo vizitke. Pôvodný profil, URL, hlasovanie a 3D sa nemenia.

Desktop: označenia okolo oblúku a vizitka pri kresle. Mobil/tablet do 1120 px: kompaktný rad log nad mapou a vizitka pod ňou; prispôsobenie zachováva viditeľnú mapu a použiteľné dotykové ciele. Podľa potreby sa vizitka odkryje nad spodnou lištou, bez animácie pri reduced-motion. Súbory: components/chamber-inspection.tsx, lib/chamber-annotations.ts, lib/deputy-portraits.json, scripts/verify-chamber-annotations.mjs.

Snímky chamber-details/: desktop-photo-light/dark, 375-light/dark, 402-light/dark, 402-vote-dark, 900-light; výber klubu, monogram/foto, profil, Escape a hlasovanie 58451 overené. Všetkých 28 verify skriptov, tsc, ESLint, build-dark --check a produkčný build prešli. Detektor raz: []. Dokončovací review inline podľa degraded kontraktu: ship, nejde o nezávislé overenie. Úplný päťsekčný review je chamber-details/REVIEW.md. Fyzický iPhone/Safari zostáva neoverený.

Documenter: No changes to DESIGN.md/sidecar; checked app/parliament-page.css, app/theme-dark.css, chamber components and existing DESIGN.md. Palette: incumbent paper/pine and theme foregrounds. Type: IBM Plex Sans, 15 px person name/12 px club/11 px credits. Rules: 14 px inspection radius, desktop offset shadow/mobile border, genuine club colors, logo/count targets, responsive inspection placement. No new visual identity or unlicensed raster canonized; unrelated incumbent drift left untouched.
