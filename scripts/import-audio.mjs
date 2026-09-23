// Import nahrávok vytvorených na webe ElevenLabs (Text to Speech) — na free pláne API nepustí hlasy z Voice Library,
// web áno. Texty musia byť presne tie z `node scripts/build-audio.mjs --dry-run` (poradie = --sheet).
//   node scripts/import-audio.mjs --sheet [--set=quick]      nahrávací hárok: poradie, znaky, text
//   node scripts/import-audio.mjs --history [--set=quick]    stiahne z histórie účtu podľa presnej zhody textu
//                                                            (kľúč ELEVENLABS_API_KEY s oprávnením History: Read)
//   node scripts/import-audio.mjs --from=<priečinok> [--set=quick]   MP3 v poradí hárku (zoradené podľa názvu súboru)
//   node scripts/import-audio.mjs --restamp                  nezmenené texty s novým vydaním len prepečiatkuje
// Hlas a model sa musia zhodovať s nahrávkami (predvolene Adam – Young and Energetic, Multilingual v2).
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_MODEL, DEFAULT_VOICE, isCurrent, loadSets, mp3Ms, readManifest, restamp, saveAudio, writeManifest } from "./audio-shared.mjs";

const argv = process.argv.slice(2);
const flag = name => argv.includes(`--${name}`);
const option = name => argv.find(a => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
const voice = option("voice") || process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE;
const model = process.env.ELEVENLABS_MODEL || DEFAULT_MODEL;
const sets = loadSets();
const chosen = option("set") ? option("set").split(",") : Object.keys(sets);
for (const s of chosen) if (!sets[s]) throw new Error(`Neznáma sada ${s} (${Object.keys(sets).join(", ")})`);
const sheet = chosen.flatMap(s => sets[s].map(t => ({ s, t })));
const norm = text => text.replace(/\s+/g, " ").trim();

async function historyAudio() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("Chýba premenná ELEVENLABS_API_KEY.");
  const get = async url => {
    const r = await fetch(`https://api.elevenlabs.io/v1${url}`, { headers: { "xi-api-key": key } });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(`${url.split("?")[0]}: HTTP ${r.status} — ${j.detail?.message ?? j.detail?.status ?? ""}`); }
    return r;
  };
  const found = new Map(); // text → najnovšia položka histórie s týmto hlasom a modelom
  let after = "";
  for (let page = 0; page < 20; page++) {
    const j = await (await get(`/history?page_size=1000&voice_id=${voice}${after ? `&start_after_history_item_id=${after}` : ""}`)).json();
    for (const h of j.history ?? []) {
      if (h.voice_id !== voice || (h.model_id && h.model_id !== model)) continue;
      const k = norm(h.text ?? "");
      if (!found.has(k) || found.get(k).date_unix < h.date_unix) found.set(k, h);
    }
    if (!j.has_more) break;
    after = j.last_history_item_id;
  }
  return async t => { const h = found.get(norm(t.text)); return h ? Buffer.from(await (await get(`/history/${h.history_item_id}/audio`)).arrayBuffer()) : null; };
}

function folderAudio(dir) {
  const files = fs.readdirSync(dir).filter(f => /\.mp3$/i.test(f)).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  if (files.length !== sheet.length) throw new Error(`V priečinku je ${files.length} MP3, hárok má ${sheet.length} položiek (${chosen.join(", ")}).`);
  const byItem = new Map(sheet.map(({ s, t }, i) => [`${s}/${t.id}`, path.join(dir, files[i])]));
  return async (t, s) => fs.readFileSync(byItem.get(`${s}/${t.id}`));
}

async function main() {
  if (flag("sheet")) {
    sheet.forEach(({ s, t }, i) => console.log(`\n${String(i + 1).padStart(2, "0")}  ${s}/${t.id}  ${t.text.length} znakov\n${t.text}`));
    const n = sheet.length;
    console.log(`\nSpolu ${n} ${n === 1 ? "nahrávka" : n < 5 ? "nahrávky" : "nahrávok"}, ${sheet.reduce((a, x) => a + x.t.text.length, 0)} znakov.`);
    return;
  }
  const source = flag("history") ? await historyAudio() : option("from") ? folderAudio(option("from")) : null;
  if (!source && !flag("restamp")) throw new Error("Zadaj --history, --from=<priečinok>, --sheet alebo --restamp.");
  let imported = 0, missing = 0;
  for (const s of chosen) {
    const old = readManifest(s);
    const items = {};
    for (const t of sets[s]) {
      const prev = old.items?.[t.id];
      const current = isCurrent(prev, voice, model, t);
      if (current && !flag("force") && !option("from")) { items[t.id] = restamp(prev, t); continue; }
      const audio = source ? await source(t, s) : null;
      if (!audio) { if (current) items[t.id] = restamp(prev, t); else { missing++; console.log(`${s}/${t.id}: nahrávka s týmto textom chýba`); } continue; }
      const ms = mp3Ms(audio), rate = t.text.length / (ms / 1000);
      // Kontrola poradia pri --from: slovenská reč má zhruba 10–22 znakov za sekundu.
      if (!(rate > 8 && rate < 25)) throw new Error(`${s}/${t.id}: ${t.text.length} znakov za ${(ms / 1000).toFixed(1)} s nesedí — skontroluj poradie súborov`);
      items[t.id] = saveAudio(s, t, audio, voice, model);
      imported++;
      console.log(`${s}/${t.id}: ${(ms / 1000).toFixed(1)} s, ${Math.round(audio.length / 1024)} kB`);
    }
    console.log(`lib/audio/${s}.json: ${writeManifest(s, items, sets, voice, model)} nahrávok.`);
  }
  console.log(`Importované ${imported}${missing ? `, chýba ${missing}` : ""}.`);
}

main().catch(e => { console.error(e.message); process.exitCode = 1; });
