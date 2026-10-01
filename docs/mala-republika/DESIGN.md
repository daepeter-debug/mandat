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

## Revízia úvodu 30. 9. 2026

Prvé dve úlohy používajú zjednodušený herný pohľad: jedna požiadavka učiteľky Evy a skutočná mapa. Na desktope je zadanie v ľavom stĺpci širokom 340 px, mapa vpravo; pod 960 px je zadanie nad mapou. Nový hráč najprv vyberie park alebo záhradu, potom dostane označené vhodné políčka a potvrdenie ceny. Druhá úloha učí presúvať budovy zadarmo a uvoľniť miesto pri škole pre knižnicu. Po každom kroku sa zobrazí reakcia a odmena. Pôvodná dioráma a ilustrácie sa používajú ďalej.

Voľba „Chcem objavovať sám“ sprístupní všetky bežné nástroje; návrat k Eve je dostupný do dokončenia druhého kroku. Sprievodca vychádza z uloženého postupu, nevytvára nový save formát. Prvé dve odmeny možno získať počas jednej návštevy. Neskoršie denné stretnutia a rozšírenie príbehu sú ďalšia etapa, nie hotová súčasť tohto prototypu.

## Denná slávnosť 1. 10. 2026

Denná slávnosť pridaná 1. 10. používa tú istú vizuálnu rodinu: teplý podklad, zelené akcenty, ilustrovaná stolová mapa. Nad rozhodnutiami je vždy cieľ, rozpočet, päť krokov a aktuálna spokojnosť troch susedov; čísla sú doplnené textom a progressbarmi. Na desktope sú rozhodnutia vedľa mapy, pod 800 px v jednom stĺpci. Výber miesta posunie pohľad k potvrdeniu, výber zázemia k mape, uložený krok späť k zadaniu. Zoznam miest poskytuje alternatívu ku grafickej mape. Mestské zdroje sú počas udalosti skryté, aby sa neplietli s prípravnými bodmi. Finále ukáže splnené aj chýbajúce ciele, reakcie susedov a slávnostnú vrstvu mapy. Krátke objavenie vlajočiek rešpektuje reduced-motion. Náhľady: `previews/festival-start-desktop.png`, `previews/festival-desktop.png`, `previews/festival-mobile.png`.

### Plynulé pokračovanie do príbehu

Príbeh má kompaktnú sedemdňovú os, text aktuálneho suseda a malý náhľad slávnostnej brány. Os ukazuje dokončené dni aj slovom pre asistívne technológie, aktuálny deň cez `aria-current`; zamknuté dni sa netvária ako klikateľné tlačidlá. Na mobile je odmena pod osou, na desktope napravo. Existujúca dioráma a paleta sa zachovali.

Po úspechu je hlavná akcia „Prejsť na deň …“ s názvom nasledujúcej úlohy; po siedmom „Prevziať slávnostnú bránu“ a následne jej umiestnenie do skutočnej štvrte. Posun otvorí hlavičku nového dňa, aby hráč videl nové zadanie. Bežné prípravné kroky vracajú pohľad k rozhodnutiu. Na mobile majú hlavné akcie plnú šírku a aspoň 44 px. Názvy a dostupné body zodpovedajú uloženému hernému dňu, nezavádzajú hráča tvrdením o posune skutočného kalendára. Náhľady: `previews/journey-desktop.png`, `previews/journey-mobile.png`.

### Ilustrované privítanie 1. 10. 2026

Karta Malá republika v Herni a prvé privítanie používajú nový obrázok `public/images/games/republic-cover-v2.webp`: jednu súvislú, detailnú miniatúrnu štvrť s krémovými fasádami, terakotovými strechami, starou stanicou, zeleňou a potokom v teplom svetle. Materiál a remeselný charakter nadväzujú na `town-seasons-v2.webp` z Do decembra; štyri sezónne panely sa nepreberajú. Je to atmosférická ilustrácia pred prvou úlohou. Po začatí pomoci Eve alebo voľbe samostatného objavovania ju nahradí skutočná hrateľná mapa; ilustrácia nemení uložené mesto.

