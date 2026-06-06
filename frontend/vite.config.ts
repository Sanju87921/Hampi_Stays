import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'images/hero.png'],
      manifest: {
        name: 'HampiStays | Luxury Eco-Resorts',
        short_name: 'HampiStays',
        description: 'Discover and book luxury eco-resorts in Hampi, India. Local experts, premium stays.',
        theme_color: '#0A1128',
        background_color: '#FDFBF7',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
  },
  build: {
    chunkSizeWarningLimit: 600,
    sourcemap: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
