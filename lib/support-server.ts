import { formatEuros, type SupportConfig, type SupportStatus } from "./support.ts";

/*
  Serverová časť podpory: volania Stripe REST API cez fetch (bez knižnice) a overenie podpisu webhooku.
  Kľúče prichádzajú len ako tajomstvá Workera (wrangler secret put …, lokálne .dev.vars); do prehliadača ide
  iba publikovateľný kľúč. Ostré platby sa zapnú až pri ostrých kľúčoch A premennej PODPORA_OSTRA=ano.
  Súbor nemá závislosť na cloudflare:workers, aby sa dal skúšať v Node (scripts/verify-support.mjs).
*/

export type SupportEnv = {
  STRIPE_SECRET_KEY?: string;
  STRIPE_PUBLISHABLE_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  PODPORA_OSTRA?: string;
};

// Pevná verzia API: parametre nižšie sú overené pre túto verziu, nezávisle od predvolenej verzie účtu.
export const STRIPE_API_VERSION = "2025-03-31.basil";
const STRIPE_API = "https://api.stripe.com/v1";
export const SUPPORT_SOURCE = "mandat-podpora";

/** Režim podľa kľúčov. Nezhoda test/ostrý medzi kľúčmi alebo ostrý bez výslovného zapnutia = vypnuté. */
export function supportConfig(env: SupportEnv): SupportConfig & { reason?: string } {
  const secret = env.STRIPE_SECRET_KEY ?? "", publishable = env.STRIPE_PUBLISHABLE_KEY ?? "";
  if (!secret || !publishable) return { enabled: false, reason: "chýbajú kľúče" };
  const secretMode = /^(sk|rk)_test_/.test(secret) ? "test" : /^(sk|rk)_live_/.test(secret) ? "live" : null;
  const publishableMode = publishable.startsWith("pk_test_") ? "test" : publishable.startsWith("pk_live_") ? "live" : null;
  if (!secretMode || secretMode !== publishableMode) return { enabled: false, reason: "kľúče nesedia (test/ostrý)" };
  if (secretMode === "live" && env.PODPORA_OSTRA !== "ano") return { enabled: false, reason: "ostré platby nie sú zapnuté (PODPORA_OSTRA)" };
  return { enabled: true, mode: secretMode, publishableKey: publishable };
}

/** Telo požiadavky Stripe vo formáte application/x-www-form-urlencoded s vnorenými kľúčmi (a[b][c]=…). */
export function stripeForm(params: Record<string, unknown>, prefix = "", out = new URLSearchParams()) {
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const name = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) value.forEach((v, i) => typeof v === "object" ? stripeForm(v as Record<string, unknown>, `${name}[${i}]`, out) : out.append(`${name}[${i}]`, String(v)));
    else if (typeof value === "object") stripeForm(value as Record<string, unknown>, name, out);
    else out.append(name, String(value));
  }
  return out;
}

