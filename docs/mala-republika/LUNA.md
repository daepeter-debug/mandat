# Zadanie pre GPT-5.6 Luna — voliteľný obsah

Úzko ohraničená práca po dokončení Terra A. Low/medium reasoning. **Neimplementuj hru, nemeníš UI, pravidlá, čísla, autentifikáciu ani package.json.** Žiadni ďalší agenti, rešerš politiky alebo generovanie obrázkov. Všetci ľudia a miesta sú fiktívni.

Prečítaj len tento dokument, GAME.md a STATUS.md. Výstup: `docs/mala-republika/content-sk.json`, UTF-8, striktne platný JSON bez komentárov. Súbor je obsah na neskoršiu integráciu Terrou, nie automaticky nasadené texty. Neskúšaj upraviť hotovú hernú logiku, aby sa prispôsobila tvojmu textu.

## Presná schéma obsahu

```
{
  "version": 1,
  "locale": "sk-SK",
  "characters": [
    { "id": "eva", "name": "Eva", "role": "Učiteľka", "bio": "..." }
  ],
  "steps": [
    {
      "id": "school-yard", "speakerId": "eva",
      "title": "Školský dvor",
      "variants": ["...", "..."],
      "completedText": "..."
    }
  ],
  "decorations": [
    { "id": "bench", "name": "Lavička", "description": "..." }
  ],
  "endings": [
    { "id": "museum", "title": "...", "text": "..." }
  ]
}
```

Presne 3 characters: eva/milan/nina. Bio ≤110 znakov, role ≤35. Presne 7 steps s ID school-yard/books/care/square/discovery/preparation/opening. Speaker podľa GAME.md; preparation Milan, opening Nina. Každý má presne 2 varianty textu ≤150 znakov, title ≤38 a completedText ≤110. Presne 12 decorations s ID z tabuľky GAME.md; name ≤28, description ≤85. Presne 3 endings museum/market-hall/community-hall, title ≤45 a text ≤180. Počítať Unicode znaky, nie UTF-8 bajty.

Tón: prirodzená slovenčina, konkrétna situácia, jemný humor najviac v niekoľkých vetách, tykanie. Žiadny marketingový slogan, moralizovanie, politické narážky a superlatívy. Text dekorácie opisuje vzhľad; nesľubuje výnos, bonus, nových obyvateľov alebo funkciu, ktorá nie je v GAME.md. Text finále sa nesmie tváriť, že všetky tri možnosti vybrali všetci hráči.

Nepridávaj nové ceny, percentá, cooldowny, odmeny, postavy a vetvenia. Počet pokrytých domov je v care najmenej dva, nie všetky. Krok preparation má tri varianty účelu podľa rozhodnutia, spoločný text preto musí sedieť na každý z nich.

## Kontrola a odovzdanie

Načítaj výstup cez JSON.parse a over počty, presné ID, povinné stringy a dĺžky jednoduchým jednorazovým skriptom. Nepridávaj testovací framework. Zapíš do STATUS.md iba cestu, výsledok overenia a „obsah pripravený, zatiaľ nezapojený“. Žiadny build, commit/push ani zmena ďalších súborov. Terra následne obsah skontroluje a importuje cez explicitnú schému alebo prevedie do TS.

Prompt na vloženie:

> Vykonaj obsahovú úlohu z outputs/web/docs/mala-republika/LUNA.md. Výstup iba content-sk.json a krátka aktualizácia STATUS.md. Nemeň kód, dizajn ani pravidlá. Over JSON, ID, počty a dĺžky textov. Obsah je fiktívny, po slovensky a musí presne zodpovedať existujúcim mechanikám.
