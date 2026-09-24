import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { politicalNews, newsChecked, filterNews } from '../lib/political-news.ts';
import { casesEnabled } from '../lib/features.ts';
import { cabinets, cabinetSummaries, debtBrake, debtPerCapita, financeCompare, financeYears, latestFinanceYear, primaryBalance, yearShares } from '../lib/public-finance.ts';
import { politicalCases, politicalCaseInputs, casesChecked, caseStatuses, severityBand, severityScale, casesForParty, caseCountsByParty, scoreCase } from '../lib/political-cases.ts';
import { archive, polls, parties, latest, previous, difference, rank, agencySeries, availableTrendAgencies, dataVerified } from '../lib/polls.ts';
import { programmes, positions } from '../lib/programmes.ts';
import { aggregateAt, aggregateAgencies, aggregateAsPoll, aggregateLastDate, aggregatePolls, currentAggregate } from '../lib/aggregate.ts';
import { blocSeats, optionalIds, MAJORITY, CONSTITUTIONAL_MAJORITY } from '../lib/blocs.ts';
import { responsibilityRows, responsibilityTotalDays, tierFor, responsibilityGroups, compactTenure, inactiveResponsibilityRows } from '../lib/responsibility.ts';
import { durationLabel } from '../lib/government-tenure.ts';
import { isBirthYear, lifeSummary, priceFactor } from '../lib/your-slovakia.ts';
import { seatUncertainty, thresholdStatus } from '../lib/uncertainty.ts';
import { accuracyElection, accuracyParties, accuracyRanking, finalPolls2023, result2023Share, systematicErrors } from '../lib/poll-accuracy.ts';
import { inactiveParties, inactiveTenureChecked } from '../lib/government-tenure-inactive.ts';
import { edition, EDITION_LOOKBACK_DAYS } from '../lib/edition.ts';
import { election2023, seated2023, validVotes2023, allocateSeats, scenarioFromPoll, hemicycleSeats, wastedVotes, result2023, coalition2023 } from '../lib/parliament.ts';
import { averageWage, eligibleFunding, fundingForParty, fundingTotal, subjectFunding } from '../lib/party-funding.ts';
import { createPuzzle, evaluate, fallbackPuzzle, gameParties, previousDay, readSave } from '../lib/daily-game.ts';
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
for (const n of politicalNews) {
  assert(Array.isArray(n.detail) && n.detail.length >= 2, `Každá správa má dlhšie zhrnutie aspoň v dvoch odsekoch: ${n.id}`);
  assert(n.detail.every(p => typeof p === 'string' && p.trim().length > 80), `Odseky zhrnutia nie sú útržky: ${n.id}`);
  assert(n.detail.join(' ').length > n.summary.length * 1.5, `Zhrnutie je výrazne dlhšie ako popis v zozname: ${n.id}`);
  assert(!n.summary.includes('http') && n.detail.every(p => !p.includes('http')), `Text správy neobsahuje odkazy, tie patria k zdroju: ${n.id}`);
}
// Deň v politike: téma zo zoznamu, poradie v dni jedinečné, veta dňa len pri dni so správami.
{
  const { newsCategories, newsDays, newsDayGroups } = await import('../lib/political-news.ts');
  const byDay = {};
  for (const n of politicalNews) {
    assert(newsCategories.includes(n.category), `Téma správy zo zoznamu: ${n.id}`);
    (byDay[n.published] ??= []).push(n);
  }
  for (const [d, list] of Object.entries(byDay)) {
    const ranks = list.map(n => n.rank).filter(r => r !== undefined);
    assert.equal(new Set(ranks).size, ranks.length, `Poradie správ v ${d} je jedinečné`);
    assert(ranks.every(r => Number.isInteger(r) && r >= 1), `Poradie v ${d} je kladné celé číslo`);
  }
  for (const [d, v] of Object.entries(newsDays)) {
    assert(byDay[d], `Veta dňa ${d} patrí ku dňu so správami`);
    if (v.line) assert(v.line.length >= 60 && v.line.length <= 280 && !/https?:/.test(v.line), `Veta dňa ${d}: dĺžka a bez odkazov`);
    if (v.analyzed) assert(v.analyzed >= byDay[d].length, `Počet prejdených udalostí ${d} nie je menší ako počet správ`);
  }
  const fixture = [{ ...politicalNews[0], id: 'b', published: '2026-09-20', rank: 2 }, { ...politicalNews[0], id: 'a', published: '2026-09-20', rank: 1 }, { ...politicalNews[0], id: 'c', published: '2026-09-21' }, { ...politicalNews[0], id: 'z', published: '2026-09-30' }];
  assert.deepEqual(newsDayGroups(fixture, '2026-09-21').map(g => `${g.date}:${g.items.map(n => n.id).join('')}`), ['2026-09-21:c', '2026-09-20:ab'], 'Dni od najnovšieho, v dni podľa poradia, bez budúcich');
}
const newestNews = politicalNews.reduce((max,n)=>n.published>max?n.published:max,'0000-00-00');
assert((Date.parse(newsChecked)-Date.parse(newestNews))/86400000 <= 3,`Výber nesmie zaostávať za kontrolou o viac než tri dni: ${newestNews} vs ${newsChecked}`);
const fixtureNews=['2026-09-06','2026-09-07','2026-09-09','2026-09-13','2026-09-14'].map((published,i)=>({...politicalNews[0],id:String(i),published,category:'Vláda'}));
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
  // Žiadne meranie nesmie byť novšie ako posledná ručná kontrola dát (dataVerified v lib/polls.ts).
  assert(poll.end <= dataVerified && (!poll.published || poll.published <= dataVerified), `Budúci údaj: ${poll.id}`);
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
assert.equal(agencySeries('IPSOS',1)[0].sample,1030); // Ipsos september 2026, tlačová správa 24. 9. 2026
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
assert.equal(aggregateLastDate,'2026-09-22'); // koniec zberu septembrového Ipsosu
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

