# Technický plán — lokálna hra a spoločný účet

Návrh Astry, 21. 9. 2026. Existujúci stack zachovať. Implementácia nesmie potrebovať AI API za behu hry.

## A. Jadro a lokálny režim

Navrhované nové súbory:

```
lib/republic/types.ts       // verziovaný stav a príkazy
lib/republic/catalog.ts     // stabilné ID, ceny a kombinácie z GAME.md
lib/republic/content.ts     // základné postavy a 7 projektových textov
lib/republic/engine.ts      // pure reducer, validácia a odvodené pokrytie
lib/republic/storage.ts     // rozhranie úložiska + lokálny adaptér
components/republic-game.tsx
components/republic-map.tsx
app/republic-game.css       // scoped .republic-*; žiadne globálne prepísanie
scripts/verify-republic.mjs
public/images/games/republic/
```

Príklad kontraktu, konkrétnu typovú syntax môže Terra upraviť bez zmeny významu:

```
TownState {
  schemaVersion: 1; rulesVersion: 1; contentVersion: 1;
  id; revision; townSeed; name; createdDay;
  coins; materials;
  placed: [{ instanceId, buildingId, x, y }];
  inventory: [{ instanceId, buildingId }];
  roads: [{ x, y }]; unlockedDecorations: string[];
  parcels: { charges, lastAccruedDay, claimSequence,
    pending: null | { offerId, sequence, rarity, cardIds: [id,id,id] } };
  chapter: { completedStepIds, branch, lastCompletedDay, finalRewardClaimed };
  tasks: { day, taskIds, claimedIds };
}
Command = rename | build | move | store | setRoad | openParcel |
          chooseParcelCard | claimTask | completeStep | chooseFinalDecoration
applyCommand(state, command, context) → Result<newState, typedError>
context = { today, offerFactory } // vstup od adaptéra; nikdy z browser body v cloude
Store.load() / Store.execute({commandId, expectedRevision, command})
```

`build` môže vytvoriť novú kúpenú inštanciu alebo umiestniť existujúcu z inventára; oba prípady musia byť rozlíšené. `store` zakázané pre pevné objekty. Dekorácia používa odomknuté ID a novú inštanciu; nejde o obchodovateľnú kópiu. Uložený seed hosťa je verejný, pri účte do klienta nesmie prísť tajný serverový seed.

Bez Date.now, Math.random, localStorage a fetch v jadre. Odvodené pokrytie/kombinácie/percentá sa neukladajú ako pravda. Úspešne potvrdené úlohy sa však ukladajú, aby presun nespustil druhú odmenu. Strict schéma (existujúci Zod), finite integer čísla, unikátne instanceId a obsadenosť, legálne ID, pevné pozície, dosahy, zdroje ≥0, známe verzie.

Lokálny kľúč `mandat:republic:v1:guest`; oddelený od oboch doterajších hier. SSR začína stavom načítania, čítať až na klientovi. Zápis po každom potvrdenom príkaze; neoznámiť uloženie, ak zápis zlyhá. Poškodený/neznámy formát neprepísať automaticky: ponúknuť stiahnutie pôvodného JSON a samostatne výslovný nový začiatok. Zabránit prepísaniu novšej lokálnej revízie iným tabom (Web Locks, ak dostupné; pri fallbacku detekovať zmenu a vyžiadať reload, nesľubovať atómovosť localStorage).

## B. Účty — zvolená cesta

**Supabase Auth + Postgres**, hosting ostáva Cloudflare. Návrhové rozhodnutie kvôli správe hesiel, e-mailov a dát na jednom mieste. Neprevádzať SQLite Drizzle konfiguráciu na Postgres a nezavádzať aj D1. Migrácie Supabase viesť osobitne v `supabase/migrations/`.

Mandát je verejná client aplikácia; pre v1 stačí `@supabase/supabase-js`, browser Auth klient a Worker API s overením Bearer tokenu. **Nezavádzať SSR cookies/proxy iba kvôli verejnej stránke.** Tak sa vyhneme neoverenej kompatibilite Next proxy s Vinext beta. Ak neskôr pribudnú súkromné SSR stránky, riešiť @supabase/ssr samostatne podľa oficiálneho návodu.

Browser SDK spravuje reláciu a obnovu tokenu; neimplementovať vlastné heslá, JWT ani tokenový formát. API overuje prístup cez `supabase.auth.getUser(accessToken)` a berie user.id z výsledku. `getSession()` na serveri ani userId/email z request body nie sú dôkaz identity. Potvrdený e-mail požadovať pre cloudové herné odmeny. Tokeny, heslá, recovery linky a celé osobné requesty nelogovať. Neukladať používateľské texty cez innerHTML.

