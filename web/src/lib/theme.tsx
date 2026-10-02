import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

// Paleta validada (CVD) — mesmos tons do relatório. Dark = mesmos matizes re-escalonados
// para a superfície escura, não uma inversão automática.
export interface Palette {
  surface: string
  ink: string
  ink2: string
  muted: string
  grid: string
  axis: string
  series: string // azul — a série principal
  accent: string // laranja — reservado ao problema
  context: string // cinza — o resto
  seriesWash: string
}

const LIGHT: Palette = {
  surface: '#fcfcfb',
  ink: '#0b0b0b',
  ink2: '#52514e',
  muted: '#898781',
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  series: '#2a78d6',
  accent: '#eb6834',
  context: '#bdbbb3',
  seriesWash: 'rgba(42,120,214,0.10)',
}

const DARK: Palette = {
  surface: '#1a1a19',
  ink: '#ffffff',
  ink2: '#c3c2b7',
  muted: '#898781',
  grid: '#2c2c2a',
  axis: '#383835',
  series: '#3987e5',
  accent: '#d95926',
  context: '#4d4c48',
  seriesWash: 'rgba(57,135,229,0.14)',
}

type Mode = 'light' | 'dark'
const Ctx = createContext<{ mode: Mode; palette: Palette; toggle: () => void }>({
  mode: 'light',
  palette: LIGHT,
  toggle: () => {},
})

function initialMode(): Mode {
  try {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* storage indisponível */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(initialMode)
  useEffect(() => {
    document.documentElement.dataset.theme = mode
    try {
      localStorage.setItem('theme', mode)
    } catch {
      /* ok */
    }
  }, [mode])
  return (
    <Ctx.Provider
      value={{ mode, palette: mode === 'dark' ? DARK : LIGHT, toggle: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')) }}
    >
      {children}
    </Ctx.Provider>
  )
}

export const useTheme = () => useContext(Ctx)
