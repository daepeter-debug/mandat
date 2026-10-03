# Parlament — prvý lokálny prototyp A + B

Stav k 3. 10. 2026: **nasadené na testovací web na Petrov výslovný pokyn; čaká na vizuálnu spätnú väzbu**. Online: [Parlament](https://mandat-preview.mandat.workers.dev/parlament). Zdrojový commit `d3724ac`, overený Worker `ae2bac1f-e28e-4e6e-b0b6-2ee39aadfeed`. Produkčný lokálny náhľad je aj na [127.0.0.1:5185/parlament](http://127.0.0.1:5185/parlament). Ide o prvý prototyp schválenej kombinácie A + B, nie o dokončenie celej sedembodovej roadmapy.

## Čo je skutočne implementované

Nad dreveným obkladom sú geometrické okenné rámy a panoráma Bratislavy: UFO naľavo, hrad napravo. Generovaná panoráma je ilustrácia za oknami, nie fotografia skutočnej rokovacej sály. Interaktívne kreslá, lavice, obklad, rámy a tabuľa ostávajú geometriou GLB. Teplé drevo má `KHR_materials_clearcoat`, čalúnenie `KHR_materials_sheen` a lemovanie používa mosadzný kovový materiál.

Hlasovacia tabuľa je zakrivený pás vložený do drevenej steny **pod oknami a nad posledným radom**. Nie je prekryvom HTML nad sálou. Komponent vytvorí jednu opakovane používanú textúru canvasu (2048 × 128 px) a cez verejné rozhranie `model-viewer` ju pripojí k materiálu `tabula:hlasovanie`. Materiál je unlit, aby čitateľnosť textu nezávisela od osvetlenia sály.

Text sa posúva zľava doprava; prekresľovanie je obmedzené na približne 10 aktualizácií za sekundu. Animácia sa zastaví mimo obrazovky, pri skrytom dokumente a po stlačení tlačidla „Tabuľa“. Pri `prefers-reduced-motion` sa zobrazí statický súhrn. Faktické čísla zostávajú dostupné aj v textovom rozhraní a tabuľa má alternatívny text pre čítačky obrazovky.

## Zachované zmluvy a dáta

Všetkých 150 kresiel používa pôvodné spoločné súradnice. Zachované sú režimy, varianty, názvy a mapovania materiálov, výber kresla aj parametre stavu v URL. Farby strán a hlasov naďalej rozlišujú údaje; identitu ovládania nesie zdedený zelený atrament, papier a IBM Plex Sans.

Tabuľa zobrazuje existujúce hlasovania bez úpravy dát: za, proti, zdržali sa, nehlasovali, neprítomní, výsledok a potrebnú väčšinu. Overovací skript kontroluje presnú zhodu všetkých **348** súhrnov, pravidlo väčšiny, nezmenený vstupný objekt a smer aj cyklus posunu.

| Lokálny súbor | Veľkosť | Úloha |
| --- | ---: | --- |
| `public/models/parlament.glb` | 1 478 460 B | Geometria a materiály; bez kompresie |
| `public/models/bratislava-evening.jpg` | 159 551 B | Samostatne cachovateľná ilustrácia za oknami |
| `public/models/parlament-evening.hdr` | 524 337 B | Vlastné analytické RGBE osvetlenie 512 × 256 px |

HDR vytvára lokálny skript; žiadne externé HDR sa nesťahovalo. Panoráma sa načíta ako lokálny zdroj GLB pri otvorení 3D.

## Overenie a odovzdanie

Prešlo všetkých 19 overovacích skriptov, TypeScript, ESLint, `build-dark --check` a produkčný build. Khronos glTF validátor hlásil **0 chýb a 0 varovaní**; detektor v tomto rozsahu vrátil `[]`. Zachytenia pre desktop a 375/402 px v oboch témach, vybraného poslanca a hlasovanie sú v [balíku kontroly](../.impeccable/review/parliament-wow/). Statické zachytenia overujú kompozíciu, nie plynulosť pohybu.

Implementačné zdroje: [geometria a materiály](../scripts/build-parliament-glb.mjs), [textúry a HDR](../scripts/parliament-textures.mjs), [canvas tabuľa](../components/parliament-display.tsx), [fakty a fáza posunu](../lib/parliament-display.ts), [zapojenie do 3D](../components/parliament-ar.tsx) a [ovládanie](../app/parliament-ar.css). Dátové a modelové kontroly sú v [verify-parliament-display.mjs](../scripts/verify-parliament-display.mjs) a [verify-parliament-glb.mjs](../scripts/verify-parliament-glb.mjs).

Nasleduje Petrovo posúdenie atmosféry, mierky sály a čitateľnosti panorámy a tabule. Prototyp netvrdí fotorealistickú zhodu s návrhovými obrázkami. Fyzický iPhone, Safari na zariadení, FPS, AR ani video neboli overené. Existujúci malý náhľad sály stále pochádza z predchádzajúceho renderu; jeho súdržné obnovenie čaká na spätnú väzbu.

Autorita v koreňových `PRODUCT.md`, `DESIGN.md` a `.impeccable/design.json` ostáva zachovaná. Ich predchádzajúce rozpory o svetlej téme, historickom stave prehliadača a starších parametroch úvodu sú hlásené bez opravy; táto lokálna architektonická úprava z nich nevytvára nové pravidlá systému.