Formuláre: e-mail/heslo, registrácia, overenie e-mailu, prihlásenie, zabudnuté heslo, nové heslo po recovery, odhlásenie. Voliteľná prezývka neskôr; názov mesta stačí. Reset/registrácia používajú neutrálne odpovede a obmedzenia poskytovateľa. Recovery route musí overiť reláciu z callbacku; redirect iba na vlastné povolené cesty, nikdy ľubovoľná returnTo URL.

Premenné návrhu: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; serverové `SUPABASE_SECRET_KEY`, `REPUBLIC_REWARD_SECRET`. Verejný kľúč je verejný zámerne, tajné kľúče nikdy v NEXT_PUBLIC, klientskom module alebo JSON odpovedi. Overiť build-time vloženie verejných premenných vo Vinext a runtime prístup serverových secrets v aktuálnom Workeri. Pomenovanie env súborov nastaviť podľa existujúceho loadera; nevymýšľať, že .env.local automaticky nahradí Cloudflare secrets. `.gitignore` ignoruje .env*: ak treba šablónu, použiť `docs/account-env.example.txt` s názvami a prázdnymi hodnotami.

## Dátové vlastníctvo

| Tabuľka | Základ | Prístup |
| --- | --- | --- |
| towns | user_id PK/FK auth.users, revision, state JSONB, updated_at | používateľ číta iba svoje; zápis iba serverová transakcia |
| town_commands | user_id + command_id PK, request_hash, výsledok/revision, created_at | iba server; retry nesmie prideliť odmenu znova |
| saved_models | id UUID, user_id FK, name, version, inputs JSONB, baseline JSONB, created_at, updated_at, revision | RLS vlastník CRUD |
| game_results | user_id + game_id + rules_version + day PK, choices/input JSONB, server_result JSONB, verification | server overí replay; vlastník číta |
| user_preferences | user_id PK/FK, version, settings JSONB | RLS vlastník CRUD, explicitný allowlist nastavení |

Všetky FK na auth.users majú ON DELETE CASCADE. RLS zapnúť v migrácii, policies viazať na auth.uid(); anon nemá čítanie osobných dát. Herné tabuľky nemajú priame INSERT/UPDATE policy pre authenticated. Ani bezpečnostné pravidlá ani tajné kľúče nie sú úloha pre Lunu.

Vlastné volebné modely sú súkromné. V1 nesynchronizovať obľúbené politické strany automaticky; nie je to potrebné pre účty a používateľské nastavenia. Nastavenia v1 iba explicitne zvolené rozhranie hry/znížený pohyb. Nikde nezobrazovať verejne e-mail alebo politické výbery.

## Serverové príkazy a ochrana pred dvojitou odmenou

Navrhované route handlers: `GET /api/republic`, `POST /api/republic/commands`, `POST /api/game-results`, `DELETE /api/account`. Súkromné odpovede `Cache-Control: private, no-store`; necacheovať medzi používateľmi. Mutácie vyžadujú JSON, validnú reláciu, primeraný limit body (napr. 16 KiB na príkaz), same-origin kontrolu a limitovanie frekvencie na edge/poskytovateľovi; obyčajná procesová Map nie je spoľahlivý limit naprieč Workermi.

POST nesie `{ commandId: UUID, expectedRevision, command }`. Neposiela nový kompletný TownState, dnešný dátum, žrebovanie, odmeny ani userId. Server:

1. Overí používateľa a schému príkazu; z tokenu určí vlastníka, zo serverového času dnešný bratislavský deň.
2. Overí existujúci receipt pre (user,commandId): rovnaký request hash → pôvodný výsledok, rozdielny → konflikt.
3. Načíta stav a prepočíta nový stav rovnakým čistým jadrom. Ponuku vytvorí deterministicky zo serverového HMAC(userId, rulesVersion, claimSequence), nie z ovplyvniteľného commandId alebo času kliknutia. Pending ponuku uloží.
4. Jedna SQL transakcia/RPC `commit_town_command` uzamkne riadok používateľa, znovu skontroluje receipt a expectedRevision, uloží stav s revision+1 aj receipt atómovo. Inicializácia mesta tiež musí byť idempotentná pri dvoch taboch.
5. Pri konflikte revízie vráti 409 a aktuálnu revíziu; klient obnoví stav a nechá používateľa zopakovať zámer. Nikdy slepo neprepíše cudziu/novšiu reláciu. Pri timeout retry použije rovnaký commandId aj payload. ID sa nezmení automaticky, kým nie je známy výsledok.