// Sekcia Zodpovednosť: vlády, v ktorých strana sedela, a obdobia s premiérom zo strany
for (const r of [...resp, ...inactiveRows]) {
  assert.equal(r.cabinets.length > 0, r.days > 0, `Strana s účasťou má aspoň jednu vládu a bez účasti žiadnu: ${r.id}`);
  assert(r.periods.every(p => typeof p.led === 'boolean'), `Obdobie má príznak premiéra: ${r.id}`);
}
assert.deepEqual(resp.find(r => r.id === 'sns').cabinets.map(c => c.id), ['meciar2', 'meciar3', 'fico1', 'fico3', 'pellegrini', 'fico4'], 'SNS sedela v šiestich vládach');
assert.deepEqual(resp.find(r => r.id === 'kdh').cabinets.map(c => c.id), ['moravcik', 'dzurinda1', 'dzurinda2', 'radicova'], 'KDH vrátane vlády Dzurinda I cez SDK');
assert(resp.find(r => r.id === 'smer').periods.every(p => p.led) && resp.find(r => r.id === 'sns').periods.every(p => !p.led), 'Premiér zo SMER-u, nikdy zo SNS');
assert.deepEqual([durationLabel(0), durationLabel(20), durationLabel(366), durationLabel(1035)], ['bez účasti', '1 mesiac', '1 rok', '2 roky 10 mesiacov'], 'Dĺžka slovom');

