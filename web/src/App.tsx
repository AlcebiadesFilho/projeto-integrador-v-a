import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, FolderGit2, Moon, RotateCcw, Sun } from 'lucide-react'
import {
  applyFilters,
  computeKpis,
  demandShare,
  groupBy,
  loadDataset,
  monthly,
  pareto,
  reactiveCycleByQuarter,
  type Dataset,
  type Filters,
} from './lib/data'
import { hrs, mins, monthLabel, monthLong, num, pct } from './lib/format'
import { useTheme } from './lib/theme'
import { ChartCard, Chapter, DataTable, Finding, Legend, MultiSelect, Reveal, Segmented } from './components/ui'
import { Columns, HBars, IndexChart, ParetoChart, QuarterLines, ShareBars, Sparkline, TrendLine } from './components/charts'

const REPO = 'https://github.com/AlcebiadesFilho/projeto-integrador-v-a'
const FOCUS_TEAM = 'Backup'

const CHAPTERS = [
  ['visao', 'Visão geral'],
  ['reativo', 'Demanda reativa'],
  ['prioridade', 'Prioridade'],
  ['esforco', 'Esforço e clientes'],
  ['acoes', 'Recomendações'],
] as const

export default function App() {
  const [data, setData] = useState<Dataset | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    loadDataset().then(setData).catch((e) => setError(String(e)))
  }, [])
  if (error) return <Splash text={`Não foi possível carregar os dados. ${error}`} />
  if (!data) return <Splash text="Carregando 41 mil chamados…" />
  return <Dashboard d={data} />
}

function Splash({ text }: { text: string }) {
  return <div className="flex min-h-screen items-center justify-center text-ink-2">{text}</div>
}

