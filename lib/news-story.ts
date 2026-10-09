import type { NewsCategory, PoliticalNews } from "./political-news.ts";
/** Dark, readable equivalents of the existing category chips. */
export const newsStoryTones: Record<NewsCategory, string> = {
  Vláda: "#24483b", Parlament: "#243d54", Opozícia: "#493b59", Prezident: "#453f2e",
  Voľby: "#284448", Prieskumy: "#303f60", Politika: "#3c4640",
};
const sentences = new Intl.Segmenter("sk", { granularity: "sentence" });
/** A contiguous excerpt of the verified copy; dates and decimals must not drop its prefix. */
export function storySummary(item: Pick<PoliticalNews, "summary">): string {
  let end = 0, count = 0;
  for (const part of sentences.segment(item.summary)) {
    end = part.index + part.segment.length;
    // ICU can split Slovak numeric dates between the day and month.
    if (/\d\.\s*$/.test(part.segment) && /^\d/.test(item.summary.slice(end))) continue;
    if (++count === 2) break;
  }
  return item.summary.slice(0, end).trim();
}
