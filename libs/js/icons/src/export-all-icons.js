import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import path from 'path';

const iconSetDirs = [
  'ai', 'bi', 'bs', 'cg', 'ci', 'di', 'fa', 'fa6', 'fc', 'fi', 'gi', 'go', 'gr',
  'hi', 'hi2', 'im', 'io', 'io5', 'lia', 'lu', 'md', 'pi', 'ri', 'rx', 'si',
  'sl', 'tb', 'tfi', 'ti', 'vsc', 'wi'
];

async function exportAllIcons() {
  console.log('Starting full SVG export from react-icons...\n');
  console.log('=' .repeat(60));

  const baseOutputDir = path.join(process.cwd(), 'all-svg-exports');
  if (!fs.existsSync(baseOutputDir)) {
    fs.mkdirSync(baseOutputDir, { recursive: true });
  }

  const stats = {
    totalSets: 0,
    totalIcons: 0,
    successCount: 0,
    failCount: 0,
    setDetails: []
  };

  for (const setName of iconSetDirs) {
    try {
      console.log(`\nProcessing ${setName.toUpperCase()} icon set...`);

      const icons = await import(`react-icons/${setName}`);

      const iconNames = Object.keys(icons).filter(name => {
        return typeof icons[name] === 'function' &&
               name.charAt(0) === name.charAt(0).toUpperCase();
      });

      if (iconNames.length === 0) {
        console.log(`  No icons found in ${setName}, skipping...`);
        continue;
      }

      const setOutputDir = path.join(baseOutputDir, setName);
      if (!fs.existsSync(setOutputDir)) {
        fs.mkdirSync(setOutputDir, { recursive: true });
      }

      let setSuccessCount = 0;
      let setFailCount = 0;

      for (const iconName of iconNames) {
        try {
          const IconComponent = icons[iconName];
          const svg = renderToStaticMarkup(React.createElement(IconComponent, { size: 24 }));
          fs.writeFileSync(
            path.join(setOutputDir, `${iconName}.svg`),
            svg,
            'utf8'
          );
          setSuccessCount++;
          stats.successCount++;
        } catch (error) {
          setFailCount++;
          stats.failCount++;
          console.log(`  ✗ Failed to export ${iconName}: ${error.message}`);
        }
      }

      stats.totalSets++;
      stats.totalIcons += iconNames.length;
      stats.setDetails.push({
        name: setName,
        total: iconNames.length,
        success: setSuccessCount,
        failed: setFailCount
      });

      console.log(`  ✓ Exported ${setSuccessCount}/${iconNames.length} icons`);

    } catch (error) {
      console.log(`  ✗ Failed to load ${setName}: ${error.message}`);
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 EXPORT SUMMARY:');
  console.log('─' .repeat(60));
  console.log(`Total icon sets processed: ${stats.totalSets}`);
  console.log(`Total icons found: ${stats.totalIcons}`);
  console.log(`Successfully exported: ${stats.successCount}`);
  console.log(`Failed: ${stats.failCount}`);
  console.log(`Success rate: ${((stats.successCount / stats.totalIcons) * 100).toFixed(2)}%`);

  console.log('\n📁 Detailed breakdown by icon set:');
  console.log('─' .repeat(60));
  for (const detail of stats.setDetails) {
    console.log(`${detail.name.toUpperCase().padEnd(8)} : ${detail.success.toString().padStart(5)} icons exported`);
  }

  console.log('\n📂 Output directory: ' + baseOutputDir);
  console.log('─' .repeat(60));

  const manifestPath = path.join(baseOutputDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify({
    exportDate: new Date().toISOString(),
    stats: stats,
    iconSets: stats.setDetails
  }, null, 2));

  console.log(`\n✓ Manifest file created: ${manifestPath}`);
}

exportAllIcons().catch(error => {
  console.error('Error during export:', error);
  process.exit(1);
});
