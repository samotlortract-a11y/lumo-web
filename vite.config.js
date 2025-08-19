import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ⚠️ ВАЖНО: замени `YOUR_GH_LOGIN` на свой логин ИЛИ оставь пустую строку, если деплоишь на корневой домен.
const repo = 'lumo-web'
const ghLogin = 'YOUR_GH_LOGIN' // <-- замени

export default defineConfig({
  plugins: [react()],
  base: ghLogin ? `/${repo}/` : '/'
})
