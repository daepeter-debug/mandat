import { clubParty, marks, type Mark, type VoteDetail, type VoteMember } from "./votes.ts";

/*
  Poslanci NR SR naprieč hlasovaniami (stránka Parlament). Dáta: public/data/hlasovania/poslanci.json zo
  scripts/build-deputies.mjs — pri každom poslancovi reťazec hlasov `h` a klubov `k` v poradí zoznamu hlasovaní
  (od najnovšieho), „-“ = v čase hlasovania nebol poslancom.

  Pravidlá (rovnaké pre každého poslanca a klub, nič sa nevyberá ručne):
  - Prítomnosť: hlasovania, pri ktorých bol poslanec prítomný (za, proti, zdržal sa alebo nehlasoval), z tých,
    v ktorých bol poslancom.
  - Línia klubu: hlas, ktorý pri hlasovaní dala nadpolovičná väčšina prítomných členov klubu. Bez nadpolovičnej
    väčšiny klub v danom hlasovaní líniu nemá. Premenovaný klub ostáva tým istým klubom (rovnaká strana).
  - Inak ako klub: poslanec hlasoval za, proti alebo sa zdržal a líniu klubu nedodržal. Nehlasovanie a neprítomnosť
    sa nerátajú (môžu mať aj technický dôvod). Nezaradení klub nemajú.
  - Jednotnosť klubu: priemerný podiel prítomných členov, ktorí hlasovali ako najväčšia skupina klubu.
*/
export const DEPUTIES_FILE = "/data/hlasovania/poslanci.json";
export type DeputyRow = { id: number; meno: string; h: string; k: string };
export type DeputiesData = { v: 1; obdobie: number; aktualizovane: string; hlasovania: number[]; kluby: string[]; poslanci: DeputyRow[] };

export const deputyProfile = (id: number) => `https://www.nrsr.sk/web/Default.aspx?sid=poslanci/poslanec&PoslanecID=${id}&CisObdobia=9`;
/** „Priezvisko, Meno“ (NR SR) → „Meno Priezvisko“. */
export const displayName = (meno: string) => { const [last, first] = meno.split(/,\s*/); return first ? `${first} ${last}` : meno; };
const PRESENT: ReadonlySet<string> = new Set(["Z", "P", "?", "N"]);
const VOTED: ReadonlySet<string> = new Set(["Z", "P", "?"]);
export const isPresent = (mark: string) => PRESENT.has(mark);

const clubAt = (data: DeputiesData, row: DeputyRow, j: number) => data.kluby[parseInt(row.k[j], 36)];
/** Strana klubu v čase hlasovania j; nezaradení a nečlenovia null. */
export function partyAt(data: DeputiesData, row: DeputyRow, j: number) {
  if (row.h[j] === "-") return null;
  const party = clubParty(clubAt(data, row, j));
  return party && party !== "nezaradeni" ? party : null;
}

/** Hlasovanie na pozícii j v tvare súboru public/data/hlasovania/<id>.json (pre rozsadenie seatMembers). */
export function voteDetailAt(data: DeputiesData, j: number): VoteDetail {
  const local = new Map<string, number>(), kluby: string[] = [], poslanci: VoteMember[] = [];
  for (const row of data.poslanci) {
    const mark = row.h[j];
    if (mark === "-") continue;
    const club = clubAt(data, row, j);
    let i = local.get(club);
    if (i === undefined) { i = kluby.length; local.set(club, i); kluby.push(club); }
    poslanci.push([row.id, row.meno, i, mark as Mark]);
  }
  return { id: data.hlasovania[j], kluby, poslanci };
}

export type ClubLine = { party: string; present: number; mark: Mark | null; largest: number };
const linesCache = new WeakMap<DeputiesData, Map<string, ClubLine>[]>();
/** Línia každého klubu pri každom hlasovaní (nadpolovičná väčšina prítomných). */
export function clubLines(data: DeputiesData) {
  let lines = linesCache.get(data);
  if (lines) return lines;
  lines = data.hlasovania.map((_, j) => {
    const tally = new Map<string, Map<string, number>>();
    for (const row of data.poslanci) {
      const mark = row.h[j], party = partyAt(data, row, j);
      if (!party || !PRESENT.has(mark)) continue;
      const t = tally.get(party) ?? new Map<string, number>();
      t.set(mark, (t.get(mark) ?? 0) + 1); tally.set(party, t);
    }
    return new Map([...tally].map(([party, t]) => {
      const present = [...t.values()].reduce((a, n) => a + n, 0);
      const [top, largest] = [...t].sort((a, b) => b[1] - a[1] || marks.indexOf(a[0] as Mark) - marks.indexOf(b[0] as Mark))[0];
      return [party, { party, present, mark: largest * 2 > present ? top as Mark : null, largest }];
    }));
  });
  linesCache.set(data, lines);
  return lines;
}

