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
Čistejšia 2D geometria, uličky a pult; pokojný jednorazový vstup. 375/402 px: tri riadky ovládania (obsadenie, režim, ikony), čitateľný model, bez pretekania. Tmavá 2D sála ostáva tmavá v oboch témach. PNG hlasovania 1080 × 1350 má pevné regióny pre názov, sálu, päť výsledkov a zdroj; dlhý názov ich neposunie.

## FINISH
unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Overenie: desktop a 375/402 px v oboch témach, fullscreen, výber poslanca, hlasovanie, export PNG, reduced-motion v zdroji. Fyzický iPhone ani VoiceOver nie sú dostupné; emulácia to nenahrádza. Dve ohraničené vizuálne kontroly, jeden detector, čerstvý reviewer a documenter. Všetky verify skripty, TypeScript, ESLint, build-dark --check, build; menovitý commit a nasadenie.
