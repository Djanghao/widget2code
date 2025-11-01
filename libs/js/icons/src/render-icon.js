#!/usr/bin/env node
/**
 * Render a single React icon component to SVG
 * Usage: node render-icon.js <library> <component_name>
 * Example: node render-icon.js lu LuSearch
 *          node render-icon.js sf Icon00Circle
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const library = process.argv[2];
const componentName = process.argv[3];

if (!library || !componentName) {
  console.error('Usage: node render-icon.js <library> <component_name>');
  process.exit(1);
}

async function renderIcon() {
  try {
    if (library === 'sf') {
      const componentPath = join(__dirname, '..', 'custom', 'sf-symbols', 'src', 'components', `${componentName}.jsx`);

      if (!fs.existsSync(componentPath)) {
        throw new Error(`SF symbol ${componentName} not found`);
      }

      const content = fs.readFileSync(componentPath, 'utf8');

      const svgMatch = content.match(/<svg[\s\S]*?<\/svg>/);

      if (!svgMatch) {
        throw new Error(`No SVG found in ${componentName}`);
      }

      let svg = svgMatch[0];

      svg = svg.replace(/width="100%"/g, 'width="24"');
      svg = svg.replace(/height="100%"/g, 'height="24"');
      svg = svg.replace(/xmlnsXlink/g, 'xmlns:xlink');

      console.log(svg);

    } else {
      // React-icons
      const icons = await import(`react-icons/${library}`);
      const IconComponent = icons[componentName];

      if (!IconComponent || typeof IconComponent !== 'function') {
        throw new Error(`Icon component ${componentName} not found in ${library}`);
      }

      const svg = renderToStaticMarkup(React.createElement(IconComponent, { size: 24 }));
      console.log(svg);
    }

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

renderIcon();
