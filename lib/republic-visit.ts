import { branches, catalog, createTown, fixed, readSave, steps, type DecorationId, type ItemId, type Placed, type RepublicState } from "./republic.ts";

// Wire v1: header (version, chapter/branch, UTF-8 length), 36 cells, name, FNV-1a checksum.
// Stable codes: never reorder these when adding catalogue items; introduce a new wire version instead.
const ids: ItemId[] = ["school", "library", "clinic", "park", "market", "workshop", "garden", "culture", "town-hall", "plaza", "station", "bench", "flower-bed", "linden", "fountain", "book-kiosk", "pergola", "clock", "bandstand", "sculpture", "observatory", "glasshouse", "ceremonial-gate"];
export const VISIT_MAX_CODE = 218;
export const VISIT_BASE = "https://mandat-preview.mandat.workers.dev/";
export function houseVariant(id: string) {
  let hash = 7;
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return hash % 3;
}
const checksum = (bytes: Uint8Array) => bytes.reduce((h, b) => Math.imul(h ^ b, 16777619) >>> 0, 2166136261);
const base64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
export function encodeVisit(town: RepublicState): string {
  if (!readSave(town)) throw new Error("Štvrť sa nedá zdieľať.");
  const name = new TextEncoder().encode(town.name), body = new Uint8Array(39 + name.length);
  body.set([1, (town.completed.length << 2) | (town.branch ? branches.indexOf(town.branch) + 1 : 0), name.length]);
  for (const p of town.roads) body[3 + p.y * 6 + p.x] = 1;
  for (const p of town.placed) body[3 + p.y * 6 + p.x] = p.id === "house" ? 2 + houseVariant(p.instanceId) : 5 + ids.indexOf(p.id);
  body.set(name, 39);
  const bytes = new Uint8Array(body.length + 4); bytes.set(body);
  new DataView(bytes.buffer).setUint32(body.length, checksum(body), true);
  const code = base64url(bytes);
  if (code.length > VISIT_MAX_CODE) throw new Error("Názov štvrte je príliš dlhý.");
  return code;
}
export function decodeVisit(code: string): RepublicState | null {
  try {
    if (typeof code !== "string" || code.length < 58 || code.length > VISIT_MAX_CODE || !/^[A-Za-z0-9_-]+$/.test(code)) return null;
    const bytes = Uint8Array.from(atob(code.replaceAll("-", "+").replaceAll("_", "/")), c => c.charCodeAt(0));
    if (base64url(bytes) !== code || bytes[0] !== 1 || bytes.length !== 43 + bytes[2]) return null;
    const body = bytes.subarray(0, -4), digest = new DataView(bytes.buffer).getUint32(body.length, true);
    if (checksum(body) !== digest) return null;
    const chapter = bytes[1] >> 2, branchCode = bytes[1] & 3;
    if (chapter > steps.length || bytes[2] > 120) return null;
    const name = new TextDecoder("utf-8", { fatal: true }).decode(body.subarray(39));
    if (!name.length || name.length > 40 || name !== name.trim()) return null;
    const town = createTown("2026-10-01", digest);
    town.name = name; town.completed = steps.slice(0, chapter).map(s => s.id);
    town.branch = branchCode ? branches[branchCode - 1] : null;
    town.placed = []; town.roads = []; town.unlocked = [];
    for (let i = 0; i < 36; i++) {
      const cell = body[3 + i], p = { x: i % 6, y: Math.floor(i / 6) };
      if (!cell) continue;
      if (cell === 1) { town.roads.push(p); continue; }
      const id = cell < 5 ? "house" : ids[cell - 5];
      if (!id) return null;
      const anchor = fixed.find(f => f.x === p.x && f.y === p.y);
      let instanceId = `visit-${i}`;
      if (id === "house") {
        let suffix = 0;
        while (houseVariant(`${instanceId}-${suffix}`) !== cell - 2) suffix++;
        instanceId += `-${suffix}`;
      }
      const placed: Placed = { id, ...p, instanceId };
      if (anchor && anchor.id === id) Object.assign(placed, { instanceId: anchor.instanceId, fixed: true });
      town.placed.push(placed);
      if (catalog[id].kind === "decoration" && !town.unlocked.includes(id as DecorationId)) town.unlocked.push(id as DecorationId);
    }
    // The same validator as real saves is the final gate, including fixed plots and locked culture.
    // This snapshot is display-only: no inventory, balances, rewards, elections or festival history travel.
    return readSave(town);
  } catch { return null; }
}
export function visitUrl(town: RepublicState) {
  const url = `${VISIT_BASE}?v=game&g=republic&navsteva=${encodeVisit(town)}`;
  if (url.length >= 300) throw new Error("Odkaz je príliš dlhý.");
  return url;
}
