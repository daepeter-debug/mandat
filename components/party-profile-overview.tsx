"use client";
import { useState } from 'react';
import { ArrowUpRight, ChevronDown, Landmark } from 'lucide-react';
import { partyProfiles, peopleImagesChecked, peopleWithPhoto, peopleWithoutPhoto, type Personality } from '@/lib/party-profiles';
import { date } from '@/lib/polls';
import { formatTenureDate, governmentTenure, tenureAsOf, tenureLabel, tenureMethodology } from '@/lib/government-tenure';

const photoSet=(photo:string)=>[1,2,3].map(n=>`${photo.replace(/-2x\.webp$/,'')}-${n}x.webp ${n}x`).join(', ');
const initials=(name:string)=>{const parts=name.trim().split(/\s+/);return (parts[0][0]+(parts.length>1?parts[parts.length-1][0]:'')).toUpperCase();};
function Portrait({person}:{person:Personality}) {
  const [failed,setFailed]=useState(false);
  // Bez voľne licencovanej fotografie (alebo pri chybe načítania) stojí na mieste portrétu monogram.
  if(!person.photo||failed)return <div className="person-portrait person-monogram" aria-hidden="true"><span>{initials(person.name)}</span></div>;
  // Tri hustoty (96/192/288 px) vyrezané a zmenšené vopred, aby prehliadač nezmenšoval päťnásobne veľký obrázok.
  // eslint-disable-next-line @next/next/no-img-element -- srcSet podľa hustoty displeja, next/image ho pri unoptimized nepodporuje
  return <div className="person-portrait"><img src={person.photo} srcSet={photoSet(person.photo)} alt={person.name} width={192} height={234} loading="lazy" decoding="async" onError={()=>setFailed(true)}/></div>;
}
const photoCredit=(p:Personality)=>`${p.imageAuthor}, ${p.imageYear} · ${p.imageLicense}`;

export function PersonPhotoSources() {
  const withPhoto=peopleWithPhoto();const without=peopleWithoutPhoto();
  return <section className="party-logo-sources photo-sources" aria-labelledby="photo-sources-title"><h2 id="photo-sources-title">Fotografie osobností</h2><p>Portréty v profiloch strán preberáme z Wikimedia Commons, kde ich autori zverejnili pod voľnými licenciami (Creative Commons, voľné dielo), a z fotoarchívu Rady Európskej únie, ktorý reprodukciu dovoľuje pri uvedení zdroja a označení úprav. Pri každej fotografii uvádzame autora, rok vzniku a licenciu; časť záberov sú výrezy z väčších fotografií a rok vzniku neoznačuje aktuálnosť funkcie. Kde voľná fotografia nie je, zobrazujeme monogram. Kontrola licencií: {date(peopleImagesChecked)}.</p>
    <ul>{withPhoto.map(p=><li key={p.id}><a href={p.imageSource} target="_blank" rel="noopener noreferrer"><strong>{p.name}</strong><span>{p.imageAuthor}, {p.imageYear}</span><span className="sr-only"> (Wikimedia Commons, nová karta)</span></a><a className="photo-license" href={p.imageLicenseUrl} target="_blank" rel="noopener noreferrer">{p.imageLicense}<span className="sr-only"> (text licencie, nová karta)</span></a>{p.imageNote&&<small>{p.imageNote}</small>}</li>)}</ul>
    {without.length>0&&<ul className="photo-sources-missing" aria-label="Osobnosti bez fotografie">{without.map(p=><li key={p.id}><strong>{p.name}</strong> — {p.imageNote}</li>)}</ul>}
  </section>;
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

export default function PartyProfileOverview({partyId}:{partyId:string}) {
  const profile=partyProfiles[partyId];
  if(!profile)return <div className="profile-overview"><section className="profile-summary"><h2>O strane</h2><p>Medailón a aktuálne vedenie tejto strany ešte nemáme overené. Dostupné merania a programové dokumenty nájdete nižšie.</p></section></div>;
  return <div className="profile-overview">
    <section className="profile-summary" aria-label="Predstavenie strany"><div className="profile-meta-row"><PartyTags partyId={partyId}/><PartyGovernmentTenure partyId={partyId}/></div><h2>Čím sa profiluje</h2><p>{profile.summary}</p><a className="profile-source" href={profile.source} target="_blank" rel="noopener noreferrer">Podklad k zameraniu <ArrowUpRight size={12}/><span className="sr-only"> (nová karta)</span></a><p className="profile-editorial-note">Redakčné zhrnutie uvedených podkladov. Deklarované priority nie sú hodnotením výsledkov ani úplnou politologickou klasifikáciou.</p></section>
    <section className="profile-people" aria-labelledby="profile-people-title"><div className="profile-section-heading"><h2 id="profile-people-title">Ľudia za stranou</h2><span>{profile.people.length===1?'Prvý medailón':'Výber osobností'}</span></div><div className="person-list">{profile.people.map(person=><article className="person-item" key={person.id}><Portrait person={person}/><div><h3>{person.name}</h3><span className="person-role">{person.role}</span><p>{person.bio}</p><div className="person-sources"><a href={person.source} target="_blank" rel="noopener noreferrer">Zdroj profilu <ArrowUpRight size={11}/></a>{person.photo?<a className="person-credit" href={person.imageSource} target="_blank" rel="noopener noreferrer" aria-label={`Fotografia na Wikimedia Commons: ${photoCredit(person)}`}>Foto: {photoCredit(person)} <ArrowUpRight size={11}/></a>:<span className="person-credit-missing">Bez voľne licencovanej fotografie</span>}</div></div></article>)}</div><p className="profile-editorial-note">Kontrola podkladov {date(profile.verified)}. Výber nie je rebríček popularity ani kandidátna listina pre voľby 2027.</p></section>
  </div>;
}
