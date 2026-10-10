# Zmeny Mandátu

## 10. október 2026 — Čitateľné Miesta a stabilnejšie otáčanie hry

- Zoznam Miesta v šírkovom pláne slávnosti má vyhradený priestor pod herným ovládaním; názov štvrte a tlačidlo Mapa už neležia nad popismi. Zoznam sa roluje samostatne na svetlom podklade.
- Fullscreen sleduje viditeľný viewport, zmenu orientácie, návrat do aplikácie a natívny fullscreen. Skrytá mapa nepreberá nulové rozmery a SVG má explicitnú výšku podľa kamery.
- Zachované ovládanie z 2. októbra, pravidlá, uloženie aj ostatné časti webu. Overené opakované otočenie, malé mobilné rozmery, zbalenie panela a desktop. Fyzický Safari nebol k dispozícii; občasný polovičný obraz sa v emulácii nereprodukoval.

## 10. október 2026 — Návrat na pôvodné fullscreen ovládanie hry

Na výslovný Petrov pokyn obnovené štyri UI súbory Malej republiky presne z 1aa563e (posledná fullscreen úprava 2. októbra). Odvolané dokovanie a dynamický tretí prepínač z 2072c55. Herné jadro a uloženie zachované, ostatné časti webu nedotknuté.


## 10. október 2026 — Prehľadná stavebná mapa na mobile

- Detail budovy, katalóg a potvrdenie stavby v šírkovom hernom pláne používajú pravý panel; mapa ostáva odkrytá v pôvodnej veľkosti.
- Prepínanie Úlohy/Legenda/aktuálny výber zachová rozpracovanú stavbu, panel možno zbaliť. Rovnaká úprava pre mapu slávnosti.
- Escape zavrie iba kartu; začatie stavby/cesty odstráni starý detail. Herné pravidlá a uloženie bez zmeny.

Overenie: 31 verify skriptov, TypeScript, ESLint, dark check a build. UI pri 667×375, 844×390, 375×844 a 1280×900, skutočná lokálna stavba a slávnosť, bez pretekania a chýb konzoly. Detector raz: []; inline review: ship. Fyzický Safari neoverený.


## 10. október 2026 — Modelový lístok a meniaca sa obálka

- Vlastný model má papierový lístok, autentické logá, presné percentá, dotykové kroky a okamžitý prepočet parlamentu. Pôvodné výpočty, koalície, reset a pravidlá platnosti zostávajú.
- Na mobile tlačidlo Parlament odkryje výsledok; kompaktnejší úvod dáva priestor ovládaniu.
- Úvod automaticky vyberá najnovší známy publikovaný obsah: deň v politike, prieskum alebo archivované hlasovanie. Ručne možno prepnúť všetky tri obálky, vždy s vlastným dátumom a zdrojom.
- Správy majú klikateľný prehľad tém dňa, prieskum presné hodnoty agentúry a porovnávaciu rysku, hlasovanie súčet 150 hlasov. Pôvodný Model Mandát a 3D náhľad zostávajú pod obálkou.

Overenie: 31 verify skriptov, TypeScript, ESLint, tmavý režim a build prešli; po oprave animácie opakovaný nový test a technické kontroly. QA 375/402/1280 px v oboch motívoch, bez vodorovného pretekania, zmena/reset/neplatný súčet, klávesnica a detail článku. Jeden detektor upozornil na animáciu šírky, nahradenú transformáciou; detektor neopakovaný. Inline review implementátora: ship. Fyzický Safari neoverený.


## 10. október 2026 — Redakčné profily a hlasovacia stopa

- Profily strán majú autentické logo, jemné pozadie zo straníckej farby, väčšie existujúce licencované portréty a viditeľnú časovú os účasti vo vláde. Podpora ostáva rovnakým modelom ako v ľavom paneli; história vlády naďalej uvádza stav podkladov k 13. 9. 2026.
- Aktuálne návrhy a iniciatívy sú oddelené od archívu programov volieb 2023. Chýbajúci overený aktuálny dokument sa neprezentuje ako neexistujúci program.
- Hlasovacia stopa poslanca nahrádza drobný pruh interaktívnou mozaikou: rok, najviac 42 hlasovaní na stránku, skutočný dátum, hlas a názov. Značka ukazuje hlasovanie inak ako klub podľa pôvodnej definície. Detail odkazuje do sály a priamo na NR SR.
- Mobilné políčka majú ciele aspoň 40 px; detail sa po výbere podľa potreby odkryje nad spodnou navigáciou. Obmedzený pohyb a klávesnica zachované. Žiadne nové politické podklady, skóre poslancov ani zmeny 3D scény.

