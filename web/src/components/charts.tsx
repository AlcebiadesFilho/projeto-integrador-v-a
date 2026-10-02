import { useEffect, useState } from 'react'
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DemandShare, MonthRow, ParetoRow, QuarterRow } from '../lib/data'
import { monthLabel, num, pct } from '../lib/format'
import { useTheme } from '../lib/theme'
import { TooltipBox } from './ui'

const ANIM = { isAnimationActive: true, animationDuration: 700, animationEasing: 'ease-out' as const }

function useIsMobile() {
  const q = '(max-width: 640px)'
  const [m, setM] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const on = () => setM(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return m
}

function useAxis() {
  const { palette: p } = useTheme()
  const tick = { fill: p.muted, fontSize: 12 }
  return {
    p,
    x: { tick, tickLine: false, axisLine: { stroke: p.axis }, tickMargin: 8 },
    y: { tick, tickLine: false, axisLine: false, width: 48 },
    grid: <CartesianGrid stroke={p.grid} vertical={false} />,
  }
}

// ---------------------------------------------------------------------------------
// Sparkline (tile de KPI) — SVG próprio, leve
// ---------------------------------------------------------------------------------
export function Sparkline({ values, accent = false }: { values: number[]; accent?: boolean }) {
  const { palette: p } = useTheme()
  if (values.length < 2) return null
  const w = 120, h = 32, pad = 3
  const min = Math.min(...values), max = Math.max(...values)
  const sx = (i: number) => pad + (i / (values.length - 1)) * (w - pad * 2)
  const sy = (v: number) => h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2)
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join('')
  const last = values.length - 1
  const c = accent ? p.accent : p.series
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-[96px] shrink-0" aria-hidden>
      <path d={`${d}L${sx(last)},${h}L${sx(0)},${h}Z`} fill={c} opacity={0.08} />
      <path d={d} fill="none" stroke={p.context} strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={sx(last)} cy={sy(values[last])} r={3} fill={c} stroke={p.surface} strokeWidth={1.5} />
    </svg>
  )
}

// ---------------------------------------------------------------------------------
// Chamados x horas indexados (base 100) — um só eixo
// ---------------------------------------------------------------------------------
export function IndexChart({ rows }: { rows: MonthRow[] }) {
  const { p, x, y, grid } = useAxis()
  const mobile = useIsMobile()
  if (rows.length < 3) return <Empty />
  const b = rows.slice(0, 3)
  const bt = b.reduce((s, r) => s + r.tickets, 0) / 3
  const bh = b.reduce((s, r) => s + r.hours, 0) / 3
  const data = rows.map((r) => ({ ...r, it: (r.tickets / bt) * 100, ih: (r.hours / bh) * 100 }))
  const last = data[data.length - 1]
  const vals = data.flatMap((r) => [r.it, r.ih])
  const lo = Math.floor(Math.min(...vals) / 20) * 20
  const hi = Math.ceil(Math.max(...vals) / 20) * 20
  const ticks = Array.from({ length: (hi - lo) / 20 + 1 }, (_, i) => lo + i * 20)
  return (
    <ResponsiveContainer width="100%" height={mobile ? 300 : 340}>
      <LineChart data={data} margin={{ top: 10, right: mobile ? 84 : 110, left: mobile ? -12 : 0, bottom: 0 }}>
        {grid}
        <XAxis dataKey="month" tickFormatter={monthLabel} interval={mobile ? 5 : 2} {...x} />
        <YAxis {...y} domain={[lo, hi]} ticks={ticks} tickFormatter={(v) => num(v)} />
        <ReferenceLine y={100} stroke={p.axis} />
        <Tooltip
          cursor={{ stroke: p.muted, strokeWidth: 1 }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <TooltipBox
                title={monthLabel(payload[0].payload.month)}
                rows={[
                  { label: `chamados · índice ${num(payload[0].payload.it)}`, value: num(payload[0].payload.tickets), color: p.accent },
                  { label: `horas · índice ${num(payload[0].payload.ih)}`, value: num(payload[0].payload.hours), color: p.series },
                ]}
              />
            ) : null
          }
        />
        <Line dataKey="it" stroke={p.accent} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: p.surface, strokeWidth: 2 }} {...ANIM}>
          <LabelList
            dataKey="it"
            content={({ index, x: lx, y: ly }) =>
              index === data.length - 1 ? (
                <text x={Number(lx) + 10} y={Number(ly) + 4} fill={p.ink} fontSize={13} fontWeight={600}>
                  {mobile ? '' : 'Chamados '}{num(last.it)}
                </text>
              ) : null
            }
          />
        </Line>
        <Line dataKey="ih" stroke={p.series} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: p.surface, strokeWidth: 2 }} {...ANIM}>
          <LabelList
            dataKey="ih"
            content={({ index, x: lx, y: ly }) =>
              index === data.length - 1 ? (
                <text x={Number(lx) + 10} y={Number(ly) + 4} fill={p.ink} fontSize={13} fontWeight={600}>
                  {mobile ? '' : 'Horas '}{num(last.ih)}
                </text>
              ) : null
            }
          />
        </Line>
      </LineChart>
    </ResponsiveContainer>
  )
}

