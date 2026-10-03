import { required, skDay, type VoteSummary } from './votes.ts';

/** Exact facts: the animation moves text and never changes counts. */
export function displayFacts(vote: VoteSummary | null, caption: string) {
  if (!vote) return [{ text: caption, color: '#ead7b5' }, { text: '150 kresiel · ilustračná sála', color: '#d0dbd5' }];
  return [
    { text: `Za ${vote.za}`, color: '#8fe3aa' },
    { text: `Proti ${vote.proti}`, color: '#ff9d96' },
    { text: `Zdržali sa ${vote.zdrzalo}`, color: '#f8d47c' },
    { text: `Nehlasovali ${vote.nehlasovalo}`, color: '#d4deea' },
    { text: `Neprítomní ${vote.nepritomni}`, color: '#c5cbc8' },
    { text: `${vote.preslo ? 'Prešiel' : 'Neprešiel'} · potrebných ${required(vote).votes}`, color: '#f5eee0' },
    { text: `${skDay(vote.datum)} · ${vote.cas} · ${vote.nazov}`, color: '#ead7b5' },
  ];
}
/** Positive phase is left→right, cyclic and deterministic. */
export function displayPhase(elapsed: number, width: number) {
  return width > 0 ? (Math.max(0, elapsed) * .035) % width : 0;
}
