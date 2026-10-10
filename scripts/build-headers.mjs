// Vygeneruje public/_headers z bezpečnostných hlavičiek v next.config.ts (jeden zdroj pravdy). Spúšťať z koreňa webu.
// node scripts/build-headers.mjs          → zapíše súbor
// node scripts/build-headers.mjs --check  → len overí, že súbor je aktuálny (používa verify-security.mjs)
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const { securityHeaders } = await import(pathToFileURL(`${process.cwd()}/next.config.ts`).href);
export const headersFile = [
  "# Bezpečnostné hlavičky pre statické súbory (Cloudflare Workers Static Assets).",
  "# Generuje sa z next.config.ts; zmenu rob tam a spusti node scripts/build-headers.mjs.",
  "/*",
  ...securityHeaders.map(h => `  ${h.key}: ${h.value}`),
  "",
].join("\n");

if (process.argv.includes("--check")) {
  let current = "";
  try { current = readFileSync("public/_headers", "utf8").replace(/\r\n/g, "\n"); } catch { /* chýba */ }
  if (current !== headersFile) { console.error("public/_headers nie je aktuálny: spusti node scripts/build-headers.mjs"); process.exit(1); }
  console.log("public/_headers je aktuálny");
} else {
  writeFileSync("public/_headers", headersFile);
  console.log(`public/_headers: ${securityHeaders.length} hlavičiek`);
}
