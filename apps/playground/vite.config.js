import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import yaml from 'yaml'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const configFile = process.env.CONFIG_FILE || 'config.yaml'
const configPath = path.resolve(__dirname, '..', configFile)
const configContent = fs.readFileSync(configPath, 'utf8')
const config = yaml.parse(configContent)

const backendPort = config.server.backend_port
const frontendPort = config.server.frontend_port

export default defineConfig(({ mode }) => {

  return {
    plugins: [react()],
    resolve: {
      alias: {
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
      host: config.server.host,
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
