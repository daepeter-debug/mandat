// Tridsiatka: kontrola banky otázok (tvar, duplicity, krížová kontrola s dátami webu), logiky kola a online časti
// (prezývky, overenie kola serverom, rebríček a výzvy v úložisku lib/quiz-store.ts nad node:sqlite).
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { questions, topicNames } from "../lib/quiz-bank.ts";
import { MAX_POINTS, PLAN, ROUND_SIZE, buildRound, daySeed, halve, levels, parseProgress, parseResults, parseSeen, present, ranking, scoreRound, shareText, streak, swapItem, titleFor } from "../lib/quiz.ts";
import { bands, cleanNick, hitText, isCode, isToken, newCode, newToken, parseOnline, standing, verifyRound, zo } from "../lib/quiz-online.ts";
import { QuizStore } from "../lib/quiz-store.ts";
import { parties } from "../lib/polls.ts";
import { cabinets } from "../lib/cabinets.ts";
import { election2023 } from "../lib/parliament.ts";
import { publicFinance } from "../lib/public-finance.data.ts";

// ── Banka ──────────────────────────────────────────────────────────────────────────────────────────
assert(questions.length >= 280, `Aspoň 280 otázok (je ${questions.length})`);
const ids = new Set();
for (const q of questions) {
  assert(/^[a-z0-9-]+$/.test(q.id) && !ids.has(q.id), `Jedinečné id: ${q.id}`); ids.add(q.id);
  const options = [q.a, ...q.wrong];
  assert(options.every(o => typeof o === "string" && o.trim() && o.length <= 80), `Možnosti 1–80 znakov: ${q.id}`);
  assert.equal(new Set(options.map(o => o.toLocaleLowerCase("sk"))).size, 4, `Štyri rôzne možnosti: ${q.id}`);
  assert(q.q.length >= 15 && q.q.length <= 170 && q.q.endsWith("?"), `Otázka 15–170 znakov s otáznikom: ${q.id}`);
  assert(q.explain.length >= 20 && q.explain.length <= 280, `Vysvetlenie 20–280 znakov: ${q.id}`);
  assert(/^https:\/\/[^\s]+$/.test(q.source), `Zdroj ako https odkaz: ${q.id}`);
  assert(topicNames[q.topic] && levels.includes(q.level), `Téma a úroveň: ${q.id}`);
}
for (const l of levels) assert(questions.filter(q => q.level === l).length >= PLAN[l] * 4, `Úroveň ${l}: aspoň štyri kolá bez opakovania`);
for (const t of Object.keys(topicNames)) assert(questions.some(q => q.topic === t), `Téma ${t} má otázky`);

