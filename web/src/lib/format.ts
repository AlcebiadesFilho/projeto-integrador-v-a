const nf = (dec: number) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })

export const num = (v: number, dec = 0) => (Number.isFinite(v) ? nf(dec).format(v) : '—')
export const pct = (v: number, dec = 1) => `${num(v, dec)}%`
export const hrs = (v: number, dec = 0) => `${num(v, dec)} h`
export const mins = (v: number) => `${num(v)} min`

export const compact = (v: number) =>
  new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(v)

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** "2021-03" -> "mar/21" */
export const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-')
  return `${MESES[Number(m) - 1]}/${y.slice(2)}`
}

/** "2021-03" -> "março de 2021" style curto: "mar 2021" */
export const monthLong = (ym: string) => {
  const [y, m] = ym.split('-')
  return `${MESES[Number(m) - 1]} ${y}`
}
