# Evidencia údajov a rozsahu

## 23. 9. 2026 — tmavý režim a inštalácia na plochu (Claude)

Tmavý režim je voliteľný. Predvolene ostáva svetlý, prepína sa ikonou v hlavičke (na mobile v paneli Viac) a voľba sa pamätá v prehliadači. Pri prepnutí sa nová farba rozleje v kruhu od tlačidla; pri nastavení „obmedziť pohyb“ sa prepne hneď. Tmavé štýly sa generujú skriptom `scripts/build-dark.mjs` z existujúcich štýlov (výstup `app/theme-dark.css`, kontrola `--check`), takže svetlý režim sa nemení. Svetlé plochy tmavnú, tmavý text svetlie. Farby strán, logá, ilustrácie a hry ostávajú, text vo farbe strany je zosvetlený. Kontrast textu bol overený skriptom na všetkých 11 sekciách, v paneloch aj vo vyhľadávaní.

Popri kontrole kontrastu boli opravené tri staršie chyby svetlého režimu:
- takmer neviditeľný odkaz „Metodika agregátora“ v koaličnej skladačke;
- tmavozelený odkaz na zdroj na tmavomodrej karte v Dátovom prehľade;
- slabší kontrast popisov fotografií v O dátach.

Monogramy strán bez loga v Zodpovednosti majú tmavý text tam, kde by biely bol na farbe strany málo čitateľný.

Mandát sa dá pridať na plochu ako aplikácia:
- ikony 192/512, maskovateľná ikona a ikona pre iPhone;
- skratky v manifeste: Prieskumy, Strany, Hospodárenie, Herňa;
- v paneli Viac tlačidlo „Pridať Mandát na plochu“ a na iPhone návod cez Zdieľať.

Service worker (`public/sw.js`) berie stránky vždy najprv zo siete, takže údaje sú čerstvé. Bez signálu otvorí naposledy videnú verziu stránky alebo stránku `offline.html`. Súbory s hashom a písma berie z cache.

## 23. 9. 2026 — zdieľanie sekcie a odozva pri ťuknutí (Claude)

Na ilustrácii v hlavičke piatich sekcií pribudlo v pravom hornom rohu tlačidlo Zdieľať (na mobile len ikona; vodoznak ilustrácie ostáva vpravo dole). Na telefóne otvorí systémové zdieľanie s odkazom na sekciu, ktorý má vlastný náhľad; na počítači odkaz skopíruje. Tlačidlá v rýchlych odpovediach, skladačke, porovnaní strán a podobne sa na dotykových zariadeniach pri ťuknutí jemne zmenšia (pri „obmedziť pohyb“ nie).

## 23. 9. 2026 — mobilná navigácia dole a kompaktná hlavička (Claude)

Na telefóne bola horná lišta s 11 záložkami (viditeľné asi štyri) a hlavička s citátom zaberala 121 px; nadpis úvodu začínal až v dvoch tretinách prvej obrazovky. Na mobile (do 760 px) je teraz navigácia dole pri palci (`components/mobile-dock.tsx`): Prehľad, Prieskumy, Strany, Hospodárenie a Viac. Viac otvorí spodný panel so všetkými ostatnými sekciami ako dlaždicami s krátkym popisom a s hľadaním. Horná lišta záložiek je na mobile skrytá a citát v hlavičke tiež (hlavička má 77 px), takže nadpis úvodu je o 100 px vyššie. Prilepená lišta kresiel vo Vlastnom modeli a skoky z hľadania rátajú s novou výškou. Na počítači sa nič nemení.

## 23. 9. 2026 — Vlastný model na mobile: prepočet kresiel bez posúvania do strany (Claude)

Vysvetlenie „Ako sa z hlasov stanú kreslá“ malo na telefóne tabuľku širokú 640 px a štyri kroky pod sebou. Na mobile sú kroky posúvateľné karty (ďalšia vykukuje spoza okraja) a tabuľka ukazuje len stranu, podporu, kreslá a zmenu oproti dnešku; delenie volebným číslom a zvyšky ostávajú na počítači a v texte krokov.

## 23. 9. 2026 — Programy na mobile: kratšie karty, zbalený archív 2023 (Claude)

Karta programového dokumentu mala na telefóne 550–650 px. Na mobile ukazuje len stranu, stav, názov, popis na tri riadky, témy v jednom posúvateľnom riadku a tlačidlo na pôvodný dokument (asi 300 px); poznámka ku kontextu a dátum overenia ostávajú na počítači a v dokumente. Archív volieb 2023 je na mobile zbalený do jedného riadku. Stránka Programy má na mobile asi 4 400 px namiesto 9 600.

## 23. 9. 2026 — O dátach na mobile: rozbaľovacie sekcie (Claude)

Stránka O dátach mala na telefóne vyše 16 000 px. Na mobile (do 760 px) je teraz osem zásad metodiky rozbaľovacích: viditeľný je nadpis a text sa otvorí ťuknutím (prvá zásada je otvorená). Dlhé zoznamy (agentúry a pokrytie dát, logá strán, fotografie osobností, register zdrojov) sú zbalené do jedného riadku s popisom. Stránka má na mobile asi 2 100 px. Na počítači sa všetko zobrazuje rozbalené ako doteraz (`components/mobile-fold.tsx`).

## 23. 9. 2026 — Strany na mobile: kompaktný zoznam (Claude)

Na telefóne mala každá strana kartu vysokú asi 515 px (štítky, popis, hodnoty a zdroj), zoznam 16 strán mal vyše 8 000 px. Na mobile je teraz každá strana riadok ako v aplikácii: logo (alebo skratka, ak logo nie je), názov a podpora v Modeli Mandát s mini stĺpcom vo farbe strany; ťuknutie kamkoľvek na riadok otvorí profil so všetkými detailmi. Zoznam má asi 1 240 px. Na počítači sú karty bez zmeny.

## 23. 9. 2026 — Zodpovednosť na mobile: vlády ako karty (Claude)

Tabuľka „Vlády od roku 1993“ bola na telefóne široká 960 px a posúvala sa do strany. Na mobile je teraz každá vláda karta: názov a poznámka, premiér a trvanie vedľa seba, obdobie, koaličné strany a riadok V číslach (saldo, dlh pri prevzatí a odovzdaní, nezamestnanosť, odkaz na detail). Na počítači ostáva tabuľka.

## 23. 9. 2026 — Hospodárenie na mobile: zoznam rokov namiesto širokej tabuľky (Claude)

Tabuľka rokov v Hospodárení má 13 stĺpcov; na telefóne bolo bez posunu do strany vidno len rok a vládu, čísla boli skryté vpravo. Na mobile ju nahrádza zoznam (`components/finance-years-mobile.tsx`): pri každom roku vláda, ktorá ho odvládla najdlhšie, udalosť roka, stĺpček salda (tmavočervený pri deficite nad 3 % HDP), dlh v % HDP a na obyvateľa a nezamestnanosť. Predvolene posledných 10 rokov, tlačidlom všetky od roku 1995. Na počítači ostáva úplná tabuľka.

## 23. 9. 2026 — Prieskumy na mobile: kompaktné karty archívu (Claude)

Na mobile mala každá položka archívu meraní vysokú kartu (asi 530 px) len s metadátami a samotný výsledok nebolo vidieť; stránka Prieskumy mala na telefóne vyše 23 000 px. Na mobile teraz namiesto tabuľky ukazujeme kompaktné karty (`components/archive-cards.tsx`, asi 200 px): agentúra a mesiac, zber a vzorka v jednom riadku, štyri najsilnejšie strany ako mini stĺpce a pod tým pôvodná správa a detail merania. Na počítači ostáva tabuľka bez zmeny. Stránka je na mobile asi o dve tretiny kratšia.

## 23. 9. 2026 — Úvod: pás najnovších meraní (Claude)

Na vrchu úvodu pribudol tenký pás (`components/poll-ticker.tsx`) s posledným meraním každej agentúry a jej prvými tromi stranami, zoradený od najnovšieho. Plynulo beží, zastaví sa pod prstom alebo myšou a tlačidlom pauzy; pri nastavení „obmedziť pohyb“ stojí a dá sa posúvať prstom. Ťuknutie na meranie otvorí jeho detail v archíve. Na mobile nahrádza prehľad posledných meraní agentúr, ktorý je tam skrytý.

## 23. 9. 2026 — mobilný úvod: rýchle odpovede vyššie, skladačka aj na mobile (Claude)

Peter chce, aby mal mobil pri všetkých zmenách prednosť. Na mobile boli rýchle odpovede až asi 3 000 px pod vrchom stránky a koaličná skladačka bola skrytá (`.magazine .mag-lab{display:none}`). Rýchle odpovede sú teraz súčasťou mriežky úvodu (`components/national-intro.tsx`): na mobile a tablete hneď pod úvodnými číslami a kartou V skratke (asi 1 600 px), na počítači ostávajú na plnú šírku pod úvodom. Skladačka je na mobile viditeľná a kompaktná: nadpis na jeden až dva riadky, strany v dvoch stĺpcoch s dotykovými tlačidlami 46 px, polkruh na šírku obrazovky, štyri cesty k väčšine namiesto šiestich. Rozcestník „Ďalej na webe“ (len na mobile) je až za ňou.

## 23. 9. 2026 — rýchle hľadanie na celom webe (Claude)

V hlavičke pribudlo tlačidlo Hľadať a skratky Ctrl+K, Cmd+K alebo „/“ (`components/site-search.tsx`, knižnica cmdk, ktorá už bola v závislostiach). Nájde nástroje (rýchle odpovede, koaličná skladačka, porovnanie strán, peniaze strán, Tvoje Slovensko, dlhové hodiny, presnosť agentúr, prepočet kresiel), strany (otvorí profil), sekcie, hry, agentúry (otvorí archív s filtrom) a vlády podľa názvu aj premiéra. Štvormiestny rok ponúkne „Čo zažil ročník…“. Hľadá bez diakritiky a prednosť má zhoda celého slova, potom začiatok slova; náhodná zhoda písmen sa neráta. Po výbere nástroja web prepne sekciu a doskroluje na miesto (ciele majú odstup od prilepenej navigácie).

## 23. 9. 2026 — Úvod: koaličná skladačka s polkruhom a cestami k väčšine (Claude)

Skladačka „Zostavte vlastnú koalíciu“ na úvode (`components/coalition-lab.tsx`) má namiesto pásika polkruh 150 kresiel, ktorý sa pri výbere vyfarbí vlnou zľava doprava; pri 76 kreslách číslo zasvieti a objaví sa štítok Väčšina. Pod stranami sú cesty k väčšine: najmenšie väčšinové kombinácie (súčet aspoň 76, bez ktorejkoľvek strany by väčšina padla; `lib/coalitions.ts`), a keď čitateľ vyberie strany, len tie, ktoré ich obsahujú. Kliknutím sa cesta vyberie. Výber sa dá uložiť ako obrázok 1200 × 630 (na mobile cez zdieľanie). Ostáva poznámka, že výber je čisto matematický a nehovorí nič o ochote strán spolupracovať.

