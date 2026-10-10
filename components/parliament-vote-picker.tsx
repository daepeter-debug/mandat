"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, ListFilter, Search, X } from 'lucide-react';
import { kindNames, matchesQuery, skDay, voteTopic, type VoteKind, type VoteSummary } from '@/lib/votes';

type Props = {
  votes: VoteSummary[] | null;
  selected: VoteSummary | null;
  failed: boolean;
  onSelect: (id: number) => void;
};

const PAGE = 40;

/**
 * Lišta v rohu sály na celú obrazovku: zbalená ukazuje len tému zvoleného hlasovania, ťuknutím sa rozbalí zoznam.
 * Výber hlasovania lištu znova zbalí, neposúva stránku a nezatvára sálu.
 */
export function ParliamentVotePicker({ votes, selected, failed, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'vsetky' | VoteKind>('vsetky');
  const [limit, setLimit] = useState(PAGE);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const filtered = useMemo(() => votes?.filter(v => (kind === 'vsetky' || v.druh === kind) && matchesQuery(v, query)) ?? [], [votes, kind, query]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  const close = () => { setOpen(false); setTimeout(() => trigger.current?.focus({ preventScroll: true }), 0); };
  const expand = () => {
    // Zvolené hlasovanie má byť v zozname hneď vidieť, aj keď je staršie ako prvá strana.
    const at = selected ? filtered.findIndex(v => v.id === selected.id) : -1;
    if (at >= limit) setLimit(at + 10);
    setOpen(true);
    // Posúva len zoznam (scrollIntoView by posunul aj sálu na celú obrazovku).
    setTimeout(() => {
      const list = root.current?.querySelector<HTMLElement>('.par3d-vote-results'), item = list?.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (list && item) list.scrollTop += item.getBoundingClientRect().top - list.getBoundingClientRect().top - (list.clientHeight - item.offsetHeight) / 2;
    }, 0);
  };
  const topic = selected ? voteTopic(selected.nazov) : null;

  return <div ref={root} className="par3d-vote-picker" data-open={open} onKeyDown={event => {
    if (open && event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
  }}>
    <button ref={trigger} type="button" hidden={open} className="par3d-vote-trigger" aria-expanded={open} aria-controls={open ? 'par3d-vote-menu' : undefined}
      aria-label={topic ? `Hlasovanie: ${topic}, ${skDay(selected!.datum)}, ${selected!.preslo ? 'prešlo' : 'neprešlo'}. Zmeniť hlasovanie` : 'Vybrať hlasovanie'}
      title={selected?.nazov} onClick={() => open ? close() : expand()}>
      <ListFilter size={16} aria-hidden="true"/>
      {topic && selected
        ? <span><b>{topic}</b><small>{skDay(selected.datum)} · <em data-passed={selected.preslo}>{selected.preslo ? 'Prešlo' : 'Neprešlo'}</em></small></span>
        : <span><b>Vybrať hlasovanie</b>{votes && <small>{votes.length} hlasovaní NR SR</small>}</span>}
      <ChevronDown size={15} aria-hidden="true"/>
    </button>
    {open && <section id="par3d-vote-menu" className="par3d-vote-menu" aria-labelledby="par3d-vote-menu-title">
      <h3 id="par3d-vote-menu-title" className="sr-only">Hlasovania NR SR</h3>
      <div className="par3d-vote-filters">
        <label className="par3d-vote-search"><Search size={16} aria-hidden="true"/><input type="search" aria-label="Hľadať hlasovanie v sále" placeholder="Hľadať" value={query} onChange={event => { setQuery(event.target.value); setLimit(PAGE); }}/></label>
        <select aria-label="Druh hlasovania v sále" value={kind} onChange={event => { setKind(event.target.value as typeof kind); setLimit(PAGE); }}>
          <option value="vsetky">Všetky</option>{Object.entries(kindNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button type="button" className="par3d-vote-close" aria-label="Zbaliť výber hlasovaní" onClick={close}><X size={18} aria-hidden="true"/></button>
      </div>
      <p className="par3d-vote-menu-count" role="status">{failed ? 'Hlasovania sa nepodarilo načítať. Obnov stránku.' : votes === null ? 'Načítavajú sa hlasovania…' : `${filtered.length} hlasovaní · od najnovších`}</p>
      <div className="par3d-vote-results">
        <ul aria-label="Výber hlasovaní v sále">{filtered.slice(0, limit).map(v => <li key={v.id}>
          <button type="button" aria-pressed={selected?.id === v.id} title={v.nazov} onClick={() => { onSelect(v.id); close(); }}>
            <span className="par3d-vote-option-meta"><time dateTime={v.datum}>{skDay(v.datum)}</time><span>č. {v.cislo} · {kindNames[v.druh]}</span>{selected?.id === v.id && <Check size={15} aria-hidden="true"/>}</span>
            <b>{voteTopic(v.nazov)}</b>
            <span className="par3d-vote-option-result" data-passed={v.preslo}>{v.preslo ? 'Prešlo' : 'Neprešlo'}<span>Za {v.za} · proti {v.proti}</span></span>
          </button>
        </li>)}</ul>
        {votes !== null && !failed && !filtered.length && <p className="par3d-vote-empty">Nič sa nenašlo. Skús iný názov, dátum alebo druh hlasovania.</p>}
        {filtered.length > limit && <button type="button" className="par3d-vote-more" onClick={() => setLimit(limit + PAGE)}>Zobraziť ďalšie hlasovania</button>}
      </div>
    </section>}
  </div>;
}
