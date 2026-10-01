import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// GitHub Pages serves project sites from /<repo-name>/, so the base path must
// match the repository name. Set VITE_BASE_PATH in the deploy workflow (or a
// local .env) rather than hardcoding a repo name here.
const base = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
