"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { parties, fmt, type Poll } from "@/lib/polls";

/*
  Graf vývoja podpory podľa jednej agentúry (Dátový prehľad). Samostatný modul, aby sa Recharts
  načítal až pri otvorení tejto záložky s grafom, nie pri prvom načítaní stránky.
*/
const config = Object.fromEntries(parties.map(p => [p.id, { label: p.short, color: p.color }]));
const at = (poll: Poll) => new Date(poll.end + "T12:00:00").getTime();

export default function ArchiveChart({ polls, active, agency }: { polls: Poll[]; active: string[]; agency: string }) {
  return <ChartContainer config={config} className="main-chart">
    <LineChart data={polls.map(p => ({ month: p.month, at: at(p), ...p.values }))} margin={{ top: 20, right: 24, bottom: 12, left: 0 }} accessibilityLayer>
      <CartesianGrid vertical={false} stroke="#e5e9ef"/>
      <XAxis type="number" dataKey="at" domain={["dataMin", "dataMax"]} ticks={polls.map(at)} tickFormatter={n => new Date(n).toLocaleDateString("sk-SK", { month: "short" }).replace(".", "")} axisLine={false} tickLine={false} minTickGap={12} tickMargin={16} fontSize={13}/>
      <YAxis domain={[0, 25]} ticks={[0, 5, 10, 15, 20, 25]} axisLine={false} tickLine={false} width={34} fontSize={13}/>
      <ReferenceLine y={5} stroke="#778395" strokeDasharray="5 5"/>
      <ChartTooltip content={({ active: shown, payload }) => shown && payload?.length ? <div className="poll-tooltip"><strong>{payload[0].payload.month} 2026 · {agency}</strong>{payload.map(item => <div key={String(item.dataKey)}><i style={{ background: item.color }}/><span>{parties.find(p => p.id === item.dataKey)?.short}</span><b>{typeof item.value === "number" ? fmt(item.value) : "—"} %</b></div>)}<small>Zdroj merania nájdete pod grafom</small></div> : null}/>
      {parties.filter(p => active.includes(p.id)).map(p => <Line key={p.id} type="linear" dataKey={p.id} stroke={p.color} strokeWidth={2.7} dot={{ r: 3, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6 }} isAnimationActive={false} connectNulls={false}/>)}
    </LineChart>
  </ChartContainer>;
}
