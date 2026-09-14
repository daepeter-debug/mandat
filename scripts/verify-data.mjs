import assert from 'node:assert/strict';
import { politicalNews, newsChecked, filterNews } from '../lib/political-news.ts';
import { politicalCases, politicalCaseInputs, casesChecked, caseStatuses, severityBand, severityScale, casesForParty, caseCountsByParty, scoreCase } from '../lib/political-cases.ts';
import { archive, polls, parties, latest, previous, difference, rank, agencySeries, availableTrendAgencies } from '../lib/polls.ts';
import { programmes, positions } from '../lib/programmes.ts';
import { aggregateAt, aggregateAgencies, aggregateLastDate, aggregatePolls, currentAggregate } from '../lib/aggregate.ts';
import { blocSeats, optionalIds, MAJORITY, CONSTITUTIONAL_MAJORITY } from '../lib/blocs.ts';
import { responsibilityRows, responsibilityTotalDays, tierFor, responsibilityGroups, compactTenure, inactiveResponsibilityRows } from '../lib/responsibility.ts';
import { inactiveParties, inactiveTenureChecked } from '../lib/government-tenure-inactive.ts';
import { edition, EDITION_LOOKBACK_DAYS } from '../lib/edition.ts';
import { election2023, seated2023, validVotes2023, allocateSeats, scenarioFromPoll, hemicycleSeats } from '../lib/parliament.ts';
import { governmentTenure, governmentTenureSources, periodDays, tenureAsOf, tenureDays, tenureDuration, tenureLabel } from '../lib/government-tenure.ts';

