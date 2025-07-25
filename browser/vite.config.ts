import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: { global: true, process: true, Buffer: true },
      overrides: {
        path: 'path-browserify-win32',
      },
    }),
  ],
  server: {
    port: 3003,
    host: '0.0.0.0',
  },
})
