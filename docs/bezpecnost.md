# Bezpečnosť Mandátu

Stav k 10. 10. 2026 (kontrola a nasadenie hlavičiek: Claude). Kontrola v repe: `node scripts/verify-security.mjs`.

## Čo web chráni a ako

| Riziko | Ochrana |
|---|---|
| Cudzí skript v stránke (XSS) | Content-Security-Policy povoľuje skripty len z vlastného webu a zo Stripe (`next.config.ts`). V kóde sa nikde nevkladá cudzí text ako HTML (React všetko escapuje); výnimky sú len dva statické skripty v `app/layout.tsx` a `components/ui/chart.tsx`, stráži to `verify-security`. |
| Vloženie Mandátu do cudzej stránky (clickjacking, aj platobného panela) | `frame-ancestors 'none'` + `X-Frame-Options: DENY`. |
| Únik dát na cudzie servery | CSP `connect-src`, `form-action`, `frame-src`: prehliadač pustí spojenia len na vlastný web a Stripe. |
| Podvrhnutý typ súboru, odkazy a funkcie zariadenia | `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` vypína polohu, mikrofón, USB a iné. HTTPS vynucuje `Strict-Transport-Security` (a doména `.dev` je HSTS aj v prehliadačoch). |
| Kľúče a heslá | Len v tajomstvách Workera (Cloudflare), nikdy v repe ani v kóde pre prehliadač. História gitu aj build sú bez kľúčov (kontrola 10. 10. 2026). `.gitignore` drží `.env*`, `*.env`, `.dev.vars*`, `*.pem`, `*.key`. |
| Zneužitie API | Hodnoty sa overujú na serveri a požiadavky z cudzích webov sa odmietajú. Podrobnosti v tabuľke nižšie. |
| Osobné údaje | Web nemá účty ani heslá. Ukladá sa len prezývka v kvíze (dobrovoľná, s filtrom) a odtlačok IP (SHA-256) na limit pokusov. Platobné údaje vidí len Stripe; logy obsahujú len sumy a ID platieb. |

**Ochrana jednotlivých API:**

| API | Ochrana |
|---|---|
| `/api/kviz` | Body prepočíta server, SQL s parametrami, limit 16 kB, filter prezývok, limit pokusov. |
| `/api/podpora` | Suma 2–500 € overená na serveri, limit pokusov, len z vlastného webu. |
| Webhook | Overený podpis Stripe, najviac 5 minút starý. |
| `/api/udalost` | Len udalosti zo zoznamu, bez osobných údajov. |

Statické súbory majú rovnaké hlavičky v `public/_headers`, ktorý sa generuje z `next.config.ts` príkazom `node scripts/build-headers.mjs`.

**Pri pridaní nového externého zdroja** (CDN, vložené video, mapa, analytika) treba doplniť CSP v `next.config.ts`, spustiť `build-headers` a overiť konzolu, inak ho prehliadač zablokuje.

## Knižnice (npm audit, 10. 10. 2026)
`npm audit --omit=dev` hlási 7 zraniteľností (1 kritická, 5 vysokých, 1 stredná). Žiadna nebeží na verejnom webe:
- **`next`** (kritická, obchádzanie middleware pri Turbopacku): web beží na vinext, server Next.js ani Turbopack nepoužíva. `postcss` spracúva len vlastné CSS pri builde.
- **`sharp`** (libvips): len v skriptoch na lokálne spracovanie vlastných obrázkov, nie na webe.
- **`fast-uri`, `nanoid`, `source-map-js`, `baseline-browser-mapping`**: nástroje pri builde.

Aktualizácia (`npm audit fix`, `sharp`, `next`) je vhodná pri najbližšej údržbe. Pozor:
- mení zdieľané `node_modules`, ktoré používa aj Codex;
- po nej treba overiť build a 3D.

## Čo robí Peter (účty sú najčastejšia cesta k napadnutiu webu)
- [ ] Dvojstupňové overenie (2FA) na **GitHube**, **Cloudflare**, **Stripe** (zapnuté) a na **e-maile**, ktorý k nim patrí.
- [ ] GitHub repo ostáva súkromné. V Settings → Collaborators a Deploy keys nikto cudzí.
- [ ] Cloudflare → My Profile → API Tokens: žiadne staré alebo nepoužívané tokeny.
- [ ] Kľúče (Stripe, ElevenLabs a pod.) nikdy do chatu, e-mailu ani dokumentov.
- [ ] Po prechode na vlastnú doménu v Cloudflare zapnúť pravidlo obmedzenia požiadaviek (Rate limiting) na `/api/*`. Na `workers.dev` to nejde.