## 23. 9. 2026 — Úvod: rýchle odpovede (Claude)

Pod úvodným vydaním pribudol pás šiestich otázok (`components/quick-answers.tsx`). Každá odpoveď je jeden obrázok a jedna veta: kto by dnes vyhral (súboj prvých dvoch strán s ťahaným pásom podľa toho, v koľkých prepočtoch je strana prvá, a s upozornením, že v roku 2023 prieskumy podcenili Smer), či má niekto väčšinu (pás 150 kresiel so značkami 76), kto je na hrane 5 % (číselná os s pásmami strán), koľko hlasov by prepadlo, aký veľký je dlh (odhad beží po sekundách, dáta sa načítajú až pri otvorení) a čo zažil tvoj ročník (vedie do Tvojho Slovenska). Podiel prepočtov sa píše slovom („v 9 z 10“, pri krajných hodnotách „takmer vo všetkých“), aby to neznelo ako istota. Simulácia v `lib/uncertainty.ts` počíta aj prvé miesto. Čísla pri prepnutí otázky nabehnú od nuly; pri „obmedziť pohyb“ bez animácie.

## 23. 9. 2026 — Vlastný model: ako sa z hlasov stanú kreslá (Claude)

Pod Vlastným modelom pribudlo vysvetlenie prepočtu hlasov na kreslá podľa § 68 zákona 180/2014 Z. z. v štyroch krokoch (hranica, republikové volebné číslo = hlasy postupujúcich strán / 151, celé kreslá, zvyšky) na dnešnom Modeli Mandát (`components/seats-explainer.tsx`, výpočet `allocateSeats` sa nemenil). Posuvník mení podporu jednej strany (predvolene strany na hrane 5 %, dnes Demokrati) a tabuľka ukazuje delenie volebným číslom, celé kreslá, zvyšok a zmenu kresiel každej strany oproti dnešku. Pri 5,2 % by Demokrati mali 9 kresiel a ostatné strany by stratili po jednom až dvoch. Uvádza sa aj, koľko hlasov „stojí“ jedno kreslo pri účasti ako v roku 2023.

## 23. 9. 2026 — Zodpovednosť: vláda v číslach (Claude)

Hospodárske zhrnutie vlád už bolo v Hospodárení (pohľad Po vládach). Aby čas pri moci a hospodárenie neboli oddelené, tabuľka „Vlády od roku 1993“ v Zodpovednosti má nový stĺpec V číslach: priemerné saldo za rok (% HDP, červené pod −3 %), dlh v % HDP pri prevzatí a odovzdaní a priemerná nezamestnanosť, s odkazom na detail v Hospodárení. Čísla sú z rovnakého výpočtu `cabinetSummary` (roky vážené dňami vo funkcii); vlády pred rokom 1995 majú poznámku, že údaje Eurostatu začínajú rokom 1995.

## 23. 9. 2026 — Strany: porovnanie vedľa seba (Claude)

Na stránke Strany pribudlo porovnanie dvoch alebo troch strán (`components/party-compare.tsx`, načítava sa až pri otvorení stránky). Pre každú stranu: dnešná podpora v Modeli Mandát s pásmom a stavom pri hranici 5 %, orientačné kreslá s rozpätím, zmena za 30 dní, výsledok volieb 2023 (pri OĽANO a priateľoch ako koalícia), čas vo vláde od roku 1993 (rovnaký výpočet ako Zodpovednosť, bez predchodcov), nárok na štátne príspevky 2023–2027, kto je na čele a počet overených programových dokumentov s najnovším. Predvolene sú vybrané tri najsilnejšie strany; výber je v adrese (`?v=parties&porovnaj=ps,smer,slovensko`). Na mobile sú hodnoty v stĺpcoch pod názvom riadku. Z úvodu stránky Strany vedie na porovnanie odkaz.

## 23. 9. 2026 — Strany: koľko dostanú od štátu (Claude)

Nárok na štátne príspevky bol doteraz len v profile každej strany. Na stránke Strany pribudol spoločný prehľad za volebné obdobie 2023–2027 (`components/party-money.tsx`, výpočet `lib/party-funding.ts` sa nemenil): spolu 92,9 mil. € pre 9 subjektov nad 3 %, 26,08 € za hlas (13,04 € jednorazovo a rovnako na činnosť), 39 120 € ročne za každý z prvých 20 mandátov a asi 35 € na voliča strany v parlamente. Stĺpec pri každom subjekte delí sumu na príspevok za hlasy, na činnosť a na mandáty; pri strane je aj suma na voliča (strany bez mandátu 26 €). Poznámka uvádza najtesnejší subjekt pod hranicou nároku a koľko hlasov mu chýbalo. Ide o nárok zo zákona, nie o skutočne vyplatené sumy.

## 23. 9. 2026 — prehrávanie vývoja Modelu Mandát (Claude)

Pri časovom posuvníku v prehľade „Ako sa mení podpora strán“ pribudlo tlačidlo Prehrať. Prejde týždenné body agregátu od začiatku obdobia (20. 1. 2026) po najnovší, v poradí strán sa stĺpce a pásma menia plynulo a na konci sa zobrazenie vráti k najnovším údajom. Zastaviť sa dá tlačidlom alebo posuvníkom; po zastavení pokračuje z rovnakého týždňa. Funguje v poradí aj v trende.

## 23. 9. 2026 — presnosť agentúr vo voľbách 2023 (Claude)

Na konci Prieskumov pribudla sekcia „Ako presne trafili agentúry v roku 2023“ (`components/poll-accuracy.tsx`, dáta `lib/poll-accuracy.ts`). Posledný prieskum pred moratóriom od šiestich agentúr (AKO pre JOJ 24, FOCUS pre TV Markíza, Ipsos pre Denník N, NMS, MEDIAN SK pre RTVS, SANEP pre TA3) porovnávame s oficiálnym výsledkom ŠÚ SR pri 11 subjektoch, ktoré uvádzali všetky. Čísla sú prepísané z tlačových správ agentúr (AKO, FOCUS, Ipsos, NMS) a z médií, pre ktoré prieskum robili (MEDIAN SK – STVR, SANEP – Pravda); pri každom je odkaz. Súhrn tabuľky na anglickej Wikipédii sme nepoužili, pri MEDIAN SK sa nezhodoval s pôvodným zdrojom.

Výsledok: priemerná odchýlka na stranu od 1,33 b. (AKO) po 1,91 b. (NMS). AKO a NMS mali na prvom mieste PS, ostatné správne Smer. Všetky agentúry podcenili SMER (priemerne −3,3 b.) a ALIANCIU (−1,3) a precenili REPUBLIKU (+2,7) a SME RODINU (+2,5). Stránka dodáva, že prieskum nie je predpoveď a presnosť v jedných voľbách nehovorí všetko o presnosti dnes. Model Mandát sa tým nemení (váhy agentúr ostávajú rovnaké).

## 23. 9. 2026 — neistota Modelu Mandát zrozumiteľne (Claude)

Pásmo neistoty, ktoré Model Mandát počítal pre každú stranu, bolo doteraz vidieť len v detaile strany. Teraz:

- **V poradí strán** je pásmo orámované pri konci každého stĺpca a strany, ktorých pásmo pretína 5 %, majú štítok „na hrane“. Mierka stĺpcov je podľa horného okraja pásma, aby sa pásmo zmestilo.
- **V paneli strany** pribudol stav pri hranici (nad hranicou / na hrane / pod hranicou) a orientačné kreslá s rozpätím. Pri stranách na hrane aj ľudská veta, napríklad „v 4 z 10 prepočtov nad 5 %“.
- **V polkruhu na úvode** majú bloky pri scenári z Modelu Mandát rozpätie kresiel a poznámka hovorí, v akom podiele prepočtov má blok väčšinu 76.

Rozpätie je stredných 80 % z 2 000 prepočtov, v ktorých sa podpora strán náhodne posúva v rámci pásiem (normálne rozdelenie, pásmo = 95 % interval) a kreslá sa prepočítajú podľa § 68. Strany sa hýbu nezávisle, preto je to orientačné, nie predpoveď. Generátor má pevné semeno, takže čísla sú pri každom načítaní rovnaké (`lib/uncertainty.ts`, kontroly v `scripts/verify-data.mjs`). Presné percentá pravdepodobnosti zámerne neukazujeme.

## 23. 9. 2026 — Dlhové hodiny v Hospodárení (Claude)

Pod kartami Hospodárenia pribudol tmavý pás s odhadom dnešného dlhu verejnej správy, ktorý beží po sekundách, a s prepočtom na obyvateľa, sekundu a deň (`components/debt-clock.tsx`). Východisko je posledný údaj Eurostatu (dlh ku koncu roka 2025, 84,0 mld. €); ďalej sa ráta rovnomerne tempom, akým dlh rástol v roku 2025 (+6,2 mld. € za rok, asi 197 € za sekundu). Pás je výslovne označený ako odhad s vysvetlením, že skutočný dlh sa mení skokovo. Pri nastavení „obmedziť pohyb“ sa číslo mení raz za sekundu.

## 23. 9. 2026 — prvá fáza vylepšení: náhľady pri zdieľaní, V skratke, Tvoje Slovensko (vetva faza1, Claude)

Po porovnaní s volbynrsr.sk sme sa rozhodli spraviť prehľadnejšie to, čo majú oba weby, a rozvíjať to, čo má len Mandát.

- **Náhľady pri zdieľaní.** Odkaz poslaný cez WhatsApp alebo Facebook doteraz nemal obrázok. Každá hlavná sekcia má teraz vlastný náhľad 1200 × 630 z ilustrácie sekcie s názvom a jednou vetou (`public/og`, generuje `scripts/build-og.mjs` z `lib/share-cards.ts`). Vodoznak ilustrácie ostáva viditeľný. `app/page.tsx` je kvôli tomu serverová stránka s `generateMetadata`; klientska aplikácia sa presunula do `components/mandat-app.tsx`.
- **V skratke na úvode.** Hustý zoznam zmien pod nadpisom nahradila karta s piatimi faktami z Modelu Mandát: kto vedie (s pásmom neistoty), kto za 30 dní najviac rastie a klesá, kto je na hrane 5 % (pásmo neistoty zasahuje na obe strany hranice) a koľko pribudlo meraní. Zmeny kresiel blokov nesú karty nad ňou.
- **Tvoje Slovensko** v sekcii Zodpovednosť: po zadaní roku narodenia ukáže vlády a premiérov počas života (pred rokom 1993 od vzniku samostatného Slovenska), pás vlád so značkou 18. narodenín, stranu a premiéra, ktorí boli najdlhšie pri moci, a zmenu dlhu na obyvateľa, minimálnej mzdy (s rastom cien podľa HICP) a životnej úrovne podľa Eurostatu od roku 1995. Čas strán vo vláde je z rovnakých období ako prehľad nižšie. Rok je v adrese (`?v=responsibility&rok=1990`) a náhľad takého odkazu nesie vetu o ročníku. Výpočty sú v `lib/your-slovakia.ts`, kontroly v `scripts/verify-data.mjs`.

