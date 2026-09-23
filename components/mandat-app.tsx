"use client";

import { lazy, Suspense, useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { ArrowUpRight, ArrowRight, Info, Search, ChartNoAxesCombined, Table2, Check, BookOpen, ListFilter, ShieldCheck, ChevronRight, Activity } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { sourceCoverage } from "@/lib/coverage";
import ProgrammeLibrary, { PartyDocuments } from "@/components/programme-library";
import Hemicycle from "@/components/hemicycle";
import BrandMark from "@/components/brand-mark";
import { MandatMagazine, ElectionLab } from "@/components/mandat-magazine";
import { aggregateAsPoll, aggregateAgencies, aggregateHalfLifeDays, aggregatePolls, aggregateWindowDays, currentAggregate } from "@/lib/aggregate";
import BlocBar from "@/components/bloc-bar";
import PartyProfileOverview, { PartyTags, PersonPhotoSources } from "@/components/party-profile-overview";
import { casesEnabled } from "@/lib/features";
// Register káuz je vypnutý; dynamický import drží jeho dáta aj komponenty mimo prehliadača.
const PoliticalCases = lazy(() => import("@/components/political-cases"));
const PartyCases = lazy(() => import("@/components/political-cases").then(m => ({ default: m.PartyCases })));
import { partyProfiles } from "@/lib/party-profiles";
import PartyRail, { PartyLogoSources, PartyStrip } from "@/components/party-rail";
import Image from "next/image";
import partyLogos from "@/lib/party-logos.json";
const partyLogoMap:Record<string,{src:string}> = partyLogos;
// Historický kontext v karte strany: ako subjekt dopadol vo voľbách 2023.
function Result2023Line({partyId}:{partyId:string}) {
  const r = result2023(partyId);
  const seats = (n:number) => n === 0 ? "bez kresla" : n === 1 ? "1 kreslo" : n < 5 ? `${n} kreslá` : `${n} kresiel`;
  return <p className="party-card-history">Voľby 2023: {r.kind === "absent"
    ? <b>nekandidovala</b>
    : <><b>{fmt(r.pct)} %</b> · {seats(r.seats)}{r.kind === "coalition" && <> <span>v koalícii {r.label}</span></>}</>}</p>;
}
// Graf Dátového prehľadu (Recharts) sa načíta až pri otvorení záložky s grafom.
const ArchiveChart = lazy(() => import("@/components/archive-chart"));
// Hospodárenie štátu má vlastný graf a tabuľky; načíta sa až pri otvorení záložky.
const PublicFinance = lazy(() => import("@/components/public-finance"));
// Zodpovednosť za stav krajiny (čas strán vo vláde od 1993) má vlastnú záložku; načíta sa pri otvorení.
const ResponsibilityPage = lazy(() => import("@/components/responsibility-page"));
// Herňa (výber hier) sa načíta až pri otvorení záložky; samotné hry ešte o krok neskôr.
const GamesRoom = lazy(() => import("@/components/games-room"));
import { gameIds, type GameId } from "@/components/games-room";
import PoliticalNewsFeed from "@/components/news-room";
import { epigraph } from "@/lib/quote";
import { newsById, newsChecked } from "@/lib/political-news";
import PollAggregator from "@/components/poll-aggregator";
import { blocs, blocSeats, optionalPartners, optionalIds, MAJORITY, CONSTITUTIONAL_MAJORITY } from "@/lib/blocs";
import { election2023, seated2023, scenarioFromPoll, wastedVotes, result2023 } from "@/lib/parliament";
import { parties, archive, agencies, agencySeries, latest, previous, fmt, date, rank, difference, dataVerified, type Poll, type Party } from "@/lib/polls";
import SectionArt from "@/components/section-art";
import PollAccuracy from "@/components/poll-accuracy";
import PartyMoney from "@/components/party-money";
import SeatsExplainer from "@/components/seats-explainer";
import SiteSearch, { type SearchActions } from "@/components/site-search";
const PartyCompare = lazy(() => import("@/components/party-compare"));

const officialSeats = seated2023.map(s => ({ id: s.partyId ?? `election-2023-${s.number}`, short: s.short, name: s.name, color: s.color, seats: s.seats, share: s.pct }));
const primaryAgencies = ["AKO","FOCUS","INFOSTAT","IPSOS","NMS"];
const views = [{id:"overview",label:"Prehľad"},{id:"parties",label:"Strany"},{id:"news",label:"Správy"},{id:"finance",label:"Hospodárenie"},{id:"responsibility",label:"Zodpovednosť"},...(casesEnabled?[{id:"cases",label:"Kauzy"}]:[]),{id:"data",label:"Dátový prehľad"},{id:"model",label:"Vlastný model"},{id:"polls",label:"Prieskumy"},{id:"programmes",label:"Programy"},{id:"game",label:"Herňa"},{id:"method",label:"O dátach"}];
const viewIds = views.map(v=>v.id);
const periods = ["3","5","9"];
const defaultActive = ["ps","smer","rep","slovensko","sas"];
const normalize = (s:string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const hostname = (url:string) => { try { return new URL(url).hostname.replace(/^www\./,""); } catch { return url; } };

/* Stav rozhrania v URL: záložka (v), agentúra prehľadu (a), obdobie (p), graf/tabuľka (m),
   filter archívu (f), hľadanie (q), hľadanie strany (s), otvorené meranie (d), otvorená strana (strana), rok narodenia v Tvojom Slovensku (rok), porovnávané strany (porovnaj).
   Predvolené hodnoty sa do adresy nezapisujú; neznáme hodnoty sa ignorujú. */
type UiState = {view:string;trendAgency:string;period:string;mode:string;legend:string[];blocs:string[];caseParty:string|null;finance:string;parliament:string;parliamentPartners:boolean;game:GameId|null;news:string|null;spread:string;agency:string;query:string;partyQuery:string;detail:string|null;party:string|null;birthYear:number|null;compare:string[]};
const parliamentViews = ["model","volby2023"];
const ELECTION_VIEW = "volby2023";
// Dátový prehľad má jednu grafiku parlamentu; prepínač vyberá, čo zobrazuje.
const spreadOptions = [ELECTION_VIEW, ...primaryAgencies];
const defaults:UiState = {view:"overview",trendAgency:"NMS",period:"9",mode:"chart",legend:defaultActive,blocs:[],caseParty:null,finance:"years",parliament:"model",parliamentPartners:false,game:null,news:null,spread:"NMS",agency:"all",query:"",partyQuery:"",detail:null,party:null,birthYear:null,compare:[]};
const partyIds = new Set(parties.map(p=>p.id));
function parseSearch(search:string):UiState {
  const s = new URLSearchParams(search);
  const pick = (key:string, ok:(v:string)=>boolean) => { const v = s.get(key); return v!==null && ok(v) ? v : null; };
  const trendAgency = pick("a", v=>primaryAgencies.includes(v)) ?? defaults.trendAgency;
  return {
    view: pick("v", v=>viewIds.includes(v)) ?? defaults.view,
    trendAgency,
    // Bez vlastnej hodnoty sleduje grafika vybranú agentúru; do adresy ide, až keď sa líši.
    spread: pick("hs", v=>spreadOptions.includes(v)) ?? trendAgency,
    period: pick("p", v=>periods.includes(v)) ?? defaults.period,
    mode: pick("m", v=>v==="chart"||v==="table") ?? defaults.mode,
    legend: s.get("l")===null ? defaults.legend : s.get("l")!.split(",").filter(id=>partyIds.has(id)),
    blocs: (s.get("b") ?? "").split(",").filter(id=>optionalIds.includes(id)),
    caseParty: pick("kp", v=>partyIds.has(v)),
    finance: pick("hv", v=>["years","governments","living","compare"].includes(v)) ?? defaults.finance,
    parliament: pick("pn", v=>parliamentViews.includes(v)) ?? defaults.parliament,
    parliamentPartners: pick("pp", v=>v==="1") !== null,
    game: pick("g", v=>(gameIds as string[]).includes(v)) as GameId|null,
    news: pick("sp", v=>newsById(v)!==null),
    agency: pick("f", v=>v==="all"||agencies.includes(v)) ?? defaults.agency,
    query: (s.get("q") ?? "").slice(0,80),
    partyQuery: (s.get("s") ?? "").slice(0,80),
    detail: pick("d", v=>archive.some(p=>p.id===v)),
    party: pick("strana", v=>parties.some(p=>p.id===v)),
    // Presný rozsah overí sekcia Zodpovednosť; tu len štvormiestny rok bez importu hospodárskych dát.
    birthYear: Number(pick("rok", v=>/^(19[2-9][0-9]|20[0-9][0-9])$/.test(v))) || null,
    compare: [...new Set((s.get("porovnaj") ?? "").split(",").filter(id=>partyIds.has(id)))].slice(0,3),
  };
}
function serialize(state:UiState) {
  const s = new URLSearchParams();
  if(state.view!==defaults.view) s.set("v",state.view);
  if(state.trendAgency!==defaults.trendAgency) s.set("a",state.trendAgency);
  if(state.period!==defaults.period) s.set("p",state.period);
  if(state.mode!==defaults.mode) s.set("m",state.mode);
  if(state.legend.join(",")!==defaults.legend.join(",")) s.set("l",state.legend.join(","));
  if(state.blocs.length) s.set("b",state.blocs.join(","));
  if(state.caseParty) s.set("kp",state.caseParty);
  if(state.finance!==defaults.finance) s.set("hv",state.finance);
  if(state.parliament!==defaults.parliament) s.set("pn",state.parliament);
  if(state.parliamentPartners) s.set("pp","1");
  if(state.game) s.set("g",state.game);
  if(state.news) s.set("sp",state.news);
  if(state.spread!==state.trendAgency) s.set("hs",state.spread);
  if(state.agency!==defaults.agency) s.set("f",state.agency);
  if(state.query) s.set("q",state.query);
  if(state.partyQuery) s.set("s",state.partyQuery);
  if(state.detail) s.set("d",state.detail);
  if(state.party) s.set("strana",state.party);
  if(state.birthYear) s.set("rok",String(state.birthYear));
  if(state.compare.length) s.set("porovnaj",state.compare.join(","));
  const qs = s.toString();
  return qs ? `?${qs}` : "";
}
// Adresa je jediný zdroj stavu rozhrania. Komponent ju číta cez useSyncExternalStore,
// zápis ide cez history API; zmena záložky vytvorí položku histórie, ostatné zmeny ju nahradia.
const urlListeners = new Set<()=>void>();
const subscribeUrl = (cb:()=>void) => { urlListeners.add(cb); window.addEventListener("popstate",cb); return () => { urlListeners.delete(cb); window.removeEventListener("popstate",cb); }; };
const readSearch = () => window.location.search;
const readServerSearch = () => "";
function navigateTo(next:string, push:boolean) {
  if(next===window.location.search) return;
  const url = `${window.location.pathname}${next}`;
  if(push) window.history.pushState(null,"",url); else window.history.replaceState(null,"",url);
  urlListeners.forEach(l=>l());
}

function Source({poll, compact=false}:{poll:Poll;compact?:boolean}) {
  return <a className="source-link" href={poll.source} target="_blank" rel="noopener noreferrer">{compact ? `${poll.agency} · ${poll.month.toLowerCase()}` : poll.sourceName}<ArrowUpRight size={14}/><span className="sr-only"> (otvorí sa v novej karte)</span></a>;
}
function Heading({children,aside}:{children:ReactNode;aside?:ReactNode}) {
  return <div className="section-heading"><h2>{children}</h2>{aside}</div>;
}
function PollValues({poll}:{poll:Poll}) {
  return <Table><TableCaptionText>Prepísané výsledky · {poll.agency}, {poll.month.toLowerCase()} 2026</TableCaptionText><TableHeader><TableRow><TableHead>Politický subjekt</TableHead><TableHead className="number-cell">Podpora</TableHead></TableRow></TableHeader><TableBody>{rank(poll).map(p=><TableRow key={p.id}><TableCell><span className="party-label"><i style={{background:p.color}}/>{p.name}</span></TableCell><TableCell className="number-cell">{fmt(poll.values[p.id])} %</TableCell></TableRow>)}</TableBody></Table>;
}
function TableCaptionText({children}:{children:ReactNode}) { return <caption className="sr-only">{children}</caption>; }
function SourceFallback({poll}:{poll:Poll}) {
  const coverage = sourceCoverage.find(c=>c.agency===poll.agency);
  return <p className="source-fallback">Adresa publikácie: {hostname(poll.source)}.{coverage && coverage.source!==poll.source && <> Ak odkaz nefunguje, správu dohľadáte v <a href={coverage.source} target="_blank" rel="noopener noreferrer">archíve {coverage.agency}<ArrowUpRight size={12}/><span className="sr-only"> (otvorí sa v novej karte)</span></a>.</>}</p>;
}

type WebTool = {name:string;title:string;description:string;inputSchema:object;execute:(input:Record<string,unknown>)=>Promise<{content:{type:"text";text:string}[]}>};
type ModelContext = {registerTool:(tool:WebTool, options?:{signal:AbortSignal})=>void;unregisterTool?:(name:string)=>void};

export default function MandatApp() {
  const [archiveVisible, setArchiveVisible] = useState(archive.length);
  const search = useSyncExternalStore(subscribeUrl, readSearch, readServerSearch);
  const ui = useMemo(()=>parseSearch(search),[search]);
  const {view,trendAgency,period,mode,agency,query,partyQuery} = ui;
  const active = ui.legend;
  const detail = ui.detail ? archive.find(p=>p.id===ui.detail) ?? null : null;
  const party = ui.party ? parties.find(p=>p.id===ui.party) ?? null : null;
  const update = (patch:Partial<UiState>, push=false) => navigateTo(serialize({...ui,...patch}), push);
  const setView = (v:string) => update({view:v}, true);
  const setTrendAgency = (a:string) => update({trendAgency:a,spread:a});
  const setPeriod = (p:string) => update({period:p});
  const setMode = (m:string) => update({mode:m});
  const setActive = (ids:string[]) => update({legend:ids});
  const blocExtras = ui.blocs;
  const toggleBlocExtra = (id:string) => { const now = parseSearch(window.location.search); const next = now.blocs.includes(id) ? now.blocs.filter(x=>x!==id) : [...now.blocs,id]; navigateTo(serialize({...now, blocs: next}), false); };
  const resetArchiveVisible = () => setArchiveVisible(window.matchMedia("(max-width: 760px)").matches ? 12 : archive.length);
  const setAgency = (a:string) => { resetArchiveVisible(); update({agency:a}); };
  const setQuery = (q:string) => { resetArchiveVisible(); update({query:q.slice(0,80)}); };
  const setPartyQuery = (q:string) => update({partyQuery:q.slice(0,80)});
  const setDetail = (p:Poll|null) => update({detail:p?.id??null});
  const openNews = newsById(ui.news);
  const setParty = (p:Party|null) => update({party:p?.id??null});
  const visiblePolls = agencySeries(trendAgency,Number(period));
  const current = agencySeries(trendAgency,1)[0] ?? latest;
  const aggregatePoll = aggregateAsPoll();
  const preceding = agencySeries(trendAgency,2).at(-2);
  const scenario = scenarioFromPoll(current);
  const untranscribed = Math.max(0, Math.round((100 - scenario.transcribedShare - (scenario.otherShare ?? 0)) * 10) / 10);
  const issuePoll = archive[0];
  const blocs2023 = blocSeats(officialSeats, blocExtras);
  const blocsScenario = blocSeats(scenario.rows, blocExtras);
  const showElection = ui.spread === ELECTION_VIEW;
  const wasted = wastedVotes(scenario);
  const snapshots = primaryAgencies.map(a=>agencySeries(a,1)[0]).filter((p):p is Poll=>p!==undefined);
  const filtered = archive.filter(p=>(agency==="all" || p.agency===agency) && normalize(`${p.agency} ${p.month} ${p.published} ${p.client}`).includes(normalize(query)));
  const visibleParties = [...parties].sort((a,b)=>a.name.localeCompare(b.name,"sk")).filter(p=>normalize(`${p.name} ${p.short} ${partyProfiles[p.id]?.people.map(person=>person.name).join(" ")??""}`).includes(normalize(partyQuery)));
  const verified = date(dataVerified);

  useEffect(()=>{ document.title = `${views.find(v=>v.id===view)?.label ?? "Prehľad"} · Mandát`; },[view]);

  useEffect(()=>{
    const media=window.matchMedia("(max-width: 760px)");
    const sync=()=>setArchiveVisible(media.matches ? 12 : archive.length);
    sync();
    media.addEventListener("change",sync);
    return ()=>media.removeEventListener("change",sync);
  },[]);

  // Na mobile drží aktívnu záložku vo viditeľnej časti vodorovnej navigácie.
  useEffect(()=>{
    if(!window.matchMedia("(max-width: 760px)").matches) return;
    document.querySelector<HTMLElement>(".nav-tabs [role=\"tab\"][data-state=\"active\"]")?.scrollIntoView({block:"nearest",inline:"center"});
  },[view]);

  useEffect(()=>{
    const context = (document as Document & {modelContext?:ModelContext}).modelContext;
    if(!context) return;
    const controller = new AbortController();
    context.registerTool({name:"filter_poll_archive",title:"Filtrovať archív prieskumov",description:`Otvorí archív a nastaví filter agentúry a vyhľadávanie. Dostupných je ${archive.length} ručne overených meraní; nejde o úplný archív.`,inputSchema:{type:"object",properties:{agency:{type:"string",enum:["all",...agencies]},query:{type:"string"}},additionalProperties:false},execute:async input=>{
      const nextAgency = typeof input.agency==="string" ? input.agency : "all";
      if(!["all",...agencies].includes(nextAgency)) throw new Error("Neznáma agentúra");
      const nextQuery = typeof input.query==="string" ? input.query : "";
      flushSync(()=>navigateTo(serialize({...parseSearch(window.location.search),view:"polls",agency:nextAgency,query:nextQuery}),true));
      const results = archive.filter(p=>(nextAgency==="all"||p.agency===nextAgency)&&normalize(`${p.agency} ${p.month} ${p.published} ${p.client}`).includes(normalize(nextQuery)));
      return {content:[{type:"text",text:JSON.stringify({count:results.length,polls:results.map(p=>({id:p.id,agency:p.agency,published:p.published,source:p.source}))})}]};
    }},{signal:controller.signal});
    return ()=>{controller.abort();context.unregisterTool?.("filter_poll_archive");};
  },[]);

  // Na mobile posunieme aktívnu záložku do stredu pásu, aby bolo vidieť, že ich je viac.
  useEffect(() => {
    if (!window.matchMedia("(max-width:760px)").matches) return;
    const tab = document.querySelector<HTMLElement>(".nav-tabs [role=tab][data-state=active]");
    const list = tab?.parentElement;
    if (tab && list) list.scrollTo({ left: Math.max(0, tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2), behavior: "auto" });
  }, [view]);
  const changeView = (next:string) => {setView(next);window.scrollTo({top:0,behavior:"instant"});};
  // Skok z vyhľadávania na konkrétne miesto: sekcia sa môže načítavať (lazy), preto skúšame chvíľu opakovane.
  const goAnchor = (next:string, elementId:string) => {
    if(view!==next) changeView(next);
    let tries = 0;
    const attempt = () => { const el = document.getElementById(elementId); if(el){ el.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"start"}); return; } if(tries++<40) window.setTimeout(attempt,60); };
    window.setTimeout(attempt,60);
  };
  const searchActions:SearchActions = {
    view: id=>changeView(id),
    party: id=>setParty(parties.find(p=>p.id===id)??null),
    year: y=>{update({view:"responsibility",birthYear:y},true);window.scrollTo({top:0,behavior:"instant"});},
    game: id=>{update({view:"game",game:id as GameId},true);window.scrollTo({top:0,behavior:"instant"});},
    agency: a=>{update({view:"polls",agency:a},true);window.scrollTo({top:0,behavior:"instant"});},
    anchor: goAnchor,
  };
  return <div className="site-shell editorial-shell with-party-rail">
    <a className="skip-link" href="#main">Preskočiť na obsah</a>
    <PartyRail selected={ui.party} onSelect={p=>setParty(ui.party===p.id?null:p)} onMethod={()=>{update({party:null,view:"method"},true);window.scrollTo({top:0,behavior:"instant"});}}/>
    <header className="site-header"><div className="brand-block"><div className="brand-row"><button className="brand" onClick={()=>changeView("overview")} aria-label="Mandát — úvod"><BrandMark/>mandát<span>.</span></button><span className="edition-header">Nezávislý prehľad slovenskej politiky</span></div><p className="brand-motto" title={epigraph.source}>„{epigraph.text}“ <span>— {epigraph.author}</span></p></div><SiteSearch views={views} actions={searchActions}/><div className="header-status"><span>Údaje overené</span><b>{verified}</b></div></header>
    <Tabs value={view} onValueChange={changeView} activationMode="manual" className="page-tabs">
      <nav className="main-nav" aria-label="Hlavná navigácia"><TabsList className="nav-tabs">{views.map(v=><TabsTrigger key={v.id} value={v.id}>{v.label}{v.id==="polls"&&<span className="nav-count">{archive.length}</span>}</TabsTrigger>)}</TabsList><div className="nav-bottom"><span className="edition-number">{issuePoll.end.slice(5,7)} <span>/ {issuePoll.end.slice(0,4)}</span></span><p>Fakty pre váš<br/>vlastný názor.</p><span className="nav-project">Nezávislý projekt<br/>Bez reklamy · lokálny náhľad</span></div></nav>
      <main id="main">
        <TabsContent value="overview"><PartyStrip selected={ui.party} onSelect={p=>setParty(ui.party===p.id?null:p)} onMore={()=>changeView("parties")}/><MandatMagazine poll={current} onAgency={setTrendAgency} onNavigate={changeView} onYear={y=>{update({view:"responsibility",birthYear:y},true);window.scrollTo({top:0,behavior:"instant"});}} parliament={ui.parliament} onParliament={value=>update({parliament:value})} parliamentPartners={ui.parliamentPartners} onParliamentPartners={value=>update({parliamentPartners:value})} onOpenNews={id=>update({news:id})}/></TabsContent>
        <TabsContent value="news"><PoliticalNewsFeed onOpenNews={id=>update({news:id})}/></TabsContent>
        <TabsContent value="game"><Suspense fallback={<p className="chart-loading">Načítavame herňu…</p>}><GamesRoom game={ui.game} onGame={g=>update({game:g})}/></Suspense></TabsContent>
        <TabsContent value="responsibility"><Suspense fallback={<p className="chart-loading">Načítavame prehľad vlád…</p>}><ResponsibilityPage birthYear={ui.birthYear} onBirthYear={y=>update({birthYear:y})} onParty={id=>setParty(parties.find(p=>p.id===id)??null)} onFinance={()=>{update({view:"finance",finance:"governments"},true);window.scrollTo({top:0,behavior:"instant"});}}/></Suspense></TabsContent>
        <TabsContent value="finance"><Suspense fallback={<p className="chart-loading">Načítavame hospodárenie…</p>}><PublicFinance view={ui.finance} onView={v=>update({finance:v})}/></Suspense></TabsContent>
        {casesEnabled&&<TabsContent value="cases"><Suspense fallback={<p className="chart-loading">Načítavame register…</p>}><PoliticalCases onParty={id=>setParty(parties.find(p=>p.id===id)??null)} party={ui.caseParty??"all"} onPartyChange={id=>update({caseParty:id==="all"?null:id})}/></Suspense></TabsContent>}
        <TabsContent value="model"><ElectionLab key={aggregatePoll.id} poll={aggregatePoll} onMethod={()=>changeView("method")}/><SeatsExplainer/></TabsContent>
        <TabsContent value="data">
          <section className="issue-lead" aria-labelledby="issue-title">
            <h1 id="issue-title">Vydanie <span>{issuePoll.month.toLowerCase()} {issuePoll.end.slice(0,4)}</span></h1>
            <div className="issue-meta"><p>Jedna grafika parlamentu. Prepnite medzi výsledkom volieb 2023 a scenárom podľa vybranej agentúry.</p><span>Kontrola dát <time dateTime={dataVerified}>{verified}</time></span></div>
          </section>
          <fieldset className="agency-block"><legend><strong>Rozdelenie kresiel</strong><span>Výber prepína grafiku parlamentu. Trend a rebríček nižšie ukazujú poslednú vybranú agentúru.</span></legend><div className="agency-switcher" role="group" aria-label="Zdroj rozdelenia kresiel"><button className="is-election" aria-pressed={showElection} onClick={()=>update({spread:ELECTION_VIEW})}><span>Voľby 2023{showElection&&<Check size={16}/>}</span><small>Oficiálny výsledok</small></button>{primaryAgencies.map(a=>{const p=agencySeries(a,1)[0];const on=!showElection&&trendAgency===a;return <button key={a} aria-pressed={on} onClick={()=>setTrendAgency(a)}><span>{a}{on&&<Check size={16}/>}</span><small>{p ? `${p.month} 2026` : "Bez merania"}</small></button>})}</div></fieldset>
          <section className="parliament-spread" aria-label={showElection ? "Výsledok volieb 2023" : "Scenár parlamentu podľa agentúry"}>
            {showElection
              ? <Hemicycle key="volby2023" label="Parlament z volieb 2023" seats={officialSeats} caption={<><p>{election2023.note}</p><a className="source-link" href={election2023.source} target="_blank" rel="noopener noreferrer">Štatistický úrad SR · výsledky 2023<ArrowUpRight size={14}/><span className="sr-only"> (otvorí sa v novej karte)</span></a></>}/>
              : <Hemicycle key={current.id} label={`Scenár podľa ${current.agency}, ${current.month.toLowerCase()} 2026`} seats={scenario.rows} caption={<><p><b>{current.type}</b> · zber {date(current.start)} – {date(current.end)} · n = {current.sample?.toLocaleString("sk-SK") ?? "neuvedené"}</p><Source poll={current}/></>}/>}
            <div className="scenario-column">
              {showElection
                ? <div className="scenario-notice"><p><strong>Oficiálny výsledok, nie scenár.</strong> Ide o rozdelenie mandátov po voľbách 2023 podľa Štatistického úradu SR, nie o aktuálne zloženie poslaneckých klubov. Zmeny členstva poslancov po voľbách tu neevidujeme.</p><p>Pre porovnanie s prieskumom prepnite vyššie na niektorú agentúru.</p><button className="text-button" onClick={()=>changeView("method")}>Ako počítame kreslá <ArrowRight size={16}/></button></div>
                : <><div className="scenario-notice"><p><strong>Scenár, nie predpoveď.</strong> Orientačný prepočet podľa princípu § 68 zákona 180/2014 z publikovaných percent. Koalície nie sú známe; každý uvedený subjekt považujeme za samostatnú stranu s hranicou 5 %.</p><p>Neprepísaná podpora: <b>{fmt(untranscribed)} %</b>. Iné: <b>{scenario.otherShare === null ? "neuvedené samostatne" : `${fmt(scenario.otherShare)} %`}</b>. Zvyšok do 100 % je dopočet a môže zahŕňať zaokrúhlenie; do scenára nevstupuje.</p><button className="text-button" onClick={()=>changeView("method")}>Ako počítame kreslá <ArrowRight size={16}/></button></div>
              <div className="below-threshold"><h3>Bez mandátu v tomto scenári</h3><ul>{scenario.belowThreshold.map(s=><li key={s.id}><span>{s.short}</span><b>{fmt(s.share)} %</b></li>)}</ul>{scenario.belowThreshold.length===0&&<p>Všetky prepísané subjekty získali kreslá.</p>}<p className="wasted-votes"><b>{fmt(wasted.wastedShare)} %</b> hlasov bez zastúpenia · pri účasti ako v roku 2023 ≈ <b>{wasted.wastedVotes.toLocaleString("sk-SK")}</b> voličov{wasted.votesPerSeat!==null&&<> · jedno kreslo ≈ <b>{wasted.votesPerSeat.toLocaleString("sk-SK")}</b> hlasov</>}</p></div></>}
            </div>
          </section>
          <p className="hemicycle-order-note">Kreslá sú zoradené zľava doprava podľa ich počtu, nie podľa politickej osi. Jeden bod predstavuje jedno kreslo.</p>
          <section className="blocs" aria-labelledby="blocs-title">
            <div className="blocs-head"><h2 id="blocs-title">Koalícia a opozícia</h2><p>{blocs[0].description} Opozičný blok: PS, KDH, SaS a Demokrati. Väčšina v NR SR je {MAJORITY} kresiel, ústavná väčšina {CONSTITUTIONAL_MAJORITY}.</p></div>
            <div className="bloc-toggles" role="group" aria-label="Voliteľní partneri blokov, redakčný predpoklad">{optionalPartners.map(m=>{const p=parties.find(x=>x.id===m.id);return <button key={m.id} aria-pressed={blocExtras.includes(m.id)} onClick={()=>toggleBlocExtra(m.id)} title={m.note} style={{"--party-color":p?.color} as CSSProperties}><i aria-hidden="true"/>{m.bloc==="coalition"?"ku koalícii":"k opozícii"}: {p?.short ?? m.id}</button>})}</div>
            <BlocBar title="Voľby 2023" summary={blocs2023}/>
            <BlocBar title={`Scenár podľa ${current.agency}, ${current.month.toLowerCase()} 2026`} summary={blocsScenario}/>
            <p className="blocs-note">Voliteľní partneri sú redakčný predpoklad, nie oznámená dohoda: {optionalPartners.map(m=>m.note).join(" ")} Bloky počítame rovnako nad oficiálnymi mandátmi z volieb 2023 aj nad scenárom z prieskumu; scenár nie je predpoveď. <a className="source-link" href={blocs[0].source} target="_blank" rel="noopener noreferrer">{blocs[0].sourceName}<ArrowUpRight size={12}/><span className="sr-only"> (otvorí sa v novej karte)</span></a></p>
          </section>
          <div className="dashboard-grid">
            <section className="trend-card" aria-label="Vývoj preferencií">
              <div className="card-top"><h2>Vývoj podpory <span>{trendAgency}</span></h2><Select value={period} onValueChange={setPeriod}><SelectTrigger className="period-select" aria-label="Obdobie grafu"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="9">Rok 2026</SelectItem><SelectItem value="5">Posledných 5 meraní</SelectItem><SelectItem value="3">Posledné 3 merania</SelectItem></SelectContent></Select></div>
              <div className="chart-legend" role="group" aria-label="Strany zobrazené v grafe">{parties.slice(0,8).map(p=><button key={p.id} aria-pressed={active.includes(p.id)} className={active.includes(p.id)?"legend-item selected":"legend-item"} onClick={()=>setActive(active.includes(p.id)?active.filter(id=>id!==p.id):[...active,p.id])}><i style={{background:p.color}}/>{p.short}</button>)}</div>
              <div className="chart-control-row"><span className="label">Podiel hlasov v %</span><div className="segmented" role="group" aria-label="Zobrazenie dát"><button aria-pressed={mode==="chart"} onClick={()=>setMode("chart")}><ChartNoAxesCombined size={15}/>Graf</button><button aria-pressed={mode==="table"} onClick={()=>setMode("table")}><Table2 size={15}/>Tabuľka</button></div></div>
              {active.length===0 ? <div className="chart-empty"><ChartNoAxesCombined size={32}/><h3>Vyberte strany na porovnanie</h3><p>Kliknite na ich názvy nad grafom.</p><button className="text-button" onClick={()=>setActive(defaultActive)}>Obnoviť výber <ArrowRight size={16}/></button></div> : mode==="chart" ? <Suspense fallback={<div className="main-chart chart-loading" aria-hidden="true"/>}><ArchiveChart polls={visiblePolls} active={active} agency={trendAgency}/></Suspense> : <div className="chart-table"><Table><TableCaptionText>Preferencie {trendAgency} v percentách, so zdrojom pri každom meraní.</TableCaptionText><TableHeader><TableRow><TableHead>Strana</TableHead>{visiblePolls.map(p=><TableHead key={p.id}><Source poll={p} compact/></TableHead>)}</TableRow></TableHeader><TableBody>{parties.filter(p=>active.includes(p.id)).map(p=><TableRow key={p.id}><TableCell><span className="party-label"><i style={{background:p.color}}/>{p.short}</span></TableCell>{visiblePolls.map(poll=><TableCell key={poll.id}>{poll.values[p.id]===undefined?"—":`${fmt(poll.values[p.id])} %`}</TableCell>)}</TableRow>)}</TableBody></Table></div>}
              <div className="chart-bottom"><p><i className="dash-key"/>5 % · orientačná referencia</p><button className="text-button" onClick={()=>changeView("method")}>Ako čítať dáta <ArrowRight size={14}/></button></div>
              <div className="chart-sources"><span>Zdroj: {current.sourceName}</span><div>{visiblePolls.map(p=><a key={p.id} href={p.source} target="_blank" rel="noopener noreferrer">{p.month}<ArrowUpRight size={12}/></a>)}</div></div>
            </section>
            <section className="latest-card" aria-label={`Rebríček posledného merania ${trendAgency}`}><div className="latest-title"><h2>{current.month} <span>2026</span></h2><Activity size={22} aria-hidden="true"/></div><p className="latest-meta"><b>Posledné meranie {current.agency}</b><br/>Zber do {date(current.end)} · n = {current.sample?.toLocaleString("sk-SK")??"neuvedené"} · {current.type.toLowerCase()}</p><div className="ranking">{rank(current).slice(0,8).map((p,i)=>{const d=preceding?difference(current,preceding,p.id):null;return <button className="rank-row" key={p.id} onClick={()=>setParty(p)} aria-label={`${p.name}: ${fmt(current.values[p.id])} percent. Otvoriť detail.`}><span className="rank-index">{String(i+1).padStart(2,"0")}</span><div className="rank-party"><div><span>{p.short}</span><strong>{fmt(current.values[p.id])}<small>%</small></strong></div><div className="bar-track"><div style={{width:`${Math.min(100,current.values[p.id]/25*100)}%`,background:p.color}}/></div></div><span className="delta">{d===null?"—":`${d>0?"+":""}${fmt(d)}`}</span></button>})}</div><p className="ranking-note">8 najvyšších hodnôt · zmena v p. b.<br/>{preceding?`Oproti meraniu: ${preceding.month.toLowerCase()} 2026`:"Bez predchádzajúceho merania v archíve"}</p><Source poll={current}/><button className="full-link" onClick={()=>setDetail(current)}>Kompletný detail merania <ArrowRight size={18}/></button></section>
          </div>
          <div className="chart-explainer"><Info size={17}/><p>Graf spája merania jednej agentúry podľa dátumu zberu. Medzery medzi vlnami zachovávame. Drobné rozdiely môžu byť v rámci štatistickej neistoty.</p></div>
          <section className="comparison-section"><Heading aside={<button className="text-button" onClick={()=>changeView("polls")}>Archív {archive.length} meraní <ArrowRight size={16}/></button>}>Päť pohľadov na podporu strán</Heading><p className="section-description">Posledné meranie každej agentúry. Tabuľka zachováva pôvodné výsledky vedľa seba; na hlavnom prehľade z nich počítame transparentný vážený priemer.</p><p className="table-scroll-hint" aria-hidden="true">Potiahnite tabuľku do strany <ArrowRight size={15}/></p><div className="comparison-table panel" tabIndex={0} aria-label="Porovnávacia tabuľka; na úzkej obrazovke sa posúva vodorovne"><Table><TableCaptionText>Porovnanie posledných meraní piatich agentúr s dátumami a zdrojmi</TableCaptionText><TableHeader><TableRow><TableHead>Politický subjekt</TableHead>{snapshots.map(p=><TableHead key={p.id}><button onClick={()=>setDetail(p)} aria-label={`Detail merania ${p.agency}, ${p.month.toLowerCase()} 2026`}>{p.agency}<ChevronRight size={14} aria-hidden="true"/></button><span>{p.month} 2026</span></TableHead>)}</TableRow></TableHeader><TableBody>{parties.slice(0,8).map(p=><TableRow key={p.id}><TableCell><button className="party-label" onClick={()=>setParty(p)}><i style={{background:p.color}}/>{p.short}</button></TableCell>{snapshots.map(poll=><TableCell key={poll.id} style={{background:poll.values[p.id]===undefined?undefined:`${p.color}0c`}}>{poll.values[p.id]===undefined?"—":fmt(poll.values[p.id])+" %"}</TableCell>)}</TableRow>)}<TableRow className="comparison-sources"><TableCell>Pôvodné zdroje</TableCell>{snapshots.map(p=><TableCell key={p.id}><Source poll={p} compact/></TableCell>)}</TableRow></TableBody></Table></div><p className="secondary-note">Výber ôsmich subjektov pre rýchly prehľad. Ďalšie výsledky sú v detailoch meraní. SANEP nájdete v archíve.</p></section>
          <section className="context-strip"><ShieldCheck size={26}/><div><h3>Dôvera začína pri zdroji.</h3><p>Každé meranie má pôvodnú publikáciu, obdobie zberu a poznámky k metodike.</p></div><button onClick={()=>changeView("method")}>Metodika a pokrytie <ArrowRight size={18}/></button></section>
        </TabsContent>

        <TabsContent value="polls">
          <div className="section-hero"><section className="intro polls-intro"><div><h1>Archív meraní</h1><p className="intro-description">Kto sa pýtal, kedy a koho. Výsledky spolu s metodikou a pôvodným zdrojom.</p></div></section><SectionArt name="prieskumy"/></div>
          <div className="polls-aggregate-mobile"><PollAggregator onMethod={()=>changeView("method")}/></div>
          <div className="archive-toolbar"><label className="search-field"><Search size={18}/><Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Hľadať mesiac, agentúru alebo zadávateľa" aria-label="Hľadať v prieskumoch" autoComplete="off" spellCheck={false} enterKeyHint="search"/></label><Select value={agency} onValueChange={setAgency}><SelectTrigger aria-label="Agentúra" className="agency-select"><ListFilter size={15}/><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Všetky agentúry</SelectItem>{agencies.map(a=><SelectItem value={a} key={a}>{a}</SelectItem>)}</SelectContent></Select><span className="result-count" role="status">Počet meraní: {filtered.length}</span></div>
          <div className="archive-table panel"><Table><TableCaptionText>Archív meraní, od najnovšieho podľa konca zberu dát.</TableCaptionText><TableHeader><TableRow><TableHead>Agentúra / meranie</TableHead><TableHead>Zber dát</TableHead><TableHead>Vzorka</TableHead><TableHead>Metóda</TableHead><TableHead>Publikované</TableHead><TableHead>Zdroj</TableHead><TableHead><span className="sr-only">Detail</span></TableHead></TableRow></TableHeader><TableBody>{filtered.slice(0,archiveVisible).map(p=><TableRow key={p.id}><TableCell><button className="table-poll-title" onClick={()=>setDetail(p)}><b>{p.agency}</b><span>{p.month} 2026</span></button></TableCell><TableCell>{date(p.start)}<br/><span className="subtle">– {date(p.end)}</span></TableCell><TableCell className="tabular">{(p.sample?.toLocaleString("sk-SK")??"Neuvedené")}</TableCell><TableCell className="method-cell">{p.method}</TableCell><TableCell>{date(p.published)}</TableCell><TableCell><Source poll={p}/></TableCell><TableCell><button className="icon-button" onClick={()=>setDetail(p)} aria-label={`Detail ${p.agency}, ${p.month} 2026`}><span className="mobile-detail-label">Detail merania</span><ArrowRight size={19}/></button></TableCell></TableRow>)}</TableBody></Table>{archiveVisible<filtered.length&&<button className="archive-more" type="button" onClick={()=>setArchiveVisible(count=>Math.min(count+12,filtered.length))}>Zobraziť ďalšie merania <span>{Math.min(archiveVisible,filtered.length)} z {filtered.length}</span></button>}{filtered.length===0&&<div className="empty-state"><Search size={30}/><h3>Žiadne meranie nezodpovedá filtru</h3><p>Skúste iný výraz alebo zobrazte všetky agentúry.</p><button className="text-button" onClick={()=>{setAgency("all");setQuery("");}}>Vymazať filtre <ArrowRight size={16}/></button></div>}</div>
          <div className="data-note standalone"><Info size={18}/><p>Tento archív obsahuje výber {archive.length} meraní, nie všetky slovenské prieskumy. Vzorka označuje celý prieskum; základ volebného modelu môže byť menší. Pôvodné výsledky zostávajú oddelené a dohľadateľné aj po zavedení agregátora.</p></div>
          <PollAccuracy/>
        </TabsContent>

        <TabsContent value="parties">
          <section className="intro"><div><h1>Strany a ich profily</h1><p className="intro-description">Zameranie, ľudia a programy. Spoznajte strany za číslami a overte si, odkiaľ informácie pochádzajú.</p><button type="button" className="mag-text-link" onClick={()=>document.getElementById("porovnanie")?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"start"})}>Porovnať strany vedľa seba <ArrowRight size={16}/></button></div></section>
          <div className="archive-toolbar"><label className="search-field"><Search size={18}/><Input value={partyQuery} onChange={e=>setPartyQuery(e.target.value)} placeholder="Strana, skratka alebo osobnosť" aria-label="Hľadať politickú stranu" autoComplete="off" spellCheck={false} enterKeyHint="search"/></label><span className="result-count" role="status">{visibleParties.length} {visibleParties.length===1?"subjekt":visibleParties.length>=2&&visibleParties.length<=4?"subjekty":"subjektov"} · abecedné poradie</span></div>
          <h2 className="sr-only">Zoznam politických subjektov</h2><div className="party-grid">{visibleParties.map(p=><article className="party-card" key={p.id}><div className="party-card-top"><span className="party-monogram"><i style={{background:p.color}} aria-hidden="true"/>{p.short}</span>{partyLogoMap[p.id]&&<span className="party-card-logo"><Image src={partyLogoMap[p.id].src} alt="" width={52} height={52} unoptimized/></span>}</div><button className="party-card-action" onClick={()=>setParty(p)}><h3>{p.name}</h3><span>Pozrieť profil <ArrowRight size={16}/></span></button><PartyTags partyId={p.id}/>{partyProfiles[p.id]&&<p className="party-card-summary">{partyProfiles[p.id].summary}</p>}<div className="party-card-stat"><div><span>Model Mandát · vážený priemer</span><strong>{currentAggregate.values[p.id]===undefined?"—":`${fmt(currentAggregate.values[p.id].value)} %`}</strong></div><p className="party-card-second">{current.agency} · {current.month.toLowerCase()} 2026: <b>{current.values[p.id]===undefined?"—":`${fmt(current.values[p.id])} %`}</b></p><Result2023Line partyId={p.id}/><Source poll={current}/></div>{currentAggregate.values[p.id]===undefined&&<p className="missing-caption">Subjekt zatiaľ nie je v agregáte; jednotlivé merania sú v archíve.</p>}</article>)}</div>
          {visibleParties.length===0&&<div className="empty-state"><Search size={30}/><h3>Stranu sme v tomto výbere nenašli</h3><button className="text-button" onClick={()=>setPartyQuery("")}>Zobraziť všetky subjekty <ArrowRight size={16}/></button></div>}
          <Suspense fallback={<p className="chart-loading">Načítavame porovnanie…</p>}><PartyCompare selected={ui.compare} onSelect={ids=>update({compare:ids})} onOpen={id=>setParty(parties.find(p=>p.id===id)??null)}/></Suspense>
          <PartyMoney/>
          <div className="context-strip roadmap"><BookOpen size={25}/><div><h3>Od preferencií k programom</h3><p>V profiloch už nájdete prvé overené programové dokumenty. Historické verzie sú označené rokom. Medailóny osobností majú vlastné zdroje; kandidátne listiny do volieb 2027 zatiaľ neuvádzame.</p></div></div>
        </TabsContent>

        <TabsContent value="programmes"><ProgrammeLibrary/></TabsContent>
        <TabsContent value="method">
          <section className="intro"><div><h1>O dátach a metodike</h1><p className="intro-description">Čo v našich dátach nájdete, ako s nimi pracujeme a kde sú ich hranice.</p></div></section>
          <div className="method-layout"><aside className="method-aside"><h2>Overiteľnosť.<br/>Rovnaké pravidlá.<br/>Vlastný názor.</h2><p>Mandát je pracovný názov nezávislého hobby projektu. Prvá verzia vzniká lokálne, bez reklamy.</p><div className="method-stamp"><Check size={17}/>Kontrola zdrojov: {verified}</div></aside><div className="method-sections">
            <article><h3>Od čísla k pôvodnému meraniu</h3><p>Každý záznam odkazuje na konkrétnu publikáciu agentúry alebo zadávateľa. Evidujeme zber dát, publikovanie, celkovú vzorku, metódu a zadávateľa. Údaje sme prepísali ručne; aktualizácia zatiaľ nie je automatická.</p><p>Aktuálna edícia obsahuje {agencies.map(a=>`${a}: ${archive.filter(p=>p.agency===a).length}`).join(" · ")}. Pri výbere sme uprednostnili dostupnosť overiteľného zdroja. Pokrytie nie je úplné. Archív radíme podľa konca zberu dát, nie podľa uloženia dokumentu. Neuvedený dátum publikovania alebo vzorku označujeme priamo v detaile.</p></article>
            <article id="metodika-agregatora"><h3>Model Mandát · vážený priemer</h3><p>Hlavný trend spája {aggregateAgencies.join(", ")}. Pre každý dátum použijeme najnovšie dostupné meranie každej agentúry, ak sa zber skončil najviac {aggregateWindowDays} dní pred daným dátumom. Jedna agentúra tak v jednom bode vstupuje najviac raz. SANEP zatiaľ do agregátu nevstupuje, pretože v našom archíve nemá porovnateľnú časovú radu a použitý zdroj neuvádza metódu.</p><p>Váha merania klesá exponenciálne s polčasom {aggregateHalfLifeDays} dní a mierne sa mení podľa odmocniny celkovej veľkosti vzorky. Ak veľkosť vzorky chýba, výpočet použije neutrálnu referenciu 1 000. Zatiaľ neuplatňujeme známky kvality ani korekcie typického posunu agentúr, lebo nemáme vlastný spätný test ich presnosti.</p><p>Orientačné 95 % modelové pásmo kombinuje približnú výberovú neistotu a rozptyl medzi agentúrami; má minimálnu polovičnú šírku 0,8 bodu. Nie je to oficiálny interval spoľahlivosti agentúr a nezachytáva všetky zdroje chýb, napríklad systematický posun všetkých prieskumov. Model je priemer verejnej mienky v danom čase, nie predpoveď výsledku volieb.</p><div className="inline-sources">{aggregatePolls.map(p=><Source key={p.id} poll={p} compact/>)}</div><p>Aktuálny bod používa {currentAggregate.pollIds.length} pôvodných meraní. Vlastný volebný model začína z tohto agregátu; ďalšie zásahy používateľa sú samostatný matematický scenár.</p></article>
            <article><h3>Samostatné časové rady</h3><p>V dátovom prehľade si môžete ďalej prepnúť samostatné rady AKO, FOCUS, INFOSTAT, IPSOS a NMS. Časová os vychádza z konca zberu dát a pôvodné hodnoty ostávajú viditeľné bez úpravy agregátorom.</p><p>Rozdiel 19,2 % → 21,6 % znamená nárast o 2,4 percentuálneho bodu. Zmeny počítame z publikovaných zaokrúhlených hodnôt. Malé posuny samy osebe nedokazujú skutočný rast alebo pokles.</p><div className="inline-sources"><Source poll={previous}/><Source poll={latest}/></div></article>
            <article><h3>Chýbajúci údaj neznamená nulu</h3><p>Uvádzame iba presné hodnoty, ktoré máme overené. Ak sme výsledok neprepísali, zobrazujeme pomlčku. Čiastkové výsledky nedopĺňame odhadom na 100 %. V osobitne označenom scenári kresiel používame iba prepísané podiely; neznáma podpora môže jeho výsledok zmeniť.</p><p>Pri septembrovom NMS sa niektoré zmeny v slovnom komentári odlišujú od rozdielu publikovaných percent. Náš výpočet používa percentá: napríklad REPUBLIKA 15,6 − 13,3 = +2,3 bodu. Túto odchýlku uvádzame aj v detaile merania.</p><Source poll={latest}/></article>
            <article><h3>Scenár kresiel</h3><p>Ľavý polkruh uvádza oficiálne mandáty z volieb 30. septembra 2023. Nezobrazuje dnešné poslanecké kluby. Historická koalícia OĽANO a priatelia je samostatný subjekt; nestotožňujeme ju automaticky s dnešným Hnutím Slovensko.</p><p>Pravý polkruh je orientačný scenár z jedného prieskumu, nie predpoveď ani výpočet agentúry. Všetkým prepísaným subjektom priraďujeme hranicu 5 %. Vo voľbách majú koalície dvoch alebo troch strán hranicu 7 % a koalície štyroch či viacerých 10 %; ich budúce zloženie nepredpokladáme.</p><p>Súčet podielov postupujúcich subjektov delíme číslom 151. Z celočíselných podielov rozdelíme prvé kreslá, zvyšné podľa najväčších zostatkov; prípadné prebytočné kreslo odpočítame pri najmenšom zostatku. Na rozdiel od zákonného výpočtu z hlasov pracujeme s percentami a volebné číslo nezaokrúhľujeme na celé hlasy. Pri úplnej zhode používa scenár stabilné poradie vstupu, kým zákon pozná žreb.</p><p>Neprepísaný zvyšok do 100 % počítame po odčítaní samostatne uvedenej kategórie „iné“. Nie je to priamo nameraný údaj a pri zaokrúhlení môže byť nepresný. Neznáme a nerozdelené podiely do prepočtu nezaraďujeme. Podpora tesne pri hranici, iné koaličné zloženie či zaokrúhlenie môžu počet kresiel výrazne zmeniť.</p><a className="source-link" href="https://static.slov-lex.sk/static/SK/ZZ/2014/180/20260601.html" target="_blank" rel="noopener noreferrer">Zákon 180/2014 Z. z. · § 66 a § 68 <ArrowUpRight size={14}/></a><br/><a className="source-link" href={election2023.source} target="_blank" rel="noopener noreferrer">Štatistický úrad SR · voľby 2023 <ArrowUpRight size={14}/></a></article>
            <article><h3>Koalícia a opozícia</h3><p>Vládnu koalíciu tvoria SMER, HLAS a SNS; koaličnú zmluvu podpísali 16. októbra 2023. Opozičný blok v prehľade tvoria PS, KDH, SaS a Demokrati; Demokrati nemajú od volieb 2023 mandát. Bloky sú redakčné zoskupenie na čítanie čísel, nie tvrdenie o budúcej vláde.</p><p>Voliteľní partneri sú označený predpoklad redakcie: REPUBLIKA k dnešnej koalícii, Hnutie Slovensko (nástupca OĽANO) k opozičnému bloku. Pri voľbách 2023 sa tento partner počíta za historickú koalíciu OĽANO a priatelia. Zapnutie partnera je voľba čitateľa a je uložená v adrese stránky. Väčšina je 76 zo 150 kresiel, ústavná väčšina 90 (čl. 84 ods. 4 Ústavy SR). Rovnaké bloky počítame nad oficiálnymi mandátmi z roku 2023 aj nad scenárom; scenár nie je predpoveď.</p><div className="inline-sources"><a className="source-link" href={blocs[0].source} target="_blank" rel="noopener noreferrer">{blocs[0].sourceName}<ArrowUpRight size={14}/></a><a className="source-link" href={blocs[1].source} target="_blank" rel="noopener noreferrer">{blocs[1].sourceName}<ArrowUpRight size={14}/></a></div></article>
            <article><h3>Päť percent je orientačná referencia</h3><p>Prerušovaná čiara označuje zákonnú hranicu pre samostatnú stranu. Koalície majú odlišné prahy. Prekročenie čiary v prieskume nie je zárukou získania mandátov vo voľbách.</p><a className="source-link" href="https://static.slov-lex.sk/static/SK/ZZ/2014/180/20260601.html" target="_blank" rel="noopener noreferrer">Zákon 180/2014 Z. z. · § 66 <ArrowUpRight size={14}/></a></article>
            <article><h3>Rovnaký meter pre všetkých</h3><p>Strany v adresári radíme abecedne, v rebríčku podľa nameranej hodnoty. Farby slúžia na rozlíšenie sérií. Neodporúčame, koho voliť, a nezbierame politické preferencie návštevníkov.</p><p>NMS pri publikovaní výsledkov žiada označenie NMS Market Research Slovakia a aktívny odkaz na článok. Túto požiadavku dodržiavame. Uvedenie zdroja samo osebe nenahrádza preverenie práv na systematické preberanie databáz, grafík či fotografií. Web kreslí vlastné grafy.</p><Source poll={latest}/></article>
          </div></div>
          <section className="coverage-section"><Heading>Agentúry a pokrytie dát</Heading><p className="section-description">Stav overenia: {verified}. Nenájdená správa neznamená, že výskum neexistuje.</p><div className="coverage-grid">{sourceCoverage.map(c=><article key={c.agency}><div><h3>{c.agency}</h3><button className="text-button" onClick={()=>{setAgency(c.agency);setQuery("");changeView("polls");}}>Počet meraní: {archive.filter(p=>p.agency===c.agency).length} <ArrowRight size={15}/></button></div><p>{c.description}</p><p className="coverage-note">{c.note}</p><a className="source-link" href={c.source} target="_blank" rel="noopener noreferrer">{c.agency==="NMS"?"NMS Market Research Slovakia":"Pôvodný zdroj / archív"}<ArrowUpRight size={14}/></a></article>)}</div></section>
          <PartyLogoSources/>
          <PersonPhotoSources/>
          <section className="source-register"><Heading>Register zdrojov</Heading><div className="panel"><div className="source-register-row"><span><b>Štatistický úrad SR</b> · voľby do NR SR 2023</span><span>{date(election2023.electionDate)}</span><a className="source-link" href={election2023.source} target="_blank" rel="noopener noreferrer">Oficiálne výsledky 2023 <ArrowUpRight size={14}/><span className="sr-only"> (otvorí sa v novej karte)</span></a></div>{archive.map(p=><div className="source-register-row" key={p.id}><span><b>{p.agency}</b> · {p.month} 2026</span><span>{date(p.published)}</span><Source poll={p}/></div>)}</div></section>
        </TabsContent>
      </main>
    </Tabs>
    <footer><button className="brand small" onClick={()=>changeView("overview")} aria-label="Mandát — úvod"><BrandMark/>mandát.</button><p>Nezávislý hobby projekt. Bez reklamy.</p><button className="text-button" onClick={()=>changeView("method")}>Metodika a zdroje <ArrowRight size={13}/></button><span>Dáta skontrolované {verified}</span></footer>

    <Sheet open={openNews!==null} onOpenChange={open=>{if(!open)update({news:null});}}><SheetContent className="detail-sheet news-sheet">{openNews&&<><SheetHeader><SheetTitle>{openNews.title}</SheetTitle><SheetDescription>{openNews.category} · {date(openNews.published)} · naše zhrnutie</SheetDescription></SheetHeader><div className="sheet-body news-sheet-body">{openNews.detail.map((paragraph,i)=><p key={i}>{paragraph}</p>)}<div className="news-sheet-source"><h3>Zdroj</h3><p>Zhrnutie sme napísali z článku, ktorý vydal {openNews.sourceName}. Kontrola zdrojov {date(newsChecked)}.</p><a href={openNews.source} target="_blank" rel="noopener noreferrer">Čítať pôvodný článok<ArrowUpRight size={15} aria-hidden="true"/><span className="sr-only"> (otvorí sa v novej karte)</span></a></div></div><SheetClose className="sheet-bottom-close">Zavrieť</SheetClose></>}</SheetContent></Sheet>
    <Sheet open={detail!==null} onOpenChange={open=>{if(!open)setDetail(null);}}><SheetContent className="detail-sheet">{detail&&<><SheetHeader><SheetTitle>{detail.agency} · {detail.month.toLowerCase()} 2026</SheetTitle><SheetDescription>Detail merania · {detail.type.toLowerCase()} · publikované {date(detail.published)}</SheetDescription></SheetHeader><div className="sheet-body"><dl className="poll-facts"><div><dt>Zber dát</dt><dd>{date(detail.start)} – {date(detail.end)}</dd></div><div><dt>Celková vzorka</dt><dd>{detail.sample===null?"Neuvedené v použitom zdroji":`${detail.sample.toLocaleString("sk-SK")} respondentov`}</dd></div><div><dt>Metóda</dt><dd>{detail.method}</dd></div><div><dt>Zadávateľ</dt><dd>{detail.client}</dd></div></dl><div className="primary-source"><span>Pôvodná publikácia</span><Source poll={detail}/><SourceFallback poll={detail}/></div><PollValues poll={detail}/>{detail.other!==undefined&&<p className="other-results">Iné strany (kategória zdroja) <b>{fmt(detail.other)} %</b></p>}<div className="data-note standalone"><Info size={17}/><p>Prepísané výsledky môžu tvoriť iba časť distribúcie. Neuvedený subjekt neznamená nulovú podporu. Úplné výsledky a metodiku nájdete v zdroji.</p></div>{detail.note&&<div className="editor-note"><h3>Poznámka k údajom</h3><p>{detail.note}</p></div>}<SheetClose className="sheet-close-bottom">Zavrieť detail</SheetClose></div></>}</SheetContent></Sheet>
    <Sheet modal={false} open={party!==null} onOpenChange={open=>{if(!open)setParty(null);}}><SheetContent key={party?.id??"party"} id="party-profile" className="detail-sheet party-profile-sheet" showOverlay={false} onInteractOutside={event=>event.preventDefault()}>{party&&<><SheetHeader><SheetTitle>{party.name}</SheetTitle><SheetDescription>{currentAggregate.values[party.id]===undefined?"Bez hodnoty v agregáte":`Model Mandát ${fmt(currentAggregate.values[party.id].value)} %`} · zameranie, osobnosti, prieskumy, programy</SheetDescription></SheetHeader><div className="sheet-body"><PartyProfileOverview partyId={party.id}/><h2 className="profile-polls-heading">Podpora v prieskumoch</h2><div className="party-detail-head"><span style={{color:party.color}}>{currentAggregate.values[party.id]===undefined?"—":`${fmt(currentAggregate.values[party.id].value)} %`}</span><p>Model Mandát · vážený priemer<br/><Source poll={aggregatePoll}/></p></div><Table><TableCaptionText>{party.name} — posledné meranie každej z piatich agentúr</TableCaptionText><TableHeader><TableRow><TableHead>Posledné meranie</TableHead><TableHead className="number-cell">Podpora</TableHead><TableHead>Zdroj</TableHead></TableRow></TableHeader><TableBody>{snapshots.map(p=><TableRow key={p.id}><TableCell>{p.agency}<span className="cell-caption">{p.month} 2026</span></TableCell><TableCell className="number-cell">{p.values[party.id]===undefined?"—":`${fmt(p.values[party.id])} %`}</TableCell><TableCell><Source poll={p} compact/></TableCell></TableRow>)}</TableBody></Table><div className="data-note standalone"><Info size={17}/><p>Hlavné číslo je rovnaký vážený priemer ako v ľavom paneli. Nižšie je iba najnovšie dostupné meranie každej z piatich vstupných agentúr; ich rozdielne metódy môžu viesť k odlišným výsledkom.</p></div>{casesEnabled&&<Suspense fallback={null}><PartyCases partyId={party.id} onCases={id=>{update({party:null,view:"cases",caseParty:id},true);window.scrollTo({top:0,behavior:"instant"});}}/></Suspense>}<PartyDocuments partyId={party.id}/><div className="editor-note profile-next"><h3>Kandidátne listiny 2027</h3><p>Aktuálne osobnosti strany nie sú automaticky kandidátmi do ďalších volieb. Overené kandidátne listiny doplníme po ich zverejnení.</p></div><SheetClose className="sheet-close-bottom">Zavrieť profil</SheetClose></div></>}</SheetContent></Sheet>
  </div>;
}




