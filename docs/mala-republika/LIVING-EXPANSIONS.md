# Štyri rozšírenia — pracovný kontrakt Petra, 1. 10. 2026

Poradie: **1 → 2 → 3 → 4**. Každé osobitne: čisté jadro + verify skript → UI/grafika → lokálna ukážka → nasadenie až po Petrovom OK. Terén je dokončený v commite `30b235f`. Politická časť mimo rozsahu. Pred pushom pull --rebase, explicitné vlastné súbory; Claude v tom istom repe spravuje správy/prieskumy.

Spoločné podmienky: zachovať koncept/ekonomiku/save v1; nové polia iba voliteľné a prísne validované readSave; žiadny reset starých uložení. Mobil375px bez overflow stránky, prst nad mapou posúva stránku. Fyzický telefón treba overiť s Petrom, emulácia ho nenahrádza. Reduced-motion bez animácií; IntersectionObserver + visibilitychange pozastavia pohyb; lenivé ťažké obrázky. Žiadny Math.random pri kreslení, seed+dátum+hodina. Pred odovzdaním verify-republic/festival/journey/data + tsc + eslint + build.

## 1 — Živá štvrť

Napojené domy → napojené destinácie, chodci iba network(state) vrátane námestia. Ráno: školáci pracovné dni, dospelí dielňa/trh/stanica, seniori ambulancia/park. Popoludnie park/záhrada/knižnica; večer kultúrny dom/námestie; noc nanajvýš venčenie psa. Najviac približne14 chodcov, podľa napojených domov. Na mieste deti v parku, záhradkári, debata pri fontáne, nakupujúci.

Skutočný Europe/Bratislava vrátane DST25.10.2026. NOAA slnko48.149N17.108E, referencia timeanddate ±5min, plynulý súmrak, nočné okná. Jeseň lístie najmä koncom októbra; niektoré zimné dni sneh; jar kvety; leto svetlušky pri súmraku. Chodci pod budovami alebo depth x+y; dieťa/dospelý/senior/pes po2–3 fázach. Testy trás/determinizmu/noci/DST.

## 2 — Slávnosť a pohľadnica

Po festival-response krátka scéna podľa témy čítanie/piknik/hudba, lampióny a dav podľa happy z festivalResult; pred otvorením pár zvedavcov. PNG1080×1350: mapa s davom, názov štvrte, slávnosť/dátum, hviezdy, reakcie Evy/Milana/Niny, adresa webu. Vzor components/story-image.ts. SVG naklonovať, image inline dataURL, input vrstvu odstrániť, document.fonts.ready; navigator.share so súborom, fallbackdownload.

## 3 — Návšteva suseda bez servera/účtov

URL ?v=game&g=republic&navsteva=kód; base64url a celý odkaz <300znakov. Kód: verzia,36políčok empty/road/object+variant, UTF8názov ≤40znakov, branch haly, počet dokončených krokov, checksum. Prísny nedôveryhodný vstup a readSave(decoded) alebo „Odkaz je poškodený“. View readonly, žiadne príkazy/localStorage zápisy, jasne „Štvrť od suseda“; „Postaviť si vlastnú“ a „Späť do mojej štvrte“, vlastný save nedotknutý. instanceId vybrať podľa mapového hash(instanceId)%3. Test roundtrip rôznych štvrtí, diakritika, zlý/dlhý kód, zamknuté budovy.

## 4 — Fiktívne komunálne voľby24.10.2026

Pred implementáciou overiť oficiálny dátum a aktuálny zákon180/2014Z.z. Fiktívna Eva/Milan/Nina na starostu;6kandidátov zastupiteľstva (2+2 z dvoch vymyslených strán,2nezávislí), volia sa3poslanci v1obvode. Voliči z domov, účasť/preferencie podľa napojených služieb a slávností, deterministic.

Hráč sám vyplní lístky, platnosť s vysvetlením. §182(4) najviac3poslanci/1starosta; §184 nikto alebo priveľa = neplatný, viac rovnakých lístkov v obálke = všetky neplatné; §189 najviac platných hlasov, pri rovnakej strane kandidátne poradie, pri rôznych/nezávislých zaznamenaný deterministický žreb, starostovská rovnosť nové voľby; §192(1) náhradník z najlepších nezvolených, obdobné riešenie rovnosti. Pred dátumom odpočet+ako voliť; v deň hlasovanie+dávková volebná noc; potom výsledky/náhradníci/vysvetlenia s paragrafovými odkazmi. Testy všetkých neplatností, rovností/žrebu/nových volieb/súčtov.

**Termín podľa Petra: štvrté rozšírenie musí byť hotové a po jeho schválení nasadené pred24.10. Žiadne naplánované automatické nasadenie ani účty nie sú autorizované týmto kontraktom.**
