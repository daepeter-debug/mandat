/*
  Prepínače častí webu. Sú zámerne v samostatnom module bez dát: keď je časť vypnutá,
  jej komponent aj jej register sa načítajú dynamicky, takže sa do prehliadača vôbec nepošlú.
*/

// Register káuz je od 18. 9. 2026 vypnutý (rozhodnutie redakcie). Dáta, výpočet závažnosti
// aj kontroly ostávajú; po prepnutí na true sa vráti záložka Kauzy, dlaždica v mobilnom
// rozcestníku aj blok v profile strany.
export const casesEnabled = false;
