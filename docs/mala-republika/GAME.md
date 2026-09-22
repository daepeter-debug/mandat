# Pravidlá v1 — štvrť pri starej stanici

## Základný pocit

Pokojná logická staviteľská hra. Každý deň viditeľný malý výsledok, počas siedmich aktívnych dní obnovená stanica podľa vlastnej voľby. Príbeh je fiktívny; žiadny ukazovateľ politickej správnosti. Všetko rozhodujúce sa dá získať plánovane. Náhodné zásielky pridávajú estetické možnosti.

## Mapa a ovládanie

- Mapa 6 × 6, súradnice x,y = 0..5; sever je hore. Každá stavba zaberá jedno políčko. Prvá verzia má celú mapu prístupnú; zahalené okolie je iba kresba, nie prísľub funkčného rozširovania.
- Pevné námestie P=(2,2), radnica T=(2,1), stará stanica S=(5,1). T a S nie sú priechodné. Námestie je priechodné.
- Cesta je na (0,2),(1,2),(3,2),(4,2),(5,2). Prázdne políčka môžu byť cestou alebo stavbou, nikdy oboma.
- Štart: domy H=(0,1),(3,1),(4,3), škola E=(1,1). Domy a škola sa dajú premiestniť; námestie/radnica/stanica nie.
- Cesty možno kresliť a odstraňovať zadarmo. Susedstvo = spoločná hrana, nikdy diagonála. Cestná sieť je komponent cestných políčok pripojený k námestiu.
- Stavba je **zapojená**, ak hranou susedí s touto sieťou. Dom využíva službu, keď sú dom aj služba zapojené a Manhattanova vzdialenosť medzi nimi je najviac 2. Je to vysvetlené zjednodušenie, nie simulácia skutočnej dopravy.
- Všetky kombinácie vyžadujú zapojenie zúčastnených budov. Nový hráč vždy vidí dosah a dôvod, prečo prepojenie funguje alebo nefunguje.
- Klepni na kartu → klepni na políčko → náhľad ceny/dosahu → Potvrdiť. Drag je iba voliteľný doplnok. Presun a odloženie už získanej stavby sú zadarmo. Pri presune ostáva pôvodná poloha až do potvrdenia platného cieľa.
- Potvrdené stavanie kúpi inštanciu za uvedenú cenu, ak nie je v inventári. Odloženie vráti inštanciu do inventára, nie peniaze. Žiadny predaj ani multiplikovanie odmien.

## Ekonomika a katalóg

Len dva zdroje: mince C a materiál M. Začiatok 12 C / 8 M. Žiadny dlh, údržba, energia ani neviditeľné bonusy. Maximálne 999 každého zdroja; UI otvorene ukáže prípadnú nevyužitú časť odmeny pri strope.

| ID | Názov | Cena C/M | Funkcia |
| --- | --- | --- | --- |
| house | Dom | 4/2 | Cieľ pokrytia službami; 3 sú na začiatku |
| school | Škola | 7/4 | Vzdelávanie; 1 je na začiatku |
| library | Knižnica | 6/3 | So školou vo vzdialenosti ≤2 tvorí školskú štvrť |
| clinic | Ambulancia | 7/4 | Zdravotná služba s dosahom 2 |
| park | Park | 3/2 | Zeleň s dosahom 2 |
| market | Tržnica | 6/3 | S námestím vo vzdialenosti ≤2 oživí centrum |
| workshop | Dielňa | 5/3 | So školou vo vzdialenosti ≤2 tvorí remeselnú štvrť |
| garden | Komunitná záhrada | 3/2 | Dekoratívna alternatíva zelene; počíta sa ako park |
| culture | Kultúrny dom | 6/3 | Voľná stavba po kapitole, v1 iba vzhľad |
| town-hall | Radnica | pevná | Identita mesta, názov a pomoc |
| plaza | Námestie | pevné | Koreň cestnej siete |
| station | Stará stanica | projekt | Finále kapitoly, tri podoby |

Základné kúpiteľné stavby sú dostupné od začiatku okrem culture (po kapitole). Žiadna z nich nesmie byť vzácnym náhodným dropom. Ceny sú interné herné jednotky.

## Denný rytmus a čas

Herný deň = kalendárny dátum Europe/Bratislava. Stav nesmie závisieť od počtu renderov. V účte určuje čas server, hosť má dátum zariadenia a neoverený lokálny postup. Žiadny časovač po sekundách.

Prvá návšteva má 1 zásielku. Každý ďalší kalendárny deň pribudne 1, zásoba najviac 3. Uložiť lastAccruedDay, charges a claimSequence. Pri novej návšteve pridať min(3, charges + max(0, rozdiel kalendárnych dní)); neposúvať lastAccruedDay dozadu. Počítanie dní nesmie používať rozdiel miestnych polnocí / 24 h (DST). Dátumy YYYY-MM-DD previesť na ordinálne kalendárne dni.

