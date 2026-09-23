import { publicFinance } from './public-finance.data.ts';
import { cabinets, cabinetsSource, type Cabinet } from './cabinets.ts';
export { cabinets, cabinetsSource, partiesLabel, cabinetById, type Cabinet, type CabinetParty } from './cabinets.ts';

/*
  Hospodárenie štátu: saldo a dlh verejnej správy s ďalšími ukazovateľmi po rokoch (Eurostat,
  rad od 1995) a ich priradenie vládam. Rok, v ktorom sa vlády striedali, delíme medzi ne podľa
  dní vo funkcii — je to jednoduché, kontrolovateľné pravidlo, nie súd o tom, kto za čo môže:
  rozpočet na daný rok schvaľuje spravidla predchádzajúca vláda a krízové roky sa nedajú
  „odpočítať“. Preto pri každom čísle ostáva vidieť aj rok a kontext.
*/

export type FinanceYear = {
  year: number;
  deficitPct: number;          // saldo verejnej správy (B.9), % HDP; záporné = deficit
  deficitMeur: number;         // saldo v mil. €
  debtPct: number;             // hrubý (maastrichtský) dlh verejnej správy ku koncu roka, % HDP
  debtMeur: number;            // dlh v mil. €
  expenditurePct?: number;     // výdavky verejnej správy, % HDP
  revenuePct?: number;         // príjmy verejnej správy, % HDP
  interestPct?: number;        // úroky zaplatené z dlhu, % HDP
  gdpGrowth?: number;          // reálny rast HDP, %
  gdpMeur?: number;            // HDP v bežných cenách, mil. €
  unemployment?: number;       // miera nezamestnanosti 15–74, %
  unemploymentSource?: string; // "historic" = rad pred zmenou metodiky 2021
  inflation?: number;          // HICP, priemerná ročná miera, %
  population?: number;         // obyvateľstvo k 1. januáru
  // Životná úroveň
  gdpPcPps?: number;           // HDP na obyvateľa v parite kúpnej sily, EÚ27 = 100
  minWage?: number;            // minimálna mesačná mzda v januári, €
  medianIncome?: number;       // medián ekvivalizovaného disponibilného príjmu, € za rok
  povertyRate?: number;        // miera rizika chudoby (pod 60 % mediánu), %
  employment?: number;         // miera zamestnanosti 20–64, %
};
export type FinanceDataset = { dataset: string; label: string; updated: string; filter: Record<string, string | string[]>; url: string };
export type CompareRow = { geo: string; deficitPct?: number; debtPct?: number; gdpGrowth?: number; inflation?: number; unemployment?: number; gdpPcPps?: number };
export type CompareIndicator = { label: string; year: number; dataset: string; url: string; updated: string };
export type FinanceCompare = { geos: { code: string; label: string }[]; indicators: Record<string, CompareIndicator>; rows: CompareRow[] };
export type PublicFinanceData = { fetched: string; from: number; datasets: Record<string, FinanceDataset>; years: FinanceYear[]; compare: FinanceCompare };

export const financeFetched = publicFinance.fetched;
export const financeDatasets = publicFinance.datasets;
export const financeYears: FinanceYear[] = publicFinance.years;
export const latestFinanceYear = financeYears[financeYears.length - 1];
export const financeYearById = (year: number) => financeYears.find(r => r.year === year);
export const financeCompare: FinanceCompare = publicFinance.compare;

/* ---------- Životná úroveň ---------- */

export const latestWith = (field: keyof FinanceYear) => [...financeYears].reverse().find(r => r[field] !== undefined);

// Porovnanie: poradie Slovenska medzi krajinami V4 (1 = najlepšie) pri ukazovateli, kde vyššia hodnota je lepšia alebo horšia.
export const compareV4 = ["SK", "CZ", "PL", "HU"];
export function v4Rank(field: keyof CompareRow, higherIsBetter: boolean) {
  const rows = financeCompare.rows.filter(r => compareV4.includes(r.geo) && typeof r[field] === "number");
  const val = (r: CompareRow) => r[field] as number;
  const sorted = [...rows].sort((a, b) => higherIsBetter ? val(b) - val(a) : val(a) - val(b));
  const i = sorted.findIndex(r => r.geo === "SK");
  return i < 0 ? null : { rank: i + 1, of: sorted.length };
}

// Dlh na obyvateľa v €; obyvateľstvo Eurostat vedie k 1. januáru, dlh ku koncu roka — berieme rok nasledujúci, ak existuje.
export function debtPerCapita(row: FinanceYear) {
  const pop = financeYearById(row.year + 1)?.population ?? row.population;
  return pop ? Math.round(row.debtMeur * 1e6 / pop) : null;
}
// Primárne saldo = saldo bez úrokov: hovorí, či štát hospodári vyrovnane ešte pred splácaním starých dlhov.
export const primaryBalance = (row: FinanceYear) => row.interestPct === undefined ? null : Math.round((row.deficitPct + row.interestPct) * 10) / 10;

