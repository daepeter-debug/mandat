import { skDay, type VoteSummary } from './votes.ts';

/** Exact facts: the animation moves text and never changes counts. */
export function displayFacts(vote: VoteSummary | null, caption: string) {
  if (!vote) return [{ text: caption, color: '#ead7b5' }];
  return [
    { text: `${skDay(vote.datum)} · ${vote.cas} · ${vote.nazov}`, color: '#ead7b5' },
  ];
}
/** Positive phase is left→right, cyclic and deterministic. */
export function displayPhase(elapsed: number, width: number) {
  return width > 0 ? (Math.max(0, elapsed) * .035) % width : 0;
}
