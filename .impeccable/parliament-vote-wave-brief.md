# Hlasovanie bez stĺpikov — 2. 10. 2026

Peter požiadal odstrániť zvislé „stojany“ a prijal krátku vlnu prefarbenia kresiel s jemným zvýraznením vybraného poslanca. Mode: Experience + Operate. Ordinary extension Večernej sály, code-led, bez novej identity alebo dodávaných obrázkov.

THESIS: hlas je farba samotného kresla, sála zostáva prehľadná.
OWN-WORLD: zachovaný orech, logá klubov, papier, zelené ovládanie a obe témy.
STORY: vyber hlasovanie → jednorazové odhalenie farieb → ťukni na konkrétne kreslo a zobraz meno/hlas. Animácia nepredstavuje chronológiu hlasovania.
FIRST VIEWPORT: čistá sála bez stĺpikov, presné počty a detaily pod ňou, bez zmeny mobilného rozloženia.
FORM: existujúci seatSweep 1 050 ms, všetkých 150 kresiel; rýchle zmeny rušia starú prácu, skrytá scéna alebo reduced-motion idú priamo na výsledok. Výber kresla vlna neopakuje. Rovnaké zvýraznenie pre každý hlas vrátane neprítomného.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

GLB ostáva kompatibilný a nekomprimovaný: varianty a 165 kanálov sa nemenia. Pôvodné stĺpiky sa v rozhraní nevykresľujú (alfa 0 a zastavený klip pred ich vysunutím). Bez zásahu do politických dát, hier, Worker bindingov a formátu uloženia. Nasadenie priamo na existujúci preview autorizované. Commit len menovite vlastné súbory, pull --rebase pred pushom. Root PRODUCT.md/DESIGN.md zachovať.

Overenie: existujúce testy sweepu a všetky verify skripty, TypeScript, ESLint, build; desktop1280 a mobil375/402 v oboch témach, výber/odvýber poslanca, rýchle prepnutie hlasovania/režimu a návrat. Fyzický mobil, AR a FPS netvrdiť.
