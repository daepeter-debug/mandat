import { aggregateLastDate, aggregateSeries, currentAggregate } from "./aggregate.ts";

const target = Date.parse(`${aggregateLastDate}T12:00:00Z`) - 30 * 86_400_000;
const previous = aggregateSeries.reduce((best, p) => Math.abs(Date.parse(`${p.date}T12:00:00Z`) - target) < Math.abs(Date.parse(`${best.date}T12:00:00Z`) - target) ? p : best, aggregateSeries[0]);
/** Same nearest weekly point and 30-day horizon as the edition. Missing data stays missing. */
export function partyDelta(id: string): number | null {
  const now = currentAggregate.values[id], before = previous?.values[id];
  return now && before ? Math.round((now.value - before.value) * 10) / 10 : null;
}
export function termProgress(day: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const start = Date.parse("2023-09-30T12:00:00Z"), end = Date.parse("2027-09-30T12:00:00Z");
  const time = Date.parse(`${day}T12:00:00Z`);
  if (!Number.isFinite(time)) return null;
  const clampedRatio = Math.min(1, Math.max(0, (time - start) / (end - start)));
  return Math.round(clampedRatio * 100);
}
