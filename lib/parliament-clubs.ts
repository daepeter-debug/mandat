import { parliamentClubs } from "./parliament-clubs.data.ts";
import { parties } from "./polls.ts";
import { blocSeats, optionalIds, type SeatEntry } from "./blocs.ts";
import type { ParliamentVariant } from "./parliament-model.ts";

/*
  Kluby NR SR k poslednému hlasovaniu (lib/parliament-clubs.data.ts zo scripts/build-deputies.mjs).
  Skutočné zloženie snemovne podľa poslaneckých klubov, nie výsledok volieb ani scenár. Poradie je poradie sály
  z režimu Hlasovania (koalícia vľavo, nezaradení a Hnutie Slovensko v strede, opozícia vpravo), takže každý klub
  sedí na rovnakých miestach ako pri hlasovaniach.
*/
export const CLUBS_AS_OF = parliamentClubs.asOf;
export const UNAFFILIATED = { id: "nezaradeni", short: "Nezaradení", color: "#a3aba5" } as const;
const partyInfo = (id: string) => id === UNAFFILIATED.id ? UNAFFILIATED : parties.find(p => p.id === id) ?? { id, short: id.toUpperCase(), color: "#a3aba5" };

/** Kluby v poradí sály s farbou a skratkou strany. */
export const clubEntries: (SeatEntry & { club: string })[] = parliamentClubs.clubs.map(c => {
  const p = partyInfo(c.party);
  return { id: c.party, short: p.short, color: p.color, seats: c.seats, club: c.club };
});

/** Strana (klub) každého zo 150 kresiel v poradí chamberSeats. */
export const clubSeatParty = clubEntries.flatMap(c => Array.from({ length: c.seats }, () => c.id));

/** Variant „Kluby dnes“ pre 3D sálu. Nie je v GLB: kreslá sa farbia cez samostatné materiály prechod:<i>. */
export function clubsVariant(): ParliamentVariant {
  const entries = clubEntries.map(({ id, short, color, seats }) => ({ id, short, color, seats }));
  return { id: "kluby", label: "Kluby dnes", ordered: entries, seatParty: clubSeatParty, blocs: blocSeats(entries), withPartners: blocSeats(entries, optionalIds), labels: [] };
}

/** Počty za obdobie (pre úvod stránky, ktorý sa vykreslí ešte pred načítaním zoznamov). */
export const TERM = { votes: parliamentClubs.votes, deputies: parliamentClubs.deputies, since: parliamentClubs.since, latestVote: parliamentClubs.voteId };
