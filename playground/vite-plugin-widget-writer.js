import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function widgetWriterPlugin() {
  const widgetDir = path.resolve(__dirname, 'src/generated');
  const widgetPath = path.join(widgetDir, 'Widget.jsx');
  const widgetPreviewPath = path.join(widgetDir, 'WidgetPreview.jsx');

  if (!fs.existsSync(widgetDir)) {
    fs.mkdirSync(widgetDir, { recursive: true });
  }

  return {
    name: 'widget-writer',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if ((req.url === '/__write_widget' || req.url === '/__write_widget_preview') && req.method === 'POST') {
          const targetPath = req.url === '/__write_widget_preview' ? widgetPreviewPath : widgetPath;
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              fs.writeFileSync(targetPath, body, 'utf-8');
              res.writeHead(200, { 'Content-Type': 'text/plain' });
              res.end('OK');
            } catch (error) {
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end('Error writing file: ' + error.message);
            }
          });
        } else {
          next();
        }
      });
    }
  };
}
