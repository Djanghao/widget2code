#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Extract individual widget DSLs from batch generation results
 */
function extractBatchWidgets() {
  const args = process.argv.slice(2);

  if (args.length < 2 || args.includes("-h") || args.includes("--help")) {
    console.log(`
Usage: node extract-batch-widgets.js <batch-run-directory> <output-directory>

Description:
  Extracts individual widget DSLs from batch generation results
  into a flat directory structure, ready for prepare-batch-structure.sh

Arguments:
  batch-run-directory  Directory containing batch-*.json files from DSL generator
  output-directory     Directory where individual widget JSONs will be extracted

Example:
  node extract-batch-widgets.js tools/dsl-generator/results/run-2025-11-09T04-18-45-ujqvbu ./flat-widgets

Input structure:
  run-2025-11-09T04-18-45-ujqvbu/
  ├── run-2025-11-09T04-18-45-ujqvbu-batch-001.json  (array of widget objects)
  ├── run-2025-11-09T04-18-45-ujqvbu-batch-002.json
  └── ...

Output structure:
  flat-widgets/
  ├── widget-0001.json  (individual resultDSL extracted)
  ├── widget-0002.json
  └── ...

After extraction, you can run:
  ./scripts/rendering/prepare-batch-structure.sh <output-directory> ./widgets
`);
    process.exit(args.includes("-h") || args.includes("--help") ? 0 : 1);
  }

  const batchDir = path.resolve(args[0]);
  const outputDir = path.resolve(args[1]);

  // Validate batch directory
  if (!fs.existsSync(batchDir)) {
    console.error(`Error: Batch directory '${batchDir}' does not exist`);
    process.exit(1);
  }

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    console.log(`Creating output directory: ${outputDir}`);
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("Extracting widget DSLs from batch files...");
  console.log(`Source: ${batchDir}`);
  console.log(`Output: ${outputDir}`);
  console.log("");

  // Find all batch JSON files
  const files = fs
    .readdirSync(batchDir)
    .filter(
      (file) => file.endsWith(".json") && file !== "generation-report.json"
    )
    .sort();

  if (files.length === 0) {
    console.error(`Error: No batch files found in ${batchDir}`);
    process.exit(1);
  }

  let totalCount = 0;
  const widgetsByThemeSize = {};

  for (const file of files) {
    const filePath = path.join(batchDir, file);
    console.log(`Processing: ${file}`);

    try {
      const content = fs.readFileSync(filePath, "utf8");
      const batch = JSON.parse(content);

      if (!Array.isArray(batch)) {
        console.warn(`  ⚠️  Skipping ${file} - not an array`);
        continue;
      }

      // Extract each widget from the batch
      for (const item of batch) {
        const widgetId = item.id;
        const resultDSL = item.resultDSL;

        if (!resultDSL) {
          console.warn(`  ⚠️  Skipping widget ${widgetId} - no resultDSL`);
          continue;
        }

        // Determine filename based on controlled metadata
        let filename;
        if (item.controlled?.theme || item.controlled?.size) {
          const theme = item.controlled.theme || "random";
          const size = item.controlled.size || "none";
          const mode = item.controlled.mode || "random";

          // Create descriptive filename
          filename = `widget-${String(widgetId).padStart(4, "0")}`;
          if (theme && theme !== "null") {
            filename += `-${theme}`;
          }
          if (size && size !== "null" && size !== "none") {
            filename += `-${size}`;
          }
          filename += ".json";

          // Track for summary
          const key = `${theme}-${size}`;
          widgetsByThemeSize[key] = (widgetsByThemeSize[key] || 0) + 1;
        } else {
          // Random mutation - simple numbered filename
          filename = `widget-${String(widgetId).padStart(4, "0")}.json`;
          widgetsByThemeSize["random"] =
            (widgetsByThemeSize["random"] || 0) + 1;
        }

        const outputPath = path.join(outputDir, filename);

        // Write the resultDSL to individual file
        fs.writeFileSync(outputPath, JSON.stringify(resultDSL, null, 2));

        totalCount++;

        // Progress indicator every 100 widgets
        if (totalCount % 100 === 0) {
          console.log(`  ✓ Extracted ${totalCount} widgets...`);
        }
      }
    } catch (error) {
      console.error(`  ❌ Error processing ${file}: ${error.message}`);
    }
  }

  console.log("");
  console.log("==========================================");
  console.log("Extraction Complete!");
  console.log("==========================================");
  console.log(`Total widgets extracted: ${totalCount}`);
  console.log(`Output directory: ${outputDir}`);
  console.log("");

  // Print breakdown by theme/size
  if (Object.keys(widgetsByThemeSize).length > 1) {
    console.log("📊 Breakdown by theme/size:");
    const sorted = Object.entries(widgetsByThemeSize).sort(
      (a, b) => b[1] - a[1]
    );
    for (const [key, count] of sorted) {
      const percentage = ((count / totalCount) * 100).toFixed(1);
      console.log(
        `   ${key.padEnd(30)} ${count.toString().padStart(5)} (${percentage}%)`
      );
    }
    console.log("");
  }

  console.log("Next steps:");
  console.log(`  1. Review extracted widgets: ls ${outputDir}`);
  console.log(`  2. Prepare for batch rendering:`);
  console.log(
    `     ./scripts/rendering/prepare-batch-structure.sh ${outputDir} ./widgets`
  );
  console.log(`  3. Run batch rendering:`);
  console.log(`     ./scripts/rendering/render-batch.sh ./widgets`);
}

// Run the extraction
try {
  extractBatchWidgets();
} catch (error) {
  console.error("❌ Extraction failed:", error.message);
  process.exit(1);
}
