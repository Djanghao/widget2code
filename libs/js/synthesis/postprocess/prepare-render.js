import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const INPUT_DIR = "../../../../output/1-synthesis/batch-generated";
const OUTPUT_DIR = "../../../../output/1-synthesis/render-ready";

// Parse command-line arguments
const args = process.argv.slice(2);
const TEST_MODE = args.includes("--test") || args.includes("--dry-run");
const SHOW_HELP = args.includes("--help") || args.includes("-h");
const FLAT_OUTPUT = args.includes("--flat");

// List of map image URLs to use for MapImage components
const MAP_IMAGE_URLS = [
  "https://www.theonlinemom.com/wp-content/uploads/2020/02/Screen-Shot-2020-02-05-at-11.01.20-AM.png",
  "https://images.macrumors.com/t/-vFMLKOlj8nnBR4HrzYyULSx4vw=/1600x/article-new/2019/11/Apple-Maps-2019-Revamp-West-Midwest.jpg",
  "https://www.shutterstock.com/image-vector/city-map-town-streets-park-600nw-1920347111.jpg",
  // Add more map image URLs here
];

/**
 * Recursively traverse the widget tree and transform components
 * NOTE: Icon replacement and url->src transformation are now done during generation.
 * This function now only handles MapImage URL replacement and serves as a fallback.
 */
function transformWidget(
  node,
  mapImageIndex = { current: 0 },
  changes = { images: 0, mapImages: 0, icons: 0 }
) {
  if (!node || typeof node !== "object") {
    return node;
  }

  // Handle arrays
  if (Array.isArray(node)) {
    return node.map((item) =>
      transformWidget(item, mapImageIndex, changes)
    );
  }

  // Clone the node
  const transformed = { ...node };

  // Check if this is a leaf node with a component
  if (transformed.type === "leaf" && transformed.component) {
    const component = transformed.component;

    // Handle Image and MapImage components
    if (
      (component === "Image" || component === "MapImage") &&
      transformed.props
    ) {
      transformed.props = { ...transformed.props };

      // Fallback: Change 'url' to 'src' if still present (for backwards compatibility)
      if (transformed.props.url) {
        const originalUrl = transformed.props.url;
        delete transformed.props.url;

        // For MapImage, use URL from the MAP_IMAGE_URLS list
        if (component === "MapImage" && MAP_IMAGE_URLS.length > 0) {
          transformed.props.src =
            MAP_IMAGE_URLS[mapImageIndex.current % MAP_IMAGE_URLS.length];
          mapImageIndex.current++;
          changes.mapImages++;
        } else {
          transformed.props.src = originalUrl;
          changes.images++;
        }
      } else if (component === "MapImage" && transformed.props.src && MAP_IMAGE_URLS.length > 0) {
        // Replace MapImage src with configured map URLs
        transformed.props.src =
          MAP_IMAGE_URLS[mapImageIndex.current % MAP_IMAGE_URLS.length];
        mapImageIndex.current++;
        changes.mapImages++;
      }
    }
  }

  // Recursively transform children
  if (transformed.children) {
    transformed.children = transformWidget(
      transformed.children,
      mapImageIndex,
      changes
    );
  }

  // Recursively transform root
  if (transformed.root) {
    transformed.root = transformWidget(
      transformed.root,
      mapImageIndex,
      changes
    );
  }

  return transformed;
}

/**
 * Process a single JSON file
 */