// ---------------------------------------------------------------------------------
// Linha simples com média (ex.: horas por técnico)
// ---------------------------------------------------------------------------------
export function TrendLine({ rows, field, unit }: { rows: MonthRow[]; field: keyof MonthRow; unit: string }) {
  const { p, x, y, grid } = useAxis()
  const vals = rows.map((r) => Number(r[field]))
  const avg = vals.reduce((a, b) => a + b, 0) / (vals.length || 1)
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={rows} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
        {grid}
        <XAxis dataKey="month" tickFormatter={monthLabel} interval={5} {...x} />
        <YAxis {...y} tickFormatter={(v) => num(v)} />
        <ReferenceLine
          y={avg}
          stroke={p.muted}
          label={{ value: `média ${num(avg)} ${unit}`, position: 'insideTopLeft', fill: p.ink2, fontSize: 12 }}
        />
        <Tooltip
          cursor={{ stroke: p.muted, strokeWidth: 1 }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <TooltipBox
                title={monthLabel(payload[0].payload.month)}
                rows={[{ label: unit, value: num(Number(payload[0].payload[field])), color: p.series }]}
              />
            ) : null
          }
        />
        <Area dataKey={field as string} fill={p.seriesWash} stroke="none" {...ANIM} />
        <Line dataKey={field as string} stroke={p.series} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: p.surface, strokeWidth: 2 }} {...ANIM} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

// ---------------------------------------------------------------------------------
// Barras horizontais ordenadas, com ênfase em uma categoria
// ---------------------------------------------------------------------------------
export function HBars({
  data,
  highlight,
  fmt,
  tipLabel,
  allSeries = false,
}: {
  data: { key: string; value: number; extra?: string }[]
  highlight?: string
  fmt: (v: number) => string
  tipLabel: string
  allSeries?: boolean
}) {
  const { p, x } = useAxis()
  const mobile = useIsMobile()
  const h = Math.max(160, data.length * 40 + 30)
  const color = (k: string) => (allSeries ? p.series : k === highlight ? p.accent : p.context)
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: mobile ? 52 : 64, left: 0, bottom: 0 }} barCategoryGap={10}>
        <CartesianGrid stroke={p.grid} horizontal={false} />
        <XAxis type="number" {...x} axisLine={false} tickFormatter={(v) => num(v)} />
        <YAxis
          type="category"
          dataKey="key"
          width={mobile ? 112 : 170}
          tickLine={false}
          axisLine={{ stroke: p.axis }}
          tick={{ fill: p.ink2, fontSize: mobile ? 11 : 13 }}
        />
        <Tooltip
          cursor={{ fill: p.grid, opacity: 0.4 }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <TooltipBox
                title={payload[0].payload.key}
                rows={[
                  { label: tipLabel, value: fmt(payload[0].payload.value), color: color(payload[0].payload.key) },
                  ...(payload[0].payload.extra ? [{ label: '', value: payload[0].payload.extra }] : []),
                ]}
              />
            ) : null
          }
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22} {...ANIM}>
          {data.map((d) => (
            <Cell key={d.key} fill={color(d.key)} />
          ))}
          <LabelList dataKey="value" position="right" formatter={(v) => fmt(Number(v))} fill={p.ink2} fontSize={13} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ---------------------------------------------------------------------------------
// Colunas (ex.: ciclo por prioridade)
// ---------------------------------------------------------------------------------
export function Columns({
  data,
  colorOf,
  fmt,
  tip,
}: {
  data: { key: string; value: number; n: number }[]
  colorOf: (k: string) => string
  fmt: (v: number) => string
  tip: string
}) {
  const { p, x, y, grid } = useAxis()
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 28, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
        {grid}
        <XAxis dataKey="key" {...x} tick={{ fill: p.ink2, fontSize: 13 }} />
        <YAxis {...y} tickFormatter={(v) => `${num(v)} h`} />
        <Tooltip
          cursor={{ fill: p.grid, opacity: 0.4 }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <TooltipBox
                title={payload[0].payload.key}
                rows={[
                  { label: tip, value: fmt(payload[0].payload.value), color: colorOf(payload[0].payload.key) },
                  { label: 'chamados', value: num(payload[0].payload.n) },
                ]}
              />
            ) : null
          }
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={56} {...ANIM}>
          {data.map((d) => (
            <Cell key={d.key} fill={colorOf(d.key)} />
          ))}
          <LabelList dataKey="value" position="top" formatter={(v) => fmt(Number(v))} fill={p.ink} fontSize={14} fontWeight={600} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ---------------------------------------------------------------------------------
