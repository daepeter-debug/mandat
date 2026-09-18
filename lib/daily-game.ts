/** Fiktívny hlavolam. Dáta ani vzťahy strán nesúvisia s volebným modelom. */
export const gameParties = [
  { name: "Kotva", symbol: "anchor", color: "#496bd1", topic: "školstvo" },
  { name: "Lipa", symbol: "leaf", color: "#32775d", topic: "zdravotníctvo" },
  { name: "Iskra", symbol: "spark", color: "#b55735", topic: "školstvo" },
  { name: "Obzor", symbol: "sun", color: "#956718", topic: "zdravotníctvo" },
  { name: "Prúd", symbol: "waves", color: "#397c8e", topic: "doprava" },
  { name: "Bod", symbol: "circle", color: "#8755a1", topic: "bývanie" },
] as const;
export type Puzzle = { id: string; seats: number[]; incompatible: [number, number]; target: number; solutions: number[][] };
export type GameSave = { selected: number[]; attempts: number; hints: number; solved: boolean };
export function slovakDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bratislava", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function previousDay(day: string, offset = 1) {
  return new Date(Date.parse(`${day}T12:00:00Z`) - offset * 86400000).toISOString().slice(0, 10);
}
export function evaluate(puzzle: Puzzle, selected: number[]) {
  const ids = [...new Set(selected)].filter(i => Number.isInteger(i) && i >= 0 && i < 6);
  const seats = ids.reduce((sum, i) => sum + puzzle.seats[i], 0);
  const size = ids.length > 0 && ids.length <= 3;
  const compatible = !puzzle.incompatible.every(i => ids.includes(i));
  const topics = ["školstvo", "zdravotníctvo"].every(topic => ids.some(i => gameParties[i].topic === topic));
  return { seats, size, compatible, topics, majority: seats >= 76, optimal: seats === puzzle.target, won: size && compatible && topics && seats === puzzle.target };
}
export function createPuzzle(id: string): Puzzle {
  let seed = 2166136261;
  for (const char of `mandat-v1:${id}`) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };
  for (let trial = 0; trial < 2000; trial++) {
    const weights = Array.from({ length: 6 }, () => 10 + Math.floor(random() * 30));
    const sum = weights.reduce((a, b) => a + b, 0);
    const seats = weights.map(w => Math.floor(w / sum * 150));
    for (let i = seats.reduce((a, b) => a + b, 0); i < 150; i++) seats[i % 6]++;
    const a = Math.floor(random() * 6), b = (a + 1 + Math.floor(random() * 5)) % 6;
    const puzzle: Puzzle = { id, seats, incompatible: [a, b], target: 76, solutions: [] };
    const viable: number[][] = [];
    for (let mask = 1; mask < 64; mask++) {
      const ids = gameParties.map((_, i) => i).filter(i => mask & (1 << i));
      const result = evaluate(puzzle, ids);
      if (result.majority && result.size && result.compatible && result.topics) viable.push(ids);
    }
    if (!viable.length) continue;
    puzzle.target = Math.min(...viable.map(ids => evaluate(puzzle, ids).seats));
    puzzle.solutions = viable.filter(ids => evaluate(puzzle, ids).seats === puzzle.target);
    if (puzzle.solutions.length === 1 && puzzle.solutions[0].length === 3 && puzzle.target <= 87) return puzzle;
  }
  return { ...fallbackPuzzle, id };
}
// Záložný hlavolam pri nečakanom vyčerpaní generátora; jeho riešiteľnosť stráži verify-data.
export const fallbackPuzzle: Puzzle = { id: "fallback", seats: [40, 28, 26, 22, 19, 15], incompatible: [0, 1], target: 76, solutions: [[1, 2, 3]] };
export function readSave(value: unknown, puzzle: Puzzle): GameSave {
  const empty = { selected: [], attempts: 0, hints: 0, solved: false };
  if (!value || typeof value !== "object") return empty;
  const s = value as Partial<GameSave>;
  const selected = Array.isArray(s.selected) ? [...new Set(s.selected)].filter(i => Number.isInteger(i) && i >= 0 && i < 6) : [];
  const count = (n: unknown) => typeof n === "number" && Number.isSafeInteger(n) && n >= 0 ? Math.min(n, 100000) : 0;
  return { selected, attempts: count(s.attempts), hints: Math.min(count(s.hints), 3), solved: s.solved === true && evaluate(puzzle, selected).won };
}