// Presnosť agentúr 2023: úplné prieskumy pred voľbami, výsledok z oficiálnych dát a súhlasný výpočet odchýlky.
{
  assert.equal(new Set(finalPolls2023.map(p => p.agency)).size, finalPolls2023.length, 'Presnosť 2023: jedna agentúra = jeden prieskum');
  for (const poll of finalPolls2023) {
    assert.ok(poll.end < accuracyElection.date && poll.start <= poll.end && /^https:\/\//.test(poll.source), `Presnosť 2023: dátumy a zdroj ${poll.agency}`);
    for (const p of accuracyParties) assert.ok(poll.values[p.id] > 0 && poll.values[p.id] < 40, `Presnosť 2023: ${poll.agency} má hodnotu pre ${p.id}`);
    assert.ok(Object.values(poll.values).reduce((a, b) => a + b, 0) <= 100, `Presnosť 2023: súčet ${poll.agency}`);
  }
  assert.deepEqual([result2023Share('smer'), result2023Share('olano'), result2023Share('rep')], [22.94, 8.89, 4.75], 'Presnosť 2023: výsledky z ŠÚ SR');
  const ako = accuracyRanking().find(a => a.poll.agency === 'AKO');
  const manual = accuracyParties.reduce((s, p) => s + Math.abs(finalPolls2023.find(x => x.agency === 'AKO').values[p.id] - result2023Share(p.id)), 0) / accuracyParties.length;
  assert.ok(Math.abs(ako.mae - manual) < 0.006 && ako.winnerRight === false, 'Presnosť 2023: odchýlka AKO a nesprávny víťaz (PS pred Smerom)');
  assert.deepEqual(systematicErrors().filter(b => b.sameSign).map(b => b.id).sort(), ['aliancia', 'rep', 'rodina', 'smer'], 'Presnosť 2023: strany, pri ktorých sa mýlili všetky rovnako');
}

// Kam idú tvoje dane: čistá mzda 2026 sa zhoduje s publikovanými príkladmi (Finsider, sadzby FS SR, SP a VšZP),
// strop sociálneho poistenia dáva 1 575,81 € ako tabuľka Sociálnej poisťovne a bloček sa sčíta na celú sumu.
{
  const { payroll, receiptRows, spendingAreas } = await import('../lib/tax-receipt.ts');
  const { cofogData } = await import('../lib/cofog.data.ts');
  const cases = [[915, 54.34, 728.90], [1000, 68.17, 787.83], [1200, 100.69, 926.51], [1500, 149.49, 1134.51]];
  for (const [gross, tax, net] of cases) {
    const p = payroll(gross);
    assert.equal(p.tax, tax, `Dane: preddavok pri ${gross} €`);
    assert.equal(p.net, net, `Dane: čistá mzda pri ${gross} €`);
    assert.equal(Math.round((p.socialEmployee + p.healthEmployee) * 100), Math.round(gross * 14.4), `Dane: odvody zamestnanca pri ${gross} €`);
  }
  assert.equal(payroll(20000).socialEmployee, 1575.81, 'Dane: strop sociálneho poistenia (16 764 €)');
  assert.equal(payroll(20000).allowance, 0, 'Dane: pri vysokom príjme nezdaniteľná časť zaniká');
  assert.equal(payroll(1500).labourCost, 2043, 'Dane: cena práce pri 1 500 € (odvody zamestnávateľa 36,2 %)');
  const latest = cofogData.rows.at(-1);
  const sum = Object.entries(latest).filter(([k]) => /^GF[0-9]{2}$/.test(k)).reduce((s, [, v]) => s + v, 0);
  assert.ok(Math.abs(sum - latest.TOTAL) < 1, 'Dane: funkcie COFOG sa sčítajú na výdavky spolu');
  assert.ok(Math.abs(spendingAreas.reduce((s, a) => s + a.share, 0) - 1) < 1e-4, 'Dane: podiely oblastí dávajú 100 %');
  for (const total of [0, 1, 517.32, 925, 14340.77]) {
    const rows = receiptRows(total);
    assert.equal(rows.reduce((s, r) => s + r.amount, 0), Math.round(total), `Dane: bloček sa sčíta na ${Math.round(total)} €`);
  }
}
// 3D parlament: public/models/parlament.glb nesie kreslá aktuálneho scenára (inak: node scripts/build-parliament-glb.mjs).
{
  const { parliamentSeats } = await import('../lib/parliament-model.ts');
  const glb = readFileSync('public/models/parlament.glb');
  assert.equal(glb.readUInt32LE(0), 0x46546c67, '3D parlament: súbor nie je GLB');
  const gltf = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString('utf8').trim());
  const now = parliamentSeats();
  assert.deepEqual(gltf.asset.extras.seats, now.seats, '3D parlament je zastaraný — spusti: node scripts/build-parliament-glb.mjs');
  assert.equal(gltf.nodes.filter(n => n.name.startsWith('kreslo ')).length, 150, '3D parlament: 150 kresiel');
}
// Hlas (ElevenLabs): nahrávky nie sú povinné (tlačidlá sa bez nich neukážu), ale súbory musia existovať. Nahrávka s iným
// textom alebo zo starého vydania len upozorní — web položky s vydaním skryje sám; nezmenený text prepečiatkuje import-audio --restamp.
{
  const { audioSets, narrationEdition } = await import('../lib/narration.ts');
  const { createHash } = await import('node:crypto');
  const sets = audioSets(JSON.parse(readFileSync(new URL('../lib/party-profiles.json', import.meta.url), 'utf8')));
  for (const set of Object.keys(sets)) {
    const audio = JSON.parse(readFileSync(new URL(`../lib/audio/${set}.json`, import.meta.url), 'utf8'));
    for (const [id, item] of Object.entries(audio.items ?? {})) {
      assert.ok(existsSync(new URL(`../public${item.src}`, import.meta.url)), `Hlas: chýba súbor ${item.src}`);
      const text = sets[set].find(t => t.id === id)?.text;
      const hash = text && createHash('sha1').update(`${audio.voice}|${audio.model}|${text}`).digest('hex').slice(0, 10);
      if (hash !== item.hash) console.warn(`Upozornenie: nahrávka ${set}/${id} nesedí s aktuálnym textom — nahraj znova (node scripts/import-audio.mjs --sheet)`);
      else if (item.edition && item.edition !== narrationEdition) console.warn(`Upozornenie: nahrávka ${set}/${id} je z vydania ${item.edition} — node scripts/import-audio.mjs --restamp`);
    }
  }
}
// RSS: každé meranie z archívu je jedna položka s vlastným guid a odkazom na detail; XML znaky sú ošetrené.
{
  const { buildPollsFeed, feedPolls } = await import('../lib/rss.ts');
  const origin = 'https://example.test';
  const xml = buildPollsFeed(origin);
  const items = xml.split('<item>').length - 1;
  assert.equal(items, archive.length, 'RSS: položka pre každé meranie');
  const guids = [...xml.matchAll(/<guid[^>]*>([^<]+)<\/guid>/g)].map(m => m[1]);
  assert.equal(new Set(guids).size, archive.length, 'RSS: jedinečné guid');
  const links = [...xml.matchAll(/<link>([^<]+)<\/link>/g)].map(m => m[1]);
  assert.ok(links.every(l => l.startsWith(origin)), 'RSS: odkazy smerujú na Mandát');
  const outsideCdata = xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
  assert.ok(!/&(?!amp;|lt;|gt;|quot;|apos;)/.test(outsideCdata), 'RSS: neošetrený znak &');
  const order = feedPolls().map(p => p.published ?? p.end);
  assert.ok(order.every((d, i) => i === 0 || order[i - 1] >= d), 'RSS: od najnovšieho zverejnenia');
}
// Neistota: simulácia je deterministická, rozpätie obsahuje bodový odhad a stav pri 5 % zodpovedá simulácii.
{
  const a = seatUncertainty(currentAggregate, 400), b = seatUncertainty(currentAggregate, 400);
  assert.deepEqual(a, b, 'Neistota: rovnaké semeno dáva rovnaké rozpätia');
  const pointSeats = scenarioFromPoll(aggregateAsPoll()).allocation.seats;
  for (const v of Object.values(currentAggregate.values)) {
    const r = a.parties[v.partyId], seats = pointSeats[v.partyId] ?? 0, status = thresholdStatus(v);
    assert.ok(r.low <= seats && seats <= r.high, `Neistota: rozpätie ${v.partyId} ${r.low}–${r.high} obsahuje ${seats} kresiel`);
    if (status === 'in') assert.ok(r.entry >= 0.9, `Neistota: ${v.partyId} je nad hranicou, ale vstupuje len v ${r.entry}`);
    if (status === 'out') assert.ok(r.entry <= 0.1, `Neistota: ${v.partyId} je pod hranicou, ale vstupuje v ${r.entry}`);
  }
  assert.ok(a.blocs.opposition.low <= a.blocs.opposition.high && a.blocs.coalitionWith.majority >= 0 && a.blocs.coalitionWith.majority <= 1, 'Neistota: bloky');
  assert.ok(Math.abs(Object.values(a.parties).reduce((s, r) => s + r.first, 0) - 1) < 1e-9, 'Neistota: prvé miesto má v každom prepočte práve jedna strana');
  const sortedDots = d => d.length === 20 && d.every((v, i) => i === 0 || d[i - 1] <= v);
  assert.ok([...Object.values(a.parties), ...Object.values(a.blocs)].every(r => sortedDots(r.dots)), 'Neistota: 20 bodiek kvantilov, zoradené');
  assert.ok(Object.values(a.parties).every(r => r.dots[2] <= r.low + 1 && r.dots[17] >= r.high - 1), 'Neistota: bodky zodpovedajú rozpätiu 10–90 %');
}