async function stripe<T>(secret: string, method: "GET" | "POST", path: string, params?: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${STRIPE_API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${secret}`, "Stripe-Version": STRIPE_API_VERSION, ...(params ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body: params ? stripeForm(params) : undefined,
  });
  const json = await response.json() as T & { error?: { type?: string; code?: string; message?: string } };
  // Do logu len typ a kód chyby, nikdy kľúč ani údaje platiteľa.
  if (!response.ok) throw new Error(`Stripe ${response.status} ${json.error?.type ?? ""} ${json.error?.code ?? ""}`.trim());
  return json;
}

/*
  Ponúkané metódy: karta (Apple Pay a Google Pay sú v Checkout peňaženky nad kartou, ukážu sa podľa zariadenia
  a registrovanej domény) a Revolut Pay. Ostatné metódy z nastavení Stripe (Klarna, Link, bankové prevody…) sa
  neponúknu ani omylom. Ak Revolut Pay v účte Stripe nie je zapnutý, platba sa pripraví len s kartou.
*/
export const SUPPORT_METHODS = ["card", "revolut_pay"] as const;

/** Parametre Checkout Session pre vložený (embedded) platobný formulár. Samostatne kvôli kontrolám. */
export function supportSessionParams(cents: number, origin: string, now = Date.now(), methods: readonly string[] = SUPPORT_METHODS) {
  return {
    ui_mode: "embedded",
    mode: "payment",
    payment_method_types: [...methods],
    // Karta, Apple Pay a Google Pay dokončia platbu bez presmerovania; Revolut Pay na mobile odbočí do aplikácie Revolut
    // a vráti sa na return_url, kde stav platby overí server (SupportHost → ?podpora=hotovo).
    redirect_on_completion: "if_required",
    return_url: `${origin}/?podpora=hotovo&session_id={CHECKOUT_SESSION_ID}`,
    locale: "sk",
    submit_type: "pay",
    expires_at: Math.floor(now / 1000) + 30 * 60, // nedokončená platba vyprší o 30 min (najkratšia povolená doba)
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: cents,
        product_data: { name: "Dobrovoľný príspevok na Mandát", description: "Jednorazový príspevok na prevádzku a rozvoj nezávislého webu Mandát." },
      },
    }],
    custom_text: { submit: { message: "Dobrovoľný jednorazový príspevok, nie predplatné. Nejde o dar charitatívnej organizácii ani politickej strane." } },
    metadata: { zdroj: SUPPORT_SOURCE },
    payment_intent_data: { description: `Dobrovoľný príspevok na Mandát (${formatEuros(cents)})`, metadata: { zdroj: SUPPORT_SOURCE } },
  };
}

export async function createSupportSession(secret: string, cents: number, origin: string) {
  const create = (methods: readonly string[]) => stripe<{ id: string; client_secret: string }>(secret, "POST", "/checkout/sessions", supportSessionParams(cents, origin, Date.now(), methods));
  let session;
  try { session = await create(SUPPORT_METHODS); }
  catch (e) {
    // Neplatná požiadavka (napr. Revolut Pay nie je v účte zapnutý): zopakuje sa len s kartou, chyba ostane v logu.
    if (!String(e).includes("Stripe 400")) throw e;
    console.error(JSON.stringify({ podpora: "metody", error: String(e), fallback: "card" }));
    session = await create(["card"]);
  }
  return { id: session.id, clientSecret: session.client_secret };
}

type Session = { status: "open" | "complete" | "expired" | null; payment_status: "paid" | "unpaid" | "no_payment_required"; amount_total: number | null; metadata?: Record<string, string> | null };

/** Stav platby priamo od Stripe. Cudzie sessions (bez našej značky) sa tvária ako neznáme. */
export async function supportStatus(secret: string, id: string): Promise<SupportStatus | null> {
  const s = await stripe<Session>(secret, "GET", `/checkout/sessions/${encodeURIComponent(id)}`);
  if (s.metadata?.zdroj !== SUPPORT_SOURCE) return null;
  const state = s.status === "complete" ? (s.payment_status === "paid" ? "paid" : "processing") : s.status === "expired" ? "expired" : "open";
  return { state, amount: s.amount_total };
}

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
function sameText(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
  Podpis webhooku podľa Stripe: hlavička „t=…,v1=…“, HMAC-SHA256 tajomstva nad „t.telo“.
  Odmietne starší podpis ako 5 minút (ochrana pred zopakovaním).
*/
export async function verifyStripeSignature(payload: string, header: string | null, secret: string, nowSeconds = Date.now() / 1000, tolerance = 300) {
  if (!header || !secret) return false;
  const parts = header.split(",").map(p => p.trim().split("="));
  const t = Number(parts.find(([k]) => k === "t")?.[1]);
  const signatures = parts.filter(([k]) => k === "v1").map(([, v]) => v ?? "");
  if (!Number.isFinite(t) || !signatures.length || Math.abs(nowSeconds - t) > tolerance) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${payload}`)));
  return signatures.some(s => sameText(s, expected));
}
