import { caseInputs as inputs } from './political-cases.data.ts';
import { parties } from './polls.ts';

export type CaseStatus = 'report' | 'controversy' | 'indictment' | 'conviction' | 'closed';
export type CaseFlags = { publicMoney:boolean; topLevel:boolean; systemic:boolean; historic:boolean; indirect:boolean };
export type CaseInput = {
  id:string; title:string; period:string; summary:string;
  parties:string[]; relationship:string;
  status:CaseStatus; statusAsOf:string; flags:CaseFlags;
  response:string; source:string; sourceName:string;
};
export type PoliticalCase = CaseInput & { severity:number; severityWhy:string };

export { casesEnabled } from './features.ts';

export const casesChecked='2026-09-13';
export const caseStatuses:Record<CaseStatus,string>={
  report:'Zistenia investigatívy',
  controversy:'Politická kontroverzia',
  indictment:'Obvinenie alebo obžaloba',
  conviction:'Právoplatný rozsudok',
  closed:'Ukončené bez odsúdenia',
};

/*
  Závažnosť 1–10 je REDAKČNÉ HODNOTENIE, nie miera viny ani pravdepodobnosť odsúdenia.
  Použité zdroje (Nadácia Zastavme korupciu, Transparency International Slovensko, Wikipédia,
  správy o rozhodnutiach súdov) jednotnú číselnú stupnicu nemajú, preto ju počítame z verejnej
  stupnice nižšie. Číslo sa nezapisuje ručne: vychádza zo stavu podkladov a zo štyroch označených
  faktorov, takže rovnaké kritériá platia pre každú stranu a výpočet je pri každom prípade viditeľný.

  Východisko podľa stavu podkladov: kontroverzia 2, ukončené bez odsúdenia 2, zistenia investigatívy 3,
  obvinenie alebo obžaloba 6, právoplatný rozsudok 9. Úpravy: +1 verejné peniaze alebo verejné
  obstarávanie; +1 najvyššia úroveň (premiér, minister, europoslanec, predseda strany či parlamentu);
  +1 systémový alebo opakovaný problém; −1 prípad starší ako päť rokov, ktorého osoby už nie sú vo
  funkcii; −1 nepriama väzba (obvinený alebo hodnotený nie je predstaviteľ ani nominant strany, väzba
  je cez rezort, nájomný vzťah alebo zmienku v spise). Výsledok je orezaný na 1–10.
*/
export const severityScale = {
  label:'Redakčná závažnosť 1–10',
  base:{controversy:2,closed:2,report:3,indictment:6,conviction:9} as Record<CaseStatus,number>,
  adjustments:[
    '+1 verejné peniaze alebo verejné obstarávanie',
    '+1 najvyššia úroveň: premiér, minister, europoslanec, predseda strany alebo parlamentu',
    '+1 systémový alebo opakovaný problém',
    '−1 prípad starší ako päť rokov, ktorého osoby už nie sú vo funkcii',
    '−1 nepriama väzba: hodnotená osoba nie je predstaviteľ ani nominant strany',
  ],
  bands:[
    {min:1,max:3,tone:'low',label:'nízka'},
    {min:4,max:6,tone:'mid',label:'stredná'},
    {min:7,max:8,tone:'high',label:'vysoká'},
    {min:9,max:10,tone:'top',label:'najvyššia'},
  ] as {min:number;max:number;tone:'low'|'mid'|'high'|'top';label:string}[],
};
export const flagLabels:Record<keyof CaseFlags,string>={publicMoney:'verejné peniaze',topLevel:'najvyššia úroveň',systemic:'systémový problém',historic:'historický prípad',indirect:'nepriama väzba'};
export const severityBand=(n:number)=>severityScale.bands.find(b=>n>=b.min&&n<=b.max)??severityScale.bands[0];
export const clampSeverity=(n:number)=>Math.min(10,Math.max(1,Math.round(n)));

/** Výpočet závažnosti zo stavu a faktorov, spolu s čitateľným zdôvodnením. */
export function scoreCase(c:CaseInput):{severity:number;severityWhy:string}{
  const base=severityScale.base[c.status];
  const parts:string[]=[`${caseStatuses[c.status].toLowerCase()} ${base}`];
  let raw=base;
  if(c.flags.publicMoney){raw+=1;parts.push('verejné peniaze +1');}
  if(c.flags.topLevel){raw+=1;parts.push('najvyššia úroveň +1');}
  if(c.flags.systemic){raw+=1;parts.push('systémový problém +1');}
  if(c.flags.historic){raw-=1;parts.push('historický prípad −1');}
  if(c.flags.indirect){raw-=1;parts.push('nepriama väzba −1');}
  const severity=clampSeverity(raw);
  const why=`${parts.join(', ')} = ${raw}${raw!==severity?`, orezané na ${severity}`:''}.`;
  return {severity,severityWhy:why.charAt(0).toUpperCase()+why.slice(1)};
}

const validStatuses=new Set<CaseStatus>(Object.keys(caseStatuses) as CaseStatus[]);
export const politicalCaseInputs:CaseInput[]=(inputs as CaseInput[]).filter(c=>validStatuses.has(c.status));
export const politicalCases:PoliticalCase[]=politicalCaseInputs.map(c=>({...c,...scoreCase(c)})).sort((a,b)=>b.severity-a.severity||b.statusAsOf.localeCompare(a.statusAsOf));

/** Prípady s väzbou na stranu, od najzávažnejšieho. Prázdny zoznam neznamená, že strana kauzy nemá. */
export const casesForParty=(partyId:string)=>politicalCases.filter(c=>c.parties.includes(partyId));
export const caseCountsByParty=()=>{const out:Record<string,number>={};for(const c of politicalCases)for(const p of c.parties)out[p]=(out[p]??0)+1;return out;};
export type PartyCaseSummary={id:string;short:string;name:string;color:string;count:number;maxSeverity:number;byStatus:Partial<Record<CaseStatus,number>>};
export const partyCaseSummaries=():PartyCaseSummary[]=>parties.map(p=>{const rows=casesForParty(p.id);const byStatus:Partial<Record<CaseStatus,number>>={};for(const c of rows)byStatus[c.status]=(byStatus[c.status]??0)+1;return {id:p.id,short:p.short,name:p.name,color:p.color,count:rows.length,maxSeverity:rows.length?Math.max(...rows.map(c=>c.severity)):0,byStatus};}).sort((a,b)=>b.count-a.count||b.maxSeverity-a.maxSeverity||a.name.localeCompare(b.name,'sk'));
