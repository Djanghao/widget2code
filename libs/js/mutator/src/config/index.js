import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

let cachedPalette = null;
let cachedRulebook = null;
let cachedProjectRoot = null;

function getConfigDir() {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);
  return path.resolve(currentDir, "..", "..", "config");
}

function getProjectRoot() {
  if (cachedProjectRoot) {
    return cachedProjectRoot;
  }

  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);
  cachedProjectRoot = path.resolve(currentDir, "..", "..", "..", "..", "..");
  return cachedProjectRoot;
}

export function loadConfig() {
  if (cachedPalette && cachedRulebook) {
    return { palette: cachedPalette, rulebook: cachedRulebook };
  }

  const configDir = getConfigDir();

  const palettePath = path.join(configDir, "dsl-mutation-palette.json");
  const rulebookPath = path.join(configDir, "dsl-validation-rulebook.json");

  if (!fs.existsSync(palettePath)) {
    throw new Error(`Palette file not found: ${palettePath}`);
  }
  if (!fs.existsSync(rulebookPath)) {
    throw new Error(`Rulebook file not found: ${rulebookPath}`);
  }

  const paletteData = JSON.parse(fs.readFileSync(palettePath, "utf8"));
  const rulebookData = JSON.parse(fs.readFileSync(rulebookPath, "utf8"));

  cachedPalette = paletteData.mutationPalette;
  cachedRulebook = rulebookData.validationRulebook;

  return { palette: cachedPalette, rulebook: cachedRulebook };
}

export function getPalette() {
  if (!cachedPalette) {
    loadConfig();
  }
  return cachedPalette;
}

export function getRulebook() {
  if (!cachedRulebook) {
    loadConfig();
  }
  return cachedRulebook;
}

export function getTheme(themeName) {
  const palette = getPalette();
  if (!palette.themes || !palette.themes[themeName]) {
    return null;
  }
  return palette.themes[themeName];
}

export function getSizeVariant(sizeName) {
  const palette = getPalette();
  if (!palette.sizeVariants || !palette.sizeVariants[sizeName]) {
    return null;
  }
  return palette.sizeVariants[sizeName];
}

export { getProjectRoot };