Na desktope má privítanie text vľavo a obraz vpravo v pomere 0,85 : 1,15. Pri šírke do 760 px je obraz nad textom, vysoký `clamp(185px, 48vw, 290px)`. Orez používa `object-fit: cover`, v privítaní s ohniskom 57 % / 50 %. Spoločný obrazový komponent ponúka varianty 1440 × 960 a 720 × 480 cez `srcset`; úvod ich načítava prioritne, karta odložene. Prázdny alternatívny text zodpovedá dekoratívnej úlohe obrazu pri samostatnom nadpise a akciách. Existujúca typografia, zelené ovládanie a herné sprity pokračujú bez nového systému tokenov. Presný použitý prompt je v `research/republic-cover-v2.prompt.txt`, obrazové metadáta sú v JSON súboroch pri oboch WebP variantoch.

### Súvislá hrateľná krajina 1. 10. 2026

Skutočná mapa používa nový terén `public/images/games/republic-terrain-v1.webp`: súvislú trávnatú čistinu orámovanú stromami, kvetmi a potokom. Obrázok obsahuje iba krajinu. Domy, verejné budovy, cesty a slávnostné prvky zostávajú samostatnou SVG vrstvou odvodenou z uloženého mesta; pri stavbe a presune sa mení táto vrstva. Krémové fasády, terakotové strechy, šalviová zeleň a svetlo zľava hore pokračujú v existujúcom remeselnom smere. Terén sa načíta až pri priblížení mapy do výrezu; pri chybe ostáva čitateľný zelený podklad a hrateľné objekty.

V pokojnom pohľade je mriežka skrytá. Hráč ju môže zapnúť, pri výbere miesta sa zobrazí automaticky spolu so symbolmi voľných, obsadených a odporúčaných pozemkov. Kompaktná hlavička ukazuje názov štvrte a súradnicu alebo názov skúmaného miesta. Štyri ovládacie tlačidlá pod mapou majú 44 × 44 CSS px; zoznam miest zostáva alternatívou k mape. Mobil umožňuje horizontálny posun priblíženej mapy a bežné vertikálne posúvanie stránky. Automatické centrovanie po zmene mierky alebo režimu je okamžité.

Rozšírenie nemení nadradený `DESIGN.md` ani `.impeccable/design.json`. Zdroj promptu je `research/republic-terrain-v1.prompt.txt`, metadáta sú pri WebP. Aktuálne desktopové a mobilné náhľady sú v `.impeccable/review/republic-terrain/desktop.png` a `mobile.png`; kontrola na fyzickom telefóne ostáva nevykonaná.

### Živá štvrť 1. 10. 2026

Obyvatelia dopĺňajú existujúcu krémovú, terakotovú a šalviovú diorámu. Priehľadný atlas `public/images/games/republic/residents-v1.webp` má tri rámce pre dieťa, dospelého, seniora a psa; malé postavy kráčajú iba po súvislej napojenej cestnej sieti medzi domami a dostupnými cieľmi. Najviac je 14 chodcov, v noci najviac jeden dospelý so psom. Pri parku, záhrade, trhu a námestí sú podľa dennej doby stacionárne činnosti; chýbajúce napojenie nevytvára predstieranú cestu.

Predvolená scéna sleduje skutočný čas `Europe/Bratislava` vrátane letného času. Plynulé svetlo používa približný výpočet východu a západu podľa NOAA pre Bratislavu; v noci scénu tlmí modrosivá vrstva a vybrané okná zostávajú teplé. Ročné obdobie určuje kalendár: jarné kvety, letné večerné svetlušky, jesenné lístie a občasný zimný sneh sú dekorácia, nie predpoveď počasia. Rozbaliteľný pás „Živá štvrť“ má 44 px vysoké ovládanie; voliteľný výber dennej doby premení názov na „Náhľad scény“ a vysvetlí, že mení iba vzhľad.

