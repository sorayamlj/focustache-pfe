import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Remove any explicit PostCSS configuration here
  // Let Vite auto-detect postcss.config.js
})