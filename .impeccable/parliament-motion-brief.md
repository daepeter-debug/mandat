# Parlament v 3D — kreslá, väčšina a pohľad zvnútra

2. 10. 2026. Peter schválil tri ďalšie prvky slovami „ok pod“. Ide o rozšírenie existujúcej Večernej sály, nie nový vizuálny svet. Mode: Experience s ovládaním vlastnej koalície v režime Operate. Politické dáta, dve faktické obsadenia a farby ostávajú zachované.

## Potvrdené správanie a motion thesis

- Focal moment: pri zmene obsadenia v režime Strany postupujú cez skutočných 150 kresiel nové farby a značky. Krátka vlna trvá 1 050 ms, dá sa preskočiť alebo prerušiť iným ovládaním. Interný glTF variant `prechod` nie je tretím dátovým scenárom; po vlne sa obnoví presný zvolený variant.
- Continuity: stručné, označené porovnanie 2023 → Model Mandát ukazuje najväčší zisk a stratu mandátov. Subjekty s odlišným ID (historická koalícia OĽANO a dnešné Slovensko) sa nezlučujú.
- Feedback: pri prekročení hranice 76 sa na 1 500 ms rozsvieti podlahová intarzia smerom k pultu a jemne zvýraznia kreslá vybranej kombinácie. Po skončení zostane pokojné svetlo; bez slučky, zvuku a straníckej preferencie.
- Pohľad z kresla poslanca: kamera má východiskový bod v úrovni očí nad skutočným stredovým kreslom a širšie zorné pole smerom na pult. Zachováva ilustračný, modelový štýl; nie je to presná rekonštrukcia NR SR ani voľný first-person režim. Návrat „Celá sála“ je vždy viditeľný.
- Budget: zdieľané textúry/geometria a vlastné materiály pre prechod, žiadna nová runtime závislosť. GLB pod 1,5 MB; žiadne zmeny ekonomiky ani iných hier. Reduced motion preskočí priestorové aj dekoratívne animácie. V skrytej karte sa pohyb ukončí v zvolenom konečnom stave.

## Zachovaný systém a overenie

Papier, zelený atrament, šalviové ovládanie, orechové drevo a lokálne teplé HDR. Ovládanie nad scénou, textová legenda pod ňou, bez plávajúcich počtov v architektúre. Svetlá/tmavá téma; desktop 1280 × 800, mobil 375 × 874 a 402 × 874 CSS px, bez vodorovného pretekania. Fyzický Safari/Android, AR a FPS ostávajú mimo dostupnej evidencie.

Čisté testy výpočtu ziskov/strát, deterministického bodu kamery a monotónneho sweepu; Khronos a invarianty oboch skutočných variantov plus 150 unikátnych prechodových dvojíc materiálov. Produkčný build, TypeScript, lint, dáta a tmavé CSS. Bounded vizuálna kontrola, potom čerstvý reviewer a documenter podľa Impeccable.

Priamo nasadiť na existujúci mandat-preview je autorizované. Commitovať menovite vlastné súbory a pred pushom synchronizovať spoločný main.
