/*
  Prehrávanie nahrávok z public/audio (tlačidlo „Vypočuj si“ a hlas v Mandáte za minútu).
  Statické súbory na Cloudflare nepodporujú čiastočné odpovede (na Range vrátia celý súbor s kódom 200) a Safari na iPhone
  takú priamu adresu zvuku nemusí prehrať. Preto sa nahrávka stiahne celá a hrá z blob: adresy (tá sa dá posúvať vždy).
  iPhone pustí zvuk len z ťuknutia: prvé play() na prvku ide hneď v ťuknutí na tichom zvuku, nahrávka až po stiahnutí.
*/
const blobs = new Map<string, Promise<string>>();

/** blob: adresa nahrávky (stiahne sa raz za návštevu). */
export function audioBlobUrl(src: string): Promise<string> {
  let url = blobs.get(src);
  if (!url) {
    url = fetch(src).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.blob(); }).then(b => URL.createObjectURL(b));
    url.catch(() => blobs.delete(src));
    blobs.set(src, url);
  }
  return url;
}

// 46-bajtový tichý WAV (1 vzorka, 8 kHz).
const SILENCE = "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQIAAAAAAA==";

/** Odomkne prvok v ťuknutí (iOS), kým sa nahrávka sťahuje. */
export function unlockAudio(a: HTMLAudioElement) {
  a.dataset.loaded = "";
  a.src = SILENCE;
  void a.play().catch(() => {});
}

/** Je na prvku už skutočná nahrávka (nie tichý zvuk na odomknutie)? */
export const hasRecording = (a: HTMLAudioElement) => Boolean(a.dataset.loaded);

/**
  Pustí nahrávku: volať priamo z ťuknutia. Po pauze pokračuje od miesta, inak odomkne prvok a hrá po stiahnutí.
  wanted() sa pýta, či o prehratie ešte niekto stojí (medzitým mohol ťuknúť na Zastaviť); vráti, či sa hrá.
*/
export async function playRecording(a: HTMLAudioElement, src: string, wanted: () => boolean = () => true): Promise<boolean> {
  if (a.dataset.loaded === src) { await a.play(); return true; }
  unlockAudio(a);
  const url = await audioBlobUrl(src);
  if (!wanted()) return false;
  a.src = url;
  a.dataset.loaded = src;
  await a.play();
  return true;
}
