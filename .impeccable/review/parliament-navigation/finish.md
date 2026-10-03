# Parlament — voľný pohyb kamery: finish

Dátum: **3. 10. 2026**. Rozsah: obyčajné interakčné rozšírenie Večernej sály podľa `.impeccable/parliament-navigation-brief.md`; bez výmeny identity alebo globálneho dizajnového systému. Ground truth: `components/parliament-navigation.tsx`, `components/parliament-ar.tsx`, `lib/parliament-camera.ts`, `app/parliament-ar.css`, generované `app/theme-dark.css` a `scripts/verify-parliament-camera.mjs`.

## 1. Persistence

**Pass.** Autorita existuje v root `PRODUCT.md`, `DESIGN.md` a `.impeccable/design.json`; dedenie zostáva konzistentné. Documenter porovnal tieto súbory, brief, uvedený zdroj a existujúcu dokumentáciu. Papier, zelený atrament, limetka, IBM Plex Sans Variable, orech, materiály a logá pokračujú v zdedenom svete. Root autorita sa nemenila. Dokumentácia rozšírenia je v `docs/parliament-3d.md`, súhrn v `DATA-CHANGELOG.md`.

Pôvodný reviewer mal sedem načítaných JPEG dôkazov: desktop light/dark a vybraný poslanec **1280 × 800**; mobilné CSS viewporty **375 × 812 / 402 × 874** v oboch témach, providerové bitmapy **360 × 780 / 387 × 841**. `evidence.json` zapisuje rozmery a skutočný JPEG formát. Dodatočný `desktop-dark-focus.jpg` **1280 × 800** dokladá opravu fokusu; parent ho otvoril. Nejde o nové dodávané bitmapové aktíva produktu. Fyzické mobilné limity zostali výslovne uvedené.

## 2. Fidelity

Prvý fresh reviewer označil TYPE, MATERIAL, GROUND, THESIS, OWN-WORLD, STORY a FIRST VIEWPORT ako zhodné s kontraktom. FORM odporoval slabo viditeľný tmavý fokus; Picking/lifecycle a Truth sa zhodovali. Default Posúvať presúva kameru aj cieľ; Otáčať pracuje s aktuálnym cieľom. Cieľ nemá clamp na model, zoom je **0,015–20 m**, azimut celý, horizont stabilný bez rollu a s bezpečným obmedzením pólov. Dva dotyky spájajú posun stredu a pomer vzdialenosti do pan/pinch. Ovládanie aj nápoveda ostávajú pod scénou.

Myš používa ťahanie, koliesko a pravé ťahanie na rotáciu. Shift pri ťahaní prepne druhý spôsob pohybu. Klávesnica na scéne: šípky podľa zvoleného režimu, Shift so šípkami rotácia, plus/mínus zoom, Home reset. Krátky primárny klik/dotyk vyberie kreslo; hranice **7 CSS px / menej než 500 ms**, viac dotykov alebo ťahanie výber potlačia. Začiatok ručnej navigácie zachytí aktuálny camera orbit/target a preruší úvod; manuálny stav blokuje resize centering. Celá sála vráti celok a zruší detail.

Živá DOM kontrola parenta potvrdila posun cieľa bez zmeny orbitu, rotáciu po posune so zmenou orbitu a zachovaním cieľa, reset, klávesnicové ArrowLeft/Home a zoom tlačidlom. Výber SMER a **Lešo, Boleslav / SMER / za** v Hlasovaniach fungoval; tabuľa **90/0/52/0/8**, chyby konzoly `[]`. Klávesnicové plus/mínus bolo posúdené iba v zdroji. Toto sú testovacie vstupy, nie politické odporúčanie.

## 3. Ceiling

Dosiahnutý v úzkom rozsahu navigačného rozšírenia; samostatná QUALITY BAR karta nebola dodaná. Kontrola nepredstavuje nový audit celého produktu, fyzické dotykové testy ani certifikáciu plynulosti. Mobilná emulácia používala myš a `pointer: coarse` bolo false. Fyzické Safari/Chrome, simultánny dvojprstový pan/pinch, AR a živé reduced-motion zostávajú neoverené; statické snímky nedokazujú FPS ani časovanie.

Po finálnej oprave prešli všetkých **17 `verify-*.mjs`**, TypeScript `--noEmit`, úplný ESLint, aktuálnosť generovaného tmavého CSS (**`7ba0d10900`**) a produkčný build. Nová čistá camera kontrola pokrýva screen-plane translation, neobmedzený cieľ, celý azimut, bezpečné póly a zoom, zložený pinch a nemennosť vstupov. Priamy detector nad tromi zmenenými cieľmi vrátil `[]`; predbežný launcher nemal výstup, preto ho nepovažujeme za dôkaz čistého výsledku.

GLB bez zmeny: **1 444 616 B**, SHA-256 **`dc6cf7b358cc281eab8a8513d9f7a71f44160b72851e00f6623a36483a353b53`**, 150 kresiel, 165 kanálov. Bez regenerovania/kompresie modelu alebo zmien politických dát, hlasovaní, hier a Worker bindingov. Nové nasadenie zatiaľ nie je potvrdené; deployment ID a online QA doplní parent po vykonaní.

## 4. Material fixes

Prvá disposition bola **fix** s jediným materiálnym nálezom: viewer focus v tmavej téme sa zmenil na `#4c5043`, približne **1,11–1,71 : 1** voči podkladu scény. Nález sa nezapísal ako normatívny dizajnový token.

Opravené cez lokálne **`--par3d-focus:#dcf59b`**, zodpovedajúce existujúcej `mag-lime`; zdroj aj generované dark CSS ponechávajú `outline:2px solid var(--par3d-focus)` a vnútorné odsadenie −4 px. Parent overil živé `:focus-visible=true` a computed `rgb(220, 245, 155)` aj otvorenú finálnu snímku. Nie je to nový globálny token.

Ten istý fresh reviewer uzavrel: **Resolved** — `desktop-dark-focus.jpg` ukazuje jasný limetkový obrys načítanej sály; source aj generated dark CSS zachovávajú hodnotu. Bez viditeľnej regresie tejto opravy, ostatné oblasti v pôvodnej kontrole zodpovedali zdedenému smeru. Opakovaná kontrola je viazaná na skórovaný fokus; tvrdenia o zvyšku čerpajú z pôvodného review.

## 5. Verdict

**disposition: ship** pre opísané lokálne navigačné rozšírenie a vyriešenú opravu fokusu. Zachovať voľný cieľ, stabilný horizont, explicitné režimy, zložený pinch, reset a drag-safe výber kresla. Tento verdikt neznamená nasadenie ani rozšírenie fyzických testov.

Preexistujúci drift root autority o logách, svetlej téme a nedostupnej browser kontrole sa neopravoval a nekanonizoval: mimo hranice obyčajného rozšírenia. Žiadna nová identita, globálny token alebo produktové obrazové aktívum nevznikli.
