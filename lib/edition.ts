import { aggregateAsPoll, aggregateLastDate, aggregateSeries, currentAggregate, type AggregatePoint } from "./aggregate.ts";
import { blocSeats, blocs, MAJORITY, optionalPartners } from "./blocs.ts";
import { scenarioFromPoll } from "./parliament.ts";
import { archive, parties } from "./polls.ts";

/*
  Titulná strana ako vydanie: hlavná správa je počítaná z Modelu Mandát (vážený priemer piatich
  agentúr) a z prepočtu kresiel podľa § 68 (scenár, nie predpoveď). Porovnávame s bodom agregátu
  spred približne 30 dní, aby čitateľ videl, čo sa za mesiac zmenilo. Bloky sú dnešná vládna
  koalícia a opozícia podľa lib/blocs.ts. Hlavné hodnotenie (rozhodnutie Petra 14. 9. 2026) ráta
  s voliteľnými partnermi: REPUBLIKA pri koalícii a Hnutie Slovensko pri opozícii, v texte
  „koalícia s Republikou“ a „opozícia s Matovičom“ (Igor Matovič vedie Hnutie Slovensko). Je to
  redakčný predpoklad, nie dohoda strán; dnešné bloky bez partnerov uvádzame vedľa.
*/
/** Slovné označenie blokov s partnermi v 7. páde; strany sa v skratke neskloňujú, preto ručne. */
export const partnerWording: Record<string, string> = { rep: "s Republikou", slovensko: "s Matovičom" };
export const withPartnerLabel = (bloc: "coalition" | "opposition") => {
  const ids = optionalPartners.filter(m => m.bloc === bloc).map(m => m.id);
  const words = ids.map(id => partnerWording[id] ?? `s ${parties.find(p => p.id === id)?.short ?? id}`);
  return `${bloc === "coalition" ? "Koalícia" : "Opozícia"} ${words.join(" a ")}`;
};
const dayMs = 86_400_000;
const at = (d: string) => Date.parse(`${d}T12:00:00Z`);
export const EDITION_LOOKBACK_DAYS = 30;

const closestPoint = (targetDate: string) => aggregateSeries.reduce((best, p) => Math.abs(at(p.date) - at(targetDate)) < Math.abs(at(best.date) - at(targetDate)) ? p : best, aggregateSeries[0]);

const seatsFor = (point: AggregatePoint) => {
  const scenario = scenarioFromPoll(aggregateAsPoll(point));
  const entries = scenario.rows.map(r => ({ id: r.id, short: r.short, color: r.color, seats: r.seats }));
  return { scenario, blocs: blocSeats(entries), withPartners: blocSeats(entries, optionalPartners.map(m => m.id)) };
};

export type EditionMover = { id: string; short: string; value: number; delta: number };
export type EditionCrossing = { id: string; short: string; value: number; direction: "up" | "down"; seatsBefore: number; seatsNow: number };

const monthAgoDate = new Date(at(aggregateLastDate) - EDITION_LOOKBACK_DAYS * dayMs).toISOString().slice(0, 10);
const before = closestPoint(monthAgoDate);
const now = seatsFor(currentAggregate);
const past = seatsFor(before);

const movers: EditionMover[] = parties
  .filter(p => currentAggregate.values[p.id] && before.values[p.id] && currentAggregate.values[p.id].value >= 1)
  .map(p => ({ id: p.id, short: p.short, value: currentAggregate.values[p.id].value, delta: Math.round((currentAggregate.values[p.id].value - before.values[p.id].value) * 10) / 10 }))
  .filter(m => m.delta !== 0)
  .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.short.localeCompare(b.short, "sk"));

const seatsOf = (rows: { id: string; seats: number }[], id: string) => rows.find(r => r.id === id)?.seats ?? 0;
const crossings: EditionCrossing[] = parties.flatMap(p => {
  const nowValue = currentAggregate.values[p.id]?.value;
  const beforeValue = before.values[p.id]?.value;
  if (nowValue === undefined || beforeValue === undefined) return [];
  const wasIn = beforeValue >= 5, isIn = nowValue >= 5;
  if (wasIn === isIn) return [];
  return [{ id: p.id, short: p.short, value: nowValue, direction: isIn ? "up" as const : "down" as const, seatsBefore: seatsOf(past.scenario.rows, p.id), seatsNow: seatsOf(now.scenario.rows, p.id) }];
});

const newPolls = archive.filter(p => p.end > before.date && p.end <= aggregateLastDate).sort((a, b) => b.end.localeCompare(a.end));

export const edition = {
  asOf: aggregateLastDate,
  monthAgo: before.date,
  month: aggregateAsPoll(currentAggregate).month,
  year: aggregateLastDate.slice(0, 4),
  agencies: [...new Set(currentAggregate.pollIds.map(id => archive.find(p => p.id === id)?.agency ?? ""))].filter(Boolean),
  majority: MAJORITY,
  coalitionLabel: blocs[0].members.filter(m => !m.optional).map(m => parties.find(p => p.id === m.id)?.short ?? m.id),
  oppositionLabel: blocs[1].members.filter(m => !m.optional).map(m => parties.find(p => p.id === m.id)?.short ?? m.id),
  now: { coalition: now.blocs.coalition.seats, opposition: now.blocs.opposition.seats, others: now.blocs.others.seats, othersMembers: now.blocs.others.members, rows: now.scenario.rows, below: now.scenario.belowThreshold },
  before: { coalition: past.blocs.coalition.seats, opposition: past.blocs.opposition.seats, others: past.blocs.others.seats, withCoalition: past.withPartners.coalition.seats, withOpposition: past.withPartners.opposition.seats },
  withPartners: { coalition: now.withPartners.coalition.seats, opposition: now.withPartners.opposition.seats, others: now.withPartners.others.seats, othersMembers: now.withPartners.others.members, coalitionLabel: withPartnerLabel("coalition"), oppositionLabel: withPartnerLabel("opposition"), coalitionPartners: optionalPartners.filter(m => m.bloc === "coalition").map(m => parties.find(p => p.id === m.id)?.short ?? m.id), oppositionPartners: optionalPartners.filter(m => m.bloc === "opposition").map(m => parties.find(p => p.id === m.id)?.short ?? m.id) },
  movers,
  crossings,
  newPolls: newPolls.map(p => ({ id: p.id, agency: p.agency, end: p.end })),
};

export type Edition = typeof edition;
export const signed = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : "±"}${Math.abs(n).toLocaleString("sk-SK", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
export const signedInt = (n: number) => n === 0 ? "bez zmeny" : `${n > 0 ? "+" : "−"}${Math.abs(n)}`;
