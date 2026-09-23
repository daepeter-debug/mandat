// Nahrávky „Mandát za minútu“ neurálnym hlasom (ElevenLabs) → public/audio/pribeh/<karta>-<hash>.mp3 a lib/story-audio.json.
// Kľúč sa berie LEN z premennej prostredia ELEVENLABS_API_KEY (nikdy nie z kódu ani z príkazového riadku).
// Kľúču stačí oprávnenie Text to Speech; User: Read ukáže zostatok kreditov, Voices: Read zoznam hlasov.
//   node scripts/build-audio.mjs --dry-run                 texty a počet znakov bez volania API (nič nemíňa)
//   node scripts/build-audio.mjs --voices                  dostupné hlasy (ID vložiť do ELEVENLABS_VOICE_ID)
//   node scripts/build-audio.mjs --credits                 zostatok kreditov (nič nemíňa)
//   node scripts/build-audio.mjs --sample=leader --voice=<id> --out=<priečinok>   ukážka jednej karty jedným hlasom
//   node scripts/build-audio.mjs                           vygeneruje len karty, ktorých text sa zmenil (šetrí kredity)
// Voliteľne: ELEVENLABS_VOICE_ID alebo --voice=<id> (predvolený hlas Sarah), ELEVENLABS_MODEL (predvolený eleven_multilingual_v2).
import { createHash } from "node:crypto";
import fs from "node:fs";
import { narration, narrationEdition } from "../lib/story-narration.ts";

const API = "https://api.elevenlabs.io/v1";
const OUT_DIR = "public/audio/pribeh";
const MANIFEST = "lib/story-audio.json";
const argv = process.argv.slice(2);
const flag = name => argv.includes(`--${name}`);
const option = name => argv.find(a => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
const key = process.env.ELEVENLABS_API_KEY;
const voice = option("voice") || process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";
const model = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";
const texts = narration();
const chars = texts.reduce((s, t) => s + t.text.length, 0);
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
const hashOf = text => createHash("sha1").update(`${voice}|${model}|${text}`).digest("hex").slice(0, 10);

async function main() {
  if (flag("dry-run")) {
    for (const t of texts) console.log(`\n[${t.id}] ${t.text.length} znakov\n${t.text}`);
    console.log(`\nSpolu ${chars} znakov (${credits(chars)} kreditov), hlas ${voice}, model ${model}.`);
    return;
  }
  if (!key) throw new Error("Chýba premenná ELEVENLABS_API_KEY. V PowerShelli: setx ELEVENLABS_API_KEY \"…\" a potom reštart aplikácie/terminálu.");
  if (flag("voices")) {
    const { voices } = await (await api("/voices")).json();
    for (const v of voices) console.log(`${v.voice_id}  ${v.name}${v.labels ? `  (${Object.values(v.labels).join(", ")})` : ""}`);
    return;
  }
  if (flag("credits")) { const c = await remaining(); console.log(`Kredity: ostáva ${c.left} z ${c.limit}.`); return; }
  const sample = option("sample");
  if (sample) {
    const t = texts.find(x => x.id === sample);
    if (!t) throw new Error(`Neznáma karta ${sample} (${texts.map(x => x.id).join(", ")})`);
    const dir = option("out") ?? ".";
    fs.mkdirSync(dir, { recursive: true });
    const audio = await speak(t.text);
    const file = `${dir}/ukazka-${sample}-${voice}.mp3`;
    fs.writeFileSync(file, audio);
    console.log(`${file}: ${t.text.length} znakov, ${Math.round(audio.length / 1024)} kB, ~${(audio.length * 8 / 128000).toFixed(1)} s`);
    return;
  }

  const old = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : { slides: {} };
  const todo = texts.filter(t => { const prev = old.slides?.[t.id]; return !(prev && prev.hash === hashOf(t.text) && fs.existsSync(`public${prev.src}`)); });
  const need = credits(todo.reduce((s, t) => s + t.text.length, 0));
  if (!todo.length) { console.log("Nahrávky sú aktuálne, nič sa negeneruje."); return; }
  try {
    const c = await remaining();
    console.log(`Kredity: ostáva ${c.left} z ${c.limit}, treba asi ${need}.`);
    if (c.left < need && !flag("force")) throw new Error("Nedostatok kreditov — skráť texty alebo počkaj na nový mesiac (alebo --force).");
  } catch (e) {
    if (/Nedostatok/.test(e.message)) throw e;
    console.log(`Zostatok kreditov sa nedá zistiť (${e.message}); pokračujem.`);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const slides = { ...(old.slides ?? {}) };
  for (const t of todo) {
    const hash = hashOf(t.text);
    const audio = await speak(t.text);
    for (const f of fs.readdirSync(OUT_DIR)) if (f.startsWith(`${t.id}-`)) fs.unlinkSync(`${OUT_DIR}/${f}`);
    const file = `${t.id}-${hash}.mp3`;
    fs.writeFileSync(`${OUT_DIR}/${file}`, audio);
    slides[t.id] = { src: `/audio/pribeh/${file}`, hash, chars: t.text.length, ms: Math.round(audio.length * 8 / 128) };
    console.log(`${t.id}: ${t.text.length} znakov → ${Math.round(audio.length / 1024)} kB, ~${(slides[t.id].ms / 1000).toFixed(1)} s`);
  }
  const manifest = { edition: narrationEdition, voice, model, credit: "Hlas: ElevenLabs (AI)", generated: new Date().toISOString().slice(0, 10), slides };
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`${MANIFEST}: vydanie ${narrationEdition}, ${Object.keys(slides).length} kariet.`);
}

// Bez process.exit: na Windowse by Node pri otvorenom spojení vypísal chybu libuv.
main().catch(e => { console.error(e.message); process.exitCode = 1; });
