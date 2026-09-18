"use client";

import { Bar, CartesianGrid, Cell, ComposedChart, Line, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer } from "@/components/ui/chart";

/*
  Graf hospodárenia: stĺpce = saldo verejnej správy (% HDP) zafarbené podľa vlády, ktorá rok
  odvládla najdlhšie; čiara = dlh (% HDP, pravá os); prerušovaná = horný limit dlhu podľa ústavného
  zákona. Samostatný modul, aby sa Recharts načítal až pri otvorení záložky.
*/

export type FinanceChartRow = { year: number; deficitPct: number; debtPct: number; limit: number | null; color: string; cabinet: string; events: string[] };

const config = {
  deficitPct: { label: "Saldo, % HDP", color: "#20392f" },
  debtPct: { label: "Dlh, % HDP", color: "#20392f" },
  limit: { label: "Horný limit dlhu", color: "#9a6b1f" },
};
const num = (v: number, d = 1) => v.toLocaleString("sk-SK", { minimumFractionDigits: d, maximumFractionDigits: d });

type TipProps = { active?: boolean; payload?: { payload: FinanceChartRow }[] };
function Tip({ active, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  return <div className="finance-tip">
    <b>{r.year}</b><span style={{ color: r.color }}>{r.cabinet}</span>
    <p>Saldo <b>{num(r.deficitPct)} % HDP</b></p>
    <p>Dlh <b>{num(r.debtPct)} % HDP</b></p>
    {r.limit !== null && <p>Horný limit dlhu {num(r.limit, 0)} % HDP</p>}
    {r.events.map(e => <small key={e}>{e}</small>)}
  </div>;
}

export default function FinanceChart({ rows }: { rows: FinanceChartRow[] }) {
  const minDeficit = Math.min(-4, Math.floor(Math.min(...rows.map(r => r.deficitPct))) - 1);
  const maxDebt = Math.max(70, Math.ceil(Math.max(...rows.map(r => r.debtPct)) / 10) * 10);
  return <ChartContainer config={config} className="finance-chart">
    <ComposedChart data={rows} margin={{ top: 12, right: 6, bottom: 4, left: 0 }} accessibilityLayer>
      <CartesianGrid vertical={false} stroke="#e3e8df"/>
      <XAxis dataKey="year" axisLine={false} tickLine={false} fontSize={12} ticks={rows.filter(r => r.year % 5 === 0).map(r => r.year)}/>
      <YAxis yAxisId="deficit" domain={[minDeficit, 2]} axisLine={false} tickLine={false} width={34} fontSize={12}/>
      <YAxis yAxisId="debt" orientation="right" domain={[0, maxDebt]} axisLine={false} tickLine={false} width={30} fontSize={12}/>
      <ReferenceLine yAxisId="deficit" y={-3} stroke="#778395" strokeDasharray="4 4"/>
      <ReferenceLine yAxisId="deficit" y={0} stroke="#20392f"/>
      <Tooltip content={props => <Tip {...(props as unknown as TipProps)}/>} cursor={{ fill: "rgba(32,57,47,.06)" }}/>
      <Bar yAxisId="deficit" dataKey="deficitPct" radius={[2, 2, 0, 0]} maxBarSize={22} isAnimationActive={false}>
        {rows.map(r => <Cell key={r.year} fill={r.color}/>)}
      </Bar>
      <Line yAxisId="debt" type="monotone" dataKey="limit" stroke="#9a6b1f" strokeDasharray="5 4" strokeWidth={1.5} dot={false} connectNulls={false} isAnimationActive={false}/>
      <Line yAxisId="debt" type="monotone" dataKey="debtPct" stroke="#20392f" strokeWidth={2.2} dot={{ r: 2.5, fill: "#20392f", strokeWidth: 0 }} isAnimationActive={false}/>
    </ComposedChart>
  </ChartContainer>;
}
