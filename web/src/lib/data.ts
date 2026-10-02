// Camada de dados do painel. Replica as definições de src/kpis.py (Python) para que
// os números do painel, do relatório e dos slides sejam sempre os mesmos.

export interface Dataset {
  meta: {
    source: string
    window: [string, string]
    internalClient: string
    internalService: string
    rows: number
  }
  months: string[] // "2020-07"
  dims: Record<DimKey, string[]>
  cols: Record<DimKey | 'month' | 'touches', number[]> & { hours: number[]; cycle: number[] }
}

export type DimKey = 'team' | 'urgency' | 'demand' | 'category' | 'service' | 'client' | 'agent'

export interface Filters {
  from: number // índice do mês
  to: number
  teams: string[]
  urgencies: string[]
  demand: string // '' = todos
}

export async function loadDataset(): Promise<Dataset> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/tickets.json`)
  if (!res.ok) throw new Error(`Falha ao carregar dados (${res.status})`)
  return res.json()
}

/** Índices dos chamados que passam nos filtros. */
export function applyFilters(d: Dataset, f: Filters): Int32Array {
  const { cols, dims } = d
  const teamSet = new Set(f.teams.map((t) => dims.team.indexOf(t)))
  const urgSet = new Set(f.urgencies.map((u) => dims.urgency.indexOf(u)))
  const dem = f.demand ? dims.demand.indexOf(f.demand) : -1
  const out = new Int32Array(cols.month.length)
  let n = 0
  for (let i = 0; i < cols.month.length; i++) {
    const m = cols.month[i]
    if (m < f.from || m > f.to) continue
    if (teamSet.size && !teamSet.has(cols.team[i])) continue
    if (urgSet.size && !urgSet.has(cols.urgency[i])) continue
    if (dem >= 0 && cols.demand[i] !== dem) continue
    out[n++] = i
  }
  return out.slice(0, n)
}

export function median(values: number[]): number {
  if (!values.length) return NaN
  const s = Float64Array.from(values).sort()
  const mid = s.length >> 1
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)

// ---------------------------------------------------------------------------------
// KPIs
// ---------------------------------------------------------------------------------
export interface Kpis {
  ticketsPerMonth: number
  hoursPerMonth: number
  effortMin: number
  hoursPerAgent: number
  reactivePct: number
  criticalPct: number
  cycleMedian: number
  internalPct: number
  top10Pct: number
  tickets: number
  hours: number
  months: number
  clients: number
}

export function computeKpis(d: Dataset, idx: Int32Array): Kpis {
  const { cols, dims, meta } = d
  const reactive = dims.demand.indexOf('Reativa')
  const crit = new Set([dims.urgency.indexOf('Urgente'), dims.urgency.indexOf('Alta')])
  const internalSvc = dims.service.indexOf(meta.internalService)
  const internalCli = dims.client.indexOf(meta.internalClient)
  const unassigned = dims.agent.indexOf('Não atribuído')

  let hours = 0, nReactive = 0, nCrit = 0, internal = 0
  const cycles: number[] = []
  const months = new Set<number>()
  const clients = new Set<number>()
  const clientHours = new Map<number, number>()
  const monthHours = new Map<number, number>()
  const monthAgents = new Map<number, Set<number>>()

  for (const i of idx) {
    const h = cols.hours[i]
    const m = cols.month[i]
    hours += h
    if (cols.demand[i] === reactive) nReactive++
    if (crit.has(cols.urgency[i])) nCrit++
    if (cols.service[i] === internalSvc) internal += h
    cycles.push(cols.cycle[i])
    months.add(m)
    clients.add(cols.client[i])
    if (cols.client[i] !== internalCli) clientHours.set(cols.client[i], (clientHours.get(cols.client[i]) ?? 0) + h)
    monthHours.set(m, (monthHours.get(m) ?? 0) + h)
    if (cols.agent[i] !== unassigned) {
      if (!monthAgents.has(m)) monthAgents.set(m, new Set())
      monthAgents.get(m)!.add(cols.agent[i])
    }
  }
  const n = idx.length
  const nm = Math.max(months.size, 1)
  const ext = [...clientHours.values()].sort((a, b) => b - a)
  const extTotal = sum(ext)
  const perAgent = [...monthAgents.entries()].map(([m, a]) => (monthHours.get(m) ?? 0) / a.size)

  return {
    ticketsPerMonth: n / nm,
    hoursPerMonth: hours / nm,
    effortMin: n ? (hours / n) * 60 : 0,
    hoursPerAgent: perAgent.length ? sum(perAgent) / perAgent.length : 0,
    reactivePct: n ? (nReactive / n) * 100 : 0,
    criticalPct: n ? (nCrit / n) * 100 : 0,
    cycleMedian: median(cycles),
    internalPct: hours ? (internal / hours) * 100 : 0,
    top10Pct: extTotal ? (sum(ext.slice(0, 10)) / extTotal) * 100 : 0,
    tickets: n,
    hours,
    months: months.size,
    clients: clients.size,
  }
}

// ---------------------------------------------------------------------------------
// Agregações para os gráficos
// ---------------------------------------------------------------------------------
export interface MonthRow {
  month: string
  tickets: number
  hours: number
  reactivePct: number
  cycleMedian: number
  hoursPerAgent: number
  effortMin: number
}

export function monthly(d: Dataset, idx: Int32Array): MonthRow[] {
  const { cols, dims } = d
  const reactive = dims.demand.indexOf('Reativa')
  const unassigned = dims.agent.indexOf('Não atribuído')
  const acc = new Map<number, { t: number; h: number; r: number; c: number[]; a: Set<number> }>()
  for (const i of idx) {
    const m = cols.month[i]
    let a = acc.get(m)
    if (!a) acc.set(m, (a = { t: 0, h: 0, r: 0, c: [], a: new Set() }))
    a.t++
    a.h += cols.hours[i]
    if (cols.demand[i] === reactive) a.r++
    a.c.push(cols.cycle[i])
    if (cols.agent[i] !== unassigned) a.a.add(cols.agent[i])
  }
  return [...acc.entries()]
    .sort((x, y) => x[0] - y[0])
    .map(([m, a]) => ({
      month: d.months[m],
      tickets: a.t,
      hours: a.h,
      reactivePct: (a.r / a.t) * 100,
      cycleMedian: median(a.c),
      hoursPerAgent: a.a.size ? a.h / a.a.size : 0,
      effortMin: (a.h / a.t) * 60,
    }))
}

export interface GroupRow {
  key: string
  tickets: number
  hours: number
  reactivePct: number
  cycleMedian: number
  reactiveCycleMedian: number
  effortMin: number
  hoursPct: number
}

/** Agrupa por uma dimensão. `only` restringe a um tipo de demanda. */
export function groupBy(d: Dataset, idx: Int32Array, dim: DimKey): GroupRow[] {
  const { cols, dims } = d
  const reactive = dims.demand.indexOf('Reativa')
  const acc = new Map<number, { t: number; h: number; r: number; c: number[]; rc: number[] }>()
  let total = 0
  for (const i of idx) {
    const k = cols[dim][i]
    let a = acc.get(k)
    if (!a) acc.set(k, (a = { t: 0, h: 0, r: 0, c: [], rc: [] }))
    a.t++
    a.h += cols.hours[i]
    total += cols.hours[i]
    a.c.push(cols.cycle[i])
    if (cols.demand[i] === reactive) {
      a.r++
      a.rc.push(cols.cycle[i])
    }
  }
  return [...acc.entries()].map(([k, a]) => ({
    key: dims[dim][k],
    tickets: a.t,
    hours: a.h,
    reactivePct: (a.r / a.t) * 100,
    cycleMedian: median(a.c),
    reactiveCycleMedian: median(a.rc),
    effortMin: (a.h / a.t) * 60,
    hoursPct: total ? (a.h / total) * 100 : 0,
  }))
}

export interface QuarterRow {
  quarter: string
  focus: number | null
  others: number | null
}

/** Ciclo mediano trimestral dos reativos: equipe em foco x demais. */
export function reactiveCycleByQuarter(d: Dataset, idx: Int32Array, focus: string): QuarterRow[] {
  const { cols, dims } = d
  const reactive = dims.demand.indexOf('Reativa')
  const f = dims.team.indexOf(focus)
  const acc = new Map<string, { f: number[]; o: number[] }>()
  for (const i of idx) {
    if (cols.demand[i] !== reactive) continue
    const [y, m] = d.months[cols.month[i]].split('-').map(Number)
    const q = `${Math.floor((m - 1) / 3) + 1}T/${String(y).slice(2)}`
    const key = `${y}-${Math.floor((m - 1) / 3)}|${q}`
    let a = acc.get(key)
    if (!a) acc.set(key, (a = { f: [], o: [] }))
    ;(cols.team[i] === f ? a.f : a.o).push(cols.cycle[i])
  }
  return [...acc.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, a]) => ({
      quarter: k.split('|')[1],
      focus: a.f.length >= 20 ? median(a.f) : null,
      others: a.o.length >= 20 ? median(a.o) : null,
    }))
}

export interface DemandShare {
  type: string
  ticketsPct: number
  hoursPct: number
  cycleMedian: number
  tickets: number
  hours: number
}

export function demandShare(d: Dataset, idx: Int32Array): DemandShare[] {
  const g = groupBy(d, idx, 'demand')
  const t = sum(g.map((x) => x.tickets))
  const h = sum(g.map((x) => x.hours))
  return d.dims.demand
    .map((type) => g.find((x) => x.key === type))
    .filter((x): x is GroupRow => !!x)
    .map((x) => ({
      type: x.key,
      ticketsPct: (x.tickets / t) * 100,
      hoursPct: (x.hours / h) * 100,
      cycleMedian: x.cycleMedian,
      tickets: x.tickets,
      hours: x.hours,
    }))
}

export interface ParetoRow {
  rank: number
  client: string
  hours: number
  tickets: number
  effortMin: number
  clientsPct: number
  cumPct: number
}

export function pareto(d: Dataset, idx: Int32Array): ParetoRow[] {
  const internal = d.dims.client.indexOf(d.meta.internalClient)
  const ext = idx.filter((i) => d.cols.client[i] !== internal)
  const g = groupBy(d, ext, 'client').sort((a, b) => b.hours - a.hours)
  const total = sum(g.map((x) => x.hours))
  let cum = 0
  return g.map((x, k) => {
    cum += x.hours
    return {
      rank: k + 1,
      client: x.key,
      hours: x.hours,
      tickets: x.tickets,
      effortMin: x.effortMin,
      clientsPct: ((k + 1) / g.length) * 100,
      cumPct: total ? (cum / total) * 100 : 0,
    }
  })
}
