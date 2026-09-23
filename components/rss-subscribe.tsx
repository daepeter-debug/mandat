"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Rss } from "lucide-react";
import { track } from "@/lib/track";
import "@/app/rss-subscribe.css";

// Odber nových prieskumov cez RSS (/rss.xml): bez registrácie a e-mailu, v ľubovoľnej čítačke správ.
const feedUrl = () => `${window.location.origin}/rss.xml`;

export default function RssSubscribe() {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(feedUrl());
      track("rss", "copy");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch { /* schránka nie je dostupná: adresa je aj v odkaze nižšie */ }
  }
  return <details className="rss-box" onToggle={e => { if (e.currentTarget.open) track("rss", "open"); }}>
    <summary><Rss size={16} aria-hidden="true"/>Odoberať nové prieskumy</summary>
    <p>Každé nové meranie, ktoré Mandát zapracuje, sa objaví vo vašej čítačke správ (RSS), napríklad vo Feedly alebo Inoreader. Bez registrácie a bez e-mailu.</p>
    <div className="rss-actions">
      <button type="button" onClick={copy}>{copied ? <Check size={16} aria-hidden="true"/> : <Copy size={16} aria-hidden="true"/>}{copied ? "Adresa je skopírovaná" : "Kopírovať adresu odberu"}</button>
      <button type="button" onClick={() => { track("rss", "feedly"); window.open(`https://feedly.com/i/subscription/feed/${encodeURIComponent(feedUrl())}`, "_blank", "noopener,noreferrer"); }}>Otvoriť vo Feedly<ExternalLink size={15} aria-hidden="true"/></button>
      <a href="/rss.xml">Zobraziť RSS</a>
    </div>
  </details>;
}