Vrstva sa aktivuje až pri viditeľnej mape, pozastavuje pohyb pri skrytej karte a rešpektuje znížený pohyb statickými postavami a efektmi. Dekorácie nepreberajú kliky ani fokus a nemenia ekonomiku, príkazy alebo formát uloženia. Implementácia je v `lib/republic-living.ts`, `components/republic-living.tsx`, `components/republic-map.tsx` a `app/republic-game.css`. Denné a nočné náhľady sú v `.impeccable/review/republic-living/desktop.png`, `desktop-night.png`, `mobile.png` a `mobile-night.png`. Pri kontrole šírky 375 px po odsunutí mapy mimo výrez (`mapBottom = −251,78 px`) nezostali vykreslené žiadne postavy. Kontrola na fyzickom telefóne a ručné prepínanie zníženého pohybu a skrytej karty ostávajú nevykonané. Nadradené dizajnové súbory sa nemenia.

### Otvorenie slávnosti a pohľadnica 1. 10. 2026

Finále pokračuje v existujúcej miniatúrnej štvrti: teplý krémový papier, terakotové strechy, šalviová zeleň, IBM Plex Sans a zelené ovládanie. Používa pôvodné budovy, terén a atlas `public/images/games/republic/residents-v1.webp`; nepridáva nový obrazový ani tokenový systém. Dekorácie zostávajú lokálnou prezentačnou vrstvou bez zásahu do ekonomiky, odmien, príkazov či formátu uloženia.

Po potvrdení riešenia udalosti sa rozsvietia lampióny a postupne prídu hostia. Čítanie dopĺňajú otvorené knihy, piknik malé taniere a hudbu krátky tanec. Počet hostí vychádza zo skutočného výsledku: 4 + 5 za každého spokojného suseda, najviac štyri miesta na každom dostupnom napojenom cestnom políčku do vzdialenosti troch polí od programu. Hostia neobsadzujú budovy ani predstierané cesty. Otvorenie trvá najviac 24 sekúnd; potom ostáva pokojná konečná scéna. „Prehrať scénu“ umožní vedomé opakovanie, znovuotvorenie dokončenej slávnosti alebo načítanie uloženého mesta začína konečným stavom.

Na desktope zostáva mapa vedľa výsledkov. Do 800 px sa dokončená mapa presunie pred výsledky a po potvrdení udalosti sa zobrazí jej začiatok, aby hráč najprv videl slávnosť. Tlačidlá prehratia, vytvorenia, zdieľania a stiahnutia pohľadnice majú minimálne 44 px na výšku. Výsledky, chýbajúce ciele a reakcie susedov zostávajú čitateľnou súčasťou finále.

Potok oživujú tri jemné prerušované prúdy pod cestami, budovami a vstupnou vrstvou; dekorácia nepreberá kliky ani fokus. Využíva existujúci odložene načítaný terén a spoločnú kontrolu viditeľnosti mapy. Pri odsunutí mapy mimo výrez alebo skrytej karte sa pohyb zastaví. Znížený pohyb zobrazí konečnú slávnosť a statickú rieku; rovnaká ochrana vypína aj prechody a ostatné animácie hernej plochy.

„Vytvoriť pohľadnicu“ pripraví PNG 1080 × 1350 zo skutočného dokončeného pokusu: názov štvrte, program, dátum, získané hviezdy, mapa a odkazy troch susedov. Export pracuje s klonom SVG, vloží použité lokálne obrázky, počká na fonty, zachová vypočítané styly a odstráni vstupnú vrstvu, mriežku aj výberové značky. Animácie v klone sú zastavené; hrateľná mapa ostáva samostatná. Najprv sa zobrazí náhľad, až ďalší používateľský klik otvorí podporované natívne zdieľanie súboru. Pri nepodporovanom zdieľaní alebo jeho chybe nasleduje stiahnutie PNG; zrušenie natívneho dialógu nespúšťa náhradné stiahnutie. Samostatné tlačidlo „Stiahnuť PNG“ ostáva dostupné. Príprava, chyba a hotový obrázok majú textový stav.

