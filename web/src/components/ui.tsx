import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown, Table2, X } from 'lucide-react'

// ---------------------------------------------------------------------------------
// Revelação ao rolar
// ---------------------------------------------------------------------------------
export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className={`reveal ${inView ? 'in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------------
// Capítulo da narrativa
// ---------------------------------------------------------------------------------
export function Chapter({
  id,
  n,
  kicker,
  title,
  lede,
  children,
}: {
  id: string
  n: string
  kicker: string
  title: ReactNode
  lede?: ReactNode
  children: ReactNode
}) {
  return (
    <section id={id} className="mx-auto max-w-[1200px] px-4 py-16 sm:px-8 sm:py-24">
      <Reveal>
        <div className="mb-10 grid gap-6 lg:grid-cols-[180px_1fr]">
          <div className="flex items-baseline gap-3 lg:block">
            <div className="font-mono text-sm text-muted">{n}</div>
            <div className="mt-1 text-sm font-medium tracking-wide text-ink-2 uppercase">{kicker}</div>
          </div>
          <div>
            <h2 className="max-w-[22ch] text-3xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-[44px]">
              {title}
            </h2>
            {lede && <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-pretty text-ink-2">{lede}</p>}
          </div>
        </div>
      </Reveal>
      <div className="space-y-6">{children}</div>
    </section>
  )
}

// ---------------------------------------------------------------------------------
// Achado (a conclusão em uma frase)
// ---------------------------------------------------------------------------------
export function Finding({ children }: { children: ReactNode }) {
  return (
    <Reveal>
      <div className="relative overflow-hidden rounded-2xl border border-hairline bg-accent-wash px-6 py-5 sm:px-8">
        <div className="absolute top-0 bottom-0 left-0 w-1 bg-accent" />
        <div className="mb-1 text-xs font-semibold tracking-[0.14em] text-ink-2 uppercase">Achado</div>
        <p className="max-w-[80ch] text-[17px] leading-relaxed text-pretty text-ink [&_b]:font-semibold">{children}</p>
      </div>
    </Reveal>
  )
}

// ---------------------------------------------------------------------------------
// Cartão de gráfico com visão em tabela (acessibilidade)
// ---------------------------------------------------------------------------------
export interface Column<T> {
  key: string
  label: string
  render: (row: T) => ReactNode
  align?: 'left' | 'right'
}

export function ChartCard<T>({
  title,
  subtitle,
  children,
  rows,
  columns,
  legend,
  className = '',
}: {
  title: string
  subtitle?: string
  children: ReactNode
  rows?: T[]
  columns?: Column<T>[]
  legend?: ReactNode
  className?: string
}) {
  const [table, setTable] = useState(false)
  return (
    <Reveal className={className}>
      <figure className="card flex h-full flex-col p-5 sm:p-6">
        <figcaption className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[17px] leading-snug font-semibold text-ink">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>
          {rows && columns && (
            <button
              onClick={() => setTable((v) => !v)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1.5 text-xs font-medium text-ink-2 transition hover:bg-surface-2"
              aria-pressed={table}
            >
              {table ? <X size={14} /> : <Table2 size={14} />}
              {table ? 'Gráfico' : 'Dados'}
            </button>
          )}
        </figcaption>
        {legend && !table && <div className="mb-3">{legend}</div>}
        <div className="min-h-0 flex-1">
          {table && rows && columns ? <DataTable rows={rows} columns={columns} /> : children}
        </div>
      </figure>
    </Reveal>
  )
}

export function DataTable<T>({ rows, columns, max = 400 }: { rows: T[]; columns: Column<T>[]; max?: number }) {
  return (
    <div className="overflow-auto rounded-lg border border-hairline" style={{ maxHeight: max }}>
      <table className="tnum w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-surface-2">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-3 py-2 text-xs font-semibold whitespace-nowrap text-ink-2 ${c.align === 'right' ? 'text-right' : 'text-left'}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-hairline">
              {columns.map((c) => (
                <td key={c.key} className={`px-3 py-2 whitespace-nowrap ${c.align === 'right' ? 'text-right' : ''}`}>
                  {c.render(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------------
// Legenda (marca espelha a forma do gráfico)
// ---------------------------------------------------------------------------------
export function Legend({ items }: { items: { label: string; color: string; shape?: 'line' | 'rect' }[] }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-2 text-[13px] text-ink-2">
          {it.shape === 'line' ? (
            <span className="h-[2px] w-4 rounded-full" style={{ background: it.color }} />
          ) : (
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: it.color }} />
          )}
          {it.label}
        </span>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------------
// Tooltip (valor primeiro, rótulo depois; chave em traço)
// ---------------------------------------------------------------------------------
export function TooltipBox({ title, rows }: { title: string; rows: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="card min-w-[170px] px-3.5 py-2.5 text-sm !shadow-lg">
      <div className="mb-1.5 text-xs font-medium text-muted">{title}</div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 py-0.5">
          {r.color && <span className="h-[2px] w-3 rounded-full" style={{ background: r.color }} />}
          <span className="tnum font-semibold text-ink">{r.value}</span>
          <span className="text-ink-2">{r.label}</span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------------
// Controles de filtro
// ---------------------------------------------------------------------------------
export function MultiSelect({
  label,
  options,
  value,
  onChange,
  allLabel,
}: {
  label: string
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
  allLabel: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [])
  const text = value.length === 0 ? allLabel : value.length === 1 ? value[0] : `${value.length} selecionadas`
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm transition ${
          value.length ? 'border-series bg-series-wash text-ink' : 'border-hairline bg-surface text-ink-2 hover:bg-surface-2'
        }`}
        aria-expanded={open}
      >
        <span className="text-muted">{label}</span>
        <span className="max-w-[160px] truncate font-medium">{text}</span>
        <ChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="card absolute top-11 left-0 z-50 w-64 p-1.5 !shadow-xl">
          <button
            onClick={() => onChange([])}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-surface-2"
          >
            <span className="w-4">{value.length === 0 && <Check size={16} strokeWidth={3} />}</span>
            {allLabel}
          </button>
          <div className="my-1 h-px bg-hairline" />
          {options.map((o) => {
            const on = value.includes(o)
            return (
              <button
                key={o}
                onClick={() => onChange(on ? value.filter((v) => v !== o) : [...value, o])}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-surface-2"
              >
                <span className="w-4">{on && <Check size={16} strokeWidth={3} />}</span>
                {o}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex h-9 items-center rounded-full border border-hairline bg-surface p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`h-full rounded-full px-3 text-sm transition ${
            value === o.value ? 'bg-ink font-medium text-surface' : 'text-ink-2 hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
