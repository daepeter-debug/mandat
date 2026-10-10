# Mobilná herná mapa — 10. 10. 2026

## THESIS
Peter chce prehľadnú mapu na šírku bez veľkého detailu nad budovami. Experience mapa / Operate pracovný panel. Úzke prispôsobenie existujúcej hry.
## OWN-WORLD
Existujúca ilustrovaná dioráma, IBM Plex Sans, svetlý herný papier a zelené ovládanie aj v tmavom režime. Bez nových obrázkov, fontov a knižníc. Autorita ../../DESIGN.md a docs/mala-republika/DESIGN.md zachovaná.
## STORY
Ťukni na budovu → detail vpravo; Stavať → katalóg vpravo → vyber voľné políčko na odkrytej mape → potvrď vpravo. Úlohy a legenda kedykoľvek, bez straty stavby.
## FIRST VIEWPORT
Pri 844×390 mapa 654×390, pravý panel 190. Detail ani stavba nepokrývajú políčka. Zbaliteľný panel, safe-area ovládanie, rovnaký režim pri slávnosti.
## FORM
Pôvodné komponenty a stav, žiadne kópie uloženia alebo zmeny ekonomiky. Automatický výber pracovného panela, ručné Úlohy/Legenda, zachovanie rozpracovanej stavby. Escape lokálne. Desktop a portrét nezmenené.
## FINISH
31 verify skriptov, tsc, lint, dark check a build PASS. Detector raz []. Dve batched vizuálne kolá. Inline review implementátora, nie nezávislé overenie. Fyzický Safari neoverený. Dôkazy .impeccable/review/republic-workspace/mobile.png a desktop.png, ďalšie small-landscape.png, portrait.png, mobile-placement.png a festival-detail.png.
