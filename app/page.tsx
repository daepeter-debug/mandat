import type { Metadata } from "next";
import { headers } from "next/headers";
import MandatApp from "@/components/mandat-app";
import { shareCardFor, shareImagePath } from "@/lib/share-cards";
import { isBirthYear, lifeHeadline, lifeSummary } from "@/lib/your-slovakia";

type Search = Promise<Record<string, string | string[] | undefined>>;

// Zdieľaný odkaz nesie záložku v ?v=; náhľad (og:image), titulok a popis sa vyberú podľa nej.
// Základná adresa sa berie z požiadavky, aby náhľady fungovali na každej doméne webu.
export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const params = await searchParams;
  const view = params.v;
  const card = shareCardFor(typeof view === "string" ? view : undefined);
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "mandat-preview.mandat.workers.dev";
  const local = /^(localhost|127\.0\.0\.1)(:|$)/.test(host);
  const proto = h.get("x-forwarded-proto") ?? (local ? "http" : "https");
  // Odkaz z Tvojho Slovenska (?v=responsibility&rok=1990) ukáže v náhľade vetu o danom ročníku.
  const year = typeof params.rok === "string" && /^[0-9]{4}$/.test(params.rok) ? Number(params.rok) : null;
  const life = card.view === "responsibility" && year !== null && isBirthYear(year) ? lifeSummary(year) : null;
  const title = life ? `Ročník ${life.year}: ${lifeHeadline(life)} · Mandát` : card.view === "overview" ? "Mandát — Slovensko v číslach" : `${card.title} · Mandát`;
  const description = life ? "Tvoje Slovensko: kto vládol počas tvojho života a ako sa zmenil dlh, mzdy a ceny. Pozri sa na svoj ročník." : card.text;
  const image = { url: shareImagePath(card), width: 1200, height: 630, alt: `${card.title}. Ilustrácia vytvorená pomocou AI.` };
  return {
    metadataBase: new URL(`${proto}://${host}`),
    title,
    description,
    openGraph: { title, description, type: "website", locale: "sk_SK", siteName: "Mandát", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

export default function Page() {
  return <MandatApp/>;
}
