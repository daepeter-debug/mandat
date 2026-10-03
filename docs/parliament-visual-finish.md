# Parlament — dokončenie vizuálu

Záznam z 3. 10. 2026. Stránka `/parlament` pokračuje v existujúcom Mandáte: papier, zelený atrament, IBM Plex Sans a večerná drevená sála. Čerstvá záverečná kontrola má verdikt **ship**, bez materiálnych opráv. Je to rozšírenie existujúceho vzhľadu; autorita v [DESIGN.md](../../../DESIGN.md), [PRODUCT.md](../../../PRODUCT.md) a [design.json](../../../.impeccable/design.json) zostáva zachovaná.

## Čo sa dokončilo

- Úvod má malý skutočný render existujúceho 3D modelu. Otvára 3D a jasne uvádza kluby k **1. 10. 2026** aj ilustračný charakter rozsadenia. Tento pevný dátum patrí obrázku; nie je tvrdením o čerstvosti budúcich dát.
- 2D sála dostala čitateľnejší okraj, operadlá a pult. Zdieľané súradnice 150 kresiel sa nemenili. Pulz vybraného kresla skončí po dvoch opakovaniach; zdroj vypína vstupnú animáciu a pulz pri obmedzenom pohybe.
- Vybraného poslanca označuje v 3D rovnaký neutrálny prstenec pre každý klub. Existujúca navigácia kamery ostáva súčasťou interakcie.
- Ovládanie na šírkach 375 a 402 px má tri riadky: obsadenie, režimy, ikonové akcie. Rozšírená sála drží klávesnicový fokus v dialógu; Escape ju zatvorí a vráti fokus na otváracie tlačidlo.
- PNG hlasovania má **1080 × 1350 px** a pevné regióny pre názov, sálu, päť kategórií hlasov, výsledok, pravidlo väčšiny a zdroj. Dlhý názov sa skráti na štyri riadky; celý zostáva na konkrétnej stránke `/parlament?h=<id>`, ktorú obrázok uvádza.

Dáta, poradie klubov, pravidlá väčšiny ani GLB sa touto úpravou nemenili. Model má 1 444 616 bajtov a nebol komprimovaný. Nový WebP má 93 940 bajtov: pochádza z natívneho `model-viewer.toBlob` exportu, prevedeného cez sharp na WebP s kvalitou 90. [Záznam pôvodu](../public/models/chamber-clubs-2026-10-01.webp.json) uvádza hash modelu, revíziu klubových dát, dátum a konverziu.

## Vzťah k existujúcemu dizajnu

Úvod pokračuje v pokojnej, kompaktnej kompozícii. Malý render je vstupom k dátam; nevytvára nový vizuálny svet. Farby klubov a hlasov rozlišujú údaje. Identitu stále nesie zelený atrament. Tmavá sála má rovnaký základ v oboch témach a umožňuje čítať kreslá bez WebGL v 2D. Jednorazový pohyb a rovnaké označenie poslanca podporujú skúmanie bez politického zvýhodnenia.

## Overenie a hranice

[Záverečná kontrola](../.impeccable/review/parliament-page-polish/review.md) otvorila všetkých 14 požadovaných zachytení: desktop, 375/402 px v oboch témach, rozšírenú 3D sálu, vybraného poslanca, odlišné hlasovanie a export s dlhým názvom. Pri mobilných šírkach nebolo zistené horizontálne pretekanie. Prehliadač overil 150 kresiel, zachovanie parametrov výberu v URL, zhodu označenia so súradnicami a cyklus Tab/Shift+Tab s návratom fokusu po Escape.

Prešlo 18 overovacích skriptov, TypeScript, úplný ESLint, `build-dark --check` a produkčný build. Dokumentácia čerpá z [paketu dôkazov](../.impeccable/review/parliament-page-polish/packet.md), verdiktu a vzorky zdrojov; jej autor navyše prezrel desktopové svetlé zachytenie, 375px tmavú rozšírenú sálu a PNG.

Mobilné zachytenia používajú veľkosť viewportu; fyzický iPhone, Safari/Chrome na zariadení, AR, FPS, VoiceOver ani natívne zdieľanie neboli overené. Obmedzený pohyb a zastavenie mimo obrazovky boli skontrolované iba v zdroji. Statické obrázky nepotvrdzujú kvalitu animácie. Chybný predbežný výrez `chamber-source.jpg` nebol podkladom verdiktu.

## Starší kontext

PRODUCT.md stále uvádza zámer iba svetlého režimu, hoci zdedená aplikácia už má tmavú tému. DESIGN.md a sidecar obsahujú historické poznámky o nedostupnom prehliadači a staršie parametre úvodu; neskoršie dodatky časť z nich spresňujú. Tento rozsah overuje stránku Parlament, nie celý systém. Staršie rozpory sa tu hlásia a zostávajú bez opravy; nevznikajú z nich nové pravidlá dizajnu.
