import { chamberSeats } from "./parliament-model.ts";

/*
  Hlasovania NR SR v 3D sále (režim Hlasovania v components/parliament-ar.tsx). Dáta: public/data/hlasovania
  (scripts/fetch-votes.mjs z nrsr.sk, 9. volebné obdobie, vyberané podľa pravidiel, nie ručne).
  Poslanci sedia v 150 kreslách sály podľa klubov v čase hlasovania, v poradí sály z volieb 2023 (koalícia vľavo,
  nezaradení v strede, opozícia vpravo), v klube podľa hlasu. Nie je to skutočný zasadací poriadok NR SR.
*/
export type Mark = "Z" | "P" | "?" | "N" | "0";
export type VoteKind = "zakon" | "ustavny" | "rozpocet" | "veto" | "nedovera";
export type VoteSummary = {
  id: number; datum: string; cas: string; schodza: number; cislo: number; druh: VoteKind; nazov: string; plny: string; preslo: boolean;
  za: number; proti: number; zdrzalo: number; nehlasovalo: number; nepritomni: number;
  oficialne: { pritomni: number | null; hlasujucich: number | null; za: number | null; proti: number | null; zdrzalo: number | null; nehlasovalo: number | null; nepritomni: number | null };
};
export type VoteIndex = { v: 1; obdobie: number; aktualizovane: string; zdroj: string; hlasovania: VoteSummary[] };
export type VoteMember = [id: number, name: string, club: number, mark: Mark];
export type VoteDetail = { id: number; kluby: string[]; poslanci: VoteMember[] };
export type SeatedMember = { seat: number; id: number; name: string; club: string; party: string; mark: Mark };

export const VOTES_INDEX = "/data/hlasovania/index.json";
export const voteFile = (id: number) => `/data/hlasovania/${id}.json`;
export const voteSource = (id: number) => `https://www.nrsr.sk/web/Default.aspx?sid=schodze/hlasovanie/hlasklub&ID=${id}`;
export const marks: Mark[] = ["Z", "P", "?", "N", "0"];
// Mená ako podstatné mená, nech sedia pri poslankyni aj poslancovi („Baláž, Vladimír · za“).
export const markNames: Record<Mark, string> = { Z: "za", P: "proti", "?": "zdržanie sa", N: "nehlasovanie", "0": "neprítomnosť" };
export const markColors: Record<Mark, string> = { Z: "#2f9e5b", P: "#d14b45", "?": "#e0a526", N: "#8f9aa5", "0": "#3a3f45" };
export const kindNames: Record<VoteKind, string> = { zakon: "Zákon", ustavny: "Ústavný zákon", rozpocet: "Štátny rozpočet", veto: "Po vete prezidenta", nedovera: "Nedôvera" };

/*
  Potrebná väčšina podľa Ústavy SR: zákon a rozpočet nadpolovičná väčšina prítomných (čl. 84 ods. 3), ústavný zákon
  tri pätiny všetkých, 90 (čl. 84 ods. 4), zákon vrátený prezidentom nadpolovičná väčšina všetkých, 76 (čl. 87 ods. 3;
  ústavný aj po vete 90), nedôvera vláde alebo jej členovi nadpolovičná väčšina všetkých, 76 (čl. 88 ods. 2).
*/
export function required(vote: Pick<VoteSummary, "druh" | "plny" | "za" | "proti" | "zdrzalo" | "nehlasovalo">) {
  const present = vote.za + vote.proti + vote.zdrzalo + vote.nehlasovalo;
  if (/ústavného zákona|ústavnom zákone|ústavný zákon/i.test(vote.plny) && vote.druh !== "nedovera") return { votes: 90, rule: "tri pätiny všetkých poslancov" };
  if (vote.druh === "veto" || vote.druh === "nedovera") return { votes: 76, rule: "nadpolovičná väčšina všetkých poslancov" };
  return { votes: Math.floor(present / 2) + 1, rule: "nadpolovičná väčšina prítomných" };
}

// Klub → strana webu (farba, logo, poradie v sále). Nezaradení nemajú stranu.
const CLUBS: [RegExp, string][] = [
  [/nie sú členmi/i, "nezaradeni"], [/SMER/i, "smer"], [/HLAS/i, "hlas"], [/SNS|národn/i, "sns"], [/Progresívne|\bPS\b/i, "ps"],
  [/KDH|Kresťansko/i, "kdh"], [/SaS|Sloboda/i, "sas"], [/OĽANO|Slovensko|Hnutie/i, "slovensko"],
];
export const clubParty = (club: string) => CLUBS.find(([re]) => re.test(club))?.[1] ?? null;
export const SEAT_ORDER = ["smer", "hlas", "sns", "nezaradeni", "slovensko", "ps", "kdh", "sas"];
export const clubLabel = (club: string) => club.replace(/^Klub\s+/i, "").replace(/^Poslanci, ktorí nie sú členmi poslaneckých klubov$/i, "Nezaradení");

/** Poslanci v kreslách: chamberSeats podľa indexu, kluby v poradí sály, v klube za, proti, zdržali sa, nehlasovali, neprítomní. */
export function seatMembers(detail: VoteDetail): SeatedMember[] {
  const order = (club: number) => { const i = SEAT_ORDER.indexOf(clubParty(detail.kluby[club]) ?? ""); return i < 0 ? SEAT_ORDER.length : i; };
  const sorted = detail.poslanci.slice().sort((a, b) => order(a[2]) - order(b[2]) || a[2] - b[2] || marks.indexOf(a[3]) - marks.indexOf(b[3]) || a[1].localeCompare(b[1], "sk"));
  return sorted.slice(0, chamberSeats.length).map((m, seat) => ({ seat, id: m[0], name: m[1], club: detail.kluby[m[2]], party: clubParty(detail.kluby[m[2]]) ?? "nezaradeni", mark: m[3] }));
}
/** Súčty po kluboch (v poradí sály). */
export function clubTotals(detail: VoteDetail) {
  const seated = seatMembers(detail), out: { club: string; party: string; counts: Record<Mark, number>; total: number }[] = [];
  for (const m of seated) {
    let row = out.find(r => r.club === m.club);
    if (!row) { row = { club: m.club, party: m.party, counts: { Z: 0, P: 0, "?": 0, N: 0, "0": 0 }, total: 0 }; out.push(row); }
    row.counts[m.mark]++; row.total++;
  }
  return out;
}
export const skDay = (day: string) => `${Number(day.slice(8, 10))}. ${Number(day.slice(5, 7))}. ${day.slice(0, 4)}`;
/** Vyhľadávanie bez diakritiky a veľkých písmen („trestny zakon“ nájde „Trestný zákon“). */
export const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
export const matchesQuery = (vote: VoteSummary, query: string) => fold(query).split(/\s+/).filter(Boolean).every(w => fold(`${vote.nazov} ${kindNames[vote.druh]} ${skDay(vote.datum)}`).includes(w));
