import { parties, type Poll } from "./polls.ts";

/*
  Parlament: oficiálne výsledky volieb do NR SR 2023 a prepočet kresiel zo scenára.

  Zdroj 2023: Štatistický úrad SR, tabuľky NRSR2023_SK_tab03a.xlsx (platné hlasy a podiel v %,
  zobrazený na 2 desatinné miesta bez zaokrúhlenia) a NRSR2023_SK_tab04.xlsx (pridelenie mandátov).
  Prepísané a skontrolované 11. 9. 2026 priamo z týchto súborov.

  Prepočet kresiel (§ 68 zákona 180/2014 Z. z.): do prepočtu postupujú subjekty s aspoň 5 %
  platných hlasov (koalícia 2–3 strán 7 %, koalícia 4 a viac strán 10 %). Republikové volebné
  číslo = súčet hlasov postupujúcich subjektov / 151. Každý subjekt získa celočíselný podiel,
  zvyšné mandáty sa pridelia podľa najväčších zostatkov; ak by ich bolo o jeden viac ako 150,
  odpočíta sa subjektu s najmenším zostatkom. Zákon počíta s hlasmi a zaokrúhľuje volebné číslo
  na celé číslo; pri prieskumoch máme iba percentá, preto delíme percentá bez zaokrúhlenia.
  Prepočet z percent 2023 reprodukuje oficiálne rozdelenie mandátov (kontrola vo verify-data).

  Prepočet z prieskumu je SCENÁR, nie predpoveď: prieskum nie je voľba, časť podpory v prieskume
  nie je prepísaná (kategória „iné“) a koalície v budúcich voľbách nie sú známe.
*/

export type SubjectKind = "party" | "coalition2" | "coalition4";
export type Subject2023 = {
  number: number; name: string; short: string; votes: number; pct: number; seats: number;
  kind: SubjectKind; partyId: string | null; color: string; note?: string;
};

const colorOf = (id: string | null) => (id && parties.find(p => p.id === id)?.color) || "#9aa7b8";
const subject = (s: Omit<Subject2023, "color">): Subject2023 => ({ ...s, color: colorOf(s.partyId) });