const partyIds = new Set(parties.map(p => p.id));
for (const [records, checked] of [[politicalNews, newsChecked], [politicalCases, casesChecked]]) {
  assert.equal(new Set(records.map(r=>r.id)).size,records.length,'Unikátne správy a prípady');
  for (const record of records) {
    assert.equal(new URL(record.source).protocol,'https:','Správy aj kauzy majú zdroj');
    assert((record.published??record.statusAsOf)<=checked,'Žiadny budúci dátum v kontrolovanom výbere');
  }
}
assert.equal(new Set(politicalNews.map(n=>n.source)).size,politicalNews.length,'Každá správa má jedinečný zdroj');
assert(politicalNews.some(n=>n.published===newsChecked),'Výber obsahuje aspoň jednu správu z dňa kontroly');
const fixtureNews=['2026-09-06','2026-09-07','2026-09-09','2026-09-13','2026-09-14'].map((published,i)=>({...politicalNews[0],id:String(i),published}));
assert.deepEqual(filterNews(fixtureNews,'2026-09-13','week','all').map(n=>n.published),['2026-09-13','2026-09-09','2026-09-07'],'Posledných 7 dní vrátane dneška, bez budúcich správ');
assert.deepEqual(filterNews(fixtureNews,'2026-09-14','week','all').map(n=>n.published),['2026-09-14','2026-09-13','2026-09-09'],'Pohyblivé okno, nie kalendárny týždeň: v pondelok nezostane len dnešok');
assert.equal(filterNews(fixtureNews,'2026-09-13','today','all').length,1);
assert.equal(filterNews(fixtureNews,'2026-09-13','all','Prieskumy').length,0,'Filter témy');
assert.equal(filterNews(fixtureNews,'2026-09-13','all','all').length,4,'Aj archív vylúči budúce správy');
for (const record of politicalCases) {
  assert(record.parties.length>0&&record.parties.every(id=>partyIds.has(id)),'Kauza odkazuje na existujúci profil');
  assert(record.status in caseStatuses,'Kauza má pomenovaný stav');
  assert(Number.isInteger(record.severity) && record.severity>=1 && record.severity<=10 && record.severityWhy, 'Skóre závažnosti sa počíta zo stavu a faktorov a má výpočet pri každom prípade');
  assert(record.relationship&&record.response,'Väzba na stranu a reakcia sú povinné');
}
const pollIds = new Set();
for (const poll of archive) {
  assert(!pollIds.has(poll.id), `Duplicitné meranie: ${poll.id}`);
  pollIds.add(poll.id);
  assert(poll.start <= poll.end && (!poll.published || poll.end <= poll.published), `Chronológia: ${poll.id}`);
  assert(poll.end <= '2026-09-11' && (!poll.published || poll.published <= '2026-09-11'), `Budúci údaj: ${poll.id}`);
  assert(poll.sample===null || (Number.isInteger(poll.sample) && poll.sample > 0), `Vzorka: ${poll.id}`);
  if(poll.sample===null || poll.published===null) assert(poll.note, `Chýbajúce metadáta potrebujú vysvetlenie: ${poll.id}`);
  assert(new URL(poll.source).protocol === 'https:', `Zdroj: ${poll.id}`);
  for (const field of ['agency','method','type','client','sourceName']) assert(poll[field].trim(), `Chýba ${field}: ${poll.id}`);
  for (const [id, value] of Object.entries(poll.values)) {
    assert(partyIds.has(id), `Neznáma strana: ${id}`);
    assert(Number.isFinite(value) && value >= 0 && value <= 100, `Hodnota: ${poll.id}/${id}`);
  }
  const sum = Object.values(poll.values).reduce((a,b) => a+b, poll.other??0);
  assert(sum <= 100.5, `Neplatný súčet podpory: ${poll.id}: ${sum}`);
  if (poll.complete) assert(Math.abs(sum-100) <= 0.5, `Neúplný výsledok označený ako úplný: ${poll.id}`);
  const ranked = rank(poll).map(p=>poll.values[p.id]);
  assert(ranked.every((value,i)=>i===0 || value<=ranked[i-1]), `Poradie: ${poll.id}`);
}
assert(polls.every(p=>p.agency==='NMS'), 'Trend nesmie miešať agentúry');
assert(polls.every((p,i)=>i===0 || p.end>polls[i-1].end), 'Trend musí byť chronologický');
assert.equal(difference(latest,previous,'rep'),2.3,'Zmena musí vychádzať z percent, nie z odlišného slovného komentára');
assert.equal(difference(latest,previous,'lsns'),null,'Chýbajúca hodnota nesmie byť nula');
assert.equal(latest.values.sns,1.9,'NMS september: SNS overené v pôvodnom grafe');
assert.equal(latest.values.zaludi,1.6,'NMS september: ZA ĽUDÍ overené v pôvodnom grafe');
assert.equal(difference(latest,previous,'zaludi'),-.6,'Zmena po doplnení presnej hodnoty ZA ĽUDÍ');
assert.equal(scenarioFromPoll({...latest,values:{ps:45,smer:45,dem:4.9}}).allocation.seats.dem,undefined,'Vlastný scenár: 4,9 % nezíska kreslo');
assert(scenarioFromPoll({...latest,values:{ps:45,smer:45,dem:5}}).allocation.seats.dem>0,'Vlastný scenár: 5 % vstupuje do rozdelenia');
assert.equal(polls.find(p=>p.id==='nms-2026-06').sample,1002,'Vzorka overená v metodike NMS 11. 6. 2026');
assert(archive.every((p,i)=>i===0 || p.end<=archive[i-1].end),'Archív je zoradený podľa konca zberu, aj pri neznámej publikácii');
for(const agency of availableTrendAgencies) {
  const series=agencySeries(agency);
  assert(series.every(p=>p.agency===agency),'Prepnutie agentúry nesmie miešať série');
  assert(series.every((p,i)=>i===0||p.end>series[i-1].end),'Každá séria musí mať chronologické poradie');
  assert.deepEqual(agencySeries(agency,3),series.slice(-3),'Filter počtu meraní musí zachovať najnovšie záznamy');
}
assert.equal(agencySeries('AKO',9).length,8);
assert.equal(agencySeries('AKO',9)[0].values.ps,23.2);
assert.equal(agencySeries('FOCUS',1)[0].values.ps,17.3);
assert.equal(agencySeries('FOCUS',1)[0].values.smer,17.3);
assert.equal(agencySeries('IPSOS',1)[0].sample,1061);
assert.equal(agencySeries('INFOSTAT',1)[0].values.sas,9.8);
assert.equal(archive.find(p=>p.id==='ipsos-2026-06').published,null);
assert.equal(archive.find(p=>p.id==='ipsos-2026-06').sample,null);
assert.equal(archive.find(p=>p.id==='focus-2026-06').published,'2026-07-03');
assert.deepEqual(availableTrendAgencies,['AKO','FOCUS','INFOSTAT','IPSOS','NMS']);
assert.equal(agencySeries('unknown').length,0);
for(const doc of programmes) {
  assert(partyIds.has(doc.partyId),'Program musí patriť známemu subjektu');
  assert(doc.year===null || (Number.isInteger(doc.year)&&doc.year<=2026),'Neoverený budúci volebný ročník');
  assert(doc.url.startsWith('https:')&&doc.note&&doc.author&&doc.verified,'Dokument potrebuje zdroj a kontext');
  assert(doc.status!=='approved-2027' && doc.status!=='draft-2027', 'Bez výslovného zdroja nič neoznačujeme za program 2027');
  if(doc.year===2023) assert.equal(doc.status,'archive-2023','Dokument 2023 musí byť označený ako archív');
}
assert.equal(programmes.find(d=>d.partyId==='rep').year,null,'Živý program bez dátumu nesmie automaticky dostať rok 2023');
assert.equal(programmes.find(d=>d.partyId==='smer').year,2023,'Program na obdobie 2023–2027 nie je program volieb 2027');
assert.equal(programmes.find(d=>d.title==='TRESK').status,'current-initiative','TRESK je aktuálna iniciatíva, nie automaticky program 2027');
for(const position of positions){assert(partyIds.has(position.partyId)&&position.bullets.length>0&&position.source.startsWith('https:')&&position.asOf,'Porovnanie potrebuje stranu, body, zdroj a dátum');}

