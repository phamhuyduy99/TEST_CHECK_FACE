import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import checker from 'vite-plugin-checker'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    checker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0',
      },
    }),
  ],
  server: {
    port: 5173,
    open: true,
    hmr: true
  }
})
