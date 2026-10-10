import { aggregateAt, aggregateAsPoll, aggregateLastDate, pollsForAggregate } from './aggregate.ts';
import { archive, parties, type Poll } from './polls.ts';
import { scenarioFromPoll } from './parliament.ts';

/** A controlled comparison at one date, NOT a reconstruction of a previously published model.
 * Removing the newest known publication lets the existing selector fall back to the preceding
 * poll of each affected agency, provided it still fits the unchanged 60-day window.
 * All current inputs published on the same newest day are removed together: no arbitrary tie winner.
 */
export function pollImpact(source: Poll[] = archive, asOf = aggregateLastDate) {
  const inputs = pollsForAggregate(asOf, source);
  const published = inputs.reduce((day, poll) => poll.published && poll.published > day ? poll.published : day, '');
  const added = inputs.filter(p => published && p.published === published);
  if (!added.length) return null;
  const excluded = new Set(added.map(p => p.id));
  const before = aggregateAt(asOf, source.filter(p => !excluded.has(p.id)));
  const after = aggregateAt(asOf, source);
  const previousInputs = pollsForAggregate(asOf, source.filter(p => !excluded.has(p.id)));
  const beforeSeats = scenarioFromPoll(aggregateAsPoll(before));
  const afterSeats = scenarioFromPoll(aggregateAsPoll(after));
  const seats = (rows: {id:string;seats:number}[], id:string) => rows.find(r => r.id === id)?.seats ?? 0;
  const rows = parties.filter(p => before.values[p.id] || after.values[p.id]).map(p => {
    const from = before.values[p.id]?.value ?? null, to = after.values[p.id]?.value ?? null;
    const seatsBefore = seats(beforeSeats.rows, p.id), seatsAfter = seats(afterSeats.rows, p.id);
    return { ...p, from, to, delta: from === null || to === null ? null : Math.round((to - from) * 10) / 10,
      seatsBefore, seatsAfter, seatDelta: seatsAfter - seatsBefore };
  }).sort((a,b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0) || (b.to ?? 0) - (a.to ?? 0) || a.id.localeCompare(b.id));
  return { asOf, published, added, previousInputs, before, after, beforeSeats, afterSeats, rows };
}

/** Same inputs as the model; missing values stay missing. Dots are raw observations, not CIs. */
export function agencyComparison(partyId: string, source: Poll[] = archive, asOf = aggregateLastDate) {
  const model = aggregateAt(asOf, source).values[partyId] ?? null;
  const readings = pollsForAggregate(asOf, source).map(poll => ({ poll, value: poll.values[partyId] ?? null }));
  const values = readings.flatMap(r => r.value === null ? [] : [r.value]);
  if (model) values.push(model.value);
  if (!values.length) return { model, readings, min:0, max:5 };
  const min = Math.max(0, Math.floor(Math.min(...values)) - 1);
  const max = Math.max(min + 3, Math.ceil(Math.max(...values)) + 1);
  return { model, readings, min, max };
}
