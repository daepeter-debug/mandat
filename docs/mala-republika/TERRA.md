# Zadanie pre GPT-5.6 Terra

Použi medium reasoning. Pracovný priečinok `outputs/web`. Najprv čítaj START.md a STATUS.md v tomto priečinku dokumentov; neprerábaj koncept. Implementačné detaily môžeš vyriešiť samostatne v rámci pravidiel. Toto je zadanie práce, nie požiadavka na ďalší plán.

## Priechod A — začni týmto

Prečítaj GAME.md, DESIGN.md a časť A v TECH.md. Vytvor kompletnú lokálnu hru Malá republika v `?v=game&g=republic`, tretiu kartu Herne. GAME.md určuje ceny, dátumy, náhodu, mapu a kapitolu. DESIGN.md určuje vizuálny smer a ovládanie. Existujúce hry a politické dáta zachovaj.

Postup v ohraničených krokoch:

1. Over stav git a relevantné pokyny projektu. Prečítaj iba súbory uvedené v START.md a potrebné importy. Nevytváraj novú aplikáciu.
2. Implementuj čisté jadro, verziovaný save, lokálny Store adaptér a meaningful testy skutočných pravidiel. Skript verify-plan.mjs je nezávislá referencia; premeň jej dokázané rozloženia na skutočné príkazy jadra, nestačí importovať jej výsledok.
3. Spracuj jeden jednotný vizuálny smer. Nová mapa musí byť z objektov zodpovedajúcich stavu; obrázok celého mesta s tlačidlami navrchu nesplní zadanie. Využi existujúce nástroje/Impeccable, ale nezačínaj nový workshop ani tri konkurenčné návrhy: používateľ si vybral tento koncept a limitoval spotrebu.
4. Zapoj UI, primeraný onboarding, ukladanie, chyby, zásielky, všetkých 7 krokov a 3 varianty finále. Po úspešnom lokálnom hraní aktualizuj GAMES.md.
5. Spusti kontroly z ACCEPTANCE.md. Jedna spoločná vizuálna kontrola mobil/desktop, opravy v jednej sérii, následné potvrdenie. Ak preview blokuje prostredie, zapíš chybu a presný nevykonaný krok; nevydávaj source review za browser test.
6. Aktualizuj STATUS.md a odovzdaj. **Bez automatického nasadenia a bez externých účtov v priechode A.** Nevypýtaj si Supabase kľúče skôr, než existuje hrateľná lokálna hra.

Nespúšťaj pomocných agentov automaticky; používateľ chce manuálne prepnúť model. Ak explicitný skill vyžaduje nezávislú kontrolu, udrž ju ohraničenú na jeho nevyhnutný rozsah. Lunin obsah je voliteľný; základných 7 textov v GAME.md stačí na dokončenie hry.

## Priechod B — až po A, na samostatný pokyn používateľa

Prečítaj aktuálny STATUS.md a TECH.md. Pridaj e-mail/heslo účty a serverové ukladanie cez Supabase, pričom zachováš local guest. Priprav migrácie, row-level prístup a autoritatívne serverové príkazy s idempotenciou. Pridaj uložené vlastné modely, históriu výsledkov existujúcich hier, export a zmazanie účtu. Nepíš vlastnú autentifikáciu.

Najprv dokonči lokálny kód, migrácie a konfiguračný návod bez tajomstiev. Používateľa zapoj až tam, kde musí vytvoriť svoj projekt alebo vložiť secret v bezpečnom rozhraní. Chýbajúci projekt/SMTP nesmie zastaviť nezávislú lokálnu prácu. Nevymýšľaj credentials ani neaktivuj platenú službu. Po konfigurácii over A/B účty a súbežné odmeny podľa ACCEPTANCE.md.

Neaplikuj Postgres migrácie cez existujúcu SQLite drizzle konfiguráciu. Nepoužívaj chatgpt-auth.ts ako identitu verejného návštevníka. Nezamieňaj SDK browser session s overenou serverovou identitou. Service-role RPC nesmie zostať verejne volateľná.

## Keď začne dochádzať limit

Dokonči aktuálny ucelený krok, zapíš presný ďalší krok do STATUS.md a ponechaj funkčný web. Najprv odlož voliteľné animácie, ďalšie obsahové varianty a export pohľadnice; nikdy neobetuj vlastníctvo dát, správnosť odmien, zachovanie save alebo čitateľnosť mobilu. Neoznač neimplementované funkcie za hotové a nesnaž sa spotrebovať celé okno prepracúvaním vzhľadu.

## Krátky prompt na vloženie — A

> Pokračuj implementáciou Malej republiky. Prečítaj outputs/web/docs/mala-republika/START.md, STATUS.md a TERRA.md. Vykonaj iba priechod A: kompletný lokálny mobilný prototyp podľa GAME.md a DESIGN.md, bez nasadenia a účtov. Návrh už máme, nezačínaj nové navrhovanie. Over jadro aj skutočný mobilný render a zapíš výsledky do STATUS.md.

## Krátky prompt na vloženie — B

> Pokračuj priechodom B v outputs/web/docs/mala-republika/TERRA.md podľa aktuálneho STATUS.md a TECH.md. Dokonči účty a cloudové uloženie vrátane súkromných volebných modelov a výsledkov hier. Externé nastavenia vyžiadaj až po príprave konkrétneho kódu a migrácií; tajné kľúče nežiadaj do chatu. Verejne nenasadzuj bez dokončených kontrol a môjho pokynu.
