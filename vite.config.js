import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig({
  base: '/web-jq/',
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/jq-web/jq.wasm',
          dest: '.'
        }
      ]
    })
  ],
  optimizeDeps: {
    exclude: ['jq-web']
  }
})
