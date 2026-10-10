# Podpora Mandátu cez Stripe

Dobrovoľný jednorazový príspevok priamo na webe: Apple Pay, Google Pay alebo karta, bez registrácie a bez odchodu z Mandátu. Stav k 10. 10. 2026: kód je pripravený, **platby sú vypnuté**, kým v Cloudflare nie sú kľúče Stripe. Ostré platby sa zapnú až po vyriešení právnych a účtovných otázok (nižšie) a po výslovnom rozhodnutí.

## Ako to funguje

1. **Výber sumy.** Návštevník klikne na „Podporiť Mandát“ a otvorí sa bočný panel (na mobile cez celú obrazovku). Vyberie 3, 5, 10, 20 € alebo vlastnú sumu od 2 € do 500 €.
2. **Vytvorenie platby.** Prehliadač pošle sumu na `POST /api/podpora`. Server ju overí znova a vytvorí Stripe Checkout Session (`ui_mode=embedded`) na overenú sumu.
3. **Platobný formulár.** Do panela sa vloží formulár Stripe (Embedded Checkout). Stripe.js sa načíta z `js.stripe.com` až v tejto chvíli, nie pri návšteve webu. Apple Pay a Google Pay ukáže Stripe podľa zariadenia a prehliadača.
4. **Výsledok.** Po dokončení sa prehliadač opýta `GET /api/podpora?session=…` a server zistí stav priamo zo Stripe. Poďakovanie sa ukáže len pri stave „zaplatené“; samotný návrat na web nič nedokazuje.
5. **Záznam o platbe.** Stripe pošle podpísanú udalosť na `/api/podpora/webhook`. Server overí podpis (HMAC-SHA256, najviac 5 minút starý) a zapíše do Workers Logs riadok `{"podpora":"zaplatene", …}`, teda sumu, režim a ID bez osobných údajov. Účtovná evidencia je v administrácii Stripe (výpisy, exporty).

**Súbory:**
- `lib/support.ts`: sumy a validácia, spoločné pre prehliadač aj server;
- `lib/support-server.ts`: volania Stripe API cez `fetch` bez knižnice, režimy a podpis webhooku;
- `app/api/podpora/route.ts` a `app/api/podpora/webhook/route.ts`;
- `components/support.tsx` (vstupy a hostiteľ) a `components/support-sheet.tsx` (panel);
- štýly `app/support.css` a `app/support-entry.css`;
- kontrola `scripts/verify-support.mjs`.

**Režimy** (`supportConfig` v `lib/support-server.ts`):

| Kľúče v Cloudflare | Čo vidí návštevník |
|---|---|
| žiadne alebo neúplné | nič, web je ako doteraz |
| testovacie `sk_test_`/`rk_test_` + `pk_test_` | všetci (web zatiaľ nie je propagovaný, rozhodnutie 10. 10. 2026); panel má štítok „Testovací režim“, poďakovanie hovorí, že sa nič nestrhlo, a skutočnú kartu Stripe v teste odmietne |
| ostré `sk_live_`/`rk_live_` + `pk_live_` **bez** `PODPORA_OSTRA=ano` | nič, ostré kľúče samé platby nezapnú |
| ostré kľúče + `PODPORA_OSTRA=ano` | všetci |

Ak kľúče nesedia (testovací a ostrý), podpora je vypnutá.

**Kde je podpora na webe:**
- počítač: pilulka „Podporiť“ v hlavičke pred prepínačom tmavého režimu;
- mobil: karta „Podporiť Mandát“ v paneli Viac. V hlavičke na 375 px nie je miesto, srdiečko by prekrylo logo;
- všade: sekcia „Podporte nezávislý Mandát“ na konci úvodnej stránky, odkaz v pätičke a časť „Podpora a financovanie“ v O dátach (adresa `#podpora`);
- odkaz `…/?podpora=1` otvorí panel rovno.

Žiadne vyskakovacie okná ani pripomínanie.

## Čo nastaviť v Stripe (ručne, Peter)

