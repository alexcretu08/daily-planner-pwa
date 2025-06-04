import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Tell Vite that the app will be served from /daily-planner-pwa/
  base: '/daily-planner-pwa/',

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Daily Planner PWA',
        short_name: 'Planner',
        description: 'Interactive daily schedule & habit tracker',
        // On GitHub Pages, the “root” of your app is /daily-planner-pwa/
        start_url: '/daily-planner-pwa/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#3f51b5',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // This ensures VitePWA caches all your built files under /daily-planner-pwa/
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
})
