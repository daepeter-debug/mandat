import { chamberSeats, type ParliamentVariant } from './parliament-model.ts';

/** User-selected combination, never a prediction or political recommendation. */
export function coalitionSelection(variant: ParliamentVariant, ids: readonly string[]) {
  const chosen = new Set(ids);
  const members = variant.ordered.filter(p => chosen.has(p.id));
  const seats = members.reduce((sum, p) => sum + p.seats, 0);
  return { members, seats, missing: Math.max(0, 76 - seats), majority: seats >= 76 };
}

/** Aim at real seats, rather than at a label floating above the rear wall. */
export function partyFocus(variant: ParliamentVariant, id: string) {
  const seats = chamberSeats.filter(s => variant.seatParty[s.index] === id);
  if (!seats.length) return null;
  const angle = seats.reduce((sum, seat) => sum + seat.angle, 0) / seats.length;
  return {
    theta: (Math.PI / 2 - angle) * 180 / Math.PI * .55,
    target: [seats.reduce((sum, s) => sum + s.x, 0) / seats.length,
      seats.reduce((sum, s) => sum + s.y, 0) / seats.length + .014,
      seats.reduce((sum, s) => sum + s.z, 0) / seats.length] as const,
  };
}
