import { aggregateAsPoll, aggregateLastDate } from "./aggregate.ts";
import { blocSeats } from "./blocs.ts";
import { scenarioFromPoll } from "./parliament.ts";

/*
  Kreslá pre 3D model snemovne (public/models/parlament.glb, scripts/build-parliament-glb.mjs) a jeho legendu
  (components/parliament-ar.tsx): scenár Modelu Mandát, poradie ako v polkruhu na webe — koalícia vľavo,
  ostatní v strede, opozícia vpravo (dnešné bloky). Model sa musí pregenerovať po každej zmene dát
  (verify-data.mjs porovná kreslá zapísané v súbore s týmto scenárom).
*/
export const PARLIAMENT_MODEL = "/models/parlament.glb";

export function parliamentSeats() {
  const scenario = scenarioFromPoll(aggregateAsPoll());
  const entries = scenario.rows.map(r => ({ id: r.id, short: r.short, color: r.color, seats: r.seats }));
  const summary = blocSeats(entries);
  const ordered = [...summary.coalition.members, ...summary.others.members, ...summary.opposition.members];
  return { asOf: aggregateLastDate, ordered, seats: Object.fromEntries(ordered.map(m => [m.id, m.seats])) as Record<string, number> };
}