Každá otvorená zásielka poskytne 8 C / 4 M a výber 1 z 3 dekorácií. Odmena je viazaná na jediné potvrdenie výberu. Otvorenie uloží ponuku a zníži charges o 1 (tým zásielku rezervuje); zatvorenie ju nesmie prerollovať ani spotrebovať druhýkrát. Potvrdenie dá odmenu a vymaže pending, charges už nemení. Naraz najviac jedna rozbalená ponuka. claimSequence sa zvýši pri vytvorení ponuky a pri opätovnom otvorení sa nemení.

Za aktuálny deň sú voliteľné 3 malé objednávky: ozeleň jeden dom, zapoj školu, vytvor jednu kombináciu z aktuálne dostupných budov. Odmena za každú 2 C / 1 M, raz pre dvojicu day+taskId. Pri výbere iba úlohy splniteľné dostupným katalógom; už splnenú môže hráč vyzdvihnúť bez zničenia a opätovnej stavby. Prvých sedem dní používa pevné šablóny, bez neovereného náhodného generátora úloh. Ak sa nenájde bezpečná tretia šablóna, použiť známu základnú úlohu, nikdy požadovať vzácny predmet.

Deterministický cyklus objednávok (riadok = rozdiel kalendárnych dní od založenia modulo 7):

| Deň cyklu | Tri stabilné ID |
| --- | --- |
| 0 | school-link, green-home, three-homes |
| 1 | school-pair, green-home, three-homes |
| 2 | care-two, school-link, green-home |
| 3 | market-square, three-homes, school-pair |
| 4 | craft-pair, green-two, school-link |
| 5 | care-two, market-square, three-homes |
| 6 | green-two, school-pair, craft-pair |

school-link = zapojená škola; three-homes = aspoň 3 zapojené domy; green-home/green-two = park alebo garden pokrýva aspoň 1/2 zapojené domy; care-two = jedna ambulancia pokrýva 2 domy; school-pair/craft-pair/market-square = príslušná kombinácia. Výber taskIds uložiť pri prvom otvorení dňa a už ho počas dňa nemeniť. Pri zmene zariadenia/času dozadu sa neobnovia staršie odmeny: starší deň odmietnuť. Počet 7 označuje návrhový cyklus, nie obmedzenie hry na týždeň.

Projekt má 7 krokov. Dokončiť možno najviac jeden krok za kalendárny deň; po splnení sa stavba/rozhodnutie zapíše navždy, neskorší presun úspech nezruší. Rozostavaný krok čaká bez časového limitu. Cestovanie v čase dozadu nesmie odomknúť ďalší krok. Kontrola dátumu aj v jadre, nielen disabled tlačidlo.

Po dennej odmene môže hráč ďalej bezplatne upravovať mesto a skúmať kombinácie. Denný postup sa obnoví ďalší deň; hra ho nenúti čakať pri otvorenej obrazovke. Chýbajúce dni nič nepokazia, neexistuje streak odmena.

## Zásielky a vzácnosť

Najprv vyžrebovať triedu zásielky: bežná 60 %, neobvyklá 25 %, vzácna 12 %, epická 3 %. Potom ukázať všetky tri dekorácie danej triedy. Percentá uviesť v pravidlách. Je to rozdelenie tried zásielok, nie nezávislá šanca každej karty.

| Trieda | Stabilné ID troch predmetov |
| --- | --- |
| common | bench, flower-bed, linden |
| uncommon | fountain, book-kiosk, pergola |
| rare | clock, bandstand, sculpture |
| epic | observatory, glasshouse, ceremonial-gate |

Všetky sú dekorácie na jedno políčko, bez ekonomického násobiča. Epické sú vizuálne výnimočné; nezobrazovať neexistujúce funkcie observatória ako herné bonusy. Jedna kópia odomkne neobmedzené umiestňovanie danej dekorácie v rámci voľnej mapy. Opakovaný výber už vlastnenej dekorácie dá presne 2 M a UI to povie pred potvrdením. Neexistuje predaj.

Po siedmom dokončenom projekte si hráč vyberie jednu ľubovoľnú dekoráciu zo všetkých tried bez ohľadu na náhodu; odmena len raz. Prvú ponuku hosťa možno určiť deterministicky z jeho uloženého townSeed a claimSequence. V účte používa server tajný seed/HMAC a uloženú ponuku. Math.random počas renderu je zakázaný. Voľba budúcej dekorácie nezmení žrebovanú triedu.

## Prvá kapitola: „Stanica znova žije“

Tri stále postavy: **Eva**, učiteľka; **Milan**, správca stanice; **Nina**, organizátorka susedských podujatí. Mená sú fiktívne, nepoužívať fotografie reálnych ľudí.

