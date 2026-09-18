// Obnoví lib/public-finance.json z Eurostatu (verejné API bez kľúča, formát JSON-stat).
// Spustenie: node scripts/fetch-public-finance.mjs
// Eurostat preberá slovenské údaje od Štatistického úradu SR (notifikácia deficitu a dlhu v apríli a októbri),
// preto je jedným zdrojom pre všetky rady a údaje sú porovnateľné s ostatnými krajinami EÚ.
import fs from "node:fs";

const UA = "MandatWeb/1.0 (hobby project on Slovak election polls and public finance; github.com/daepeter-debug/mandat)";
const base = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/";
const FROM = 1995; // od tohto roka Eurostat vedie saldo a dlh SR podľa ESA 2010
const sleep = ms => new Promise(r => setTimeout(r, ms));

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
];

const out = { fetched: new Date().toISOString().slice(0, 10), from: FROM, datasets: {}, years: {} };
for (const [ds, filter, field, label] of series) {
  const qs = Object.entries(filter).map(([k, v]) => `${k}=${v}`).join("&");
  await sleep(800);
  const r = await fetch(`${base}${ds}?${qs}&format=JSON&lang=EN`, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`${field}: HTTP ${r.status}`);
  const j = await r.json();
  const idx = j.dimension.time.category.index;
  const rows = Object.entries(idx).map(([y, i]) => [Number(y), j.value[i]]).filter(([y, v]) => y >= FROM && v !== undefined && v !== null);
  for (const [y, v] of rows) { out.years[y] ??= { year: y }; out.years[y][field] = v; }
  out.datasets[field] = { dataset: ds, label, updated: String(j.updated).slice(0, 10), filter, url: `https://ec.europa.eu/eurostat/databrowser/view/${ds}/default/table?lang=en` };
  console.log(`${field.padEnd(21)} ${ds.padEnd(15)} ${rows[0]?.[0]}–${rows.at(-1)?.[0]} (${rows.length})  aktualizované ${out.datasets[field].updated}`);
}

// Nezamestnanosť: aktuálny rad začína rokom 2009, staršie roky dopĺňa historický rad (označené v dátach).
for (const row of Object.values(out.years)) {
  if (row.unemployment === undefined && row.unemploymentHistoric !== undefined) { row.unemployment = row.unemploymentHistoric; row.unemploymentSource = "historic"; }
  delete row.unemploymentHistoric;
}
out.years = Object.values(out.years).sort((a, b) => a.year - b.year).filter(r => r.deficitPct !== undefined);
// Zapisujeme TypeScript modul (nie JSON), aby ho vedel načítať aj verify-data spúšťaný priamo cez node.
const header = "// Generuje scripts/fetch-public-finance.mjs — needitovať ručne; po obnove spustiť node scripts/verify-data.mjs.\n"
  + "import type { PublicFinanceData } from './public-finance.ts';\n\nexport const publicFinance: PublicFinanceData = ";
fs.writeFileSync(new URL("../lib/public-finance.data.ts", import.meta.url), header + JSON.stringify(out, null, 1) + ";\n");
console.log(`\nlib/public-finance.data.ts: ${out.years.length} rokov (${out.years[0].year}–${out.years.at(-1).year}), stiahnuté ${out.fetched}`);