// Agregátor: chýbajúce údaje sa nedopĺňajú nulou a každá agentúra vstupuje najviac raz.
assert.deepEqual(aggregateAgencies,['AKO','FOCUS','INFOSTAT','IPSOS','NMS']);
assert.equal(aggregateLastDate,'2026-09-07');
assert.equal(new Set(aggregatePolls.map(p=>p.agency)).size,aggregatePolls.length,'Jedna agentúra najviac raz v aktuálnom bode');
assert(aggregatePolls.length>=3,'Aktuálny agregát potrebuje aspoň tri agentúry');
assert.equal(currentAggregate.pollIds.length,aggregatePolls.length);
for(const value of Object.values(currentAggregate.values)) { assert(value.lower<=value.value&&value.value<=value.upper,'Priemer musí ležať v pásme'); assert(value.agencies.length===value.polls,'Počet vstupov sedí'); }
const missingAggregate=aggregateAt('2026-09-07',[{...latest,id:'missing-test',agency:'NMS',values:{ps:20}}]);
assert.equal(missingAggregate.values.smer,undefined,'Chýbajúca strana sa v agregáte nesmie zmeniť na nulu');
assert.equal(missingAggregate.values.ps.value,20,'Jediný dostupný vstup sa zachová');
// Parlament 2023 a prepočet kresiel
assert.equal(election2023.subjects.length, 25, 'Oficiálna listina 2023 má 25 subjektov');
assert.equal(election2023.subjects.reduce((a,s)=>a+s.seats,0), 150, 'Mandáty 2023 dávajú 150');
assert.equal(seated2023.length, 7, 'Sedem subjektov s mandátmi');
assert.equal(seated2023[0].short, 'SMER'); assert.equal(seated2023[0].seats, 42);
assert(Math.abs(election2023.subjects.reduce((a,s)=>a+s.pct,0) - 100) < 0.3, 'Podiely 2023 dávajú ~100 % (orezané na 2 desatinné miesta)');
assert(validVotes2023 > 2900000 && validVotes2023 < 3100000, 'Platné hlasy 2023 v očakávanom rozsahu');
for (const s of election2023.subjects) { assert(s.votes > 0 && s.pct >= 0 && s.pct <= 100, `Subjekt 2023: ${s.short}`); if (s.partyId) assert(partyIds.has(s.partyId), `Neznáma strana pri subjekte 2023: ${s.short}`); }
const re2023 = allocateSeats(election2023.subjects.map(s=>({id:String(s.number), share:s.pct, kind:s.kind})));
for (const s of election2023.subjects) assert.equal(re2023.seats[String(s.number)] ?? 0, s.seats, `Prepočet z percent musí reprodukovať oficiálne mandáty 2023: ${s.short}`);
assert.deepEqual(allocateSeats([{id:'a',share:4.9},{id:'b',share:60}]).seats, {b:150}, 'Strana pod 5 % nedostane mandát; prebytočný mandát sa odpočíta');
assert.deepEqual(allocateSeats([{id:'k',share:6.9,kind:'coalition2'},{id:'b',share:50}]).belowThreshold, ['k'], 'Koalícia 2–3 strán potrebuje 7 %');
assert.deepEqual(allocateSeats([{id:'k',share:9.9,kind:'coalition4'},{id:'b',share:50}]).belowThreshold, ['k'], 'Koalícia 4+ strán potrebuje 10 %');
assert.deepEqual(allocateSeats([]).seats, {}, 'Bez vstupu bez mandátov');
for (const agency of availableTrendAgencies) { const sc = scenarioFromPoll(agencySeries(agency,1)[0]); assert.equal(Object.values(sc.allocation.seats).reduce((a,b)=>a+b,0), 150, `Scenár ${agency} = 150 kresiel`); assert(sc.rows.every(r=>r.seats>0) && sc.belowThreshold.every(r=>r.seats===0), `Scenár ${agency}: riadky`); assert(sc.transcribedShare <= 100.5, `Scenár ${agency}: súčet podielov`); }
const hemi = hemicycleSeats(150, 6); assert.equal(hemi.length, 150, 'Polkruh má presne 150 kresiel');
assert(hemi.every(p => p.y <= 1e-9 && p.angle >= -1e-9 && p.angle <= Math.PI + 1e-9), 'Kreslá ležia v hornom polkruhu');
assert(hemi[0].x < hemi[149].x, 'Kreslá idú zľava doprava');
assert.equal(hemicycleSeats(1, 1).length, 1);

