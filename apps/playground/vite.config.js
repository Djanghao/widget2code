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
        '@widget-factory/primitives/components': path.resolve(__dirname, '../../libs/js/primitives/src/component-registry.js'),
        '@widget-factory/primitives': path.resolve(__dirname, '../../libs/js/primitives/src'),
        '@widget-factory/compiler': path.resolve(__dirname, '../../libs/js/compiler/src'),
        '@widget-factory/icons/sf-symbols': path.resolve(__dirname, '../../libs/js/icons/custom/sf-symbols/src'),
        '@widget-factory/icons': path.resolve(__dirname, '../../libs/js/icons'),
        '@widget-factory/dsl': path.resolve(__dirname, '../../libs/js/dsl/src'),
        '@widget-factory/renderer': path.resolve(__dirname, '../../libs/js/renderer/src'),
        '@widget-factory/exporter': path.resolve(__dirname, '../../libs/js/exporter/src'),
        '@widget-factory/resizer': path.resolve(__dirname, '../../libs/js/resizer/src'),
        '@widget-factory/validator': path.resolve(__dirname, '../../libs/js/validator/src'),
        '@widget-factory/dynamic': path.resolve(__dirname, '../../libs/js/dynamic/src'),
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
