// Spoločné pre scripts/build-audio.mjs (generovanie cez API) a scripts/import-audio.mjs (nahrávky z webu ElevenLabs).
import { createHash } from "node:crypto";
import fs from "node:fs";
import { audioSets, narrationEdition } from "../lib/narration.ts";

export { narrationEdition };
export const DEFAULT_VOICE = "2ST3sI2j7fz4A5oXjnbA"; // slovenský „Adam – Young and Energetic“ (Voice Library)
export const DEFAULT_MODEL = "eleven_multilingual_v2";
export const CREDIT = "Hlas: ElevenLabs (AI)";

export const loadSets = () => audioSets(JSON.parse(fs.readFileSync("lib/party-profiles.json", "utf8")));
export const manifestPath = set => `lib/audio/${set}.json`;
export const readManifest = set => fs.existsSync(manifestPath(set)) ? JSON.parse(fs.readFileSync(manifestPath(set), "utf8")) : { items: {} };
export const hashOf = (voice, model, text) => createHash("sha1").update(`${voice}|${model}|${text}`).digest("hex").slice(0, 10);

/** Položka je aktuálna, keď sedí text (hash) a súbor existuje; pri dated položkách sa vydanie len prepečiatkuje. */
export const isCurrent = (prev, voice, model, t) => Boolean(prev && prev.hash === hashOf(voice, model, t.text) && fs.existsSync(`public${prev.src}`));
export const restamp = (prev, t) => ({ ...prev, ...(t.dated ? { edition: narrationEdition } : {}) });

const BITRATES = { 1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320], 2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160] };
const RATES = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };
/** Dĺžka MP3 (Layer III) v ms zo súčtu rámcov — sedí pre CBR aj VBR. */
export function mp3Ms(buf) {
  let i = 0, samples = 0, rate = 44100;
  if (buf.toString("latin1", 0, 3) === "ID3") i = 10 + ((buf[6] & 0x7f) << 21 | (buf[7] & 0x7f) << 14 | (buf[8] & 0x7f) << 7 | (buf[9] & 0x7f));
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff || (buf[i + 1] & 0xe0) !== 0xe0) { i++; continue; }
    const version = (buf[i + 1] >> 3) & 3, layer = (buf[i + 1] >> 1) & 3;
    const bitrate = BITRATES[version === 3 ? 1 : 2][buf[i + 2] >> 4] * 1000, sr = RATES[version]?.[(buf[i + 2] >> 2) & 3];
    if (version === 1 || layer !== 1 || !bitrate || !sr) { i++; continue; }
    const perFrame = version === 3 ? 1152 : 576;
    const length = Math.floor(perFrame / 8 * bitrate / sr) + ((buf[i + 2] >> 1) & 1);
    samples += perFrame; rate = sr; i += length;
  }
  return Math.round(samples / rate * 1000);
}

/** Uloží MP3 do public/audio/<sada>/<id>-<hash>.mp3 (staré verzie položky zmaže) a vráti položku zoznamu. */
export function saveAudio(set, t, audio, voice, model) {
  const dir = `public/audio/${set}`;
  fs.mkdirSync(dir, { recursive: true });
  const hash = hashOf(voice, model, t.text);
  for (const f of fs.readdirSync(dir)) if (f.startsWith(`${t.id}-`)) fs.unlinkSync(`${dir}/${f}`);
  const file = `${t.id}-${hash}.mp3`;
  fs.writeFileSync(`${dir}/${file}`, audio);
  return restamp({ src: `/audio/${set}/${file}`, hash, chars: t.text.length, ms: mp3Ms(audio) }, t);
}

/** Zapíše zoznam sady v poradí textov; položky, ktoré v sade už nie sú, vypadnú. */
export function writeManifest(set, items, sets, voice, model) {
  const ordered = Object.fromEntries(sets[set].filter(t => items[t.id]).map(t => [t.id, items[t.id]]));
  fs.writeFileSync(manifestPath(set), JSON.stringify({ voice, model, credit: CREDIT, generated: new Date().toISOString().slice(0, 10), items: ordered }, null, 2) + "\n");
  return Object.keys(ordered).length;
}
