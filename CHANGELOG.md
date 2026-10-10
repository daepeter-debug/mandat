# Zmeny Mandátu

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
