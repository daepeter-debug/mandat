"use client";

import { Area, CartesianGrid, ComposedChart, Line, ReferenceDot, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
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
  return <ChartContainer config={Object.fromEntries(ranked.map(p => [p.id, { label: p.short, color: p.color }]))} initialDimension={{ width: 900, height: 320 }}>
    <ComposedChart data={data} margin={{ top: 28, right: 30, left: -12, bottom: 4 }} accessibilityLayer onMouseMove={onMove} onMouseLeave={onLeave} onClick={state => { const next = Number(state.activeTooltipIndex); if (state.activeTooltipIndex !== null && state.activeTooltipIndex !== undefined && Number.isInteger(next) && points[next]) onPick(points[next].date); }}>
      <defs><linearGradient id={`${uid}-band`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={focused.color} stopOpacity=".2"/><stop offset="100%" stopColor={focused.color} stopOpacity=".035"/></linearGradient></defs>
      <CartesianGrid vertical={false} stroke="#dce3dd" strokeOpacity={.7}/>
      <XAxis type="number" dataKey="time" domain={[timestamp(points[0].date), timestamp(points.at(-1)!.date)]} ticks={monthTicks} minTickGap={30} tickFormatter={monthTick} axisLine={false} tickLine={false} tickMargin={13} tick={{ fontSize: 11, fill: "#59695f" }}/>
      <YAxis domain={[yMin, yMax]} ticks={Array.from({ length: (yMax - yMin) / 5 + 1 }, (_, i) => yMin + i * 5)} axisLine={false} tickLine={false} tickFormatter={v => `${v} %`} tick={{ fontSize: 10, fill: "#59695f" }}/>
      {yMin <= 5 && <ReferenceLine y={5} stroke="#85978a" strokeDasharray="4 5" label={{ value: "5 %", position: "insideTopLeft", fill: "#59695f", fontSize: 10 }}/>}
      {showBand && <Area key={focus} type="monotone" dataKey="range" stroke="none" fill={`url(#${uid}-band)`} isAnimationActive={false}/>}
      {chartParties.filter(p => p.id !== focus).map(p => <Line key={p.id} type="monotone" dataKey={p.id} stroke={p.color} strokeWidth={1.4} strokeOpacity={.35} dot={false} activeDot={false} connectNulls={false} isAnimationActive={false}/>)}
      <Line type="monotone" dataKey={focus} stroke={focused.color} strokeWidth={3} dot={false} activeDot={false} connectNulls={false} isAnimationActive={false}/>
      {showMonths && monthlyPoints.map((p, i) => p.values[focus] && <ReferenceDot key={p.date} className={`studio-month-dot ${monthlyPoints.length > 5 && i % 2 === 1 && i !== monthlyPoints.length - 1 ? "studio-month-secondary" : ""}`} x={timestamp(p.date)} y={p.values[focus].value} r={3.5} fill="#fcfdf9" stroke={focused.color} strokeWidth={2} label={{ position: "top", value: `${fmt(p.values[focus].value)} %`, fontSize: 11, fontWeight: 600, fill: "#20392f", offset: 12 }}/>)}
      <ReferenceLine x={timestamp(point.date)} stroke={focused.color} strokeOpacity={.38} strokeDasharray="3 4"/>
      {current && <ReferenceDot x={timestamp(point.date)} y={current.value} r={5} fill={focused.color} stroke="#fcfdf9" strokeWidth={3}/>}
      <Tooltip content={() => null} cursor={false}/>
    </ComposedChart>
  </ChartContainer>;
}
