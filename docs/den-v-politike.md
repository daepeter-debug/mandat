# Deň v politike — ako vzniká denný súhrn

Sekcia Správy nie je živý spravodajský prúd. Za každý deň je tam zhruba päť politických udalostí, ktoré by nemali zapadnúť, zoradených od najdôležitejšej. Cez víkend ich býva menej.

## Denný postup

1. **Podklady:** spusti `node scripts/news-harvest.mjs --from=RRRR-MM-DD [--to=…] --out=<priečinok>`. Skript stiahne všetky položky z Denník N Minúta po minúte (verejné API `api/v2/mpm/posts`, staršie cez `?before=<id>`) a titulky TASR z teraz.sk (sekcie Slovensko a Ekonomika). Za pracovný deň je to zvyčajne 50–80 položiek Minúty a 80–120 titulkov TASR.
2. **Analýza všetkého:** z podkladov sa vypíšu všetky politické udalosti dňa a zlúčia sa duplicity. Bežne ich býva 10–25.
3. **Výber a poradie:** editor vyberie zhruba 5 udalostí podľa skutočného dosahu na politiku a ľudí. Patrí sem stabilita vlády a koalície, prijaté alebo zamietnuté zákony, rozpočet, dane a ceny, odvolania a menovania, veľké kauzy, prezident a zásadné kroky opozície. Na každú dejovú líniu pripadá v jednom dni jedna správa. Výber musí byť vyvážený a nikdy nie stranícky.
4. **Písanie:** každú správu tvorí nadpis, 2 vety do zoznamu a 3 odseky detailu s dátumom „v utorok 22. septembra“. Tvrdenia pripisujeme ich autorom a uvádzame aj reakciu druhej strany. Píšeme vlastnými slovami, maximálne s jednou krátkou citáciou. Odkaz na originál je len v poli `source`.
5. **Overenie:** správu nezávisle skontroluje druhý agent oproti zdroju: mená, funkcie, strany, čísla, deň v týždni, neutralitu a či nie je text prevzatý.
6. **Veta dňa:** do `newsDays` sa zapíše jedna neutrálna veta o dni a počet prejdených udalostí (`analyzed`).
7. **Zápis:** do `lib/political-news.ts` sa zapíšu položky s `rank`, nastaví sa `newsChecked` a spustí sa `node scripts/verify-data.mjs`. Kontrola stráži jedinečné poradie v dni, témy, dĺžky textov a to, že text neobsahuje odkazy.

## Témy (`category`)

| Téma | Čo sem patrí |
|---|---|
| Vláda | vláda a ministri |
| Parlament | NR SR |
| Opozícia | iniciatívy a kritika opozície |
| Prezident | kroky a vyjadrenia prezidenta |
| Voľby | komunálne a župné voľby 2026 |
| Prieskumy | prieskumy verejnej mienky |
| Politika | súdy a prokuratúra pri politikoch, strany, inštitúcie |

## Zdroje

- Denník N Minúta po minúte (položky `dennikn.sk/minuta/<id>` sú voľne dostupné) a TASR (teraz.sk) sú hlavné zdroje.
- Na doplnenie slúžia STVR, Noviny.sk, TA3, TN a Pravda.
- Aktuality.sk sa nedajú automaticky načítať.
