// Obnoví lib/public-finance.data.ts z Eurostatu (verejné API bez kľúča, formát JSON-stat).
// Spustenie: node scripts/fetch-public-finance.mjs
// Eurostat preberá slovenské údaje od Štatistického úradu SR (notifikácia deficitu a dlhu v apríli a októbri),
// preto je jedným zdrojom pre všetky rady a údaje sú porovnateľné s ostatnými krajinami EÚ.
import fs from "node:fs";

const UA = "MandatWeb/1.0 (hobby project on Slovak election polls and public finance; github.com/daepeter-debug/mandat)";
const base = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/";
const FROM = 1995; // od tohto roka Eurostat vedie saldo a dlh SR podľa ESA 2010
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Dekóder JSON-stat: pre každú kombináciu kategórií vráti hodnotu (index = súčet pozícií × krok dimenzie).
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
async function fetchJson(ds, filter) {
  const qs = Object.entries(filter).flatMap(([k, v]) => (Array.isArray(v) ? v : [v]).map(x => `${k}=${x}`)).join("&");
  await sleep(800);
  const r = await fetch(`${base}${ds}?${qs}&format=JSON&lang=EN`, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`${ds}: HTTP ${r.status}`);
  const j = await r.json();
  if (!j.dimension) throw new Error(`${ds}: ${j.error?.[0]?.label ?? "neplatná odpoveď"}`);
  return j;
}
const browser = ds => `https://ec.europa.eu/eurostat/databrowser/view/${ds}/default/table?lang=en`;

/* ---------- Slovensko po rokoch ---------- */
// [dataset, filtre, pole vo výstupe, popis]
const series = [
  ["gov_10dd_edpt1", { geo: "SK", sector: "S13", na_item: "B9", unit: "PC_GDP" }, "deficitPct", "Saldo verejnej správy (B.9), % HDP"],
  ["gov_10dd_edpt1", { geo: "SK", sector: "S13", na_item: "B9", unit: "MIO_EUR" }, "deficitMeur", "Saldo verejnej správy (B.9), mil. €"],
  ["gov_10dd_edpt1", { geo: "SK", sector: "S13", na_item: "GD", unit: "PC_GDP" }, "debtPct", "Hrubý dlh verejnej správy (maastrichtský), % HDP"],
  ["gov_10dd_edpt1", { geo: "SK", sector: "S13", na_item: "GD", unit: "MIO_EUR" }, "debtMeur", "Hrubý dlh verejnej správy (maastrichtský), mil. €"],
  ["gov_10a_main", { geo: "SK", sector: "S13", na_item: "TE", unit: "PC_GDP" }, "expenditurePct", "Výdavky verejnej správy, % HDP"],
  ["gov_10a_main", { geo: "SK", sector: "S13", na_item: "TR", unit: "PC_GDP" }, "revenuePct", "Príjmy verejnej správy, % HDP"],
  ["gov_10a_main", { geo: "SK", sector: "S13", na_item: "D41PAY", unit: "PC_GDP" }, "interestPct", "Úroky zaplatené z dlhu, % HDP"],
  ["nama_10_gdp", { geo: "SK", na_item: "B1GQ", unit: "CLV_PCH_PRE" }, "gdpGrowth", "Reálny rast HDP, %"],
  ["nama_10_gdp", { geo: "SK", na_item: "B1GQ", unit: "CP_MEUR" }, "gdpMeur", "HDP v bežných cenách, mil. €"],
  ["une_rt_a", { geo: "SK", age: "Y15-74", sex: "T", unit: "PC_ACT" }, "unemployment", "Miera nezamestnanosti 15–74 rokov, %"],
  ["une_rt_a_h", { geo: "SK", age: "Y15-74", sex: "T", unit: "PC_ACT" }, "unemploymentHistoric", "Miera nezamestnanosti 15–74 rokov, historický rad pred zmenou metodiky 2021, %"],
  ["prc_hicp_aind", { geo: "SK", coicop: "CP00", unit: "RCH_A_AVG" }, "inflation", "Inflácia HICP, priemerná ročná miera, %"],
  ["demo_pjan", { geo: "SK", age: "TOTAL", sex: "T" }, "population", "Obyvateľstvo k 1. januáru"],
  // Životná úroveň
  ["nama_10_pc", { geo: "SK", na_item: "B1GQ", unit: "PC_EU27_2020_HAB_MPPS_CP" }, "gdpPcPps", "HDP na obyvateľa v parite kúpnej sily, EÚ27 = 100"],
  ["earn_mw_cur", { geo: "SK", currency: "EUR" }, "minWage", "Minimálna mesačná mzda, € (stav v januári)"],
  // earn_nt_net (čistý príjem) zámerne nepoužívame: Eurostat má v roku 2024 zlom radu (flag „b“, +30 % za rok), roky by neboli porovnateľné.
  ["ilc_di03", { geo: "SK", age: "TOTAL", sex: "T", statinfo: "MED_EI", unit: "EUR" }, "medianIncome", "Medián ekvivalizovaného disponibilného príjmu, € za rok"],
  ["ilc_li02", { geo: "SK", age: "TOTAL", sex: "T", statinfo: "MED_EI", unit: "PC", rskpovth: "B_60" }, "povertyRate", "Miera rizika chudoby (pod 60 % mediánu), %"],
  ["lfsi_emp_a", { geo: "SK", age: "Y20-64", sex: "T", indic_em: "EMP_LFS", unit: "PC_POP" }, "employment", "Miera zamestnanosti 20–64 rokov, %"],
];

