import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// RIDER FRONTEND - Port 5000
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    },
    open: false,
  }
})