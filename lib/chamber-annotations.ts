import { chamberSeats } from './parliament-model.ts';

// Coordinates share the original 2D viewBox and the same 150 seats as the 3D hall.
export function chamberSeatAnchor(index: number) {
  const seat = chamberSeats[index];
  return seat ? { x: (seat.x * 1000 + 322) / 644 * 100, y: (seat.z * 1000 + 322) / 372 * 100 } : null;
}

export function chamberClubAnnotations<T extends { id: string }>(clubs: readonly T[], seatParty: readonly string[]) {
  return clubs.flatMap(club => {
    const seats = chamberSeats.filter(s => seatParty[s.index] === club.id);
    if (!seats.length) return [];
    const angle = seats.reduce((sum, s) => sum + s.angle, 0) / seats.length;
    const first = Math.max(...seats.map(s => s.angle)), last = Math.min(...seats.map(s => s.angle));
    const point = (r: number, a: number) => [Math.cos(a) * r, -Math.sin(a) * r];
    const [x, y] = point(350, angle), a = point(323, first), b = point(323, last);
    const lineStart = point(326, angle), lineEnd = point(335, angle);
    return [{ ...club, count: seats.length, x: (x + 322) / 644 * 100, y: (y + 322) / 372 * 100,
      arc: `M ${a[0]} ${a[1]} A 323 323 0 0 1 ${b[0]} ${b[1]}`,
      line: `M ${lineStart[0]} ${lineStart[1]} L ${lineEnd[0]} ${lineEnd[1]}` }];
  });
}