function Dashboard({ d }: { d: Dataset }) {
  const last = d.months.length - 1
  const initial: Filters = { from: 0, to: last, teams: [], urgencies: [], demand: '' }
  const [f, setF] = useState<Filters>(initial)

  const all = useMemo(() => applyFilters(d, initial), [d]) // eslint-disable-line react-hooks/exhaustive-deps
  const idx = useMemo(() => applyFilters(d, f), [d, f])
  const k = useMemo(() => computeKpis(d, idx), [d, idx])
  const m = useMemo(() => monthly(d, idx), [d, idx])
  const teams = useMemo(() => groupBy(d, idx, 'team'), [d, idx])
  const share = useMemo(() => demandShare(d, idx), [d, idx])
  const quarters = useMemo(() => reactiveCycleByQuarter(d, idx, FOCUS_TEAM), [d, idx])
  const par = useMemo(() => pareto(d, idx), [d, idx])

  const reactiveIdx = useMemo(() => {
    const r = d.dims.demand.indexOf('Reativa')
    return idx.filter((i) => d.cols.demand[i] === r)
  }, [d, idx])
  const reactiveByUrg = useMemo(() => groupBy(d, reactiveIdx, 'urgency'), [d, reactiveIdx])
  const urgAll = useMemo(() => groupBy(d, idx, 'urgency'), [d, idx])
  const internal = useMemo(() => {
    const s = d.dims.service.indexOf(d.meta.internalService)
    return groupBy(d, idx.filter((i) => d.cols.service[i] === s), 'category').sort((a, b) => b.hours - a.hours).slice(0, 6)
  }, [d, idx])
  const focusReactive = useMemo(() => {
    const t = d.dims.team.indexOf(FOCUS_TEAM)
    const sub = reactiveIdx.filter((i) => d.cols.team[i] === t)
    const svc = groupBy(d, sub, 'service').sort((a, b) => b.tickets - a.tickets)
    return { n: sub.length, share: reactiveIdx.length ? (sub.length / reactiveIdx.length) * 100 : 0, top: svc[0], effort: svc.length ? (svc.reduce((s, x) => s + x.hours, 0) / sub.length) * 60 : 0 }
  }, [d, reactiveIdx])

  // Herói: sempre a base completa (a história principal)
  const hero = useMemo(() => {
    const s = demandShare(d, all)
    const r = s.find((x) => x.type === 'Reativa')!
    const p = s.find((x) => x.type === 'Planejada')!
    return { r, p, k: computeKpis(d, all), ratio: r.cycleMedian / p.cycleMedian }
  }, [d, all])

  const filtered = f.from !== 0 || f.to !== last || f.teams.length || f.urgencies.length || f.demand

  const growth = m.length >= 6
    ? {
        t: (avg(m.slice(-3).map((r) => r.tickets)) / avg(m.slice(0, 3).map((r) => r.tickets)) - 1) * 100,
        h: (avg(m.slice(-3).map((r) => r.hours)) / avg(m.slice(0, 3).map((r) => r.hours)) - 1) * 100,
      }
    : null

  const sr = share.find((x) => x.type === 'Reativa')
  const sp = share.find((x) => x.type === 'Planejada')
  const urg = Object.fromEntries(reactiveByUrg.map((u) => [u.key, u.cycleMedian]))
  const n50 = par.find((r) => r.cumPct >= 50)
  const focusRow = teams.find((t) => t.key === FOCUS_TEAM)

  return (
    <div className="min-h-screen">
      <Header />

      {/* ------------------------------------------------------------- HERÓI */}
      <header className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(60% 50% at 85% 10%, var(--accent-wash), transparent 70%), radial-gradient(50% 60% at 10% 90%, var(--series-wash), transparent 70%)',
          }}
        />
        <div className="relative mx-auto max-w-[1200px] px-4 pt-16 pb-20 sm:px-8 sm:pt-24 sm:pb-28">
          <Reveal>
            <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-2">
              <span className="rounded-full border border-hairline bg-surface px-3 py-1 font-medium">Projeto Integrador V-A</span>
              <span>Infomach · Service Desk · base Movidesk</span>
            </div>
            <h1 className="max-w-[18ch] text-[44px] leading-[1.02] font-semibold tracking-[-0.03em] text-balance sm:text-[76px]">
              O gargalo do service desk não é esforço.{' '}
              <span className="text-accent">É fila.</span>
            </h1>
            <p className="mt-8 max-w-[58ch] text-lg leading-relaxed text-pretty text-ink-2 sm:text-xl">
              Chamados reativos são <b className="text-ink">{pct(hero.r.ticketsPct, 0)}</b> do volume e só{' '}
              <b className="text-ink">{pct(hero.r.hoursPct, 0)}</b> das horas, mas levam{' '}
              <b className="text-ink">{num(hero.ratio, 1)}× mais tempo</b> para fechar do que o trabalho planejado.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-4">
              {[
                [num(hero.k.tickets), 'chamados analisados'],
                [num(hero.k.hours), 'horas técnicas'],
                [String(hero.k.months), `meses · ${monthLong(d.months[0])} a ${monthLong(d.months[last])}`],
                [num(hero.k.clients), 'clientes atendidos'],
              ].map(([v, l]) => (
                <div key={l} className="bg-surface px-5 py-5">
                  <div className="text-3xl font-semibold tracking-tight">{v}</div>
                  <div className="mt-1 text-sm text-muted">{l}</div>
                </div>
              ))}
            </div>
          </Reveal>
          <a href="#contexto" className="mt-12 inline-flex items-center gap-2 text-sm font-medium text-ink-2 hover:text-ink">
            <ArrowDown size={16} /> Começar pela pergunta
          </a>
        </div>
      </header>

      {/* --------------------------------------------------------- CONTEXTO */}
      <section id="contexto" className="border-y border-hairline bg-surface">
        <div className="mx-auto grid max-w-[1200px] gap-12 px-4 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.1fr_1fr]">
          <Reveal>
            <div className="font-mono text-sm text-muted">00</div>
            <div className="mt-1 text-sm font-medium tracking-wide text-ink-2 uppercase">O problema</div>
            <h2 className="mt-5 max-w-[20ch] text-3xl leading-tight font-semibold tracking-tight">
              O Movidesk registra cada chamado. Ninguém via o conjunto.
            </h2>
            <p className="mt-5 max-w-[56ch] leading-relaxed text-ink-2">
              A <b className="text-ink">Infomach</b> é um provedor de serviços gerenciados de TI e Segurança (MSSP) em Goiânia/GO. Os relatórios
              nativos do Movidesk são listas operacionais: mostram chamados, não mostram <i>tendência</i>, <i>concentração</i> nem{' '}
              <i>gargalo</i>. Este painel responde às quatro perguntas que a coordenação técnica precisava responder.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <ol className="space-y-px overflow-hidden rounded-2xl border border-hairline bg-hairline">
              {[
                ['A demanda cresce? O esforço acompanha?', 'Dimensionar as equipes', 'visao'],
                ['Quanto é reativo e onde ele trava?', 'Onde atacar primeiro', 'reativo'],
                ['A prioridade muda o tempo de atendimento?', 'Régua de SLA', 'prioridade'],
                ['Para onde vão as horas técnicas?', 'Contratos e alocação', 'esforco'],
              ].map(([q, dec, id], i) => (
                <li key={id}>
                  <a href={`#${id}`} className="group flex items-start gap-4 bg-page px-5 py-4 transition hover:bg-surface-2">
                    <span className="font-mono text-sm text-muted">0{i + 1}</span>
                    <span className="flex-1">
                      <span className="block font-medium text-ink">{q}</span>
                      <span className="text-sm text-muted">Decisão: {dec}</span>
                    </span>
                    <span className="text-muted transition group-hover:translate-x-0.5 group-hover:text-ink">→</span>
                  </a>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------- FILTROS */}
      <FilterBar d={d} f={f} setF={setF} reset={() => setF(initial)} filtered={!!filtered} count={k.tickets} />

      {/* ------------------------------------------------------- 01 VISÃO */}
      <Chapter
        id="visao"
        n="01"
        kicker="Visão geral"
        title="A demanda cresceu muito mais que o esforço."
        lede="Nove indicadores resumem a operação. Todos respondem aos filtros acima."
      >
        <KpiGrid
          items={[
            { label: 'Chamados por mês', value: num(k.ticketsPerMonth), spark: m.map((r) => r.tickets), help: 'Média de chamados abertos por mês' },
            { label: 'Horas técnicas por mês', value: hrs(k.hoursPerMonth), spark: m.map((r) => r.hours), help: 'Média de horas apontadas por mês' },
            { label: 'Esforço médio por chamado', value: mins(k.effortMin), spark: m.map((r) => r.effortMin), help: 'Horas apontadas ÷ chamados' },
            { label: 'Horas por técnico por mês', value: hrs(k.hoursPerAgent), spark: m.map((r) => r.hoursPerAgent), help: 'Horas do mês ÷ técnicos ativos no mês' },
            { label: 'Demanda reativa', value: pct(k.reactivePct), spark: m.map((r) => r.reactivePct), accent: true, help: '% de chamados Incidente ou Alerta' },
            { label: 'Ciclo mediano', value: hrs(k.cycleMedian, 1), spark: m.map((r) => r.cycleMedian), accent: true, help: 'Mediana entre abertura e último apontamento' },
            { label: 'Urgente + Alta', value: pct(k.criticalPct), help: '% de chamados com prioridade Urgente ou Alta' },
            { label: 'Horas em atividade interna', value: pct(k.internalPct), help: "% das horas no serviço 'Infomach (Interno)'" },
          ]}
        />
        {growth && (
          <Finding>
            Comparando os três primeiros com os três últimos meses do recorte, o volume de chamados variou <b>{signed(growth.t)}</b> e as
            horas apontadas, <b>{signed(growth.h)}</b>.{' '}
            {growth.t - growth.h > 10
              ? 'A operação absorveu muito mais demanda sem aumentar o esforço na mesma proporção: os chamados novos são mais curtos, em sua maioria alertas e incidentes de rotina.'
              : growth.h - growth.t > 10
                ? 'Neste recorte o esforço cresceu mais que o volume: cada chamado passou a exigir mais horas.'
                : 'Neste recorte volume e esforço andaram juntos.'}
          </Finding>
        )}
        <ChartCard
          title="Chamados cresceram bem mais que as horas"
          subtitle="Índice mensal, base 100 = média dos três primeiros meses do recorte"
          legend={<Legend items={[{ label: 'Chamados', color: 'var(--accent)', shape: 'line' }, { label: 'Horas apontadas', color: 'var(--series)', shape: 'line' }]} />}
          rows={m}
          columns={[
            { key: 'm', label: 'Mês', render: (r) => monthLabel(r.month) },
            { key: 't', label: 'Chamados', render: (r) => num(r.tickets), align: 'right' },
            { key: 'h', label: 'Horas', render: (r) => num(r.hours), align: 'right' },
            { key: 'r', label: '% reativo', render: (r) => pct(r.reactivePct), align: 'right' },
            { key: 'c', label: 'Ciclo mediano', render: (r) => hrs(r.cycleMedian, 1), align: 'right' },
          ]}
        >
          <IndexChart rows={m} />
        </ChartCard>
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard
            title="Cada técnico aponta cerca de 94 h por mês"
            subtitle="Horas apontadas ÷ técnicos ativos no mês"
            rows={m}
            columns={[
              { key: 'm', label: 'Mês', render: (r) => monthLabel(r.month) },
              { key: 'a', label: 'Horas por técnico', render: (r) => num(r.hoursPerAgent, 1), align: 'right' },
            ]}
          >
            <TrendLine rows={m} field="hoursPerAgent" unit="h por técnico" />
          </ChartCard>
          <ChartCard
            title="Rede e Cloud consomem metade das horas"
            subtitle="Horas apontadas por equipe"
            rows={sortBy(teams, 'hours')}
            columns={[
              { key: 'e', label: 'Equipe', render: (r) => r.key },
              { key: 'h', label: 'Horas', render: (r) => num(r.hours), align: 'right' },
              { key: 'p', label: '% das horas', render: (r) => pct(r.hoursPct), align: 'right' },
              { key: 'm', label: 'Esforço médio', render: (r) => mins(r.effortMin), align: 'right' },
            ]}
          >
            <HBars
              allSeries
              data={sortBy(teams, 'hours').map((t) => ({ key: t.key, value: t.hours, extra: `${pct(t.hoursPct)} das horas · ${mins(t.effortMin)}/chamado` }))}
              fmt={(v) => `${num(v)} h`}
              tipLabel="horas"
            />
          </ChartCard>
        </div>
      </Chapter>

      {/* ------------------------------------------------- 02 REATIVO */}
      <Chapter
        id="reativo"
        n="02"
        kicker="Demanda reativa"
        title={<>Muitos chamados, pouco trabalho, <span className="text-accent">muita espera</span>.</>}
        lede="Incidentes e alertas chegam sem aviso. Eles são rápidos de executar, então o tempo que levam para fechar está na fila, não no técnico."
      >
        {sr && sp && (
          <Finding>
            Chamados reativos são <b>{pct(sr.ticketsPct, 0)}</b> do volume e <b>{pct(sr.hoursPct, 0)}</b> das horas. O ciclo mediano
            deles é de <b>{hrs(sr.cycleMedian, 1)}</b>, contra <b>{hrs(sp.cycleMedian, 1)}</b> do trabalho planejado
            {sr.cycleMedian > sp.cycleMedian * 1.5 ? ': o tempo está na fila, não no trabalho técnico.' : '.'}
          </Finding>
        )}
        <ChartCard
          title="A demanda reativa pesa no volume, não nas horas"
          subtitle="Participação de cada tipo de demanda em chamados e em horas"
          legend={<Legend items={[{ label: 'Reativa (Incidente, Alerta)', color: 'var(--accent)' }, { label: 'Planejada', color: 'var(--series)' }, { label: 'Atendimento / outros', color: 'var(--context)' }]} />}
          rows={share}
          columns={[
            { key: 't', label: 'Tipo', render: (r) => r.type },
            { key: 'n', label: 'Chamados', render: (r) => num(r.tickets), align: 'right' },
            { key: 'np', label: '% chamados', render: (r) => pct(r.ticketsPct), align: 'right' },
            { key: 'hp', label: '% horas', render: (r) => pct(r.hoursPct), align: 'right' },
            { key: 'c', label: 'Ciclo mediano', render: (r) => hrs(r.cycleMedian, 1), align: 'right' },
          ]}
        >
          <ShareBars rows={share} />
        </ChartCard>
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard
            title={`${FOCUS_TEAM}: a equipe mais reativa`}
            subtitle="% de chamados reativos por equipe"
            rows={sortBy(teams, 'reactivePct')}
            columns={[
              { key: 'e', label: 'Equipe', render: (r) => r.key },
              { key: 'r', label: '% reativo', render: (r) => pct(r.reactivePct), align: 'right' },
              { key: 'n', label: 'Chamados', render: (r) => num(r.tickets), align: 'right' },
            ]}
          >
            <HBars
              data={sortBy(teams, 'reactivePct').map((t) => ({ key: t.key, value: t.reactivePct, extra: `${num(t.tickets)} chamados` }))}
              highlight={FOCUS_TEAM}
              fmt={(v) => pct(v, 0)}
              tipLabel="reativo"
            />
          </ChartCard>
          <ChartCard
            title={`… e a que mais demora para fechar`}
            subtitle="Ciclo mediano dos chamados reativos, em horas"
            rows={sortBy(teams.filter((t) => Number.isFinite(t.reactiveCycleMedian)), 'reactiveCycleMedian')}
            columns={[
              { key: 'e', label: 'Equipe', render: (r) => r.key },
              { key: 'c', label: 'Ciclo mediano (reativos)', render: (r) => hrs(r.reactiveCycleMedian, 1), align: 'right' },
            ]}
          >
            <HBars
              data={sortBy(teams.filter((t) => Number.isFinite(t.reactiveCycleMedian)), 'reactiveCycleMedian').map((t) => ({ key: t.key, value: t.reactiveCycleMedian }))}
              highlight={FOCUS_TEAM}
              fmt={(v) => `${num(v)} h`}
              tipLabel="ciclo mediano"
            />
          </ChartCard>
        </div>
        {focusRow && focusReactive.n > 0 && (
          <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            <Reveal>
              <div className="card flex h-full flex-col justify-between gap-8 p-6">
                <div>
                  <div className="text-sm text-muted">Chamados reativos de {FOCUS_TEAM}</div>
                  <div className="mt-2 text-6xl font-semibold tracking-tight text-ink">{pct(focusReactive.share, 0)}</div>
                  <div className="mt-2 text-ink-2">de todo o trabalho reativo da empresa</div>
                </div>
                <dl className="space-y-3 border-t border-hairline pt-5 text-sm">
                  <Stat label="Esforço médio por chamado" value={mins(focusReactive.effort)} />
                  <Stat label="Ciclo mediano" value={hrs(focusRow.reactiveCycleMedian, 1)} />
                  {focusReactive.top && <Stat label={`Vindos de ${focusReactive.top.key}`} value={pct((focusReactive.top.tickets / focusReactive.n) * 100, 0)} />}
                </dl>
              </div>
            </Reveal>
            <ChartCard
              title="O ciclo do Backup oscila em ondas: sinal de fila sem regra de vazão"
              subtitle="Ciclo mediano dos reativos por trimestre"
              legend={<Legend items={[{ label: FOCUS_TEAM, color: 'var(--accent)', shape: 'line' }, { label: 'Demais equipes', color: 'var(--context)', shape: 'line' }]} />}
              rows={quarters}
              columns={[
                { key: 'q', label: 'Trimestre', render: (r) => r.quarter },
                { key: 'f', label: FOCUS_TEAM, render: (r) => (r.focus == null ? '—' : hrs(r.focus, 1)), align: 'right' },
                { key: 'o', label: 'Demais', render: (r) => (r.others == null ? '—' : hrs(r.others, 1)), align: 'right' },
              ]}
            >
              <QuarterLines rows={quarters} focus={FOCUS_TEAM} />
            </ChartCard>
          </div>
        )}
      </Chapter>

      {/* ----------------------------------------------- 03 PRIORIDADE */}
      <Chapter
        id="prioridade"
        n="03"
        kicker="Prioridade"
        title={<>Marcar como “Alta” <span className="text-accent">não acelera</span> o atendimento.</>}
        lede="Se a régua de prioridade funcionasse, cada degrau fecharia mais rápido que o de baixo. Só “Urgente” se diferencia."
      >
        {urg.Urgente != null && urg.Alta != null && urg.Normal != null && (
          <Finding>
            Entre os chamados reativos, “Urgente” fecha em <b>{hrs(urg.Urgente, 0)}</b> (mediana), “Alta” em <b>{hrs(urg.Alta, 0)}</b> e
            “Normal” em <b>{hrs(urg.Normal, 0)}</b>.{' '}
            {urg.Alta >= urg.Normal * 0.8
              ? '“Alta” e “Normal” praticamente empatam: ou a prioridade “Alta” é atribuída sem critério, ou não existe fila priorizada para ela.'
              : 'Neste recorte a prioridade “Alta” fecha claramente mais rápido que a “Normal”: a régua está funcionando.'}
          </Finding>
        )}
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <ChartCard title="Ciclo mediano dos reativos por prioridade" subtitle="Horas entre a abertura e o último apontamento">
            <Columns
              data={['Urgente', 'Alta', 'Normal', 'Baixa']
                .map((u) => reactiveByUrg.find((r) => r.key === u))
                .filter((r) => !!r)
                .map((r) => ({ key: r!.key, value: r!.cycleMedian, n: r!.tickets }))}
              colorOf={(key) => (key === 'Alta' ? 'var(--accent)' : key === 'Urgente' ? 'var(--series)' : 'var(--context)')}
              fmt={(v) => `${num(v)} h`}
              tip="ciclo mediano"
            />
          </ChartCard>
          <Reveal>
            <div className="card h-full p-6">
              <h3 className="text-[17px] font-semibold">Todos os chamados por prioridade</h3>
              <p className="mt-1 mb-4 text-sm text-muted">Inclui demanda planejada</p>
              <DataTable
                rows={d.dims.urgency.map((u) => urgAll.find((r) => r.key === u)).filter((r) => !!r)}
                columns={[
                  { key: 'u', label: 'Prioridade', render: (r) => r!.key },
                  { key: 'n', label: 'Chamados', render: (r) => num(r!.tickets), align: 'right' },
                  { key: 'p', label: '% vol.', render: (r) => pct((r!.tickets / k.tickets) * 100), align: 'right' },
                  { key: 'c', label: 'Ciclo', render: (r) => hrs(r!.cycleMedian, 1), align: 'right' },
                ]}
              />
              <p className="mt-4 text-xs leading-relaxed text-muted">
                Ciclo é um proxy do tempo de resolução: a exportação do Movidesk não traz a data de fechamento.
              </p>
            </div>
          </Reveal>
        </div>
      </Chapter>

      {/* ------------------------------------------------- 04 ESFORÇO */}
      <Chapter
        id="esforco"
        n="04"
        kicker="Esforço e clientes"
        title="Um quinto das horas fica em casa. Poucos clientes levam o resto."
        lede={`A conta ${d.meta.internalClient} concentra o serviço “${d.meta.internalService}” e foi tratada como conta interna. Clientes estão anonimizados.`}
      >
        <div className="grid gap-6 sm:grid-cols-3">
          <BigStat label="das horas em atividade interna" value={pct(k.internalPct, 0)} accent />
          <BigStat label={`dos clientes externos consomem metade das horas`} value={n50 ? pct(n50.clientsPct, 0) : '—'} sub={n50 ? `${n50.rank} de ${par.length} clientes` : ''} />
          <BigStat label="das horas externas nos 10 maiores clientes" value={pct(k.top10Pct, 0)} />
        </div>
        {n50 && (
          <Finding>
            <b>{pct(k.internalPct, 0)}</b> das horas vão para atividade interna, sobretudo reuniões. Entre os clientes externos, apenas{' '}
            <b>{n50.rank}</b> de {par.length} consomem metade das horas: são eles que devem orientar a revisão de contratos e a alocação de
            técnicos dedicados.
          </Finding>
        )}
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <ChartCard
            title="Concentração do esforço entre clientes externos"
            subtitle="Curva de Pareto: % acumulado das horas"
            rows={par.slice(0, 30)}
            columns={[
              { key: 'r', label: '#', render: (r) => r.rank, align: 'right' },
              { key: 'c', label: 'Cliente', render: (r) => r.client },
              { key: 'h', label: 'Horas', render: (r) => num(r.hours), align: 'right' },
              { key: 'a', label: '% acumulado', render: (r) => pct(r.cumPct), align: 'right' },
            ]}
          >
            <ParetoChart rows={par} />
          </ChartCard>
          <ChartCard
            title="Reunião é a maior atividade interna"
            subtitle="Horas no serviço interno, por categoria"
            rows={internal}
            columns={[
              { key: 'c', label: 'Categoria', render: (r) => r.key },
              { key: 'h', label: 'Horas', render: (r) => num(r.hours), align: 'right' },
            ]}
          >
            <HBars allSeries data={internal.map((r) => ({ key: r.key, value: r.hours }))} fmt={(v) => `${num(v)} h`} tipLabel="horas" />
          </ChartCard>
        </div>
        <Reveal>
          <div className="card p-6">
            <h3 className="text-[17px] font-semibold">Os 20 clientes externos que mais consomem horas</h3>
            <p className="mt-1 mb-4 text-sm text-muted">Base para revisão de contratos (preço × consumo)</p>
            <DataTable
              max={520}
              rows={par.slice(0, 20)}
              columns={[
                { key: 'r', label: '#', render: (r) => r.rank, align: 'right' },
                { key: 'c', label: 'Cliente', render: (r) => r.client },
                { key: 'n', label: 'Chamados', render: (r) => num(r.tickets), align: 'right' },
                { key: 'h', label: 'Horas', render: (r) => num(r.hours), align: 'right' },
                { key: 'e', label: 'Esforço médio', render: (r) => mins(r.effortMin), align: 'right' },
                {
                  key: 'a',
                  label: '% acumulado',
                  render: (r) => (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-2">
                        <span className="block h-full rounded-full bg-series" style={{ width: `${r.cumPct}%` }} />
                      </span>
                      {pct(r.cumPct)}
                    </span>
                  ),
                  align: 'right',
                },
              ]}
            />
          </div>
        </Reveal>
      </Chapter>

      {/* --------------------------------------------- 05 RECOMENDAÇÕES */}
      <Chapter id="acoes" n="05" kicker="Recomendações" title="O que os dados sugerem fazer." lede="Cada ação vem com o indicador que mostra se ela funcionou.">
        <div className="grid gap-4 md:grid-cols-2">
          {RECS.map((r, i) => (
            <Reveal key={r.t} delay={i * 60}>
              <div className="card flex h-full flex-col p-6">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-sm text-accent">0{i + 1}</span>
                  <h3 className="text-lg leading-snug font-semibold">{r.t}</h3>
                </div>
                <p className="mt-3 flex-1 leading-relaxed text-ink-2">{r.d}</p>
                <div className="mt-5 flex flex-wrap gap-2 border-t border-hairline pt-4 text-xs">
                  <span className="rounded-full bg-accent-wash px-2.5 py-1 text-ink-2">Evidência: {r.e}</span>
                  <span className="rounded-full bg-series-wash px-2.5 py-1 text-ink-2">Medir: {r.k}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Chapter>

      <Method d={d} />
    </div>
  )
}

// =================================================================================
const RECS = [
  {
    t: 'Automatizar a triagem dos alertas de Backup',
    d: 'Auto-fechar falhas de CloudBackup/Veeam que se resolvem na rotina seguinte e reabrir só se persistirem. Elimina da fila o maior bloco de chamados de baixo esforço.',
    e: '~80% reativo, quase metade de todo o reativo',
    k: 'ciclo mediano dos reativos do Backup',
  },
  {
    t: 'Revisar a régua de prioridade',
    d: 'Definir critérios objetivos para “Alta” e criar uma fila própria para ela, com meta de atendimento abaixo da prioridade “Normal”.',
    e: 'Alta ≈ Normal no ciclo',
    k: 'ciclo mediano por prioridade',
  },
  {
    t: 'Medir e orçar a atividade interna',
    d: 'Separar reunião, relatório e treinamento e definir um teto mensal de horas. Hoje esse esforço não aparece em nenhum relatório.',
    e: '~1/5 das horas é interno',
    k: '% de horas em atividade interna',
  },
  {
    t: 'Revisar contratos do topo do Pareto',
    d: 'Comparar preço × consumo dos clientes que concentram as horas e avaliar técnico dedicado para os maiores.',
    e: '8% dos clientes = 50% das horas',
    k: '% de horas nos 10 maiores clientes',
  },
  {
    t: 'Registrar primeira resposta e fechamento',
    d: 'Ativar no Movidesk a data de primeira resposta e a de fechamento, e desencorajar apontamentos retroativos. Sem isso não há SLA confiável.',
    e: 'o ciclo hoje é um proxy',
    k: '% de chamados com SLA medido',
  },
]

function Header() {
  const { mode, toggle } = useTheme()
  return (
    <div className="sticky top-0 z-40 border-b border-hairline bg-page/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-6 px-4 sm:px-8">
        <a href="#" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink text-[13px] font-bold text-surface">IM</span>
          <span className="hidden sm:inline">Service Desk Analytics</span>
        </a>
        <nav className="hidden flex-1 items-center gap-1 text-sm lg:flex">
          {CHAPTERS.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="rounded-full px-3 py-1.5 text-ink-2 transition hover:bg-surface-2 hover:text-ink">
              {label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <a href={REPO} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-full text-ink-2 hover:bg-surface-2" aria-label="Código no GitHub">
            <FolderGit2 size={18} />
          </a>
          <button onClick={toggle} className="grid h-9 w-9 place-items-center rounded-full text-ink-2 hover:bg-surface-2" aria-label="Alternar tema">
            {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}

function FilterBar({
  d,
  f,
  setF,
  reset,
  filtered,
  count,
}: {
  d: Dataset
  f: Filters
  setF: (f: Filters) => void
  reset: () => void
  filtered: boolean
  count: number
}) {
  const last = d.months.length - 1
  const yearRange = (y: string) => {
    const a = d.months.findIndex((m) => m.startsWith(y))
    const b = d.months.length - 1 - [...d.months].reverse().findIndex((m) => m.startsWith(y))
    return [a, b] as const
  }
  const presets: { value: string; label: string; r: readonly [number, number] }[] = [
    { value: 'all', label: 'Tudo', r: [0, last] },
    { value: '2021', label: '2021', r: yearRange('2021') },
    { value: '12m', label: '12 meses', r: [Math.max(0, last - 11), last] },
  ]
  const current = presets.find((p) => p.r[0] === f.from && p.r[1] === f.to)?.value ?? ''
  const sel = 'h-9 rounded-full border border-hairline bg-surface pr-3 pl-3.5 text-sm text-ink hover:bg-surface-2'
  return (
    <div className="sticky top-14 z-30 border-b border-hairline bg-page/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-2 px-4 py-3 sm:px-8">
        <Segmented options={presets} value={current} onChange={(v) => {
          const p = presets.find((x) => x.value === v)!
          setF({ ...f, from: p.r[0], to: p.r[1] })
        }} />
        <div className="flex items-center gap-1 text-sm text-muted">
          <select className={sel} value={f.from} onChange={(e) => setF({ ...f, from: Math.min(Number(e.target.value), f.to) })} aria-label="Mês inicial">
            {d.months.map((m, i) => <option key={m} value={i}>{monthLabel(m)}</option>)}
          </select>
          <span>–</span>
          <select className={sel} value={f.to} onChange={(e) => setF({ ...f, to: Math.max(Number(e.target.value), f.from) })} aria-label="Mês final">
            {d.months.map((m, i) => <option key={m} value={i}>{monthLabel(m)}</option>)}
          </select>
        </div>
        <MultiSelect label="Equipe" options={d.dims.team} value={f.teams} onChange={(teams) => setF({ ...f, teams })} allLabel="Todas" />
        <MultiSelect label="Prioridade" options={d.dims.urgency} value={f.urgencies} onChange={(urgencies) => setF({ ...f, urgencies })} allLabel="Todas" />
        <MultiSelect
          label="Demanda"
          options={d.dims.demand}
          value={f.demand ? [f.demand] : []}
          onChange={(v) => setF({ ...f, demand: v[v.length - 1] ?? '' })}
          allLabel="Todas"
        />
        <div className="ml-auto flex items-center gap-3">
          <span className="tnum text-sm text-muted">{num(count)} chamados</span>
          {filtered && (
            <button onClick={reset} className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-ink-2 hover:bg-surface-2">
              <RotateCcw size={14} /> Limpar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function KpiGrid({ items }: { items: { label: string; value: string; spark?: number[]; accent?: boolean; help: string }[] }) {
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it, i) => (
        <Reveal key={it.label} delay={i * 40} className="bg-surface">
          <div className="flex h-full flex-col justify-between gap-4 p-5" title={it.help}>
            <div className="text-sm text-ink-2">{it.label}</div>
            <div className="flex items-end justify-between gap-3">
              <div className="text-[30px] leading-none font-semibold tracking-tight whitespace-nowrap">{it.value}</div>
              {it.spark && <Sparkline values={it.spark} accent={it.accent} />}
            </div>
            <div className="text-xs text-muted">{it.help}</div>
          </div>
        </Reveal>
      ))}
    </div>
  )
}

function BigStat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <Reveal>
      <div className="card h-full p-6">
        <div className={`text-5xl font-semibold tracking-tight ${accent ? 'text-accent' : 'text-ink'}`}>{value}</div>
        <div className="mt-2 text-ink-2">{label}</div>
        {sub && <div className="mt-1 text-sm text-muted">{sub}</div>}
      </div>
    </Reveal>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink-2">{label}</dt>
      <dd className="tnum font-semibold">{value}</dd>
    </div>
  )
}

function Method({ d }: { d: Dataset }) {
  return (
    <footer className="mt-8 border-t border-hairline bg-surface">
      <div className="mx-auto grid max-w-[1200px] gap-12 px-4 py-16 sm:px-8 lg:grid-cols-3">
        <div>
          <div className="text-sm font-medium tracking-wide text-ink-2 uppercase">Método e dados</div>
          <p className="mt-4 text-sm leading-relaxed text-ink-2">
            Fonte: exportação do Movidesk cedida pela Infomach, anonimizada (clientes e técnicos mascarados, sem texto livre). Granularidade:
            1 linha = 1 chamado ({num(d.meta.rows)} na janela). Janela: {monthLong(d.months[0])} a {monthLong(d.months[d.months.length - 1])},
            somente meses completos.
          </p>
        </div>
        <div>
          <div className="text-sm font-medium tracking-wide text-ink-2 uppercase">Definições</div>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ink-2">
            <li><b className="text-ink">Reativa</b>: categorias Incidente e Alerta.</li>
            <li><b className="text-ink">Ciclo</b>: abertura → último apontamento (proxy, mediana).</li>
            <li><b className="text-ink">Atividade interna</b>: serviço “{d.meta.internalService}”.</li>
            <li><b className="text-ink">Equipes</b>: grafias unificadas; “Cloud & Desenvolvimento” → “Cloud”.</li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-medium tracking-wide text-ink-2 uppercase">Projeto</div>
          <p className="mt-4 text-sm leading-relaxed text-ink-2">
            Projeto Integrador V-A · Big Data e Inteligência Artificial · PUC Goiás, 2026.
            <br />
            Alcebiades Alves Barbosa Filho
          </p>
          <p className="mt-3 text-sm text-ink-2">
            Python (pandas) para preparação · React + Recharts para visualização.{' '}
            <a className="text-series underline-offset-2 hover:underline" href={REPO} target="_blank" rel="noreferrer">Código-fonte</a>
          </p>
        </div>
      </div>
    </footer>
  )
}

// ---------------------------------------------------------------------------------
const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / (a.length || 1)
const signed = (v: number) => `${v >= 0 ? '+' : ''}${num(v)}%`
function sortBy<T>(rows: T[], key: keyof T): T[] {
  return [...rows].sort((a, b) => Number(b[key]) - Number(a[key]))
}
