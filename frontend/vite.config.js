import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
    },
    // The following is needed to make vite hot reload work in docker
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
    },
  }
})