## 23. 9. 2026 — ilustrácie v hlavičkách sekcií (vetva ilustracie-ai, Claude)

Päť sekcií dostalo v hlavičke ilustráciu v štýle ručne robenej stolovej diorámy: Zodpovednosť (model parlamentnej sály), Hospodárenie (domy na minciach v účtovnej knihe), Prieskumy (stĺpcový graf z drevených kociek na námestí), Vlastný model (škola s volebnou miestnosťou) a Herňa (Malá republika). Obrázky vytvoril Peter v Higgsfield (Nano Banana Pro, bezplatný plán); pri Malej republike boli referenciou naša herná grafika a štýlová dioráma. Na obrázkoch nie sú skutoční ľudia, strany, logá ani vlajky. Vodoznak Higgsfield ostáva a pod každým obrázkom je popis „Ilustrácia vytvorená pomocou AI“. Originály v plnej veľkosti sú mimo repa (`outputs/higgsfield`); na web idú WebP varianty 720 a 1280 px (`public/images/illustrations`, 23–99 kB). Komponent `components/section-art.tsx`: na počítači je obrázok vpravo od nadpisu, na mobile pod ním.

## 23. 9. 2026 — nové logo: polkruh parlamentu (vetva logo-polkruh, Claude)

Šikmé stĺpčeky v logu pripomínali značku Tatra banky, čo sa pre nezávislý politický web nehodí. Nové logo je malý polkruh jedenástich kresiel, tmavá väčšina šiestich a svetlá menšina piatich, teda motív polkruhu 150 kresiel z webu. Je v hlavičke aj v pätičke (`components/brand-mark.tsx`); ikona webu (`public/favicon.svg`) má zjednodušený polkruh s ôsmimi kreslami, aby bol čitateľný aj pri 16 px. Pätička má farbu hlavičky namiesto starej modrej.

## 23. 9. 2026 — Zodpovednosť za stav krajiny ako samostatná záložka (vetva zodpovednost-sekcia, Claude)

Karta „Zodpovednosť za stav krajiny“ odišla z úvodnej strany do vlastnej záložky **Zodpovednosť** (`?v=responsibility`, za Hospodárením; na mobile aj dlaždica v rozcestníku). Úvod má teraz úvodník, parlament a správy: od 1700 px v troch stĺpcoch, užšie parlament pod úvodníkom.

Sekcia ukazuje rovnaké údaje ako karta, len rozvinuté: päť kľúčových čísel (najdlhšie vo vláde SNS 47 % v šiestich vládach, najdlhšie na čele vlády SMER 44 %, 14 vlád a 9 premiérov, šesť dnešných strán nikdy nevládlo a majú spolu 38 % v Modeli Mandát, súčasná vláda), časovú os všetkých vlád od 1. 1. 1993 s pásom pre každú dnešnú aj zaniknutú stranu (plná farba = premiér zo strany; na mobile sa os posúva a názvy strán ostávajú na mieste), škálu zodpovednosti s logami (dnešné strany otvárajú profil, zaniknuté majú osud strany), zoznam vlád s premiérom, obdobím, trvaním a koalíciou (neskorší vstup Demokratov a Strany vidieka do kabinetu je odlíšený) s odkazom na hospodárenie vlád, a metodiku s poznámkami a zdrojmi pri každom období. Údaje sa nemenili (stav k 13. 9. 2026); vlády sa presunuli do `lib/cabinets.ts`, aby sekcia nenačítavala dáta Eurostatu. Kontrola dát overuje aj vlády, v ktorých strany sedeli, a príznak premiéra.

## 23. 9. 2026 — Malá republika: nová grafika stolovej diorámy (vetva republika-grafika, Claude)

Peter chcel grafiku aspoň na úrovni Astry. Pôvodné kúsky boli ploché šikmé tvary bez spoločnej perspektívy; teraz sú všetky budovy, ozdoby aj mapa prekreslené v jednej izometrii s mapou, zo spoločných stavebníc (kvádre, sedlové a valbové strechy s radmi škridiel, rizality, komíny a vežičky z hrebeňa, okná s teplým svetlom, hodiny, stromy). Každý z 12 typov budov a 12 ozdôb má vlastnú siluetu, dom tri podoby a stanica štyri stavy (stará so zatlčenými oknami a dierou v streche, múzeum, tržnica v hale, komunitná hala; po otvorení girlandy). Mapa je drevená doska so zeminou, les za štvrťou, železnica s priecestím pri stanici, potok vpredu a vyrytý názov štvrte na hrane dosky. Odznaky napojenia sa ukazujú len pri budovách (ozdoby cestu nepotrebujú). Herné pravidlá, uloženie ani ovládanie sa nemenili; kontrola `verify-republic` (73 ciest) prechádza.

## 22. 9. 2026 — tretia hra Herne: Malá republika (Codex Terra/Astra + Claude)

Herňa má tretiu kartu **Malá republika** (`?v=game&g=republic`): pokojná staviteľská hra na mape 6 × 6 s fiktívnou Lipovou štvrťou. Cesty začínajú na námestí, služby majú dosah dve políčka, dva zdroje (mince a materiál) bez dlhu, zásielky s dekoráciami štyroch tried (60/25/12/3 %), tri denné objednávky v pevnom sedemdňovom cykle a kapitola „Stanica znova žije“ so siedmimi krokmi (jeden denne) a tromi rovnocennými podobami starej haly. Postavy Eva, Milan a Nina sú fiktívne; hra nehodnotí skutočné obce ani strany.

Hru navrhol a implementoval Codex (návrh Astra, prototyp Terra, opravný priechod Astra) podľa balíka v `docs/mala-republika/`; Claude dokončil prerušený opravný priechod (typy, režim ciest), overil hru v prehliadači na desktope aj mobile a nasadil ju. Stav sa ukladá iba v prehliadači (`mandat:republic:v1:guest`) s verziou, revíziou a ochranou pred prepísaním z druhej karty; pri poškodenom uložení hra ponúkne stiahnutie zálohy namiesto tichého prepísania. Kontrola `scripts/verify-republic.mjs` prehrá 73 celých ciest kapitoly s bežnými zdrojmi. Podrobný stav je v `docs/mala-republika/STATUS.md`, pravidlá v `GAMES.md`.

## 19. 9. 2026 — Herňa a nová hra Do decembra (vetva herna-do-decembra, Codex + Claude)

Záložka Denná hra sa mení na **Herňu** s výberom hier; výber je v adrese (`g=majority`, `g=december`). Denná väčšina ostáva bez zmeny logiky aj uložených hier.

Nová hra **Do decembra**: fiktívne mesto Mandátovce, dvanásť mesačných správ s dvoma možnosťami, rozpočet v minciach (+1 mesačne), tri oblasti Školy, Zdravie a Doprava na stupnici 0–10, odložené účty, dlh s úspornými opatreniami a pohľadnica s hviezdami na konci. Denná sezóna je pre všetkých rovnaká; generátor prijme len sezónu, ktorá sa dá dohrať na tri hviezdy a zároveň sa v nej dá padnúť. Scéna mesta je izometrická dioráma kreslená v SVG podľa Codexovho konceptu (drevená doska, škola, radnica s vežou, poliklinika, rieka s mostom) a reaguje na rozhodnutia aj na ročné obdobie. Tridsať správ je fiktívnych; hra nehodnotí skutočné obce ani strany. Podrobnosti v `GAMES.md`.

Codexov koncept (vygenerovaný obrázok) sa v rozhraní nepoužíva — obsahoval vlastné texty a nemohol by reagovať na rozhodnutia; slúžil ako zadanie smeru.

## 19. 9. 2026 — karta strany ukazuje aj výsledok volieb 2023 (vetva vysledok-2023, Claude)

Dodatok: riadok je jemne podfarbený a písmo zväčšené na 12,5 px, teda na úroveň riadka s agentúrou. Plocha používa rovnakú svetlomodrú ako skratka strany v hlavičke karty (token `--secondary`), aby sa farby v záložke Strany neštiepili; čísla sú v tmavomodrej `--secondary-foreground`. Pôvodné svetlé 11,5 px bez plochy bolo na karte ťažko čitateľné, prvá verzia plochy bola šalviová.

V záložke Strany je pod číslami z prieskumu nový riadok s výsledkom subjektu vo voľbách 2023: percentá a počet kresiel, menším a svetlejším písmom než hodnota agentúry (11,5 px, `--text-3`), aby dopĺňal kontext a nesúťažil s aktuálnym číslom.

Tri prípady rieši funkcia `result2023` v `lib/parliament.ts`. Strana, ktorá kandidovala sama, má vlastný výsledok (SMER 22,9 % · 42 kresiel, REPUBLIKA 4,75 % · bez kresla). Hnutie Slovensko, Kresťanská únia a ZA ĽUDÍ kandidovali v koalícii OĽANO a priatelia, preto majú spoločný výsledok 8,9 % · 16 kresiel a riadok to výslovne píše — historický rad nepremosťujeme potichu. Právo na pravdu a Strana vidieka v roku 2023 nekandidovali, uvedie sa „nekandidovala“.

Kontrola dát overuje, že každá dnešná strana má jeden z troch stavov, že hodnoty sú v medziach a že koaliční členovia zdieľajú ten istý výsledok.

## 19. 9. 2026 — karta parlamentu má prepínač partnerov (vetva parlament-partneri, Claude)

Karta „Parlament podľa prieskumov“ na úvodnej strane má druhý prepínač: **Dnešné bloky | S partnermi**. Pri zapnutom variante sa REPUBLIKA pripočíta ku koalícii a Hnutie Slovensko (Matovič) k opozícii, presne ako to robí titulok vydania a Dátový prehľad. V scenári z Modelu Mandát sa tým bloky menia zo 48 a 64 na **70 a 80** a „ostatní“ klesnú na nulu; pri voľbách 2023 zostáva koalícia na 79 (Republika mandáty nemala) a opozícia rastie z 55 na 71 o koalíciu OĽANO a priatelia.

Popisky blokov používajú rovnaké slovné tvary ako titulok vydania — „Koalícia s Republikou“ a „Opozícia s Matovičom“ (`partnerWording` v `lib/edition.ts`) — takže web hovorí o partneroch všade rovnako. Poznámka pod kartou pri zapnutom variante výslovne uvádza, že ide o redakčný predpoklad, nie o dohodu strán; pri vypnutom variante upozorňuje na prepínač. Stav je v adrese ako `pp=1`, takže sa dá zdieľať aj obnoviť, a do popisu pre čítačku obrazovky sa premieta tiež.

