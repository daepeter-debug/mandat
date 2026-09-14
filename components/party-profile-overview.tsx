"use client";
import { useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight, ChevronDown, Landmark, UserRound } from 'lucide-react';
import { partyProfiles, type Personality } from '@/lib/party-profiles';
import { date } from '@/lib/polls';
import { formatTenureDate, governmentTenure, tenureAsOf, tenureLabel, tenureMethodology } from '@/lib/government-tenure';
import { casesForParty, caseStatuses, casesChecked, politicalCases } from '@/lib/political-cases';
import { SeverityChip } from '@/components/political-cases';

function Portrait({person}:{person:Personality}) {
  const [failed,setFailed]=useState(false);
  return <div className="person-portrait">{failed?<UserRound size={32} aria-hidden="true"/>:<Image src={person.photo} alt={person.name} width={104} height={120} loading="lazy" unoptimized onError={()=>setFailed(true)}/>}</div>;
}
export function PartyTags({partyId}:{partyId:string}) {
  const profile=partyProfiles[partyId];
  return profile?<ul className="party-tags" aria-label="Zameranie strany">{profile.tags.map(tag=><li key={tag}>{tag}</li>)}</ul>:null;
}

function PartyGovernmentTenure({partyId}:{partyId:string}) {
  const tenure=governmentTenure[partyId];
  if(!tenure)return null;
  return <details className="government-tenure">
    <summary aria-label={`Podrobnosti o účasti vo vláde: ${tenureLabel(tenure)}`}>
      <Landmark size={15} aria-hidden="true"/>
      <span><small>Vo vláde</small><strong>{tenureLabel(tenure)}</strong></span>
      <ChevronDown className="tenure-chevron" size={14} aria-hidden="true"/>
    </summary>
    <div className="tenure-detail">
      <p className="tenure-method">{tenureMethodology.label}</p>
      {tenure.periods.length>0?<ol>{tenure.periods.map(period=><li key={`${period.start}-${period.government}`}>
        <span><time dateTime={period.start}>{formatTenureDate(period.start)}</time> – {period.end?<time dateTime={period.end}>{formatTenureDate(period.end)}</time>:'súčasnosť'}</span>
        <strong>{period.government}</strong>
        <small>{period.basis==='coalition'?'Člen vládnej koalície':'Člen alebo nominant v kabinete'}{period.note?` · ${period.note}`:''}</small>
        <a href={period.source} target="_blank" rel="noopener noreferrer">Zdroj <ArrowUpRight size={10}/><span className="sr-only"> (nová karta)</span></a>
      </li>)}</ol>:<p className="tenure-empty">{tenure.note}</p>}
      {tenure.periods.length>0&&tenure.note?<p className="tenure-note">{tenure.note}</p>:null}
      {tenure.predecessorNote?<p className="tenure-predecessor"><strong>Predchodcovia:</strong> {tenure.predecessorNote}</p>:null}
      <p className="tenure-foot">Súčet je prepočet dní na celé roky a mesiace, stav k {formatTenureDate(tenureAsOf)}. <a href={tenureMethodology.source} target="_blank" rel="noopener noreferrer">Metodika a história vlád <ArrowUpRight size={10}/></a></p>
    </div>
  </details>;
}

export function PartyCases({partyId,onCases}:{partyId:string;onCases?:(partyId:string)=>void}) {
  const rows=casesForParty(partyId);
  const counts=Object.entries(caseStatuses).map(([id,label])=>[label,rows.filter(c=>c.status===id).length] as const).filter(([,n])=>n>0);
  return <section className="profile-cases" aria-labelledby="profile-cases-title">
    <div className="profile-section-heading"><h2 id="profile-cases-title">Kauzy v registri</h2><span>{rows.length===0?'Pilotný register':rows.length===1?'1 prípad':`${rows.length} prípady`}</span></div>
    {rows.length>0?<>
      <p className="profile-cases-summary">{counts.map(([label,n])=>`${n}× ${label.toLowerCase()}`).join(' · ')} · najvyššia závažnosť {Math.max(...rows.map(c=>c.severity))} z 10.</p>
      <ul className="profile-case-list">{rows.map(c=><li key={c.id}><SeverityChip value={c.severity} compact/><div><strong>{c.title}</strong><span>{caseStatuses[c.status]} · {c.period}</span></div><a href={c.source} target="_blank" rel="noopener noreferrer" aria-label={`Zdroj: ${c.sourceName}`}><ArrowUpRight size={13}/></a></li>)}</ul>
    </>:<p className="profile-cases-empty">V pilotnom registri zatiaľ bez prípadu. Neznamená to, že strana kauzy nemá; register má {politicalCases.length} prípadov a dopĺňame ho ručne.</p>}
    <p className="profile-cases-foot">Väzba na stranu znamená konkrétneho predstaviteľa alebo rezort, nie vinu celej strany. Závažnosť je redakčné hodnotenie podľa zverejnenej stupnice, kontrola zdrojov {date(casesChecked)}.{onCases&&<> <button className="profile-cases-link" onClick={()=>onCases(partyId)}>Otvoriť kauzy strany <ArrowUpRight size={12}/></button></>}</p>
  </section>;
}

export default function PartyProfileOverview({partyId}:{partyId:string}) {
  const profile=partyProfiles[partyId];
  if(!profile)return <div className="profile-overview"><section className="profile-summary"><h2>O strane</h2><p>Medailón a aktuálne vedenie tejto strany ešte nemáme overené. Dostupné merania a programové dokumenty nájdete nižšie.</p></section></div>;
  return <div className="profile-overview">
    <section className="profile-summary" aria-label="Predstavenie strany"><div className="profile-meta-row"><PartyTags partyId={partyId}/><PartyGovernmentTenure partyId={partyId}/></div><h2>Čím sa profiluje</h2><p>{profile.summary}</p><a className="profile-source" href={profile.source} target="_blank" rel="noopener noreferrer">Podklad k zameraniu <ArrowUpRight size={12}/><span className="sr-only"> (nová karta)</span></a><p className="profile-editorial-note">Redakčné zhrnutie uvedených podkladov. Deklarované priority nie sú hodnotením výsledkov ani úplnou politologickou klasifikáciou.</p></section>
    <section className="profile-people" aria-labelledby="profile-people-title"><div className="profile-section-heading"><h2 id="profile-people-title">Ľudia za stranou</h2><span>{profile.people.length===1?'Prvý medailón':'Výber osobností'}</span></div><div className="person-list">{profile.people.map(person=><article className="person-item" key={person.id}><Portrait person={person}/><div><h3>{person.name}</h3><span className="person-role">{person.role}</span><p>{person.bio}</p><div className="person-sources"><a href={person.source} target="_blank" rel="noopener noreferrer">Zdroj profilu <ArrowUpRight size={11}/></a><a href={person.imageSource} target="_blank" rel="noopener noreferrer" aria-label={`Zdroj fotografie: ${person.name}`}>Foto <ArrowUpRight size={11}/></a></div></div></article>)}</div><p className="profile-editorial-note">Kontrola podkladov {date(profile.verified)}. Výber nie je rebríček popularity ani kandidátna listina pre voľby 2027.</p></section>
  </div>;
}
