import { env } from "cloudflare:workers";
import { SUPPORT_SOURCE, verifyStripeSignature } from "@/lib/support-server";

/*
  Webhook Stripe pre podporu Mandátu (adresa …/api/podpora/webhook, tajomstvo STRIPE_WEBHOOK_SECRET).
  Jediný dôkaz, že platba prešla, je podpísaná udalosť od Stripe, nie návrat človeka na web.
  Záznam ide do logu Workera bez osobných údajov (žiadny e-mail, meno ani karta); účtovná evidencia je v Stripe.
  Odoberané udalosti: checkout.session.completed, .async_payment_succeeded, .async_payment_failed, .expired.
*/
type Event = { id: string; type: string; livemode: boolean; data: { object: { id?: string; amount_total?: number | null; currency?: string; payment_status?: string; metadata?: Record<string, string> | null } } };

const done = (status = 200) => new Response(null, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const payload = await request.text();
  const secret = env.STRIPE_WEBHOOK_SECRET;
  // Bez tajomstva vrátime 503: Stripe udalosť zopakuje, keď už bude nastavené.
  if (!secret) return done(503);
  if (payload.length > 256_000 || !(await verifyStripeSignature(payload, request.headers.get("stripe-signature"), secret))) return done(400);
  let event: Event;
  try { event = JSON.parse(payload); } catch { return done(400); }
  const s = event.data?.object ?? {};
  if (s.metadata?.zdroj !== SUPPORT_SOURCE) return done();
  const result = event.type === "checkout.session.completed" ? (s.payment_status === "paid" ? "zaplatene" : "caka-na-platbu")
    : event.type === "checkout.session.async_payment_succeeded" ? "zaplatene"
    : event.type === "checkout.session.async_payment_failed" ? "zlyhalo"
    : event.type === "checkout.session.expired" ? "vyprsalo" : null;
  if (result) console.log(JSON.stringify({ podpora: result, mode: event.livemode ? "live" : "test", amount: s.amount_total, currency: s.currency, session: s.id, event: event.id }));
  return done();
}