/* ---------- Vlády (lib/cabinets.ts) ---------- */


const DAY = 86_400_000;
const at = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

// Dni vo funkcii v danom roku; deň výmeny patrí novej vláde (začiatok vrátane, koniec bez).
export function cabinetDaysInYear(cabinet: Cabinet, year: number) {
  const yearStart = Date.UTC(year, 0, 1), yearEnd = Date.UTC(year + 1, 0, 1);
  const s = Math.max(at(cabinet.start), yearStart);
  const e = Math.min(cabinet.end ? at(cabinet.end) : yearEnd, yearEnd);
  return Math.max(0, Math.round((e - s) / DAY));
}
export type YearShare = { cabinet: Cabinet; days: number; share: number };
export function yearShares(year: number): YearShare[] {
  const rows = cabinets.map(c => ({ cabinet: c, days: cabinetDaysInYear(c, year) })).filter(r => r.days > 0);
  const total = rows.reduce((a, r) => a + r.days, 0);
  return rows.map(r => ({ ...r, share: total ? r.days / total : 0 }));
}
// Vláda, ktorá odvládla najväčšiu časť roka (do tabuľky a farby v grafe).
export const leadingCabinet = (year: number) => yearShares(year).sort((a, b) => b.days - a.days)[0]?.cabinet ?? null;

export type CabinetSummary = {
  cabinet: Cabinet;
  years: { year: number; share: number }[]; // roky s podielom dní > 0
  weight: number;                            // súčet podielov = „roky v dátach“
  avgDeficitPct: number | null;              // priemer salda vážený podielom roka
  deficitSumMeur: number | null;             // súčet salda pripísaný podľa podielu, mil. €
  debtChangePct: number | null;              // zmena dlhu v p. b. HDP pripísaná podľa podielu
  // Stav dlhu „pri prevzatí“ a „pri odovzdaní“: koniec roka pred prvým rokom, ktorý vláda odvládla
  // aspoň z polovice, a koniec posledného takého roka. Vláda s pár týždňami v roku ho tak nedostane pripísaný.
  debtStartPct: number | null;
  debtStartYear: number | null;
  debtEndPct: number | null;
  debtEndYear: number | null;
  avgGrowth: number | null;
  avgInflation: number | null;
  avgUnemployment: number | null;
  avgInterestPct: number | null;
};

const weightedMean = (pairs: [number | undefined, number][]) => {
  const valid = pairs.filter((p): p is [number, number] => p[0] !== undefined);
  const w = valid.reduce((a, [, s]) => a + s, 0);
  return w > 0 ? Math.round(valid.reduce((a, [v, s]) => a + v * s, 0) / w * 10) / 10 : null;
};

export function cabinetSummary(cabinet: Cabinet): CabinetSummary {
  const years = financeYears.map(row => {
    const share = yearShares(row.year).find(s => s.cabinet.id === cabinet.id)?.share ?? 0;
    return { row, share };
  }).filter(x => x.share > 0);
  const weight = years.reduce((a, x) => a + x.share, 0);
  const deltas = years.map(({ row, share }) => {
    const prev = financeYearById(row.year - 1);
    return prev ? [row.debtPct - prev.debtPct, share] as [number, number] : null;
  }).filter((x): x is [number, number] => x !== null);
  const majority = years.filter(x => x.share >= 0.5);
  const span = majority.length ? majority : years;
  const first = span[0]?.row, last = span[span.length - 1]?.row;
  return {
    cabinet,
    years: years.map(x => ({ year: x.row.year, share: x.share })),
    weight: Math.round(weight * 100) / 100,
    avgDeficitPct: weightedMean(years.map(x => [x.row.deficitPct, x.share])),
    deficitSumMeur: years.length ? Math.round(years.reduce((a, x) => a + x.row.deficitMeur * x.share, 0)) : null,
    debtChangePct: deltas.length ? Math.round(deltas.reduce((a, [d, s]) => a + d * s, 0) * 10) / 10 : null,
    debtStartPct: first ? financeYearById(first.year - 1)?.debtPct ?? null : null,
    debtStartYear: first ? first.year - 1 : null,
    debtEndPct: last?.debtPct ?? null,
    debtEndYear: last?.year ?? null,
    avgGrowth: weightedMean(years.map(x => [x.row.gdpGrowth, x.share])),
    avgInflation: weightedMean(years.map(x => [x.row.inflation, x.share])),
    avgUnemployment: weightedMean(years.map(x => [x.row.unemployment, x.share])),
    avgInterestPct: weightedMean(years.map(x => [x.row.interestPct, x.share])),
  };
}
export const cabinetSummaries = () => cabinets.map(cabinetSummary);

