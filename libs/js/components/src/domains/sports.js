/**
 * Sports domain component library
 */

import { generateIcon, generateText, generateButton, generateImage, generateDivider, generateBarChart, generatePieChart, generateComposite } from "../generators.js";

const domain = "sports";

export const sportsIcons = [
  generateIcon({ id: "sports-icon-trophy", domain, iconName: "sf:trophy.fill", size: 24, color: "#FFCC00", tags: ["trophy", "win"] }),
  generateIcon({ id: "sports-icon-football", domain, iconName: "sf:football.fill", size: 20, color: "#8E8E93", tags: ["football"] }),
  generateIcon({ id: "sports-icon-basketball", domain, iconName: "sf:basketball.fill", size: 20, color: "#FF9500", tags: ["basketball"] }),
  generateIcon({ id: "sports-icon-soccerball", domain, iconName: "sf:soccerball", size: 20, color: "#000000", tags: ["soccer"] }),
  generateIcon({ id: "sports-icon-figure-run", domain, iconName: "sf:figure.run", size: 20, color: "#34C759", tags: ["running", "athlete"] }),
  generateIcon({ id: "sports-icon-flame", domain, iconName: "sf:flame.fill", size: 18, color: "#FF3B30", tags: ["streak", "hot"] }),
];

export const sportsText = [
  generateText({ id: "sports-text-title-scores", domain, content: "Scores", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["title"] }),
  generateText({ id: "sports-text-team-name-home", domain, content: "Warriors", fontSize: 18, fontWeight: 700, color: "#000000", tags: ["team"] }),
  generateText({ id: "sports-text-team-name-away", domain, content: "Lakers", fontSize: 18, fontWeight: 700, color: "#000000", tags: ["team"] }),
  generateText({ id: "sports-text-score-home", domain, content: "108", fontSize: 32, fontWeight: 700, color: "#000000", tags: ["score"] }),
  generateText({ id: "sports-text-score-away", domain, content: "102", fontSize: 32, fontWeight: 700, color: "#8E8E93", tags: ["score"] }),
  generateText({ id: "sports-text-status-live", domain, content: "LIVE", fontSize: 12, fontWeight: 700, color: "#FF3B30", tags: ["status", "live"] }),
  generateText({ id: "sports-text-status-final", domain, content: "FINAL", fontSize: 12, fontWeight: 700, color: "#8E8E93", tags: ["status", "final"] }),
  generateText({ id: "sports-text-quarter", domain, content: "Q4 2:45", fontSize: 14, fontWeight: 600, color: "#8E8E93", tags: ["quarter", "time"] }),
  generateText({ id: "sports-text-record", domain, content: "45-12", fontSize: 13, fontWeight: 500, color: "#8E8E93", tags: ["record"] }),
];

export const sportsButtons = [
  generateButton({ id: "sports-button-view-game", domain, label: "View Game", variant: "primary", size: "small", tags: ["action"] }),
  generateButton({ id: "sports-button-standings", domain, label: "Standings", variant: "secondary", size: "small", tags: ["action"] }),
];

export const sportsImages = [
  generateImage({ id: "sports-image-team-logo", domain, width: 40, height: 40, borderRadius: 8, tags: ["team", "logo"] }),
];

export const sportsDividers = [
  generateDivider({ id: "sports-divider", domain, orientation: "horizontal", color: "#E5E5EA", thickness: 1, tags: ["separator"] }),
];

export const sportsCharts = [
  generateBarChart({ id: "sports-chart-points-per-game", domain, data: [102, 108, 95, 112, 98, 105, 110], width: 200, height: 90, color: "#FF9500", tags: ["points", "stats"] }),
  generatePieChart({ id: "sports-chart-win-loss", domain, data: [45, 12], labels: ["Wins", "Losses"], size: 100, colors: ["#34C759", "#FF3B30"], tags: ["record", "win-loss"] }),
];

export const sportsComposites = [
  generateComposite({ id: "sports-composite-game-score", domain, nodes: [
    { type: "leaf", component: "Text", props: { fontSize: 15, fontWeight: 700, color: "#000000" }, content: "Warriors" },
    { type: "leaf", component: "Text", props: { fontSize: 28, fontWeight: 700, color: "#000000" }, content: "108" },
    { type: "leaf", component: "Text", props: { fontSize: 15, fontWeight: 700, color: "#8E8E93" }, content: "Lakers" },
    { type: "leaf", component: "Text", props: { fontSize: 28, fontWeight: 700, color: "#8E8E93" }, content: "102" },
  ], visualComplexity: "medium", size: "medium", tags: ["game", "score"] }),
  generateComposite({ id: "sports-composite-team-row", domain, nodes: [
    { type: "leaf", component: "Image", width: 32, height: 32, props: { src: "https://via.placeholder.com/150", alt: "logo", borderRadius: 8 }},
    { type: "leaf", component: "Text", props: { fontSize: 16, fontWeight: 600, color: "#000000" }, content: "Warriors" },
    { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 500, color: "#8E8E93" }, content: "45-12" },
  ], visualComplexity: "simple", size: "small", tags: ["team", "row"] }),
  generateComposite({ id: "sports-composite-live-status", domain, nodes: [
    { type: "leaf", component: "Text", props: { fontSize: 11, fontWeight: 700, color: "#FF3B30" }, content: "LIVE" },
    { type: "leaf", component: "Icon", props: { name: "sf:flame.fill", size: 16, color: "#FF3B30" }},
    { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 600, color: "#8E8E93" }, content: "Q4 2:45" },
  ], visualComplexity: "simple", size: "small", tags: ["status", "live"] }),
  generateComposite({ id: "sports-composite-player-stat", domain, nodes: [
    { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 600, color: "#000000" }, content: "S. Curry" },
    { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 500, color: "#8E8E93" }, content: "32 PTS" },
    { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 500, color: "#8E8E93" }, content: "8 AST" },
  ], visualComplexity: "simple", size: "small", tags: ["player", "stats"] }),
];

export const sportsComponents = [...sportsIcons, ...sportsText, ...sportsButtons, ...sportsImages, ...sportsDividers, ...sportsCharts, ...sportsComposites];
export const sportsComponentStats = { domain: "sports", total: sportsComponents.length };
