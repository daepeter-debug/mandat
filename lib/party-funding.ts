import { election2023, type Subject2023 } from './parliament.ts';

/*
  Peniaze od štátu pre strany za volebné obdobie 2023–2027 podľa zákona č. 85/2005 Z. z. (§ 25–28):
  – príspevok za hlasy: strane s viac ako 3 % platných hlasov patrí za každý hlas 1 % priemernej
    mesačnej nominálnej mzdy za rok pred voľbami (jednorazovo);
  – príspevok na činnosť: rovnaká suma ako za hlasy, vyplácaná v 48 mesačných podieloch počas obdobia;
  – príspevok na mandát: ročne 30-násobok priemernej mzdy za každý z prvých 20 mandátov
    a 20-násobok za každý ďalší, od mesiaca volieb do mesiaca pred ďalšími voľbami.
  Počítame nárok zo zákona z oficiálnych výsledkov 2023; skutočne vyplatené sumy môžu byť nižšie
  (strana musí odovzdať výročnú správu, koalícia musí predložiť dohodu o delení).
*/

export const fundingLaw = { name: 'Zákon č. 85/2005 Z. z. o politických stranách, § 25–28', url: 'https://www.zakonypreludi.sk/zz/2005-85' };
// Priemerná mesačná nominálna mzda zamestnanca v hospodárstve SR za rok 2022 (ŠÚ SR); zákon berie rok pred voľbami.
export const averageWage = { year: 2022, eur: 1304, source: 'https://slovak.statistics.sk/', sourceName: 'Štatistický úrad SR' };
export const fundingThresholdPct = 3;
export const termMonths = 48;   // § 27 ods. 2: 48 podielov; pri štvorročnom cykle aj mandát ≈ 48 mesiacov
export const fundingChecked = '2026-09-18';

// Volebné koalície 2023 a strany, ktoré ich tvorili (príspevok patrí koalícii, delenie určuje dohoda strán).
export const coalitionMembers: Record<number, { partyIds: string[]; label: string }> = {
  5: { partyIds: ['slovensko', 'ku', 'zaludi'], label: 'OĽANO a priatelia, Kresťanská únia a ZA ĽUDÍ' },
};

export type SubjectFunding = {
  subject: Subject2023;
  eligible: boolean;       // viac ako 3 % platných hlasov
  perVote: number;         // € za jeden hlas
  forVotes: number;        // príspevok za hlasy, jednorazovo
  forActivity: number;     // príspevok na činnosť za celé obdobie (48 podielov)
  mandatePerYear: number;  // príspevok na mandát za rok
  mandateTerm: number;     // príspevok na mandát za obdobie (48 mesiacov)
  total: number;           // spolu za volebné obdobie
};

export function fundingForSubject(subject: Subject2023): SubjectFunding {
  const W = averageWage.eur;
  const eligible = subject.pct > fundingThresholdPct;
  const perVote = W / 100;
  const forVotes = eligible ? Math.round(subject.votes * perVote) : 0;
  const mandatePerYear = Math.min(subject.seats, 20) * 30 * W + Math.max(subject.seats - 20, 0) * 20 * W;
  const mandateTerm = mandatePerYear * (termMonths / 12);
  return { subject, eligible, perVote, forVotes, forActivity: forVotes, mandatePerYear, mandateTerm, total: forVotes * 2 + mandateTerm };
}
export const subjectFunding = election2023.subjects.map(fundingForSubject);
export const eligibleFunding = subjectFunding.filter(f => f.eligible).sort((a, b) => b.total - a.total);
export const fundingTotal = eligibleFunding.reduce((a, f) => a + f.total, 0);

export type PartyFundingView =
  | { kind: 'party'; funding: SubjectFunding }
  | { kind: 'coalition'; funding: SubjectFunding; label: string; partyIds: string[] }
  | { kind: 'below'; funding: SubjectFunding }
  | { kind: 'absent' };

// Pohľad pre profil strany: vlastný nárok, nárok koalície, pod hranicou alebo strana v roku 2023 nekandidovala.
export function fundingForParty(partyId: string): PartyFundingView {
  const own = subjectFunding.find(f => f.subject.partyId === partyId);
  if (own) return own.eligible ? { kind: 'party', funding: own } : { kind: 'below', funding: own };
  const coalitionNumber = Number(Object.keys(coalitionMembers).find(n => coalitionMembers[Number(n)].partyIds.includes(partyId)));
  if (coalitionNumber) {
    const funding = subjectFunding.find(f => f.subject.number === coalitionNumber);
    if (funding) return { kind: 'coalition', funding, label: coalitionMembers[coalitionNumber].label, partyIds: coalitionMembers[coalitionNumber].partyIds };
  }
  return { kind: 'absent' };
}
