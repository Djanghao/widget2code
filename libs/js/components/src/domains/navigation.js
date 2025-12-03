/**
 * Navigation domain component library
 */

import { generateIcon, generateText, generateButton, generateMapImage, generateDivider, generateComposite } from "../generators.js";

const domain = "navigation";

export const navigationIcons = [
  generateIcon({ id: "navigation-icon-map", domain, iconName: "sf:map.fill", size: 24, color: "#007AFF", tags: ["map"] }),
  generateIcon({ id: "navigation-icon-location", domain, iconName: "sf:location.fill", size: 20, color: "#FF3B30", tags: ["location"] }),
  generateIcon({ id: "navigation-icon-compass", domain, iconName: "sf:compass.fill", size: 24, color: "#FF3B30", tags: ["compass"] }),
  generateIcon({ id: "navigation-icon-car", domain, iconName: "sf:car.fill", size: 20, color: "#007AFF", tags: ["driving"] }),
  generateIcon({ id: "navigation-icon-arrow-up", domain, iconName: "sf:arrow.up", size: 24, color: "#000000", tags: ["direction", "north"] }),
];

export const navigationText = [
  generateText({ id: "navigation-text-title-maps", domain, content: "Maps", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["title"] }),
  generateText({ id: "navigation-text-location-sf", domain, content: "San Francisco, CA", fontSize: 15, fontWeight: 500, color: "#000000", tags: ["location"] }),
  generateText({ id: "navigation-text-address", domain, content: "123 Market Street", fontSize: 14, fontWeight: 400, color: "#8E8E93", tags: ["address"] }),
  generateText({ id: "navigation-text-distance", domain, content: "2.5 miles", fontSize: 14, fontWeight: 500, color: "#000000", tags: ["distance"] }),
  generateText({ id: "navigation-text-eta", domain, content: "10 min", fontSize: 14, fontWeight: 600, color: "#34C759", tags: ["eta", "time"] }),
  generateText({ id: "navigation-text-direction-n", domain, content: "N", fontSize: 18, fontWeight: 700, color: "#000000", tags: ["compass", "direction"] }),
];

export const navigationButtons = [
  generateButton({ id: "navigation-button-directions", domain, label: "Directions", variant: "primary", size: "small", tags: ["action"] }),
  generateButton({ id: "navigation-button-share-location", domain, label: "Share", variant: "secondary", size: "small", tags: ["action", "share"] }),
];

export const navigationMaps = [
  generateMapImage({ id: "navigation-map-large", domain, width: 250, height: 150, borderRadius: 12, tags: ["map", "region"] }),
  generateMapImage({ id: "navigation-map-medium", domain, width: 180, height: 120, borderRadius: 8, tags: ["map", "region"] }),
];

export const navigationDividers = [
  generateDivider({ id: "navigation-divider", domain, orientation: "horizontal", color: "#E5E5EA", thickness: 1, tags: ["separator"] }),
];

export const navigationComposites = [
  generateComposite({ id: "navigation-composite-location-card", domain, nodes: [
    { type: "leaf", component: "Icon", props: { name: "sf:location.fill", size: 18, color: "#FF3B30" }},
    { type: "leaf", component: "Text", props: { fontSize: 15, fontWeight: 500, color: "#000000" }, content: "San Francisco, CA" },
    { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 400, color: "#8E8E93" }, content: "123 Market Street" },
  ], visualComplexity: "simple", size: "small", tags: ["location", "card"] }),
  generateComposite({ id: "navigation-composite-route-info", domain, nodes: [
    { type: "leaf", component: "Icon", props: { name: "sf:car.fill", size: 18, color: "#007AFF" }},
    { type: "leaf", component: "Text", props: { fontSize: 16, fontWeight: 600, color: "#000000" }, content: "2.5 miles" },
    { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 600, color: "#34C759" }, content: "10 min" },
  ], visualComplexity: "simple", size: "small", tags: ["route", "eta"] }),
];

export const navigationComponents = [...navigationIcons, ...navigationText, ...navigationButtons, ...navigationMaps, ...navigationDividers, ...navigationComposites];
export const navigationComponentStats = { domain: "navigation", total: navigationComponents.length };
