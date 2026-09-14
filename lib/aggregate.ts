import { archive, parties, type Poll } from "./polls.ts";

export const aggregateAgencies = ["AKO", "FOCUS", "INFOSTAT", "IPSOS", "NMS"] as const;
export const aggregateWindowDays = 60;
export const aggregateHalfLifeDays = 30;

export type AggregateValue = {
  partyId: string;
  value: number;
  lower: number;
  upper: number;
  polls: number;
  agencies: string[];
};

export type AggregatePoint = {
  date: string;
  values: Record<string, AggregateValue>;
  pollIds: string[];
};

const msDay = 86_400_000;
const dayDiff = (later:string, earlier:string) => Math.max(0, (Date.parse(`${later}T12:00:00Z`) - Date.parse(`${earlier}T12:00:00Z`)) / msDay);
const round = (value:number) => Math.round(value * 10) / 10;

export function pollsForAggregate(asOf:string, source:Poll[]=archive) {
  const eligible = source.filter(p => aggregateAgencies.includes(p.agency as typeof aggregateAgencies[number]) && p.end <= asOf && dayDiff(asOf,p.end) <= aggregateWindowDays);
  return aggregateAgencies.flatMap(agency => {
    const latest = eligible.filter(p=>p.agency===agency).sort((a,b)=>b.end.localeCompare(a.end))[0];
    return latest ? [latest] : [];
  });
}

export function aggregateAt(asOf:string, source:Poll[]=archive):AggregatePoint {
  const selected = pollsForAggregate(asOf,source);
  const values:Record<string,AggregateValue> = {};
  for(const party of parties) {
    const inputs = selected.filter(p=>p.values[party.id]!==undefined).map(p=>{
      const age = dayDiff(asOf,p.end);
      const recency = Math.pow(.5, age / aggregateHalfLifeDays);
      const sample = p.sample ?? 1000;
      const precision = Math.max(.7,Math.min(1.4,Math.sqrt(sample/1000)));
      return {poll:p,value:p.values[party.id],weight:recency*precision,sample};
    });
    if(!inputs.length) continue;
    const weightSum=inputs.reduce((sum,x)=>sum+x.weight,0);
    const normalized=inputs.map(x=>({...x,alpha:x.weight/weightSum}));
    const mean=normalized.reduce((sum,x)=>sum+x.alpha*x.value,0);
    const effective=1/normalized.reduce((sum,x)=>sum+x.alpha*x.alpha,0);
    const samplingVariance=normalized.reduce((sum,x)=>{
      const proportion=x.value/100;
      return sum + x.alpha*x.alpha*proportion*(1-proportion)/x.sample*10_000;
    },0);
    const disagreement=normalized.reduce((sum,x)=>sum+x.alpha*Math.pow(x.value-mean,2),0)/Math.max(1,effective);
    const halfWidth=Math.max(.8,1.96*Math.sqrt(samplingVariance+disagreement));
    values[party.id]={partyId:party.id,value:round(mean),lower:round(Math.max(0,mean-halfWidth)),upper:round(Math.min(100,mean+halfWidth)),polls:inputs.length,agencies:inputs.map(x=>x.poll.agency)};
  }
  return {date:asOf,values,pollIds:selected.map(p=>p.id)};
}

function weeklyDates(start:string,end:string) {
  const dates:string[]=[];
  for(let time=Date.parse(`${start}T12:00:00Z`);time<=Date.parse(`${end}T12:00:00Z`);time+=7*msDay) dates.push(new Date(time).toISOString().slice(0,10));
  if(dates.at(-1)!==end) dates.push(end);
  return dates;
}

const eligibleArchive=archive.filter(p=>aggregateAgencies.includes(p.agency as typeof aggregateAgencies[number]));
export const aggregateLastDate=eligibleArchive.reduce((max,p)=>p.end>max?p.end:max,"0000-00-00");
export const aggregateSeries=weeklyDates("2026-01-20",aggregateLastDate).map(d=>aggregateAt(d));
export const currentAggregate=aggregateAt(aggregateLastDate);
export const aggregatePolls=pollsForAggregate(aggregateLastDate);

export function aggregateAsPoll(point:AggregatePoint=currentAggregate):Poll {
  return {
    id:`mandat-aggregate-${point.date}`,
    month:new Date(`${point.date}T12:00:00Z`).toLocaleDateString("sk-SK",{month:"long"}),
    agency:"Model Mandát",
    published:point.date,
    start:aggregatePolls.reduce((min,p)=>p.start<min?p.start:min,point.date),
    end:point.date,
    sample:null,
    method:"Vážený priemer najnovších meraní piatich agentúr",
    type:"Agregovaný volebný model",
    client:"Mandát · vlastný výpočet",
    source:"?v=method#metodika-agregatora",
    sourceName:"Metodika agregátora Mandát",
    complete:false,
    values:Object.fromEntries(Object.values(point.values).map(v=>[v.partyId,v.value])),
    note:"Agregát nie je prieskum ani predpoveď. Vstupné merania a výpočet sú uvedené v metodike."
  };
}
