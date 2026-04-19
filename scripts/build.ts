import { build } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const r = (path: string) => resolve(__dirname, '..', path)

const copyDir = (src: string, dest: string) => {
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true })
  const entries = readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = resolve(src, entry.name)
    const destPath = resolve(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      copyFileSync(srcPath, destPath)
    }
  }
}

const copyFile = (src: string, dest: string) => {
  const destDir = resolve(dest, '..')
  if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true })
  copyFileSync(src, dest)
}

async function buildAll() {
  console.log('Building popup and options...')
  
  await build({
    configFile: r('vite.config.ts')
  })

  console.log('Building content script...')
  
  await build({
    configFile: r('vite.content.config.ts')
  })

  console.log('Copying extension files...')
  
  copyDir(r('public/icons'), r('dist/icons'))
  copyDir(r('public/modules'), r('dist/modules'))
  copyFile(r('src/manifest.json'), r('dist/manifest.json'))
  copyFile(r('src/background/service-worker.js'), r('dist/service-worker.js'))

  console.log('Build complete!')
}

buildAll().catch(console.error)