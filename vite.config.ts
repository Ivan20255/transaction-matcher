import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'TransactionMatcher',
        short_name: 'TxnMatcher',
        description: 'Reconcile bank transactions with Jobber receipts',
        theme_color: '#1f2937',
        background_color: '#1f2937',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    host: true
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'recharts': ['recharts'],
          'vendor': ['react', 'react-dom', 'date-fns', 'papaparse']
        }
      }
    }
  }
})
