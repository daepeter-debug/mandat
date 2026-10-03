> **Prekonané 3. 10. 2026 večer:** CSS kulisa za 3D sálou, väzba na kameru (`lib/parliament-backdrop.ts`) a posuvný pás s textom odišli; mesto je obloha scény a sála má sklá, strop a sokel. Pozri poslednú časť `docs/parliament-3d.md`. Záznam nižšie ostáva ako história.

# Parlament nad Dunajom — grafické spresnenie, 3. 10. 2026

Dokončená obyčajná úprava Claudovej kompozície `91ebc51`: mesto cez celú scénu, desať polí na stene a existujúca Večerná sála. Kontrakt je [parliament-river-polish-brief.md](../.impeccable/parliament-river-polish-brief.md), finálna evidencia [packet.md](../.impeccable/review/parliament-river/packet.md) a nezávislý verdikt [review.md](../.impeccable/review/parliament-river/review.md): **disposition: ship**, bez materiálnych opráv. Skoršie A/B kompozície ani pozadie iba v oknách neurčujú aktuálny vzhľad.

Papier, zelený atrament, limetkový fokus a lokálne IBM Plex ostávajú zdedeným rozhraním Mandátu. Večerná scéna je lokálna atmosféra v oboch témach. Pôvodné farby strán, klubové a hlasovacie údaje, 150 súradníc kresiel a ovládanie sa zachovávajú. Root `PRODUCT.md`, `DESIGN.md` aj `.impeccable/design.json` zostávajú bez zmeny; táto úprava neustanovuje nový globálny vizuálny systém.

## Mesto a spoločná kamera

`components/parliament-backdrop.tsx` skladá oblohu, lokálnu panorámu, rieku, zrkadlenie, odlesky a vinetu za skutočnou sálou. UFO je vľavo, hrad vpravo; obidva sú viditeľné pri návrate **Celá sála** v prijatých desktopových aj mobilných záberoch. CSS používa rozmery plochy, šírku panorámy `114cqw × zoom` a obzor 26 % výšky na výšku / 30 % na šírku. V 2D ostáva mesto v pokoji.

Najnovšia oprava odstraňuje statické pozadie pri posune a zoome. Tá istá riadená kamera v `components/parliament-ar.tsx` dodáva orbit, cieľ a FOV vieweru aj výpočtu `backdropAttributes` v `lib/parliament-backdrop.ts`; pozadie nečaká na odloženú udalosť `camera-change`. Posun cieľa sa premieta do horizontálneho a vertikálneho parallaxu. Vzdialenosť a FOV menia mierku vzdialeného mesta pomalšie než mierku blízkej sály; výstup má konečné hranice a pri neplatnom vstupe sa vráti do pokoja. Ide o vrstvenú **2.5D ilustráciu**, nie rekonštrukciu mesta pri otočení o 360°.

Celkový pohľad má na výšku polovičnú šírku 0,29 m, sklon 46° a cieľ `0m 0.1m -0.1m`; na šírku 0,58 m, sklon 58° a cieľ `0m 0.075m -0.1m`. Bežné FOV je 30°, vnútorný pohľad používa 68°. Reset a automatické prispôsobenie veľkosti čakajú na verejné `updateComplete` a volajú `jumpCameraToGoal`, aby nezostala zachytená polovica prechodu pri pozastavenom vykresľovaní. Resize po ručnej navigácii naďalej automaticky necentruje kameru.

Panoráma `public/models/bratislava-evening.jpg` má skutočný natívny rozmer **2172 × 724**, **333 104 B**. Požadovaný 3K výstup generátor nevrátil; JPEG vznikol z natívnych pixelov **bez upscalingu**. Úplné zadanie a skutočný rozmer eviduje `bratislava-evening.prompt.txt`; dodaný JPEG nesie pôvod. UI naďalej označuje výhľad ako AI ilustráciu, nie dokumentárnu fotografiu. Panorama ostáva aj lokálnou fallback textúrou GLB; živú stenu nahrádza canvas tabule.

## Kamenná terasa, tabuľa a ticker

`scripts/build-parliament-glb.mjs` mení podlahu na svetlý kameň a pridáva skutočnú geometriu tmavého kamenného sokla, dvoch podpier, škár dlažby a zapustených teplých svetiel nábrežia. Terasa sa pohybuje spolu s modelom; nejde o namaľovanú podložku. Orechové lavice a vnútorný obklad ostávajú teplým materiálom sály.