function processFile(inputPath, outputPath) {
  try {
    const content = fs.readFileSync(inputPath, "utf8");
    const data = JSON.parse(content);

    // Check if the file has the expected structure and extract widget
    let widgetSource;
    if (data.widgetDSL && data.widgetDSL.widget) {
      widgetSource = data.widgetDSL.widget;
    } else if (data.widget) {
      widgetSource = data.widget;
    } else {
      if (!TEST_MODE) {
        console.warn(`⚠️  Skipping ${inputPath}: No widget found`);
      }
      return false;
    }

    // Transform the widget
    const changes = { images: 0, mapImages: 0, icons: 0 };
    const widget = transformWidget(
      widgetSource,
      { current: 0 },
      changes
    );

    // Track changes for test mode
    const fileChanges = [];

    // Ensure padding is between 12 and 20 (fallback for old widgets)
    let paddingAdjusted = false;
    if (widget.padding !== undefined) {
      const originalPadding = widget.padding;
      widget.padding = Math.max(12, Math.min(20, widget.padding));

      if (widget.padding !== originalPadding) {
        paddingAdjusted = true;
        fileChanges.push(`padding: ${originalPadding} → ${widget.padding}`);
      }
    }

    if (changes.images > 0) {
      fileChanges.push(`${changes.images} Image url→src (fallback)`);
    }
    if (changes.mapImages > 0) {
      fileChanges.push(`${changes.mapImages} MapImage replaced`);
    }

    // In test mode, log changes without writing
    if (TEST_MODE) {
      if (fileChanges.length > 0) {
        console.log(
          `📄 ${path.basename(inputPath)}: ${fileChanges.join(", ")}`
        );
      }
      return true;
    }

    // Write the transformed widget (wrapped in {widget: })
    fs.writeFileSync(outputPath, JSON.stringify({ widget }, null, 2), "utf8");

    if (paddingAdjusted) {
      console.log(`   📏 Adjusted padding in ${path.basename(inputPath)}`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Error processing ${inputPath}:`, error.message);
    return false;
  }
}

/**
 * Recursively process all JSON files in a directory
 */
function processDirectory(inputDir, outputDir, rootOutputDir = null) {
  // Track the root output directory for flat output
  if (rootOutputDir === null) {
    rootOutputDir = outputDir;
  }

  // Create output directory if it doesn't exist (skip in test mode)
  if (!TEST_MODE && !FLAT_OUTPUT && !fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const entries = fs.readdirSync(inputDir, { withFileTypes: true });
  let stats = { processed: 0, skipped: 0, total: 0 };

  for (const entry of entries) {
    const inputPath = path.join(inputDir, entry.name);

    // For flat output, always use root output directory
    const outputPath = FLAT_OUTPUT
      ? path.join(rootOutputDir, entry.name)
      : path.join(outputDir, entry.name);

    if (entry.isDirectory()) {
      // Recursively process subdirectories
      const subOutputDir = FLAT_OUTPUT
        ? rootOutputDir
        : path.join(outputDir, entry.name);
      const subStats = processDirectory(inputPath, subOutputDir, rootOutputDir);
      stats.processed += subStats.processed;
      stats.skipped += subStats.skipped;
      stats.total += subStats.total;
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      stats.total++;
      const success = processFile(inputPath, outputPath);
      if (success) {
        stats.processed++;
      } else {
        stats.skipped++;
      }
    }
  }

  return stats;
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
📋 Batch Render Preparation Script

Usage: node prepare-batch-render.js [options]

Description:
  Processes batch-generated widget JSON files and prepares them for batch rendering.

  Transformations applied:
  - Extracts widget JSON from widgetDSL wrapper and outputs as {widget: {...}}
  - Replaces MapImage URLs with configured map URLs
  - Fallback: Changes Image 'url' to 'src' (for backwards compatibility)
  - Fallback: Ensures widget padding is between 12-20 (for old widgets)
  - Optionally flattens directory structure (--flat)

  Note: Icon replacement and url->src transformation are now done during generation.
        This post-processor serves as a fallback for old widgets.

Options:
  --test, --dry-run    Run in test mode (no files written, shows changes)
  --flat               Output all files to a single directory (no subdirectories)
  --help, -h           Show this help message

Configuration:
  Edit the MAP_IMAGE_URLS array in the script to configure map image URLs.
  Input:  ${INPUT_DIR}
  Output: ${OUTPUT_DIR}

Examples:
  node prepare-batch-render.js --test     # Preview changes without writing
  node prepare-batch-render.js            # Process files (maintains subdirectories)
  node prepare-batch-render.js --flat     # Process files (all in one folder)
`);
}

/**
 * Main function
 */
function main() {
  if (SHOW_HELP) {
    showHelp();
    return;
  }

  console.log(
    `🚀 Starting batch render preparation${
      TEST_MODE ? " (TEST MODE - no files will be written)" : ""
    }...\n`
  );

  const inputDir = path.resolve(__dirname, INPUT_DIR);
  const outputDir = path.resolve(__dirname, OUTPUT_DIR);

  console.log(`📂 Input directory:  ${inputDir}`);
  if (!TEST_MODE) {
    console.log(`📂 Output directory: ${outputDir}`);
  }
  console.log(`🗺️  Map images configured: ${MAP_IMAGE_URLS.length}`);
  console.log(
    `📁 Directory structure: ${
      FLAT_OUTPUT
        ? "flat (all files in one folder)"
        : "hierarchical (maintains subdirectories)"
    }`
  );
  console.log(
    `🔧 Mode: ${
      TEST_MODE ? "TEST (dry-run)" : "PRODUCTION (will write files)"
    }\n`
  );

  if (!fs.existsSync(inputDir)) {
    console.error(`❌ Input directory does not exist: ${inputDir}`);
    process.exit(1);
  }

  // Create root output directory if in flat mode and not in test mode
  if (!TEST_MODE && FLAT_OUTPUT && !fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const stats = processDirectory(inputDir, outputDir);

  console.log(
    `\n✅ Batch render preparation ${TEST_MODE ? "analysis" : ""} complete!`
  );
  console.log(`\n📊 Export Statistics:`);
  console.log(`   Total files found:    ${stats.total}`);
  console.log(
    `   Successfully ${TEST_MODE ? "analyzed" : "exported"}:  ${
      stats.processed
    }`
  );
  console.log(`   Skipped:              ${stats.skipped}`);

  if (!TEST_MODE) {
    console.log(
      `\n📦 ${stats.processed} file${
        stats.processed !== 1 ? "s" : ""
      } exported to: ${outputDir}`
    );
  } else {
    console.log(`\n💡 Run without --test or --dry-run to actually write files`);
  }
}

// Run the script if executed directly
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}

export { transformWidget, processFile, processDirectory };
