import { edition } from "./edition.ts";

/** Nahrávka z lib/audio/<sada>.json (scripts/build-audio.mjs alebo scripts/import-audio.mjs). */
export type VoiceItem = { src: string; ms: number; edition?: string };

/** Položky s vydaním (texty s číslami z prieskumov) platia len pre aktuálne vydanie Modelu Mandát; inak sa tlačidlo neukáže. */
export function voiceItem(manifest: { items: object }, id: string): VoiceItem | undefined {
  const item = (manifest.items as Record<string, VoiceItem | undefined>)[id];
  return item && (!item.edition || item.edition === edition.asOf) ? item : undefined;
}