export const election2023 = {
  id: "nrsr-2023",
  title: "Voľby do NR SR 2023",
  electionDate: "2023-09-30",
  seatsTotal: 150,
  publisher: "Štatistický úrad SR",
  published: "2023-10-01",
  verified: "2026-09-11",
  source: "https://volby.statistics.sk/nrsr/nrsr2023/sk/vysledky_hlasovania_strany.html",
  files: [
    "https://volby.statistics.sk/nrsr/nrsr2023/files/xlsx/NRSR2023_SK_tab03a.xlsx",
    "https://volby.statistics.sk/nrsr/nrsr2023/files/xlsx/NRSR2023_SK_tab04.xlsx",
  ],
  note: "Oficiálny výsledok volieb, nie aktuálne zloženie poslaneckých klubov. Zmeny členstva poslancov po voľbách sa tu neevidujú.",
  subjects: [
    subject({ number: 1, name: "Pirátska strana - Slovensko", short: "Piráti", votes: 9358, pct: 0.31, seats: 0, kind: "party", partyId: null }),
    subject({ number: 2, name: "PRINCÍP", short: "PRINCÍP", votes: 1817, pct: 0.06, seats: 0, kind: "party", partyId: null }),
    subject({ number: 3, name: "Progresívne Slovensko", short: "PS", votes: 533136, pct: 17.96, seats: 32, kind: "party", partyId: "ps" }),
    subject({ number: 4, name: "SPOLOČNE OBČANIA SLOVENSKA", short: "SOS", votes: 2401, pct: 0.08, seats: 0, kind: "party", partyId: null }),
    subject({ number: 5, name: "OĽANO A PRIATELIA: OBYČAJNÍ ĽUDIA (OĽANO), NEZÁVISLÍ KANDIDÁTI (NEKA), NOVA, SLOBODNÍ A ZODPOVEDNÍ, PAČIVALE ROMA, MAGYAR SZÍVEK a Kresťanská únia a ZA ĽUDÍ", short: "OĽANO a priatelia", votes: 264137, pct: 8.89, seats: 16, kind: "coalition2", partyId: null, note: "Koalícia z roku 2023 s hranicou 7 %. Hnutie Slovensko je nástupnícky subjekt OĽANO; historický rad nepremosťujeme automaticky. Súčasťou koalície boli aj Kresťanská únia a ZA ĽUDÍ." }),
    subject({ number: 6, name: "Komunistická strana Slovenska", short: "KSS", votes: 9867, pct: 0.33, seats: 0, kind: "party", partyId: null }),
    subject({ number: 7, name: "Maďarské fórum, Občianski demokrati Slovenska, Za regióny, Rómska koalícia, Demokratická strana", short: "Maďarské fórum a partneri", votes: 3486, pct: 0.11, seats: 0, kind: "coalition4", partyId: null }),
    subject({ number: 8, name: "Vlastenecký blok", short: "Vlastenecký blok", votes: 1262, pct: 0.04, seats: 0, kind: "party", partyId: null }),
    subject({ number: 9, name: "Modrí, Most - Híd", short: "Modrí, Most-Híd", votes: 7935, pct: 0.26, seats: 0, kind: "party", partyId: null }),
    subject({ number: 10, name: "SPRAVODLIVOSŤ", short: "SPRAVODLIVOSŤ", votes: 1335, pct: 0.04, seats: 0, kind: "party", partyId: null }),
    subject({ number: 11, name: "Slovenské Hnutie Obrody", short: "SHO", votes: 1332, pct: 0.04, seats: 0, kind: "party", partyId: null }),
    subject({ number: 12, name: "Sloboda a Solidarita", short: "SaS", votes: 187645, pct: 6.32, seats: 11, kind: "party", partyId: "sas" }),
    subject({ number: 13, name: "SME RODINA", short: "SME RODINA", votes: 65673, pct: 2.21, seats: 0, kind: "party", partyId: "rodina" }),
    subject({ number: 14, name: "MySlovensko", short: "MySlovensko", votes: 2786, pct: 0.09, seats: 0, kind: "party", partyId: null }),
    subject({ number: 15, name: "Slovenská národná strana", short: "SNS", votes: 166995, pct: 5.62, seats: 10, kind: "party", partyId: "sns" }),
    subject({ number: 16, name: "SMER - sociálna demokracia", short: "SMER", votes: 681017, pct: 22.94, seats: 42, kind: "party", partyId: "smer" }),
    subject({ number: 17, name: "HLAS - sociálna demokracia", short: "HLAS", votes: 436415, pct: 14.7, seats: 27, kind: "party", partyId: "hlas" }),
    subject({ number: 18, name: "SZÖVETSÉG - Magyarok. Nemzetiségek. Regiók. | ALIANCIA - Maďari. Národnosti. Regióny", short: "ALIANCIA", votes: 130183, pct: 4.38, seats: 0, kind: "party", partyId: "aliancia" }),
    subject({ number: 19, name: "SRDCE vlastenci a dôchodcovia - SLOVENSKÁ NÁRODNÁ JEDNOTA", short: "SRDCE", votes: 2315, pct: 0.07, seats: 0, kind: "party", partyId: null }),
    subject({ number: 20, name: "SDKÚ - DS - Slovenská demokratická a kresťanská únia - Demokratická strana", short: "SDKÚ-DS", votes: 771, pct: 0.02, seats: 0, kind: "party", partyId: null }),
    subject({ number: 21, name: "Kotlebovci - Ľudová strana Naše Slovensko", short: "ĽSNS", votes: 25003, pct: 0.84, seats: 0, kind: "party", partyId: "lsns" }),
    subject({ number: 22, name: "Demokrati", short: "DEMOKRATI", votes: 87006, pct: 2.93, seats: 0, kind: "party", partyId: "dem" }),
    subject({ number: 23, name: "Kresťanskodemokratické hnutie", short: "KDH", votes: 202515, pct: 6.82, seats: 12, kind: "party", partyId: "kdh" }),
    subject({ number: 24, name: "KARMA", short: "KARMA", votes: 2407, pct: 0.08, seats: 0, kind: "party", partyId: null }),
    subject({ number: 25, name: "REPUBLIKA", short: "REPUBLIKA", votes: 141099, pct: 4.75, seats: 0, kind: "party", partyId: "rep" }),
  ] as Subject2023[],
};

