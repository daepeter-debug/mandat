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

/** A bounded sweep through physical seats; it never changes the allocation itself. */
export const SEAT_SWEEP_MS = 1050;
export function seatSweep(index: number, elapsed: number) {
  const t = Math.max(0, Math.min(1, (elapsed - index / 149 * 650) / 400));
  return 1 - (1 - t) ** 3;
}

export function seatChanges(from: ParliamentVariant, to: ParliamentVariant) {
  const ids = [...new Set([...from.ordered, ...to.ordered].map(p => p.id))];
  return ids.map(id => {
    const old = from.ordered.find(p => p.id === id), next = to.ordered.find(p => p.id === id);
    return { id, short: (next ?? old)!.short, color: (next ?? old)!.color, delta: (next?.seats ?? 0) - (old?.seats ?? 0) };
  }).filter(p => p.delta !== 0).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.id.localeCompare(b.id));
}

/** Eye height over an actual central seat, looking toward the lectern. Metres throughout. */
export function deputyView() {
  const seat = [...chamberSeats.filter(s => s.row === 3 && s.sector === 2)].sort((a, b) => Math.abs(a.x) - Math.abs(b.x))[0];
  const target = [0, .035, .036] as const;
  const eye = [seat.x, seat.y + .032, seat.z] as const;
  const [x, y, z] = eye.map((v, i) => v - target[i]), radius = Math.hypot(x, y, z);
  return { eye, target, orbit: `${Math.atan2(x, z) * 180 / Math.PI}deg ${Math.acos(y / radius) * 180 / Math.PI}deg ${radius}m` };
}