Kontrola dát overuje, že variant s partnermi zvýši koalíciu presne o kreslá REPUBLIKY, opozíciu o kreslá Hnutia Slovensko, že súčet ostáva 150 a že „ostatným“ ubudne.

## 19. 9. 2026 — správy za týždeň 15.–18. 9. (vetva spravy-19, Claude)

Dodatok po druhom kole rešerše (Denník N, SME, Pravda, TASR/Teraz, STVR, ta3, Noviny.sk, Aktuality): pribudli štyri správy, ktoré v prvom výbere chýbali — poradenská firma ministra obrany a platby od skupiny Michala Strnada (16. 9.), dvakrát neotvorená schôdza o odvolávaní ministra vnútra pre neuznášaniaschopnosť, presunutá na 17. novembra (17. 9.), Tarabovo vyhlásenie, že koalícia bude mať menej ako 77 poslancov a že pôjde do parlamentu ako nezaradený (17. 9.), a odvolanie zmeny grafikonu s vrátením zastávok expresu na Považí počas komunálnej kampane (18. 9.). Výber má 30 správ, za posledných sedem dní 18.

Doplnených deväť správ od poslednej aktualizácie (14. 9.), kontrola zdrojov posunutá na 19. 9. Výber má 26 položiek, za posledných sedem dní ich je 14.

Týždeň: otvorenie jesennej schôdze s vyše 300 bodmi (15. 9.), doručenie návrhu na odvolanie Tarabu prezidentovi a jeho odklad do návratu z USA (15. 9.), schválenie vyslania až 101 vojakov na východné krídlo NATO hlasmi koalície aj opozície (17. 9.), posun ústavnej zmeny o skrátení volebného obdobia referendom do druhého čítania (17. 9.), premiérovo spochybnenie článku 5 a reakcie prezidenta, Čaputovej a opozície (18. 9.), zrušená cesta na Ukrajinu a deklarácia Karpatskej osmičky bez neho (18. 9.), menovania v štátnej OKTE podľa Denníka N (18. 9.) a zastavenie spaľovne pri Dudinciach (18. 9.).

Každá správa má krátky popis do zoznamu a vlastné zhrnutie v troch odsekoch, ktoré otvára titulok; zdroj je jeden konkrétny článok a odkaz naň je až v zhrnutí. Pri menovaniach v OKTE je výslovne uvedené, že ide o zistenia redakcie Denníka N bez overenia z druhého zdroja.

Kontrola dát: pravidlo „aspoň jedna správa z dňa kontroly“ nahradené pravidlom, že najnovšia správa nesmie zaostávať za dňom kontroly o viac než tri dni. Kontrola môže prebehnúť ráno, keď ešte nové správy nevyšli; zaostávanie výberu však zachytí.

## 18. 9. 2026 — Denná väčšina: denný hlavolam (vetva denna-hra, Codex + Claude)

Codex rozpracoval hru „Denná väčšina“ (lib/daily-game.ts, components/daily-game.tsx, app/daily-game.css) a narazil na limit; Claude ju dokončil na vetve `denna-hra`; po Petrovej kontrole lokálnej verzie nasadená. Pravidlá: šesť fiktívnych strán so 150 kreslami, nájsť koalíciu s aspoň 76 kreslami, najviac tri strany, jedna dvojica spolu nejde, zastúpené školstvo aj zdravotníctvo — vyhráva najtesnejšia možná väčšina. Zadanie je rovnaké pre všetkých podľa slovenského dátumu (deterministický generátor, 2000 pokusov, vždy práve jedno riešenie z troch strán s cieľom ≤ 87 kresiel); stres-test 400 dní dopredu neprešiel ani raz na záložný hlavolam. Tréning dá nové zadanie, výsledky a posledných 7 dní sa ukladajú len v prehliadači, zdieľanie neprezradí riešenie.

Dokončenie: fiktívna strana „Most“ premenovaná na „Kotva“ (Most–Híd je skutočná strana), záložný hlavolam opravený (pôvodný dával 75 kresiel, nie väčšinu) a strážený kontrolou dát, stav hry sa aktualizuje funkčne a ukladá v efekte (rýchle ťuknutia sa nestrácali len náhodou), záložka „Denná hra“ (`?v=game`) pred O dátach, dlaždica v mobilnom rozcestníku, komponent načítaný dynamicky (15 KB). Kontrola dát overuje pre vybrané dátumy 150 kresiel, jediné riešenie, determinizmus a fiktívne mená. Na mobile (375 × 812) sa celá herná plocha zmestí na jednu obrazovku bez posunu: nadpis a prepínač režimu sú v jednom rade bez podnadpisu, polkruh má 210 px, kartičky strán 54 px; spodný okraj hernej plochy je na 702 px z 812. Pravidlá, nápoveda a história sú pod ňou.

## 18. 9. 2026 — motto na titulnej strane (vetva motto, Claude)

Dodatok: na Petrovo želanie je motto presunuté priamo pod názov webu v hlavičke (na každej stránke), bez odkazu na zdroj a bez poznámky, aby nezaberalo miesto — ostal len text a meno autora (na mobile len text, 11,5 px, hlavička rastie na ~105 px). Zdroj, doslovný originál a poznámka o skrátení ostávajú v `lib/quote.ts` a v tomto zázname; originál je v atribúte title. Z úvodníka Prehľadu je citát odstránený.

Pod zásadami v úvodníku Prehľadu je tichý citát: „Demokracia je diskusia. Ale pravá diskusia je možná len tam, kde si ľudia navzájom dôverujú a poctivo hľadajú pravdu." — Tomáš Garrigue Masaryk. Zdroj je primárny a overený: Karel Čapek, Hovory s T. G. Masarykem, kapitola Demokracie (Wikizdroje), s odkazom pri citáte; doslovný originál („Řekl jsem jednou, že demokracie je diskuse…") je v atribúte odkazu a poznámka uvádza „preklad z češtiny, skrátené". Zámerne nie pod logom — tam by súperil s podtitulom a na mobile s prvým číslom. Odmietnuté boli rozšírené, ale falošne pripisované citáty (Perikles, Platón, Jefferson). Dáta citátu sú v `lib/quote.ts`.

## 18. 9. 2026 — prepadnuté hlasy, cena mandátu a peniaze od štátu pre strany (vetva hlasy-a-peniaze, Claude)

**Prepadnuté hlasy a cena mandátu.** V Dátovom prehľade pod zoznamom subjektov bez mandátu a vo Vlastnom modeli v popise polkruhu pribudla veta: koľko percent hlasov by v scenári ostalo bez zastúpenia, koľko je to voličov pri účasti ako vo voľbách 2023 (2 967 896 platných hlasov) a koľko hlasov „stojí“ jedno kreslo (platné hlasy kvalifikovaných subjektov ÷ 150). Výpočet je v `lib/parliament.ts` (`wastedVotes`); nezaradená podpora iných strán doň nevstupuje.

**Peniaze od štátu 2023–2027.** V profile každej strany je blok s nárokom podľa zákona č. 85/2005 Z. z. (§ 25–28) z oficiálnych výsledkov 2023 a priemernej mzdy za rok 2022 (1 304 € podľa ŠÚ SR): príspevok za hlasy (1 % priemernej mzdy za hlas, jednorazovo, len nad 3 %), na činnosť (rovnaká suma v 48 mesačných podieloch) a na mandát (ročne 30-násobok mzdy za prvých 20 kresiel a 20-násobok za ďalšie, ≈ 48 mesiacov). Logika je v `lib/party-funding.ts`. Deväť subjektov má nárok, spolu ≈ 92,9 mil. € za obdobie (SMER 23,2, PS 18,3, HLAS 15,2, koalícia OĽANO a priatelia 9,4, KDH 7,2, SaS 6,6, SNS 5,9, Republika 3,7, Aliancia 3,4 mil. €). Koalícia OĽANO a priatelia (Hnutie Slovensko, KÚ, ZA ĽUDÍ) má nárok spoločný a v profiloch týchto strán sa ukazuje s vysvetlením; SME RODINA a Demokrati sú pod 3 %, Právo na pravdu a Strana vidieka v roku 2023 nekandidovali. Blok výslovne uvádza, že ide o nárok zo zákona, nie o vyplatené sumy (podmienkou je výročná správa, koaličná dohoda, skrátené obdobie). Kontrola dát overuje 9 oprávnených subjektov, SMER ~23 mil., súčet 85–100 mil. a typy nároku pri KÚ (koalícia), SME RODINA (pod hranicou) a Práve na pravdu (nekandidovala).

## 18. 9. 2026 — Hospodárenie: životná úroveň a porovnanie s EÚ (vetva porovnanie, Claude)

Záložka Hospodárenie má štyri pohľady: Po rokoch, Po vládach, Životná úroveň a EÚ a susedia (adresa `hv=living` / `hv=compare`). Pôvodné dva pohľady ostali bez zmeny.

**EÚ a susedia:** šesť rebríčkov za posledný rok, ktorý má Eurostat pre všetky celky (2025): saldo, dlh, rast HDP, inflácia, nezamestnanosť a HDP na obyvateľa v parite kúpnej sily — Slovensko, Česko, Poľsko, Maďarsko, Rakúsko, eurozóna a EÚ 27. Každý rebríček je zoradený od najlepšej hodnoty, Slovensko je zvýraznené a pri každom je poradie v rámci V4; úvodná veta hovorí, kde sme z V4 najlepší a najhorší. Priemery eurozóny a EÚ sú označené ako celky, poradie sa počíta len medzi krajinami V4.

**Životná úroveň:** HDP na obyvateľa v PPS (EÚ = 100, rad od 1995), minimálna mzda (stav v januári, od 1999), medián disponibilného príjmu a miera rizika chudoby (EU-SILC, od 2005), zamestnanosť 20–64 (od 2009), spolu s infláciou a nezamestnanosťou. Graf: stĺpce minimálnej mzdy zafarbené podľa vlády a čiara dobiehania EÚ. Karty vlád ukazujú stav na začiatku a na konci rovnakého rozpätia rokov ako pri dlhu. Eurostatov rad čistých príjmov (earn_nt_net) sme po kontrole vyradili: v roku 2024 má označený zlom radu (+30 % za rok), takže by roky neboli porovnateľné; skript ho zámerne nesťahuje a kontrola dát stráži, aby sa nevrátil.

Skript `fetch-public-finance.mjs` má všeobecný dekóder JSON-stat (viac krajín v jednom volaní) a HDP na obyvateľa berie v parite kúpnej sily (jednotka PC_EU27_2020_HAB_MPPS_CP), nie v bežných eurách. Overené na 375 px: prepínač sa zalomí do dvoch radov, karty rebríčkov 335 px, bez pretečenia.

