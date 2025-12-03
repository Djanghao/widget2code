import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// 1. Resolve paths (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust this path relative to where you save this file
// If this file is in 'lib/', then '../dist' is correct.
const MANIFEST_PATH = path.resolve(__dirname, "../dist/icon-manifest.json");

// 2. Cache variable to prevent re-reading file 1000 times
let iconCache = null;

export function getRandomIcon() {
  // Load data only if not already in memory
  if (!iconCache) {
    try {
      if (!fs.existsSync(MANIFEST_PATH)) {
        throw new Error(`Manifest not found at: ${MANIFEST_PATH}`);
      }
      const fileContent = fs.readFileSync(MANIFEST_PATH, "utf-8");
      iconCache = JSON.parse(fileContent);
    } catch (error) {
      console.error("Failed to load icon manifest:", error.message);
      return null;
    }
  }

  if (iconCache.length === 0) return null;

  // 3. Pick Random
  const randomIndex = Math.floor(Math.random() * iconCache.length);
  const iconString = iconCache[randomIndex]; // e.g., "lu:LuHouse"

  // 4. Parse and Return
  const [prefix, name] = iconString.split(":");

  return {
    id: iconString, // "lu:LuHouse"
    prefix, // "lu"
    name, // "LuHouse"
  };
}
