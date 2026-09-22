# Vizuálne a interakčné zadanie

Stav: návrh pre novú hru v existujúcom svete Mandátu. Používateľ delegoval spracovanie prijatého konceptu. Toto nie je nová identita celého webu ani potvrdený obrazový mockup. Nemení nadradené dizajnové súbory.

## Smer

Malé živé stredoeurópske mestečko ako precízna stolová dioráma. **Mapa je hrateľný objekt, nie pozadie formulára.** Minimum ovládacích plôch; jedna aktuálna úloha a dve malé počítadlá. Návštevník najprv uvidí vlastnú štvrť, potom možnosti, čo s ňou urobiť. Režim Experience na mape, Operate pri stavbe a ukladaní.

Zdedené: IBM Plex Sans, teplý papier `--mag-paper:#f5f4ee`, tmavozelený text `--mag-ink:#20392f`, povrchy `#fffefa`, akcent `--mag-lime:#dcf59b`, zelené ovládanie `#245c48`. Referencia je skutočná Herňa a `app/magazine.css`, nie historické modré tokeny v globals.css.

Scéna: slonovinové fasády, terakotové strechy, tlmená šalviová zeleň, pieskové chodníky, pár vínových/medených detailov. Smer svetla zľava hore, konzistentné jemné tiene. Žiadne stranícke farby ako herné hodnotenie. Výnimočnosť epickej karty ukáže architektúra a drobný detail, nie neónová žiara.

## Kompozícia

Mobil 390 × 844 (overiť aj 360 px):

```
← Herňa                 Uložené v zariadení
Malá republika          [pomoc]
Lipová štvrť       20 mince · 12 materiál
┌──────────────────────────────────────┐
│                                      │
│        HRATEĽNÁ DIORÁMA               │
│        mapa 6 × 6                     │
│                                      │
│  [−] [100 %] [+]          [centrovať]  │
└──────────────────────────────────────┘
Eva · Školský dvor             krok 1/7
Nájdime pri škole kúsok zelene.
[Zobraziť cieľ]
[Stavať]     [Zásielka · 1]     [Zbierka]
```

- Mapa približne 310–360 px vysoká na úzkom mobile, podľa priestoru. Žiadne ďalšie obrovské hero. Pod mapou krátky projektový pás; tri hlavné akcie v dosahu palca. Navigáciu Mandátu nemeníme.
- Na desktope max šírka herného plátna približne 1120 px; mapa vľavo, napravo 280–320 px úloha + inventár. Nepoužiť plnú šírku monitora pre 6 políčok ani rozťahané počítadlá.
- Mapu možno posúvať v samostatnom výreze a zväčšiť. Samotná stránka sa posúva ďalej. Pan režim nesmie brániť bežnému scrollu mimo mapy. Zväčšenie má aj tlačidlá, nie iba pinch.
- Karty budov v spodnom paneli: obrázok, názov, cena a vlastníctvo. Rozbalený panel nesmie prekryť celý zvolený cieľ na mape. Žiadne vnorovanie troch modalov.
- Na mobile jasný prepínač Mapa / Zoznam. Zoznam obsahuje tie isté budovy a ich stav, umožňuje zvoliť cieľové súradnice. Nie je to len statické vysvetlenie.

## Hrateľné vrstvy a grafické podklady

Preferované vykresľovanie v1: **SVG scéna + samostatné izometrické sprity budov, HTML ovládanie okolo**, bez WebGL/Three/Pixi. Transformácia dlaždice x,y → obrazovka: cx=originX+(x-y)*tileW/2, cy=originY+(x+y)*tileH/2. Príklad tileW=96, tileH=48; viewBox, nie pevná šírka stránky. Budovy kotviť pätičkou na stred dlaždice. Poradie podľa x+y, pri zhode podľa x. Nepridávať objekt len preto, že je pekný: musí zodpovedať stavu.

Mapa má samostatnú priehľadnú vstupnú vrstvu políčok nad dekoratívnym umením. Vyššia budova nesmie zachytávať klik patriaci susednej dlaždici. V režime umiestňovania zvýrazniť voľné/obsadené miesta aj symbolom. Minimum 44 × 44 CSS px pre aktívny cieľ: ak pri oddialení dlaždice nespĺňajú cieľ, najprv priblížiť oblasť; alternatívou je vždy zoznam. Nepredstierať 44 px iba vo viewBox jednotkách.

`public/images/games/town-seasons-v2.webp` je referencia materiálu a kvality; obsahuje celé mesto a **nie je atlas samostatných budov**. Nepoužiť ho ako hernú mapu s prekrývajúcimi sa ikonami. Nie je nutné znovu generovať štyri ročné obdobia ani 3D modely.

