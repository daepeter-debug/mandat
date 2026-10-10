# Mandát

Mandát je nezávislý prehľad slovenskej politiky: prieskumy, ich agregovaný model, strany, programy, parlament, správy a súvisiace vysvetlenia. Peter ho zatiaľ prevádzkuje ako hobby a testovací web, bez reklamy a bez uprednostňovania strán. Údaje a tvrdenia majú dohľadateľné zdroje; neistota modelu musí zostať viditeľná. Tieto rozhodnutia pochádzajú zo zadania používateľa.

## Schválené mobilné rozšírenie, 9. október 2026

Používateľ schválil celý balík šiestich vylepšení z `../PROMPT-codex-mobil-wow.md` (v hlavnom checkoute):

1. Správy jedného dňa ako príbeh „Deň za 30 sekúnd“, s pôvodným poradím, zdrojmi, detailmi a zdieľaním.
2. Kompaktný polkruh 150 kresiel pri titulku vydania, z rovnakého modelu a blokov ako titulok.
3. Miniatúry skutočných hlasovaní po poslancoch, načítané až pri zobrazení.
4. Dátové ilustrácie rozcestníka „Ďalej na webe“.
5. Voliteľné zoradenie strán podľa podpory, drobné trendy a farebné profily s pásmom neistoty.
6. Čitateľný orientačný odpočet, zmeny podpory za 30 dní a spoločný počet hier.

## Existujúci vzhľad a hranice

10. októbra 2026 používateľ doplnil zadanie: v úvode viditeľne vysvetliť Model Mandát a uviesť najnovšie prieskumy s prelinkami, s dôrazom na grafiku namiesto dlhého textu. Súčasťou je priama skratka z titulku, graf úbytku váhy v čase, východiskové váhy vstupov a odkazy na meranie i pôvodný zdroj.

Následne schválil zvýraznenie najnovšieho prieskumu v pohyblivom páse a samostatný výber ďalších grafických úprav na webe. Rozšírenie zahŕňa podfarbenie najnovšieho známeho dátumu publikácie, graf neistoty oproti hranici 5 % v profiloch, vydavateľa pri správach a porovnanie príjmov/výdavkov verejnej správy za posledné dva dostupné roky. Ide o zobrazenie existujúcich údajov.

Rozšírenie zachováva redakčný vzhľad existujúceho webu: IBM Plex Sans, krémové a zelené plochy, zodpovedajúci tmavý režim, typografickú hierarchiu a navigáciu. Farby strán a hlasov vychádzajú z existujúcich dát. Nejde o nový dizajn celého webu.

Výsledok nemení zdrojové politické údaje, výpočty modelu, GLB scény, ekonomiku hier ani nasadzovaciu konfiguráciu. Správy používajú skrátený súvislý úryvok overeného textu. Septembrový horizont volieb 2027 je orientačný; presný deň sa neprezentuje ako potvrdený.

## Použitie a overenie

Mobil má prednosť: šírky 375 a 402 px, žiadne vodorovné pretekanie, dotykové ciele aspoň 40 px a podpora obmedzeného pohybu. SVG, CSS a canvas dopĺňajú existujúce komponenty bez ďalšej ťažkej knižnice; obsah mimo prvého pohľadu sa načítava lenivo. Zachovávajú sa klávesnica, čítačky, URL stav aj existujúce ovládanie spodnej lišty.

Kontroly zahŕňajú TypeScript, ESLint, všetky dátové overovacie skripty, konzistenciu tmavého režimu, build a prehliadačové snímky v oboch režimoch pri troch šírkach. Overenie v emulovanom Chrome nenahrádza skúšku na fyzickom iPhone v Safari; tá zatiaľ neprebehla.

Pracovný predpoklad, nie výskum publika: návštevník chce rýchlo pochopiť aktuálne slovenské politické údaje a podľa potreby otvoriť podrobnosti.