/** Poslanec na pozícii j hlasoval inak ako línia jeho klubu? */
export function differsAt(data: DeputiesData, row: DeputyRow, j: number) {
  const mark = row.h[j], party = partyAt(data, row, j);
  if (!party || !VOTED.has(mark)) return false;
  const line = clubLines(data)[j].get(party);
  return !!line?.mark && line.mark !== mark;
}

/** Poslanci, ktorí pri hlasovaní j hlasovali inak ako ich klub (s líniou klubu). */
export function differentAt(data: DeputiesData, j: number) {
  return data.poslanci.filter(row => differsAt(data, row, j)).map(row => ({ row, mark: row.h[j] as Mark, party: partyAt(data, row, j)!, line: clubLines(data)[j].get(partyAt(data, row, j)!)!.mark! }));
}

export type DeputySegment = { party: string | null; club: string; from: number; to: number };
export type DeputyStats = { seated: number; present: number; counts: Record<Mark, number>; differs: number[]; segments: DeputySegment[] };
/** Súhrn poslanca za obdobie; pozície j idú od najnovšieho hlasovania, úseky klubov chronologicky. */
export function deputyStats(data: DeputiesData, row: DeputyRow): DeputyStats {
  const counts: Record<Mark, number> = { Z: 0, P: 0, "?": 0, N: 0, "0": 0 };
  const differs: number[] = [], segments: DeputySegment[] = [];
  let seated = 0, present = 0;
  for (let j = 0; j < data.hlasovania.length; j++) {
    const mark = row.h[j];
    if (mark === "-") continue;
    seated++; counts[mark as Mark]++;
    if (PRESENT.has(mark)) present++;
    if (differsAt(data, row, j)) differs.push(j);
  }
  for (let j = data.hlasovania.length - 1; j >= 0; j--) {
    if (row.h[j] === "-") continue;
    const party = partyAt(data, row, j), club = clubAt(data, row, j), last = segments.at(-1);
    if (last && last.party === party && (party !== null || last.club === club)) { last.to = j; last.club = club; }
    else segments.push({ party, club, from: j, to: j });
  }
  return { seated, present, counts, differs, segments };
}

export type ClubStats = { party: string; seated: number; present: number; cohesion: number; votes: number };
/** Prítomnosť a jednotnosť klubov za obdobie (členovia v čase, keď boli v klube). */
export function clubStats(data: DeputiesData): Map<string, ClubStats> {
  const out = new Map<string, ClubStats & { share: number }>();
  const lines = clubLines(data);
  data.hlasovania.forEach((_, j) => {
    for (const line of lines[j].values()) {
      const s = out.get(line.party) ?? { party: line.party, seated: 0, present: 0, cohesion: 0, votes: 0, share: 0 };
      s.votes++; s.share += line.largest / line.present; out.set(line.party, s);
    }
    for (const row of data.poslanci) {
      const party = partyAt(data, row, j);
      if (!party) continue;
      const s = out.get(party) ?? { party, seated: 0, present: 0, cohesion: 0, votes: 0, share: 0 };
      s.seated++; if (PRESENT.has(row.h[j])) s.present++; out.set(party, s);
    }
  });
  return new Map([...out].map(([party, s]) => [party, { party, seated: s.seated, present: s.present, votes: s.votes, cohesion: s.votes ? s.share / s.votes : 0 }]));
}

/** Prítomnosť nezaradených (bez klubu, takže bez línie a jednotnosti). */
export function unaffiliatedPresence(data: DeputiesData) {
  let seated = 0, present = 0;
  data.hlasovania.forEach((_, j) => {
    for (const row of data.poslanci) {
      if (row.h[j] === "-" || clubParty(clubAt(data, row, j)) !== "nezaradeni") continue;
      seated++; if (PRESENT.has(row.h[j])) present++;
    }
  });
  return { seated, present };
}

/** Hľadanie poslanca bez diakritiky, v ľubovoľnom poradí mena a priezviska. */
const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
export function findDeputies(data: DeputiesData, query: string) {
  const words = fold(query).split(/[\s,]+/).filter(Boolean);
  if (!words.length) return [];
  return data.poslanci.filter(row => { const name = fold(row.meno); return words.every(w => name.includes(w)); });
}

/** Zhoda línií dvoch klubov: v koľkých hlasovaniach, kde líniu mali oba, dali rovnaký hlas. */
export function clubAgreement(data: DeputiesData, parties: readonly string[]) {
  const lines = clubLines(data), out = new Map<string, { same: number; both: number }>();
  for (const a of parties) for (const b of parties) {
    if (a >= b) continue;
    let same = 0, both = 0;
    for (const votes of lines) {
      const x = votes.get(a)?.mark, y = votes.get(b)?.mark;
      if (!x || !y) continue;
      both++; if (x === y) same++;
    }
    out.set(`${a}|${b}`, { same, both });
  }
  return (a: string, b: string) => a === b ? null : out.get(a < b ? `${a}|${b}` : `${b}|${a}`) ?? { same: 0, both: 0 };
}
