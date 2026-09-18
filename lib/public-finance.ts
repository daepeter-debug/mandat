import { publicFinance } from './public-finance.data.ts';
import { tenureMethodology } from './government-tenure.ts';

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
};
export type FinanceDataset = { dataset: string; label: string; updated: string; filter: Record<string, string>; url: string };
export type PublicFinanceData = { fetched: string; from: number; datasets: Record<string, FinanceDataset>; years: FinanceYear[] };

export const financeFetched = publicFinance.fetched;
export const financeDatasets = publicFinance.datasets;
export const financeYears: FinanceYear[] = publicFinance.years;
export const latestFinanceYear = financeYears[financeYears.length - 1];
export const financeYearById = (year: number) => financeYears.find(r => r.year === year);

// Dlh na obyvateľa v €; obyvateľstvo Eurostat vedie k 1. januáru, dlh ku koncu roka — berieme rok nasledujúci, ak existuje.
export function debtPerCapita(row: FinanceYear) {
  const pop = financeYearById(row.year + 1)?.population ?? row.population;
  return pop ? Math.round(row.debtMeur * 1e6 / pop) : null;
}
// Primárne saldo = saldo bez úrokov: hovorí, či štát hospodári vyrovnane ešte pred splácaním starých dlhov.
export const primaryBalance = (row: FinanceYear) => row.interestPct === undefined ? null : Math.round((row.deficitPct + row.interestPct) * 10) / 10;

/* ---------- Vlády ---------- */

// Koaličná strana v čase vymenovania vlády. `party` odkazuje na dnešnú stranu (má logo),
// `inactive` na stranu z registra neaktívnych (má aspoň farbu); bez oboch ostáva len skratka.
export type CabinetParty = { short: string; party?: string; inactive?: string };
export type Cabinet = {
  id: string;
  name: string;        // úradný názov
  short: string;       // krátky názov do tabuliek a grafu
  pm: string;
  start: string;       // vymenovanie (ISO dátum)
  end: string | null;  // koniec funkčného obdobia; null = úraduje
  parties: CabinetParty[]; // koaličné strany v čase vymenovania; prázdne = úradnícka vláda
  color: string;
  note?: string;
};

const P = {
  hzds: { short: 'HZDS', inactive: 'hzds' }, lshzds: { short: 'ĽS–HZDS', inactive: 'hzds' },
  sns: { short: 'SNS', party: 'sns' }, zrs: { short: 'ZRS', inactive: 'zrs' },
  du: { short: 'DÚ', inactive: 'du' }, sdl: { short: 'SDĽ', inactive: 'sdl' }, kdh: { short: 'KDH', party: 'kdh' }, nds: { short: 'NDS' },
  sdk: { short: 'SDK', inactive: 'sdk' }, smk: { short: 'SMK', inactive: 'smk' }, sop: { short: 'SOP', inactive: 'sop' },
  sdku: { short: 'SDKÚ', inactive: 'sdku' }, sdkuds: { short: 'SDKÚ–DS', inactive: 'sdku' }, ano: { short: 'ANO', inactive: 'ano' },
  smer: { short: 'SMER–SD', party: 'smer' }, sas: { short: 'SaS', party: 'sas' }, most: { short: 'Most–Híd', inactive: 'most' }, siet: { short: 'Sieť', inactive: 'siet' },
  olano: { short: 'OĽANO', party: 'slovensko' }, rodina: { short: 'SME RODINA', party: 'rodina' }, zaludi: { short: 'ZA ĽUDÍ', party: 'zaludi' },
  hlas: { short: 'HLAS–SD', party: 'hlas' },
} satisfies Record<string, CabinetParty>;

