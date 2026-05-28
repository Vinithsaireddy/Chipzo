import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { boneyardPlugin } from 'boneyard-js/vite'


export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    boneyardPlugin(),
  ],
  server: {
    host: true,
    allowedHosts: [
      '0519-205-254-184-13.ngrok-free.app'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})