`components/parliament-wall.tsx` zachováva desať polí a textúru **4096 × 368**. Nový náter používa tmavozelené LED plochy, jemnú linku, svetlé popisy, väčšie čísla, mierny svit číslic a diskrétnu mriežku. Zdroj faktov a poradie v `lib/parliament-wall.ts` sa nemenia. Pri hlasovaní sú to dátum/čas, druh/schôdza, päť kategórií hlasu, výsledok, potrebná väčšina a počet hlasov inak ako klub. Počítanie má osem krokov po 80 ms; reduced-motion kreslí rovno konečný stav. Text pod scénou a alternatíva pre čítačku nesú tie isté fakty.

Menší zakrivený ticker v `components/parliament-display.tsx` / `lib/parliament-display.ts` nesie **celý názov hlasovania, dátum a čas**, bez opakovania počtov z veľkej tabule. Mimo hlasovania zobrazuje titulok aktuálneho pohľadu. Canvas **2048 × 128** používa IBM Plex; posun sa dá pozastaviť tlačidlom **Tabuľa**. Obmedzený pohyb zobrazí statický text a ticker zachováva úplnú textovú alternatívu.

Odlesky sú bez animácie pri `prefers-reduced-motion: reduce`. `IntersectionObserver` a `visibilitychange` pozastavia odlesky mimo viewportu alebo v skrytom dokumente; ticker používa existujúce `visible`, reduced-motion a kontrolu `document.hidden`. Tieto vetvy boli posúdené v zdroji; nejde o živú certifikáciu všetkých nastavení zariadenia.

## Skutočný úvodný náhľad

`public/models/chamber-clubs-2026-10-01.webp` je **skutočný záber interaktívnej scény** v režime Kluby dnes / Celá sála. Z desktopového `final-desktop-light.png` 1280 × 720 bol vyrezaný natívny obdĺžnik x28, y135, **1209 × 518** a skonvertovaný do WebP kvalitou 88 bez upscalingu. Sidecar `chamber-clubs-2026-10-01.webp.json` eviduje zdroj, orez, aktuálny GLB a AI vrstvu pozadia. Náhľad nie je generovaná parlamentná sála. Kontrola oboch dodávaných rastrov zaznamenala **0 chýbajúceho pôvodu**.

## Prijatá evidencia a jej hranice

Parent aj reviewer osobne otvorili osem ustálených záberov v `.impeccable/review/parliament-river/`: `final-desktop-light.png`, `final-desktop-dark.png` (**1280 × 720**), `final-375-light.png`, `final-375-dark.png`, `final-402-light.png`, `final-402-dark.png` (**375/402 × 874 CSS px**) a `vote-desktop.png`, `vote-402.png`. Staršie zábery bez prefixu `final-` sú pre kompozíciu nahradené. Finálne zábery zachovávajú vrch dokumentu; fokus je na zatváracom tlačidle, aby ho automatické posunutie neskrylo.

Živá browser kontrola zaznamenala zmenu CSS zoomu mesta **1.00036 → 1.06283** a po klávesnicovom posune zmenu pan **0 → 0.01831**. Desktop aj šírky 375/402 mali šírku dokumentu zhodnú so `scrollWidth`; log chýb konzoly bol prázdny. Najnovšie zobrazené hlasovanie má **90 za / 0 proti / 52 zdržali / 0 nehlasovali / 8 neprítomní**, návrh prešiel, potrebných **72**, inak ako klub **0**. Sú to prijaté údaje konkrétneho hlasovania, nie konštanty pre budúce hlasovania.

Podľa finálneho packetu prešlo všetkých **21 `verify-*.mjs`**, TypeScript `--noEmit`, ESLint, kontrola aktuálneho tmavého CSS a produkčný build. `verify-parliament-backdrop` pokrýva reset, zoom, preklad cieľa, rotáciu, extrémy, neplatné vstupy a determinizmus; `verify-parliament-display` kontroluje celé názvy/dátumy všetkých hlasovaní, nemennosť údajov a cyklický posun. Aktuálny GLB má **1 492 072 B**, ostáva pod limitom **1 500 000 B**. Khronos v `.impeccable/review/gltf-validation.json` hlási **0 chýb / 0 varovaní** a tri informačné správy. Jeden cielený Impeccable detector vrátil `[]`.

Browser dôkazy potvrdzujú kompozíciu, správny obsah a odozvu kamery. **Fyzický iPhone, Safari, AR, FPS ani súvislá plynulosť animácie neboli odskúšané.** Statické snímky a DOM hodnoty ich necertifikujú. Tento záznam neuvádza nový commit ani nasadenie; tie patria do následného odovzdania.
