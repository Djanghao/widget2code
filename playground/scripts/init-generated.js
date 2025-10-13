import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const generatedDir = join(__dirname, '../src/generated');

if (!existsSync(generatedDir)) {
  mkdirSync(generatedDir, { recursive: true });
}

const widgetPath = join(generatedDir, 'Widget.jsx');
const previewPath = join(generatedDir, 'WidgetPreview.jsx');

if (!existsSync(widgetPath)) {
  writeFileSync(widgetPath, `export default function Widget() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <p>No widget generated yet. Enter a prompt to generate your first widget.</p>
    </div>
  );
}
`);
  console.log('✓ Created placeholder Widget.jsx');
}

if (!existsSync(previewPath)) {
  writeFileSync(previewPath, `export default function WidgetPreview() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <p>No widget preview available yet.</p>
    </div>
  );
}
`);
  console.log('✓ Created placeholder WidgetPreview.jsx');
}