## 18. 9. 2026 — logá strán v záložke Strany a pri vládach (vetva hospodarenie, Claude)

Dodatok v ten istý deň: logo je v pravom hornom rohu karty vo výške 72 px (na mobile 60 px), šírka podľa tvaru značky do 150 px, aby široké wordmarky neboli miniatúrne v štvorci. Pribudli logá KÚ (symbol z webu smekonzervativci.sk) a Strany vidieka (SVG z webu strany); ĽSNS nemá funkčný web — kotlebovci.sk neodpovedá a pôvodná doména naseslovensko.net patrí inému majiteľovi (stránka o online kasínach) — preto je jej logo z Wikimedia Commons, čo je uvedené v registri lôg aj v O dátach. Logo má všetkých 16 sledovaných subjektov. Overené na 375 px: karty 335 px široké, bez prekrytia skratky a loga, bez horizontálneho pretečenia.

Karty strán v záložke Strany majú v monograme logo strany namiesto farebnej bodky (rovnaké súbory a zdroje ako bočná lišta, kredit v O dátach); bodka ostáva pri stranách bez loga (KÚ, ĽSNS, Strana vidieka). V Hospodárení má každá vláda koaličné strany ako riadok štítkov: logo, ak strana existuje dodnes (OĽANO nesie logo dnešného Hnutia Slovensko), inak monogram vo farbe z registra neaktívnych strán; zloženie vlád je v `cabinets` štruktúrované a kontrola dát overuje, že každý odkaz vedie na existujúcu stranu s logom alebo do registra neaktívnych.

## 18. 9. 2026 — Hospodárenie: saldo a dlh po rokoch a po vládach (vetva hospodarenie, Claude)

Nová záložka Hospodárenie (`?v=finance`, pohľad `hv=years|governments`) ukazuje, koľko verejná správa každý rok minula nad svoje príjmy a koľko dlhu sa nazbieralo: saldo a hrubý maastrichtský dlh (v % HDP aj v €), saldo bez úrokov, úroky, príjmy a výdavky verejnej správy, dlh na obyvateľa, reálny rast HDP, nezamestnanosť a inflácia. Rad 1995–2025.

Zdroj je jeden: Eurostat (verejné API bez kľúča), ktorý zverejňuje údaje Štatistického úradu SR podľa ESA 2010 — datasety gov_10dd_edpt1 (notifikácia deficitu a dlhu, apríl 2026), gov_10a_main, nama_10_gdp, une_rt_a a une_rt_a_h (nezamestnanosť pred 2009 z historického radu), prc_hicp_aind, demo_pjan. Skript `scripts/fetch-public-finance.mjs` ich stiahne a zapíše do `lib/public-finance.data.ts` aj s dátumami aktualizácie; logika je v `lib/public-finance.ts`.

Vlády od vzniku SR sú v `cabinets` (dátumy podľa histórie vlád na vlada.gov.sk). Rok, v ktorom sa vlády striedali, sa medzi ne delí podľa dní vo funkcii (deň výmeny patrí novej vláde); priemerné saldo, súčet salda a zmena dlhu za vládu sú vážené týmto podielom. Pravidlo aj jeho hranice (rozpočet schvaľuje predchádzajúca vláda, krízové roky) sú vysvetlené priamo na stránke a krízové roky majú v tabuľke kontext (bankové sanácie 1999–2000, euro a finančná kríza 2009, pandémia 2020–2021, energetická kríza 2022–2023).

Dlhová brzda: horný limit podľa ústavného zákona č. 493/2011 Z. z. (60 % HDP, od 2018 o 1 p. b. ročne nižší až po 50 % v 2027) je v grafe ako prerušovaná čiara a v KPI ako odstup dlhu od limitu; sankčné pásma sú opísané zjednodušene s odkazom na zákon a RRZ. Kontrola dát overuje súvislosť rokov, medze hodnôt, súlad dlhu v € a v % HDP, nadväznosť vlád a to, že podiely roka dávajú 1.

## 18. 9. 2026 — register káuz vypnutý (vetva kauzy-vypnute, Claude)

Sekcia Kauzy sa nikde nezobrazuje: zmizla záložka v navigácii, dlaždica v mobilnom rozcestníku aj blok „Kauzy v registri" v profile strany. Adresa `?v=cases` otvorí Prehľad a odkaz z profilu na register je neaktívny.

Nič sa nemazalo. Register 42 prípadov, výpočet závažnosti aj kontroly dát ostávajú v repozitári nedotknuté a naďalej ich preveruje `verify-data`. Vypína ich jediný prepínač `casesEnabled` v novom module `lib/features.ts`; prepnutím na `true` sa všetko vráti tam, kde to bolo.

Prepínač je zámerne v module bez dát, lebo register aj jeho komponenty sa teraz načítavajú dynamicky. Kým je vypnutý, prehliadač ich vôbec nedostane: hlavný balík stránky klesol zo 417 na 356 KB a texty káuz sú v samostatnom súbore, o ktorý stránka nikdy nepožiada. Komponent `PartyCases` sa preto presunul z `components/party-profile-overview.tsx` do `components/political-cases.tsx`, aby profil strany register neimportoval. Kontrola dát stráži, že na vypnutú sekciu nevedie odkaz ani statický import.

## 18. 9. 2026 — Šutaj Eštok a Karas z fotoarchívu Rady EÚ (vetva fotky-commons, Claude)

Chýbajúce portréty sme hľadali mimo Wikimedia Commons. Matúš Šutaj Eštok má fotografiu z fotoarchívu Rady Európskej únie (newsroom.consilium.europa.eu, zasadnutie Rady pre spravodlivosť a vnútro, december 2023, originál 6240 × 4160). Rada EÚ dovoľuje reprodukciu obsahu, ak je uvedený zdroj, neskreslí sa pôvodný význam a každá zmena je označená — kredit preto znie „© Európska únia, 2023" a poznámka výslovne uvádza, že ide o výrez redakcie. Commons tieto súbory odmieta (v júni 2026 navrhol na vymazanie aj staršiu Eštokovu fotografiu), lebo podmienka o neskreslení nedovoľuje ľubovoľné odvodené diela; pre naše použitie — neupravený portrétový výrez s kreditom — podmienky spĺňame.

Z rovnakého archívu je teraz aj Viliam Karas (Rada pre spravodlivosť, december 2022, originál 3817 × 2545). Nahradil snímku z televíznej relácie na YouTube (630 × 770), ktorá bola najslabšou fotografiou v celom výbere.

Michal Šipoš a Zoroslav Kollár zostávajú pri monograme. Prehľadali sme Wikimedia Commons (hľadanie, kategórie aj text stránok súborov), Flickr s filtrom licencií Creative Commons, agregátor Openverse, fotoarchív Rady EÚ a oficiálne portréty Európskeho parlamentu — ani jeden z nich nemá voľne použiteľnú fotografiu. Videá pod licenciou CC BY, ktoré YouTube k menám ponúka, pochádzajú od kanálov bez preukázateľných práv k záberom, preto sme z nich snímku nebrali.

Spolu je v `public/people` 63 súborov WebP (480 KB) pre 21 osobností.

## 17. 9. 2026 — fotografie osobností z Wikimedia Commons (vetva fotky-commons, Claude)

Portréty v profiloch strán už nepochádzajú z webov strán (tie mali „všetky práva vyhradené“, SNS výslovne vyžaduje súhlas), ale z Wikimedia Commons. Pre 23 osobností sme cez Wikidata (vlastnosť P18) a Commons API dohľadali súbor, autora, licenciu a rok vzniku a skontrolovali stránku súboru: VRT tiket pri Šimečkovej fotografii od PS je potvrdený, Rašiho fotografiu sme vymenili za CC0 portrét z roku 2024, Gubíkov portrét je náš výrez z konferenčnej fotografie (CC BY 4.0). Použitých je 20 fotografií: Creative Commons (BY, BY-SA, CC0), voľné dielo vlády USA (Kaliňák, Naď) a oficiálne portréty Európskeho parlamentu (Uhrík, Mazurek) pod podmienkami ďalšieho použitia EÚ.

Bez fotografie zostali traja: Matúš Šutaj Eštok (oba súbory na Commons sú z webu Rady EÚ a od júna 2026 navrhnuté na vymazanie pre nejasnú licenciu), Michal Šipoš a Zoroslav Kollár (na Commons nie je voľne licencovaná fotografia). Na ich mieste je monogram a v profile poznámka „Bez voľne licencovanej fotografie“.

Dáta: `lib/party-profiles.json` má pri každej osobe `imageSource` (stránka súboru na Commons), `imageAuthor`, `imageLicense`, `imageLicenseUrl`, `imageYear` a `imageNote`. Kredit sa zobrazuje pri každom medailóne (Foto: autor, rok · licencia) a súhrnne v záložke O dátach v novej sekcii Fotografie osobností, aj s odkazom na text licencie. Kontrola dát vyžaduje pri použitej fotografii existujúci súbor, zdroj na Commons a úplný kredit, pri chýbajúcej dôvod. Rok vzniku fotografie neoznačuje aktuálnosť funkcie (Kotleba 2010, Danko a Krajniak 2018).

Kvalita (dodatok v ten istý deň): prvé nasadenie použilo náhľady z Commons (500 px, JPEG) a prehliadač ich v profile zmenšoval päťnásobne, čo pôsobilo kockovito. Teraz sa portréty režú a zmenšujú vopred zo súborov v plnom rozlíšení (sharp, Lanczos; výrez s pomerom 0,82 a kotvou 22 % zhora ako v CSS) na tri hustoty 96/192/288 px vo WebP a komponent ich ponúka cez srcset; 60 súborov má spolu 445 KB (pôvodné fotky z webov strán mali 6,4 MB).

## 14. 9. 2026 — desktopové body z kritiky (vetva desktop, Claude)

Úvodný odsek už neopakuje čísla, ktoré sú hneď pod ním na kartách. Zostali dve vety: kto by mal väčšinu a že priradenie Republiky ku koalícii a Hnutia Slovensko k opozícii je redakčný predpoklad, teraz aj s ich počtom kresiel. Zoznam zmien je na desktope v dvoch stĺpcoch a nadtitulok je kratší. Výsledok pri 1440 px: úvodný stĺpec z 961 na 860 px, tlačidlo Preskúmať prieskumy z 906 na 815 px (nad zlomom obrazovky), karty Zodpovednosť a Parlament z 1166 na 1065 px. Na mobile sa karta parlamentu posunula z 1384 na 1311 px.

Karty strán ukazujú ako hlavné číslo Model Mandát (vážený priemer) a hodnotu agentúry ako druhý riadok, takže sa už nelíšia od pásu strán a bočnej lišty. Dekoratívna šípka v rohu karty, ktorá vyzerala ako cieľ, ale klikateľná nebola, je preč. Hlavička profilu strany má hodnotu z agregátu hneď pri názve, nie až po sekcii o ľuďoch.

