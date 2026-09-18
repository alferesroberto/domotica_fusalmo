import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    proxy: {
      '/sinric-api': {
        target: 'https://api.sinric.pro/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sinric-api/, ''),
      },
    },
  },
})
