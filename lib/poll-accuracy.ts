import { election2023, threshold } from './parliament.ts';

/*
  Presnosť agentúr vo voľbách 30. 9. 2023: posledný zverejnený prieskum každej agentúry pred
  moratóriom oproti oficiálnemu výsledku (ŠÚ SR, lib/parliament.ts). Čísla sú prepísané
  z pôvodných tlačových správ agentúr alebo z médií, pre ktoré prieskum robili (odkaz pri každom).
  Porovnávame 11 subjektov, ktoré uvádzali všetky agentúry; ostatné (napr. ĽSNS, Modrí) vynechávame.
  OĽANO kandidovalo ako „OĽANO a priatelia“ (s KÚ a Za ľudí), agentúry ho uvádzali ako jeden subjekt.
  Overené 23. 9. 2026.
*/
export const accuracyChecked = '2026-09-23';
export const accuracyElection = { date: '2023-09-30', label: 'voľby do NR SR 30. 9. 2023' };

export type AccuracyParty = { id: string; short: string; subject: string };
export const accuracyParties: AccuracyParty[] = [
  { id: 'smer', short: 'SMER', subject: 'SMER' },
  { id: 'ps', short: 'PS', subject: 'PS' },
  { id: 'hlas', short: 'HLAS', subject: 'HLAS' },
  { id: 'olano', short: 'OĽANO a priatelia', subject: 'OĽANO a priatelia' },
  { id: 'kdh', short: 'KDH', subject: 'KDH' },
  { id: 'sas', short: 'SaS', subject: 'SaS' },
  { id: 'sns', short: 'SNS', subject: 'SNS' },
  { id: 'rep', short: 'REPUBLIKA', subject: 'REPUBLIKA' },
  { id: 'aliancia', short: 'ALIANCIA', subject: 'ALIANCIA' },
  { id: 'rodina', short: 'SME RODINA', subject: 'SME RODINA' },
  { id: 'dem', short: 'DEMOKRATI', subject: 'DEMOKRATI' },
];

export type FinalPoll = {
  agency: string; client: string | null; start: string; end: string; sample: number; method: string;
  source: string; sourceName: string; values: Record<string, number>;
};

export const finalPolls2023: FinalPoll[] = [
  { agency: 'AKO', client: 'JOJ 24', start: '2023-09-20', end: '2023-09-26', sample: 1000, method: 'telefonicky',
    source: 'https://ako.sk/wp-content/uploads/2023/09/ag.AKO_VOLEBNE_PREF_SEPTEMBER_2023_DRUHE.pdf', sourceName: 'AKO · tlačová správa 27. 9. 2023',
    values: { ps: 18.0, smer: 17.7, hlas: 15.0, olano: 9.4, sas: 7.3, kdh: 6.1, sns: 6.0, rep: 5.4, rodina: 5.1, dem: 4.3, aliancia: 2.8 } },
  { agency: 'FOCUS', client: 'TV Markíza', start: '2023-09-22', end: '2023-09-26', sample: 1017, method: 'osobné rozhovory',
    source: 'https://www.focus-research.sk/wp-content/uploads/2023/09/Volebne-preferencie-politickych-stran_SEPTEMBER-II-2023.pdf', sourceName: 'FOCUS · tlačová správa 26. 9. 2023',
    values: { smer: 18.0, ps: 16.6, hlas: 13.7, olano: 8.2, rep: 7.7, kdh: 6.5, sns: 6.4, sas: 5.8, rodina: 4.1, dem: 4.0, aliancia: 3.5 } },
  { agency: 'IPSOS', client: 'Denník N', start: '2023-09-22', end: '2023-09-25', sample: 1000, method: 'online',
    source: 'https://www.ipsos.com/sites/default/files/ct/news/documents/2023-09/IPSOS%20-%20Tla%C4%8Dov%C3%A1%20spr%C3%A1va%20-%20Reprezentat%C3%ADvny%20prieskum%20politick%C3%BDch%20preferenci%C3%AD%2027.9.2023.pdf', sourceName: 'Ipsos · tlačová správa 27. 9. 2023',
    values: { smer: 20.6, ps: 19.8, hlas: 11.9, olano: 8.2, rep: 7.6, sas: 7.0, kdh: 5.9, sns: 5.7, rodina: 4.0, aliancia: 3.4, dem: 3.3 } },
  { agency: 'NMS', client: null, start: '2023-09-21', end: '2023-09-24', sample: 1411, method: 'online',
    source: 'https://nms.global/sk/predvolebny-prieskum-september-2023-2-kolo/', sourceName: 'NMS · Predvolebný prieskum, september 2023, 2. kolo',
    values: { ps: 19.7, smer: 19.4, hlas: 10.5, olano: 9.5, rep: 8.5, sas: 5.7, kdh: 5.4, sns: 5.4, rodina: 5.2, aliancia: 3.1, dem: 2.3 } },
  { agency: 'MEDIAN SK', client: 'RTVS', start: '2023-09-25', end: '2023-09-26', sample: 1004, method: 'kombinovaný zber',
    source: 'https://spravy.stvr.sk/2023/09/posledny-prieskum-pre-rtvs-tesny-suboj-o-prvenstvo-medzi-lidrami-je-len-minimalny-rozdiel/', sourceName: 'STVR (vtedy RTVS) · posledný prieskum pre RTVS',
    values: { smer: 19.8, ps: 19.3, hlas: 11.9, rep: 8.0, kdh: 7.7, sas: 7.4, olano: 6.2, sns: 4.8, rodina: 4.1, dem: 3.8, aliancia: 2.5 } },
  { agency: 'SANEP', client: 'TA3', start: '2023-09-17', end: '2023-09-25', sample: 1697, method: 'online',
    source: 'https://www.pravda.sk/spravy/parlamentne-volby-2023/clanok/682936-prieskum-sanep-pre-ta3-fico-si-drzi-odstup-ps-superi-s-hlasom-roj-stran-s-5-percentami-matovic-mimo', sourceName: 'Pravda · prieskum SANEP pre TA3',
    values: { smer: 22.6, ps: 16.1, hlas: 15.3, rep: 7.4, olano: 6.5, sns: 6.0, rodina: 5.5, sas: 5.4, kdh: 5.1, dem: 3.4, aliancia: 3.3 } },
];

