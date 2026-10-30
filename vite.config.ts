import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 使用相對路徑，讓網站可以部署在 GitHub Pages 的專案子路徑（/sonic-core/）或任何靜態主機
export default defineConfig({
  base: './',
  plugins: [react()],
})
