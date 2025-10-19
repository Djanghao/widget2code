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
        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathname = url.pathname;

        if (pathname === '/__write_widget' && req.method === 'POST') {
          const fileName = url.searchParams.get('file');
          const targetPath = fileName ? path.join(widgetDir, fileName) : widgetPath;

          if (fileName && !fileName.match(/^Widget-[a-z0-9-]+\.jsx$/)) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Invalid file name');
            return;
          }

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
        } else if (pathname === '/__write_widget_preview' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              fs.writeFileSync(widgetPreviewPath, body, 'utf-8');
              res.writeHead(200, { 'Content-Type': 'text/plain' });
              res.end('OK');
            } catch (error) {
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end('Error writing file: ' + error.message);
            }
          });
        } else if (pathname === '/__cleanup_widgets' && req.method === 'POST') {
          try {
            const files = fs.readdirSync(widgetDir);
            const widgetFiles = files.filter(f => f.match(/^Widget-[a-z0-9-]+\.jsx$/));

            for (const file of widgetFiles) {
              const filePath = path.join(widgetDir, file);
              fs.unlinkSync(filePath);
            }

            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(`Cleaned up ${widgetFiles.length} widget files`);
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error cleaning up files: ' + error.message);
          }
        } else {
          next();
        }
      });
    }
  };
}