// Bloky koalícia / opozícia
const officialEntries = seated2023.map(s => ({ id: s.partyId ?? `election-2023-${s.number}`, short: s.short, color: s.color, seats: s.seats }));
const b2023 = blocSeats(officialEntries);
assert.equal(b2023.coalition.seats, 79, 'Koalícia 2023: SMER 42 + HLAS 27 + SNS 10');
assert.equal(b2023.opposition.seats, 55, 'Opozičný blok 2023: PS 32 + KDH 12 + SaS 11');
assert.equal(b2023.others.seats, 16, 'Ostatní 2023: OĽANO a priatelia');
assert.equal(b2023.total, 150);
const b2023plus = blocSeats(officialEntries, ['slovensko', 'rep']);
assert.equal(b2023plus.opposition.seats, 71, 'OĽANO a priatelia 2023 sa mapuje na voliteľného partnera Hnutie Slovensko');
assert.equal(b2023plus.coalition.seats, 79, 'REPUBLIKA nemala v roku 2023 mandát');
assert.equal(b2023plus.others.seats, 0);
assert.deepEqual(optionalIds.sort(), ['rep', 'slovensko']);
for (const agency of availableTrendAgencies) {
  const sc = scenarioFromPoll(agencySeries(agency, 1)[0]);
  const entries = sc.rows.map(r => ({ id: r.id, short: r.short, color: r.color, seats: r.seats }));
  for (const enabled of [[], ['rep'], ['slovensko'], ['rep', 'slovensko']]) {
    const b = blocSeats(entries, enabled);
    assert.equal(b.total, 150, `Bloky scenára ${agency} (${enabled.join('+') || 'bez partnerov'}) dávajú 150`);
    assert(b.coalition.members.every(m => !['ps','kdh','sas','dem','slovensko'].includes(m.id)), 'Opozičné strany nie sú v koalícii');
  }
  const withRep = blocSeats(entries, ['rep']);
  assert(withRep.coalition.seats >= blocSeats(entries).coalition.seats, 'Zapnutie partnera koalíciu nezmenší');
}
assert.equal(MAJORITY, 76); assert.equal(CONSTITUTIONAL_MAJORITY, 90);

