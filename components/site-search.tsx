"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BarChart3, CalendarDays, Coins, Gamepad2, Landmark, Scale, Search, Sparkles, Users, Wallet } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cabinets } from "@/lib/cabinets";
import { agencies, parties } from "@/lib/polls";
import "@/app/site-search.css";

/*
  Rýchle hľadanie na celom webe (Ctrl+K, Cmd+K alebo „/“): sekcie, strany, nástroje, hry, agentúry,
  vlády a ročník narodenia (štvormiestny rok otvorí Tvoje Slovensko).
*/
export type SearchActions = {
  view: (id: string) => void;
  party: (id: string) => void;
  year: (year: number) => void;
  game: (id: string) => void;
  agency: (agency: string) => void;
  anchor: (view: string, elementId: string) => void;
};

type Tool = { label: string; hint: string; keywords: string[]; icon: ReactNode; run: (a: SearchActions) => void };
const tools: Tool[] = [
  { label: "Rýchle odpovede", hint: "Kto by vyhral, väčšina, hranica 5 %", keywords: ["otázky", "víťaz", "väčšina", "hrana"], icon: <Sparkles/>, run: a => a.anchor("overview", "qa-title") },
  { label: "Zostaviť koalíciu", hint: "Polkruh a cesty k 76 kreslám", keywords: ["koalícia", "väčšina", "76", "skladačka"], icon: <Scale/>, run: a => a.anchor("overview", "koalicia") },
  { label: "Porovnať strany", hint: "Dve alebo tri strany vedľa seba", keywords: ["porovnanie", "vedľa seba"], icon: <Users/>, run: a => a.anchor("parties", "porovnanie") },
  { label: "Peniaze strán od štátu", hint: "Príspevky 2023–2027", keywords: ["príspevok", "financovanie", "peniaze"], icon: <Coins/>, run: a => a.anchor("parties", "party-money-title") },
  { label: "Tvoje Slovensko", hint: "Čo zažil tvoj ročník", keywords: ["ročník", "narodenie", "vek"], icon: <CalendarDays/>, run: a => a.anchor("responsibility", "you-title") },
  { label: "Dlhové hodiny", hint: "Odhad dnešného dlhu", keywords: ["dlh", "deficit", "štátny dlh"], icon: <Wallet/>, run: a => a.anchor("finance", "debt-clock-title") },
  { label: "Presnosť agentúr 2023", hint: "Ako trafili posledné prieskumy", keywords: ["presnosť", "chyba", "2023", "prieskumy"], icon: <BarChart3/>, run: a => a.anchor("polls", "accuracy-title") },
  { label: "Ako sa z hlasov stanú kreslá", hint: "Prepočet podľa § 68", keywords: ["mandáty", "prepočet", "volebné číslo", "hranica"], icon: <Landmark/>, run: a => a.anchor("model", "ako-kresla") },
];
const games = [{ id: "majority", label: "Denná väčšina" }, { id: "december", label: "Do decembra" }, { id: "republic", label: "Malá republika" }];
const currentYear = 2026;
// Vlastné poradie: zhoda na začiatku slova má prednosť pred zhodou vnútri; bez diakritiky, bez „fuzzy“ zhody písmen.
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const filter = (value: string, search: string, keywords?: string[]) => {
  const q = norm(search.trim());
  if (!q) return 1;
  const hay = norm([value, ...(keywords ?? [])].join(" "));
  const words = hay.split(/[\s\u2013-]+/);
  if (words.includes(q)) return 1;
  if (words.some(w => w.startsWith(q))) return 0.8;
  return hay.includes(q) ? 0.4 : 0;
};

export default function SiteSearch({ views, actions }: { views: { id: string; label: string }[]; actions: SearchActions }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if ((e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey)) { e.preventDefault(); setOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const run = (fn: () => void) => { setOpen(false); setQuery(""); fn(); };
  const year = /^\d{4}$/.test(query.trim()) ? Number(query.trim()) : null;
  const validYear = year !== null && year >= 1920 && year <= currentYear;
  return <>
    <button type="button" className="site-search-trigger" onClick={() => setOpen(true)} aria-label="Hľadať na Mandáte (Ctrl+K)"><Search size={16} aria-hidden="true"/><span>Hľadať</span><kbd>Ctrl K</kbd></button>
    <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setQuery(""); }}>
      <DialogContent className="site-search p-0 overflow-hidden" showCloseButton={false}>
        <DialogTitle className="sr-only">Hľadať na Mandáte</DialogTitle>
        <DialogDescription className="sr-only">Sekcie, strany, nástroje, hry, agentúry, vlády alebo rok narodenia.</DialogDescription>
        <Command loop filter={filter}>
          <CommandInput placeholder="Strana, téma, vláda alebo rok narodenia…" value={query} onValueChange={setQuery}/>
          <CommandList>
            <CommandEmpty>Nič sme nenašli. Skúste názov strany, „dlh“ alebo rok narodenia.</CommandEmpty>
            {validYear && <CommandGroup heading="Ročník">
              <CommandItem value={`rocnik ${year}`} keywords={[String(year)]} onSelect={() => run(() => actions.year(year!))}><CalendarDays/>Čo zažil ročník {year}<span className="site-search-hint">Tvoje Slovensko</span></CommandItem>
            </CommandGroup>}
            <CommandGroup heading="Nástroje">
              {tools.map(t => <CommandItem key={t.label} value={t.label} keywords={t.keywords} onSelect={() => run(() => t.run(actions))}>{t.icon}{t.label}<span className="site-search-hint">{t.hint}</span></CommandItem>)}
            </CommandGroup>
            <CommandGroup heading="Strany">
              {parties.map(p => <CommandItem key={p.id} value={`${p.short} ${p.name}`} onSelect={() => run(() => actions.party(p.id))}><i className="site-search-dot" style={{ background: p.color }} aria-hidden="true"/>{p.short}<span className="site-search-hint">{p.name}</span></CommandItem>)}
            </CommandGroup>
            <CommandGroup heading="Sekcie">
              {views.map(v => <CommandItem key={v.id} value={`sekcia ${v.label}`} onSelect={() => run(() => actions.view(v.id))}>{v.label}</CommandItem>)}
            </CommandGroup>
            <CommandGroup heading="Hry">
              {games.map(g => <CommandItem key={g.id} value={`hra ${g.label}`} keywords={["herňa", "hra"]} onSelect={() => run(() => actions.game(g.id))}><Gamepad2/>{g.label}</CommandItem>)}
            </CommandGroup>
            <CommandGroup heading="Agentúry">
              {agencies.map(a => <CommandItem key={a} value={`agentúra ${a}`} keywords={["prieskum"]} onSelect={() => run(() => actions.agency(a))}><BarChart3/>Prieskumy {a}</CommandItem>)}
            </CommandGroup>
            <CommandGroup heading="Vlády">
              {[...cabinets].reverse().map(c => <CommandItem key={c.id} value={c.name} keywords={[c.pm, c.short]} onSelect={() => run(() => actions.anchor("responsibility", "resp-govs-title"))}><i className="site-search-dot" style={{ background: c.color }} aria-hidden="true"/>{c.name}<span className="site-search-hint">{c.start.slice(0, 4)}–{c.end ? c.end.slice(0, 4) : "dnes"}</span></CommandItem>)}
            </CommandGroup>
          </CommandList>
        </Command>
        <p className="site-search-foot"><kbd>↑</kbd><kbd>↓</kbd> výber · <kbd>Enter</kbd> otvoriť · <kbd>Esc</kbd> zavrieť</p>
      </DialogContent>
    </Dialog>
  </>;
}
