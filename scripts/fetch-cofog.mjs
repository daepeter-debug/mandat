// Obnoví lib/cofog.data.ts: výdavky verejnej správy SR podľa funkcií (COFOG) z Eurostatu (gov_10a_exp, S13, TE, mil. €).
// Spustenie: node scripts/fetch-cofog.mjs
// Používa ich kalkulačka „Kam idú tvoje dane“ (lib/tax-receipt.ts): odvody a daň sa rozdelia v rovnakom pomere,
// v akom verejná správa míňala v poslednom roku s údajmi.
import fs from "node:fs";

const UA = "MandatWeb/1.0 (hobby project on Slovak election polls and public finance; github.com/daepeter-debug/mandat)";
const DATASET = "gov_10a_exp";
const CODES = ["TOTAL", "GF01", "GF0107", "GF02", "GF03", "GF04", "GF05", "GF06", "GF07", "GF08", "GF09", "GF10", "GF1002"];
const SINCE = 2019;

function decode(j) {
  const dims = j.id, sizes = j.size;
  const strides = dims.map((_, d) => sizes.slice(d + 1).reduce((a, b) => a * b, 1));
  const cats = dims.map(d => Object.entries(j.dimension[d].category.index).sort((a, b) => a[1] - b[1]).map(([code]) => code));
  const out = [];
  const walk = (d, pos, key) => {
    if (d === dims.length) { const v = j.value[pos]; if (v !== undefined && v !== null) out.push({ ...key, value: v }); return; }
    cats[d].forEach((code, i) => walk(d + 1, pos + i * strides[d], { ...key, [dims[d]]: code }));
  };
  walk(0, 0, {});
  return out;
}

const qs = [["geo", "SK"], ["sector", "S13"], ["na_item", "TE"], ["unit", "MIO_EUR"], ...CODES.map(c => ["cofog99", c]), ["sinceTimePeriod", String(SINCE)], ["format", "JSON"], ["lang", "EN"]].map(([k, v]) => `${k}=${v}`).join("&");
const r = await fetch(`https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${DATASET}?${qs}`, { headers: { "User-Agent": UA } });
if (!r.ok) throw new Error(`${DATASET}: HTTP ${r.status}`);
const j = await r.json();
if (!j.dimension) throw new Error(`${DATASET}: ${j.error?.[0]?.label ?? "neplatná odpoveď"}`);

const byYear = {};
for (const row of decode(j)) (byYear[row.time] ??= {})[row.cofog99] = row.value;
const years = Object.keys(byYear).map(Number).filter(y => CODES.every(c => byYear[y][c] !== undefined)).sort((a, b) => a - b);
if (!years.length) throw new Error("žiadny rok s úplnými údajmi");
const rows = years.map(y => ({ year: y, ...Object.fromEntries(CODES.map(c => [c, byYear[y][c]])) }));
const latest = rows.at(-1);
const sum = CODES.filter(c => /^GF\d\d$/.test(c)).reduce((a, c) => a + latest[c], 0);
if (Math.abs(sum - latest.TOTAL) > 1) throw new Error(`súčet funkcií ${sum} ≠ spolu ${latest.TOTAL}`);

const data = {
  dataset: DATASET,
  label: "Výdavky verejnej správy (S13) podľa funkcií COFOG, spolu (TE), mil. €",
  url: `https://ec.europa.eu/eurostat/databrowser/view/${DATASET}/default/table?lang=en`,
  updated: String(j.updated).slice(0, 10),
  fetched: new Date().toISOString().slice(0, 10),
  rows,
};
const ts = `// Generované scripts/fetch-cofog.mjs z Eurostatu (${DATASET}, aktualizované ${data.updated}) — needitovať ručne.\nexport const cofogData = ${JSON.stringify(data, null, 2)} as const;\n`;
fs.writeFileSync("lib/cofog.data.ts", ts);
console.log(`lib/cofog.data.ts: roky ${years[0]}–${latest.year}, spolu ${latest.TOTAL} mil. € v roku ${latest.year}, aktualizované ${data.updated}`);
