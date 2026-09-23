import { currentAggregate, type AggregatePoint, type AggregateValue } from './aggregate.ts';
import { blocSeats, MAJORITY, optionalIds, type SeatEntry } from './blocs.ts';
import { allocateSeats } from './parliament.ts';
import { parties } from './polls.ts';

/*
  Neistota Modelu Mandát zrozumiteľne. Pásmo každej strany (lib/aggregate.ts) je orientačný odhad;
  z neho odvodzujeme dve veci:
  – stav pri hranici 5 %: celé pásmo nad hranicou, pásmo ju pretína („na hrane“), celé pod ňou;
  – rozpätie kresiel: opakovane náhodne posunieme podporu strán v rámci ich pásiem (normálne
    rozdelenie, pásmo = 95 % interval), prepočítame kreslá podľa § 68 a vezmeme stredných 80 %
    výsledkov. Strany sa v simulácii hýbu nezávisle, takže je to orientačné, nie predpoveď.
  Generátor je deterministický (pevné semeno), aby server aj prehliadač ukázali rovnaké čísla.
*/
export type ThresholdStatus = 'in' | 'edge' | 'out';
export const thresholdStatus = (v: AggregateValue, limit = 5): ThresholdStatus => v.lower >= limit ? 'in' : v.upper < limit ? 'out' : 'edge';
export const thresholdLabels: Record<ThresholdStatus, string> = { in: 'nad hranicou', edge: 'na hrane', out: 'pod hranicou' };
export const thresholdHints: Record<ThresholdStatus, string> = {
  in: 'celé pásmo je nad 5 %',
  edge: 'pásmo pretína hranicu 5 %',
  out: 'celé pásmo je pod 5 %',
};

export const SIMULATIONS = 2000;
export type SeatRange = { low: number; high: number; entry: number; first: number };
export type BlocRange = { low: number; high: number; entry: number; majority: number };
export type SeatUncertainty = {
  simulations: number;
  parties: Record<string, SeatRange>;
  blocs: { coalition: BlocRange; opposition: BlocRange; coalitionWith: BlocRange; oppositionWith: BlocRange };
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const quantile = (sorted: number[], q: number) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))))];
function range(values: number[], majority?: boolean): BlocRange {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    low: quantile(sorted, 0.1), high: quantile(sorted, 0.9),
    entry: values.filter(v => v > 0).length / values.length,
    majority: majority ? values.filter(v => v >= MAJORITY).length / values.length : 0,
  };
}

export function seatUncertainty(point: AggregatePoint = currentAggregate, n = SIMULATIONS, seed = 20260907): SeatUncertainty {
  const random = mulberry32(seed);
  const gauss = () => { const u = 1 - random(), v = random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const values = Object.values(point.values);
  const seats: Record<string, number[]> = Object.fromEntries(values.map(v => [v.partyId, [] as number[]]));
  const firsts: Record<string, number> = Object.fromEntries(values.map(v => [v.partyId, 0]));
  const bloc = { coalition: [] as number[], opposition: [] as number[], coalitionWith: [] as number[], oppositionWith: [] as number[] };
  for (let i = 0; i < n; i++) {
    const shares = values.map(v => ({ id: v.partyId, share: Math.max(0, v.value + gauss() * (v.upper - v.lower) / (2 * 1.96)), kind: 'party' as const }));
    const allocation = allocateSeats(shares);
    // Prvé miesto = najviac hlasov v danom prepočte.
    firsts[shares.reduce((best, s) => s.share > best.share ? s : best).id]++;
    const entries: SeatEntry[] = [];
    for (const v of values) {
      const s = allocation.seats[v.partyId] ?? 0;
      seats[v.partyId].push(s);
      if (s > 0) { const p = parties.find(x => x.id === v.partyId); entries.push({ id: v.partyId, short: p?.short ?? v.partyId, color: p?.color ?? '#999', seats: s }); }
    }
    const plain = blocSeats(entries), withPartners = blocSeats(entries, optionalIds);
    bloc.coalition.push(plain.coalition.seats); bloc.opposition.push(plain.opposition.seats);
    bloc.coalitionWith.push(withPartners.coalition.seats); bloc.oppositionWith.push(withPartners.opposition.seats);
  }
  return {
    simulations: n,
    parties: Object.fromEntries(Object.entries(seats).map(([id, list]) => { const { low, high, entry } = range(list); return [id, { low, high, entry, first: firsts[id] / n }]; })),
    blocs: { coalition: range(bloc.coalition, true), opposition: range(bloc.opposition, true), coalitionWith: range(bloc.coalitionWith, true), oppositionWith: range(bloc.oppositionWith, true) },
  };
}

// Podiel prepočtov slovom; krajné hodnoty nezaokrúhľujeme na „10 z 10“, aby to neznelo ako istota.
export const inRuns = (share: number) => share >= 0.95 ? "takmer vo všetkých prepočtoch" : share <= 0.05 ? "takmer v žiadnom prepočte" : `v ${Math.round(share * 10)} z 10 prepočtov`;

// Pre aktuálny agregát sa simulácia počíta raz, až keď ju niekto potrebuje.
let cached: SeatUncertainty | null = null;
export const currentSeatUncertainty = () => cached ??= seatUncertainty();
