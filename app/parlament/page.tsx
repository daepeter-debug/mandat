import type { Metadata } from "next";
import { headers } from "next/headers";
import MandatApp from "@/components/mandat-app";
import { shareCardFor, shareImagePath } from "@/lib/share-cards";
import { displayName, type DeputiesData } from "@/lib/deputies";
import { kindNames, markNames, skDay, type Mark, type VoteIndex } from "@/lib/votes";
import votesIndex from "@/public/data/hlasovania/index.json";
import deputiesData from "@/public/data/hlasovania/poslanci.json";

type Search = Promise<Record<string, string | string[] | undefined>>;
const index = votesIndex as unknown as VoteIndex, deputies = deputiesData as unknown as DeputiesData;
const param = (v: string | string[] | undefined) => typeof v === "string" && /^[1-9][0-9]{0,7}$/.test(v) ? Number(v) : null;

// Stránka Parlament: zdieľaný odkaz na hlasovanie (?h=) alebo poslanca (?poslanec=) má vlastný titulok a popis.
// Údaje sú tie isté súbory, ktoré stránka načíta v prehliadači (public/data/hlasovania).
export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const params = await searchParams;
  const card = shareCardFor("parliament");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "mandat-preview.mandat.workers.dev";
  const local = /^(localhost|127\.0\.0\.1)(:|$)/.test(host);
  const proto = h.get("x-forwarded-proto") ?? (local ? "http" : "https");
  const voteId = param(params.h), deputyId = param(params.poslanec);
  const vote = voteId === null ? undefined : index.hlasovania.find(v => v.id === voteId);
  const deputy = deputyId === null ? undefined : deputies.poslanci.find(p => p.id === deputyId);
  let title = "Parlament · Mandát", description = card.text;
  if (vote) {
    const result = `${vote.preslo ? "Prešiel" : "Neprešiel"}: za ${vote.za}, proti ${vote.proti}, zdržalo sa ${vote.zdrzalo}, nehlasovalo ${vote.nehlasovalo}, neprítomní ${vote.nepritomni}.`;
    const j = deputies.hlasovania.indexOf(vote.id), mark = deputy && j >= 0 ? deputy.h[j] : "-";
    title = deputy && mark !== "-" ? `${displayName(deputy.meno)}: ${markNames[mark as Mark]} · ${vote.nazov} · Mandát` : `${vote.nazov} · Hlasovanie NR SR · Mandát`;
    description = `Hlasovanie NR SR ${skDay(vote.datum)} · ${kindNames[vote.druh]}. ${result} Pozri, ako hlasovali kluby a poslanci.`;
  } else if (deputy) {
    const marks = [...deputy.h], seated = marks.filter(m => m !== "-").length, present = marks.filter(m => "ZP?N".includes(m)).length;
    title = `${displayName(deputy.meno)}: hlasovania v NR SR · Mandát`;
    description = `Prítomnosť pri ${present} z ${seated} hlasovaní o zákonoch, rozpočtoch a nedôvere v 9. volebnom období a hlas pri každom z nich podľa nrsr.sk.`;
  }
  const image = { url: shareImagePath(card), width: 1200, height: 630, alt: "Sála NR SR zhora: 150 kresiel vo farbách poslaneckých klubov." };
  return {
    metadataBase: new URL(`${proto}://${host}`),
    title,
    description,
    alternates: { types: { "application/rss+xml": "/rss.xml" } },
    openGraph: { title, description, type: "website", locale: "sk_SK", siteName: "Mandát", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

export default function Page() {
  return <MandatApp serverSearch="?v=parliament"/>;
}
