# Mandát

Mandát je nezávislý prehľad slovenskej politiky: prieskumy, ich agregovaný model, strany, programy, parlament, správy a súvisiace vysvetlenia. Peter ho zatiaľ prevádzkuje ako hobby a testovací web, bez reklamy a bez uprednostňovania strán. Údaje a tvrdenia majú dohľadateľné zdroje; neistota modelu musí zostať viditeľná. Tieto rozhodnutia pochádzajú zo zadania používateľa.

## Schválené mobilné rozšírenie, 9. október 2026

Používateľ schválil celý balík šiestich vylepšení z `../PROMPT-codex-mobil-wow.md` (v hlavnom checkoute):

1. Správy jedného dňa ako príbeh „Deň za 30 sekúnd“, s pôvodným poradím, zdrojmi, detailmi a zdieľaním.
2. Kompaktný polkruh 150 kresiel pri titulku vydania, z rovnakého modelu a blokov ako titulok.
3. Miniatúry skutočných hlasovaní po poslancoch, načítané až pri zobrazení.
4. Dátové ilustrácie rozcestníka „Ďalej na webe“.
5. Voliteľné zoradenie strán podľa podpory, drobné trendy a farebné profily s pásmom neistoty.
6. Čitateľný orientačný odpočet, zmeny podpory za 30 dní a spoločný počet hier.

## Existujúci vzhľad a hranice

10. októbra 2026 používateľ doplnil zadanie: v úvode viditeľne vysvetliť Model Mandát a uviesť najnovšie prieskumy s prelinkami, s dôrazom na grafiku namiesto dlhého textu. Súčasťou je priama skratka z titulku, graf úbytku váhy v čase, východiskové váhy vstupov a odkazy na meranie i pôvodný zdroj.

Následne schválil zvýraznenie najnovšieho prieskumu v pohyblivom páse a samostatný výber ďalších grafických úprav na webe. Rozšírenie zahŕňa podfarbenie najnovšieho známeho dátumu publikácie, graf neistoty oproti hranici 5 % v profiloch, vydavateľa pri správach a porovnanie príjmov/výdavkov verejnej správy za posledné dva dostupné roky. Ide o zobrazenie existujúcich údajov.

Ďalší schválený balík dopĺňa logá a hodnoty pri koncoch trendových kriviek, spoločný ukazovateľ s prehľadom hodnôt a dotykovým podržaním dátumu; zobrazenie účasti vo vláde na časovej osi v existujúcom detaile; ikonami označené témy a zarovnané zdroje programov; a chronologický výber starších správ z archívu v detaile správy. Koncové popisky patria poslednému bodu, prehľad pod grafom zvolenému dátumu. Mobilné skratky majú plné názvy pod grafom. Časová os vlády končí dátumom kontroly existujúcich údajov (13. 9. 2026). Archív správ vyhľadáva explicitné osoby/témy v titulkoch a nevyvodzuje príčinné súvislosti. Vznik strán ani nové historické tvrdenia sa bez ďalších overených podkladov nepridávajú.

Rozšírenie zachováva redakčný vzhľad existujúceho webu: IBM Plex Sans, krémové a zelené plochy, zodpovedajúci tmavý režim, typografickú hierarchiu a navigáciu. Farby strán a hlasov vychádzajú z existujúcich dát. Nejde o nový dizajn celého webu.

Výsledok nemení zdrojové politické údaje, výpočty modelu, GLB scény, ekonomiku hier ani nasadzovaciu konfiguráciu. Správy používajú skrátený súvislý úryvok overeného textu. Septembrový horizont volieb 2027 je orientačný; presný deň sa neprezentuje ako potvrdený.

## Použitie a overenie

10. októbra používateľ požiadal o rolovací výber hlasovaní priamo v rohu 3D sály na mobile na šírku. Výber patrí do fullscreen plochy a prepína existujúce hlasovania bez odchodu zo sály alebo posúvania stránky. Má vyhľadávanie podľa názvu/dátumu, filter druhu, viditeľné označenie zvoleného hlasovania a po výbere sa zbalí. Dostupný je aj v ručne otvorenej fullscreen sále na počítači. Politické údaje a scéna sa nemenia.

10. októbra používateľ schválil dve ďalšie vizualizácie v úvode: vplyv najnovšieho merania na model a porovnanie agentúr. Prvý panel porovnáva rovnaký dátum výpočtu s najnovšími známymi publikovanými vstupmi a bez nich (všetky publikované v rovnaký posledný deň spolu); staršie meranie rovnakej agentúry nastúpi len v pôvodnom 60-dňovom okne. Nie je to rekonštrukcia historického publikovaného modelu. Posuny podpory aj kresiel vychádzajú z pôvodných funkcií, nulové zmeny sa priznávajú. Druhý panel zobrazuje presné zverejnené hodnoty aktuálnych vstupov, dátumy zberu, zdroje a model; prispôsobená os má viditeľné hranice. Chýbajúce hodnoty nie sú nuly, rozdiel medzi agentúrami nie je známka kvality ani pásmo chyby.

