import { aggregateAsPoll, aggregateLastDate, aggregateUpdated, aggregateSeries, currentAggregate, pollsForAggregate, reportedByMajority, type AggregatePoint } from "./aggregate.ts";
import { parties } from './polls.ts';
import { thresholdStatus } from './uncertainty.ts';
import { blocSeats, optionalIds, type BlocSummary, type SeatEntry } from "./blocs.ts";
import { hemicycleSeats, scenarioFromPoll, seated2023 } from "./parliament.ts";

/*
  Rokovacia sála pre „Parlament v 3D a na stole“ (public/models/parlament.glb zo scripts/build-parliament-glb.mjs,
  zobrazenie v components/parliament-ar.tsx). Tu je spoločná geometria a dáta, aby model aj štítky nad kreslami
  počítali s rovnakými miestami:
  - šesť stupňovitých radov ako v polkruhu na webe (počty kresiel v radoch z hemicycleSeats), so štyrmi uličkami;
  - kreslá v poradí podľa uhla zľava doprava: koalícia vľavo, ostatní v strede, opozícia vpravo (dnešné bloky);
  - dva varianty obsadenia v jednej sále: scenár Modelu Mandát a oficiálny výsledok volieb 2023.
  Model sa musí pregenerovať po každej zmene dát (verify-data.mjs porovná kreslá zapísané v súbore so scenárom).
*/
export const PARLIAMENT_MODEL = "/models/parlament.glb";

/** Rozmery sály v metroch (na stole má model šírku asi 70 cm, v rozšírenej realite sa dá zväčšiť). */
export const CHAMBER = { R: 0.3, ROWS: 6, INNER: 0.45, SECTORS: 5, AISLE: 0.013 } as const;
export const rowRadius = (k: number) => CHAMBER.R * (CHAMBER.INNER + (1 - CHAMBER.INNER) * k / (CHAMBER.ROWS - 1));
/** Výška podlahy radu k (stupne stúpajú dozadu). */
export const tierTop = (k: number) => 0.008 + k * 0.0115;
export const ROW_DEPTH = CHAMBER.R * (1 - CHAMBER.INNER) / (CHAMBER.ROWS - 1);

export type ChamberSeat = { index: number; row: number; sector: number; angle: number; x: number; y: number; z: number; yaw: number };
const round6 = (v: number) => Math.round(v * 1e6) / 1e6;

/** 150 miest v sále, zoradených podľa uhla zľava doprava (ako polkruh na webe). */
export const chamberSeats: ChamberSeat[] = (() => {
  const counts = Array.from({ length: CHAMBER.ROWS }, (_, k) => hemicycleSeats(150, CHAMBER.ROWS, CHAMBER.INNER).filter(p => p.row === k).length);
  const seats: Omit<ChamberSeat, "index">[] = [];
  counts.forEach((n, k) => {
    const r = rowRadius(k), aisle = CHAMBER.AISLE / r, pitch = (Math.PI - (CHAMBER.SECTORS - 1) * aisle) / n;
    // Rozdelenie kresiel radu do sektorov: zvyšok najprv do stredných sektorov (súmerne).
    const base = Math.floor(n / CHAMBER.SECTORS), extra = n - base * CHAMBER.SECTORS;
    const order = [2, 1, 3, 0, 4];
    const sizes = Array.from({ length: CHAMBER.SECTORS }, (_, s) => base + (order.indexOf(s) < extra ? 1 : 0));
    let slot = 0;
    sizes.forEach((size, s) => {
      for (let i = 0; i < size; i++, slot++) {
        const angle = Math.PI - (slot + 0.5) * pitch - s * aisle;
        const x = Math.cos(angle) * (r + 0.004), z = -Math.sin(angle) * (r + 0.004);
        seats.push({ row: k, sector: s, angle, x: round6(x), y: round6(tierTop(k)), z: round6(z), yaw: round6(Math.atan2(-x, -z)) });
      }
    });
  });
  return seats.sort((a, b) => b.angle - a.angle || a.row - b.row).map((s, index) => ({ index, ...s }));
})();

export type VariantId = "prieskumy" | "volby-2023" | "kluby" | `model-${string}` | `bez-${string}`;
export type ParliamentLabel = { id: string; short: string; color: string; seats: number; position: [number, number, number] };
export type ParliamentVariant = {
  id: VariantId; label: string; ordered: SeatEntry[]; seatParty: string[];
  blocs: BlocSummary; withPartners: BlocSummary; labels: ParliamentLabel[];
};

