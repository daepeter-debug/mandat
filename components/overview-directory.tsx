"use client";

import { ArrowUpRight } from "lucide-react";
import { archive, parties } from "@/lib/polls";
import { casesEnabled } from "@/lib/features";

/*
  Rozcestník pre mobil (do 760 px): Prehľad končí aktuálnymi kartami a odtiaľto sa ide klikom do
  statickejších častí. Na desktope je skrytý; tam ostávajú plné sekcie (graf podpory, merania,
  ukážka modelu, ďalšie pohľady).
*/
export default function OverviewDirectory({ onNavigate }: { onNavigate: (view: string) => void }) {
  const tiles = [
    ...(casesEnabled ? [{ view: "cases", title: "Kauzy", text: "Register prípadov so závažnosťou" }] : []),
    { view: "polls", title: "Prieskumy", text: `Trend podpory a archív ${archive.length} meraní` },
    { view: "parties", title: "Strany", text: `${parties.length} profilov, ľudia a dokumenty` },
    { view: "finance", title: "Hospodárenie", text: "Deficit a dlh po rokoch a po vládach" },
    { view: "model", title: "Vlastný model", text: "Posuňte percentá a zostavte koalíciu" },
    { view: "data", title: "Dátový prehľad", text: "Dva polkruhy, bloky a scenáre agentúr" },
    { view: "programmes", title: "Programy", text: "Archív 2023 a aktuálne návrhy" },
    { view: "news", title: "Správy", text: "Podstatné udalosti so zdrojmi" },
    { view: "game", title: "Denná hra", text: "Zostav najtesnejšiu väčšinu zo 150 kresiel" },
    { view: "method", title: "O dátach", text: "Zdroje, metodika a hranice dát" },
  ];
  return <nav className="overview-directory" aria-labelledby="overview-directory-title">
    <h2 id="overview-directory-title">Ďalej na webe</h2>
    <ul>{tiles.map(t => <li key={t.view}><button type="button" onClick={() => onNavigate(t.view)}><b>{t.title}</b><span>{t.text}</span><ArrowUpRight size={16} aria-hidden="true"/></button></li>)}</ul>
  </nav>;
}