1. **Účet.** Na stripe.com zvoľ krajinu Slovensko. Typ účtu (fyzická osoba-podnikateľ alebo firma) závisí od právneho rozhodnutia nižšie.
   - Model opíš pravdivo, napríklad: „Dobrovoľné jednorazové príspevky na prevádzku nezávislého webu s prehľadom volebných prieskumov a politických dát. Bez protiplnenia, nie charita ani politická strana.“
   - Výplaty pôjdu na existujúci účet (IBAN).
   - Testovací režim (sandbox) funguje hneď, ešte pred overením totožnosti.
2. **Kľúče** (Developers → API keys, v testovacom režime):
   - **Publishable key** `pk_test_…`.
   - Namiesto tajného kľúča odporúčam **Restricted key** `rk_test_…` s jediným oprávnením **Checkout Sessions: Write**, všetko ostatné None. Server nič iné nepotrebuje.
3. **Platobné metódy** (Settings → Payment methods):
   - zapni Cards, Apple Pay, Google Pay;
   - metódy s presmerovaním (napríklad bankové prevody) nechaj vypnuté, platba tak ostane na webe;
   - Link je voliteľný.
4. **Domény pre Apple Pay a Google Pay** (Settings → Payment method domains):
   - pridaj `mandat-preview.mandat.workers.dev`, po prechode na vlastnú doménu aj ju;
   - ak Stripe pri Apple Pay vyžiada overovací súbor, patrí do `public/.well-known/apple-developer-merchantid-domain-association`. Je verejný, nie je to tajomstvo.
5. **Vzhľad** (Settings → Branding), aby vložený formulár zapadol do Mandátu:
   - ikona polkruh Mandátu;
   - farba značky a tlačidiel `#20392f`;
   - zaoblené rohy;
   - písmo IBM Plex Sans, ak ho ponúka, inak systémové.
6. **E-maily a údaje:**
   - Settings → Customer emails → Successful payments zapnúť: platiteľ dostane potvrdenie.
   - Public details:
     - verejný názov „Mandát“;
     - kontaktný e-mail;
     - text na výpise (statement descriptor), napríklad `MANDAT PODPORA`.
7. **Webhook** (Developers → Webhooks → Add endpoint):
   - adresa `https://mandat-preview.mandat.workers.dev/api/podpora/webhook`;
   - udalosti `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`;
   - podpisové tajomstvo `whsec_…` patrí do Cloudflare (bod 8).
8. **Kľúče do Cloudflare** (Workers & Pages → mandat-preview → Settings → Variables and Secrets → Add):
   - **Všetky štyri premenné zadaj ako typ „Secret“:** `STRIPE_SECRET_KEY` (rk_/sk_), `STRIPE_PUBLISHABLE_KEY` (pk_), `STRIPE_WEBHOOK_SECRET` (whsec_) a neskôr `PODPORA_OSTRA`. Bežnú textovú premennú by ďalšie nasadenie z gitu zmazalo, tajomstvá ostávajú.
   - Druhá možnosť je terminál: `node node_modules/wrangler/bin/wrangler.js secret put STRIPE_SECRET_KEY --config wrangler.preview.jsonc`. Hodnotu vlož až do výzvy wranglera, nie do príkazu ani do chatu.
   - Kľúče nepatria do repa, `wrangler.preview.jsonc`, chatu ani kódu pre prehliadač.

## Test (testovací režim)

1. Otvor web a klikni na „Podporiť Mandát“ (koniec úvodnej stránky, panel Viac alebo pätička). Odkaz `…/?podpora=1` otvorí panel rovno.
2. Karty:
   - `4242 4242 4242 4242`: úspech;
   - `4000 0027 6000 3184`: overenie 3D Secure;
   - `4000 0000 0000 0002`: zamietnutá.
   - Dátum ľubovoľný budúci, CVC ľubovoľné.
3. Apple Pay (Safari na iPhone) a Google Pay (Chrome na Androide) sa v testovacom režime dajú vyskúšať so skutočnou kartou v peňaženke. Nič sa nestrhne.
4. Skontroluj:
   - Stripe → Payments;
   - Stripe → Webhooks: doručenie so stavom 200;
   - Cloudflare → Observability, filter na pole `podpora`: `nova` pri vytvorení, `zaplatene` z webhooku, `vyprsalo` pri nedokončenej platbe po 30 min.
