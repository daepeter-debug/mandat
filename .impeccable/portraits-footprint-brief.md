# Profily strán a hlasovacia stopa — 10. 10. 2026

## THESIS
Operate / Read. Schválené body 2 a 3: redakčné portréty strán a grafická stopa poslanca. Refinement existujúcich komponentov, nie výmena vizuálnej identity. Bez zmien politických dát, výpočtov a 3D.

## OWN-WORLD
Autorita ../../DESIGN.md: IBM Plex Sans, krémový papier, zelený atrament, autentické logá a sémantické farby strán/hlasov. Existujúce licencované portréty, žiadne nové obrázky či náhodné dekorácie.

## STORY
Profil strany → logo a podpora → zameranie → viditeľná história vlády → osobnosti → financie/merania → aktuálne dokumenty a oddelený archív 2023. Poslanec → pôvodné štatistiky → mozaika skutočných hlasov → detail jedného hlasu → pôvodná sála a zdroj.

## FIRST VIEWPORT
Profil: výrazné logo, plný názov, jemné tónovanie zo skutočnej farby, čitateľná podpora a tagy. Osobnosti majú väčšie reálne fotografie. Stopa: farebné políčka s roku a dátumom, výber ukáže skutočný názov a hlas. Na mobile dostatočné ciele, obmedzený počet políčok na stránku.

## FORM
Žiadny nový svet/comp round. Bočný panel zachováva navigáciu aj URL, šírky 375/402/1280 px a oba motívy. Viditeľná časová os vlády má pôvodný dátum kontroly, nie dnešný deň. Archív programov nie je dnešný sľub. Mozaika od najstaršieho k najnovšiemu v zobrazenom výreze, strany najviac 42 skutočných hlasovaní, rok a paging, explicitne ide o archivované záverečné hlasovania. Nečlenstvo nie je neprítomnosť. Žiadne hodnotiace skóre.

## FINISH
Najviac dve batched vizuálne kolá; jeden detector. Verify skripty, tsc, lint, build-dark a build. Finish review/documenter inline podľa degraded kontraktov, transparentne ako kontrola implementátora. Menovitý commit, synchronizácia s Claudom pred pushom, verejné overenie. Fyzický iPhone/Safari sa netvrdí.

## DOKONČENIE
Implementované a overené body 2 a 3. Väčšie autentické portréty, zameranie, viditeľná časová os vlády k 13. 9. 2026 a oddelené aktuálne návrhy/archív 2023. Mozaika presných hlasov: rok, najviac 42 na stránku, detail, zdroj, sála; žiadne nové politické tvrdenia.

Dve batched vizuálne kolá a potvrdenie opráv: mobilný názov má rezervu pre X, detail sa odkryje nad navigáciou, tmavé neprítomnosti majú viditeľný okraj, desktopový profil sa nezakrýva sticky lištou. Width srcset rešpektuje väčšie fotografie. Všetkých 30 verify skriptov, tsc, ESLint, dark check a build prešli. Jeden detector: []. QA 375/402/1280 px, svetlý/tmavý motív, paging, Enter, presný zdroj a prechod hlasovania 58044 do sály. Inline finish review: ship, ten istý implementátor, bez nezávislého overenia; fyzický Safari neoverený. Dôkazy a päťsekčný review v .impeccable/review/portraits-footprint/.

Inline documenter: IBM Plex Sans / krémový papier / zelený atrament / autentické farby / pôvodná navigácia. Autorita DESIGN.md nezmenená. PRODUCT.md a CHANGELOG.md zaznamenávajú iba tento schválený refinement.