// Účasť dnešných strán vo vládach SR
assert.deepEqual(Object.keys(governmentTenure).sort(), [...partyIds].sort(), 'Každý profil strany potrebuje údaj o účasti vo vláde');
assert.equal(tenureAsOf, '2026-09-13');
for (const [id, entry] of Object.entries(governmentTenure)) {
  for (const period of entry.periods) {
    assert(period.start >= '1993-01-01', `Vládne obdobie ${id} nezačína pred vznikom SR`);
    assert(period.end === null || period.end <= tenureAsOf, `Vládne obdobie ${id} nesmie končiť v budúcnosti`);
    assert(period.end === null || period.start < period.end, `Chronológia vládneho obdobia ${id}`);
    assert(periodDays(period) > 0, `Vládne obdobie ${id} musí mať kladnú dĺžku`);
    assert(new URL(period.source).protocol === 'https:', `Vládne obdobie ${id} potrebuje HTTPS zdroj`);
  }
  assert(tenureDays(entry) >= 0, `Súčet vládneho obdobia ${id}`);
  assert(tenureLabel(entry).length > 0, `Text vládneho obdobia ${id}`);
}
assert.equal(tenureLabel(governmentTenure.sns), '15 rokov 11 mesiacov', 'SNS: súčet období od vzniku SR');
assert.equal(tenureLabel(governmentTenure.smer), '14 rokov 10 mesiacov', 'SMER: súčet troch vládnych období');
assert.equal(tenureLabel(governmentTenure.kdh), '9 rokov 9 mesiacov', 'KDH: súčet vrátane účasti cez SDK');
assert(tenureDays(governmentTenure.sns) > tenureDays(governmentTenure.smer), 'SNS má po započítaní rokov 1993 – 1998 dlhšiu účasť než SMER');
assert(tenureDays(governmentTenure.smer) > tenureDays(governmentTenure.kdh), 'SMER má dlhšiu účasť než KDH');
assert(tenureDays(governmentTenure.kdh) > tenureDays(governmentTenure.sas), 'KDH má dlhšiu účasť než SaS');
assert.equal(tenureDays(governmentTenure.ps), 0, 'PS nebolo vo vláde');
assert.equal(tenureDays(governmentTenure.aliancia), 0, 'Predchodcov Aliancie nepripisujeme dnešnému subjektu');
assert.equal(tenureDuration(governmentTenure.dem).years, 0, 'Demokrati boli v poverenom kabinete iba časť roka 2023');
assert.equal(Object.values(governmentTenureSources).every(source => source.startsWith('https:')), true, 'Všetky hlavné zdroje vládnej histórie používajú HTTPS');


// Kauzy: závažnosť 1–10 podľa zverejnenej stupnice a väzba na strany
for (const c of politicalCases) {
  assert(Number.isInteger(c.severity) && c.severity >= 1 && c.severity <= 10, `Závažnosť mimo 1–10: ${c.id}`);
  assert(c.severityWhy.trim().length > 20, `Chýba výpočet závažnosti: ${c.id}`);
  assert(c.severity >= severityScale.base[c.status] - 1, `Závažnosť pod východiskom stavu: ${c.id}`);
  assert(c.parties.every(id => partyIds.has(id)), `Neznáma strana pri kauze: ${c.id}`);
  assert(caseStatuses[c.status], `Neznámy stav kauzy: ${c.id}`);
}
assert.deepEqual([1,3,4,6,7,8,9,10].map(n=>severityBand(n).tone), ['low','low','mid','mid','high','high','top','top'], 'Pásma závažnosti');
assert(casesForParty('sns').length >= 2, 'SNS má v registri aspoň dva prípady');
assert(casesForParty('sns')[0].severity >= casesForParty('sns')[1].severity, 'Prípady strany od najzávažnejšieho');
assert(Array.isArray(casesForParty('neexistuje')) && casesForParty('neexistuje').length === 0, 'Neznáma strana vracia prázdny zoznam, nie chybu');
assert.equal(Object.values(caseCountsByParty()).reduce((a,b)=>a+b,0), politicalCases.reduce((a,c)=>a+c.parties.length,0), 'Počty káuz podľa strán');


