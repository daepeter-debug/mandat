"use client";

import { Bar, CartesianGrid, Cell, ComposedChart, Line, Tooltip, XAxis, YAxis } from "recharts";
import type { CSSProperties } from "react";
import { ChartContainer } from "@/components/ui/chart";

/*
  Graf životnej úrovne: stĺpce = minimálna mesačná mzda v € (ľavá os), zafarbené podľa vlády, ktorá rok
  odvládla najdlhšie; čiara = HDP na obyvateľa v parite kúpnej sily voči priemeru EÚ (pravá os, EÚ = 100).
  Samostatný modul, aby sa Recharts načítal až pri otvorení pohľadu.
*/

export type LivingChartRow = { year: number; minWage: number | null; gdpPcPps: number | null; color: string; cabinet: string };

const config = {
  minWage: { label: "Minimálna mzda, €", color: "#20392f" },
  gdpPcPps: { label: "HDP na obyvateľa, EÚ = 100", color: "#20392f" },
};
const num = (v: number, d = 0) => v.toLocaleString("sk-SK", { minimumFractionDigits: d, maximumFractionDigits: d });

type TipProps = { active?: boolean; payload?: { payload: LivingChartRow }[] };
function Tip({ active, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  return <div className="finance-tip">
    <b>{r.year}</b><span className="tone-text" style={{ "--tone": r.color } as CSSProperties}>{r.cabinet}</span>
    {r.minWage !== null && <p>Minimálna mzda <b>{num(r.minWage)} €</b></p>}
    {r.gdpPcPps !== null && <p>HDP na obyvateľa <b>{num(r.gdpPcPps)} % priemeru EÚ</b></p>}
  </div>;
}

export default function LivingChart({ rows }: { rows: LivingChartRow[] }) {
  const maxWage = Math.ceil(Math.max(...rows.map(r => r.minWage ?? 0)) / 200) * 200;
  return <ChartContainer config={config} className="finance-chart">
    <ComposedChart data={rows} margin={{ top: 12, right: 6, bottom: 4, left: 0 }} accessibilityLayer>
      <CartesianGrid vertical={false} stroke="#e3e8df"/>
      <XAxis dataKey="year" axisLine={false} tickLine={false} fontSize={12} ticks={rows.filter(r => r.year % 5 === 0).map(r => r.year)}/>
      <YAxis yAxisId="wage" domain={[0, maxWage]} axisLine={false} tickLine={false} width={40} fontSize={12}/>
      <YAxis yAxisId="pps" orientation="right" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} axisLine={false} tickLine={false} width={32} fontSize={12}/>
      <Tooltip content={props => <Tip {...(props as unknown as TipProps)}/>} cursor={{ fill: "rgba(32,57,47,.06)" }}/>
      <Bar yAxisId="wage" dataKey="minWage" radius={[2, 2, 0, 0]} maxBarSize={22} isAnimationActive={false}>
        {rows.map(r => <Cell key={r.year} fill={r.color}/>)}
      </Bar>
      <Line yAxisId="pps" type="monotone" dataKey="gdpPcPps" stroke="#20392f" strokeWidth={2.2} dot={{ r: 2.5, fill: "#20392f", strokeWidth: 0 }} connectNulls isAnimationActive={false}/>
    </ComposedChart>
  </ChartContainer>;
}
