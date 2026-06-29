import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: './' 讓打包後資源走相對路徑，之後 Capacitor 包 APK 直接可用
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})

