import { parties } from "./polls.ts";

/*
  Bloky: vládna koalícia a opozícia ako redakčné zoskupenia subjektov.

  Vládnu koalíciu tvoria od októbra 2023 SMER, HLAS a SNS (koaličná zmluva podpísaná 16. 10. 2023,
  overené 11. 9. 2026 podľa publikácií Denník N, Pravda a SME; zloženie klubov: NR SR). Opozičný blok v tomto prehľade
  tvoria PS, KDH, SaS a Demokrati. Voliteľní partneri sú REDAKČNÝ PREDPOKLAD, nie oznámená
  dohoda: REPUBLIKA by sa podľa predpokladu pridala k dnešnej koalícii, Hnutie Slovensko
  (nástupca OĽANO) k opozičnému bloku. Používateľ ich zapína sám a web to pri každom čísle hovorí.

  Rovnaké bloky sa počítajú nad oficiálnymi mandátmi z volieb 2023 aj nad scenárom z prieskumu.
  Pri voľbách 2023 sa Hnutie Slovensko mapuje na historickú koalíciu OĽANO a priatelia
  (identifikátor election-2023-5 v zobrazení), preto má každý člen zoznam identifikátorov.

  Hranice: 76 kresiel = nadpolovičná väčšina v 150-člennej NR SR, 90 kresiel = ústavná
  väčšina (trojpätinová, čl. 84 ods. 4 Ústavy SR).
*/

export const MAJORITY = 76;
export const CONSTITUTIONAL_MAJORITY = 90;

export type BlocMember = { id: string; ids: string[]; optional?: boolean; note?: string };
export type Bloc = {
  id: "coalition" | "opposition"; label: string; description: string;
  members: BlocMember[]; source: string; sourceName: string;
};

const member = (id: string, extra: Partial<BlocMember> = {}): BlocMember => ({ id, ids: [id], ...extra });

export const blocs: Bloc[] = [
  {
    id: "coalition",
    label: "Vládna koalícia",
    description: "SMER, HLAS a SNS tvoria vládu od októbra 2023; koaličnú zmluvu podpísali 16. októbra 2023.",
    members: [
      member("smer"), member("hlas"), member("sns"),
      member("rep", { optional: true, note: "REPUBLIKA nie je členom koalície. Redakčný predpoklad: po voľbách by sa pridala k dnešnej koalícii." }),
    ],
    source: "https://dennikn.sk/3628438/smer-hlas-a-sns-podpisali-koalicnu-zmluvu-mena-ministrov-neoznamili/",
    sourceName: "Denník N · podpis koaličnej zmluvy, 16. 10. 2023",
  },
  {
    id: "opposition",
    label: "Opozícia",
    description: "PS, KDH, SaS a Demokrati. Demokrati nemajú od volieb 2023 mandát.",
    members: [
      member("ps"), member("kdh"), member("sas"), member("dem"),
      member("slovensko", { ids: ["slovensko", "election-2023-5"], optional: true, note: "Hnutie Slovensko (nástupca OĽANO) je v opozícii. Redakčný predpoklad: pridalo by sa k tomuto bloku." }),
    ],
    source: "https://www.nrsr.sk/web/Default.aspx?sid=poslanci/kluby",
    sourceName: "NR SR · poslanecké kluby",
  },
];

export const optionalPartners = blocs.flatMap(b => b.members.filter(m => m.optional).map(m => ({ ...m, bloc: b.id })));
export const optionalIds = optionalPartners.map(m => m.id);

export type SeatEntry = { id: string; short: string; color: string; seats: number };
export type BlocResult = { id: Bloc["id"] | "others"; label: string; seats: number; members: SeatEntry[] };
export type BlocSummary = { coalition: BlocResult; opposition: BlocResult; others: BlocResult; total: number; majority: number; constitutional: number };

const shortOf = (id: string, fallback: string) => parties.find(p => p.id === id)?.short ?? fallback;

/**
 * Rozdelí kreslá do blokov. `enabled` sú identifikátory voliteľných partnerov, ktorých používateľ zapol.
 * Subjekty mimo oboch blokov (a vypnutí voliteľní partneri) idú do „ostatní“.
 */
export function blocSeats(entries: SeatEntry[], enabled: string[] = []): BlocSummary {
  const used = new Set<string>();
  const collect = (bloc: Bloc): BlocResult => {
    const members: SeatEntry[] = [];
    for (const m of bloc.members) {
      if (m.optional && !enabled.includes(m.id)) continue;
      for (const e of entries) {
        if (m.ids.includes(e.id) && !used.has(e.id)) { members.push(e); used.add(e.id); }
      }
    }
    members.sort((a, b) => b.seats - a.seats);
    return { id: bloc.id, label: bloc.label, seats: members.reduce((a, e) => a + e.seats, 0), members };
  };
  const coalition = collect(blocs[0]);
  const opposition = collect(blocs[1]);
  const rest = entries.filter(e => !used.has(e.id) && e.seats > 0).sort((a, b) => b.seats - a.seats);
  const others: BlocResult = { id: "others", label: "Ostatní", seats: rest.reduce((a, e) => a + e.seats, 0), members: rest };
  const total = coalition.seats + opposition.seats + others.seats;
  return { coalition, opposition, others, total, majority: MAJORITY, constitutional: CONSTITUTIONAL_MAJORITY };
}

export const blocMemberLabel = (m: BlocMember) => shortOf(m.id, m.id);