Overenie: všetkých 30 verify skriptov, TypeScript, ESLint, generovaný tmavý režim a produkčný build prešli. Nový test kontroluje všetkých 169 poslancov, totožnosť hlasovacích ID, nečlenstvo, hlasy, rozdiel oproti klubu a stránkovanie bez strát či duplicít. Vizuálna QA: 375/402/1280 px, oba motívy, zdroje portrétov, programy a skutočné hlasovanie 58044. Detektor raz: `[]`; inline dokončovací review implementátora: ship, bez nezávislého overovania. Fyzický iPhone/Safari zatiaľ neoverený.

## 10. október 2026 — Kluby pri oblúku a vizitky poslancov

- Logá a počty klubov priamo pri 2D oblúku, s jemnými farebnými sektormi a klikom na zvýraznenie. Počty aj polohy vychádzajú zo skutočne obsadených kresiel.
- Vizitka zvoleného poslanca pri kresle na desktope a pod sálou na mobile: meno, klub, hlas pri zvolenom hlasovaní a skratka do pôvodného profilu.
- Osem existujúcich licencovaných fotografií s autorom, licenciou a zdrojom; ostatní majú monogram. Bez nových fotografických podkladov.
- Kompaktné označenia na mobile/tablete; vizitka sa pri potrebe odkryje nad spodnou navigáciou. Klávesnica, Escape a obmedzený pohyb zachované.

Overenie: všetkých 28 verify skriptov, TypeScript, ESLint, generovaný tmavý režim a produkčný build prešli. Snímky pri 375/402/900/1280 px, oba motívy, výber klubu a poslanca, profil a hlasovanie 58451. Detektor raz: `[]`; inline dokončovací review implementátora: ship. Fyzický iPhone/Safari neoverený.

## 10. október 2026 — 2D sála zladená so stránkou

- Odstránený veľký tmavý blok okolo pôdorysu parlamentu; transparentná plocha a jemný tón sledujú svetlý aj tmavý motív.
- Väčší pôdorys, počet 150 miest v strede, jemné zvýraznenie kresla a pokojnejší vstup do 3D.
- Náhľad 3D bez tmavého rámu; večerná scéna i načítavacia záloha zachovávajú vlastnú paletu.
- Opravené výnimky generátora tmavého režimu pre 2D sálu. Zdrojové údaje, výpočty a ovládanie bez zmeny.

Vizuálne overené na 375/402/1280/1906 px, oba motívy, výber poslanca a hlasovanie 58451. Detektor: `[]`. Dokončovací review implementátora podľa inline kontraktu: ship, bez nezávislého overenia. Všetkých 27 overovacích skriptov, TypeScript, ESLint, kontrola tmavého motívu a produkčný build; fyzický Safari neoverený.

## 10. október 2026 — Vizuálne objavovanie

- Perspektívny vstup do 3D parlamentu pod titulkom používa existujúci render historických klubov k 1. 10. 2026. Nahrádza polkruh vydania v úvode; titulok a modelový scenár 150 kresiel zostávajú. Zvolená 3D sála zostáva otvorená pri zmene režimu alebo hlasovania aj po zmiznutí vstupného parametra z URL.
- Trend dopĺňajú zdrojované udalosti z existujúceho archívu: presný dátum publikácie, najbližší týždenný modelový bod a vysvetlenie, že kontext nedokazuje príčinnosť.
- Koaličné kartičky vo volebnom laboratóriu a 3D koalícii používajú skutočné logá, klik, klávesnicu a samostatný úchyt na presun; kreslá aj súčet sledujú spoločný výber.
- Interaktívna mriežka 100 € verejných výdavkov ukazuje existujúce Eurostat COFOG rozdelenie celej verejnej správy za 2024, zaokrúhlené políčka a presné sumy v zozname.
- Po serverom potvrdenom `paid` sa zobrazí značka Mandát; platobný panel na mobile využíva dostupnú šírku bez orezania.

Overenie implementátora: 27 skriptov dvakrát, TypeScript, ESLint, produkčný build a kontrola generovaného tmavého režimu úspešné. Detektor: `[]`. Dokončovací reviewer: odovzdať bez materiálnej opravy; 13 prijatých snímok skutočných funkcií. QA pokryla šírky 375, 402 a 1280 px a oba motívy; klik a Enter menia rovnaký koaličný súčet. Platobná vizuálna QA používala fixture, skutočná transakcia ani nová session neprebehli. Fyzický telefón a Safari drag zostávajú neoverené.

Po review bola opravená perzistencia 3D stavu pri navigácii. TypeScript, ESLint a build po tejto oprave prešli; dátové skripty prešli pred opravou, ktorá nemení dáta. CUA potvrdilo prechod zo vstupu `sala=3d` na Hlasovania so zachovanou 3D sálou (`.impeccable/review/visual-discovery/desktop-3d-entry-vote.png`). Verejné nasadenie zostáva na samostatné overenie.