// ── Krížová kontrola s dátami webu ────────────────────────────────────────────────────────────────
const byId = id => { const q = questions.find(x => x.id === id); assert(q, `Otázka ${id} existuje`); return q; };
const pmAt = date => cabinets.find(c => c.start <= date && (c.end === null || date < c.end)).pm;
for (const year of [1996, 2000, 2008, 2014, 2019, 2022, 2025]) { const q = questions.find(x => x.id === `premier-${year}`); if (q) assert.equal(q.a, pmAt(`${year}-07-01`), `Premiér v roku ${year} podľa lib/cabinets.ts`); }
assert.equal(byId("najkratsia").a.includes("Ódora"), true);
const shortest = cabinets.filter(c => c.end).map(c => ({ id: c.id, days: (Date.parse(c.end) - Date.parse(c.start)) / 864e5 })).sort((a, b) => a.days - b.days)[0];
assert.equal(shortest.id, "odor", "Najkratšia vláda podľa dát je Ódorova");
const seats = Object.fromEntries(election2023.subjects.map(s => [s.short, s]));
const check2023 = (id, value) => { const q = questions.find(x => x.id === id); if (q) assert(q.a.includes(String(value)), `${id}: ${q.a} ≠ ${value}`); };
check2023("mandaty-smer-2023", seats.SMER.seats); check2023("mandaty-ps-2023", seats.PS.seats); check2023("mandaty-hlas-2023", seats.HLAS.seats);
check2023("koalicia-2023-mandaty", seats.SMER.seats + seats.HLAS.seats + seats.SNS.seats);
check2023("strany-2023", election2023.subjects.filter(s => s.seats > 0).length);
check2023("pct-smer-2023", String(seats.SMER.pct).replace(".", ","));
check2023("najmenej-2023", Math.min(...election2023.subjects.filter(s => s.seats > 0).map(s => s.seats)));
assert(byId("republika-2023").q.includes(String(seats.REPUBLIKA.pct).replace(".", ",")), "Republika 2023: percentá v otázke");
const years = publicFinance.years, value = (y, k) => years.find(r => r.year === y)[k];
const top = (k, from, dir = 1) => years.filter(r => r.year >= from && r[k] !== undefined && r[k] !== null).sort((a, b) => dir * (b[k] - a[k]))[0];
// Odpoveď je rok (čísla v možnostiach by prezradili odpoveď), hodnota z dát webu musí byť vo vysvetlení.
const checkFin = (id, row, k) => { const q = questions.find(x => x.id === id); if (q) assert(q.a === String(row.year) && q.explain.includes(String(row[k]).replace(".", ",").replace("-", "")), `${id}: ${q.a} / ${q.explain} vs ${row.year} ${row[k]}`); };
checkFin("nezamestnanost-max", top("unemployment", 1995), "unemployment");
checkFin("dlh-min", top("debtPct", 1999, -1), "debtPct");
checkFin("deficit-2000", top("deficitPct", 1995, -1), "deficitPct");
checkFin("inflacia-2022", top("inflation", 2001), "inflation");
assert(byId("dlh-2025").explain.includes(String(value(2025, "debtPct")).replace(".", ",")), "Dlh 2025 podľa Eurostatu v repe");
assert(byId("nezamestnanost-2025").explain.includes(String(value(2025, "unemployment")).replace(".", ",")), "Nezamestnanosť 2025 podľa Eurostatu v repe");
const tax = readFileSync(new URL("../lib/tax-receipt.ts", import.meta.url), "utf8");
assert(tax.includes("915") && byId("mzda-min-2026").a === "915 €", "Minimálna mzda 2026 ako v kalkulačke daní");
assert(tax.includes("9,4 %") && byId("odvody-zamestnanec").a === "9,4 %", "Sociálne poistenie zamestnanca 2026 ako v kalkulačke daní");

// ── Kolo ───────────────────────────────────────────────────────────────────────────────────────────
const round = buildRound(42);
assert.equal(round.length, ROUND_SIZE); assert.equal(new Set(round.map(x => x.id)).size, ROUND_SIZE, "30 rôznych otázok");
const shown = round.map(x => present(x));
for (const l of levels) assert.equal(shown.filter(q => q.level === l).length, PLAN[l], `Plán úrovne ${l}`);
assert.deepEqual(shown.map(q => q.level), [...shown.map(q => q.level)].sort((a, b) => a - b), "Od ľahkých po expertné");
for (const l of levels) for (const t of Object.keys(topicNames)) assert(shown.filter(q => q.level === l && q.topic === t).length <= 3, "Najviac 3 otázky jednej témy na úroveň");
for (const q of shown) assert.equal(q.options[q.correct], byId(q.id).a, "Správna možnosť po zamiešaní");
assert.deepEqual(buildRound(42), round, "Rovnaké zrnko = rovnaké kolo");
assert.deepEqual(buildRound(daySeed("2026-10-02")), buildRound(daySeed("2026-10-02")), "Kvíz dňa je rovnaký pre všetkých");
assert.notDeepEqual(buildRound(daySeed("2026-10-02")).map(x => x.id), buildRound(daySeed("2026-10-03")).map(x => x.id), "Iný deň = iné otázky");
const avoid = round.map(x => x.id), fresh = buildRound(7, avoid);
assert(fresh.filter(x => avoid.includes(x.id)).length <= 2, "Voľný kvíz uprednostní nevidené otázky");
const swapped = swapItem(round, 5, 42);
assert(swapped && !avoid.includes(swapped.id) && present(swapped).level === shown[5].level, "Výmena: iná otázka tej istej úrovne");
const hidden = halve(shown[3], 42);
assert.equal(hidden.length, 2); assert(!hidden.includes(shown[3].correct), "50 : 50 skryje dve nesprávne");
const perfect = scoreRound(shown, shown.map(q => q.correct)), none = scoreRound(shown, shown.map(() => null));
assert.equal(perfect.points, MAX_POINTS); assert.equal(perfect.correct, 30); assert.equal(none.points, 0); assert.equal(perfect.marks, "1".repeat(30));
assert.equal(titleFor(MAX_POINTS).name, "Prezident"); assert.equal(titleFor(0).name, "Volič"); assert.equal(titleFor(Math.round(MAX_POINTS * 0.5)).name, "Poslanec");
const text = shareText("daily", "2026-10-02", 48, MAX_POINTS, "1".repeat(20) + "0".repeat(10), "https://example.sk");
assert(text.startsWith("Tridsiatka · kvíz dňa 2. 10. 2026: 48/") && text.split("\n").length === 5 && !text.includes(shown[0].q), "Zdieľanie bez otázok");
// ── Uloženie (prísne čítanie) ──────────────────────────────────────────────────────────────────────
const progress = { v: 1, mode: "daily", day: "2026-10-02", seed: 42, items: round, answers: [1, null], hidden: { 1: hidden }, jokers: { half: true, swap: false } };
assert.deepEqual(parseProgress(JSON.stringify(progress)), progress);
for (const bad of [null, "{", "[]", JSON.stringify({ ...progress, items: round.slice(1) }), JSON.stringify({ ...progress, items: [{ id: "neexistuje", order: [0, 1, 2, 3] }, ...round.slice(1)] }),
  JSON.stringify({ ...progress, items: [{ ...round[0], order: [0, 0, 1, 2] }, ...round.slice(1)] }), JSON.stringify({ ...progress, answers: [7] }), JSON.stringify({ ...progress, mode: "x" })])
  assert.equal(parseProgress(bad), null, `Poškodené kolo sa zahodí: ${String(bad).slice(0, 50)}`);
