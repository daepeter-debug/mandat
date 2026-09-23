import { cabinets, type Cabinet } from './cabinets.ts';
import { governmentTenure, tenureAsOf, type GovernmentTenurePeriod } from './government-tenure.ts';
import { inactiveParties } from './government-tenure-inactive.ts';
import { debtPerCapita, financeYears, type FinanceYear } from './public-finance.ts';
import { parties } from './polls.ts';

/*
  Tvoje Slovensko: osobný prehľad podľa roku narodenia. Obdobie ráta od 1. 1. roku narodenia,
  najskôr od vzniku samostatného Slovenska 1. 1. 1993, do dátumu údajov o vládach (tenureAsOf).
  Čas strán vo vláde je z rovnakých období ako sekcia Zodpovednosť (dnešné aj neaktívne strany,
  bez pripočítania predchodcov). Hospodárske údaje sú z Eurostatu od roku 1995, v bežných cenách.
*/
export const INDEPENDENCE = '1993-01-01';
export const birthYears = { min: 1920, max: Number(tenureAsOf.slice(0, 4)) };
export const isBirthYear = (year: number) => Number.isInteger(year) && year >= birthYears.min && year <= birthYears.max;

const dayMs = 86_400_000;
const utc = (d: string) => Date.parse(`${d}T00:00:00Z`);
const overlap = (start: string, end: string | null, from: string, to: string) =>
  Math.max(0, Math.round((Math.min(utc(end ?? to), utc(to)) - Math.max(utc(start), utc(from))) / dayMs));

export type LifeCabinet = { cabinet: Cabinet; start: string; end: string; days: number };
export type ValueChange = { fromYear: number; from: number; toYear: number; to: number };
export type LifeSummary = {
  year: number;
  from: string;
  asOf: string;
  totalDays: number;
  ageAtIndependence: number | null;
  cabinets: LifeCabinet[];
  premiers: number;
  topParty: { short: string; color: string; days: number; share: number } | null;
  topPremier: { name: string; days: number } | null;
  adulthood: { year: number; status: 'czechoslovakia' | 'slovakia' | 'future'; cabinet: Cabinet | null };
  debt: ValueChange | null;
  minWage: ValueChange | null;
  prices: { fromYear: number; toYear: number; factor: number } | null;
  living: ValueChange | null;
};

const partyTenures = () => [
  ...parties.flatMap(p => governmentTenure[p.id] ? [{ short: p.short, color: p.color, periods: governmentTenure[p.id].periods as GovernmentTenurePeriod[] }] : []),
  ...inactiveParties.map(p => ({ short: p.short, color: p.color, periods: p.periods as GovernmentTenurePeriod[] })),
];

const latestYear = financeYears[financeYears.length - 1];
const rowFrom = (year: number, has: (r: FinanceYear) => boolean) => financeYears.find(r => r.year >= year && has(r));

function change(base: number, value: (r: FinanceYear) => number | null | undefined): ValueChange | null {
  const first = rowFrom(base, r => value(r) != null);
  const last = [...financeYears].reverse().find(r => value(r) != null);
  if (!first || !last || first.year >= last.year) return null;
  return { fromYear: first.year, from: value(first)!, toYear: last.year, to: value(last)! };
}

/** Koľkokrát vzrástli ceny (HICP, priemerná ročná miera) medzi dvoma rokmi; null, ak chýba niektorý rok. */
export function priceFactor(fromYear: number, toYear: number) {
  const rows = financeYears.filter(r => r.year > fromYear && r.year <= toYear);
  if (fromYear >= toYear || rows.length !== toYear - fromYear || rows.some(r => r.inflation === undefined)) return null;
  return rows.reduce((f, r) => f * (1 + r.inflation! / 100), 1);
}

const plural = (n: number, one: string, few: string, many: string) => n === 1 ? one : n >= 2 && n <= 4 ? few : many;
export const governmentsLabel = (n: number) => `${n} ${plural(n, 'vláda', 'vlády', 'vlád')}`;
export const premiersLabel = (n: number) => `${n} ${plural(n, 'premiér', 'premiéri', 'premiérov')}`;
/** „počas tvojho života 10 vlád a 7 premiérov“; pri ročníkoch pred 1993 od vzniku samostatného Slovenska. */
export const lifeHeadline = (s: LifeSummary) =>
  `${s.ageAtIndependence !== null ? 'od vzniku samostatného Slovenska' : 'počas tvojho života'} ${governmentsLabel(s.cabinets.length)} a ${premiersLabel(s.premiers)}`;

export function lifeSummary(year: number, asOf = tenureAsOf): LifeSummary {
  const from = `${Math.max(year, 1993)}-01-01`;
  const totalDays = Math.max(0, Math.round((utc(asOf) - utc(from)) / dayMs));
  const life = cabinets
    .map(cabinet => ({ cabinet, days: overlap(cabinet.start, cabinet.end, from, asOf) }))
    .filter(x => x.days > 0)
    .map(({ cabinet, days }) => ({ cabinet, days, start: cabinet.start > from ? cabinet.start : from, end: cabinet.end && cabinet.end < asOf ? cabinet.end : asOf }));
  // Deň odchodu jednej vlády je dňom vymenovania ďalšej; vláda úradujúca k začiatku obdobia sa ráta tiež.
  const premierDays = new Map<string, number>();
  for (const x of life) premierDays.set(x.cabinet.pm, (premierDays.get(x.cabinet.pm) ?? 0) + x.days);
  const topPremierEntry = [...premierDays].sort((a, b) => b[1] - a[1])[0];
  const partyDays = partyTenures()
    .map(p => ({ short: p.short, color: p.color, days: p.periods.reduce((sum, period) => sum + overlap(period.start, period.end, from, asOf), 0) }))
    .filter(p => p.days > 0)
    .sort((a, b) => b.days - a.days);
  const adultYear = year + 18;
  const adultDate = `${adultYear}-07-01` < asOf ? `${adultYear}-07-01` : asOf;
  const adultStatus = adultYear < 1993 ? 'czechoslovakia' : adultYear > birthYears.max ? 'future' : 'slovakia';
  const adultCabinet = adultStatus === 'slovakia' ? cabinets.find(c => c.start <= adultDate && (c.end === null || c.end > adultDate)) ?? null : null;
  const base = Math.max(year, financeYears[0].year);
  const factor = priceFactor(base, latestYear.year);
  const prices = factor === null ? null : { fromYear: base, toYear: latestYear.year, factor };
  return {
    year, from, asOf, totalDays,
    ageAtIndependence: year < 1993 ? 1993 - year : null,
    cabinets: life,
    premiers: premierDays.size,
    topParty: partyDays[0] ? { ...partyDays[0], share: totalDays ? partyDays[0].days / totalDays : 0 } : null,
    topPremier: topPremierEntry ? { name: topPremierEntry[0], days: topPremierEntry[1] } : null,
    adulthood: { year: adultYear, status: adultStatus, cabinet: adultCabinet },
    debt: change(base, debtPerCapita),
    minWage: change(base, r => r.minWage),
    prices,
    living: change(base, r => r.gdpPcPps),
  };
}