export const seated2023 = election2023.subjects.filter(s => s.seats > 0).sort((a, b) => b.seats - a.seats || b.votes - a.votes);
export const validVotes2023 = election2023.subjects.reduce((a, s) => a + s.votes, 0);

export const threshold = (kind: SubjectKind = "party") => kind === "coalition4" ? 10 : kind === "coalition2" ? 7 : 5;

export type ShareInput = { id: string; share: number; kind?: SubjectKind };
export type Allocation = {
  seats: Record<string, number>; qualifying: string[]; belowThreshold: string[];
  number: number; qualifyingShare: number; total: number;
};

/** Prepočet kresiel podľa § 68 zákona 180/2014 Z. z. z podielov v percentách (alebo hlasov v rovnakej jednotke). */
export function allocateSeats(input: ShareInput[], total = 150): Allocation {
  const qualifying = input.filter(s => s.share >= threshold(s.kind));
  const belowThreshold = input.filter(s => s.share < threshold(s.kind)).map(s => s.id);
  const qualifyingShare = qualifying.reduce((a, s) => a + s.share, 0);
  const seats: Record<string, number> = {};
  if (qualifying.length === 0 || qualifyingShare <= 0) return { seats, qualifying: [], belowThreshold, number: 0, qualifyingShare: 0, total };
  const number = qualifyingShare / (total + 1);
  const rows = qualifying.map(s => { const q = s.share / number; const base = Math.floor(q); return { id: s.id, base, rem: q - base, share: s.share }; });
  rows.forEach(r => { seats[r.id] = r.base; });
  let assigned = rows.reduce((a, r) => a + r.base, 0);
  const byRemainderDesc = [...rows].sort((a, b) => b.rem - a.rem || b.share - a.share);
  for (let i = 0; assigned < total; i = (i + 1) % byRemainderDesc.length) { seats[byRemainderDesc[i].id]++; assigned++; }
  const byRemainderAsc = [...rows].sort((a, b) => a.rem - b.rem || a.share - b.share);
  for (let i = 0; assigned > total; i = (i + 1) % byRemainderAsc.length) { seats[byRemainderAsc[i].id]--; assigned--; }
  return { seats, qualifying: qualifying.map(s => s.id), belowThreshold, number, qualifyingShare, total };
}

export type ScenarioRow = { id: string; short: string; name: string; color: string; share: number; seats: number };
export type Scenario = {
  poll: Poll; allocation: Allocation; rows: ScenarioRow[];
  transcribedShare: number; otherShare: number | null; belowThreshold: ScenarioRow[];
};

/** Scenár „keby sa volilo podľa tohto merania“. Všetky subjekty prieskumu berieme ako samostatné strany (hranica 5 %). */
export function scenarioFromPoll(poll: Poll, total = 150): Scenario {
  const input: ShareInput[] = Object.entries(poll.values).map(([id, share]) => ({ id, share, kind: "party" }));
  const allocation = allocateSeats(input, total);
  const rows: ScenarioRow[] = parties
    .filter(p => poll.values[p.id] !== undefined)
    .map(p => ({ id: p.id, short: p.short, name: p.name, color: p.color, share: poll.values[p.id], seats: allocation.seats[p.id] ?? 0 }))
    .sort((a, b) => b.seats - a.seats || b.share - a.share);
  const transcribedShare = Math.round(input.reduce((a, s) => a + s.share, 0) * 10) / 10;
  return { poll, allocation, rows: rows.filter(r => r.seats > 0), belowThreshold: rows.filter(r => r.seats === 0), transcribedShare, otherShare: poll.other ?? null };
}

