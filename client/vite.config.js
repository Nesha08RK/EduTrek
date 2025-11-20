import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
   server: {
    watch: {
      usePolling: true, // ensures file changes are always picked up
    },
  },
  build: {
    sourcemap: true, // useful for debugging
  },
  cacheDir: "node_modules/.vite", // reset cache on rebuild
})
