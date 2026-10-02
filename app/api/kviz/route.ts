import { env } from "cloudflare:workers";

/*
  API Tridsiatky online (rebríček kvízu dňa, porovnanie, výzvy). Požiadavky odovzdáva jedinej inštancii
  Durable Object QuizBoard (worker/quiz-board.ts, logika lib/quiz-store.ts), ktorá body vždy prepočíta sama.
  GET  ?den=RRRR-MM-DD | ?otazky=id,id | ?vyzva=KÓD  (&hra=kód kola označí vlastný výsledok)
  POST {"a":"hra"|"prezyvka"|"vyzva"|"pridat", …}   len z vlastného webu, najviac 16 kB
  IP adresa sa neukladá; na limit pokusov ide do Durable Object len jej odtlačok s dátumom (SHA-256).
*/
const send = (status: number, json: string) => new Response(json, {
  status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
});
const reply = (status: number, body: unknown) => send(status, JSON.stringify(body));
const unavailable = () => reply(503, { error: "Rebríček je teraz nedostupný. Skús to neskôr." });
// Jedna inštancia pre celý web, údaje ostávajú v EÚ (jurisdikcia Durable Object). Lokálny workerd
// (wrangler dev) jurisdikcie nepozná, tam stačí obyčajná inštancia.
function board() {
  const ns = env.QUIZ;
  if (!ns) return null;
  try { return ns.jurisdiction("eu").getByName("tridsiatka"); }
  catch (e) { if (String(e).includes("not implemented in workerd")) return ns.getByName("tridsiatka"); throw e; }
}

// Verejné čítania (bez vlastného kódu kola) si Worker na 5 s zapamätá, nech pri návale nejde každé otvorenie kvízu do Durable Object.
const recent = new Map<string, { at: number; status: number; json: string }>();

export async function GET(request: Request) {
  try {
    const search = new URL(request.url).search, shared = !new URLSearchParams(search).has("hra"), hit = shared ? recent.get(search) : undefined;
    if (hit && Date.now() - hit.at < 5_000) return send(hit.status, hit.json);
    const stub = board();
    if (!stub) return unavailable();
    const r = await stub.read(search);
    if (shared && r.status === 200) { if (recent.size > 200) recent.clear(); recent.set(search, { at: Date.now(), status: r.status, json: r.json }); }
    return send(r.status, r.json);
  } catch (e) {
    console.error(JSON.stringify({ kviz: "read", error: String(e) }));
    return unavailable();
  }
}

export async function POST(request: Request) {
  // Telo sa prečíta vždy, aj pri odmietnutí: neprečítané telo pokazí ďalšiu požiadavku na tom istom spojení (lokálny proxy vráti 503).
  const text = await request.text();
  const site = request.headers.get("sec-fetch-site"), origin = request.headers.get("origin");
  if (site ? site !== "same-origin" : origin !== null && new URL(origin).host !== new URL(request.url).host) return reply(403, { error: "Požiadavka nie je z Mandátu." });
  if (text.length > 16_000) return reply(413, { error: "Požiadavka je príliš veľká." });
  let input: unknown;
  try { input = JSON.parse(text); } catch { return reply(400, { error: "Neplatná požiadavka." }); }
  if (!input || typeof input !== "object" || Array.isArray(input)) return reply(400, { error: "Neplatná požiadavka." });
  try {
    const stub = board();
    if (!stub) return unavailable();
    const seed = `${request.headers.get("cf-connecting-ip") ?? "lokal"}|${new Date().toISOString().slice(0, 10)}`;
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seed)));
    const client = Array.from(digest.slice(0, 8), b => b.toString(16).padStart(2, "0")).join("");
    const r = await stub.write(input as Record<string, unknown>, client);
    return send(r.status, r.json);
  } catch (e) {
    console.error(JSON.stringify({ kviz: "write", error: String(e) }));
    return unavailable();
  }
}
