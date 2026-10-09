"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { gameCount } from "@/lib/game-catalog";
import { ArrowUpRight } from "lucide-react";
import { archive, parties } from "@/lib/polls";
import { casesEnabled } from "@/lib/features";

const DirectoryArt = lazy(() => import("@/components/directory-art"));
function Art({ view }: { view: string }) {
  const root = useRef<HTMLDivElement>(null), [visible,setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => { if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect();} }, {rootMargin:"80px"});
    if(root.current) observer.observe(root.current);
    return ()=>observer.disconnect();
  },[]);
  return <div className="directory-art" ref={root} aria-hidden="true">{visible&&<Suspense fallback={null}><DirectoryArt view={view}/></Suspense>}</div>;
}
export default function OverviewDirectory({ onNavigate }: { onNavigate: (view: string) => void }) {
  const tiles = [
    { view: "parliament", title: "Parlament", text: "3D sála, hlasovania a ako hlasujú poslanci" },
    { view: "polls", title: "Prieskumy", text: `Trend podpory a archív ${archive.length} meraní` },
    { view: "parties", title: "Strany", text: `${parties.length} profilov, ľudia a dokumenty` },
    { view: "finance", title: "Hospodárenie", text: "Deficit a dlh po rokoch a po vládach" },
    { view: "responsibility", title: "Zodpovednosť", text: "Kto vládol od roku 1993 a koľko vlád zažil tvoj ročník" },
    { view: "model", title: "Vlastný model", text: "Posuňte percentá a zostavte koalíciu" },
    { view: "data", title: "Dátový prehľad", text: "Dva polkruhy, bloky a scenáre agentúr" },
    { view: "programmes", title: "Programy", text: "Archív 2023 a aktuálne návrhy" },
    { view: "news", title: "Správy", text: "Podstatné udalosti so zdrojmi" },
    { view: "game", title: "Herňa", text: `${gameCount} hier · kvíz, slová aj vlastná štvrť` },
    ...(casesEnabled ? [{ view: "cases", title: "Kauzy", text: "Register prípadov so závažnosťou" }] : []),
    { view: "method", title: "O dátach", text: "Zdroje, metodika a hranice dát" },
  ];
  return <nav className="overview-directory" aria-labelledby="overview-directory-title">
    <h2 id="overview-directory-title">Ďalej na webe</h2>
    <ul>{tiles.map(t => <li key={t.view} data-view={t.view}><button type="button" onClick={() => onNavigate(t.view)}><Art view={t.view}/><b>{t.title}</b><span>{t.text}</span><ArrowUpRight size={16} aria-hidden="true"/></button></li>)}</ul>
  </nav>;
}
