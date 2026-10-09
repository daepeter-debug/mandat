import assert from "node:assert/strict";
import { gameIds, gameCount } from "../lib/game-catalog.ts";
import { partyDelta, termProgress } from "../lib/mobile-insights.ts";
import { edition } from "../lib/edition.ts";
import { currentAggregate } from "../lib/aggregate.ts";
import { newsCategories, newsDayGroups, politicalNews, newsChecked } from "../lib/political-news.ts";
import { newsStoryTones, storySummary } from "../lib/news-story.ts";

assert.equal(gameCount, gameIds.length);
assert.equal(new Set(gameIds).size, gameCount);
assert.equal(termProgress("2023-09-30"), 0);
assert.equal(termProgress("2027-09-30"), 100);
assert.equal(termProgress("2025-09-30"), 50);
assert.equal(termProgress("2026-10-09"), 76);
assert.equal(termProgress("2022-01-01"), 0);
assert.equal(termProgress("2030-01-01"), 100);
assert.equal(termProgress(""), null);
assert.equal(termProgress("not-a-date"), null);
assert.equal(partyDelta("unknown-party"), null);
const datedSummary = "Rozhodnutie zo 9. 10. 2026 upravuje sadzbu na 2,5 percenta. Návrh musí posúdiť parlament. Ďalšie kroky ešte nepotvrdili.";
assert.equal(storySummary({ summary: datedSummary }), "Rozhodnutie zo 9. 10. 2026 upravuje sadzbu na 2,5 percenta. Návrh musí posúdiť parlament.");
for (const mover of edition.movers) assert.equal(partyDelta(mover.id), mover.delta);
for (const id of Object.keys(currentAggregate.values)) {
  const value = partyDelta(id); assert.ok(value === null || Number.isFinite(value));
}
for (const category of newsCategories) assert.match(newsStoryTones[category], /^#[0-9a-f]{6}$/);
for (const day of newsDayGroups(politicalNews, newsChecked)) {
  for (const item of day.items) {
    const text = storySummary(item); assert.ok(text.length > 0);
    assert.ok(item.summary.startsWith(text), "Story excerpt preserves the verified summary verbatim");
  }
}
console.log("PASS mobile: catalogue, bounded election horizon, edition-compatible deltas and sourced story excerpts.");
