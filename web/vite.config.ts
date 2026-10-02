import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base relativa: o build funciona em qualquer subcaminho (GitHub Pages, Vercel, etc.)
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
