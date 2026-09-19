import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The Express API (server/) runs on its own port; the browser only ever talks to /api
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
