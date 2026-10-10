// Podpora cez Stripe (lib/support.ts, lib/support-server.ts, docs/podpora-stripe.md): overenie sumy, zapínanie režimov,
// parametre Checkout Session a podpis webhooku. Bez siete a bez skutočných kľúčov (reťazce nižšie sú len tvarové ukážky).
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { SUPPORT_AMOUNTS, SUPPORT_MAX, SUPPORT_MIN, formatEuros, isCheckoutSessionId, parseSupportAmount, supportCents } from "../lib/support.ts";
import { STRIPE_API_VERSION, SUPPORT_SOURCE, stripeForm, supportConfig, supportSessionParams, verifyStripeSignature } from "../lib/support-server.ts";
import { TRACK_EVENTS } from "../lib/track.ts";

// Sumy: ponuka v hraniciach, vlastná suma len v celých centoch a v rozpätí.
for (const a of SUPPORT_AMOUNTS) assert.equal(supportCents(a), a * 100);
assert.equal(SUPPORT_MIN, 2); assert.equal(SUPPORT_MAX, 500);
assert.equal(parseSupportAmount("7"), 700);
assert.equal(parseSupportAmount("7,50"), 750);
assert.equal(parseSupportAmount(" 12.5 € "), 1250);
assert.equal(parseSupportAmount("0,29"), null);
assert.equal(parseSupportAmount("1,99"), null);
assert.equal(parseSupportAmount("2"), 200);
assert.equal(parseSupportAmount("500"), 50000);
assert.equal(parseSupportAmount("500,01"), null);
for (const bad of ["", "abc", "-5", "5,555", "1e3", "5.", "10 000", "Infinity", "0x10"]) assert.equal(parseSupportAmount(bad), null, `„${bad}“ nemá prejsť`);
assert.equal(supportCents(3.333), null);
assert.equal(supportCents(Number.NaN), null);
assert.equal(formatEuros(500), "5 €");
assert.equal(formatEuros(750).replace(/\s/g, " "), "7,50 €");

// Režimy: bez kľúčov vypnuté, nezhoda test/ostrý vypnutá, ostré len s PODPORA_OSTRA=ano. Do prehliadača ide len pk_.
assert.equal(supportConfig({}).enabled, false);
assert.equal(supportConfig({ STRIPE_SECRET_KEY: "sk_test_ukazka" }).enabled, false);
assert.deepEqual(supportConfig({ STRIPE_SECRET_KEY: "sk_test_ukazka", STRIPE_PUBLISHABLE_KEY: "pk_test_ukazka" }), { enabled: true, mode: "test", publishableKey: "pk_test_ukazka" });
assert.equal(supportConfig({ STRIPE_SECRET_KEY: "rk_test_ukazka", STRIPE_PUBLISHABLE_KEY: "pk_test_ukazka" }).enabled, true, "obmedzený kľúč rk_ je povolený");
assert.equal(supportConfig({ STRIPE_SECRET_KEY: "sk_test_ukazka", STRIPE_PUBLISHABLE_KEY: "pk_live_ukazka" }).enabled, false);
assert.equal(supportConfig({ STRIPE_SECRET_KEY: "sk_live_ukazka", STRIPE_PUBLISHABLE_KEY: "pk_live_ukazka" }).enabled, false, "ostré bez PODPORA_OSTRA");
assert.equal(supportConfig({ STRIPE_SECRET_KEY: "sk_live_ukazka", STRIPE_PUBLISHABLE_KEY: "pk_live_ukazka", PODPORA_OSTRA: "true" }).enabled, false, "len presne „ano“");
assert.equal(supportConfig({ STRIPE_SECRET_KEY: "sk_live_ukazka", STRIPE_PUBLISHABLE_KEY: "pk_live_ukazka", PODPORA_OSTRA: "ano" }).mode, "live");
assert(!JSON.stringify(supportConfig({ STRIPE_SECRET_KEY: "sk_test_ukazka", STRIPE_PUBLISHABLE_KEY: "pk_test_ukazka" })).includes("sk_"), "tajný kľúč nesmie ísť von");

