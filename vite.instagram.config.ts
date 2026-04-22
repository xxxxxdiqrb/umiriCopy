import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const r = (path: string) => resolve(__dirname, path)

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { 
      '@': r('./src'),
      '@shared': r('./src/shared'),
      '@platforms': r('./src/platforms')
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  },
  build: {
    emptyOutDir: false,
    outDir: r('./dist'),
    lib: {
      entry: r('./src/platforms/instagram/main.ts'),
      name: 'InstagramCopy',
      formats: ['iife'],
      fileName: () => 'content_scripts/instagramCopy.js'
    },
    rollupOptions: {
      external: [],
      output: {
        assetFileNames: 'content_scripts/instagramCopy.[ext]'
      }
    }
  }
})
