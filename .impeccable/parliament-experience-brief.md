# Parlament v 3D — hlbší zážitok

2. 10. 2026. Peter schválil všetkých päť navrhnutých úprav. Rozšírenie existujúceho smeru C (Večerná sála), bez novej identity aplikácie. Mode: Experience pri pohľade na sálu, Operate pri skladaní koalície.

## Potvrdený rozsah

1. Krátky filmový vstup pri kreslách, prejazd a plynulý návrat na celú sálu. Prerušiteľný, opakovateľný, bez pohybu pri reduced-motion.
2. Mäkké čalúnenie, jemnejší lesk orecha a smerovejšie teplé svetlo s kontaktným tieňom. Existujúce overené logá a pôvodné farby zostávajú.
3. Čistý základný pohľad bez plávajúcich čísiel. Ovládanie mimo scény, zoznam názvov a počtov pod scénou.
4. Vlastná koalícia: ľubovoľný výber strán, farebné kreslá vybraných subjektov, plynulý súčet, hranica 76 a explicitné označenie vlastnej kombinácie. Žiadne politické odporúčanie.
5. Detail strany cez zoznam alebo ťuknutie na kreslo: kamera k skutočným kreslám, logo/názov/počet v paneli, návrat „Celá sála“.

## Prvý pohľad a interakcia

Sála je hlavný objekt; teplé drevo, látka, logá a symboly sú viditeľné bez anotácií cez ne. Prepínače neprekrývajú architektúru. Filmový vstup predstaví materiál v detaile a potom sprístupní celok. Výber strán na pracovnej ploche koalície okamžite prepojí textový zoznam s farbou kresiel a súčtom mandátov.

## Hranice a evidencia

- Nemenia sa aktuálne politické dáta, počty, `seatParty`, `chamberSeats`, varianty glTF, materiály `strana:<id>`, mierka ani hry.
- Reset vlastnej kombinácie pri zmene obsadenia zabráni preneseniu neplatnej kombinácie medzi variantmi. Duplikáty a neznáme ID sa nezapočítajú.
- Mobil 375 × 874 a 402 × 874 CSS px, desktop 1280 × 800, svetlá/tmavá téma. Provider škáluje mobilné screenshoty; fyzický Safari/Android/AR/fps ostáva neoverený.
- Bez novej závislosti; GLB pod 1,5 MB, lazy-load po otvorení. Pohyb pozastavený v skrytej karte; dotykové otáčanie nesmie spúšťať výber kresla.
- Dve vlastné inšpekčné kolá, potom čerstvý finish reviewer a documenter podľa Impeccable. Výstupy `.impeccable/review/parliament-experience/`.
- Nasadenie na existujúci `mandat-preview` je autorizované. Len menované vlastné súbory; pred pushom pull --rebase.