5. Lokálne: skopíruj `.dev.vars.example` ako `.dev.vars` (je v `.gitignore`) a doplň testovacie kľúče.
   - `npm run dev` ho číta z koreňa projektu.
   - `wrangler dev` nad buildom ho číta vedľa `dist/server/wrangler.json`, tam ho skopíruj po každom builde.
   - Webhook lokálne netreba, overuje ho `scripts/verify-support.mjs`.

## Prechod na ostré platby (len po výslovnom rozhodnutí)

- [ ] Vyriešené právne a účtovné otázky nižšie.
- [ ] Účet Stripe aktivovaný: totožnosť, IBAN, opis činnosti, kontakt a pravidlá vrátenia peňazí na webe (Stripe ich pri aktivácii vyžaduje).
- [ ] V ostrom režime:
  - nový restricted key `rk_live_…` a `pk_live_…`;
  - nový webhook s vlastným `whsec_…`;
  - doména v Payment method domains.
- [ ] V Cloudflare vymenené tri kľúče za ostré a pridané `PODPORA_OSTRA` = `ano` (Secret).
- [ ] Skúšobná ostrá platba 3 €, kontrola webhooku a logu a jej vrátenie v Stripe.
- [ ] Pri vlastnej doméne: nová adresa webhooku a doména v Stripe (a zvyšok podľa odovzdávky o doméne).

Vypnutie kedykoľvek: zmaž `PODPORA_OSTRA` alebo kľúče v Cloudflare. Podpora z webu zmizne bez nového nasadenia.

## Právne a účtovné otázky (otvorené, nie je to právna ani daňová rada)

Pred ostrými platbami ich treba overiť s daňovým poradcom alebo účtovníkom:

- **Kto prijíma peniaze.** Prijímanie ako súkromná osoba alebo v rámci existujúcej živnosti. Stripe nemá účet pre „súkromnú osobu bez podnikania“: zakladá sa ako fyzická osoba-podnikateľ alebo firma. Ak by príspevky súviseli s činnosťou, z ktorej má prevádzkovateľ príjem, alebo s jeho autorskou činnosťou, môže to zmeniť ich zaradenie.
- **Daňové zaradenie.** Treba ho overiť podľa zákona o dani z príjmov (napríklad či ide o príjem z podnikania, ostatný príjem, alebo či sa uplatní oslobodenie darov). Označenie „dar“ v texte samo o sebe režim neurčuje; preto ho web ani Stripe nepoužívajú. Pri registrácii pre DPH overiť aj DPH.
- **Podmienky Stripe.** Overiť v zozname zakázaných a obmedzených činností (`stripe.com/legal/restricted-businesses`), či dobrovoľné príspevky na politicko-analytický web nevyžadujú schválenie. Pri pochybnosti sa opýtať podpory Stripe ešte pred aktiváciou.
- **Voľby a neutralita.** Mandát nie je politická strana, kandidát ani kampaň. Overiť, že príspevky nespadajú pod pravidlá financovania volebnej kampane, najmä pred voľbami.
  - Redakčné rozhodnutie: neprijímať príspevky od politických strán, hnutí a kandidátov?
  - Text na webe uvádza, že príspevky nemajú vplyv na obsah ani výber dát. Ak to tak nemá byť, treba ho zmeniť.
- **Osobné údaje.**
  - Do O dátach je pripravená veta o Stripe; zobrazí sa až pri zapnutej podpore.
  - Mandát sám nič neukladá, ani v logoch: len sumu a ID platby.
  - V administrácii Stripe sú e-mail a meno platiteľa: kto k nim má prístup a ako dlho sa uchovávajú (účtovné lehoty).
- **Podmienky príspevku.** Krátky text, napríklad: dobrovoľný a jednorazový, bez protiplnenia, vrátenie len pri chybe (napríklad dvojitá platba), kontakt na prevádzkovateľa.
