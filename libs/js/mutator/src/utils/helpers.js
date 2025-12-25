import crypto from "crypto";

export function selectFromArray(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function adjustColor(color) {
  const colors = [
    "#007bff",
    "#28a745",
    "#dc3545",
    "#ffc107",
    "#17a2b8",
    "#6f42c1",
    "#fd7e14",
    "#20c997",
  ];
  const adjustedColors = colors.filter((c) => c !== color);
  if (adjustedColors.length === 0) {
    return colors[0];
  }
  return adjustedColors[Math.floor(Math.random() * adjustedColors.length)];
}

export function hashDSL(dsl) {
  const str = JSON.stringify(dsl);
  return crypto.createHash("md5").update(str).digest("hex");
}

export function generateRunId() {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, -5);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `run-${timestamp}-${randomSuffix}`;
}
