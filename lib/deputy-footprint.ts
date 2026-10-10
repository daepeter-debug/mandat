import { differsAt, type DeputiesData, type DeputyRow } from './deputies.ts';
import { marks, type Mark, type VoteSummary } from './votes.ts';

export type FootprintVote = { id: number; j: number; mark: Mark; differs: boolean; vote: VoteSummary };
export const footprintPageSize = 42;

/** Only join by official vote ID; non-membership is not an absence. Oldest first. */
export function deputyFootprint(data: DeputiesData, row: DeputyRow, byId: ReadonlyMap<number, VoteSummary>): FootprintVote[] {
  return data.hlasovania.flatMap((id, j) => {
    const vote = byId.get(id), mark = row.h[j] as Mark;
    return vote && marks.includes(mark) ? [{ id, j, mark, differs: differsAt(data, row, j), vote }] : [];
  }).sort((a, b) => a.vote.datum.localeCompare(b.vote.datum) || a.vote.cas.localeCompare(b.vote.cas) || a.id - b.id);
}

/** Page zero is the most recent window, displayed chronologically within each window. */
export function footprintWindow(items: readonly FootprintVote[], year: string, requestedPage: number) {
  const votes = items.filter(i => i.vote.datum.slice(0, 4) === year);
  const pages = Math.max(1, Math.ceil(votes.length / footprintPageSize));
  const page = Math.max(0, Math.min(pages - 1, Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 0));
  const end = Math.max(0, votes.length - page * footprintPageSize), start = Math.max(0, end - footprintPageSize);
  return { items: votes.slice(start, end), total: votes.length, page, pages };
}
