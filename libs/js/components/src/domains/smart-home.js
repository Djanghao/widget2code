/**
 * Smart Home domain component library
 */

import { generateIcon, generateText, generateButton, generateIndicator, generateProgressBar, generateComposite } from "../generators.js";

const domain = "smart-home";

export const smartHomeIcons = [
  generateIcon({ id: "smart-home-icon-house", domain, iconName: "sf:house.fill", size: 24, color: "#007AFF", tags: ["home"] }),
  generateIcon({ id: "smart-home-icon-lightbulb", domain, iconName: "sf:lightbulb.fill", size: 20, color: "#FFCC00", tags: ["light"] }),
  generateIcon({ id: "smart-home-icon-lock", domain, iconName: "sf:lock.fill", size: 20, color: "#34C759", tags: ["security", "lock"] }),
  generateIcon({ id: "smart-home-icon-thermometer", domain, iconName: "sf:thermometer.medium", size: 20, color: "#FF3B30", tags: ["temperature"] }),
  generateIcon({ id: "smart-home-icon-camera", domain, iconName: "sf:video.fill", size: 20, color: "#007AFF", tags: ["camera", "security"] }),
  generateIcon({ id: "smart-home-icon-fan", domain, iconName: "sf:fan.fill", size: 20, color: "#007AFF", tags: ["fan", "climate"] }),
];

export const smartHomeText = [
  generateText({ id: "smart-home-text-title-home", domain, content: "Home", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["title"] }),
  generateText({ id: "smart-home-text-device-light", domain, content: "Living Room Light", fontSize: 15, fontWeight: 500, color: "#000000", tags: ["device"] }),
  generateText({ id: "smart-home-text-device-thermostat", domain, content: "Thermostat", fontSize: 15, fontWeight: 500, color: "#000000", tags: ["device"] }),
  generateText({ id: "smart-home-text-status-on", domain, content: "On", fontSize: 14, fontWeight: 500, color: "#34C759", tags: ["status"] }),
  generateText({ id: "smart-home-text-status-off", domain, content: "Off", fontSize: 14, fontWeight: 500, color: "#8E8E93", tags: ["status"] }),
  generateText({ id: "smart-home-text-temp-72", domain, content: "72°", fontSize: 32, fontWeight: 300, color: "#000000", tags: ["temperature"] }),
];

export const smartHomeButtons = [
  generateButton({ id: "smart-home-button-unlock", domain, label: "Unlock", variant: "primary", size: "small", tags: ["action", "lock"] }),
  generateButton({ id: "smart-home-button-all-off", domain, label: "All Off", variant: "secondary", size: "small", tags: ["action"] }),
];

export const smartHomeIndicators = [
  generateIndicator({ id: "smart-home-indicator-on", domain, color: "#34C759", width: 4, height: 40, tags: ["status", "on"] }),
  generateIndicator({ id: "smart-home-indicator-off", domain, color: "#8E8E93", width: 4, height: 40, tags: ["status", "off"] }),
];

export const smartHomeProgressBars = [
  generateProgressBar({ id: "smart-home-progress-brightness", domain, progress: 0.7, width: 150, height: 8, color: "#FFCC00", backgroundColor: "#E5E5EA", tags: ["brightness", "light"] }),
  generateProgressBar({ id: "smart-home-progress-temperature", domain, progress: 0.6, width: 150, height: 8, color: "#FF3B30", backgroundColor: "#E5E5EA", tags: ["temperature"] }),
];

export const smartHomeComposites = [
  generateComposite({ id: "smart-home-composite-device-row", domain, nodes: [
    { type: "leaf", component: "Icon", props: { name: "sf:lightbulb.fill", size: 20, color: "#FFCC00" }},
    { type: "leaf", component: "Text", props: { fontSize: 15, fontWeight: 500, color: "#000000" }, content: "Living Room Light" },
    { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 500, color: "#34C759" }, content: "On" },
  ], visualComplexity: "simple", size: "small", tags: ["device", "row"] }),
  generateComposite({ id: "smart-home-composite-thermostat", domain, nodes: [
    { type: "leaf", component: "Icon", props: { name: "sf:thermometer.medium", size: 24, color: "#FF3B30" }},
    { type: "leaf", component: "Text", props: { fontSize: 32, fontWeight: 300, color: "#000000" }, content: "72°" },
    { type: "leaf", component: "ProgressBar", width: 120, height: 6, props: { progress: 0.6, color: "#FF3B30", backgroundColor: "#E5E5EA" }},
  ], visualComplexity: "medium", size: "medium", tags: ["thermostat", "temperature"] }),
];

export const smartHomeComponents = [...smartHomeIcons, ...smartHomeText, ...smartHomeButtons, ...smartHomeIndicators, ...smartHomeProgressBars, ...smartHomeComposites];
export const smartHomeComponentStats = { domain: "smart-home", total: smartHomeComponents.length };