function variant(id: VariantId, label: string, entries: SeatEntry[]): ParliamentVariant {
  const blocs = blocSeats(entries);
  const ordered = [...blocs.coalition.members, ...blocs.others.members, ...blocs.opposition.members].filter(m => m.seats > 0);
  const seatParty = ordered.flatMap(m => Array.from({ length: m.seats }, () => m.id));
  // Štítok strany: tesne nad zadným radom v strede jej klinu. Keď sú kliny susedných strán úzke (štítky by sa
  // prekrývali), ďalší štítok ide o úroveň vyššie; pri dostatočnom odstupe sa vracia dole.
  let level = 0, prev = Infinity;
  const labels = ordered.map(m => {
    const mine = chamberSeats.filter(s => seatParty[s.index] === m.id);
    const angle = mine.reduce((a, s) => a + s.angle, 0) / mine.length, r = rowRadius(CHAMBER.ROWS - 1) - 0.006;
    level = prev - angle < 0.26 ? (level + 1) % 3 : 0; prev = angle;
    const y = tierTop(CHAMBER.ROWS - 1) + 0.036 + level * 0.052;
    return { id: m.id, short: m.short, color: m.color, seats: m.seats, position: [round6(Math.cos(angle) * r), round6(y), round6(-Math.sin(angle) * r)] as [number, number, number] };
  });
  return { id, label, ordered, seatParty, blocs, withPartners: blocSeats(entries, optionalIds), labels };
}

const modelEntries = (): SeatEntry[] => scenarioFromPoll(aggregateAsPoll()).rows.map(r => ({ id: r.id, short: r.short, color: r.color, seats: r.seats }));
const entries2023 = (): SeatEntry[] => seated2023.map(s => ({ id: s.partyId ?? `election-2023-${s.number}`, short: s.short, color: s.color, seats: s.seats }));

export function pointVariant(point: AggregatePoint) {
  return variant(`model-${point.date.slice(0, 7)}`, new Date(`${point.date}T12:00:00Z`).toLocaleDateString('sk-SK', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    scenarioFromPoll(aggregateAsPoll(point)).rows.map(r => ({ id: r.id, short: r.short, color: r.color, seats: r.seats })));
}
/** Last observed weekly point of each month, never interpolation or a future month. */
export function parliamentTimeline() {
  const monthly = new Map<string, AggregatePoint>();
  aggregateSeries.forEach(p => monthly.set(p.date.slice(0, 7), p));
  return [...monthly.values()].map(point => {
    const inputs = pollsForAggregate(point.date);
    const missing = parties.filter(p => inputs.some(x => x.values[p.id] !== undefined) && !reportedByMajority(inputs.filter(x => x.values[p.id] !== undefined).length, inputs.length)).map(p => p.short);
    return { point, variant: pointVariant(point), agencies: inputs.length, missing, limited: inputs.length < 3 };
  });
}
export function parliamentEdges() {
  return Object.values(currentAggregate.values).filter(v => thresholdStatus(v) === 'edge').map(v => {
    const p = parties.find(p => p.id === v.partyId)!;
    const poll = aggregateAsPoll();
    // Remaining shares stay fixed. Zero puts the excluded party below the threshold.
    poll.values = { ...poll.values, [v.partyId]: 0 };
    return { value: v, party: p, variant: variant(`bez-${p.id}`, `Bez ${p.short}`, scenarioFromPoll(poll).rows.map(r => ({ id: r.id, short: r.short, color: r.color, seats: r.seats }))) };
  });
}
export const allParliamentVariants = () => [...parliamentVariants(), ...parliamentTimeline().map(p => p.variant), ...parliamentEdges().map(p => p.variant)];

/** Oba varianty obsadenia sály: scenár Modelu Mandát (predvolený) a voľby 2023. */
export const parliamentVariants = (): ParliamentVariant[] => [variant("prieskumy", "Podľa prieskumov", modelEntries()), variant("volby-2023", "Voľby 2023", entries2023())];

/** Kreslá scenára (pre kontrolu aktuálnosti modelu vo verify-data a pre legendu). */
export function parliamentSeats() {
  const model = parliamentVariants()[0];
  return { asOf: aggregateLastDate, updated: aggregateUpdated, ordered: model.ordered, seats: Object.fromEntries(model.ordered.map(m => [m.id, m.seats])) as Record<string, number> };
}