Minimálna sada: radnica, tri drobne odlišné domy, škola, knižnica, ambulancia, park/záhrada, tržnica, dielňa, stanica v pôvodnom stave + 3 finálne varianty. Kultúrny dom môže zdieľať siluetu knižnice s odlišnými detailmi. Dekorácie môžu byť konzistentné kódové SVG. Žiadne emoji ako finálne stavby; nesmú všetky vyzerať ako rovnaký kváder s iným piktogramom.

Ak Terra použije ImageGen: najprv jediná skúšobná sada 4 kľúčových objektov (dom, škola, stanica, park), vizuálne skontrolovať perspektívu a priehľadnosť, až potom doplniť zvyšok. Nezávislé objekty s dostatočným priestorom na orez, bez generovaného textu, ľudí vo veľkosti budovy a bez nakreslenej UI. Overiť skutočný alpha kanál: šachovnica namaľovaná do obrázka nie je priehľadnosť. Ak výsledok nemožno čistým spôsobom rozdeliť, nepridať ho len preto, aby sa minula generácia. Uchovať presný prompt, pôvod a použité súbory. Zdroj mimo public, komprimované výsledky v `public/images/games/republic/`.

Vzor promptu (návrh, **zatiaľ nepoužitý**):

> Create four isolated miniature Central European town building assets: a modest cream townhouse with terracotta roof, a small school, a weathered railway station, and a compact park. Consistent orthographic isometric camera, identical scale, soft light from upper left, tactile matte painted miniature materials, warm ivory plaster, muted sage trees, fine believable architectural details. Each object has its own generous transparent area with no overlap and a flat ground contact point, no scenery behind the objects, no text, no UI, no outlines, no watermark. They must look like pieces from one carefully made physical tabletop town, readable at mobile scale. Use the reference only for material and craft, not its whole-town composition.

Cieľový rozpočet: lazy načítanie hry, prvá sada obrázkov približne do 1,5 MB, ďalšie pri otvorení zbierky. To je akceptačný cieľ na overenie, nie tvrdenie o hotových súboroch. Pri absencii použiteľných obrázkov vytvoriť kvalitnú vrstvenú SVG sadu a otvorene označiť obrazové sprity ako nedokončené; neskrývať to za tvrdenie o hotovom vizuále.

## Interakčný detail

- Po výbere stavby sa zvýraznia jej dosah a cestné napojenie. Náhľad pred potvrdením: „Zapojená · pomôže 2 domom · 7 mincí, 4 materiály“. Nedostupná cena je text, nie len sivá farba.
- Pri úspešnej kombinácii krátko zvýrazniť prepojené miesta a zobraziť názov. Žiadne neustále pulzovanie, konfety alebo prázdny loading spinner po lokálnom výpočte.
- Zásielka: malá obálka/plochý drevený balíček, otvorenie 250–400 ms, tri rovnocenné karty, potvrdenie. Vzácnosť slovom a symbolom. Šance a pravidlo duplikátov cez Pomoc. Animáciu možno preskočiť.
- Finále: mesto ostáva v pozadí a otvorí sa skromná pohľadnica s názvom štvrte a zvolenou podobou stanice. Zdieľanie len používateľským klikom; v1 stačí obrázok/názov bez verejného profilu, ak export nie je hotový, tlačidlo nepridať.
- Znížený pohyb: žiadne automatické panorámovanie/zoom, žiadne nekonečné animácie, priamo konečné stavy. Nepoužiť náhodné častice ako výplň.
- Text stavov: „Ukladám…“, „Uložené“, „Bez pripojenia — mesto je zatiaľ iba na čítanie“, „Uloženie sa nepodarilo. Skúsiť znova“. Stav účtu nesmie tvrdiť cloudové uloženie pred potvrdením servera.
- Klávesnica: roving focus po políčkach šípkami, Enter výber/potvrdenie, Escape zrušenie náhľadu. Fokus po modale späť na vyvolávajúci prvok. Oznamovať potvrdené zmeny, nie každý prechod myši. Základný kontrast textu 4,5:1, fokus viditeľný.

## Čo má Terra ukázať pri odovzdaní

Jeden desktop a jeden mobil s reálnym stavom: rozostavaná mapa, náhľad stavby, výber zásielky a splnený projekt. Ukázať aj chybu uloženia. Jedna spoločná kontrola, jedna séria opráv a jedno potvrdenie výsledku; ďalšie leštenie len pri konkrétnom nevyriešenom probléme. Bez screenshotov nevyhlásiť vizuál a mobil za overené.
