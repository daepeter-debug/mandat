"use client";
import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { deputyFootprint, footprintWindow, footprintPageSize } from '@/lib/deputy-footprint';
import { type DeputiesData, type DeputyRow } from '@/lib/deputies';
import { kindNames, markColors, markNames, marks, skDay, voteSource, type VoteSummary } from '@/lib/votes';
import '@/app/deputy-footprint.css';

export default function DeputyFootprint({ data, row, byId, current, onVote }: {
  data: DeputiesData; row: DeputyRow; byId: ReadonlyMap<number, VoteSummary>; current: number | null; onVote: (id: number) => void;
}) {
  const items = useMemo(() => deputyFootprint(data, row, byId), [data, row, byId]);
  const currentId = current === null ? null : data.hlasovania[current];
  const years = [...new Set(items.map(i => i.vote.datum.slice(0, 4)))];
  const initial = items.find(i => i.id === currentId), initialYear = initial?.vote.datum.slice(0, 4) ?? years.at(-1) ?? '';
  const sameYear = items.filter(i => i.vote.datum.startsWith(initialYear));
  const initialPage = initial ? Math.floor((sameYear.length - 1 - sameYear.findIndex(i => i.id === initial.id)) / footprintPageSize) : 0;
  const [year, setYear] = useState(initialYear);
  const [page, setPage] = useState(initialPage), [picked, setPicked] = useState<number | null>(currentId ?? items.at(-1)?.id ?? null);
  const detail = useRef<HTMLDivElement>(null);
  const pick = (id: number) => {
    setPicked(id);
    requestAnimationFrame(() => {
      const el = detail.current;
      if (el && matchMedia('(max-width:760px)').matches && el.getBoundingClientRect().bottom > innerHeight - 96)
        el.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' });
    });
  };
  const window = footprintWindow(items, year, page);
  const selected = window.items.find(i => i.id === picked) ?? null;
  return <section className="deputy-footprint" aria-labelledby="footprint-title">
    <div className="footprint-heading"><h4 id="footprint-title">Hlasovacia stopa</h4><span>{items.length} hlasovaní</span></div>
    <p className="footprint-intro">Jedno políčko, jeden hlas v našom archíve. Ťukni a pozri si podrobnosti.</p>
    <div className="footprint-years" role="group" aria-label="Rok hlasovacej stopy">{years.map(y => <button key={y} type="button" aria-pressed={year === y} onClick={() => { setYear(y); setPage(0); setPicked(null); }}>{y}</button>)}</div>
    <div className="footprint-grid" role="group" aria-label={`Hlasy v roku ${year}, od najstaršieho k najnovšiemu v zobrazenom výreze`}>{window.items.map(i => <button key={i.id} type="button"
      style={{ '--vote-color': markColors[i.mark] } as CSSProperties} data-differs={i.differs || undefined} aria-pressed={picked === i.id} aria-current={i.id === currentId ? 'true' : undefined}
      aria-label={`${skDay(i.vote.datum)}, ${markNames[i.mark]}${i.differs ? ', inak ako klub' : ''}: ${i.vote.nazov}`} title={`${skDay(i.vote.datum)} · ${markNames[i.mark]}`}
      onClick={() => pick(i.id)}><span aria-hidden="true"/></button>)}</div>
    {window.items.length > 0 && <div className="footprint-axis"><time dateTime={window.items[0].vote.datum}>{skDay(window.items[0].vote.datum)}</time><ArrowRight size={12} aria-hidden="true"/><time dateTime={window.items.at(-1)!.vote.datum}>{skDay(window.items.at(-1)!.vote.datum)}</time></div>}
    {window.pages > 1 && <div className="footprint-pager"><button type="button" disabled={window.page === window.pages - 1} onClick={() => { setPage(window.page + 1); setPicked(null); }}><ChevronLeft size={15} aria-hidden="true"/>Staršie</button><span>{window.page + 1} / {window.pages}</span><button type="button" disabled={window.page === 0} onClick={() => { setPage(window.page - 1); setPicked(null); }}>Novšie<ChevronRight size={15} aria-hidden="true"/></button></div>}
    <ul className="footprint-key" aria-label="Farby hlasov">{marks.map(m => <li key={m}><i style={{ background: markColors[m] }} aria-hidden="true"/>{markNames[m]}</li>)}<li><i className="footprint-diff-key" aria-hidden="true"/>značka = inak ako klub</li></ul>
    {selected ? <div ref={detail} className="footprint-selection" aria-live="polite">
      <div><time dateTime={selected.vote.datum}>{skDay(selected.vote.datum)}</time><span>{kindNames[selected.vote.druh]}</span><strong><i style={{ background: markColors[selected.mark] }} aria-hidden="true"/>{markNames[selected.mark]}{selected.differs && ' · inak ako klub'}</strong></div>
      <p>{selected.vote.nazov}</p><div className="footprint-selection-actions"><button type="button" onClick={() => onVote(selected.id)}>Ukázať hlasovanie v sále<ArrowUpRight size={15} aria-hidden="true"/></button><a href={voteSource(selected.id)} target="_blank" rel="noopener noreferrer">NR SR<ArrowUpRight size={13} aria-hidden="true"/><span className="sr-only"> (nová karta)</span></a></div>
    </div> : <p className="footprint-prompt" aria-live="polite">Vyber farebné políčko. Tu sa zobrazí názov hlasovania a hlas poslanca.</p>}
    <p className="footprint-note">Výber záverečných hlasovaní, nie všetky hlasovania NR SR. Farby nehodnotia poslanca; dôvod hlasu z nich nezistíme.</p>
  </section>;
}