const subjectOf = (p: AccuracyParty) => {
  const s = election2023.subjects.find(x => x.short === p.subject);
  if (!s) throw new Error(`Chýba výsledok 2023 pre ${p.subject}`);
  return s;
};
export const result2023Share = (id: string) => subjectOf(accuracyParties.find(p => p.id === id)!).pct;
const round1 = (v: number) => Math.round(v * 10) / 10;
const round2 = (v: number) => Math.round(v * 100) / 100;

export type AgencyAccuracy = {
  poll: FinalPoll;
  mae: number;                       // priemerná absolútna odchýlka, p. b.
  errors: { id: string; short: string; poll: number; result: number; error: number }[];
  biggest: { id: string; short: string; error: number };
  winnerRight: boolean;              // mal na prvom mieste víťaza volieb
  thresholdRight: number;            // koľkým stranám správne určil stranu hranice
};

export function agencyAccuracy(poll: FinalPoll): AgencyAccuracy {
  const errors = accuracyParties.map(p => {
    const s = subjectOf(p);
    return { id: p.id, short: p.short, poll: poll.values[p.id], result: s.pct, error: round2(poll.values[p.id] - s.pct) };
  });
  const mae = round2(errors.reduce((sum, e) => sum + Math.abs(e.error), 0) / errors.length);
  const biggest = [...errors].sort((a, b) => Math.abs(b.error) - Math.abs(a.error))[0];
  const winner = [...errors].sort((a, b) => b.result - a.result)[0].id;
  const pollLeader = [...errors].sort((a, b) => b.poll - a.poll)[0];
  const tied = errors.filter(e => e.poll === pollLeader.poll).length > 1;
  const thresholdRight = accuracyParties.filter(p => { const s = subjectOf(p); const limit = threshold(s.kind); return (poll.values[p.id] >= limit) === (s.pct >= limit); }).length;
  return { poll, mae, errors, biggest: { id: biggest.id, short: biggest.short, error: biggest.error }, winnerRight: !tied && pollLeader.id === winner, thresholdRight };
}

export const accuracyRanking = () => finalPolls2023.map(agencyAccuracy).sort((a, b) => a.mae - b.mae);

/** Priemerná odchýlka so znamienkom pre každú stranu naprieč agentúrami: kladná = prieskumy ju precenili. */
export const systematicErrors = () => accuracyParties.map(p => {
  const errs = finalPolls2023.map(poll => poll.values[p.id] - result2023Share(p.id));
  return { id: p.id, short: p.short, mean: round1(errs.reduce((a, b) => a + b, 0) / errs.length), sameSign: errs.every(e => e > 0) || errs.every(e => e < 0) };
}).sort((a, b) => a.mean - b.mean);