// Trimestre: equipe em foco x demais
// ---------------------------------------------------------------------------------
export function QuarterLines({ rows, focus }: { rows: QuarterRow[]; focus: string }) {
  const { p, x, y, grid } = useAxis()
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={rows} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        {grid}
        <XAxis dataKey="quarter" {...x} />
        <YAxis {...y} tickFormatter={(v) => `${num(v)} h`} />
        <Tooltip
          cursor={{ stroke: p.muted, strokeWidth: 1 }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <TooltipBox
                title={payload[0].payload.quarter}
                rows={[
                  { label: focus, value: payload[0].payload.focus == null ? '—' : `${num(payload[0].payload.focus, 1)} h`, color: p.accent },
                  { label: 'demais equipes', value: payload[0].payload.others == null ? '—' : `${num(payload[0].payload.others, 1)} h`, color: p.context },
                ]}
              />
            ) : null
          }
        />
        <Line dataKey="others" stroke={p.context} strokeWidth={2} dot={{ r: 4, fill: p.context, stroke: p.surface, strokeWidth: 2 }} connectNulls {...ANIM} />
        <Line dataKey="focus" stroke={p.accent} strokeWidth={2} dot={{ r: 4, fill: p.accent, stroke: p.surface, strokeWidth: 2 }} activeDot={{ r: 6, stroke: p.surface, strokeWidth: 2 }} connectNulls {...ANIM} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ---------------------------------------------------------------------------------
// Pareto de clientes
// ---------------------------------------------------------------------------------
export function ParetoChart({ rows }: { rows: ParetoRow[] }) {
  const { p, x, y, grid } = useAxis()
  if (rows.length < 5) return <Empty />
  const marks = [50, 80].map((th) => rows.find((r) => r.cumPct >= th)!).filter(Boolean)
  return (
    <ResponsiveContainer width="100%" height={340}>
      <ComposedChart data={rows} margin={{ top: 16, right: 24, left: 0, bottom: 18 }}>
        {grid}
        <XAxis
          dataKey="clientsPct"
          type="number"
          domain={[0, 100]}
          ticks={[0, 20, 40, 60, 80, 100]}
          tickFormatter={(v) => `${v}%`}
          {...x}
          label={{ value: '% dos clientes externos (do maior para o menor consumo)', position: 'insideBottom', offset: -12, fill: p.muted, fontSize: 12 }}
        />
        <YAxis {...y} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} />
        <Tooltip
          cursor={{ stroke: p.muted, strokeWidth: 1 }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <TooltipBox
                title={`Top ${payload[0].payload.rank} clientes (${pct(payload[0].payload.clientsPct)})`}
                rows={[{ label: 'das horas externas', value: pct(payload[0].payload.cumPct), color: p.series }]}
              />
            ) : null
          }
        />
        <Area dataKey="cumPct" fill={p.seriesWash} stroke="none" {...ANIM} />
        <Line dataKey="cumPct" stroke={p.series} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: p.surface, strokeWidth: 2 }} {...ANIM} />
        {marks.map((m, k) => (
          <ReferenceDot
            key={k}
            x={m.clientsPct}
            y={m.cumPct}
            r={6}
            fill={p.accent}
            stroke={p.surface}
            strokeWidth={2}
            label={{
              value: `${m.rank} clientes = ${k ? 80 : 50}% das horas`,
              position: 'right',
              offset: 12,
              fill: p.ink,
              fontSize: 13,
              fontWeight: 600,
            }}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  )
}

// ---------------------------------------------------------------------------------
// Participação 100% (chamados x horas por tipo de demanda) — HTML para rótulos nítidos
// ---------------------------------------------------------------------------------
export function ShareBars({ rows }: { rows: DemandShare[] }) {
  const { palette: p } = useTheme()
  const [hover, setHover] = useState<string | null>(null)
  const color = (t: string) => (t === 'Reativa' ? p.accent : t === 'Planejada' ? p.series : p.context)
  const lines: { label: string; field: 'ticketsPct' | 'hoursPct' }[] = [
    { label: 'Chamados', field: 'ticketsPct' },
    { label: 'Horas', field: 'hoursPct' },
  ]
  return (
    <div className="space-y-5 py-2">
      {lines.map((l) => (
        <div key={l.label} className="grid grid-cols-[84px_1fr] items-center gap-4">
          <div className="text-sm font-medium text-ink-2">{l.label}</div>
          <div className="flex h-11 gap-[2px] overflow-hidden rounded-[6px]">
            {rows.map((r) => {
              const v = r[l.field]
              const dim = hover && hover !== r.type
              return (
                <div
                  key={r.type}
                  onMouseEnter={() => setHover(r.type)}
                  onMouseLeave={() => setHover(null)}
                  className="relative flex items-center justify-center transition-[flex-basis,opacity] duration-700 ease-out"
                  style={{ flexBasis: `${v}%`, background: color(r.type), opacity: dim ? 0.35 : 1 }}
                  title={`${r.type}: ${pct(v)}`}
                >
                  {v >= 7 && <span className="tnum text-sm font-semibold text-white">{pct(v, 0)}</span>}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function Empty() {
  return <div className="flex h-40 items-center justify-center text-sm text-muted">Dados insuficientes para este recorte.</div>
}
