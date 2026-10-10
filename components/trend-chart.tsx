"use client";

import { Area, CartesianGrid, ComposedChart, Line, ReferenceDot, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { useEffect, useRef, useState } from "react";
import logos from "@/lib/party-logos.json";
import { trendLabelPositions } from "@/lib/trend-labels";
import "@/app/trend-chart.css";
import type { AggregatePoint, AggregateValue } from "@/lib/aggregate";
import { fmt, type Party } from "@/lib/polls";

/*
  Trendový graf agregátora. Je v samostatnom module, aby sa knižnica grafov (Recharts) načítala
  až pri prepnutí na pohľad Trend, nie pri prvom otvorení stránky (úspora na mobile).
*/

export const timestamp = (value: string) => Date.parse(`${value}T12:00:00Z`);
const monthTick = (value: number) => new Date(value).toLocaleDateString("sk-SK", { month: "short" });

export type TrendChartProps = {
  uid: string;
  data: Record<string, unknown>[];
  ranked: Party[];
  chartParties: Party[];
  focus: string;
  focused: Party;
  points: AggregatePoint[];
  point: AggregatePoint;
  current: AggregateValue | undefined;
  monthTicks: number[];
  monthlyPoints: AggregatePoint[];
  yMin: number;
  yMax: number;
  showBand: boolean;
  showMonths: boolean;
  onMove: (state: { activeTooltipIndex?: number | string | null }) => void;
  onLeave: () => void;
  onPick: (date: string) => void;
};

export default function TrendChart({ uid, data, ranked, chartParties, focus, focused, points, point, current, monthTicks, monthlyPoints, yMin, yMax, showBand, showMonths, onMove, onLeave, onPick }: TrendChartProps) {
  const host=useRef<HTMLDivElement>(null),[size,setSize]=useState({width:900,height:360});
  useEffect(()=>{if(!host.current)return;const observer=new ResizeObserver(entries=>setSize({width:entries[0].contentRect.width,height:entries[0].contentRect.height}));observer.observe(host.current);return()=>observer.disconnect();},[]);
  const latest=points.at(-1)!;
  const endpoints=chartParties.flatMap(p=>latest.values[p.id]?[{...p,value:latest.values[p.id].value}]:[]);
  const labels=trendLabelPositions(endpoints,yMin,yMax,size.height);
  const compact=size.width<600,many=chartParties.length>1;
  const shortLabels:Record<string,string>={rep:'REP.',slovensko:'SLOV.',dem:'DEM.',aliancia:'ALI.',rodina:'SME R.',pnp:'PNP',vidiek:'VIDIEK'};
  const partyLogos=logos as Record<string,{src:string}>;
  return <div className="studio-trend-canvas" ref={host}><ChartContainer config={Object.fromEntries(ranked.map(p => [p.id, { label: p.short, color: p.color }]))} initialDimension={{ width: 900, height: 360 }}>
    <ComposedChart data={data} margin={{ top: 28, right: compact?(many?122:88):170, left: -4, bottom: 4 }} accessibilityLayer onMouseMove={onMove} onTouchMove={onMove} onMouseLeave={onLeave} onClick={state => { const next = Number(state.activeTooltipIndex); if (state.activeTooltipIndex !== null && state.activeTooltipIndex !== undefined && Number.isInteger(next) && points[next]) onPick(points[next].date); }}>
      <defs><linearGradient id={`${uid}-band`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={focused.color} stopOpacity=".2"/><stop offset="100%" stopColor={focused.color} stopOpacity=".035"/></linearGradient></defs>
      <CartesianGrid vertical={false} stroke="#dce3dd" strokeOpacity={.7}/>
      <XAxis type="number" dataKey="time" domain={[timestamp(points[0].date), timestamp(points.at(-1)!.date)]} ticks={monthTicks} minTickGap={30} tickFormatter={monthTick} axisLine={false} tickLine={false} tickMargin={13} tick={{ fontSize: 11, fill: "#59695f" }}/>
      <YAxis width={39} domain={[yMin, yMax]} ticks={Array.from({ length: (yMax - yMin) / 5 + 1 }, (_, i) => yMin + i * 5)} axisLine={false} tickLine={false} tickFormatter={v => `${v} %`} tick={{ fontSize: 10, fill: "#59695f" }}/>
      {yMin <= 5 && <ReferenceLine y={5} stroke="#85978a" strokeDasharray="4 5" label={{ value: "5 %", position: "insideTopLeft", fill: "#59695f", fontSize: 10 }}/>}
      {showBand && <Area key={focus} type="monotone" dataKey="range" stroke="none" fill={`url(#${uid}-band)`} isAnimationActive={false}/>}
      {chartParties.filter(p => p.id !== focus).map(p => <Line key={p.id} type="monotone" dataKey={p.id} stroke={p.color} strokeWidth={1.8} strokeOpacity={.6} dot={false} activeDot={false} connectNulls={false} isAnimationActive={false}/>)}
      <Line type="monotone" dataKey={focus} stroke={focused.color} strokeWidth={3} dot={false} activeDot={false} connectNulls={false} isAnimationActive={false}/>
      {showMonths && monthlyPoints.map((p, i) => p.values[focus] && <ReferenceDot key={p.date} className="studio-month-dot" x={timestamp(p.date)} y={p.values[focus].value} r={3.5} fill="#fcfdf9" stroke={focused.color} strokeWidth={2} label={i<monthlyPoints.length-1&&(!compact||i%3===0)?{ position: "top", value: `${fmt(p.values[focus].value)} %`, fontSize: 11, fontWeight: 600, fill: "#20392f", offset: 12 }:false}/>)}
      <ReferenceLine x={timestamp(point.date)} stroke={focused.color} strokeOpacity={.38} strokeDasharray="3 4"/>
      {current && <ReferenceDot x={timestamp(point.date)} y={current.value} r={5} fill={focused.color} stroke="#fcfdf9" strokeWidth={3}/>}
      {chartParties.filter(p=>p.id!==focus&&point.values[p.id]).map(p=><ReferenceDot key={`cursor-${p.id}`} x={timestamp(point.date)} y={point.values[p.id].value} r={3} fill={p.color} stroke="#fcfdf9" strokeWidth={1.5}/>)}
      {endpoints.map(p=><ReferenceDot key={`end-${p.id}`} x={timestamp(latest.date)} y={p.value} r={2.5} shape={({cx,cy}:{cx?:number;cy?:number})=>{if(cx===undefined||cy===undefined)return <g/>;const y=labels[p.id];return <g className="trend-endpoint" data-party={p.id} aria-label={`${p.short}: ${fmt(p.value)} percent k ${latest.date}`}><path d={`M${cx} ${cy} H${cx+6} L${cx+18} ${y} H${cx+22}`} fill="none" stroke={p.color} strokeOpacity=".65"/><circle cx={cx} cy={cy} r={3} fill={p.color}/><rect x={cx+23} y={y-9} width={18} height={18} rx={3} className="trend-endpoint-logo"/>{partyLogos[p.id]&&<image href={partyLogos[p.id].src} x={cx+25} y={y-7} width={14} height={14}/>}<text x={cx+46} y={y+4} className="trend-endpoint-name">{compact?(shortLabels[p.id]??p.short):p.short}</text><text x={cx+(compact?(many?116:46):164)} y={y+(compact&&!many?18:4)} textAnchor={compact&&!many?"start":"end"} className="trend-endpoint-value">{fmt(p.value)}{compact&&!many?" %":""}</text></g>}}/>)}
      <Tooltip content={() => null} cursor={false}/>
    </ComposedChart>
  </ChartContainer></div>;
}