const results = [{ mode: "daily", day: "2026-10-01", points: 40, max: MAX_POINTS, correct: 20, marks: "1".repeat(20) + "0".repeat(10), at: "2026-10-01T10:00:00.000Z" },
  { mode: "daily", day: "2026-10-02", points: 55, max: MAX_POINTS, correct: 25, marks: "1".repeat(25) + "0".repeat(5), at: "2026-10-02T10:00:00.000Z" },
  { mode: "free", day: "2026-10-02", points: 30, max: MAX_POINTS, correct: 15, marks: "1".repeat(15) + "0".repeat(15), at: "2026-10-02T11:00:00.000Z" }];
assert.deepEqual(parseResults(JSON.stringify([...results, { mode: "daily", day: "x", points: 1 }])), results, "Neplatné výsledky sa vynechajú");
assert.deepEqual(ranking(results).map(r => r.points), [55, 40, 30]);
assert.equal(streak(results, "2026-10-02"), 2); assert.equal(streak(results, "2026-10-03"), 2); assert.equal(streak(results, "2026-10-05"), 0);
assert.deepEqual(parseSeen(JSON.stringify(["vznik-sr", "nic", 5])), ["vznik-sr"]);
const challengeProgress = { ...progress, mode: "challenge", vyzva: "K7P2QXM" };
assert.deepEqual(parseProgress(JSON.stringify(challengeProgress)), challengeProgress, "Kolo výzvy sa uloží");
for (const bad of [{ ...progress, mode: "challenge" }, { ...progress, vyzva: "k7p2qxm" }, { ...progress, mode: "free", vyzva: "K7P2QXM" }])
  assert.equal(parseProgress(JSON.stringify(bad)), null, "Výzva potrebuje platný kód a nepatrí k voľnému kolu");
assert.equal(parseResults(JSON.stringify([{ ...results[0], token: "zle" }])).length, 0, "Neplatný kód kola vo výsledku");
assert(shareText("challenge", "2026-10-02", 40, MAX_POINTS, "1".repeat(30), "https://example.sk", " · lepší ako 60 %").startsWith("Tridsiatka · výzva: 40/"), "Zdieľanie výzvy");

// ── Online: prezývky, overenie kola, texty ─────────────────────────────────────────────────────────
for (const n of ["Volička", "Peter_88", "Badminton", "Picasso", "Conan", "Kundera", "Sranda", "Kanál", "Jana N.", "Zidane", "Slovensko", "Nad Tatrou", "Fiction", "Ficus", "Ľubka", "Ondrej-21"])
  assert("nick" in cleanNick(n), `Prezývka prejde: ${n}`);
