import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repo = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : null
const isUserSite = repo ? repo.endsWith('.github.io') : false
const isVercel = !!process.env.VERCEL

export default defineConfig({
  base: isVercel ? '/' : (isUserSite ? '/' : (repo ? `/${repo}/` : '/')),
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
  }
})
