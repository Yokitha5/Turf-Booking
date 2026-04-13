import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    hmr: {
      clientPort: 5173,
      overlay: true
    },
    proxy: {
      '/api/auth': {
        target: 'http://localhost:10011',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/auth/, '/auth'),
      },
      '/api/venues': {
        target: 'http://localhost:10013',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/venues/, '/venues'),
      },
      '/api/teams': {
        target: 'http://localhost:10013',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/teams/, '/teams'),
      },
      '/api/bookings': {
        target: 'http://localhost:10014',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bookings/, '/bookings'),
      },
      '/api/payments': {
        target: 'http://localhost:10015',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/payments/, '/payments'),
      },
      '/api/notifications': {
        target: 'http://localhost:10017',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/notifications/, '/notifications'),
      },
      '/api/reviews': {
        target: 'http://localhost:10017',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/reviews/, '/reviews'),
      },
      '/api/disputes': {
        target: 'http://localhost:10016',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/disputes/, '/disputes'),
      },
    },
  },
  preview: {
    port: 4173,
    strictPort: false
  }
})
