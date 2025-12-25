/**
 * @file batch-compile-html.js
 * @description Batch compile all preset examples to HTML
 */

import { compileWidgetDSLToHTML } from '../../libs/js/compiler/src/index.js';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';

// Helper function to load JSON files
function loadJSON(filepath) {
  try {
    const content = readFileSync(join('./apps/playground/src/examples', filepath), 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load JSON file ${filepath}:`, error.message);
    return null;
  }
}

// Load all examples directly
const examples = {
  weatherSmallLight: { name: "Weather S-Light", spec: loadJSON('weather-small-light.json') },
  weatherMediumDark: { name: "Weather M-Dark", spec: loadJSON('weather-medium-dark.json') },
  calendarSmallLight: { name: "Calendar S-Light", spec: loadJSON('calendar-small-light.json') },
  calendarSmallDark: { name: "Calendar S-Dark", spec: loadJSON('calendar-small-dark.json') },
  notesSmallLight: { name: "Notes S-Light", spec: loadJSON('notes-small-light.json') },
  notesSmallDark: { name: "Notes S-Dark", spec: loadJSON('notes-small-dark.json') },
  stockMediumDark: { name: "Stock M-Dark", spec: loadJSON('stock-medium-dark.json') },
  stockMediumDarkRed: { name: "Stock M-Dark-Red", spec: loadJSON('stock-medium-dark-red.json') },
  remindersLargeLight: { name: "Reminders L-Light", spec: loadJSON('reminders-large-light.json') },
  photoMediumLight: { name: "Photo M-Light", spec: loadJSON('photo-medium-light.json') },
  mapMediumDark: { name: "Map M-Dark", spec: loadJSON('map-medium-dark.json') },
  lucideWeatherSmall: { name: "Lucide Weather", spec: loadJSON('lucide-weather-small.json') },
  lucideTasksMedium: { name: "Lucide Tasks", spec: loadJSON('lucide-tasks-medium.json') },
  lucideMusicSmall: { name: "Lucide Music", spec: loadJSON('lucide-music-small.json') },
  batterySmallDark: { name: "Battery S-Dark", spec: loadJSON('battery-small-dark.json') },
  fitnessSmallLight: { name: "Activity S-Light", spec: loadJSON('fitness-small-light.json') },
  musicMediumLight: { name: "Music M-Light", spec: loadJSON('music-medium-light.json') },
  newsMediumDark: { name: "News M-Dark", spec: loadJSON('news-medium-dark.json') },
  calendarMediumLight: { name: "Calendar M-Light", spec: loadJSON('calendar-medium-light.json') },
  photosSmallLight: { name: "Photos S-Light", spec: loadJSON('photos-small-light.json') },
  healthSmallDark: { name: "Health S-Dark", spec: loadJSON('health-small-dark.json') },
  batteryMediumLight: { name: "Battery M-Light", spec: loadJSON('battery-medium-light.json') },
  stocksMediumLight: { name: "Stocks M-Light", spec: loadJSON('stocks-medium-light.json') },
  weatherLargeLight: { name: "Weather L-Light", spec: loadJSON('weather-large-light.json') },
  stockLargeDark: { name: "Stock L-Dark", spec: loadJSON('stock-large-dark.json') },
  batteriesFigma: { name: "Batteries (Figma)", spec: loadJSON('batteries-figma.json') },
  notesLargeFigma: { name: "Notes L (Figma)", spec: loadJSON('notes-large-figma.json') },
  noteSmallFigma: { name: "Note S (Figma)", spec: loadJSON('note-small-figma.json') },
  ringtoneSmallFigma: { name: "Ringtone S (Figma)", spec: loadJSON('ringtone-small-figma.json') },
  weatherSmallFigma: { name: "Weather S (Figma)", spec: loadJSON('weather-small-figma.json') },
  weatherMediumFigma: { name: "Weather M (Figma)", spec: loadJSON('weather-medium-figma.json') },
  batteriesLightMedium: {
    name: "Batteries - Light - Medium",
    spec: loadJSON('batteries-light-medium.json'),
  },

  // Icon Tests
  iconsVariantsShowcase: {
    name: "🎨 Icon Variants (Pi/Ri)",
    spec: loadJSON('icons-variants-showcase.json'),
  },
  iconsUltimateTest: {
    name: "✨ Ultimate Icon Test",
    spec: loadJSON('icons-ultimate-test.json'),
  },

  // Component Showcases
  buttonShowcase: {
    name: "🔘 Button Showcase",
    spec: loadJSON('button-showcase.json'),
  },
  progressringShowcase: {
    name: "🔄 ProgressRing Showcase",
    spec: loadJSON('progressring-showcase.json'),
  },
  fitnessActivityRings: {
    name: "💪 Fitness Activity Rings",
    spec: loadJSON('fitness-activity-rings.json'),
  },
  circularContainersShowcase: {
    name: "⭕ Circular Containers",
    spec: loadJSON('circular-containers-showcase.json'),
  },
};

// Create output directory
const outputDir = '../../html-output';
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

console.log('🚀 Starting batch HTML compilation...\n');

const results = {
  successful: [],
  failed: [],
  skipped: []
};

let totalExamples = 0;
let successfulCount = 0;
let failedCount = 0;

// Process each example
for (const [key, example] of Object.entries(examples)) {
  totalExamples++;

  try {
    console.log(`📝 Compiling: ${example.name}`);

    // Check if spec exists
    if (!example.spec) {
      console.log(`⚠️  Skipping ${example.name} - no spec found`);
      results.skipped.push({ key, name: example.name, reason: 'No spec found' });
      continue;
    }

    // Compile to HTML
    const htmlOutput = compileWidgetDSLToHTML(example.spec);

    // Create safe filename
    const filename = `${key}.html`;
    const filepath = join(outputDir, filename);

    // Write file
    writeFileSync(filepath, htmlOutput);

    console.log(`✅ Success: ${filename}`);
    results.successful.push({ key, name: example.name, filename });
    successfulCount++;

  } catch (error) {
    console.error(`❌ Failed: ${example.name}`);
    console.error(`   Error: ${error.message}`);
    results.failed.push({ key, name: example.name, error: error.message });
    failedCount++;
  }

  console.log(''); // Empty line for readability
}

// Generate summary
console.log('='.repeat(60));
console.log('📊 BATCH COMPILATION SUMMARY');
console.log('='.repeat(60));
console.log(`Total examples: ${totalExamples}`);
console.log(`✅ Successful: ${successfulCount}`);
console.log(`❌ Failed: ${failedCount}`);
console.log(`⚠️  Skipped: ${results.skipped.length}`);
console.log('');

// Show successful examples
if (results.successful.length > 0) {
  console.log('✅ SUCCESSFUL COMPILATIONS:');
  results.successful.forEach(result => {
    console.log(`   • ${result.name} → ${result.filename}`);
  });
  console.log('');
}

// Show failed examples
if (results.failed.length > 0) {
  console.log('❌ FAILED COMPILATIONS:');
  results.failed.forEach(result => {
    console.log(`   • ${result.name} → ${result.error}`);
  });
  console.log('');
}

// Show skipped examples
if (results.skipped.length > 0) {
  console.log('⚠️  SKIPPED EXAMPLES:');
  results.skipped.forEach(result => {
    console.log(`   • ${result.name} → ${result.reason}`);
  });
  console.log('');
}

// Generate index.html for browsing
generateIndexPage(results, outputDir);

console.log(`📁 All HTML files saved to: ${outputDir}/`);
console.log(`🌐 Open ${outputDir}/index.html to browse all compiled examples!`);

function generateIndexPage(results, outputDir) {
  const indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Widget Factory HTML Examples</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
            color: white;
        }

        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }

        .stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-bottom: 40px;
            flex-wrap: wrap;
        }

        .stat-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            color: white;
            min-width: 150px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .stat-label {
            font-size: 0.9rem;
            opacity: 0.8;
        }

        .examples-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }

        .example-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border: 1px solid rgba(0,0,0,0.05);
        }

        .example-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        }

        .example-preview {
            height: 200px;
            background: #f8f9fa;
            display: flex;
            align-items: center;
            justify-content: center;
            border-bottom: 1px solid #e9ecef;
            position: relative;
            overflow: hidden;
        }

        .example-preview iframe {
            width: 100%;
            height: 100%;
            border: none;
            transform: scale(0.5);
            transform-origin: top left;
            width: 200%;
            height: 200%;
        }

        .example-info {
            padding: 15px;
        }

        .example-name {
            font-size: 1.1rem;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .example-status {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 500;
        }

        .status-success {
            background: #d4edda;
            color: #155724;
        }

        .status-failed {
            background: #f8d7da;
            color: #721c24;
        }

        .status-skipped {
            background: #fff3cd;
            color: #856404;
        }

        .example-actions {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }

        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            flex: 1;
            text-align: center;
        }

        .btn-primary {
            background: #007bff;
            color: white;
        }

        .btn-primary:hover {
            background: #0056b3;
        }

        .btn-secondary {
            background: #6c757d;
            color: white;
        }

        .btn-secondary:hover {
            background: #545b62;
        }

        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .error-message {
            font-size: 0.85rem;
            color: #721c24;
            margin-top: 5px;
            padding: 5px;
            background: #f8d7da;
            border-radius: 4px;
        }

        .filters {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            flex-wrap: wrap;
            justify-content: center;
        }

        .filter-btn {
            padding: 8px 16px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.2s ease;
            backdrop-filter: blur(10px);
        }

        .filter-btn:hover,
        .filter-btn.active {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.5);
        }

        .hidden {
            display: none !important;
        }

        @media (max-width: 768px) {
            .examples-grid {
                grid-template-columns: 1fr;
            }

            .header h1 {
                font-size: 2rem;
            }

            .stats {
                gap: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏭 Widget Factory HTML Examples</h1>
            <p>Interactive showcase of compiled HTML widgets</p>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${successfulCount}</div>
                <div class="stat-label">Successful</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${failedCount}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${results.skipped.length}</div>
                <div class="stat-label">Skipped</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${totalExamples}</div>
                <div class="stat-label">Total</div>
            </div>
        </div>

        <div class="filters">
            <button class="filter-btn active" onclick="filterExamples('all')">All Examples</button>
            <button class="filter-btn" onclick="filterExamples('successful')">✅ Successful</button>
            <button class="filter-btn" onclick="filterExamples('failed')">❌ Failed</button>
            <button class="filter-btn" onclick="filterExamples('skipped')">⚠️ Skipped</button>
        </div>

        <div class="examples-grid">
            ${results.successful.map(result => `
                <div class="example-card" data-status="successful">
                    <div class="example-preview">
                        <iframe src="${result.filename}" loading="lazy"></iframe>
                    </div>
                    <div class="example-info">
                        <div class="example-name">
                            ${result.name}
                            <span class="example-status status-success">✅ Ready</span>
                        </div>
                        <div class="example-actions">
                            <a href="${result.filename}" class="btn btn-primary" target="_blank">Open Full</a>
                            <a href="${result.filename}" class="btn btn-secondary" download>Download</a>
                        </div>
                    </div>
                </div>
            `).join('')}

            ${results.failed.map(result => `
                <div class="example-card" data-status="failed">
                    <div class="example-preview">
                        <div style="text-align: center; color: #721c24;">
                            <div style="font-size: 3rem;">❌</div>
                            <div>Compilation Failed</div>
                        </div>
                    </div>
                    <div class="example-info">
                        <div class="example-name">
                            ${result.name}
                            <span class="example-status status-failed">❌ Failed</span>
                        </div>
                        <div class="error-message">${result.error}</div>
                    </div>
                </div>
            `).join('')}

            ${results.skipped.map(result => `
                <div class="example-card" data-status="skipped">
                    <div class="example-preview">
                        <div style="text-align: center; color: #856404;">
                            <div style="font-size: 3rem;">⚠️</div>
                            <div>Skipped</div>
                        </div>
                    </div>
                    <div class="example-info">
                        <div class="example-name">
                            ${result.name}
                            <span class="example-status status-skipped">⚠️ Skipped</span>
                        </div>
                        <div class="error-message">${result.reason}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>

    <script>
        function filterExamples(status) {
            // Update filter buttons
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');

            // Show/hide example cards
            document.querySelectorAll('.example-card').forEach(card => {
                if (status === 'all' || card.dataset.status === status) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        }
    </script>
</body>
</html>`;

  writeFileSync(join(outputDir, 'index.html'), indexHTML);
}