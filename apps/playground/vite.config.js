import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const backendPort = process.env.BACKEND_PORT || '8010'
const frontendPort = process.env.FRONTEND_PORT || '3060'
const host = process.env.HOST || '0.0.0.0'

export default defineConfig(({ mode }) => {

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@widget-factory/primitives/components': path.resolve(__dirname, '../../libs/packages/primitives/src/component-registry.js'),
        '@widget-factory/primitives': path.resolve(__dirname, '../../libs/packages/primitives/src'),
        '@widget-factory/compiler': path.resolve(__dirname, '../../libs/packages/compiler/src'),
        '@widget-factory/icons': path.resolve(__dirname, '../../libs/packages/icons'),
        '@widget-factory/dsl': path.resolve(__dirname, '../../libs/packages/dsl/src'),
        '@widget-factory/renderer': path.resolve(__dirname, '../../libs/packages/renderer/src'),
        '@widget-factory/exporter': path.resolve(__dirname, '../../libs/packages/exporter/src'),
        '@widget-factory/resizer': path.resolve(__dirname, '../../libs/packages/resizer/src'),
        '@widget-factory/dynamic': path.resolve(__dirname, '../../libs/packages/dynamic/src'),
      }
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          headless: path.resolve(__dirname, 'headless.html')
        }
      }
    },
    server: {
      host: host,
      port: parseInt(frontendPort),
      proxy: {
        '^/api/(?!.*\\.md).*': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true
        }
      }
    }
  }
})
