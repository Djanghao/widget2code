import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

// --- PATH UTILS ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// --- CONFIGURATION ---
const PATHS = {
  localIcons: path.resolve(__dirname, "../src/assets/icons"), // Check this path relative to where you run the script!
  output: path.resolve(__dirname, "../dist/icon-manifest.json"),
};

const IGNORED_DIRS = ["lib", "all", "plugin", "icons", "bin"];

async function generateIconManifest() {
  console.log("🔍 Starting Icon Indexing...");
  const allIcons = [];

  // --- 1. INDEX REACT-ICONS ---
  try {
    // 1. Locate react-icons
    // We resolve a specific known pack to find the root folder
    const specificPackPath = require.resolve("react-icons/fa");
    const reactIconsPath = path.resolve(path.dirname(specificPackPath), "..");

    // 2. Get list of pack folders
    const packs = fs
      .readdirSync(reactIconsPath, { withFileTypes: true })
      .filter(
        (dirent) => dirent.isDirectory() && !IGNORED_DIRS.includes(dirent.name)
      )
      .map((dirent) => dirent.name);

    console.log(`   Found ${packs.length} icon packs.`);

    for (const pack of packs) {
      try {
        // FIX: Use require instead of import(), and remove '/index.js'
        // This allows Node to resolve the entry point defined in package.json exports
        const packModule = require(`react-icons/${pack}`);

        // Filter keys for components
        const iconNames = Object.keys(packModule).filter((key) =>
          /^[A-Z]/.test(key)
        );

        if (iconNames.length === 0) {
          console.warn(
            `   ⚠️  Pack '${pack}' has 0 icons. (Might be empty or formatted differently)`
          );
        }

        iconNames.forEach((name) => {
          allIcons.push(`${pack}:${name}`);
        });
      } catch (err) {
        // Log the error so we know why it failed
        console.warn(`   ⚠️  Failed to index '${pack}': ${err.message}`);
        continue;
      }
    }
    console.log(`   ✅ Indexed React-Icons.`);
  } catch (err) {
    console.error(`   ❌ Critical Error indexing react-icons: ${err.message}`);
  }

  // --- 2. INDEX LOCAL ICONS ---
  try {
    // Ensure directory exists before reading
    if (fs.existsSync(PATHS.localIcons)) {
      const files = fs.readdirSync(PATHS.localIcons);

      files.forEach((file) => {
        if (file.match(/\.(svg|jsx|tsx|png)$/)) {
          const name = path.parse(file).name;
          allIcons.push(`local:${name}`);
        }
      });
      console.log(`   ✅ Indexed Local Icons.`);
    } else {
      console.log(`   ℹ️  No local icons folder found at: ${PATHS.localIcons}`);
    }
  } catch (err) {
    console.error(`   ❌ Error indexing local icons: ${err.message}`);
  }

  // --- 3. WRITE OUTPUT ---
  try {
    const outputDir = path.dirname(PATHS.output);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    fs.writeFileSync(PATHS.output, JSON.stringify(allIcons));

    console.log("-------------------------------------");
    console.log(`🎉 Done! Indexed ${allIcons.length} icons.`);
    console.log(`📂 Manifest saved to: ${PATHS.output}`);
    console.log("-------------------------------------");
  } catch (err) {
    console.error(`   ❌ Error saving file: ${err.message}`);
  }
}

generateIconManifest();