Drobné písmo: podlaha 11,5 až 12 px na desktope pre panel správ, kartu zodpovednosti, bočnú lištu a monogramy; počet textov pod 12 px na úvode klesol zo 165 na 130 (zvyšok sú legendy grafov a tabuliek). V záložke Prieskumy je nadpis Archív meraní nad grafom, takže poradie nadpisov na mobile začína H1 a nie H2.

## 14. 9. 2026 — Mobilný Prehľad: aktuálne karty a rozcestník (Claude)

Na mobile do 760 px Prehľad ukazuje len aktuálny obsah v tomto poradí: pás strán, vydanie (hlavná správa, štyri čísla, čo sa zmenilo), Parlament dnes s prepínačom, Politika v krátkosti (dve správy), Zodpovednosť (zbalená) a rozcestník „Ďalej na webe“ s ôsmimi dlaždicami (Prieskumy, Strany, Kauzy, Vlastný model, Dátový prehľad, Programy, Správy, O dátach). Sekcie, ktoré na mobile duplikovali záložky (graf podpory, posledné meranie každej agentúry, ukážka modelu, ďalšie pohľady, edičný pruh), sú na mobile skryté; graf podpory (agregátor) je na mobile v záložke Prieskumy nad archívom, tlačidlo Preskúmať prieskumy tam na mobile prepne. Desktop sa nemení. Komponent components/overview-directory.tsx.

## 14. 9. 2026 — titulná strana ako vydanie (vetva obalka, Claude)

Doplnenie na žiadosť Petra (14. 9. večer): hlavné hodnotenie v titulku a číslach ráta s partnermi, v texte „Koalícia s Republikou“ a „Opozícia s Matovičom“ (Igor Matovič vedie Hnutie Slovensko); dnešné bloky bez partnerov (SMER, HLAS, SNS 48 · PS, KDH, SaS, Demokrati 64) ostávajú ako druhý pár čísel a v texte. K 7. 9. 2026: koalícia s Republikou 70 kresiel, opozícia s Matovičom 80, teda väčšina. Priradenie partnerov je redakčný predpoklad podľa lib/blocs.ts, slovné tvary v lib/edition.ts (partnerWording).

Úvod Prehľadu začína hlavnou správou počítanou z dát namiesto sloganu: kreslá vládnej koalície (SMER, HLAS, SNS) a opozície (PS, KDH, SaS, Demokrati) v scenári z Modelu Mandát, počet kresiel ostatných subjektov, kto by o nich rozhodoval, a varianty s voliteľnými partnermi (REPUBLIKA ku koalícii, Hnutie Slovensko k opozícii; redakčný predpoklad podľa lib/blocs.ts). Pod titulkom sú štyri čísla (koalícia, opozícia, ostatní, väčšina 76) so zmenou za 30 dní a zoznam „čo sa zmenilo“: zmena kresiel blokov, tri najväčšie pohyby podpory v p. b., prechody cez hranicu 5 % s kreslami pred a po, počet a agentúry nových meraní. Porovnávací bod je bod agregátu najbližší k 30 dňom pred posledným meraním (dnes 11. 8. 2026 oproti 7. 9. 2026). Všetko je označené ako scenár, nie predpoveď; výpočet v lib/edition.ts, testy vo verify-data (súčet 150, okno 20 až 40 dní, poradie pohybov, konzistencia prechodov). Dvojdielne slogany nahradené konkrétnymi titulkami: Archív meraní, Strany a ich profily, O dátach a metodike, Vlastný model parlamentu, Posledné meranie každej agentúry, Zostavte vlastnú koalíciu, Ďalšie pohľady, Programy strán vtedy a dnes. Pôvodný slogan „Politika v číslach. Vy v obraze.“ z úvodu odchádza; značka a princípy (Nezávisle · So zdrojmi · Bez reklamy) ostávajú.

## 14. 9. 2026 — mobilná verzia (vetva mobil, Claude)

Zmeny rozsahu a správania, dáta sa nemenia. Mobil do 760 px: fixná spodná lišta strán je nahradená posuvným pásom strán na začiatku Prehľadu (rovnaké poradie a hodnoty Modelu Mandát, monogram viditeľný do načítania loga), panel strán tak už neberie 83 px výšky; pás záložiek má náznak posunu a aktívna záložka sa posunie do stredu; vo Vlastnom modeli je pri posúvaní vstupov prilepený riadok s kreslami štyroch najväčších strán a stavom väčšiny; Politika v krátkosti ukazuje dve najnovšie správy bez vnútorného posúvania; drobné popisy v kartách úvodu majú minimálne 12 px. Všetky šírky: knižnica grafov (Recharts) sa načíta až pri prepnutí na Trend alebo pri grafe v Dátovom prehľade (samostatné moduly components/trend-chart.tsx a components/archive-chart.tsx), predvolený filter Správ je Celý výber (Tento týždeň bol v pondelok prázdny), doplnené Open Graph a Twitter značky, theme-color a public/manifest.webmanifest.

## 13. 9. 2026 — responzívne poradie a mobilné stránkovanie

Mobilný úvod má poradie úvodník → Politika v krátkosti → Parlament dnes → Zodpovednosť za stav krajiny; desktop si zachováva doterajšie rozloženie. Pod 600 px sa karta Zodpovednosť najprv zobrazí v skrátenej podobe a zvyšok sprístupní postupným rozbalením. Na mobile register káuz stránkuje po 10 prípadoch a archív prieskumov po 12 meraniach, kým desktop naďalej zobrazuje celé zoznamy. Opravené je aj vodorovné pretečenie filtrov v Kauzách. Po záverečnej kontrole začína jednostĺpcový úvod pri 1100 px, aby sa karty okolo 1024 px neorezávali, aktívna navigácia si pri hoveri drží papierovo-zelený kontrast a mobilné ciele rozbalenia, štítkov a zdrojov majú 44 px.

Overenie: TypeScript (`tsc --noEmit`), dátové invarianty, ESLint a produkčný build prešli. V prehliadači boli skontrolované šírky 390 px, 320 px a 1440 px vrátane poradia kariet, rozbaľovania, stránkovania a vodorovného pretečenia.

## 13. 9. 2026 — neaktívne strany v karte Zodpovednosť za stav krajiny (Claude)

Pod stupňami dnešných strán je rozklikávacia lišta „Neaktívne strany“ (11) so stranami, ktoré boli od 1. 1. 1993 vo vláde, ale už nekandidujú alebo sa zlúčili: HZDS 27 % (Mečiarove vlády na čele), SMK 23 %, Most-Híd 17 %, SDKÚ 16 % (na čele vždy), SDĽ 14 %, SDK 12 % (na čele), SOP 12 %, ZRS 11,5 %, ANO 8,5 %, DÚ 2,2 % (na čele, vláda Jozefa Moravčíka), Sieť 1,3 %. Hranice období sú rovnaké ako pri dnešných stranách; výnimky s poznámkou: ANO končí 24. 8. 2005 odchodom Pavla Ruska z kabinetu, Sieť 1. 9. 2016 novou koaličnou dohodou bez nej. Čas predchodcov nástupcom nepripočítavame (SMK a Most-Híd → Aliancia, SDĽ a SOP → SMER, DÚ a SDK → SDKÚ), KDH je zarátané aj samostatne popri SDK. Drobných partnerov (RSS, NDS) neuvádzame; farby neaktívnych strán sú orientačné. Dáta: lib/government-tenure-inactive.ts (zdroje: sk Wikipédia k jednotlivým vládam, história vlád SR), výpočet inactiveResponsibilityRows v lib/responsibility.ts, testy vo verify-data (rozsah dátumov, zdroje, HZDS najdlhšie, SDKÚ vždy na čele).

## 13. 9. 2026 — karta Zodpovednosť za stav krajiny v úvode (Claude)

