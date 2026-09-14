# Testovacie nasadenie na workers.dev

**Aktuálna adresa:** https://mandat-preview.mandat.workers.dev (Worker `mandat-preview`, účet Petra, subdoména `mandat`). Nové nasadenie: v `outputs/web` spustiť `npm run build` a `npm run deploy:preview` (prihlásenie wranglera musí byť aktívne).

Používateľ zvolil priamy Cloudflare hosting. Konfigurácia `wrangler.preview.jsonc` nasadzuje Worker `mandat-preview` a statické súbory z `dist/client`. Aplikácia nepotrebuje D1, R2 ani aplikačné tajomstvá.

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
