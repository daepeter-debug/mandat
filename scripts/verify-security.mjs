// Bezpečnosť webu (next.config.ts, public/_headers): bezpečnostné hlavičky, prísna CSP, žiadne tajomstvá v kóde
// pre prehliadač a v repe, len schválené miesta s vkladaným HTML. Spúšťať z koreňa webu.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { contentSecurityPolicy: csp, securityHeaders } = await import(pathToFileURL(`${process.cwd()}/next.config.ts`).href);
const header = name => securityHeaders.find(h => h.key === name)?.value;

// Hlavičky: CSP, ochrana pred vložením do cudzej stránky, MIME, referrer, HTTPS.
for (const name of ["Content-Security-Policy", "X-Frame-Options", "X-Content-Type-Options", "Referrer-Policy", "Strict-Transport-Security"]) assert(header(name), `chýba hlavička ${name}`);
assert.equal(header("X-Frame-Options"), "DENY");
assert.equal(header("X-Content-Type-Options"), "nosniff");
const directives = Object.fromEntries(csp.split(";").map(d => d.trim().split(/\s+/)).map(([k, ...v]) => [k, v]));
assert.deepEqual(directives["frame-ancestors"], ["'none'"], "web nesmie ísť vložiť do cudzej stránky");
assert.deepEqual(directives["object-src"], ["'none'"]);
assert.deepEqual(directives["base-uri"], ["'self'"]);
assert.deepEqual(directives["form-action"], ["'self'"]);
assert.deepEqual(directives["default-src"], ["'self'"]);
// Skripty a rámy len z vlastného webu a zo Stripe; žiadne eval ani ľubovoľné https:.
const allowedExternal = /^https:\/\/(\*\.)?(js\.|hooks\.|checkout\.|api\.)?stripe\.com$/;
for (const d of ["script-src", "frame-src", "connect-src", "img-src"]) {
  for (const src of directives[d]) {
    if (src.startsWith("'") || src === "blob:" || src === "data:") continue;
    assert.match(src, allowedExternal, `${d}: nepovolený zdroj ${src}`);
  }
}
assert(!directives["script-src"].includes("'unsafe-eval'"), "script-src nesmie povoliť eval");
assert(!directives["script-src"].some(s => s === "https:" || s === "*" || s === "data:" || s === "blob:"), "script-src je príliš široký");

// public/_headers pre statické súbory musí sedieť s next.config.ts.
execFileSync(process.execPath, ["scripts/build-headers.mjs", "--check"], { stdio: "inherit" });

// Vkladané HTML (dangerouslySetInnerHTML) len na schválených miestach so statickým obsahom.
const allowedHtml = new Set(["app/layout.tsx", "components/ui/chart.tsx"]);
const walk = dir => readdirSync(dir).flatMap(f => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p.replace(/\\/g, "/")]; });
const source = ["app", "components", "lib", "worker"].flatMap(walk).filter(f => /\.(tsx?|mjs|js)$/.test(f));
for (const f of source) {
  const text = readFileSync(f, "utf8");
  if (/dangerouslySetInnerHTML|\.innerHTML\s*=|outerHTML\s*=|document\.write\(|new Function\(|\beval\(/.test(text)) assert(allowedHtml.has(f), `${f}: vkladané HTML alebo eval mimo schválených miest`);
  // Tajné kľúče nikdy v zdrojovom kóde (len ich mená v serverových súboroch).
  assert(!/(sk|rk)_(live|test)_[A-Za-z0-9]{16,}|whsec_[A-Za-z0-9]{16,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(text), `${f}: vyzerá ako tajný kľúč`);
}

// .gitignore drží lokálne tajomstvá mimo repa.
const gitignore = readFileSync(".gitignore", "utf8").split(/\r?\n/);
for (const p of [".env*", "*.env", ".dev.vars*", "*.pem", "*.key"]) assert(gitignore.includes(p), `.gitignore: chýba ${p}`);

console.log(`Bezpečnosť: ${securityHeaders.length} hlavičiek, CSP s ${Object.keys(directives).length} pravidlami, ${source.length} súborov bez tajomstiev a bez neschváleného HTML.`);