// Tvoje Slovensko: vlády a premiéri za život, 18. narodeniny, hospodárske zmeny od roku 1995.
{
  const y1990 = lifeSummary(1990), y2005 = lifeSummary(2005), y2010 = lifeSummary(2010), y1970 = lifeSummary(1970);
  assert.equal(y1990.cabinets.length, cabinets.length, 'Tvoje Slovensko: ročník 1990 zažil všetky vlády SR');
  assert.equal(y1990.premiers, new Set(cabinets.map(c => c.pm)).size, 'Tvoje Slovensko: všetci premiéri od 1993');
  assert.deepEqual([y2005.cabinets.length, y2005.premiers, y2005.cabinets[0].cabinet.id], [10, 7, 'dzurinda2'], 'Tvoje Slovensko: ročník 2005 začína vládou úradujúcou 1. 1. 2005');
  assert.deepEqual([y1970.adulthood.status, y2010.adulthood.status, y2005.adulthood.cabinet?.id], ['czechoslovakia', 'future', 'odor'], 'Tvoje Slovensko: 18. narodeniny');
  assert.equal(y1990.topParty?.short, responsibilityRows()[0].short, 'Tvoje Slovensko: od 1993 najdlhšie vo vláde rovnaká strana ako v prehľade');
  assert.deepEqual([y1990.debt?.fromYear, y1990.debt?.from, y1990.debt?.to], [financeYears[0].year, debtPerCapita(financeYears[0]), debtPerCapita(latestFinanceYear)], 'Tvoje Slovensko: dlh na obyvateľa');
  assert.ok(Math.abs(priceFactor(2024, 2025) - (1 + financeYears.find(r => r.year === 2025).inflation / 100)) < 1e-9 && priceFactor(2025, 2025) === null, 'Tvoje Slovensko: rast cien');
  assert.ok(isBirthYear(1920) && !isBirthYear(1919) && !isBirthYear(Number(tenureAsOf.slice(0, 4)) + 1), 'Tvoje Slovensko: rozsah rokov');
}

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

