# Modelový lístok a titulná obálka — 10. 10. 2026

## THESIS
Schválené body 2 a 3: vlastný model ako interaktívny volebný lístok; úvod ako meniaca sa obálka magazínu. Model je Operate, úvod Read. Refinement existujúceho sveta, nie nový dizajn ani politické údaje.

## OWN-WORLD
Autorita ../../DESIGN.md, papier a zelený atrament, IBM Plex Sans, autentické logá a farby. Lístok je výslovne simulácia; poradie nie je oficiálna kandidátna listina. Grafika je presné zobrazenie skutočných dát, bez dekoratívnych politických obrázkov.

## STORY
Model: logo a percento → dotyková zmena → kreslá a zostavenie koalície. Úvod: výber najnovšieho publikovaného obsahu → skutočný titulok/dátum → dátový vizuál → zdroj/detail → pôvodný Model Mandát a zvyšok stránky.

## FIRST VIEWPORT
Papierový lístok má plné logo, presné percento, kroky 0,5 bodu a natívny rozsah 0–100 po 0,1. Úvod automaticky zvolí najnovší dostupný súhrn, zverejnený prieskum alebo archivované hlasovanie. Každý má vlastný dátum; neoznačuje staré dáta ako dnešné. Žiadny auto-carousel. Užívateľ môže prepnúť obálku.

## FORM
Pôvodné výpočty, chyby nad 100 %, nerozdelená podpora, neznáme percentá, reset, koaličné kartičky aj parlament ostávajú. Zachovaný pôvodný titulok scenára a 3D náhľad pod obálkou. Pri prieskume top 5 hodnôt z publikácie, nie agregát; predchádzajúca ryska rovnakej agentúry. Hlasovanie len zo 150 platných archivovaných hlasov, bez domýšľania osôb. Index načítaný až pri viditeľnej obálke; chyba s retry. Mobil 375/402 px, light/dark, klávesnica a reduced-motion.

## FINISH
Najviac dve batched vizuálne kolá, jeden detector. Všetky verify skripty, tsc, lint, dark check, build. Inline finish-review a documenter podľa degraded kontraktov ako kontrola implementátora, nie nezávislé overenie. Menovitý commit, pull --rebase pred pushom a verejné overenie; Safari na fyzickom telefóne nie je dostupný.

Finálny stav: 31 verify skriptov a technické kontroly prešli. Dve vizuálne kolá, 375/402/1280 px, oba motívy, vstupy/reset/detail článku overené. Jeden detector: layout-transition opravený transformáciou, detector neopakovaný. Inline review: ship; Safari na fyzickom telefóne neoverený.