/* ---------- Kontext a pravidlá ---------- */

// Udalosti, ktoré čísla v danom roku výrazne ovplyvnili. Kontext, nie ospravedlnenie.
export const financeEvents: { year: number; label: string }[] = [
  { year: 1999, label: 'ozdravný balík a začiatok reštrukturalizácie bánk' },
  { year: 2000, label: 'náklady reštrukturalizácie bánk v deficite' },
  { year: 2004, label: 'vstup do EÚ, daňová reforma' },
  { year: 2009, label: 'zavedenie eura, globálna finančná kríza' },
  { year: 2020, label: 'pandémia covid-19' },
  { year: 2021, label: 'pandémia covid-19' },
  { year: 2022, label: 'energetická kríza, vysoká inflácia' },
  { year: 2023, label: 'energetická pomoc, inflácia' },
];
export const eventsForYear = (year: number) => financeEvents.filter(e => e.year === year).map(e => e.label);

// Ústavný zákon č. 493/2011 Z. z. o rozpočtovej zodpovednosti: horný limit dlhu 60 % HDP,
// od roku 2018 každý rok o 1 p. b. nižší až po 50 % v roku 2027 (čl. 12 a 13). Zjednodušene;
// nižšie pásma spúšťajú postupne prísnejšie opatrenia až po hlasovanie o dôvere vláde.
export const debtBrake = {
  law: 'Ústavný zákon č. 493/2011 Z. z. o rozpočtovej zodpovednosti',
  source: 'https://www.zakonypreludi.sk/zz/2011-493',
  council: 'https://www.rrz.sk/',
  effectiveFrom: 2012,
  upperLimit(year: number) { return year < 2018 ? 60 : Math.max(50, 60 - (year - 2017)); },
};
// Maastrichtské referenčné hodnoty (Pakt stability a rastu): deficit 3 % HDP, dlh 60 % HDP.
export const maastricht = { deficitPct: -3, debtPct: 60 };

// Zmena úrovňového ukazovateľa počas vlády: hodnota na konci roka pred prvým „väčšinovým“ rokom → hodnota na konci posledného.
export function levelChange(summary: CabinetSummary, field: keyof FinanceYear) {
  const start = summary.debtStartYear ? financeYearById(summary.debtStartYear)?.[field] : undefined;
  const end = summary.debtEndYear ? financeYearById(summary.debtEndYear)?.[field] : undefined;
  if (typeof start !== "number" || typeof end !== "number") return null;
  return { start, end, change: Math.round((end - start) * 10) / 10 };
}
export const financeSources = [
  { name: 'Eurostat · vládny deficit a dlh (EDP)', url: financeDatasets.deficitPct.url, note: `notifikácia deficitu a dlhu, aktualizované ${financeDatasets.deficitPct.updated}` },
  { name: 'Eurostat · príjmy, výdavky a úroky verejnej správy', url: financeDatasets.expenditurePct.url, note: `aktualizované ${financeDatasets.expenditurePct.updated}` },
  { name: 'Eurostat · HDP a jeho rast', url: financeDatasets.gdpGrowth.url, note: `aktualizované ${financeDatasets.gdpGrowth.updated}` },
  { name: 'Eurostat · nezamestnanosť, inflácia HICP, obyvateľstvo', url: financeDatasets.unemployment.url, note: 'nezamestnanosť pred rokom 2009 z historického radu (une_rt_a_h)' },
  { name: 'Eurostat · HDP na obyvateľa v parite kúpnej sily', url: financeDatasets.gdpPcPps.url, note: `EÚ27 = 100, aktualizované ${financeDatasets.gdpPcPps.updated}` },
  { name: 'Eurostat · minimálna mzda', url: financeDatasets.minWage.url, note: 'mesačná minimálna mzda, stav k januáru (earn_mw_cur)' },
  { name: 'Eurostat · príjmy a chudoba (EU-SILC)', url: financeDatasets.medianIncome.url, note: 'medián ekvivalizovaného disponibilného príjmu a miera rizika chudoby pod 60 % mediánu; rad od 2005' },
  { name: 'Eurostat · zamestnanosť 20–64', url: financeDatasets.employment.url, note: 'rad od 2009' },
  { name: 'Štatistický úrad SR · notifikácia deficitu a dlhu', url: 'https://slovak.statistics.sk/', note: 'primárny zostavovateľ údajov, ktoré Eurostat preberá' },
  { name: 'Rada pre rozpočtovú zodpovednosť', url: debtBrake.council, note: 'hodnotenie dlhovej brzdy a dlhodobej udržateľnosti' },
  { name: debtBrake.law, url: debtBrake.source, note: 'horný limit dlhu a sankčné pásma' },
  { name: 'Úrad vlády SR · história vlád', url: cabinetsSource, note: 'dátumy vymenovania a konca vlád' },
];