// Fotografie osobností: každá použitá je z Wikimedia Commons s úplným kreditom a existujúcim súborom; chýbajúca má dôvod.
const profilesJson = JSON.parse(readFileSync(new URL('../lib/party-profiles.json', import.meta.url), 'utf8'));
for (const prof of Object.values(profilesJson)) for (const person of prof.people ?? []) {
  if (person.photo) {
    assert(person.photo.startsWith('/people/') && person.photo.endsWith('-2x.webp') && [1, 2, 3].every(n => existsSync(new URL('../public' + person.photo.replace('-2x.webp', `-${n}x.webp`), import.meta.url))), `Fotografia existuje v 1x/2x/3x: ${person.id}`);
    assert(/^https:\/\/(commons\.wikimedia\.org\/wiki\/File:|newsroom\.consilium\.europa\.eu\/permalink\/p\d+$)/.test(person.imageSource), `Zdroj fotografie je Wikimedia Commons alebo newsroom Rady EÚ: ${person.id}`);
    assert(person.imageAuthor && person.imageLicense && person.imageLicenseUrl.startsWith('https://') && /^\d{4}$/.test(person.imageYear), `Kredit fotografie je úplný: ${person.id}`);
  } else assert(person.imageNote, `Chýbajúca fotografia má uvedený dôvod: ${person.id}`);
}

// Vypnutý register káuz: dáta ostávajú platné, ale v rozhraní naň nesmie viesť odkaz.
if (!casesEnabled) {
  const page = readFileSync(new URL('../components/mandat-app.tsx', import.meta.url), 'utf8');
  const directory = readFileSync(new URL('../components/overview-directory.tsx', import.meta.url), 'utf8');
  assert(!/^import PoliticalCases from/m.test(page), 'Vypnutý register sa nesmie importovať staticky, inak sa pošle do prehliadača');
  for (const [name, source] of [['components/mandat-app.tsx', page], ['components/overview-directory.tsx', directory]]) {
    for (const match of source.matchAll(/"cases"/g)) {
      const around = source.slice(Math.max(0, match.index - 140), match.index + 140);
      if (!around.includes('casesEnabled')) assert.fail(`Odkaz na vypnutý register káuz v ${name}: …${around.slice(100, 180).trim()}…`);
    }
  }
}

