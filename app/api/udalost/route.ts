import { TRACK_EVENTS } from "@/lib/track";

/*
  Príjem anonymnej štatistiky (lib/track.ts). Záznam ide len do logu Workera (Cloudflare Workers Logs,
  pozorovateľnosť je zapnutá vo wrangler.preview.jsonc); nič sa neukladá inde a neposiela ďalej.
  Prijíma sa len udalosť zo zoznamu a krátky údaj z písmen, číslic a pomlčiek; požiadavky z cudzích webov sa zahodia.
  Prehľad: Cloudflare → Workers & Pages → mandat-preview → Observability, filter na pole „mandat“.
*/
const events = new Set<string>(TRACK_EVENTS);
const noContent = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  const origin = request.headers.get("origin");
  if (site ? site !== "same-origin" : origin !== null && new URL(origin).host !== new URL(request.url).host) return noContent();
  const text = (await request.text()).slice(0, 500);
  let data: { e?: unknown; d?: unknown; m?: unknown; t?: unknown; a?: unknown };
  try { data = JSON.parse(text); } catch { return noContent(); }
  if (typeof data.e !== "string" || !events.has(data.e)) return noContent();
  const detail = typeof data.d === "string" && /^[a-z0-9-]{1,32}$/i.test(data.d) ? data.d : undefined;
  const cf = (request as Request & { cf?: { country?: string } }).cf;
  console.log(JSON.stringify({
    mandat: data.e,
    detail,
    device: data.m === true ? "mobil" : "pocitac",
    theme: data.t === true ? "tmavy" : "svetly",
    app: data.a === true,
    country: typeof cf?.country === "string" ? cf.country : undefined,
  }));
  return noContent();
}
