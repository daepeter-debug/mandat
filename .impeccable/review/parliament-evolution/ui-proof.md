# Overenie po synchronizácii s Claude (2. 10. 2026)

Základ main 88d7009: bez kompresie, režim Hlasovania, 348 záznamov. Model sa nemenil, 1 444 616 B / 150 kresiel / 165 kanálov. Zachované poradie [...modely, prechod, hlasovanie], materiály a časovanie.

Všetky verify-*.mjs vrátane votes, dáta, TS, ESLint app/components/lib/scripts/worker a build-dark --check prešli znova po poslednej oprave. Khronos 0 chýb, 0 varovaní. Detector raz, [] pred synchronizáciou. Finálny produkčný build prešiel (2. 10. 2026).

UI: živé prehrávanie prešlo január → september a na konci sa zastavilo. Presné mesačné kreslá a exclusion overuje verify-parliament-evolution; zo samotných snímok nevyvodzujeme plynulosť. Konzola posledného čistého načítania bez chýb. Neistota Demokratov 49 % / 0–10 kresiel; pri vynechaní 150 = 33+14+22+17+36+15+13. Koalícia PS+REPUBLIKA+SaS+KDH = 81, viditeľný výsledok a skutočný PNG 1080×1350 obsahujú aktualizované 1. 10. 2026 a caveat.

Snímky final/*-votes.png zachytávajú aktuálne hlasovanie 1. 10. 2026: 90 za / 0 proti / 52 zdržaní / 0 nehlasovali / 8 neprítomní. Board je pod sálou. Mobil 375/402 CSS override, dokumentová šírka 360/387 (provider scrollbar), výška874; desktop1280×800. Obidve témy sú potvrdené data-theme a obrázkom.

Detail strany je pod sálou (final/375-dark-edge.png,402-dark-edge.png,375-light-edge.png,402-light-edge.png). Desktop final/1280-dark-exclusion.png je ustálený scenár. Ostatné mesačné snímky a capture-matrix NIE SÚ použiteľné ako dôkaz ustáleného pohľadu: automatické posúvanie/fokus počas capture ovplyvnilo kameru alebo zachytilo prechod. Reviewer ich nemá považovať za finálne referencie.

PNG final/coalition-card.png vznikol cez toBlob skutočnej scény a bol uložený z DOM dataURL, nie z vykonštruovaných dát. Náhľad je viditeľný. IAB download čaká bez udalosti; natívne share ani fyzické stiahnutie na telefóne neboli testované a žiadne zdieľanie smerom von sa nevykonalo.

Neoverené na fyzickom iPhone/Android: FPS, mobilné dáta, natívne AR/share/download a live reduced motion. Reduced motion/visibility sú skontrolované v zdroji. Adaptive render ostáva, minimum .6 znamená najnižší krok .62; výkonový kompromis bez tvrdenia o nameraných FPS.

Čerstvý reviewer prijal 14 pôvodných snímok. Jediná oprava odstránila inline farbu malého názvu hlasu v detaile poslanca; všetky hlasy teraz používajú tematickú farbu textu. Štyri nové snímky final/1280-light-deputy-fixed.png, 1280-dark-deputy-fixed.png, 375-light-deputy-fixed.png a 375-dark-deputy-fixed.png vznikli po skutočnom výbere kresla (Kačmár, Jozef). DOM potvrdil svetlý text #4f6057 na #e5ebd8 a tmavý #bfcec6 na #2a2f20. Reviewer spočítal kontrast 5,47:1 a 8,43:1 a uzavrel rozsah ako disposition: ship, bez ďalších regresií.

Nasadenie: kód 7a7af24, git pull --rebase bez ďalších zmien, push main úspešný. npm run deploy:preview úspešne nasadilo Cloudflare verziu dc3f63cb-faa9-4c79-8ddd-72349d38c20f. Verejný náhľad https://mandat-preview.mandat.workers.dev/ zobrazil sálu aj board pod ňou; skutočné kliknutie na kreslo ukázalo Faič, Vladimír / SMER - SD / za, s neutrálnou farbou textu rgb(79,96,87). Chyby konzoly []. Lokálne uložené final/online-votes.png a online-deputy.png. Verejný model HTTP200, 1 444 616 B, SHA256 dc6cf7b358cc281eab8a8513d9f7a71f44160b72851e00f6623a36483a353b53, zhodný s lokálnym súborom. PNG dôkazy zostávajú lokálne mimo Git.