Mobil má prednosť: šírky 375 a 402 px, žiadne vodorovné pretekanie, dotykové ciele aspoň 40 px a podpora obmedzeného pohybu. SVG, CSS a canvas dopĺňajú existujúce komponenty bez ďalšej ťažkej knižnice; obsah mimo prvého pohľadu sa načítava lenivo. Zachovávajú sa klávesnica, čítačky, URL stav aj existujúce ovládanie spodnej lišty.

Kontroly zahŕňajú TypeScript, ESLint, všetky dátové overovacie skripty, konzistenciu tmavého režimu, build a prehliadačové snímky v oboch režimoch pri troch šírkach. Overenie v emulovanom Chrome nenahrádza skúšku na fyzickom iPhone v Safari; tá zatiaľ neprebehla.

Pracovný predpoklad, nie výskum publika: návštevník chce rýchlo pochopiť aktuálne slovenské politické údaje a podľa potreby otvoriť podrobnosti.

## Schválené vizuálne objavovanie, 10. október 2026

Používateľ schválil všetkých päť aktuálnych grafických návrhov a požiadal zapracovať aj predchádzajúce nápady. Výsledok rozširuje existujúci magazín:

1. Pod titulkom úvodu je kompaktný perspektívny vstup do parlamentu s odkazom `/parlament?sala=3d`. Používa existujúci render `public/models/chamber-clubs-2026-10-01.webp`, výslovne označený ako náhľad historických klubov k 1. 10. 2026. Nahrádza skorší kompaktný polkruh vydania; titulok aj 150-kreslový modelový scenár zostávajú. Na počítači je v ľavom úvode vedľa denných správ, na mobile sa obsah skladá pod seba. Živé 3D sa otvára až po vstupe a zostáva otvorené pri prepínaní režimu či hlasovania.
2. Pri trende sú udalosti z existujúceho zdrojovaného archívu politických správ. Výber označí presný dátum publikácie a pripne najbližší týždenný bod modelu. Dátum správy a dátum modelového bodu nie sú zamieňané; časová súvislosť sa neprezentuje ako príčina zmeny podpory.
3. Koaličné kartičky s autentickými logami umožňujú klik, klávesnicu a presun za samostatný úchyt vo volebnom laboratóriu aj v koaličnom režime 3D sály. Výber, farby kresiel a súčet čítajú rovnaký riadený stav; hranica väčšiny je 76 kresiel.
4. Financie obsahujú interaktívnu mriežku 100 € verejných výdavkov a zoznam presných súm. Mriežka zaokrúhľuje celé políčka, hodnoty ostávajú dostupné textom. Používa existujúce funkčné rozdelenie Eurostat COFOG za 2024 pre celú verejnú správu; nejde o konkrétnu osobnú daň ani plán štátneho rozpočtu na 2025.
5. Po serverom potvrdenom stave platby `paid` sa zobrazí značka Mandát s jemným pohybom rešpektujúcim obmedzený pohyb. Mobilný panel podpory využíva celú dostupnú šírku, aby sa neorezal.

Predchádzajúce rozšírenia zostávajú súčasťou produktu, s výslovnou náhradou polkruhu vydania v úvode uvedenou vyššie. Tento balík používa incumbentnú rodinu IBM Plex Sans, krémový papier, zelený atrament, existujúce logá a render; nevytvára nový vizuálny systém ani nové zdrojové politické či finančné tvrdenia.

Finálna kontrola implementátora: všetkých 27 overovacích skriptov prešlo dvakrát; TypeScript, ESLint, build a kontrola generovaného tmavého režimu prešli. Detektor v `.impeccable/review/visual-discovery-detector.json` vrátil `[]`. Nezávislý dokončovací reviewer odporučil odovzdať výsledok bez materiálnej opravy a prijal 13 snímok skutočných funkcií. Prehliadačová QA pokryla mobil 375/402 px, desktop 1280 px, oba motívy a zhodný koaličný súčet po kliknutí aj Enter. Snímky sú v `.impeccable/review/visual-discovery/`.