export type SeatPoint = { x: number; y: number; row: number; angle: number };

/**
 * Rozloženie `total` kresiel do polkruhu s `rows` radmi. Body sú v jednotkovom polkruhu
 * (stred 0,0; vonkajší polomer 1; y ≤ 0, teda nad stredom v súradniciach SVG) a zoradené
 * podľa uhla zľava doprava, takže postupné farbenie po subjektoch vytvorí súvislé bloky.
 */
export function hemicycleSeats(total: number, rows = 6, innerRadius = 0.45): SeatPoint[] {
  const radii = Array.from({ length: rows }, (_, i) => rows === 1 ? 1 : innerRadius + (1 - innerRadius) * (i / (rows - 1)));
  const weightSum = radii.reduce((a, r) => a + r, 0);
  const counts = radii.map(r => Math.floor(total * r / weightSum));
  let assigned = counts.reduce((a, b) => a + b, 0);
  for (let i = rows - 1; assigned < total; i = (i - 1 + rows) % rows) { counts[i]++; assigned++; }
  const points: SeatPoint[] = [];
  counts.forEach((n, row) => {
    for (let k = 0; k < n; k++) {
      const angle = n === 1 ? Math.PI / 2 : Math.PI - Math.PI * (k / (n - 1));
      // Zaokrúhlenie na 6 desatinných miest: server (workerd) a prehliadač počítajú sin/cos s rozdielom v poslednom bite,
      // čo bez zaokrúhlenia spôsobovalo hydratačné varovania Reactu pri atribútoch cx/cy.
      const round6 = (v: number) => Math.round(v * 1e6) / 1e6;
      points.push({ x: round6(Math.cos(angle) * radii[row]), y: round6(-Math.sin(angle) * radii[row]), row, angle });
    }
  });
  return points.sort((a, b) => b.angle - a.angle);
}

/** Prepadnuté hlasy a „cena mandátu“ v scenári: podiel hlasov subjektov pod hranicou a koľko platných hlasov
 *  pripadá na jedno kreslo pri účasti ako vo voľbách 2023. Nezaradená podpora (iné strany) do výpočtu nevstupuje. */
export function wastedVotes(scenario: Scenario, turnoutVotes = validVotes2023) {
  const wastedShare = Math.round(scenario.belowThreshold.reduce((a, r) => a + r.share, 0) * 10) / 10;
  const qualifyingShare = scenario.allocation.qualifyingShare;
  const votesPerSeat = qualifyingShare > 0 ? Math.round(turnoutVotes * qualifyingShare / 100 / scenario.allocation.total) : null;
  return { wastedShare, wastedVotes: Math.round(turnoutVotes * wastedShare / 100), votesPerSeat, turnoutVotes };
}

/*
  Výsledok dnešnej strany vo voľbách 2023. Tri prípady: kandidovala sama, kandidovala v koalícii
  (vtedy je výsledok spoločný a uvádzame to), alebo do volieb nešla. Hnutie Slovensko je nástupca
  OĽANO, Kresťanská únia a ZA ĽUDÍ boli súčasťou tej istej koalície — historický rad preto
  nepremosťujeme automaticky, ale vždy pomenujeme, o čí výsledok ide.
*/
export const coalition2023 = { number: 5, label: "OĽANO a priatelia", parties: ["slovensko", "ku", "zaludi"] };
export type Result2023 =
  | { kind: "party"; pct: number; seats: number }
  | { kind: "coalition"; pct: number; seats: number; label: string }
  | { kind: "absent" };

export function result2023(partyId: string): Result2023 {
  const own = election2023.subjects.find(s => s.partyId === partyId);
  if (own) return { kind: "party", pct: own.pct, seats: own.seats };
  if (coalition2023.parties.includes(partyId)) {
    const c = election2023.subjects.find(s => s.number === coalition2023.number);
    if (c) return { kind: "coalition", pct: c.pct, seats: c.seats, label: coalition2023.label };
  }
  return { kind: "absent" };
}