// Parametre Checkout Session.
const params = supportSessionParams(1250, "https://mandat.example", Date.UTC(2026, 9, 10));
assert.equal(params.ui_mode, "embedded"); assert.deepEqual(params.payment_method_types, ["card", "revolut_pay"], "karta (+ Apple Pay a Google Pay) a Revolut Pay"); assert.deepEqual(supportSessionParams(500, "https://mandat.example", 0, ["card"]).payment_method_types, ["card"], "záložný variant len s kartou"); assert.equal(params.mode, "payment"); assert.equal(params.locale, "sk");
assert.equal(params.line_items[0].price_data.currency, "eur"); assert.equal(params.line_items[0].price_data.unit_amount, 1250);
assert.equal(params.return_url, "https://mandat.example/?podpora=hotovo&session_id={CHECKOUT_SESSION_ID}");
assert.equal(params.expires_at, Date.UTC(2026, 9, 10) / 1000 + 1800);
assert.equal(params.metadata.zdroj, SUPPORT_SOURCE); assert.equal(params.payment_intent_data.metadata.zdroj, SUPPORT_SOURCE);
assert(!/\bdar\b(?! charitat)/i.test(params.line_items[0].price_data.product_data.name), "príspevok sa nemá volať dar");
assert.match(STRIPE_API_VERSION, /^\d{4}-\d{2}-\d{2}\.\w+$/);
const form = stripeForm(params);
assert.equal(form.get("line_items[0][price_data][unit_amount]"), "1250");
assert.equal(form.get("line_items[0][price_data][product_data][name]"), "Dobrovoľný príspevok na Mandát");
assert.equal(form.get("metadata[zdroj]"), SUPPORT_SOURCE);
assert.equal(form.get("payment_method_options[card][request_three_d_secure]"), "any", "3D Secure vždy, keď ho karta podporuje");
assert.equal(form.get("wallet_options[link][display]"), "never", "bez tlačidla Link");
assert.equal(supportSessionParams(500, "https://mandat.example", 0, ["card"], false).wallet_options, undefined, "záložný variant bez skrytia Linku");
assert.equal(form.get("payment_method_types[0]"), "card"); assert.equal(form.get("payment_method_types[1]"), "revolut_pay"); assert.equal(form.get("payment_method_types[2]"), null);
assert.equal(form.get("custom_text[submit][message]"), params.custom_text.submit.message);
assert(params.custom_text.submit.message.length <= 1200);

// Návratová adresa: len tvar Checkout Session.
assert(isCheckoutSessionId("cs_test_a1B2c3D4e5F6g7H8"));
assert(!isCheckoutSessionId("cs_test_short")); assert(!isCheckoutSessionId("pi_test_a1B2c3D4e5F6g7H8")); assert(!isCheckoutSessionId("cs_test_a1B2c3D4e5/../x"));

// Podpis webhooku: platný, pozmenené telo, cudzie tajomstvo, starý podpis, chýbajúca hlavička.
const secret = "whsec_ukazka_len_pre_test";
const body = JSON.stringify({ id: "evt_1", type: "checkout.session.completed", data: { object: { id: "cs_test_x", metadata: { zdroj: SUPPORT_SOURCE } } } });
const now = 1_791_600_000;
const sign = (t, payload, key = secret) => `t=${t},v1=${createHmac("sha256", key).update(`${t}.${payload}`).digest("hex")}`;
assert.equal(await verifyStripeSignature(body, sign(now, body), secret, now), true);
assert.equal(await verifyStripeSignature(body, `${sign(now, body)},v0=abc`, secret, now), true, "ďalšie schémy v hlavičke nevadia");
assert.equal(await verifyStripeSignature(body.replace("evt_1", "evt_2"), sign(now, body), secret, now), false);
assert.equal(await verifyStripeSignature(body, sign(now, body, "whsec_ina"), secret, now), false);
assert.equal(await verifyStripeSignature(body, sign(now - 301, body), secret, now), false, "starší ako 5 min");
assert.equal(await verifyStripeSignature(body, null, secret, now), false);
assert.equal(await verifyStripeSignature(body, sign(now, body), "", now), false);

// Štatistika pozná udalosť podpory; v kóde klienta nie je tajný kľúč ani cesta k nemu.
assert(TRACK_EVENTS.includes("podpora"));
for (const f of ["components/support.tsx", "components/support-sheet.tsx", "lib/support.ts"]) {
  const src = readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
  assert(!/sk_(test|live)_[A-Za-z0-9]{8}|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET/.test(src), `${f}: tajný kľúč v kóde klienta`);
}
const gitignore = readFileSync(new URL("../.gitignore", import.meta.url), "utf8");
for (const p of [".env*", ".dev.vars*", "*.env", "*.pem", "*.key"]) assert(gitignore.split(/\r?\n/).includes(p), `.gitignore: ${p}`);

console.log(`Podpora: sumy ${SUPPORT_MIN}–${SUPPORT_MAX} €, režimy, Checkout Session (API ${STRIPE_API_VERSION}) a podpis webhooku v poriadku.`);