Po review sa doplnilo zachovanie lokálneho 3D stavu pri zmene URL režimu/hlasovania. Následný TypeScript, ESLint aj build prešli; pôvodné dátové overenia pred touto opravou sa týkajú nezmenených dát. CUA potvrdilo, že po vstupe s `sala=3d` a prepnutí na Hlasovania ostane 3D sála otvorená aj po zmiznutí vstupného parametra z URL; dôkaz je `desktop-3d-entry-vote.png`. Nasadené verejné správanie ešte nie je týmto lokálnym overením potvrdené.

Poďakovanie a rozmery platobného panela boli vizuálne overené pomocou fixture; skutočná platba ani nová Stripe session neboli vytvorené. Verejný stav `/api/podpora` bol iba prečítaný a uvádzal zapnutý live režim. Ťahanie na fyzickom telefóne v Safari zatiaľ nebolo odskúšané.

## Papierový pôdorys parlamentu, 10. október 2026

Používateľ odmietol rozsiahly tmavý blok okolo 2D sály a požiadal o zladenie s pozadím stránky a nasadenie. 2D teraz používa transparentnú plochu, jemne tónovaný pôdorys podľa aktuálneho motívu a počet 150 miest v strede. Náhľad 3D má obraz až po okraj a zelený pás ovládania. Geometria, farby klubov a hlasov, výber poslanca a výsledky zostávajú pôvodné; večerná 3D scéna má vlastnú paletu vrátane načítavacej zálohy. Nové obrázky ani knižnice sa nepridávajú.

Kontrola implementátora: šírky 375, 402, 1280 a pôvodných 1906 px, oba motívy, zvýraznenie klubu, výber Vladimíra Baláža a hlasovanie 58451. Bez vodorovného pretekania v kontrolovaných šírkach; konzola bez chýb. Snímky sú v `.impeccable/review/chamber-paper/`. Dokončovací review bol vykonaný v tom istom agente podľa inline kontraktu skillu, nie nezávislým overovateľom; disposition: ship. Existujúci dizajnový systém ostáva. Fyzický iPhone a Safari neboli týmto overením pokryté.

## Orientácia v 2D sále, 10. október 2026

Schválené pokračovanie pridáva označenia klubov pri oblúku a vizitku vybraného poslanca. Logá, farebné sektory, počty a poloha označení sa odvodzujú zo skutočne priradených 150 kresiel. Klik na označenie používa rovnaký stav zvýraznenia ako pôvodný zoznam klubov. Pri hlasovaní ostáva pôvodná legenda hlasov.

Po výbere kresla je na desktope pri ňom vizitka s menom, skutočným klubom, hlasom pri konkrétnom hlasovaní a tlačidlom do pôvodného profilu. Na mobile a tablete je pod mapou; ak by ostala pod spodnou navigáciou, stránka ju jemne odkryje. Pri obmedzenom pohybe je posun okamžitý. Zatvorenie a Escape rušia výber. Nezmenili sa gestá, politické údaje ani 3D scéna.

Malý index ôsmich fotografií v lib/deputy-portraits.json používa len existujúce licencované fotografie zo straníckych profilov. Autor, licencia a zdroj sú dostupné vo vizitke. Ostatní poslanci majú monogram; bez automatického preberania fotografií z NR SR. Test kontroluje totožnosť oficiálneho ID, mena, pôvodnej licencie a súboru fotografie.

Lokálne overenie: 28 verify skriptov, TypeScript, ESLint, build-dark --check a build prešli. Prehliadačová kontrola pokryla šírky 375/402/900/1280 px, oba motívy, klub cez klik a Enter, Escape, monogram aj fotografiu, skratku do profilu a skutočné hlasovanie 58451. Bez vodorovného pretekania v kontrolovaných šírkach. Snímky: .impeccable/review/chamber-details/. Dokončovací review je inline kontrolou implementátora, nie nezávislým overením; disposition: ship. Fyzický telefón/Safari nebol dostupný.

## Redakčné profily a hlasovacia stopa, 10. október 2026

Peter schválil body 2 a 3: grafické profily strán a interaktívnu hlasovaciu stopu poslanca. Porovnávanie dvoch hlasovaní nepatrí do tohto rozšírenia.

Profily používajú autentické logo, jemnú farbu strany a väčšie existujúce licencované fotografie. Viditeľná história vlády stále končí dátumom kontroly podkladov 13. 9. 2026, nie dnešným dňom. Osobnosti nasledujú po zameraní a histórii vlády, pred financiami a meraniami. Aktuálne návrhy majú vlastný priestor; archív volieb 2023 je oddelený, bez premenovania na aktuálny program. Chýbajúce overenie nového dokumentu neznamená, že ho strana nemá.