// Hospodárenie: súvislý rad rokov, hodnoty v rozumných medziach, vlády bez medzier a podiely roka = 1.
assert(financeYears.length >= 30 && financeYears[0].year === 1995, 'Rad verejných financií začína rokom 1995');
for (let i = 1; i < financeYears.length; i++) assert.equal(financeYears[i].year, financeYears[i - 1].year + 1, 'Roky idú bez medzery');
assert(latestFinanceYear.year >= 2025, 'Posledný rok hospodárenia nie je starší než 2025');
for (const r of financeYears) {
  assert(r.deficitPct > -15 && r.deficitPct < 5 && r.debtPct > 0 && r.debtPct < 90, `Saldo a dlh v medziach: ${r.year}`);
  assert(Math.sign(r.deficitPct) === Math.sign(r.deficitMeur), `Saldo v % a v € má rovnaké znamienko: ${r.year}`);
  // Pred eurom (2009) Eurostat prepočítava dlh z korún kurzom ku koncu roka a HDP priemerným kurzom, preto voľnejšia medza.
  if (r.gdpMeur) assert(Math.abs(r.debtMeur / r.gdpMeur * 100 - r.debtPct) < (r.year >= 2009 ? 0.6 : 3.5), `Dlh v € sedí s dlhom v % HDP: ${r.year}`);
  if (r.gdpMeur) assert(Math.abs(r.deficitMeur / r.gdpMeur * 100 - r.deficitPct) < 0.35, `Saldo v € sedí so saldom v % HDP: ${r.year}`);
  const shares = yearShares(r.year);
  assert(Math.abs(shares.reduce((a, s) => a + s.share, 0) - 1) < 1e-9 && shares.length >= 1 && shares.length <= 3, `Podiely vlád v roku dávajú 1: ${r.year}`);
  if (r.year >= 1996) assert(debtPerCapita(r) > 500 && debtPerCapita(r) < 40000, `Dlh na obyvateľa v medziach: ${r.year}`);
  if (r.interestPct !== undefined) assert(primaryBalance(r) > r.deficitPct, `Saldo bez úrokov je vyššie než saldo: ${r.year}`);
}
for (let i = 1; i < cabinets.length; i++) assert.equal(cabinets[i].start, cabinets[i - 1].end, `Vlády na seba nadväzujú: ${cabinets[i].id}`);
// Koaličné strany: odkaz na dnešnú stranu musí mať logo, odkaz na neaktívnu stranu musí byť v registri.
const cabinetInactiveIds = new Set(inactiveParties.map(p => p.id));
const partyLogos = JSON.parse(readFileSync(new URL('../lib/party-logos.json', import.meta.url), 'utf8'));
for (const c of cabinets) for (const p of c.parties) {
  assert(p.short.trim().length > 0 && !(p.party && p.inactive), `Strana vlády má skratku a jeden odkaz: ${c.id}`);
  if (p.party) assert(partyIds.has(p.party) && partyLogos[p.party]?.src, `Strana vlády s logom: ${c.id} / ${p.short}`);
  if (p.inactive) assert(cabinetInactiveIds.has(p.inactive), `Neaktívna strana vlády je v registri: ${c.id} / ${p.short}`);
}
assert(cabinets.filter(c => c.parties.length === 0).every(c => c.id === 'odor'), 'Bez strán je len úradnícka vláda');
assert.equal(cabinets[0].start, '1993-01-01', 'Prvá vláda od vzniku SR');
assert.equal(cabinets.at(-1).end, null, 'Posledná vláda úraduje');
const summaries = cabinetSummaries();
assert(Math.abs(summaries.reduce((a, s) => a + s.weight, 0) - financeYears.length) < 0.05, 'Súčet podielov vlád = počet rokov v dátach');
assert(summaries.filter(s => s.years.length === 0).every(s => s.cabinet.end && s.cabinet.end < '1995-01-01'), 'Bez dát sú len vlády pred rokom 1995');
// Životná úroveň a porovnanie: rozumné medze, HDP na obyvateľa v PPS (nie v eurách) a Slovensko v každom rebríčku.
for (const r of financeYears) {
  if (r.gdpPcPps !== undefined) assert(r.gdpPcPps > 40 && r.gdpPcPps < 100, `HDP na obyvateľa v PPS v medziach: ${r.year}`);
  if (r.minWage !== undefined) assert(r.minWage > 50 && r.minWage < 2000, `Minimálna mzda v medziach: ${r.year}`);
  if (r.povertyRate !== undefined) assert(r.povertyRate > 5 && r.povertyRate < 25, `Chudoba v medziach: ${r.year}`);
  assert(r.netEarnings === undefined, `Čistý príjem (earn_nt_net) zámerne nepoužívame, má zlom radu: ${r.year}`);
}
assert(latestFinanceYear.gdpPcPps !== undefined && latestFinanceYear.gdpPcPps > 65, 'Posledný rok má HDP na obyvateľa v PPS okolo 70–80 % EÚ');
assert(financeCompare.rows.length >= 6 && financeCompare.rows.some(r => r.geo === 'SK') && financeCompare.rows.some(r => r.geo === 'EU27_2020'), 'Porovnanie má Slovensko aj EÚ');
for (const field of ['deficitPct', 'debtPct', 'gdpGrowth', 'inflation', 'unemployment', 'gdpPcPps']) {
  assert(financeCompare.rows.every(r => typeof r[field] === 'number'), `Porovnanie má hodnotu ${field} pre všetky celky`);
  assert(financeCompare.indicators[field]?.year >= 2023, `Porovnanie ${field} nie je staršie než 2023`);
}
assert.equal(debtBrake.upperLimit(2017), 60); assert.equal(debtBrake.upperLimit(2018), 59); assert.equal(debtBrake.upperLimit(2025), 52); assert.equal(debtBrake.upperLimit(2027), 50); assert.equal(debtBrake.upperLimit(2030), 50);

// Prepadnuté hlasy: podiel pod hranicou a cena mandátu pri účasti 2023
const wastedFixture = wastedVotes(scenarioFromPoll({ ...latest, values: { ps: 45, smer: 45, dem: 4.9 } }));
assert.equal(wastedFixture.wastedShare, 4.9, 'Prepadnuté hlasy = podiel subjektov pod hranicou');
assert(wastedFixture.votesPerSeat > 17000 && wastedFixture.votesPerSeat < 18500, 'Cena mandátu pri 90 % kvalifikovaných hlasov ≈ 17,8 tis.');
assert(wastedFixture.wastedVotes > 140000 && wastedFixture.wastedVotes < 150000, 'Prepadnuté hlasy v absolútnom počte');
// Peniaze od štátu: 9 subjektov nad 3 %, SMER okolo 23 mil. €, spolu okolo 93 mil. € za obdobie
assert.equal(averageWage.eur, 1304, 'Priemerná mzda 2022 podľa ŠÚ SR');
assert.equal(eligibleFunding.length, 9, 'Deväť subjektov s viac ako 3 % v roku 2023');
assert(subjectFunding.filter(f => !f.eligible).every(f => f.total === 0), 'Pod hranicou nie je nárok');
const smerFunding = subjectFunding.find(f => f.subject.partyId === 'smer');
assert(smerFunding.total > 22e6 && smerFunding.total < 24e6, 'SMER: nárok ~23 mil. € za obdobie');
assert(fundingTotal > 85e6 && fundingTotal < 100e6, 'Spolu ~93 mil. € pre všetky subjekty');
assert.equal(fundingForParty('smer').kind, 'party'); assert.equal(fundingForParty('ku').kind, 'coalition'); assert.equal(fundingForParty('rodina').kind, 'below'); assert.equal(fundingForParty('pnp').kind, 'absent');

