/*
  Podpora Mandátu (dobrovoľný jednorazový príspevok cez Stripe). Spoločné pre prehliadač aj server:
  sumy, hranice a overenie zadanej sumy. Server sumu vždy overí znova (app/api/podpora/route.ts),
  prehliadaču sa neverí. Postup nastavenia Stripe a prechodu na ostré platby: docs/podpora-stripe.md.
*/

export const SUPPORT_AMOUNTS = [3, 5, 10, 20] as const; // eurá, ponuka v okne
export const SUPPORT_DEFAULT = 5;
export const SUPPORT_MIN = 2;    // € · pod 2 € by väčšinu príspevku zjedol poplatok (EÚ karta ~1,5 % + 0,25 €)
export const SUPPORT_MAX = 500;  // € · vyššie sumy len po dohode, nie anonymne cez web
export const SUPPORT_ENDPOINT = "/api/podpora";

/** Stav, ktorý server zverejní prehliadaču (nikdy nie tajný kľúč). */
export type SupportConfig =
  | { enabled: false }
  | { enabled: true; mode: "test" | "live"; publishableKey: string };

/** Výsledok overenia platby na serveri (podľa Stripe, nie podľa toho, že sa človek vrátil na web). */
export type SupportStatus = { state: "paid" | "processing" | "open" | "expired"; amount: number | null };

/** Suma v centoch z čísla v eurách, alebo null mimo hraníc. Akceptuje len celé centy. */
export function supportCents(euros: number): number | null {
  if (!Number.isFinite(euros)) return null;
  const cents = Math.round(euros * 100);
  if (Math.abs(cents - euros * 100) > 1e-6) return null;
  return cents >= SUPPORT_MIN * 100 && cents <= SUPPORT_MAX * 100 ? cents : null;
}

/** Vlastná suma z poľa formulára („7“, „7,50“, „7.5 €“) → centy, alebo null. */
export function parseSupportAmount(input: string): number | null {
  const s = input.replace(/\s|€/g, "").replace(",", ".");
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(s)) return null;
  return supportCents(Number(s));
}

export const formatEuros = (cents: number) =>
  `${(cents / 100).toLocaleString("sk-SK", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })} €`;

/** Kľúč Checkout Session z návratovej adresy Stripe (cs_test_… / cs_live_…). */
export const isCheckoutSessionId = (id: string) => /^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(id);
