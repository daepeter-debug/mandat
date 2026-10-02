// Tridsiatka online: skúška API /api/kviz proti LOKÁLNEMU serveru (wrangler dev s Durable Object), nie proti webu.
// Použitie: npm run build, potom wrangler dev --config wrangler.preview.jsonc --local --port 8787
// a node scripts/smoke-quiz-api.mjs http://127.0.0.1:8787  (zapisuje skúšobné kolá do lokálneho úložiska .wrangler/state).
import assert from "node:assert/strict";
import { buildRound, daySeed, present, slovakDay } from "../lib/quiz.ts";
import { newToken } from "../lib/quiz-online.ts";

const base = new URL(process.argv[2] ?? "http://127.0.0.1:8787");
if (!["127.0.0.1", "localhost", "[::1]"].includes(base.hostname)) throw new Error("Len lokálny server: skúšobné kolá by inak zostali v ostrom rebríčku.");
const api = `${base.origin}/api/kviz`;
const get = async query => { const r = await fetch(`${api}${query}`); return { status: r.status, body: await r.json() }; };
const post = async (body, headers = {}) => { const r = await fetch(api, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) }); return { status: r.status, body: await r.json() }; };

const day = slovakDay(), items = buildRound(daySeed(day)), right = items.map(x => present(x).correct), wrong = right.map(a => (a + 1) % 4);
// Verejné čítanie si Worker 5 s pamätá; jedinečný parameter ide vždy do úložiska.
const before = (await get(`?den=${day}&t=${Date.now()}`)).body.board.players;
const a = newToken(), b = newToken();
let r = await post({ a: "hra", mode: "daily", day, token: a, items, answers: right });
assert.equal(r.status, 200, JSON.stringify(r.body)); assert.equal(r.body.points, 73); assert.equal(r.body.board.players, before + 1);
r = await post({ a: "hra", mode: "daily", day, token: b, items, answers: right.map((x, i) => i < 15 ? x : wrong[i]) });
assert.equal(r.body.board.players, before + 2); assert(r.body.board.me.rank >= 2, "Menej bodov = horšie miesto");
r = await post({ a: "prezyvka", token: a, day, nick: "Skúška" });
assert.equal(r.status, 200); assert(r.body.board.top.some(e => e.nick === "Skúška" && e.me), "Prezývka v rebríčku");
assert.equal((await post({ a: "prezyvka", token: a, day, nick: "Fico" })).status, 422, "Meno politika neprejde");
r = await post({ a: "vyzva", token: b, nick: "Kamarát", mode: "daily", day, items, answers: right.map((x, i) => i < 15 ? x : wrong[i]) });
assert.equal(r.status, 200, JSON.stringify(r.body)); const code = r.body.code;
r = await get(`?vyzva=${code}`);
assert.equal(r.body.challenge.players.length, 1); assert.equal(r.body.challenge.items.length, 30);
r = await post({ a: "pridat", code, token: a, nick: "Skúška" });
assert.deepEqual(r.body.challenge.players.map(p => p.nick), ["Skúška", "Kamarát"], "Výsledky výzvy vedľa seba");
const free = newToken();
r = await post({ a: "hra", mode: "challenge", day, token: free, items: r.body.challenge.items, answers: right, vyzva: code });
assert.equal(r.status, 200); assert(r.body.challenge && r.body.items, "Výzva: porovnanie a úspešnosť otázok");
r = await get(`?otazky=${items.slice(0, 3).map(x => x.id).join(",")}`);
assert(Object.values(r.body.items).every(([shown]) => shown >= 2), "Súhrnná úspešnosť otázok");
assert.equal((await post({ a: "hra", mode: "daily", day, token: newToken(), items, answers: right }, { Origin: "https://example.com" })).status, 403, "Cudzí web nemôže zapisovať");
assert.equal((await fetch(api, { method: "POST", body: "{" })).status, 400);
console.log(`PASS quiz api ${base.origin}: rebríček (hráčov dnes: ${before + 2}), prezývka, výzva ${code}, úspešnosť otázok, ochrana pred cudzím webom`);
