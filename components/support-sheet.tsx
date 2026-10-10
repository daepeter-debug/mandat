"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CircleCheck, CreditCard, Heart, Lock, Repeat2, TriangleAlert } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { formatEuros, parseSupportAmount, SUPPORT_AMOUNTS, SUPPORT_DEFAULT, SUPPORT_ENDPOINT, SUPPORT_MAX, SUPPORT_MIN, type SupportConfig, type SupportStatus } from "@/lib/support";
import { track } from "@/lib/track";
import "@/app/support.css";

/*
  Platobný panel podpory: výber sumy → vložený formulár Stripe (Embedded Checkout) → poďakovanie.
  Poďakovanie sa ukáže až podľa stavu, ktorý server zistí priamo zo Stripe (GET /api/podpora?session=…).
  Skutočný záznam o platbe potvrdzuje podpísaný webhook (app/api/podpora/webhook/route.ts).
*/
type EmbeddedCheckout = { mount(el: HTMLElement): void; destroy(): void };
type StripeInstance = { initEmbeddedCheckout(options: { fetchClientSecret: () => Promise<string>; onComplete?: () => void }): Promise<EmbeddedCheckout> };
declare global { interface Window { Stripe?: (key: string) => StripeInstance } }

// Stripe.js sa podľa podmienok Stripe načítava vždy z js.stripe.com (nie z vlastného balíka), a až keď ho treba.
let stripeJs: Promise<NonNullable<Window["Stripe"]>> | null = null;
function loadStripe() {
  stripeJs ??= new Promise((resolve, reject) => {
    if (window.Stripe) return resolve(window.Stripe);
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.async = true;
    script.onload = () => window.Stripe ? resolve(window.Stripe) : reject(new Error("stripe-js"));
    script.onerror = () => { stripeJs = null; script.remove(); reject(new Error("stripe-js")); };
    document.head.appendChild(script);
  });
  return stripeJs;
}

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
async function fetchStatus(session: string): Promise<SupportStatus | null> {
  // Hneď po dokončení môže Stripe ešte chvíľu hlásiť „open“; skúsime niekoľkokrát.
  for (let i = 0; i < 4; i++) {
    const r = await fetch(`${SUPPORT_ENDPOINT}?session=${encodeURIComponent(session)}`, { cache: "no-store" }).catch(() => null);
    const status = r?.ok ? await r.json() as SupportStatus : null;
    if (status && status.state !== "open") return status;
    await wait(1500);
  }
  return null;
}

type Step =
  | { step: "amount" }
  | { step: "checkout"; cents: number }
  | { step: "result"; result: SupportStatus | "checking" | null };

type Props = { config: Extract<SupportConfig, { enabled: true }>; open: boolean; returnedSession: string | null; onOpenChange: (open: boolean) => void };

