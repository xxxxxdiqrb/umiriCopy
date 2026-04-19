import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const r = (path: string) => resolve(__dirname, path)

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': r('./src') }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  },
  build: {
    emptyOutDir: false,
    outDir: r('./dist'),
    lib: {
      entry: r('./src/content_scripts/main.ts'),
      name: 'TweetCopy',
      formats: ['iife'],
      fileName: () => 'content_scripts/tweetCopy.js'
    },
    rollupOptions: {
      external: [],
      output: {
        assetFileNames: 'content_scripts/tweetCopy.[ext]'
      }
    }
  }
})