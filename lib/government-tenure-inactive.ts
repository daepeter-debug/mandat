import type { GovernmentTenurePeriod } from './government-tenure.ts';

/*
  Strany, ktoré boli od 1. 1. 1993 vo vláde SR, ale dnes už nekandidujú alebo sa zlúčili do iných.
  Hranice období sú rovnaké ako pri dnešných stranách (lib/government-tenure.ts): deň vymenovania
  vlády až deň vymenovania nasledujúcej, výnimky (skorší odchod z koalície) sú označené poznámkou.
  Čas predchodcov dnešným stranám nepripočítavame (SMK a Most-Híd → Aliancia, SDĽ a SOP → SMER,
  DÚ a SDK → SDKÚ); nástupníctvo je uvedené v poli successor. Drobných koaličných partnerov
  (Roľnícka strana Slovenska, Národno-demokratická strana) neuvádzame. Farby sú orientačné.
*/
export type InactiveTenurePeriod = GovernmentTenurePeriod & { led?: boolean };
export type InactiveParty = {
  id: string;
  short: string;
  name: string;
  color: string;
  periods: InactiveTenurePeriod[];
  fate: string;
  successor?: string;
};

export const inactiveTenureChecked = '2026-09-13';

const governmentHistory = 'https://www.vlada.gov.sk/vlada-sr/historia-vlad-sr/';
const wikiMeciar2 = 'https://sk.wikipedia.org/wiki/Druh%C3%A1_vl%C3%A1da_Vladim%C3%ADra_Me%C4%8Diara';
const wikiMoravcik = 'https://sk.wikipedia.org/wiki/Vl%C3%A1da_Jozefa_Morav%C4%8D%C3%ADka';
const wikiMeciar3 = 'https://sk.wikipedia.org/wiki/Tretia_vl%C3%A1da_Vladim%C3%ADra_Me%C4%8Diara';
const wikiDzurinda1 = 'https://sk.wikipedia.org/wiki/Prv%C3%A1_vl%C3%A1da_Mikul%C3%A1%C5%A1a_Dzurindu';
const wikiDzurinda2 = 'https://sk.wikipedia.org/wiki/Druh%C3%A1_vl%C3%A1da_Mikul%C3%A1%C5%A1a_Dzurindu';
const wikiRadicova = 'https://sk.wikipedia.org/wiki/Vl%C3%A1da_Ivety_Radi%C4%8Dovej';
const wikiFico3 = 'https://sk.wikipedia.org/wiki/Tretia_vl%C3%A1da_Roberta_Fica';

