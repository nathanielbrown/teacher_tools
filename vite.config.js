import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.png', 'assets/classroom_bg.png'],
      manifest: {
        name: 'Teacher Tools',
        short_name: 'ClassRex Tools',
        description: 'Interactive classroom tools for teachers and students.',
        theme_color: '#f8fafc',
        background_color: '#f8fafc',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.png',
            sizes: '256x256',
            type: 'image/png'
          },
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 230]
              }
            }
          }
        ]
      }
    })
  ],
  define: {
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(process.env.npm_package_version)
  }
})
