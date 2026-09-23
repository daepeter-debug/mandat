// Nahrávky neurálnym hlasom (ElevenLabs) cez API: Mandát za minútu, rýchle odpovede, „Ako sa z hlasov stanú kreslá“, profily strán.
// Výstup: public/audio/<sada>/<id>-<hash>.mp3 a zoznam lib/audio/<sada>.json (web ukáže tlačidlo 🔊 len pre platné nahrávky).
// Kľúč sa berie LEN z premennej prostredia ELEVENLABS_API_KEY (nikdy nie z kódu ani z príkazového riadku).
// Kľúču stačí oprávnenie Text to Speech; User: Read ukáže zostatok kreditov, Voices: Read zoznam hlasov.
// POZOR: na free pláne API nepustí hlasy z Voice Library (HTTP 402) — vtedy nahrávaj na webe a použi scripts/import-audio.mjs.
//   node scripts/build-audio.mjs --dry-run            texty a počet znakov bez volania API (nič nemíňa)
//   node scripts/build-audio.mjs --voices             dostupné hlasy
//   node scripts/build-audio.mjs --credits            zostatok kreditov
//   node scripts/build-audio.mjs --sample=story/leader --voice=<id> --out=<priečinok>   ukážka jednej položky
//   node scripts/build-audio.mjs [--set=story|quick|seats|profiles]   vygeneruje len zmenené položky (šetrí kredity)
// Nezmenený text s novým vydaním sa len prepečiatkuje (bez API). Hlas: ELEVENLABS_VOICE_ID alebo --voice=<id>.
import fs from "node:fs";
import { DEFAULT_MODEL, DEFAULT_VOICE, isCurrent, loadSets, readManifest, recordings, restamp, saveAudio, writeManifest } from "./audio-shared.mjs";

const API = "https://api.elevenlabs.io/v1";
const argv = process.argv.slice(2);
const flag = name => argv.includes(`--${name}`);
const option = name => argv.find(a => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
const key = process.env.ELEVENLABS_API_KEY;
const voice = option("voice") || process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE;
const model = process.env.ELEVENLABS_MODEL || DEFAULT_MODEL;
const sets = loadSets();
const credits = n => model.includes("flash") || model.includes("turbo") ? Math.ceil(n / 2) : n;

async function api(path, init = {}) {
  const r = await fetch(`${API}${path}`, { ...init, headers: { "xi-api-key": key, ...(init.headers ?? {}) } });
  if (!r.ok) {
    let detail = "";
    try { const j = await r.json(); detail = j.detail?.message ?? j.detail?.status ?? JSON.stringify(j.detail ?? j).slice(0, 200); } catch { /* bez tela */ }
    throw new Error(`${path.split("?")[0]}: HTTP ${r.status}${detail ? ` — ${detail}` : ""}`);
  }
  return r;
}
async function remaining() {
  const sub = await (await api("/user/subscription")).json();
  return { left: sub.character_limit - sub.character_count, limit: sub.character_limit };
}
async function speak(text) {
  const body = { text, model_id: model, voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true } };
  if (/v2_5/.test(model)) body.language_code = "sk";
  const r = await api(`/text-to-speech/${voice}?output_format=mp3_44100_128`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "audio/mpeg" }, body: JSON.stringify(body) });
  return Buffer.from(await r.arrayBuffer());
}

async function main() {
  const chosen = option("set") ? [option("set")] : Object.keys(sets);
  for (const s of chosen) if (!sets[s]) throw new Error(`Neznáma sada ${s} (${Object.keys(sets).join(", ")})`);
  if (flag("dry-run")) {
    let total = 0;
    for (const s of chosen) for (const t of sets[s]) { total += t.text.length; console.log(`\n[${s}/${t.id}]${t.dated ? " (vydanie)" : ""} ${t.text.length} znakov\n${t.text}`); }
    console.log(`\nSpolu ${total} znakov (${credits(total)} kreditov), hlas ${voice}, model ${model}.`);
    return;
  }
  const needKey = () => { if (!key) throw new Error("Chýba premenná ELEVENLABS_API_KEY. V PowerShelli: setx ELEVENLABS_API_KEY \"…\" a potom reštart aplikácie/terminálu."); };
  if (flag("voices") || flag("credits") || option("sample")) needKey();
  if (flag("voices")) {
    const { voices } = await (await api("/voices")).json();
    for (const v of voices) console.log(`${v.voice_id}  ${v.name}${v.labels ? `  (${Object.values(v.labels).join(", ")})` : ""}`);
    return;
  }
  if (flag("credits")) { const c = await remaining(); console.log(`Kredity: ostáva ${c.left} z ${c.limit}.`); return; }
  const sample = option("sample");
  if (sample) {
    const [s, id] = sample.split("/");
    const t = sets[s]?.find(x => x.id === id);
    if (!t) throw new Error(`Neznáma položka ${sample}`);
    const dir = option("out") ?? ".";
    fs.mkdirSync(dir, { recursive: true });
    const audio = await speak(t.text);
    const file = `${dir}/ukazka-${s}-${id}-${voice}.mp3`;
    fs.writeFileSync(file, audio);
    console.log(`${file}: ${t.text.length} znakov, ${Math.round(audio.length / 1024)} kB, ~${(audio.length * 8 / 128000).toFixed(1)} s`);
    return;
  }

  const plan = chosen.map(s => {
    const old = readManifest(s);
    const items = {};
    const todo = [];
    for (const t of sets[s]) { const prev = old.items?.[t.id]; if (isCurrent(prev, voice, model, t)) items[t.id] = restamp(prev, t); else todo.push(t); }
    return { s, items, todo };
  });
  const need = credits(plan.reduce((sum, p) => sum + p.todo.reduce((a, t) => a + t.text.length, 0), 0));
  if (need) {
    needKey();
    try {
      const c = await remaining();
      console.log(`Kredity: ostáva ${c.left} z ${c.limit}, treba asi ${need}.`);
      if (c.left < need && !flag("force")) throw new Error("Nedostatok kreditov — skráť texty alebo počkaj na nový mesiac (alebo --force).");
    } catch (e) {
      if (/Nedostatok/.test(e.message)) throw e;
      console.log(`Zostatok kreditov sa nedá zistiť (${e.message}); pokračujem.`);
    }
  }
  for (const { s, items, todo } of plan) {
    for (const t of todo) {
      items[t.id] = saveAudio(s, t, await speak(t.text), voice, model);
      console.log(`${s}/${t.id}: ${t.text.length} znakov → ~${(items[t.id].ms / 1000).toFixed(1)} s`);
    }
    const n = writeManifest(s, items, sets, voice, model);
    console.log(`lib/audio/${s}.json: ${recordings(n)}${todo.length ? `, nové: ${todo.length}` : " (bez zmeny textov)"}.`);
  }
}

// Bez process.exit: na Windowse by Node pri otvorenom spojení vypísal chybu libuv.
main().catch(e => { console.error(e.message); process.exitCode = 1; });
