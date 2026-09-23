import { tenureMethodology } from './government-tenure.ts';

/*
  Vlády Slovenskej republiky od 1. 1. 1993: úradný názov, premiér, obdobie a koaličné strany
  v čase vymenovania. Samostatný modul, aby ich sekcia Zodpovednosť mohla použiť bez dát Eurostatu
  (Hospodárenie ich reexportuje z lib/public-finance.ts).
*/

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