export const cabinetsSource = tenureMethodology.source; // história vlád SR na vlada.gov.sk
export const cabinets: Cabinet[] = [
  { id: 'meciar2', name: 'Druhá vláda Vladimíra Mečiara', short: 'Mečiar II', pm: 'Vladimír Mečiar', start: '1993-01-01', end: '1994-03-15', parties: [P.hzds, P.sns], color: '#5b6b8c', note: 'Vymenovaná 24. 6. 1992, počítame od vzniku samostatnej SR.' },
  { id: 'moravcik', name: 'Vláda Jozefa Moravčíka', short: 'Moravčík', pm: 'Jozef Moravčík', start: '1994-03-15', end: '1994-12-13', parties: [P.du, P.sdl, P.kdh, P.nds], color: '#8a8f99' },
  { id: 'meciar3', name: 'Tretia vláda Vladimíra Mečiara', short: 'Mečiar III', pm: 'Vladimír Mečiar', start: '1994-12-13', end: '1998-10-30', parties: [P.hzds, P.sns, P.zrs], color: '#46587d' },
  { id: 'dzurinda1', name: 'Prvá vláda Mikuláša Dzurindu', short: 'Dzurinda I', pm: 'Mikuláš Dzurinda', start: '1998-10-30', end: '2002-10-16', parties: [P.sdk, P.sdl, P.smk, P.sop], color: '#2f6db5' },
  { id: 'dzurinda2', name: 'Druhá vláda Mikuláša Dzurindu', short: 'Dzurinda II', pm: 'Mikuláš Dzurinda', start: '2002-10-16', end: '2006-07-04', parties: [P.sdku, P.smk, P.kdh, P.ano], color: '#5b8fd1' },
  { id: 'fico1', name: 'Prvá vláda Roberta Fica', short: 'Fico I', pm: 'Robert Fico', start: '2006-07-04', end: '2010-07-09', parties: [P.smer, P.sns, P.lshzds], color: '#b83d36' },
  { id: 'radicova', name: 'Vláda Ivety Radičovej', short: 'Radičová', pm: 'Iveta Radičová', start: '2010-07-09', end: '2012-04-04', parties: [P.sdkuds, P.sas, P.kdh, P.most], color: '#4a9fd6' },
  { id: 'fico2', name: 'Druhá vláda Roberta Fica', short: 'Fico II', pm: 'Robert Fico', start: '2012-04-04', end: '2016-03-23', parties: [P.smer], color: '#c9534b' },
  { id: 'fico3', name: 'Tretia vláda Roberta Fica', short: 'Fico III', pm: 'Robert Fico', start: '2016-03-23', end: '2018-03-22', parties: [P.smer, P.sns, P.most, P.siet], color: '#d66c64' },
  { id: 'pellegrini', name: 'Vláda Petra Pellegriniho', short: 'Pellegrini', pm: 'Peter Pellegrini', start: '2018-03-22', end: '2020-03-21', parties: [P.smer, P.sns, P.most], color: '#e0867f' },
  { id: 'matovic', name: 'Vláda Igora Matoviča', short: 'Matovič', pm: 'Igor Matovič', start: '2020-03-21', end: '2021-04-01', parties: [P.olano, P.rodina, P.sas, P.zaludi], color: '#c9a227' },
  { id: 'heger', name: 'Vláda Eduarda Hegera', short: 'Heger', pm: 'Eduard Heger', start: '2021-04-01', end: '2023-05-15', parties: [P.olano, P.rodina, P.sas, P.zaludi], color: '#8fae4a', note: 'Od decembra 2022 po vyslovení nedôvery dočasne poverená vláda.' },
  { id: 'odor', name: 'Vláda Ľudovíta Ódora', short: 'Ódor', pm: 'Ľudovít Ódor', start: '2023-05-15', end: '2023-10-25', parties: [], color: '#7a7f8a', note: 'Úradnícka vláda bez straníckeho zloženia.' },
  { id: 'fico4', name: 'Štvrtá vláda Roberta Fica', short: 'Fico IV', pm: 'Robert Fico', start: '2023-10-25', end: null, parties: [P.smer, P.hlas, P.sns], color: '#a3302a' },
];
export const partiesLabel = (cabinet: Cabinet) => cabinet.parties.length ? cabinet.parties.map(p => p.short).join(', ') : 'úradnícka vláda';
export const cabinetById = (id: string) => cabinets.find(c => c.id === id);

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

export const financeSources = [
  { name: 'Eurostat · vládny deficit a dlh (EDP)', url: financeDatasets.deficitPct.url, note: `notifikácia deficitu a dlhu, aktualizované ${financeDatasets.deficitPct.updated}` },
  { name: 'Eurostat · príjmy, výdavky a úroky verejnej správy', url: financeDatasets.expenditurePct.url, note: `aktualizované ${financeDatasets.expenditurePct.updated}` },
  { name: 'Eurostat · HDP a jeho rast', url: financeDatasets.gdpGrowth.url, note: `aktualizované ${financeDatasets.gdpGrowth.updated}` },
  { name: 'Eurostat · nezamestnanosť, inflácia HICP, obyvateľstvo', url: financeDatasets.unemployment.url, note: 'nezamestnanosť pred rokom 2009 z historického radu (une_rt_a_h)' },
  { name: 'Štatistický úrad SR · notifikácia deficitu a dlhu', url: 'https://slovak.statistics.sk/', note: 'primárny zostavovateľ údajov, ktoré Eurostat preberá' },
  { name: 'Rada pre rozpočtovú zodpovednosť', url: debtBrake.council, note: 'hodnotenie dlhovej brzdy a dlhodobej udržateľnosti' },
  { name: debtBrake.law, url: debtBrake.source, note: 'horný limit dlhu a sankčné pásma' },
  { name: 'Úrad vlády SR · história vlád', url: cabinetsSource, note: 'dátumy vymenovania a konca vlád' },
];
