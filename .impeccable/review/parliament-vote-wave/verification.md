# Overenie — hlasovania bez stĺpikov, 2. 10. 2026

Rozsah: iba `components/parliament-ar.tsx`; žiadne zmeny politických dát, GLB, hier, CSS ani Worker konfigurácie.

- Všetkých 16 `scripts/verify-*.mjs`: PASS. Zahŕňajú kontrolu 348 hlasovaní a rozdelenia 150 kresiel, mesačných variantov a deterministického `seatSweep`.
- `npx tsc --noEmit`, úplný `npm run lint`, `git diff --check`: PASS.
- `node scripts/build-dark.mjs --check`: PASS, `0358096b9c`; CSS sa nemenilo.
- `npm run build`: PASS po opakovaní mimo sandboxu. Prvý pokus zablokoval Windows `spawn EPERM`; výsledný build má len existujúce upozornenia na veľkosť chunkov a klasifikáciu route.
- GLB: 1 444 616 B, 150 kresiel, 165 kanálov; Khronos 0 chýb/0 varovaní. SHA-256 `dc6cf7b358cc281eab8a8513d9f7a71f44160b72851e00f6623a36483a353b53` je nezmenený. Obnovená validačná správa zodpovedá už existujúcemu modelu, nie novému modelu.
- Detector na zmenenom komponente: jeden beh, `[]`.

Živé IAB interakcie: najnovšie hlasovanie má 90/0/52/0/8. Klik na kreslo otvoril Kéry, Marián / SMER - SD / za; druhý klik výber zrušil. Rýchla zmena rozpočet 2026 → rozpočet 2025 zobrazila 79/58/0/0/13; Strany → Hlasovania zachovalo aktuálny výsledok. Nové snímky ukazujú sálu bez stĺpikov. Po oprave načítavania materiálov a reload nebol zaznamenaný ďalší runtime error; staré chyby zostávajú v histórii konzoly.

Snímky: desktop 1280×800; nastavené mobilné CSS viewporty 375×812 a 402×874, obe témy. Provider vrátil mobilné obrazové súbory 360×780 a 387×841, JPEG dáta pod príponou `.png`. Kontrola DOM pri šírke375: innerWidth375, documentElement.scrollWidth360, stage6–339/šírka333; bez vodorovného pretekania. Snímky nie sú dôkaz fyzického zariadenia ani presnej veľkosti exportu mobilu.

Statické snímky nedokazujú plynulosť 1 050 ms animácie alebo viditeľnosť jemného zvýraznenia v pohybe. Reduced-motion, skrytý dokument, zrušenie async práce a animácie boli posúdené v zdroji. Fyzické Safari/Chrome, AR, FPS a živé reduced-motion neboli odskúšané. PNG dôkazy zostávajú lokálne mimo Gitu.
