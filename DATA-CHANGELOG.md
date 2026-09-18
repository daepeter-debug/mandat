# Evidencia údajov a rozsahu

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
