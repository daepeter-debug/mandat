import { env } from "cloudflare:workers";
import { isCheckoutSessionId, supportCents } from "@/lib/support";
import { createSupportSession, supportConfig, supportStatus } from "@/lib/support-server";

/*
  Podpora Mandátu cez Stripe Embedded Checkout (docs/podpora-stripe.md).
  GET                → či je podpora zapnutá, režim test/ostrý a publikovateľný kľúč (bez kľúčov: vypnuté)
  GET ?session=cs_…  → stav platby priamo od Stripe (poďakovanie sa ukáže až podľa neho, nie podľa návratu na web)
  POST {"suma": centy} → vytvorí Checkout Session na overenú sumu a vráti client_secret pre vložený formulár
  Záznam o platbách je v Stripe; webhook (./webhook/route.ts) ich len potvrdzuje do logu Workera.
*/
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), {
  status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
});
const unavailable = () => reply(503, { error: "Platbu sa teraz nepodarilo pripraviť. Skúste to o chvíľu." });

// Hrubá brzda proti zahlteniu (v rámci jednej inštancie Workera): najviac 8 nových platieb za 10 minút z jednej adresy.
// Adresa sa nikam neukladá ani neloguje, drží sa len v pamäti do vypršania okna.
const recent = new Map<string, { count: number; until: number }>();
function limited(request: Request) {
  const ip = request.headers.get("cf-connecting-ip") ?? "lokalne", now = Date.now();
  if (recent.size > 5000) for (const [k, v] of recent) if (v.until < now) recent.delete(k);
  const hit = recent.get(ip);
  if (!hit || hit.until < now) { recent.set(ip, { count: 1, until: now + 10 * 60_000 }); return false; }
  return ++hit.count > 8;
}

export async function GET(request: Request) {
  const config = supportConfig(env);
  const session = new URL(request.url).searchParams.get("session");
  if (session === null) {
    if (!config.enabled) return reply(200, { enabled: false });
    return reply(200, { enabled: true, mode: config.mode, publishableKey: config.publishableKey });
  }
  if (!config.enabled || !isCheckoutSessionId(session) || !session.startsWith(`cs_${config.mode}_`)) return reply(404, { error: "Platbu sme nenašli." });
  try {
    const status = await supportStatus(env.STRIPE_SECRET_KEY!, session);
    return status ? reply(200, status) : reply(404, { error: "Platbu sme nenašli." });
  } catch (e) {
    console.error(JSON.stringify({ podpora: "stav", error: String(e) }));
    return unavailable();
  }
}

export async function POST(request: Request) {
  const text = await request.text();
  const site = request.headers.get("sec-fetch-site"), origin = request.headers.get("origin");
  if (site ? site !== "same-origin" : origin !== null && new URL(origin).host !== new URL(request.url).host) return reply(403, { error: "Požiadavka nie je z Mandátu." });
  const config = supportConfig(env);
  if (!config.enabled) return reply(503, { error: "Podpora je zatiaľ vypnutá." });
  if (text.length > 200) return reply(413, { error: "Požiadavka je príliš veľká." });
  let input: { suma?: unknown };
  try { input = JSON.parse(text); } catch { return reply(400, { error: "Neplatná požiadavka." }); }
  // Suma prichádza v centoch a server ju overí sám: celé číslo v povolenom rozpätí (lib/support.ts).
  const cents = typeof input?.suma === "number" && Number.isInteger(input.suma) ? supportCents(input.suma / 100) : null;
  if (cents === null) return reply(400, { error: "Suma musí byť medzi 2 € a 500 €." });
  if (limited(request)) return reply(429, { error: "Priveľa pokusov za krátky čas. Skúste to o pár minút." });
  try {
    const session = await createSupportSession(env.STRIPE_SECRET_KEY!, cents, new URL(request.url).origin);
    console.log(JSON.stringify({ podpora: "nova", mode: config.mode, amount: cents, session: session.id }));
    return reply(200, { id: session.id, clientSecret: session.clientSecret });
  } catch (e) {
    console.error(JSON.stringify({ podpora: "vytvorenie", error: String(e) }));
    return unavailable();
  }
}
