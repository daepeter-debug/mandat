# Herňa

Záložka **Herňa** (`?v=game`) združuje hry webu. Výber hry je v adrese ako `g=majority` alebo `g=december`, takže sa dá zdieľať odkaz priamo na hru; návrat „Všetky hry“ vráti fokus na kartu, z ktorej sa odišlo. Herňa je ľahká — každá hra sa načíta až pri otvorení.

## Denná väčšina (`components/daily-game.tsx`, `lib/daily-game.ts`)

Logický hlavolam: šesť fiktívnych strán, zostav najtesnejšiu koalíciu, ktorá splní pravidlá. Denná výzva zo zrnka dátumu + tréning. Uloženie `mandat:daily-majority:v1:<deň>`.

## Do decembra (`components/december-game.tsx`, `components/december-town.tsx`, `lib/december-game.ts`)

Hra o malom fiktívnom meste Mandátovce: dvanásť mesiacov, každý mesiac jedna mestská správa s dvoma možnosťami. Jedna zväčša stojí mince, druhá stojí niečo iné (Školy, Zdravie, Doprava na stupnici 0–10). Mesto vyberá +1 mincu mesačne, rozhodnutia môžu príjem zmeniť; odložené účty a odmeny prídu v uvedenom mesiaci. Dlh je možný, ale v dlhu mesto každý mesiac stráca bod v každej oblasti. Ak oblasť klesne na nulu, rok sa končí. Na konci pohľadnica s hviezdami: tri = všetko aspoň 7 a bez dlhu, dve = všetko aspoň 5 a bez dlhu, jedna = prežili sme.

- **Sezóna zo zrnka.** Denná sezóna je pre všetkých rovnaká (zrnko z dátumu v slovenskom čase). Správa mesiaca sa vyberá zo správ povolených v danom mesiaci, ktoré ešte neprišli a nekolidujú s tým, čo je už vyriešené (opravený most sa druhýkrát nepokazí). Výber je deterministický: rovnaké rozhodnutia = rovnaký rok.
- **Férovosť.** Generátor prejde všetkých 4 096 ciest sezónou a prijme len takú, ktorá sa dá dohrať na tri hviezdy, dá sa v nej aj padnúť a tri hviezdy nedáva viac ako polovica ciest. Záložný plán existuje pre prípad vyčerpania; `verify-data` kontroluje, že ho 14 nasledujúcich dní nepotrebuje.
- **Scéna.** `december-town.tsx` kreslí Mandátovce ako izometrickú dioramu základnými tvarmi v SVG (drevená doska, škola s telocvičňou, radnica s hodinami, poliklinika, rieka s mostom). Ročné obdobie mení paletu, sneh, lístie a rozsvietené okná; príznaky z rozhodnutí pridávajú prvky (nový most, ihrisko, hrádza, cyklotrasa, autobus, LED lampy, trhy…). Hodiny na radnici ukazujú mesiac.
- **Uloženie.** `mandat:do-decembra:v1:<deň>` = `{ choices: (0|1)[], stars }`; stav sa prehrá z rozhodnutí, história 7 dní číta len hviezdy. Tréning sa neukladá.
- **Pôvod.** Hru navrhol Codex 19. 9. 2026 ako vizuálny koncept (generovaný obrázok zimného mestečka s opravou mosta, tri ukazovatele, dve možnosti s cenou). Koncept určil smer: jedna scéna, ktorá reaguje, teplá paleta, krátke správy s humorom, pohľadnica na konci. Herná logika, scéna v SVG a rozhranie vznikli pri dokončení; obrázok sa v rozhraní nepoužíva (obsahoval vlastné texty a nereagoval by na rozhodnutia).

## Overenie

`node scripts/verify-data.mjs` stráži pravidlá správ (lacná možnosť, dĺžky textov pre mobil, odložené účty do decembra, pokrytie mesiacov) aj férovosť sezón. Rozhranie overené na 1280 aj 375 px.