RPC prijíma vypočítaný stav, preto musí mať EXECUTE iba service_role; explicitne REVOKE pre PUBLIC, anon a authenticated vrátane prípadných overloadov. Ak SECURITY DEFINER, fixný search_path a schema-qualified názvy. Service key obchádza RLS: API vždy musí určiť userId z overenej relácie a nemôže sa spoliehať, že ho RLS ochráni pred vlastnou chybou. Klientovi sprístupniť iba čítanie vlastného výsledku.

Receipts v1 nemaž automaticky; budúca retencia musí zachovať ochranu starých commandId. Kľúčové testy sú paralelná odmena, otvorenie bez dokončenia, timeout po commite a replay tej istej žiadosti. Obyčajný debounce v UI nestačí.

## Ukladanie a konflikt zariadení

- Hosť funguje bez externých účtov, stav ostáva v jeho zariadení. Hráč dostane túto informáciu pred prvým dlhším hraním.
- V1 pri prihlásení neimportuje neoverený hosťovský inventár do serverovej ekonomiky. Jasne ukázať: „Lokálne mesto zostane v tomto zariadení. V účte začnete nové mesto.“ Ponúknuť pokračovanie hosťa alebo účtu. Žiadne zmazanie lokálneho mesta. Import nie je skrytý nedokončený sľub.
- Účet musí pri výpadku siete ukázať posledný potvrdený stav iba na čítanie. Žiadne tiché prepnutie na zapisovateľného hosťa a žiadne zložité offline merge v1.
- Pri odhlásení odstrániť osobnú cache z pamäte. Ďalší účet nesmie vidieť predchádzajúce mesto/modely. Lokálny hosť je oddelený slot. Zmena hesla/reset a expirovaná relácia musia zachovať nezverejnený stav bez pripísania odmeny.
- Export vlastných dát a odstránenie účtu s explicitným potvrdením patria do účtovej verzie. Mazanie overí aktuálnu identitu; pri výpadku nenahlási úspech. Servisné odstránenie auth používateľa kaskádovo odstráni jeho dáta.

## Vlastné modely a staršie hry

Model uloží názov, verziu, vstupné percentá a zvolených partnerov; baseline obsahuje dátum a kópiu východiskových hodnôt. Pri načítaní nikdy nepodsúvať dnešný agregát za pôvodný. Kreslá vždy prepočítať existujúcim algoritmom. Chýbajúce percento ostáva chýbajúce, nie nula; finite hodnoty 0..100 po desatinách, súčet ≤100, známe ID strán. Maximálne 20 modelov na používateľa v1, názov 1..60 znakov, rozumná validácia JSON a limit veľkosti. Zastaranú/neznámu verziu nezahadzovať potichu.

Existujúce hry: uložiť pôvodné vstupy/voľby a day + rulesVersion, skóre počíta server replayom. Výsledok importovaný z lokálneho archívu označiť ako prenesený; nie dôkaz, že hráč hral v uvedený deň. V1 nemá rebríček, anti-cheat nemožno tvrdiť. Zachovať existujúce localStorage verzie aj tréning; tréning nikdy nezapočítať ako denný úspech.

## Externé nastavenie a podklady

Nasledujúce potrebuje Peter vykonať vo vlastnom účte alebo cez dostupné autorizované nástroje až po pripravení kódu: Supabase projekt (prednostne región EÚ), verejná URL/kľúč do konfigurácie, serverové secrets cez bezpečné nastavenie, migrácie, zoznam povolených callbackov pre localhost a workers.dev, overovacie a recovery e-maily. Všeobecná registrácia vyžaduje funkčné doručovanie e-mailov; samotný predvolený testovací SMTP nestačí na verejné spustenie. Nežiadať tajné kľúče do chatu, neaktivovať platený plán bez rozhodnutia používateľa, nesľubovať navždy bezplatnú prevádzku.

Dokumentácia overená 21. 9. 2026; ide o návrhovú rešerš, nie vykonanú integráciu:

- [Supabase e-mail/heslo](https://supabase.com/docs/guides/auth/passwords)
- [getUser a overenie identity](https://supabase.com/docs/reference/javascript/auth-getuser)
- [RLS a obchádzanie service rolou](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [SQL funkcie a prístupové práva](https://supabase.com/docs/guides/database/functions)
- [SMTP pre e-maily](https://supabase.com/docs/guides/auth/auth-smtp)
- [SSR alternatíva — teraz nezavádzať](https://supabase.com/docs/guides/auth/server-side/creating-a-client)

Pred pridaním SDK Terra overí kompatibilnú stabilnú verziu a commitne lockfile. Žiadna aktuálna cena ani limit služby nie sú týmto dokumentom garantované.