const out = { fetched: new Date().toISOString().slice(0, 10), from: FROM, datasets: {}, years: {}, compare: { geos: [], indicators: {}, rows: [] } };
for (const [ds, filter, field, label] of series) {
  const j = await fetchJson(ds, filter);
  const rows = decode(j).map(r => {
    // polročné rady (minimálna mzda): berieme stav z januára, kľúč "2024-S1" → 2024
    const t = String(r.time); if (/-S2$/.test(t)) return null;
    return [Number(t.slice(0, 4)), r.value];
  }).filter(r => r && r[0] >= FROM);
  for (const [y, v] of rows) { out.years[y] ??= { year: y }; out.years[y][field] = v; }
  out.datasets[field] = { dataset: ds, label, updated: String(j.updated).slice(0, 10), filter, url: browser(ds) };
  console.log(`${field.padEnd(21)} ${ds.padEnd(15)} ${rows[0]?.[0]}–${rows.at(-1)?.[0]} (${rows.length})  aktualizované ${out.datasets[field].updated}`);
}

// Nezamestnanosť: aktuálny rad začína rokom 2009, staršie roky dopĺňa historický rad (označené v dátach).
for (const row of Object.values(out.years)) {
  if (row.unemployment === undefined && row.unemploymentHistoric !== undefined) { row.unemployment = row.unemploymentHistoric; row.unemploymentSource = "historic"; }
  delete row.unemploymentHistoric;
}
out.years = Object.values(out.years).sort((a, b) => a.year - b.year).filter(r => r.deficitPct !== undefined);

/* ---------- Porovnanie s EÚ a susedmi (posledný dostupný rok každého ukazovateľa) ---------- */
const geos = [["SK", "Slovensko"], ["CZ", "Česko"], ["PL", "Poľsko"], ["HU", "Maďarsko"], ["AT", "Rakúsko"], ["EA20", "Eurozóna"], ["EU27_2020", "EÚ 27"]];
const compareSeries = [
  ["gov_10dd_edpt1", { sector: "S13", na_item: "B9", unit: "PC_GDP" }, "deficitPct", "Saldo verejnej správy, % HDP"],
  ["gov_10dd_edpt1", { sector: "S13", na_item: "GD", unit: "PC_GDP" }, "debtPct", "Dlh verejnej správy, % HDP"],
  ["nama_10_gdp", { na_item: "B1GQ", unit: "CLV_PCH_PRE" }, "gdpGrowth", "Reálny rast HDP, %"],
  ["prc_hicp_aind", { coicop: "CP00", unit: "RCH_A_AVG" }, "inflation", "Inflácia HICP, %"],
  ["une_rt_a", { age: "Y15-74", sex: "T", unit: "PC_ACT" }, "unemployment", "Nezamestnanosť 15–74, %"],
  ["nama_10_pc", { na_item: "B1GQ", unit: "PC_EU27_2020_HAB_MPPS_CP" }, "gdpPcPps", "HDP na obyvateľa v PPS, EÚ = 100"],
];
out.compare.geos = geos.map(([code, label]) => ({ code, label }));
const byGeo = Object.fromEntries(geos.map(([code]) => [code, { geo: code }]));
for (const [ds, filter, field, label] of compareSeries) {
  const j = await fetchJson(ds, { geo: geos.map(g => g[0]), ...filter, sinceTimePeriod: 2019 });
  const rows = decode(j);
  // spoločný rok = posledný rok, ktorý majú všetky krajiny; ak taký nie je, vezmeme posledný rok Slovenska
  const yearsPerGeo = Object.fromEntries(geos.map(([g]) => [g, rows.filter(r => r.geo === g).map(r => Number(r.time))]));
  const common = [...new Set(yearsPerGeo.SK)].filter(y => geos.every(([g]) => yearsPerGeo[g].includes(y))).sort((a, b) => b - a)[0] ?? Math.max(...yearsPerGeo.SK);
  for (const [g] of geos) { const hit = rows.find(r => r.geo === g && Number(r.time) === common); if (hit) byGeo[g][field] = hit.value; }
  out.compare.indicators[field] = { label, year: common, dataset: ds, url: browser(ds), updated: String(j.updated).slice(0, 10) };
  console.log(`porovnanie ${field.padEnd(12)} rok ${common}  ${geos.map(([g]) => `${g}=${byGeo[g][field] ?? "—"}`).join(" ")}`);
}
out.compare.rows = geos.map(([g]) => byGeo[g]);

// Zapisujeme TypeScript modul (nie JSON), aby ho vedel načítať aj verify-data spúšťaný priamo cez node.
const header = "// Generuje scripts/fetch-public-finance.mjs — needitovať ručne; po obnove spustiť node scripts/verify-data.mjs.\n"
  + "import type { PublicFinanceData } from './public-finance.ts';\n\nexport const publicFinance: PublicFinanceData = ";
fs.writeFileSync(new URL("../lib/public-finance.data.ts", import.meta.url), header + JSON.stringify(out, null, 1) + ";\n");
console.log(`\nlib/public-finance.data.ts: ${out.years.length} rokov (${out.years[0].year}–${out.years.at(-1).year}), porovnanie ${geos.length} celkov, stiahnuté ${out.fetched}`);