for (const n of ["kurva", "K.u.r.v.a", "kuuurva", "F1co", "VolteSmer", "PS", "P5", "SaS", "admin", "Mandát", "Pellegrini", "Danko123", "1488", "Kotlebovci", "Gašpar", "a", "12345", "<b>", "x".repeat(21)])
  assert("error" in cleanNick(n), `Prezývka neprejde: ${n}`);
assert.equal(cleanNick("  Jana   N.  ").nick, "Jana N.", "Medzery sa zjednotia");
// Politici s portrétom na webe a skratky strán (okrem bežných slov ako Slovensko, Demokrati, Aliancia, Rodina).
const people = [...new Set(readdirSync(new URL("../public/people", import.meta.url)).filter(f => f.endsWith(".webp")).map(f => f.replace(/-[123]x\.webp$/, "")))];
assert(people.length >= 20, "Portréty politikov");
for (const id of people.filter(id => id !== "nad")) assert("error" in cleanNick(id[0].toUpperCase() + id.slice(1)), `Meno politika ${id} nie je prezývka`);
for (const p of parties.filter(p => !["slovensko", "dem", "aliancia", "rodina", "pnp", "vidiek", "zaludi"].includes(p.id))) assert("error" in cleanNick(p.short), `Strana ${p.short} nie je prezývka`);
const today = "2026-10-02", base = buildRound(daySeed(today)), right = base.map(x => present(x).correct);
const daily = verifyRound("daily", today, base, right);
assert.equal(daily.points, MAX_POINTS, "Server spočíta body kvízu dňa"); assert.equal(daily.marks, "1".repeat(30));
const swappedDay = base.slice(); swappedDay[4] = swapItem(base, 4, daySeed(today));
assert(!("error" in verifyRound("daily", today, swappedDay, right)), "Kvíz dňa s jednou výmenou žolíkom");
const twice = swappedDay.slice(); twice[20] = swapItem(swappedDay, 20, daySeed(today));
assert("error" in verifyRound("daily", today, twice, right), "Dve výmeny neprejdú");
assert("error" in verifyRound("daily", "2026-10-03", base, right), "Kolo iného dňa nie je dnešný kvíz");
const freeRound = buildRound(77, avoid);
assert(!("error" in verifyRound("free", today, freeRound, right)), "Voľné kolo prejde");
assert("error" in verifyRound("free", today, [freeRound[29], ...freeRound.slice(1, 29), freeRound[0]], right), "Poradie úrovní sa kontroluje");
assert("error" in verifyRound("challenge", today, freeRound, right, base), "Výzva len s otázkami výzvy");
assert(!("error" in verifyRound("challenge", today, freeRound, right, freeRound)), "Výzva s rovnakými otázkami");
assert("error" in verifyRound("daily", today, base, right.slice(1)), "29 odpovedí neprejde");
assert("error" in verifyRound("daily", today, base, [...right.slice(1), 5]), "Odpoveď mimo A–D neprejde");
assert("error" in verifyRound("daily", today, [{ ...base[0], order: [0, 0, 1, 2] }, ...base.slice(1)], right), "Poškodené poradie možností");
const hist = Array(MAX_POINTS + 1).fill(0); hist[30] = 5; hist[47] = 1; hist[50] = 3; hist[60] = 2;
assert.deepEqual(standing(hist, 47), { players: 11, rank: 6, better: 50 }); assert.deepEqual(standing(hist, 60), { players: 11, rank: 1, better: 90 });
assert.deepEqual(standing([0, 1], 1), { players: 1, rank: 1, better: null }); assert.equal(bands(hist).length, 15);
assert.deepEqual([7, 412, 25, 150, 1000, 17, 40, 205, 4000].map(zo), ["zo", "zo", "z", "zo", "z", "zo", "zo", "z", "zo"], "z/zo pred číslom");
assert.equal(hitText([4, 1], true), null); assert.equal(hitText([7, 3], true), "Dnes ju trafili 3 hráči zo 7.");
assert.equal(hitText([9, 0], true), "Dnes ju netrafil nikto z 9 hráčov."); assert.equal(hitText([412, 95], true), "Dnes ju trafilo 23 % hráčov.");
assert.equal(hitText([300, 1], false), "Zatiaľ ju trafilo 1 % hráčov.");
assert(isToken(newToken()) && isCode(newCode()) && newToken() !== newToken(), "Náhodné kódy");
const online = { nick: "Jana", plays: [{ token: newToken(), mode: "daily", day: today, items: base, answers: right, vyzva: null, sent: true }], links: [{ code: "K7P2QXM", token: newToken(), host: true, day: today }] };
assert.deepEqual(parseOnline(JSON.stringify(online)), online, "Online údaje v zariadení");
assert.deepEqual(parseOnline(JSON.stringify({ nick: "Fico", plays: [{ token: "x" }], links: [{ code: "zle" }] })), { nick: null, plays: [], links: [] }, "Poškodené online údaje sa zahodia");