// Register káuz: vstupný JSON je úplný a závažnosť sa počíta z faktorov
assert.equal(politicalCaseInputs.length, politicalCases.length, 'Každý vstup registra má platný stav');
assert.equal(new Set(politicalCases.map(c=>c.id)).size, politicalCases.length, 'Identifikátory káuz sú jedinečné');
for (const c of politicalCases) {
  for (const k of ['publicMoney','topLevel','systemic','historic','indirect']) assert.equal(typeof c.flags[k], 'boolean', `Faktor ${k} musí byť boolean: ${c.id}`);
  assert.equal(c.severity, scoreCase(c).severity, `Závažnosť zodpovedá výpočtu: ${c.id}`);
  assert(c.statusAsOf <= casesChecked, `Stav v zdroji nesmie byť v budúcnosti: ${c.id}`);
  assert(/^https:\/\//.test(c.source), `Zdroj musí byť https: ${c.id}`);
  assert(c.summary.trim().length >= 60 && c.relationship.trim().length >= 10 && c.response.trim().length >= 10, `Texty kauzy sú neúplné: ${c.id}`);
  assert(c.parties.length >= 1, `Kauza bez väzby na stranu: ${c.id}`);
}
assert.equal(scoreCase({...politicalCases[0], status:'conviction', flags:{publicMoney:true,topLevel:true,systemic:true,historic:false,indirect:false}}).severity, 10, 'Strop 10');
assert.equal(scoreCase({...politicalCases[0], status:'controversy', flags:{publicMoney:false,topLevel:false,systemic:false,historic:true,indirect:true}}).severity, 1, 'Spodná hranica 1');


// Zodpovednosť za stav krajiny: podiel času vo vláde od 1993
assert(responsibilityTotalDays > 12000 && responsibilityTotalDays < 13000, 'Obdobie od 1993 do dátumu kontroly v dňoch');
const resp = responsibilityRows();
const respGroups = responsibilityGroups(resp);
assert(respGroups.every(g => g.rows.length > 0) && respGroups.flatMap(g => g.rows).length === resp.filter(r => r.days > 0).length, 'Skupiny škály pokrývajú každú stranu s účasťou vo vláde presne raz');
assert(respGroups.every((g, i, a) => i === 0 || a[i - 1].min > g.min), 'Skupiny škály idú od najvyššieho stupňa');
assert(compactTenure(74) === '2 mes.' && compactTenure(5428) === '14 r.' && compactTenure(0) === '', 'Skrátený zápis dĺžky vlády');
assert.equal(resp.length, parties.length, 'Každá strana má riadok');
for (const r of resp) { assert(r.share >= 0 && r.share <= 100, `Podiel v rozsahu: ${r.id}`); assert(r.led <= r.days, `Na čele vlády nie viac ako vo vláde: ${r.id}`); }
assert(resp[0].id === 'sns' || resp[0].id === 'smer', 'Najdlhšie vo vláde od 1993 sú SNS alebo SMER');
assert(resp.find(r => r.id === 'smer').share > 40 && resp.find(r => r.id === 'smer').led === resp.find(r => r.id === 'smer').days, 'SMER viedol vládu vždy, keď v nej bol');
assert.equal(resp.find(r => r.id === 'ps').share, 0, 'PS bez účasti vo vláde');
assert.deepEqual([tierFor(50).label, tierFor(30).label, tierFor(12).label, tierFor(2).label, tierFor(0).label], ['rozhodujúca','významná','čiastočná','okrajová','bez účasti'], 'Škála zodpovednosti');

// Neaktívne strany vo vláde od 1993
const activeIds = new Set(parties.map(p => p.id));
const inactiveIds = inactiveParties.map(p => p.id);
assert.equal(new Set(inactiveIds).size, inactiveIds.length, 'Neaktívne strany majú jedinečné id');
assert(inactiveIds.every(id => !activeIds.has(id)), 'Neaktívne strany sa neprekrývajú s dnešnými');
for (const p of inactiveParties) {
  assert(p.periods.length > 0 && p.fate.length > 10 && p.short && p.name, `Neaktívna strana má obdobia, názov a osud: ${p.id}`);
  if (p.successor) assert(activeIds.has(p.successor) || inactiveIds.includes(p.successor), `Nástupca existuje: ${p.id}`);
  for (const x of p.periods) {
    assert(/^\d{4}-\d{2}-\d{2}$/.test(x.start) && /^\d{4}-\d{2}-\d{2}$/.test(x.end ?? ''), `Obdobie má dátumy: ${p.id}`);
    assert(x.start >= '1993-01-01' && x.end > x.start && x.end <= inactiveTenureChecked, `Obdobie v rozsahu 1993 až kontrola: ${p.id} ${x.start}`);
    assert(/^https:\/\//.test(x.source) && x.government.length > 5, `Obdobie má zdroj a názov vlády: ${p.id}`);
  }
}
const inactiveRows = inactiveResponsibilityRows();
assert.equal(inactiveRows.length, inactiveParties.length, 'Každá neaktívna strana má riadok');
for (const r of inactiveRows) { assert(r.days > 0 && r.share < 50, `Neaktívna strana bola vo vláde a nemá väčšinu času: ${r.id}`); assert(r.led <= r.days, `Na čele vlády nie viac ako vo vláde: ${r.id}`); }
const hzds = inactiveRows.find(r => r.id === 'hzds');
assert(inactiveRows[0].id === 'hzds' && hzds.share > 25 && hzds.share < 30 && hzds.led > 0 && hzds.led < hzds.days, 'HZDS je najdlhšie z neaktívnych, viedlo len Mečiarove vlády');
const sdku = inactiveRows.find(r => r.id === 'sdku');
assert(sdku.led === sdku.days && sdku.tier === 'čiastočná', 'SDKÚ viedla vládu vždy, keď v nej bola');
assert(inactiveRows.find(r => r.id === 'siet').days < 200 && inactiveRows.find(r => r.id === 'du').days < 300, 'Krátke účasti Siete a DÚ');
assert(responsibilityGroups(inactiveRows).flatMap(g => g.rows).length === inactiveRows.length, 'Skupiny škály pokrývajú aj neaktívne strany');

// Titulná strana: hlavná správa z Modelu Mandát a zmeny za 30 dní
assert.equal(edition.now.coalition + edition.now.opposition + edition.now.others, 150, 'Kreslá blokov dnes dávajú 150');
assert.equal(edition.before.coalition + edition.before.opposition + edition.before.others, 150, 'Kreslá blokov pred mesiacom dávajú 150');
assert.equal(edition.now.rows.reduce((a, r) => a + r.seats, 0), 150, 'Scenár rozdelí všetkých 150 kresiel');
const lookback = (Date.parse(edition.asOf + 'T12:00:00Z') - Date.parse(edition.monthAgo + 'T12:00:00Z')) / 86400000;
assert(lookback >= EDITION_LOOKBACK_DAYS - 10 && lookback <= EDITION_LOOKBACK_DAYS + 10, 'Porovnávací bod je približne 30 dní dozadu');
assert(edition.movers.every((m, i, a) => i === 0 || Math.abs(a[i - 1].delta) >= Math.abs(m.delta)), 'Pohyby podpory sú zoradené od najväčšieho');
assert(edition.movers.every(m => m.delta !== 0 && m.value >= 1), 'Pohyby sú nenulové a len pre subjekty nad 1 %');
for (const c of edition.crossings) assert(c.direction === 'down' ? c.seatsNow === 0 && c.seatsBefore > 0 : c.seatsNow > 0 && c.seatsBefore === 0, `Prechod cez 5 % má zodpovedajúce kreslá: ${c.id}`);
assert(edition.newPolls.length >= 1 && edition.newPolls.every(p => p.end > edition.monthAgo && p.end <= edition.asOf), 'Nové merania patria do sledovaného okna');
assert(edition.withPartners.coalition >= edition.now.coalition && edition.withPartners.opposition >= edition.now.opposition, 'Voliteľní partneri kreslá blokom len pridávajú');
assert.equal(edition.withPartners.coalition + edition.withPartners.opposition + edition.withPartners.others, 150, 'Bloky s partnermi dávajú 150');
assert(edition.withPartners.coalitionLabel === 'Koalícia s Republikou' && edition.withPartners.oppositionLabel === 'Opozícia s Matovičom', 'Slovné označenie blokov s partnermi');
assert(edition.before.withCoalition + edition.before.withOpposition <= 150, 'Bloky s partnermi pred mesiacom najviac 150');
assert(edition.coalitionLabel.length === 3 && edition.oppositionLabel.length === 4, 'Bloky bez voliteľných partnerov: 3 koaličné a 4 opozičné strany');

console.log(`OK: ${archive.length} meraní, ${parties.length} subjektov, ${election2023.subjects.length} subjektov volieb 2023 a ${availableTrendAgencies.length} scenárov kresiel. Zdroje, chronológia, rozsah, súčty, poradie a výpočty prešli kontrolou.`);
