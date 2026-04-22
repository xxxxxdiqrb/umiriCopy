import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

const r = (path: string) => resolve(__dirname, path)

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': r('src'),
      '@shared': r('src/shared'),
      '@platforms': r('src/platforms')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: r('popup/index.html'),
        options: r('options/index.html')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'popup') return 'popup/popup.js'
          if (chunkInfo.name === 'options') return 'options/options.js'
          return '[name].js'
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name ?? ''
          if (name.includes('popup')) return 'popup/popup.css'
          if (name.includes('options')) return 'options/options.css'
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  }
})