Stredný stĺpec úvodu má nad kartou Parlament dnes novú kartu Zodpovednosť za stav krajiny: pre každú dnešnú stranu podiel času vo vláde od vzniku SR 1. 1. 1993 k dátumu kontroly (dni v koalícii alebo v kabinete / všetky dni), tmavšia časť pruhu = obdobia s premiérom z danej strany. Škála podľa podielu: rozhodujúca od 40 %, významná od 25 %, čiastočná od 10 %, okrajová pod 10 %, bez účasti. Výsledok k 13. 9. 2026: SNS 47 %, SMER 44 % (celý čas na čele vlády), KDH 29 %, SaS 12,5 %, Hnutie Slovensko 9,3 % (na čele), SME RODINA 9,3 %, ZA ĽUDÍ 9,3 %, HLAS 8,6 %, Strana vidieka 4,5 %, Demokrati 0,6 %; bez účasti PS, REPUBLIKA, ĽSNS, ALIANCIA (predchodcov SMK a Most-Híd nepočítame, poznámka je pri karte), KÚ, Právo na pravdu. Meradlom je čas pri moci, nie hodnotenie výsledkov; strany vládnu súčasne, súčet nie je 100 %. Dáta a výpočet: lib/responsibility.ts nad existujúcim lib/government-tenure.ts (zdroje: história vlád SR, NR SR, STVR, prezident.sk). Rozloženie úvodu od 1700 px: jeden rad úvodník | Zodpovednosť | Parlament dnes | Politika v krátkosti s rovnakou výškou kariet (panel správ sa posúva vnútri); pod 1700 px úvodník cez dva stĺpce, karty pod ním, správy vpravo; pod 960 px jeden stĺpec. Karta zodpovednosti je zoskupená podľa stupňa (jeden riadok na stranu: názov, pruh, podiel, celé roky). Odtiene kariet: zodpovednosť teplý pergamen (#f3efe2), parlament chladná šalvia (#e8f0ee), správy zelená (#e9eee1). Testy: rozsah podielov, poradie, škála.

## 13. 9. 2026 — register káuz pre všetky strany, závažnosť z faktorov (Claude)

Register káuz má 42 prípadov pre 15 zo 16 subjektov (KÚ bez doloženého prípadu): SMER 5, SNS 5, Hnutie Slovensko/OĽANO 5, ĽSNS 3, REPUBLIKA 3, SME RODINA 3, HLAS 3, Aliancia 3 (vrátane predchodcov Most-Híd a SMK), SaS 3, PS 3, ZA ĽUDÍ 2, KDH 2, Právo na pravdu 1, Strana vidieka 1, Demokrati 1. Každý prípad má dve vety zhrnutia, obdobie, väzbu na stranu, stav podkladov s dátumom v zdroji, reakciu a jeden zdroj; zdrojmi sú prehľady Nadácie Zastavme korupciu, Transparency International Slovensko, slovenská Wikipédia a správy o rozhodnutiach súdov (Denník N, SME, Pravda, TASR, TA3, STVR, SITA, Štandard). Rešerš vykonali dva agenty, texty prešli redakčnou kontrolou; pri troch prípadoch bola opravená väzba alebo označená nepriama väzba.

Závažnosť 1–10 sa už nezapisuje ručne: `lib/political-cases.ts` ju počíta zo stavu podkladov (kontroverzia 2, ukončené bez odsúdenia 2, zistenia investigatívy 3, obvinenie 6, právoplatný rozsudok 9) a piatich faktorov (+1 verejné peniaze, +1 najvyššia úroveň, +1 systémový problém, −1 historický prípad, −1 nepriama väzba, keď hodnotená osoba nie je predstaviteľ ani nominant strany). Výpočet je pri každom prípade viditeľný. Pribudol stav Ukončené bez odsúdenia a v záložke Kauzy prehľad podľa strán (počet, najvyššia závažnosť, rozdelenie podľa stavu) s filtrom jedným klikom. Dáta sú v `lib/political-cases.data.ts`; testy kontrolujú jedinečnosť, strany, stavy, dátumy, https zdroje a zhodu závažnosti s výpočtom.

## 13. 9. 2026 — širší panel správ a karta Parlament dnes v úvode (Claude)

Úvod má na šírkach nad 1500 px tri stĺpce: text s odpočtom, nová karta Parlament dnes a panel Politika v krátkosti rozšírený z 390 na 545 px s väčším písmom (nadpisy 15,5 px, text 12,5 px). Karta Parlament dnes (components/parliament-now.tsx) kreslí 150 kresiel z oficiálneho výsledku volieb 2023 v poradí koalícia vľavo, ostatní v strede, opozícia vpravo, s počtami 79 / 76 (väčšina) / 55, zoznamom strán podľa blokov, zdrojom ŠÚ SR a odkazom na scenáre. Pod 1500 px sa karta zaradí pod text, pod 960 px idú stĺpce pod seba. Obsah je o niečo širší: maximum 1760 px a menšie okraje. Overené na 1920, 1440 a 390 px bez pretečenia a bez chýb v konzole; TypeScript, ESLint aj detektor prešli.

## 13. 9. 2026 — správy, kauzy so závažnosťou a väzba na profily (dokončenie po Codexe, Claude)

Codex 13. 9. pridal panel Politika v krátkosti vpravo hore v úvode (mapa s odpočtom je vľavo pri nadpise), záložku Správy so siedmimi správami z týždňa 7.–13. 9. a filtrami a záložku Kauzy so štyrmi zdrojovanými prípadmi; závažnosť nechal neurčenú. Dokončené: závažnosť 1–10 je redakčné hodnotenie podľa zverejnenej stupnice v `lib/political-cases.ts` (východisko podľa stavu podkladov: kontroverzia 2, zistenia investigatívy 3, obvinenie 6, právoplatný rozsudok 9; úpravy +1 verejné peniaze, +1 najvyššia úroveň, +1 systémový problém, −1 starší prípad s osobami mimo funkcie), pri každom prípade je výpočet. Farebné pásma: 1–3 nízka, 4–6 stredná, 7–8 vysoká, 9–10 najvyššia; číslo a slovo sú vždy pri farbe. Prípady sú zoradené podľa závažnosti. Aktuálne hodnoty: Nástenkový tender 9, nákup na MV SR 5, dotácia FPU 4, Petrohrad 3.

Profil strany má sekciu Kauzy v registri (počet, rozdelenie podľa stavu, najvyššia závažnosť, zoznam so zdrojmi a odkaz na filtrované Kauzy). Filter strany v Kauzách je v adrese (parameter `kp`), takže odkaz z profilu aj zdieľanie zachovajú výber. Prázdny stav hovorí, že register je pilotný a nedokazuje neexistenciu káuz. Správy doplnené o dva záznamy z 12. a 13. 9. o termíne 30. septembra pre ministra Tarabu (TASR/Teraz.sk) a o jeho vyhlásení, že demisiu sám nepodá (Denník N). Zdroje pre kauzy zostávajú ručne overované články Nadácie Zastavme korupciu a správy o súdnych rozhodnutiach; automatický zber nie je zavedený.

Overenie: TypeScript, ESLint, dátové invarianty (nové testy závažnosti a väzby na strany), Impeccable detektor 0 nálezov, prehliadač 1440 px a 390 × 844 px bez vodorovného pretečenia, konzola bez chýb.

## 13. 9. 2026 — účasť dnešných strán vo vládach SR

Pribudol zdrojovaný modul `lib/government-tenure.ts` pre všetkých 16 sledovaných strán. Sčítava konkrétne intervaly od 1. januára 1993 a rozlišuje členstvo vo vládnej koalícii od neskoršej prítomnosti člena alebo nominanta strany v kabinete. Premenovanie OĽANO na Hnutie Slovensko súčet neprerušuje; vládne obdobia predchodcov Aliancie sa do jej hlavného čísla neprenášajú. Profil zobrazuje kompaktný údaj vpravo od ideologických štítkov a po otvorení presné obdobia, charakter účasti, poznámky a zdroje. Stav výpočtu je k 13. 9. 2026. Dátové testy kontrolujú úplné pokrytie strán, chronológiu, HTTPS zdroje a referenčné súčty SNS 15 rokov 11 mesiacov, SMER 14 rokov 10 mesiacov a KDH 9 rokov 9 mesiacov.

## 12. 9. 2026 — nový úvod, vlastný model a menšie strany

Na žiadosť používateľa nový vizuálny smer: horná navigácia, samostatný úvod, výsledky nad 1 %, jednoduchý zoznam pod 5 %, voľný výber strán a vlastný model s úpravou percent. Dvojpolkruh, Fableho bloky, trendy a detaily ostávajú v dátovom prehľade. Model nijakú kombináciu neodporúča a nemení pôvodné meranie; vstupy sa zatiaľ neukladajú medzi zobrazeniami.

Doplnené septembrové NMS: SNS **1,9 %**, ZA ĽUDÍ **1,6 %**, overené 12. 9. 2026 vo [vloženom grafe NMS](https://flo.uri.sh/visualisation/30183930/embed), filter September 2026, z [pôvodnej publikácie](https://nms.global/sk/volebny-model-september-2026/). Mandáty postupujúcich strán sa nemenia. Test chýbajúcej hodnoty používa ĽSNS; ZA ĽUDÍ má presnú hodnotu a zmenu −0,6 bodu.

TypeScript, ESLint, dáta a build prešli. HTTP náhľad vracia 200. Opravený tmavý fokus, rozsah slidera/pola a transformácia namiesto animácie šírky. Vizuálna kontrola a test klikov neboli dostupné pre nefunkčné spojenie CUA; nejde o vizuálne schválenú verziu. Podrobnosti v HANDOFF.

## 11. 9. 2026 — bloky koalícia a opozícia (časť 3a, Claude)

Pod dvoma polkruhmi je sekcia Koalícia a opozícia: pre voľby 2023 aj pre scenár vybranej agentúry ukazuje počet kresiel vládnej koalície (SMER, HLAS, SNS; koaličná zmluva podpísaná 16. 10. 2023, zdroj Denník N), opozičného bloku (PS, KDH, SaS, Demokrati) a ostatných, s pruhom 150 kresiel, značkou väčšiny 76 a štítkom pri dosiahnutí väčšiny alebo ústavnej väčšiny 90. Voliteľní partneri REPUBLIKA (ku koalícii) a Hnutie Slovensko (k opozícii) sú označený redakčný predpoklad; zapína ich čitateľ a stav je v adrese (parameter `b`). Pri voľbách 2023 sa Hnutie Slovensko počíta za historickú koalíciu OĽANO a priatelia. Nový modul `lib/blocs.ts`, komponent `components/bloc-bar.tsx`, článok Koalícia a opozícia v metodike, testy vo `verify-data` (2023: koalícia 79, opozícia 55, ostatní 16; s partnermi 79/71/0; každý scenár = 150). Opravené hydratačné varovania Reactu pri polkruhu: súradnice kresiel sa zaokrúhľujú na 6 desatinných miest, lebo server (workerd) a prehliadač počítajú sin a cos s rozdielom v poslednom bite.

## 11. 9. 2026 — dva polkruhy v mesačnom vydaní (časť 2, Codex)

Úvod má hlavičku vydania a porovnanie oficiálnych mandátov z volieb 2023 so scenárom jednej z agentúr AKO, FOCUS, INFOSTAT, IPSOS a NMS. Nový SVG komponent zobrazuje 150 bodov a textový zoznam s kreslami aj percentami. Poradie je zostupné podľa počtu kresiel, nie podľa politickej osi. Na mobile sú polkruhy pod sebou. Monogramy majú pripravený slot na existujúce lokálne logá; žiadne logá neboli prevzaté.

Zdroje sú pod oboma grafmi. Scenár vysvetľuje predpoklad 5 % pre každý subjekt, chýbajúcu podporu aj „iné“ bez dvojitého započítania, ukazuje subjekty bez mandátu a odkazuje na nový článok metodiky. Register zdrojov doplnený o ŠÚ SR. Výber agentúry zostáva v URL. Oficiálny polkruh nepredstavuje aktuálne poslanecké kluby a koalíciu OĽANO 2023 nezamieňa s dnešným Hnutím Slovensko.

Opravené produkčné balenie písma: pôvodné Latin a Latin Extended WOFF2 z Fontsource 5.3.0 spolu s OFL licenciou sú v `public/fonts`; CSS používa lokálne absolútne URL. Dátový model ani hodnoty meraní sa nemenili.

Overenie: TypeScript, dátové invarianty, ESLint a produkčný build prešli. Kontrola v prehliadači pri 1440 px a 390 × 844 px, 150 vykreslených kresiel na graf, prepínanie všetkých piatich agentúr, klávesnica Enter, obnovenie výberu a metodika. Bez pretečenia stránky; nové ciele ≥ 44 px. Impeccable: jediný nález je pôvodný navigačný pás aktívnej záložky; ponechaný. Nezávislá kontrola kódu potvrdila opravu registra. Zostáva upozornenie buildu na veľký JS chunk. Podrobné odovzdanie a rozsah kontroly sú v `../HANDOFF.md`.

## 11. 9. 2026 — dáta volieb 2023 a prepočet kresiel (časť 1 redizajnu vydania)

Nový modul `lib/parliament.ts`: oficiálne výsledky volieb do NR SR 2023 pre všetkých 25 kandidujúcich subjektov (platné hlasy, podiel v %, mandáty) prepísané z tabuliek Štatistického úradu SR NRSR2023_SK_tab03a.xlsx a NRSR2023_SK_tab04.xlsx, prepočet kresiel podľa § 68 zákona 180/2014 Z. z. (hranice 5/7/10 %, republikové volebné číslo, najväčšie zvyšky) a geometria polkruhu 150 kresiel. Prepočet z oficiálnych percent reprodukuje oficiálne rozdelenie 42/32/27/16/12/11/10, čo je zapísané ako test vo `verify-data`. Scenár z prieskumu je označený ako scenár, nie predpoveď; koalícia OĽANO a priatelia 2023 je evidovaná samostatne, nie ako rad Hnutia Slovensko. Zatiaľ bez zobrazenia na webe. Plán ďalších častí a rozhodnutia sú v `../HANDOFF.md`, produktový kontext v `../../PRODUCT.md`.

## 11. 9. 2026 — harden, adapt, typeset (Impeccable, Claude)

Po novej critique (29/40, dvaja hodnotiaci agenti) hneď opravené: mobilný prepínač agentúr je mriežka 3 + 2 bez posúvania, výber strán v grafe je v adrese (`l`), šípky v navigácii len presúvajú fokus (záložku prepne Enter), hlavičky porovnávacej tabuľky majú prístupné mená, Strany majú skrytý nadpis druhej úrovne, kompaktné zdroje píšu mesiace malým písmenom, odseky majú mieru 72–80 znakov, odkazy na zdroje majú aspoň 24 px aj na desktope. Otvorené P1: profil strany ako trend naprieč agentúrami (layout) a legenda grafu ako viditeľné ovládanie (clarify). Vizuálny systém je zachytený v `../DESIGN.md` a `../.impeccable/design.json`.

Stav rozhrania je v adrese: záložka (`v`), agentúra prehľadu (`a`), obdobie grafu (`p`), graf/tabuľka (`m`), filter archívu (`f`), hľadanie (`q`, `s`), otvorené meranie (`d`) a otvorená strana (`strana`). Predvolené hodnoty sa nezapisujú, neznáme hodnoty sa ignorujú. Zmena záložky vytvorí položku histórie, ostatné zmeny ju nahradia; tlačidlá Späť a Dopredu a obnovenie stránky zachovajú výber. Názov karty prehliadača nesie názov záložky. Detail merania ukazuje doménu publikácie a záložný odkaz na archív agentúry pre prípad, že pôvodný odkaz prestane fungovať. Prehľad má poistku pre agentúru bez merania a pre titulok bez prepísaných hodnôt.

Mobil: vodorovná navigácia záložiek má tieň na okraji, ktorý ukazuje skrytý obsah, a po prepnutí sa aktívna záložka posunie do zobrazenia; bočné panely majú na konci tlačidlo Zavrieť pre palec; pridaná tlačová verzia (bez ovládacích prvkov, s vypísanými adresami zdrojov).

Písmo: namiesto systémového Segoe UI (na iných systémoch padalo na Arial) je lokálne hostované písmo IBM Plex Sans Variable (balík `@fontsource-variable/ibm-plex-sans` 5.3.0, licencia SIL Open Font License 1.1, súbory v `node_modules`, žiadne externé požiadavky). Načítavajú sa iba subsety latin a latin-ext podľa použitých znakov; slovenská diakritika je pokrytá. Záložný rad ostáva Segoe UI, Arial.

## 11. 9. 2026 — dizajnový prechod Impeccable (bolder + polish)

Prehľad má nový titulok: namiesto slogan-u ukazuje tri najvyššie hodnoty posledného merania vybranej agentúry so vzorkou, obdobím zberu a aktívnym odkazom na pôvodnú publikáciu. Titulok sa mení spolu s prepínačom agentúr, grafom a rebríčkom; agentúry sa naďalej nepriemerujú. Slogan „Rozumieť číslam. Vidieť súvislosti.“ a veľké číslo 35 z úvodu odišli, počet meraní zostáva v navigácii a pri odkaze na archív.

Celý web: zjednotené sekundárne farby textu na dva tokeny (`--text-2`, `--text-3`) s kontrastom aspoň 4,5 : 1 na každom svetlom podklade (predtým 37 kombinácií pod hranicou WCAG AA); odstránené kapitálkové nadtitulky nad nadpismi a poradové čísla sekcií v metodike; vypnuté strany v legende grafu majú prázdny štvorček namiesto zošednutého textu; monogramy strán majú tmavý text a farebný štvorček; dátum overenia dát je jedna konštanta `dataVerified` v `lib/polls.ts`; hover stavy platia len na zariadeniach s kurzorom; textové tlačidlá, odkazy na zdroje a tlačidlo zatvorenia bočného panela majú na mobile aspoň 44 px; jednotný fokus pre tlačidlá, odkazy aj polia. `globals.css` bol prepísaný do čitateľnej podoby bez duplicitných prepisov.

Overenie: TypeScript, ESLint, dátové invarianty, Impeccable detektor (0 nálezov), vizuálna kontrola 1440 px a 390 × 844 px. Stav rozhrania (záložka, agentúra, filtre) stále nie je v URL; to je samostatná ďalšia etapa.

## 11. 9. 2026 — päť požadovaných agentúr a nový vizuál

Archív rozšírený z 10 na 35 meraní: 9 NMS, 8 AKO, 6 IPSOS, 6 INFOSTAT a 5 FOCUS; zachované augustové meranie SANEP. Konkrétne publikácie sú pri každom zázname. FOCUS bol prepísaný z pôvodných PDF, vrátane septembrovej správy. INFOSTAT máj bol skontrolovaný aj na vykreslenej strane 87 súhrnnej správy NÁZORY 2/2026.

Metadáta podporujú neznámy dátum publikácie a neznámu vzorku. Máj a jún IPSOS sú výslovne označené ako prepis historických stĺpcov augustovej správy. Archív sa radí podľa konca zberu. Kategória „iné strany“ sa ukladá samostatne. Pridané tri malé politické subjekty, spolu 16. Súčet čiastkových výsledkov sa nenormalizuje na 100 %.

Rozsah a nedokončené vlny sú v `SOURCES-2026.md` a v novej sekcii Agentúry a pokrytie dát. Apríl IPSOS a február/apríl INFOSTAT sa zatiaľ nezapočítavajú. Pridanie zdroja nie je považované za univerzálne licenčné povolenie.

Prepracované rozloženie s bočnou navigáciou, tmavým rebríčkom, väčším grafom, prepínačom piatich agentúr a porovnaním ich posledných meraní. Časová os používa skutočné dátumy; graf, rebríček, predchádzajúce meranie aj odkazy sa menia spolu. Zachovaná knižnica programov a detailné profily. Opravená výška položiek navigácie zistená pri vizuálnej kontrole.

Overenie: TypeScript, ESLint upravených modulov, dátové invarianty, zostavenie, kontrola pomenovaných importov 28 živých JS modulov a vizuálna kontrola desktopu/mobilu. Vyrovnávacie pamäte dev/build zostali oddelené.

## 10. 9. 2026 — druhá lokálna edícia

Pridané tri merania AKO: máj, jún a júl 2026. V kombinácii s augustovým záznamom vznikol samostatný trend AKO. Zdrojom sú tlačové správy agentúry pre JOJ 24, nie porovnávacie stĺpce prevzaté z neskoršieho prieskumu.

| Meranie | Zber | Publikácia | Celková vzorka | Zdroj |
|---|---|---|---|---|
| AKO máj | 14. – 21. 5. 2026 | 29. 5. 2026 | 1 000 | [Tlačová správa](https://ako.sk/wp-content/uploads/2026/06/ag.AKO_VOLEBNE-PREF-MAJ-2026-tlacova-sprava.pdf) |
| AKO jún | 9. – 18. 6. 2026 | 25. 6. 2026 | 1 000 | [Tlačová správa](https://ako.sk/wp-content/uploads/2026/06/ag.AKO_VOLEBNE-PREF-JUN-2026-tlacova-sprava-FF.pdf) |
| AKO júl | 8. – 14. 7. 2026 | 23. 7. 2026 | 1 000 | [Tlačová správa](https://ako.sk/wp-content/uploads/2026/07/ag.AKO_VOLEBNE-PREF-JUL-2026-tlacova-sprava.pdf) |

Výsledky sú z rozhodnutých voličov; podiel rozhodnutých v celej vzorke sa ukladá v poznámke každého merania. Malé subjekty pod 1 % zatiaľ nie sú prepísané. Mesačný adresár v URL neurčuje dátum publikácie: májový dokument je uložený v júnovom adresári.

Pridaná knižnica šiestich oficiálnych programových dokumentov: Demokrati, OĽANO a PRIATELIA (historicky pri Hnutí SLOVENSKO), KDH, PS, REPUBLIKA a SMER. Presné odkazy, zdroj časového zaradenia a dátum overenia sú v `lib/programmes.ts`. Knižnica rozlišuje rok volieb od obdobia, na ktoré program smeruje. Živej stránke REPUBLIKY bez overenej verzie nie je automaticky pridelený rok 2023.

Nájdená bola aj [primárna publikácia FOCUS zo septembra 2026](https://www.focus-research.sk/archiv/volebne-preferencie-politickych-stran-september-2026/). Číselné výsledky sú vo vloženom grafe. Ich import nebol dokončený, preto sa FOCUS zatiaľ nezapočítava do archívu ani počtu agentúr. Prieskum nevytvárame z prepočtu kresiel.

## 10. 9. 2026 — prvá lokálna edícia

Sedem meraní: NMS máj až september 2026, AKO august 2026, SANEP august 2026. Každý záznam má konkrétnu publikáciu. Vzorka NMS jún bola počas kontroly pred odovzdaním opravená na 1 002 podľa metodiky agentúry.

Zmeny oproti predchádzajúcemu meraniu sa počítajú z publikovaných zaokrúhlených percent. Septembrový slovný komentár NMS pri niektorých stranách uvádza iný rozdiel; aplikácia používa percentá a nesúlad uvádza v detaile. Chýbajúce výsledky nie sú nuly.
# 2026-09-12 — vážený agregátor a časovo označené programy

- Pridaný Model Mandát: týždenná plynulá časová rada z najnovšieho merania piatich agentúr v 60-dňovom okne, časová váha s 30-dňovým polčasom, odmocnina vzorky a orientačné 95 % modelové pásmo.
- Aktuálny bod odkazuje priamo na vstupné merania AKO, FOCUS, INFOSTAT, IPSOS a NMS; SANEP zostáva mimo agregátu. Hero a vlastný model používajú agregát, pôvodné rady zostali zachované.
- Programy majú stav archív 2023 / aktuálna iniciatíva / aktuálna stránka bez ročníka / návrh 2027 / schválený program 2027. Bez výslovného zdroja sa posledné dva stavy nepoužívajú.
- Doplnené TRESK PS, programové piliere Demokratov, aktuálna stránka KDH, rodinný balík HLAS, živá nedatovaná stránka Republiky a archívny rezortný program HLAS 2023.
- Nová tematická matica umožňuje porovnať 2–3 strany. Pri chýbajúcom aktuálnom zdroji zobrazuje medzeru namiesto historického postoja.
- Overenie: TypeScript, ESLint, dátové invarianty, produkčný build, Impeccable detector, desktop a 390 × 844 px.