// Denná hra: 150 kresiel, jediné najtesnejšie riešenie z troch strán, deterministické zadanie, fiktívne mená
for (const id of ['2026-09-18', '2026-09-19', '2026-10-01', '2026-12-31', 'training:test']) {
  const p = createPuzzle(id);
  assert.equal(p.seats.reduce((a, b) => a + b, 0), 150, `Hra: 150 kresiel (${id})`);
  assert(p.solutions.length === 1 && p.solutions[0].length === 3 && p.target >= 76 && p.target <= 87, `Hra: jediné riešenie z troch strán (${id})`);
  assert(evaluate(p, p.solutions[0]).won && !evaluate(p, []).won, `Hra: riešenie vyhráva, prázdny výber nie (${id})`);
  assert.deepEqual(createPuzzle(id), p, `Hra: rovnaké zadanie pre všetkých (${id})`);
}
assert(evaluate(fallbackPuzzle, fallbackPuzzle.solutions[0]).won, 'Hra: záložný hlavolam je riešiteľný');
assert.equal(new Set(gameParties.map(p => p.name)).size, 6);
assert(gameParties.every(p => !/^(Most|Smer|Hlas|SNS|KDH|SaS|Sieť|Aliancia|Republika)$/i.test(p.name)), 'Hra: fiktívne mená nekolidujú so skutočnými stranami');
assert.equal(previousDay('2026-09-18', 1), '2026-09-17');
const sanitized = readSave({ selected: [0, 0, 9, 'x'], attempts: -5, hints: 99, solved: true }, createPuzzle('2026-09-18'));
assert.deepEqual(sanitized.selected, [0]); assert.equal(sanitized.attempts, 0); assert.equal(sanitized.hints, 3); assert.equal(sanitized.solved, false, 'Hra: „vyriešené“ platí len s vyhrávajúcim výberom');

// Karta parlamentu: partneri v karte parlamentu menia bloky presne o kreslá REPUBLIKY a Hnutia Slovensko.
const modelRows = scenarioFromPoll(aggregateAsPoll()).rows.map(r => ({ id: r.id, short: r.short, color: r.color, seats: r.seats }));
const plainBlocs = blocSeats(modelRows), partnerBlocs = blocSeats(modelRows, optionalIds);
const modelSeatsOf = id => modelRows.find(r => r.id === id)?.seats ?? 0;
assert.equal(partnerBlocs.coalition.seats, plainBlocs.coalition.seats + modelSeatsOf("rep"), "S partnermi: koalícia rastie o kreslá REPUBLIKY");
assert.equal(partnerBlocs.opposition.seats, plainBlocs.opposition.seats + modelSeatsOf("slovensko"), "S partnermi: opozícia rastie o kreslá Hnutia Slovensko");
assert.equal(partnerBlocs.coalition.seats + partnerBlocs.opposition.seats + partnerBlocs.others.seats, 150, "S partnermi ostáva 150 kresiel");
assert(partnerBlocs.others.seats < plainBlocs.others.seats, "S partnermi ubudne z ostatných");

// Výsledok 2023 v karte strany: vlastná kandidátka, koalícia alebo neúčasť — každá dnešná strana má odpoveď.
for (const party of parties) {
  const r = result2023(party.id);
  assert(['party', 'coalition', 'absent'].includes(r.kind), `Výsledok 2023 má typ: ${party.id}`);
  if (r.kind !== 'absent') assert(r.pct >= 0 && r.pct <= 100 && Number.isInteger(r.seats) && r.seats >= 0, `Výsledok 2023 v medziach: ${party.id}`);
}
assert.deepEqual(result2023('smer'), { kind: 'party', pct: 22.94, seats: 42 });
assert.deepEqual(result2023('rep'), { kind: 'party', pct: 4.75, seats: 0 });
assert.deepEqual(result2023('slovensko'), { kind: 'coalition', pct: 8.89, seats: 16, label: coalition2023.label });
assert.deepEqual(result2023('ku'), result2023('slovensko'), 'Kresťanská únia zdieľa výsledok koalície');
assert.equal(result2023('pnp').kind, 'absent', 'Právo na pravdu v roku 2023 nekandidovalo');
assert.equal(result2023('vidiek').kind, 'absent', 'Strana vidieka v roku 2023 nekandidovala');

