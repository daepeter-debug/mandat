export type GovernmentTenurePeriod = {
  start: string;
  end: string | null;
  government: string;
  basis: 'coalition' | 'cabinet';
  source: string;
  note?: string;
};

export type GovernmentTenure = {
  periods: GovernmentTenurePeriod[];
  note?: string;
  predecessorNote?: string;
};

export const tenureAsOf = '2026-09-13';

export const tenureMethodology = {
  label: 'Účasť vo vláde od 1. januára 1993',
  description: 'Sčítavame dni, počas ktorých bola dnešná strana členom vládnej koalície alebo mala člena či vlastného nominanta v kabinete. Volebné koalície, predchodcov a neskorší vstup do už existujúcej vlády označujeme osobitne.',
  source: 'https://www.vlada.gov.sk/vlada-sr/historia-vlad-sr/',
};

const history = 'https://www.narodnostnemensiny.vlada.gov.sk/site/assets/files/3561/sprava_o_postaveni_a_pravach_prislusnikov_narodnostnych_mensin_za_obdobie_rokov_2019_-_2020.pdf';
const governmentHistory = tenureMethodology.source;
const coalition2020 = 'https://www.nrsr.sk/web/Default.aspx?MasterID=55221&sid=udalosti%2Fudalost';
const sasExit = 'https://spravy.stvr.sk/2022/09/heger-vstupujeme-do-mensinovej-vlady/';
const democratsEntry = 'https://spravy.stvr.sk/2023/03/heger-predstavil-stranu-demokrati-v-time-ma-styroch-ministrov-a-viacero-znamych-tvari/';
const coalition2023 = 'https://spravy.stvr.sk/2023/10/lidri-smeru-hlasu-a-sns-podpisuju-koalicnu-zmluvu/';
const huliakAppointment = 'https://www.prezident.sk/tlacove-spravy/prezident-sr-vymenoval-r-huliaka-za-noveho-ministra-cestovneho-ruchu-a-sportu/';

