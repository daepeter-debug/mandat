# Testovacie nasadenie na workers.dev

**Aktuálna adresa:** https://mandat-preview.mandat.workers.dev (Worker `mandat-preview`, účet Petra, subdoména `mandat`). Nové nasadenie: v `outputs/web` spustiť `npm run build` a `npm run deploy:preview` (prihlásenie wranglera musí byť aktívne).

Používateľ zvolil priamy Cloudflare hosting. Konfigurácia `wrangler.preview.jsonc` nasadzuje Worker `mandat-preview` a statické súbory z `dist/client`. Aplikácia nepotrebuje D1, R2 ani aplikačné tajomstvá; rebríček Tridsiatky je v Durable Object priamo vo Workeri (časť Tridsiatka online nižšie).

## Stav prípravy

- Produkčný build bol overený v predchádzajúcom kroku.
- `wrangler deploy --config wrangler.preview.jsonc --dry-run` prešiel: 35 modulov, 71 statických súborov, približne 441 KiB gzip Worker.
- Rovnaká konfigurácia v lokálnom Workers runtime vrátila HTTP 200 s obsahom Mandátu.
- 13. 9. 2026 17:30 (Codex): OAuth prihlásenie prešlo, statické súbory sa nahrali, ale Cloudflare odmietol vytvorenie Workeru chybou 10034 (účet potreboval overiť e-mail).
- 13. 9. 2026 17:40 (Claude): nové OAuth prihlásenie (token Codexu ostal v jeho sandboxe), nový build (BUILD_ID 74141ef2…, 46 modulov, 71 statických súborov, 457 KiB gzip), `wrangler deploy` nahral Worker `mandat-preview` úspešne. Publikovanie na workers.dev zlyhalo: účet nemá zaregistrovanú workers.dev subdoménu (wrangler sa na ňu pýta interaktívne, v neinteraktívnom behu odpovie „no“). Subdoména je nastavenie celého účtu (spoločná pre všetky Workery, tvar `<worker>.<subdoména>.workers.dev`), preto ju má zvoliť a zaregistrovať vlastník: v dashboarde Workers & Pages → Onboarding / Settings → workers.dev subdomain, alebo odpoveďou „yes“ pri interaktívnom `npm run deploy:preview` v termináli. Potom `npm run deploy:preview` zopakovať; Worker sa len znovu publikuje a adresa sa vypíše.
- 13. 9. 2026 17:45 (Claude, so súhlasom Petra): subdoména účtu `mandat` zaregistrovaná cez API (PUT /accounts/{id}/workers/subdomain, prihlásenie wranglera). Cieľová adresa bude https://mandat-preview.mandat.workers.dev. Opakovaný `wrangler deploy` Worker nahral, ale zapnutie workers.dev adresy (/workers/scripts/mandat-preview/subdomain) skončilo chybou 10034: účet musí mať overený e-mail. Overenie urobí vlastník: odkaz v e-maile od Cloudflare pre peter.madar@muziker.com, prípadne znovu poslať z https://dash.cloudflare.com/profile (Verify email). Po overení stačí `npm run deploy:preview`; adresa sa vypíše a treba ju overiť v prehliadači (HTTP 200, statické súbory, záložky, panel strany).
- 13. 9. 2026 17:50 (Claude): Peter overil e-mail, `wrangler deploy` publikoval triggery. **Web beží na https://mandat-preview.mandat.workers.dev** (verzia 24b37991…). Overenie výsledku je zapísané nižšie.

## Známe prekážky pri builde na tomto počítači

Ak build padne s `EPERM ... rmSync dist`, drží adresár `dist` iný lokálny proces (13. 9. to bol Codexov test `wrangler dev --config wrangler.preview.jsonc --port 8787`, ktorý ostal bežať). Buď ten proces ukončiť, alebo spustiť build bez mazania výstupu: `VINEXT_KEEP_DIST=1 vinext build` (prepínač je vo `vite.config.ts`, súbory sa prepíšu na mieste; pri bežnom builde ho nepoužívať, aby v `dist` neostávali staré súbory).

## Opakovanie nasadenia

V priečinku `outputs/web`:

```powershell
npm run build
npm run check:preview
npm run deploy:preview
```

Ak chýba prihlásenie, spustiť `node node_modules/wrangler/bin/wrangler.js login` a dokončiť ho v prehliadači. Heslá ani tokeny neukladať do projektu.

Po prihlásení najprv overiť účet a prípadnú existenciu Workeru s rovnakým názvom. Presnú workers.dev adresu prevziať z úspešného nasadenia; nevymýšľať príponu účtu. Potom skontrolovať HTTP odpoveď, statické súbory a interakcie v online prehliadači.

Táto konfigurácia používa verejnú workers.dev adresu. Nezapína ochranu prihlásením. Pôvodný lokálny dev server na porte 5173 zostáva samostatný.

## Git a automatické nasadenie

Git repozitár je zakorenený priamo v `outputs/web`, používa vetvu `main` a je pripojený k `https://github.com/daepeter-debug/mandat`. Neukladá `node_modules`, build `dist`, lokálny stav Wrangleru, `.env` súbory ani TypeScript cache.

Odporúčané nastavenie Cloudflare Workers Builds pre súkromný GitHub repozitár:

- Production branch: `main`
- Root directory: `/`
- Build command: `npm run build`
- Deploy command: `npm run deploy:preview`

V Cloudflare: Workers & Pages → `mandat-preview` → Settings → Builds → pripojiť Git repository. Cloudflare potom nasadí nový commit po pushnutí na `main`; ostatné vetvy možno používať na náhľady pred spojením.

## Nasadenie 1. 10. 2026