Mozaika zobrazuje existujúce záverečné hlasovania, najviac 42 na stránku, chronologicky v zobrazenom výreze. Roky, stránkovanie, dátumy a detaily vychádzajú z oficiálnych ID v archíve. Nečlenstvo sa nezamieňa s neprítomnosťou; rozdiel oproti klubu používa pôvodnú definíciu. Výber políčka ukáže skutočný hlas, názov a priamy zdroj NR SR, samostatné tlačidlo otvorí hlasovanie v pôvodnej sále. Farby nie sú hodnotením poslanca ani vysvetlením jeho motivácie.

Systém ostáva: IBM Plex Sans; krémový papier a zelený atrament; autentické farby strán a hlasov; pôvodná navigácia a URL; jemné plochy a línie bez nových rasterov alebo knižníc. Dátové podklady, 3D scéna a platby sa nemenia.

Lokálne overenie: všetkých 30 verify skriptov, TypeScript, ESLint, build-dark --check a produkčný build prešli. Nový dátový test zahŕňa všetkých 169 poslancov, členstvo, presné hlasy, rozdiely oproti klubu a stránkovanie bez strát či duplicít. Vizuálne šírky 375/402/1280 px, oba motívy, programy a portréty; klávesnica pre rok/hlas, staršie stránky a skutočné hlasovanie 58044 s prechodom do sály. Mobilný detail sa po výbere odkryje nad spodnou navigáciou; pri reduced-motion okamžite. Bez vodorovného pretekania v kontrolovaných šírkach.

Detektor jedenkrát: [] v .impeccable/review/portraits-footprint/detector.json. Dve batched vizuálne kolá vrátane opráv; finálne snímky a review v .impeccable/review/portraits-footprint/. Dokončovací review a documenter boli inline kontrolou toho istého implementátora, nie nezávislým overením; disposition: ship. Fyzický telefón/Safari nebol dostupný.


## Modelový lístok a titulná obálka, 10. október 2026

Peter schválil body 2 a 3: interaktívny modelový lístok a meniacu sa titulnú obálku. Atmosférická úprava 3D sály nie je súčasťou tohto balíka.

Lístok používa autentické logá, presné percentá, natívne číselné vstupy a posuvníky, kroky po 0,5 bodu a okamžité kreslá. Pôvodný prepočet, reset, nerozdelená podpora, neznáme hodnoty, chyba nad 100 % aj koaličné kartičky zostávajú. Poradie nie je oficiálna kandidátna listina; nejde o skutočný hlasovací lístok. Mobilná skratka Parlament odkryje výsledok nad spodnou navigáciou. Pôvodná ilustračná budova ustúpila pracovnej ploche.

Obálka automaticky vyberie najnovší dostupný obsah podľa známeho dátumu publikácie alebo archivovaného hlasovania. Budúce dáta a prieskumy bez známej publikácie sa v automatickom výbere nepoužijú. Ručný výber zostáva stabilný; žiadny automatický carousel. Súhrn správ má skutočný titulok, dátum, šesť klikateľných článkov aktuálneho dňa a pôvodné odkazy. Prieskum ukazuje päť najvyšších presných hodnôt agentúry, nie agregát, s ryskou predchádzajúceho merania tej istej agentúry. Hlasovanie ukazuje skutočný súčet 150 hlasov; geometria nepredstavuje zasadací poriadok. Index sa načíta len pri viditeľnej obálke, chyba má opakovanie. Obálka nevyhľadáva nové správy na internete; reaguje na overený obsah pridaný do webu. Pôvodný modelový titulok, deň za 30 sekúnd a vstup do 3D zostávajú pod obálkou.

Systém ostáva: IBM Plex Sans; krémový papier a zelený atrament; autentické logá a dátové farby; pôvodná navigácia a výpočty; CSS/SVG bez nových rasterov, fontov a knižníc. Politické dáta, hry, platby ani 3D scéna sa nemenia. Autorita DESIGN.md zostáva bez zmeny.

Overenie: všetkých 31 verify skriptov, TypeScript, ESLint, build-dark --check a produkčný build prešli. Test pokrýva dátumy, poradie, budúce/nezistené publikácie, validáciu 353 hlasovaní, 150 hlasov a pôvodný model. Po poslednej oprave animácie pruhu prešli nový test, TypeScript, ESLint, dark check a build znova. Vizuálne dve batched kolá pri 375/402/1280 px, oba motívy, bez pretekania; klávesnica, zmena podpory, neplatný súčet, reset, mobilná skratka a otvorenie článku fungujú. Konzola bez chýb. Detektor spustený raz upozornil na transition:width; opravené na transform:scaleX, bez opakovaného detektora. Finálne dôkazy v .impeccable/review/ballot-cover/. Dokončovací review a documenter sú inline kontrolou implementátora, nie nezávislým overením; disposition: ship. Fyzický telefón/Safari nebol dostupný.