export const inactiveParties: InactiveParty[] = [
  {
    id: 'hzds', short: 'HZDS', name: 'Hnutie za demokratické Slovensko (ĽS-HZDS)', color: '#5b5ea6',
    periods: [
      { start: '1993-01-01', end: '1994-03-15', government: 'Druhá vláda Vladimíra Mečiara', basis: 'coalition', source: wikiMeciar2, led: true, note: 'Počítame až od vzniku samostatnej SR.' },
      { start: '1994-12-13', end: '1998-10-30', government: 'Tretia vláda Vladimíra Mečiara', basis: 'coalition', source: wikiMeciar3, led: true },
      { start: '2006-07-04', end: '2010-07-09', government: 'Prvá vláda Roberta Fica', basis: 'coalition', source: governmentHistory },
    ],
    fate: 'Od roku 2003 ĽS-HZDS, po voľbách 2010 mimo parlamentu, strana zanikla v roku 2014.',
  },
  {
    id: 'sdku', short: 'SDKÚ', name: 'Slovenská demokratická a kresťanská únia – Demokratická strana', color: '#2f6db3',
    periods: [
      { start: '2002-10-16', end: '2006-07-04', government: 'Druhá vláda Mikuláša Dzurindu', basis: 'coalition', source: wikiDzurinda2, led: true },
      { start: '2010-07-09', end: '2012-04-04', government: 'Vláda Ivety Radičovej', basis: 'coalition', source: wikiRadicova, led: true },
    ],
    fate: 'Vznikla v roku 2000 z jadra SDK; od volieb 2016 mimo parlamentu.',
  },
  {
    id: 'smk', short: 'SMK', name: 'Strana maďarskej koalície', color: '#2a8a5a',
    periods: [
      { start: '1998-10-30', end: '2002-10-16', government: 'Prvá vláda Mikuláša Dzurindu', basis: 'coalition', source: wikiDzurinda1 },
      { start: '2002-10-16', end: '2006-07-04', government: 'Druhá vláda Mikuláša Dzurindu', basis: 'coalition', source: wikiDzurinda2 },
    ],
    fate: 'Neskôr SMK-MKP; v roku 2021 sa zlúčila do Aliancie.',
    successor: 'aliancia',
  },
  {
    id: 'most', short: 'MOST-HÍD', name: 'Most-Híd', color: '#e07b39',
    periods: [
      { start: '2010-07-09', end: '2012-04-04', government: 'Vláda Ivety Radičovej', basis: 'coalition', source: wikiRadicova },
      { start: '2016-03-23', end: '2020-03-21', government: 'Tretia vláda Roberta Fica a vláda Petra Pellegriniho', basis: 'coalition', source: wikiFico3 },
    ],
    fate: 'Po voľbách 2020 mimo parlamentu; v roku 2021 sa zlúčil do Aliancie.',
    successor: 'aliancia',
  },
  {
    id: 'sdl', short: 'SDĽ', name: 'Strana demokratickej ľavice', color: '#b8372f',
    periods: [
      { start: '1994-03-15', end: '1994-12-13', government: 'Vláda Jozefa Moravčíka', basis: 'coalition', source: wikiMoravcik },
      { start: '1998-10-30', end: '2002-10-16', government: 'Prvá vláda Mikuláša Dzurindu', basis: 'coalition', source: wikiDzurinda1 },
    ],
    fate: 'Po voľbách 2002 mimo parlamentu; v roku 2005 sa zlúčila so SMER-om.',
    successor: 'smer',
  },
  {
    id: 'sdk', short: 'SDK', name: 'Slovenská demokratická koalícia', color: '#4f86c6',
    periods: [
      { start: '1998-10-30', end: '2002-10-16', government: 'Prvá vláda Mikuláša Dzurindu', basis: 'coalition', source: wikiDzurinda1, led: true, note: 'Volebná strana zložená z DÚ, KDH, DS, SDSS a SZS; KDH je v prehľade zarátané aj samostatne.' },
    ],
    fate: 'Účelová strana piatich subjektov; jej jadro pokračovalo od roku 2000 ako SDKÚ.',
    successor: 'sdku',
  },
  {
    id: 'sop', short: 'SOP', name: 'Strana občianskeho porozumenia', color: '#3c8d7a',
    periods: [
      { start: '1998-10-30', end: '2002-10-16', government: 'Prvá vláda Mikuláša Dzurindu', basis: 'coalition', source: wikiDzurinda1 },
    ],
    fate: 'Po voľbách 2002 mimo parlamentu; v roku 2003 sa zlúčila so SMER-om.',
    successor: 'smer',
  },
  {
    id: 'zrs', short: 'ZRS', name: 'Združenie robotníkov Slovenska', color: '#9b2d2d',
    periods: [
      { start: '1994-12-13', end: '1998-10-30', government: 'Tretia vláda Vladimíra Mečiara', basis: 'coalition', source: wikiMeciar3 },
    ],
    fate: 'Po voľbách 1998 mimo parlamentu.',
  },
  {
    id: 'ano', short: 'ANO', name: 'Aliancia nového občana', color: '#c9a227',
    periods: [
      { start: '2002-10-16', end: '2005-08-24', government: 'Druhá vláda Mikuláša Dzurindu', basis: 'coalition', source: wikiDzurinda2, note: 'Súčet končí dňom, keď predseda ANO Pavol Rusko odišiel z kabinetu; strana následne prešla do opozície.' },
    ],
    fate: 'Vo voľbách 2006 sa nedostala do parlamentu; rozpustená v roku 2017.',
  },
  {
    id: 'du', short: 'DÚ', name: 'Demokratická únia', color: '#7b8fa1',
    periods: [
      { start: '1994-03-15', end: '1994-12-13', government: 'Vláda Jozefa Moravčíka', basis: 'coalition', source: wikiMoravcik, led: true, note: 'Premiér Jozef Moravčík za DEÚS, z ktorej v roku 1994 vznikla Demokratická únia.' },
    ],
    fate: 'V roku 2000 sa zlúčila do SDKÚ.',
    successor: 'sdku',
  },
  {
    id: 'siet', short: 'SIEŤ', name: '#Sieť', color: '#3aa0c8',
    periods: [
      { start: '2016-03-23', end: '2016-09-01', government: 'Tretia vláda Roberta Fica', basis: 'coalition', source: wikiFico3, note: 'Súčet končí podpisom novej koaličnej dohody bez Siete (1. 9. 2016), deň po demisii ministra Romana Brecelyho.' },
    ],
    fate: 'Rozpad klubu v roku 2016; strana neskôr premenovaná a mimo parlamentu.',
  },
];

export const inactiveTenureNote = 'Strany, ktoré už nekandidujú alebo sa zlúčili do dnešných. Ich čas nástupcom nepripočítavame: SMK a Most-Híd dnes tvoria Alianciu, SDĽ a SOP sa zlúčili so SMER-om, DÚ a jadro SDK pokračovali v SDKÚ. Drobných partnerov (RSS, NDS) neuvádzame; farby sú orientačné.';