export const governmentTenure: Record<string, GovernmentTenure> = {
  ps: {
    periods: [],
    note: 'Progresívne Slovensko doteraz nebolo členom vlády SR.',
  },
  smer: {
    periods: [
      { start: '2006-07-04', end: '2010-07-09', government: 'Prvá vláda Roberta Fica', basis: 'coalition', source: history },
      { start: '2012-04-04', end: '2020-03-21', government: 'Druhá a tretia vláda Roberta Fica, vláda Petra Pellegriniho', basis: 'coalition', source: history },
      { start: '2023-10-25', end: null, government: 'Štvrtá vláda Roberta Fica', basis: 'coalition', source: coalition2023 },
    ],
  },
  rep: {
    periods: [],
    note: 'Hnutie Republika doteraz nebolo členom vlády SR.',
  },
  slovensko: {
    periods: [
      { start: '2020-03-21', end: '2023-05-15', government: 'Vlády Igora Matoviča a Eduarda Hegera', basis: 'coalition', source: coalition2020, note: 'Započítaná je tá istá politická strana pod vtedajším názvom OĽANO.' },
    ],
    note: 'Hnutie Slovensko je premenované OĽANO; zmena názvu preto súčet neprerušuje.',
  },
  hlas: {
    periods: [
      { start: '2023-10-25', end: null, government: 'Štvrtá vláda Roberta Fica', basis: 'coalition', source: coalition2023 },
    ],
  },
  sas: {
    periods: [
      { start: '2010-07-09', end: '2012-04-04', government: 'Vláda Ivety Radičovej', basis: 'coalition', source: history },
      { start: '2020-03-21', end: '2022-09-05', government: 'Vlády Igora Matoviča a Eduarda Hegera', basis: 'coalition', source: sasExit, note: 'Súčet končí dňom, keď SaS oficiálne opustila koalíciu.' },
    ],
  },
  kdh: {
    periods: [
      { start: '1994-03-15', end: '1994-12-13', government: 'Vláda Jozefa Moravčíka', basis: 'coalition', source: history },
      { start: '1998-10-30', end: '2002-10-16', government: 'Prvá vláda Mikuláša Dzurindu', basis: 'coalition', source: history, note: 'KDH bolo vo vláde ako súčasť Slovenskej demokratickej koalície.' },
      { start: '2002-10-16', end: '2006-02-08', government: 'Druhá vláda Mikuláša Dzurindu', basis: 'coalition', source: 'https://www.nrsr.sk/web/?sid=nrsr%2Fhistoria', note: 'KDH odišlo z vládnej koalície 8. februára 2006.' },
      { start: '2010-07-09', end: '2012-04-04', government: 'Vláda Ivety Radičovej', basis: 'coalition', source: history },
    ],
  },
  dem: {
    periods: [
      { start: '2023-03-07', end: '2023-05-15', government: 'Dočasne poverená vláda Eduarda Hegera', basis: 'cabinet', source: democratsEntry, note: 'Premiér a štyria poverení ministri vstúpili do Demokratov počas už existujúcej vlády.' },
    ],
    note: 'Ide o prítomnosť členov Demokratov v dočasne poverenom kabinete, nie o účasť strany na pôvodnej koaličnej zmluve z roku 2020.',
  },
  aliancia: {
    periods: [],
    note: 'Dnešná Maďarská aliancia ako spoločný subjekt doteraz nebola členom vlády SR.',
    predecessorNote: 'SMK bola súčasťou vlád v rokoch 1998 – 2006; Most-Híd v rokoch 2010 – 2012 a 2016 – 2020. Tieto obdobia do čísla Aliancie nepripočítavame.',
  },
  sns: {
    periods: [
      { start: '1993-01-01', end: '1994-03-15', government: 'Druhá vláda Vladimíra Mečiara', basis: 'coalition', source: history, note: 'Počítame až od vzniku samostatnej SR.' },
      { start: '1994-12-13', end: '1998-10-30', government: 'Tretia vláda Vladimíra Mečiara', basis: 'coalition', source: history },
      { start: '2006-07-04', end: '2010-07-09', government: 'Prvá vláda Roberta Fica', basis: 'coalition', source: history },
      { start: '2016-03-23', end: '2020-03-21', government: 'Tretia vláda Roberta Fica a vláda Petra Pellegriniho', basis: 'coalition', source: history },
      { start: '2023-10-25', end: null, government: 'Štvrtá vláda Roberta Fica', basis: 'coalition', source: coalition2023 },
    ],
  },
  rodina: {
    periods: [
      { start: '2020-03-21', end: '2023-05-15', government: 'Vlády Igora Matoviča a Eduarda Hegera', basis: 'coalition', source: coalition2020 },
    ],
  },
  pnp: {
    periods: [],
    note: 'Právo na pravdu doteraz nebolo členom vlády SR.',
  },
  zaludi: {
    periods: [
      { start: '2020-03-21', end: '2023-05-15', government: 'Vlády Igora Matoviča a Eduarda Hegera', basis: 'coalition', source: coalition2020 },
    ],
  },
  ku: {
    periods: [],
    note: 'Samostatná účasť Kresťanskej únie vo vláde sa v použitých zdrojoch nepotvrdila.',
  },
  vidiek: {
    periods: [
      { start: '2025-03-05', end: null, government: 'Štvrtá vláda Roberta Fica', basis: 'cabinet', source: huliakAppointment, note: 'Predseda strany Rudolf Huliak vstúpil do kabinetu ako minister na základe politickej dohody; Strana vidieka nebola signatárom koaličnej zmluvy z roku 2023.' },
    ],
  },
  lsns: {
    periods: [],
    note: 'ĽSNS doteraz nebola členom vlády SR.',
  },
};

const dayMs = 86_400_000;

function utcDay(value: string) {
  return Date.parse(`${value}T00:00:00Z`);
}

export function periodDays(period: GovernmentTenurePeriod, asOf = tenureAsOf) {
  const end = period.end ?? asOf;
  return Math.max(0, Math.round((utcDay(end) - utcDay(period.start)) / dayMs));
}

export function tenureDays(entry: GovernmentTenure, asOf = tenureAsOf) {
  return entry.periods.reduce((sum, period) => sum + periodDays(period, asOf), 0);
}

export function tenureDuration(entry: GovernmentTenure, asOf = tenureAsOf) {
  const days = tenureDays(entry, asOf);
  const totalMonths = Math.floor(days / 30.436875);
  return { days, years: Math.floor(totalMonths / 12), months: totalMonths % 12 };
}

function yearWord(value: number) {
  if (value === 1) return 'rok';
  if (value >= 2 && value <= 4) return 'roky';
  return 'rokov';
}

function monthWord(value: number) {
  if (value === 1) return 'mesiac';
  if (value >= 2 && value <= 4) return 'mesiace';
  return 'mesiacov';
}

export function tenureLabel(entry: GovernmentTenure, asOf = tenureAsOf) {
  const { days, years, months } = tenureDuration(entry, asOf);
  if (days === 0) return 'bez účasti';
  if (years === 0) return `${months} ${monthWord(months)}`;
  if (months === 0) return `${years} ${yearWord(years)}`;
  return `${years} ${yearWord(years)} ${months} ${monthWord(months)}`;
}

export function formatTenureDate(value: string) {
  return new Intl.DateTimeFormat('sk-SK', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}

export const governmentTenureSources = {
  history,
  governmentHistory,
  coalition2020,
  sasExit,
  democratsEntry,
  coalition2023,
  huliakAppointment,
};