// ── Online: úložisko (lib/quiz-store.ts nad node:sqlite, rovnaké SQL ako v Durable Object) ───────
const db = new DatabaseSync(":memory:");
// Ako SqlStorage v Durable Object: príkaz sa vykoná hneď, riadky (SELECT, RETURNING) vráti toArray().
const sql = { exec: (q, ...p) => { const st = db.prepare(q), rows = /^\s*select\b|\breturning\b/i.test(q) ? st.all(...p).map(r => ({ ...r })) : (st.run(...p), []); return { toArray: () => rows }; } };
let clock = Date.parse("2026-10-02T10:00:00Z");
const store = new QuizStore(sql, fn => { db.exec("BEGIN"); try { const r = fn(); db.exec("COMMIT"); return r; } catch (e) { db.exec("ROLLBACK"); throw e; } }, () => clock++);
const tok = Array.from({ length: 8 }, () => newToken()), wrong = right.map(a => (a + 1) % 4);
const answersWith = n => right.map((a, i) => i < n ? a : wrong[i]);
const post = body => store.post(body);
let r = post({ a: "hra", mode: "daily", day: today, token: tok[0], items: base, answers: answersWith(30) });
assert.equal(r.status, 200); assert.equal(r.body.points, MAX_POINTS); assert.equal(r.body.board.players, 1); assert.equal(r.body.board.me.rank, 1); assert.equal(r.body.board.me.better, null);
post({ a: "hra", mode: "daily", day: today, token: tok[1], items: base, answers: answersWith(10) });
r = post({ a: "hra", mode: "daily", day: today, token: tok[2], items: base, answers: answersWith(20) });
assert.equal(r.body.board.players, 3); assert.equal(r.body.board.me.rank, 2); assert.equal(r.body.board.me.better, 50, "Viac bodov ako polovica ostatných");
assert.deepEqual(r.body.board.items[base[0].id], [3, 3]); assert.deepEqual(r.body.board.items[base[25].id], [3, 1], "Úspešnosť otázky dňa");
const again = post({ a: "hra", mode: "daily", day: today, token: tok[2], items: base, answers: answersWith(30) });
assert.equal(again.body.points, r.body.points, "Opakované odoslanie nezmení výsledok"); assert.equal(again.body.board.players, 3, "Ani počet hráčov");
assert.equal(post({ a: "hra", mode: "free", day: today, token: tok[2], items: freeRound, answers: right }).status, 409, "Kód kola nepatrí inému kolu");
assert.equal(post({ a: "hra", mode: "daily", day: "2026-09-29", token: tok[3], items: buildRound(daySeed("2026-09-29")), answers: right }).status, 410, "Staré kolo");
assert.equal(post({ a: "hra", mode: "daily", day: today, token: tok[3], items: freeRound, answers: right }).status, 400, "Cudzie otázky ako kvíz dňa");
assert.equal(post({ a: "prezyvka", token: tok[1], day: today, nick: "Kurva" }).status, 422, "Vulgárna prezývka");
r = post({ a: "prezyvka", token: tok[1], day: today, nick: "Jana" });
assert.deepEqual(r.body.board.top, [{ nick: "Jana", points: r.body.board.me.points, rank: 3, me: true }], "V rebríčku len hráči s prezývkou, miesto zo všetkých");
post({ a: "prezyvka", token: tok[0], day: today, nick: "Marek" });
assert.deepEqual(store.get(new URLSearchParams(`den=${today}`)).body.board.top.map(e => [e.nick, e.rank, e.me]), [["Marek", 1, undefined], ["Jana", 3, undefined]], "Cudzí kód kola sa nevracia");
assert.equal(post({ a: "prezyvka", token: tok[1], day: today, nick: null }).body.board.top.length, 1, "Prezývku možno odstrániť");
assert.equal(post({ a: "prezyvka", token: tok[7], day: today, nick: "Eva" }).status, 404);
// Voľné kolo: len súhrnná úspešnosť otázok.
r = post({ a: "hra", mode: "free", day: today, token: tok[4], items: freeRound, answers: right });
assert.equal(r.status, 200); assert(!r.body.board); assert(r.body.items[freeRound[0].id][0] >= 1, "Súhrn za všetky kolá");
assert.equal(store.board(today).players, 3, "Voľné kolo nie je v rebríčku dňa");
// Výzva z voľného kola: kamarát hrá presne tie otázky, potom sa zapíše.
assert.equal(post({ a: "vyzva", token: tok[4], nick: "Fico", mode: "free", day: today, items: freeRound, answers: right }).status, 422);
r = post({ a: "vyzva", token: tok[4], nick: "Jana", mode: "free", day: today, items: freeRound, answers: right });
const code = r.body.code;
assert(isCode(code) && r.body.challenge.players.length === 1 && r.body.challenge.players[0].host && r.body.challenge.players[0].me, "Nová výzva");
assert.equal(post({ a: "vyzva", token: tok[4], nick: "Jana K", mode: "free", day: today, items: freeRound, answers: right }).body.code, code, "Druhé vytvorenie vráti tú istú výzvu");
assert.equal(post({ a: "hra", mode: "challenge", day: today, token: tok[5], items: base, answers: right, vyzva: code }).status, 400, "Vo výzve iné otázky neprejdú");
r = post({ a: "hra", mode: "challenge", day: today, token: tok[5], items: store.challenge(code).items, answers: answersWith(15), vyzva: code });
assert.equal(r.status, 200); assert.equal(r.body.challenge.players.length, 1, "Pred zápisom je vo výzve len hostiteľ");
r = post({ a: "pridat", code, token: tok[5], nick: "Marek" });
assert.deepEqual(r.body.challenge.players.map(p => [p.nick, p.host, !!p.me]), [["Jana K", true, false], ["Marek", false, true]], "Výsledky vedľa seba");
assert.equal(post({ a: "pridat", code, token: tok[0], nick: "Marek" }).status, 409, "Cudzie kolo k výzve nepatrí");
// Výzva z kvízu dňa: kto už kvíz dňa odohral, zapíše sa rovno svojím výsledkom.
const daily2 = post({ a: "vyzva", token: tok[0], nick: "Marek", mode: "daily", day: today, items: base, answers: answersWith(30) }).body;
assert.equal(daily2.challenge.mode, "daily");
r = post({ a: "pridat", code: daily2.code, token: tok[2], nick: "Eva" });
assert.deepEqual(r.body.challenge.players.map(p => p.nick), ["Marek", "Eva"], "Kvíz dňa ako odpoveď na výzvu dňa");
assert.equal(store.get(new URLSearchParams("vyzva=ZZZZZZZ")).status, 404); assert.equal(store.get(new URLSearchParams("vyzva=zle")).status, 400);
assert.equal(post({ a: "nic" }).status, 400);
// Dodatočná moderácia: prezývka, ktorá sa neskôr ocitne v zozname zakázaných, sa nezobrazí (tu zápisom priamo do úložiska).
db.prepare("UPDATE plays SET nick = 'Kurva' WHERE token = ?").run(tok[2]); db.prepare("UPDATE challenge_players SET nick = 'Kurva' WHERE token = ?").run(tok[2]);
assert(!store.board(today).top.some(e => e.nick === "Kurva"), "Zakázaná prezývka nie je v rebríčku"); assert.equal(store.board(today, tok[2]).me.nick, null);
assert(store.challenge(daily2.code).players.some(p => p.nick === "Hráč"), "Vo výzve namiesto nej „Hráč“");
console.log(`PASS quiz online: prezývky (${people.length - 1} politikov, ${parties.length} strán), overenie kola, poradie, výzvy, úložisko SQLite`);
console.log(`PASS quiz: ${questions.length} otázok (${levels.map(l => questions.filter(q => q.level === l).length).join("/")}), krížová kontrola s vládami, voľbami 2023 a Eurostatom; kolo ${ROUND_SIZE} (${levels.map(l => PLAN[l]).join("+")}), max ${MAX_POINTS} bodov, žolíky, zdieľanie, uloženie`);
