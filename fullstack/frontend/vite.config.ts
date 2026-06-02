import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Use lottie-web light build to avoid eval() warning
      'lottie-web': 'lottie-web/build/player/lottie_light.min.js',
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
  },
})
