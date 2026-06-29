import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://pilgrimage-admin.bppnjg.workers.dev',
        changeOrigin: true,
        secure: true,
      },
      '/brewiarz-proxy': {
        target: 'https://brewiarz.pl',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/brewiarz-proxy/, ''),
      },
      '/niedziela-proxy': {
        target: 'https://niezbednik.niedziela.pl',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/niedziela-proxy/, ''),
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/api\/pilgrimages\/\d+\/bootstrap/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'api-bootstrap', expiration: { maxAgeSeconds: 300 } },
          },
          {
            urlPattern: /\/api\/news/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'api-news', expiration: { maxAgeSeconds: 120 } },
          },
          {
            urlPattern: /\/api\/quartermaster-comments/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'api-quartermaster', expiration: { maxAgeSeconds: 120 } },
          },
          {
            urlPattern: /\/api\/pilgrimages\/\d+\/days\/\d+$/,
            handler: 'CacheFirst',
            options: { cacheName: 'api-days', expiration: { maxAgeSeconds: 86400 } },
          },
          {
            urlPattern: /https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-webfonts', expiration: { maxAgeSeconds: 31536000 } },
          },
        ],
      },
    }),
  ],
});
