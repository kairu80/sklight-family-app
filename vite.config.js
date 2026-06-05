import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // base is the GitHub repo name — update if you rename the repo
  base: '/sklight-family-app/',
  server: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
})
