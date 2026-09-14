# Pokrytie prieskumov — kontrola 11. 9. 2026

Dodatok 12. 9. 2026: septembrové NMS doplnené o SNS 1,9 % a ZA ĽUDÍ 1,6 % podľa [pôvodného vloženého grafu](https://flo.uri.sh/visualisation/30183930/embed), filter September 2026. Ostatné zdroje neboli týmto dodatkom opätovne overované.

Archív obsahuje 35 meraní za rok 2026. Nejde o úplnú databázu všetkých publikovaných slovenských prieskumov. Každý záznam má konkrétny zdroj v `lib/polls.ts` alebo `lib/additional-polls.ts`; rovnaké odkazy sa zobrazujú vo webovej aplikácii.

| Organizácia | Počet | Importované mesiace | Primárny archív |
|---|---:|---|---|
| AKO | 8 | január – august | [AKO](https://ako.sk/) |
| FOCUS | 5 | február, marec, máj, jún, september | [Tlačové správy](https://www.focus-research.sk/press-centrum/) |
| INFOSTAT / CSV | 6 | január, marec, máj, jún, júl, august | [Súhrnné správy](https://www.infostat.sk/csv/suhrnna-sprava/) |
| IPSOS | 6 | január, február, marec, máj, jún, august | [IPSOS a Denník N](https://www.ipsos.com/sk-sk/ipsos-dennik-n-prieskum-volebnych-preferencii) |
| NMS | 9 | január – september | [NMS Market Research Slovakia](https://nms.global/sk/media-blog-sk/volebne-prieskumy/) |
| SANEP | 1 | august | [Publikácia zadávateľa ta3](https://www.ta3.com/clanok/1066975/prieskum-pre-ta3-smer-si-drzi-ps-za-sebou-naskok-je-vsak-tesny-ktorym-lidrom-volici-doveruju-najviac) |

## Konkrétne medzery

- **IPSOS apríl:** nájdená publikácia zadávateľa a vložený graf; úplný číselný prepis a kontrola metadát nie sú dokončené. [Článok Denníka N z 23. 4. 2026](https://dennikn.sk/5293596/model-ipsosu-smer-aj-hlas-su-na-novom-minime-opozicny-blok-rastie/).
- **IPSOS máj a jún:** hodnoty a intervaly zberu pochádzajú z historických stĺpcov pôvodnej augustovej správy IPSOS. Veľkosť vzorky a deň prvého publikovania nie sú v použitom zdroji uvedené; ukladajú sa ako `null`. Augustový dátum nie je použitý ako dátum publikovania starších vĺn.
- **INFOSTAT február a apríl:** výsledky sa objavujú v historických grafoch súhrnných správ. Celá distribúcia zatiaľ nie je prepísaná a tieto vlny sa nezapočítavajú do počtu meraní.
- **INFOSTAT publikovanie:** pri importovaných správach nie je jednoznačne potvrdený deň prvého zverejnenia. Čas vytvorenia PDF nie je použitý ako náhrada.
- **Nenájdené vlny:** pri tejto kontrole sa nenašla septembrová správa AKO ani júlová či septembrová správa IPSOS. FOCUS má v primárnom archíve päť uvedených vĺn. To nie je tvrdenie, že iné výskumy neexistujú.
- **Menšie subjekty:** časť distribúcií je neúplná. Presné chýbajúce hodnoty sa neodhadujú; kategória „iné strany“ sa pri IPSOS a FOCUS uchováva oddelene. Z týchto čiastkových distribúcií web nepočíta mandáty.

## Metodické rozdiely

AKO používa telefonické dopytovanie; FOCUS osobné aj online rozhovory. Výsledky oboch sú percentá z rozhodnutých respondentov. FOCUS výslovne upozorňuje, že podiel rozhodnutých nie je odhad účasti. NMS a IPSOS publikujú volebné modely s vážením ochoty ísť voliť. INFOSTAT počas roka prešiel z PAPI na CAPI; metóda sa uchováva pri každom zázname.

INFOSTAT máj je z NÁZORY 2/2026, tlačené strany 87–89 (strany PDF 88–90): celková vzorka 1 003, základ volebnej otázky 564. Tieto dve veľkosti nie sú zameniteľné. Pri ďalších správach sa zobrazuje celková vzorka a dostupné vysvetlenie v poznámke.

Časová os a archív sa riadia koncom zberu. FOCUS „jún 2026“ bol publikovaný 3. júla; názov mesiaca merania sa kvôli tomu nemení. Graf drží jednotlivé agentúry oddelene a používa skutočné časové rozostupy. Zmenu počíta oproti predchádzajúcej dostupnej vlne rovnakej agentúry, ktorá je pomenovaná pri rebríčku.

## Účasť politických strán vo vládach SR — kontrola 13. 9. 2026

Profil každej zo 16 sledovaných strán obsahuje súčet času vo vláde od 1. januára 1993. Základom je [história vlád Úradu vlády SR](https://www.vlada.gov.sk/vlada-sr/historia-vlad-sr/) a [vládny prehľad zloženia koalícií](https://www.narodnostnemensiny.vlada.gov.sk/site/assets/files/3561/sprava_o_postaveni_a_pravach_prislusnikov_narodnostnych_mensin_za_obdobie_rokov_2019_-_2020.pdf). Obdobia sa ukladajú po dňoch v `lib/government-tenure.ts`; používateľ vidí ich rozpis aj odkaz na zdroj priamo pri výsledku.

- Koalíciu z roku 2020 a rozdelenie vládnych postov potvrdzuje [Národná rada SR](https://www.nrsr.sk/web/Default.aspx?MasterID=55221&sid=udalosti%2Fudalost).
- Pri SaS sa účasť končí 5. septembra 2022, keď strana oficiálne opustila koalíciu; [záznam STVR](https://spravy.stvr.sk/2022/09/heger-vstupujeme-do-mensinovej-vlady/) zároveň opisuje vznik menšinovej vlády.
- Demokrati sa počítajú od 7. marca do 15. mája 2023 ako prítomnosť premiéra a ministrov v dočasne poverenom kabinete, nie ako signatár pôvodnej koaličnej zmluvy. [STVR: predstavenie strany a štyroch ministrov](https://spravy.stvr.sk/2023/03/heger-predstavil-stranu-demokrati-v-time-ma-styroch-ministrov-a-viacero-znamych-tvari/).
- Súčasná koalícia SMER, HLAS a SNS je doložená [podpisom koaličnej zmluvy](https://spravy.stvr.sk/2023/10/lidri-smeru-hlasu-a-sns-podpisuju-koalicnu-zmluvu/) a dátum nástupu vlády 25. októbra 2023 [vymenovaním kabinetu](https://www.vlada.gov.sk/tlacove-spravy/prezidentka-sr-vymenovala-roberta-fica-do-funkcie-predsedu-vldy-sr-177/).
- Strana vidieka sa od 5. marca 2025 počíta iba ako prítomnosť predsedu strany v kabinete. Prezidentská kancelária uvádza, že [Rudolf Huliak bol vymenovaný na základe politickej dohody vládnej koalície](https://www.prezident.sk/tlacove-spravy/prezident-sr-vymenoval-r-huliaka-za-noveho-ministra-cestovneho-ruchu-a-sportu/); strana nebola signatárom koaličnej zmluvy z roku 2023.
- Hnutie Slovensko je premenované OĽANO, preto sa jeho účasť v rokoch 2020 – 2023 započítava bez prerušenia. Pri Aliancii sa história SMK a Mosta-Híd uvádza iba v poznámke a nepripočítava sa do hlavného čísla dnešného spoločného subjektu. [TASR: vznik Aliancie zlúčením troch strán](https://www.teraz.sk/slovensko/spolocna-madarska-strana-aliancia-m/580777-clanok.html/zoh-2026).

Zobrazené roky a mesiace sú prevodom súčtu dní na celé priemerné kalendárne mesiace. Rozbalený detail ponecháva presné hraničné dátumy, aby bol výsledok reprodukovateľný. Pri strane, ktorá bola súčasťou volebnej koalície, ale nebola samostatným členom vlády ani nemala overeného člena či nominanta v kabinete, sa vládna účasť nezapočítava.

## Zdrojovanie a ďalšie použitie

NMS je označené plným názvom s aktívnym odkazom na konkrétny článok podľa požiadavky v jeho publikáciách. Pri ostatných organizáciách je uvedený autor a pôvodná správa alebo publikácia zadávateľa. Grafy vykresľuje web sám. Citácia sa nepovažuje za potvrdenie neobmedzenej licencie na databázy, obrázky alebo automatické systematické preberanie. Rozšírené licenčné posúdenie a pravidlá verejnej prevádzky ostávajú samostatným krokom pred nasadením.