| Krok / ID | Krátky základný text | Presná podmienka a výsledok |
| --- | --- | --- |
| 1 school-yard | Eva: „Po vyučovaní nám chýba miesto vonku. Nájdeme pri škole kúsok zelene?“ | Zapojená škola + park/garden vo vzdialenosti ≤2. Pri potvrdení 2 C / 1 M. |
| 2 books | Eva: „Máme dvor. Teraz by sme radi chodili za knihami pešo.“ | Zapojená knižnica + škola ≤2. Pri potvrdení 2 C / 1 M. |
| 3 care | Nina: „Ambulancia by mala byť blízko domov. Skúsme ju umiestniť tak, aby slúžila aspoň dvom.“ | Jedna zapojená ambulancia pokrýva ≥2 zapojené domy. 2 C / 1 M. |
| 4 square | Nina: „Na námestí môže byť rušno aj bez veľkého festivalu. Začnime malým trhom.“ | Zapojená tržnica ≤2 od P. 2 C / 1 M. |
| 5 discovery | Milan: „V stanici sme našli starú halu. Čo by v nej malo vzniknúť?“ | Jednorazový výber museum / market-hall / community-hall, bez ceny; odhalí príslušný vzhľad a ďalšiu úlohu. Žiadna preferovaná odpoveď. |
| 6 preparation | Milan: „Pripravme halu aj jej okolie. Ľudia sa sem musia vedieť dostať.“ | Stanica zapojená + príslušná budova do vzdialenosti 2: museum→library, market-hall→market, community-hall→park/garden. Pri potvrdení spotreba 6 C / 4 M. |
| 7 opening | Nina: „Dvere sa môžu otvoriť. Dnes patrí stanica celej štvrti.“ | Stanica zapojená + zapojené ≥3 domy + ≥1 aktuálna kombinácia; finále stojí 8 C / 4 M. Trvalý vzhľad stanice, pohľadnica, výber dekorácie. |

Kombinácie v1: školská štvrť (school+library ≤2), remeselná štvrť (school+workshop ≤2), živé centrum (market+P ≤2). Neprinášajú obnoviteľnú odmenu; sú viditeľným výsledkom a podmienkou úloh. Zoznam ukáže aj nesplnené kombinácie s náznakom.

Neskoršie vetvené príbehy sú rozšírenie. V1 má tri podoby finále a štyri triedy dekorácií; netvrdiť, že obsahuje procedurálny príbehový svet.

## Dôkaz splniteľnosti bez šťastia (ručne odvodený, Terra ho musí spustiť v teste)

Nechať pôvodnú cestu. Krok 1: park=(1,3), škola=(1,1), vzdialenosť 2; obe susedia s cestou. Krok 2: library=(2,3), škola vzdialenosť 3 → **presunúť školu na (1,3), park na (0,3), library na (2,3)**. Škola/library majú vzdialenosť 1, park/škola tiež 1.

Krok 3: clinic=(3,1). Dom z (3,1) presunúť na uvoľnené (1,1), dom z (0,1) na (4,1), tretí z (4,3) na (3,3). Clinic má k domom (4,1),(3,3) vzdialenosti 1 a 2. Všetky susedia s cestou. Krok 4: market=(4,3), vzdialenosť k P je 3 → umiestniť market=(2,3) a library odložiť. Tržnica má vzdialenosť 1 k P. Pred finále vrátiť library=(2,3), market možno odložiť; vytvorí sa znovu školská štvrť.

Krok 5 zvoliť museum. Krok 6 dočasne presunúť library=(4,1), dom odtiaľ odložiť; od S je vzdialená 1. Zaplatiť prípravu. Krok 7 vrátiť library=(2,3) a dom=(4,1); knižnica + škola obnovia kombináciu, tri domy sú zapojené a stanica susedí s cestou (5,2).

Celková nutná spotreba: park 3/2 + library 6/3 + clinic 7/4 + market 6/3 + príprava 6/4 + otvorenie 8/4 = **36 C / 20 M**. Počiatočných 12/8 + sedem zásielok 56/28 + štyri projektové odmeny 8/4 dáva **76 C / 40 M**, bez objednávok a bez opakovaných dekorácií. Zámerne veľká rezerva pre prvé testovanie, nie hotové vyváženie. Podobne otestovať zvyšné dve vetvy; ich dočasná budova sa zmestí na (4,1).

Tento prototyp testuje chuť tvoriť a kombinovať, nie tvrdú ekonomickú obtiažnosť. Obtiažnosť zvyšovať neskôr voliteľnými layout úlohami (napr. rovnaké pokrytie s menším počtom ciest), nikdy znížením šance na povinný predmet.