Na žiadosť Petra nasadený úvod s Evou, denná slávnosť Malej republiky a oprava nového spustenia z mobilnej ikony (Prehľad; reload hry a explicitné skratky sa zachovajú). Build, dátové/herné testy, TypeScript, ESLint a dry-run prešli. Priamy deploy verzia `b90098ea-06a4-4587-8e91-781ec453d01f`; adresa zostáva `https://mandat-preview.mandat.workers.dev`.

Online kontrola mobilného viewportu: domovská adresa otvorí Prehľad, Viac zatvorené; `/?v=game&g=republic` otvorí hru s dennou výzvou, začatie a reload ukladajú stav. Bez chýb konzoly a bez vodorovného pretekania pri obsahu 375 px. Fyzické otvorenie z ikony overí Peter; samotný návrat už bežiacej aplikácie z pozadia hru neprerušuje. Service worker cache `2026-10-01` nemení localStorage hier.

## Nasadenie sedemdňového príbehu 1. 10. 2026

Na pokyn „ok nasad“ nasadené plynulé pokračovanie z úvodu do siedmich herných dní, rozdielne ciele/rozpočty, okamžitý posun po splnení 3/3 cieľov a jednorazová slávnostná brána. Použitý overený produkčný build tejto revízie; Wrangler dry-run aj deploy PASS. Priama Worker verzia `0db06e43-b1a4-4dc8-9479-c661a1c659cb`, rovnaká workers.dev adresa.

Online overené načítanie nového UI, dohranie existujúcej dennej slávnosti, otvorenie príbehu a zachovanie prvého rozpracovaného herného dňa po obnovení stránky. Mobilný viewport 390 × 844 bez horizontálneho pretekania (obsah 375 px), konzola bez chýb. Snímka `docs/mala-republika/previews/journey-online-mobile.png`. Herné uloženia sa neresetujú; posledné lokálne testy a rozsah sú v STATUS.md. Zdrojová revízia sa synchronizuje do `main`; Cloudflare Builds môže následne vydať rovnaký kód pod ďalším identifikátorom verzie.

## Nasadenie novej úvodnej ilustrácie 1. 10. 2026

Na pokyn „ok pokracuj a nasad“ nasadený nový cover Malej republiky do Herne a prvého privítania. TypeScript, cielený ESLint, build, vizuálna kontrola desktop/mobil a dry-run PASS. Worker verzia `eb9289f0-dd8a-4dd6-a0db-fdbc53366755`, adresa zostáva https://mandat-preview.mandat.workers.dev. Nová verzovaná WebP ilustrácia sa online načítava. Stav hry ani service worker sa nemenia. Zdrojová revízia sa synchronizuje s main; Cloudflare Builds môže rovnaký kód vydať pod ďalším ID.

## Tridsiatka online: Durable Object (2. 10. 2026, Claude)

Rebríček kvízu dňa, porovnanie a výzvy ukladá jeden Durable Object `QuizBoard` so SQLite úložiskom (opis funkcií: GAMES.md, Tridsiatka).
- Väzba `QUIZ` a migrácia `tridsiatka-v1` (`new_sqlite_classes`) sú vo `wrangler.preview.jsonc` aj vo `vite.config.ts` (lokálna konfigurácia buildu); musia sedieť.
- Trieda musí byť exportovaná z hlavného modulu Workera. Vstup je preto `worker/index.ts`: celý web obsluhuje vinext (`vinext/server/fetch-handler`), súbor len pridáva `export { QuizBoard }`.
- Inštancia je jedna, `tridsiatka` v jurisdikcii EÚ (`app/api/kviz/route.ts`), takže údaje ostávajú v EÚ. Lokálny workerd jurisdikcie nepozná, tam sa použije obyčajná inštancia.
- Prečo nie D1: Workers Builds nasadzuje s automatickým tokenom bez oprávnenia na D1, takže väzba na D1 by zablokovala každé nasadenie (aj Codexove). Durable Object je súčasť Workera: žiadna nová databáza, token ani nastavenie v Cloudflare. Na pláne Workers Paid je v cene.
- **Pozor pri zmenách:** triedu `QuizBoard` nepremenovať ani neodstrániť bez novej migrácie (`renamed_classes`, `deleted_classes`). Odstránenie zmaže všetky uložené výsledky a výzvy. Tvar tabuliek sa mení v `SCHEMA` v `lib/quiz-store.ts`, nie migráciou.

**Lokálne skúšanie** (v `outputs/web`, po `npm run build`):

```powershell
node --import ./scripts/sites-env.mjs node_modules/wrangler/bin/wrangler.js dev --config wrangler.preview.jsonc --local --persist-to .wrangler/state --ip 127.0.0.1 --port 8787
node scripts/smoke-quiz-api.mjs http://127.0.0.1:8787
```

Lokálne úložisko je v `.wrangler/state` (mimo gitu). Skúšobný skript odmietne iný ako lokálny server, aby sa skúšobné kolá nedostali do ostrého rebríčka.

## Nová verzia po návrate aplikácie z pozadia (2. 10. 2026, Claude)

Nainštalovaná aplikácia mohla v pozadí bežať celé dni so starým kódom aj údajmi; novú verziu ukázala až po zatvorení a novom otvorení.
- Každý build dostane značku `__MANDAT_BUILD__` (`define` vo `vite.config.ts`), rovnakú v prehliadači aj na serveri; `/api/verzia` ju vracia.
- Keď sa stránka vráti z pozadia po aspoň 10 minútach a značka na serveri je iná, stránka sa obnoví (`useFreshVersion` v `components/app-install.tsx`).
- Adresa (sekcia, hra) ostane a rozohrané hry sú uložené v zariadení. Neobnovuje sa, keď je fokus v poli na písanie alebo keď hrá nahrávka.
