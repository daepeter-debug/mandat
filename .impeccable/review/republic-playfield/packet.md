# Mobilný herný plán — kontrolný kontrakt

Peter žiada voliteľné rozšírenie existujúcej mapy na celú mobilnú obrazovku. Spúšťač má byť pri zoome pod mapou. Vľavo úlohy a stavby, legenda, prehľadné ovládanie a možnosť návratu do dnešného režimu.

Obyčajná nadstavba zdedeného sveta: stolová dioráma, existujúce RepublicArt a terén, IBM Plex Sans, papier #fffaf0, atrament #20392f, zelené ovládanie #245c48. Žiadna nová identita, nové ilustrácie, ekonomika ani uložené polia. Používa sa tá istá pripojená mapa a rozpracovaný ťah.

Celá dostupná plocha prehliadača (100dvh), nie systémové Fullscreen API. Zbaliteľný ľavý panel Úlohy/Legenda, počítadlá hore, stavanie/cesty/zásielka/zbierka dole, detail budovy a potvrdenie stavby nad mapou. Bežný režim ostáva zachovaný. Nie je tu nové odsúhlasené obrazové kompozičné zadanie ani samostatná QUALITY BAR karta.

Povinné dôkazy: mobile.png (375×844), mobile-map.png, mobile-legend.png, mobile-detail.png, mobile-build.png, landscape.png (844×390), desktop.png (1280×900), desktop-normal.png. Doplnkové: mobile-normal.png, mobile-parcel.png. Captures sú overené; skorý neplatný záber mobile-first.png sa nehodnotí a neodovzdáva.

Funkčne overené: zoom, skladanie panelu, legenda, škola a jej účinky, úloha → knižnica → C4 → cena/potvrdenie → zrušenie bez výdavku, zásielka a klávesnicový fokus. Výsledky kontroly a opráv sú v review.md/verdict.md. Fyzický telefón a Safari neboli dostupné.

Zdedené systémové súbory sú v koreni workspace: PRODUCT.md, DESIGN.md, .impeccable/design.json; lokálny kontrakt v docs/mala-republika/DESIGN.md. Detektor spustený raz s prázdnym výsledkom. Herné CSS vyňaté zo build-dark cez SKIP_FILES.
