/**
 * Utilities domain component library
 */

import { generateIcon, generateText, generateButton, generateProgressBar, generateProgressRing, generateComposite } from "../generators.js";

const domain = "utilities";

export const utilitiesIcons = [
  generateIcon({ id: "utilities-icon-battery-full", domain, iconName: "sf:battery.100percent", size: 24, color: "#34C759", tags: ["battery"] }),
  generateIcon({ id: "utilities-icon-battery-low", domain, iconName: "sf:battery.25percent", size: 24, color: "#FF3B30", tags: ["battery", "low"] }),
  generateIcon({ id: "utilities-icon-wifi", domain, iconName: "sf:wifi", size: 20, color: "#007AFF", tags: ["wifi", "network"] }),
  generateIcon({ id: "utilities-icon-gear", domain, iconName: "sf:gearshape.fill", size: 20, color: "#8E8E93", tags: ["settings"] }),
  generateIcon({ id: "utilities-icon-bolt", domain, iconName: "sf:bolt.fill", size: 20, color: "#FFCC00", tags: ["power", "charging"] }),
];

export const utilitiesText = [
  generateText({ id: "utilities-text-title-battery", domain, content: "Battery", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["title"] }),
  generateText({ id: "utilities-text-battery-percent", domain, content: "85%", fontSize: 32, fontWeight: 600, color: "#34C759", tags: ["battery", "percentage"] }),
  generateText({ id: "utilities-text-battery-time", domain, content: "3h 25m remaining", fontSize: 14, fontWeight: 400, color: "#8E8E93", tags: ["battery", "time"] }),
  generateText({ id: "utilities-text-wifi-connected", domain, content: "Connected", fontSize: 14, fontWeight: 500, color: "#34C759", tags: ["wifi", "status"] }),
  generateText({ id: "utilities-text-storage-available", domain, content: "128 GB available", fontSize: 14, fontWeight: 400, color: "#8E8E93", tags: ["storage"] }),
];

export const utilitiesButtons = [
  generateButton({ id: "utilities-button-settings", domain, label: "Settings", variant: "secondary", size: "small", tags: ["action", "settings"] }),
];

export const utilitiesProgressBars = [
  generateProgressBar({ id: "utilities-progress-battery", domain, progress: 0.85, width: 200, height: 8, color: "#34C759", backgroundColor: "#E5E5EA", tags: ["battery"] }),
  generateProgressBar({ id: "utilities-progress-storage", domain, progress: 0.65, width: 200, height: 8, color: "#007AFF", backgroundColor: "#E5E5EA", tags: ["storage"] }),
];

export const utilitiesProgressRings = [
  generateProgressRing({ id: "utilities-ring-battery", domain, value: 85, goal: 100, size: 100, color: "#34C759", ringWidth: 10, tags: ["battery"] }),
  generateProgressRing({ id: "utilities-ring-storage", domain, value: 65, goal: 100, size: 100, color: "#007AFF", ringWidth: 10, tags: ["storage"] }),
];

export const utilitiesComposites = [
  generateComposite({ id: "utilities-composite-battery-status", domain, nodes: [
    { type: "leaf", component: "Icon", props: { name: "sf:battery.100percent", size: 24, color: "#34C759" }},
    { type: "leaf", component: "Text", props: { fontSize: 28, fontWeight: 600, color: "#34C759" }, content: "85%" },
    { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 400, color: "#8E8E93" }, content: "3h 25m remaining" },
  ], visualComplexity: "simple", size: "medium", tags: ["battery", "status"] }),
  generateComposite({ id: "utilities-composite-wifi-status", domain, nodes: [
    { type: "leaf", component: "Icon", props: { name: "sf:wifi", size: 20, color: "#007AFF" }},
    { type: "leaf", component: "Text", props: { fontSize: 15, fontWeight: 500, color: "#000000" }, content: "My Network" },
    { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 500, color: "#34C759" }, content: "Connected" },
  ], visualComplexity: "simple", size: "small", tags: ["wifi", "status"] }),
  generateComposite({ id: "utilities-composite-storage", domain, nodes: [
    { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 500, color: "#000000" }, content: "Storage" },
    { type: "leaf", component: "ProgressBar", width: 180, height: 8, props: { progress: 0.65, color: "#007AFF", backgroundColor: "#E5E5EA" }},
    { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 400, color: "#8E8E93" }, content: "128 GB available" },
  ], visualComplexity: "medium", size: "medium", tags: ["storage", "progress"] }),
];

export const utilitiesComponents = [...utilitiesIcons, ...utilitiesText, ...utilitiesButtons, ...utilitiesProgressBars, ...utilitiesProgressRings, ...utilitiesComposites];
export const utilitiesComponentStats = { domain: "utilities", total: utilitiesComponents.length };