export default function SupportSheet({ config, open, returnedSession, onOpenChange }: Props) {
  const test = config.mode === "test";
  const [view, setView] = useState<Step>(() => returnedSession ? { step: "result", result: "checking" } : { step: "amount" });
  const [preset, setPreset] = useState<number | null>(SUPPORT_DEFAULT);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const checkout = useRef<EmbeddedCheckout | null>(null);
  const generation = useRef(0);
  const cents = preset !== null ? preset * 100 : parseSupportAmount(custom);

  const teardown = () => { generation.current++; checkout.current?.destroy(); checkout.current = null; };
  useEffect(() => () => { checkout.current?.destroy(); checkout.current = null; }, []);

  // Návrat zo Stripe cez adresu (len pri platbách s presmerovaním): stav overí server.
  useEffect(() => {
    if (!returnedSession) return;
    let alive = true;
    fetchStatus(returnedSession).then(result => { if (alive) setView({ step: "result", result }); if (result?.state === "paid") track("podpora", "hotovo"); });
    return () => { alive = false; };
  }, [returnedSession]);

  const finish = async (session: string) => {
    teardown();
    setView({ step: "result", result: "checking" });
    const result = await fetchStatus(session);
    setView({ step: "result", result });
    if (result?.state === "paid") track("podpora", "hotovo");
  };

  const startCheckout = async (amount: number) => {
    teardown();
    const run = generation.current;
    setView({ step: "checkout", cents: amount }); setError(null); setLoading(true);
    track("podpora", "platba");
    try {
      const [response, Stripe] = await Promise.all([
        fetch(SUPPORT_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ suma: amount }) }),
        loadStripe(),
      ]);
      const data = await response.json().catch(() => ({})) as { id?: string; clientSecret?: string; error?: string };
      if (!response.ok || !data.clientSecret || !data.id) throw new Error(data.error ?? "Platbu sa teraz nepodarilo pripraviť. Skúste to o chvíľu.");
      const session = data.id, secret = data.clientSecret;
      const instance = await Stripe(config.publishableKey).initEmbeddedCheckout({ fetchClientSecret: async () => secret, onComplete: () => { void finish(session); } });
      if (run !== generation.current || !mountRef.current) { instance.destroy(); return; }
      checkout.current = instance;
      instance.mount(mountRef.current);
    } catch (e) {
      if (run !== generation.current) return;
      setError(e instanceof Error && e.message !== "stripe-js" ? e.message : "Platobný formulár sa nepodarilo načítať. Skontrolujte pripojenie a skúste to znova.");
    } finally {
      if (run === generation.current) setLoading(false);
    }
  };

  const change = (next: boolean) => {
    if (!next) {
      teardown();
      // Po zatvorení (a dobehnutí animácie) sa panel vráti na výber sumy.
      setTimeout(() => { setView({ step: "amount" }); setError(null); setLoading(false); }, 320);
    }
    onOpenChange(next);
  };

  const back = () => { teardown(); setView({ step: "amount" }); setError(null); setLoading(false); };
  const customInvalid = preset === null && custom.trim() !== "" && cents === null;

  return <Sheet open={open} onOpenChange={change}>
    <SheetContent className="detail-sheet support-sheet" aria-describedby="support-lead">
      <SheetHeader>
        <p className="support-kicker"><Heart size={15} aria-hidden="true"/>Dobrovoľná podpora{test && <span className="support-test">Testovací režim</span>}</p>
        <SheetTitle>Podporte nezávislý Mandát</SheetTitle>
        <SheetDescription id="support-lead">Mandát je nezávislý projekt, ktorého cieľom je prinášať prehľadné politické dáta, volebné prieskumy a analytické nástroje.</SheetDescription>
      </SheetHeader>
      <div className="sheet-body support-body">
        {view.step === "amount" && <>
          <p className="support-copy">Ak považujete projekt za užitočný, môžete dobrovoľne prispieť na jeho prevádzku a ďalší rozvoj. Každý príspevok pomáha. Ďakujeme!</p>
          <fieldset className="support-amounts">
            <legend>Suma príspevku</legend>
            {SUPPORT_AMOUNTS.map(a => <button key={a} type="button" aria-pressed={preset === a} onClick={() => { setPreset(a); setError(null); }}>{a} €</button>)}
            <button type="button" className="support-amount-custom" aria-pressed={preset === null} onClick={() => setPreset(null)}>Vlastná suma</button>
          </fieldset>
          {preset === null && <label className="support-custom" data-invalid={customInvalid || undefined}>
            <span>Vlastná suma v eurách</span>
            <span className="support-custom-field"><input autoFocus inputMode="decimal" autoComplete="off" placeholder="napr. 15" value={custom} aria-invalid={customInvalid || undefined} aria-describedby="support-range" onChange={e => setCustom(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && cents !== null) void startCheckout(cents); }}/><em aria-hidden="true">€</em></span>
            <small id="support-range">{customInvalid ? `Zadajte sumu od ${SUPPORT_MIN} € do ${SUPPORT_MAX} €, najviac s centami.` : `Od ${SUPPORT_MIN} € do ${SUPPORT_MAX} €.`}</small>
          </label>}
          <button type="button" className="support-pay" disabled={cents === null} onClick={() => cents !== null && void startCheckout(cents)}>
            <Lock size={16} aria-hidden="true"/>{cents !== null ? `Pokračovať k platbe · ${formatEuros(cents)}` : "Pokračovať k platbe"}
          </button>
          <ul className="support-facts">
            <li><CreditCard size={16} aria-hidden="true"/>Apple Pay, Google Pay alebo karta Visa či Mastercard, podľa vášho zariadenia.</li>
            <li><Repeat2 size={16} aria-hidden="true"/>Jednorazovo a bez registrácie. Nejde o predplatné.</li>
            <li><Lock size={16} aria-hidden="true"/>Platbu bezpečne spracuje Stripe. Údaje o vašej karte Mandát nevidí.</li>
          </ul>
          <p className="support-note">Príspevok je dobrovoľná platba na prevádzku a rozvoj webu. Nejde o dar charitatívnej organizácii ani politickej strane. Príspevky nemajú vplyv na obsah ani na výber dát.</p>
        </>}

        {view.step === "checkout" && <>
          <div className="support-checkout-head">
            <button type="button" onClick={back}><ArrowLeft size={16} aria-hidden="true"/>Zmeniť sumu</button>
            <b>{formatEuros(view.cents)}</b>
          </div>
          {test && <p className="support-test-hint">Testovací režim: nič sa nestrhne. Karta <b>4242 4242 4242 4242</b>, ľubovoľný budúci dátum a CVC.</p>}
          {loading && <p className="support-loading" role="status"><Spinner/>Pripravujeme bezpečnú platbu…</p>}
          {error && <div className="support-error" role="alert"><TriangleAlert size={18} aria-hidden="true"/><p>{error}</p><button type="button" onClick={() => void startCheckout(view.cents)}>Skúsiť znova</button></div>}
          <div ref={mountRef} className="support-checkout"/>
        </>}

        {view.step === "result" && (view.result === "checking"
          ? <p className="support-loading" role="status"><Spinner/>Overujeme platbu u Stripe…</p>
          : view.result?.state === "paid"
            ? <div className="support-thanks" role="status">
                <CircleCheck size={40} aria-hidden="true"/>
                <h3>Ďakujeme!</h3>
                <p>Váš príspevok{view.result.amount ? ` ${formatEuros(view.result.amount)}` : ""} sme prijali. Potvrdenie vám príde e-mailom od Stripe.</p>
                <button type="button" className="support-pay" onClick={() => change(false)}>Zavrieť</button>
              </div>
            : view.result?.state === "processing"
              ? <div className="support-thanks is-pending" role="status">
                  <Spinner/>
                  <h3>Platba sa spracúva</h3>
                  <p>Banka ju ešte nepotvrdila. Keď ju potvrdí, potvrdenie vám príde e-mailom od Stripe.</p>
                  <button type="button" className="support-pay" onClick={() => change(false)}>Zavrieť</button>
                </div>
              : <div className="support-thanks is-failed" role="alert">
                  <TriangleAlert size={36} aria-hidden="true"/>
                  <h3>Platbu sme neoverili</h3>
                  <p>Nevidíme ju ako dokončenú. Ak ste platbu nedokončili, nič sa nestrhlo. Ak vám prišlo potvrdenie od Stripe, platba prebehla v poriadku.</p>
                  <button type="button" className="support-pay" onClick={back}>Skúsiť znova</button>
                </div>)}
      </div>
    </SheetContent>
  </Sheet>;
}
