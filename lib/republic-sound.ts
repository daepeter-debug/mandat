/*
  Jemné zvuky Malej republiky: syntetizované cez Web Audio, bez zvukových súborov. Hrajú len po kliknutí
  hráča (stavba, splnená úloha, zásielka), predvolene sú zapnuté a vypínač je v hlavičke hry.
*/
export type Sound = "place" | "step" | "success" | "parcel" | "error";
const KEY = "mandat:republic:v1:sound";
let audio: AudioContext | null = null;
export const soundEnabled = () => { try { return localStorage.getItem(KEY) !== "off"; } catch { return false; } };
export const setSoundEnabled = (on: boolean) => { try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* bez úložiska ostane nastavenie len do obnovenia */ } };
function tone(c: AudioContext, at: number, freq: number, dur: number, type: OscillatorType, gain: number) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, at);
  g.gain.setValueAtTime(.0001, at); g.gain.exponentialRampToValueAtTime(gain, at + .012); g.gain.exponentialRampToValueAtTime(.0001, at + dur);
  o.connect(g).connect(c.destination); o.start(at); o.stop(at + dur + .02);
}
export function play(sound: Sound) {
  if (typeof window === "undefined" || !soundEnabled()) return;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    audio ??= new Ctor();
    if (audio.state === "suspended") void audio.resume();
    const c = audio, t = c.currentTime + .01;
    if (sound === "place") { tone(c, t, 220, .12, "triangle", .07); tone(c, t + .03, 330, .1, "sine", .04); }
    if (sound === "step") [523.25, 659.25, 783.99].forEach((f, i) => tone(c, t + i * .09, f, .38, "sine", .05));
    if (sound === "success") { tone(c, t, 659.25, .25, "sine", .05); tone(c, t + .1, 880, .36, "sine", .05); }
    if (sound === "parcel") [783.99, 987.77, 1174.66, 1567.98].forEach((f, i) => tone(c, t + i * .06, f, .26, "triangle", .035));
    if (sound === "error") { tone(c, t, 180, .18, "sine", .05); tone(c, t + .08, 150, .2, "sine", .04); }
  } catch { /* zvuk je len doplnok */ }
}