Záverečná kontrola prijala rozšírenie na odovzdanie po overení dvoch opráv pohybu: časovanie vždy publikuje konečný rámec 24 sekúnd a výslovné prehratie funguje aj po prepnutí zo zoznamu Miesta späť na mapu. Desktop, mobilné finále a pripravená pohľadnica sú zachytené v `previews/celebration-desktop.png`, `previews/celebration-mobile.png` a `previews/celebration-postcard-mobile.png`. Skutočný natívny dialóg zdieľania súboru, dokončené stiahnutie a posúvanie prstom na fyzickom telefóne ostávajú neoverené. Rozšírenie zachováva nadradené `DESIGN.md`, `PRODUCT.md` a `.impeccable/design.json`; tento dodatok opisuje iba prijaté lokálne správanie.

### Susedské želania, voľby a návšteva 1. 10. 2026

Rozšírenie používa existujúci krémový papier, šalviové povrchy, terakotové stavby, zelené ovládanie a IBM Plex Sans. Malé medailóny želaní pre zeleň, ambulanciu, školu a trh preberajú skutočné ilustrácie budov; cesta je kreslená v rovnakej miniatúrnej geometrii. Želanie je aj súčasťou prístupného názvu políčka. Volebná miestnosť `public/images/games/republic/election-room-v1.webp` ukazuje plentu, drevenú urnu a lístok s krúžkami. Pri sčítaní tvorí scénu vedľa tmavozeleného textového poľa; pod 560 px sú obraz, text a prehľad hlasov pod sebou. Počty obálok, účasť, hlasy a tri mandáty zostávajú výslovné. Výsledok začína menom starostu a skúšobné hlasovanie označuje bežná veta.

Spoločný prehľad projektu, slávností a spokojnosti susedí na desktope s konkrétnym ďalším krokom, cenou alebo odmenou. Na úzkom mobile sa skladá zvislo a hlavná akcia má plnú šírku. V sústredenom pohľade do 800 px zostávajú hlavné ovládacie tlačidlá pri spodnom okraji s priestorom pre bezpečnú oblasť a výškou najmenej 58 px. Návšteva cez krátky kontrolovaný odkaz zobrazuje skutočnú štvrť iba na prezeranie a jasný návrat do vlastnej; nemontuje ukladanie, volebný panel ani herné príkazy.

Šesť finálnych desktopových a mobilných zachytení je v `.impeccable/review/republic-neighbours/`; `verdict.md` prijal opravu označenia skúšobného výsledku. Fyzické posúvanie prstom a natívne zdieľanie ostávajú neoverené. Návrh ekonomiky a pamäti postáv v `GAME.md` nie je implementovaný. Toto je lokálny dodatok, ktorý nemení nadradený dizajnový systém ani jeho tokeny.

### Detail po kliknutí namiesto štítkov — 1. 10. 2026

Petrov pokyn nahrádza trvalé názvy a kategóriové krúžky na mape. Pokojná dioráma má iba budovy, priania domov a malú značku nenapojenia. Názov, skutočná ilustrácia RepublicArt, účinky, potreby a adresné rady sú v detaile po kliknutí. Od 960 px je to kompaktný papierový panel pri opačnom okraji mapy; na úzkej obrazovke nadväzuje pod mapou, nepreberá jej dotykovú plochu. Dosah a pomáhané budovy sa zvýraznia len pri výbere. Súvisiace úlohy sú rozbaliteľné. Opakovaný klik, X alebo Escape detail zavrú; zatvorenie z panelu vráti fokus na políčko. Nová interakcia nepridáva animácie a automatický posun rešpektuje reduced-motion. Mobilné a desktopové dôkazy sú v `.impeccable/review/republic-inspector/`. Nadradená identita a herná ekonomika sa nemenia.