// Do decembra: každá správa má lacnú možnosť, odložené účty stihnú prísť do decembra, každý mesiac má z čoho vyberať
// a sezóny z dátumov sú férové (dá sa dohrať na tri hviezdy, dá sa aj padnúť) bez záložného plánu.
{
  const dg = await import('../lib/december-game.ts');
  const ids = new Set();
  for (const e of dg.EVENTS) {
    assert(!ids.has(e.id), `Do decembra: duplicitná správa ${e.id}`); ids.add(e.id);
    assert(e.options.length === 3 && e.months.length > 0, `Do decembra: ${e.id} má tri možnosti a mesiace`);
    assert(e.options.some(o => o.cost <= 1), `Do decembra: ${e.id} nemá lacnú možnosť`);
    for (const o of e.options) {
      assert(o.label.length <= 26 && o.hint.length <= 60, `Do decembra: ${e.id} má text pre mobil (${o.label.length}/${o.hint.length})`);
      for (const value of Object.values(o.effect ?? {})) assert(Math.abs(value) <= 3, `Do decembra: ${e.id} mení oblasť najviac o 3`);
      if (o.later) assert(Math.max(...e.months) + o.later.after <= 11, `Do decembra: odložený účet ${e.id} by prišiel po decembri`);
      if (o.hint.includes('{month}')) assert(!!o.later, `Do decembra: ${e.id} spomína mesiac bez odloženého účtu`);
    }
  }
  for (let m = 0; m < 12; m++) assert(dg.EVENTS.filter(e => e.months.includes(m)).length >= 8, `Do decembra: mesiac ${m + 1} má aspoň 8 správ`);
  assert(dg.survey(dg.fallbackPlan).best === 3, 'Do decembra: záložná sezóna sa dá dohrať na tri hviezdy');
  for (let i = 0; i < 14; i++) {
    const day = new Date(Date.UTC(2026, 8, 19 + i)).toISOString().slice(0, 10);
    const plan = dg.createSeason(day);
    assert(!plan.fallback, `Do decembra: sezóna ${day} nepotrebuje záložný plán`);
    const first = dg.replay(plan, Array(12).fill(0)), second = dg.replay(plan, Array(12).fill(1));
    assert(first.ended && second.ended, `Do decembra: sezóna ${day} sa dá dohrať oboma krajnými cestami`);
    const path = dg.winningPath(plan);
    assert(path && path.length === 12 && dg.grade(dg.replay(plan, path)).stars === 3, `Do decembra: overená víťazná cesta ${day}`);
    for (const choice of [0, 1, 2]) assert(dg.grade(dg.replay(plan, Array(12).fill(choice))).stars < 3, `Do decembra: opakovanie ${choice} nevyhrá ${day}`);
    assert(JSON.stringify(dg.replay(plan, [0, 1, 1, 0])) === JSON.stringify(dg.replay(plan, [0, 1, 1, 0])), 'Do decembra: prehratie je deterministické');
  }
  const bad = dg.readSave({ choices: [0, 1, 2, 'x', 1], stars: 7 });
  assert(bad.choices.length === 3 && bad.stars === null, 'Do decembra: uložená hra sa čistí');
  assert.deepEqual(bad.choices, [0, 1, 2], 'Do decembra: chybný ťah ukončí platný prefix, neposunie ďalšie mesiace');
  const plan = dg.createSeason('2026-09-20');
  const before = dg.start(plan);
  const copy = JSON.stringify(before);
  dg.choose(plan, before, 2);
  assert.equal(JSON.stringify(before), copy, 'Do decembra: voľba nemení vstupný stav');
  assert.equal(dg.choose(plan, before, 3), before, 'Do decembra: neplatná voľba sa ignoruje');
  const result = dg.replay(plan, dg.winningPath(plan));
  assert.equal(dg.choose(plan, result, 0), result, 'Do decembra: ukončená partia neprijíma ďalšie voľby');
  const boundary = { ...dg.start(plan), month: 2, meters: { schools: 10, health: 10, transport: 10 }, coins: 100 };
  const boundaryEvent = dg.eventFor(plan, boundary);
  const option = boundaryEvent.options[0];
  const april = dg.choose(plan, boundary, 0);
  for (const {id} of dg.METERS) assert.equal(april.meters[id], Math.max(0, Math.min(10, 10 + (option.effect?.[id] ?? 0)) - 1), 'Do decembra: aprílové opotrebovanie');
  assert.equal(dg.grade({ ...result, coins: 2 }).stars, 2, 'Do decembra: tri hviezdy vyžadujú rezervu');
}
