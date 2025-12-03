/**
 * Weather domain component library
 * Components for weather information, forecasts, and conditions
 */

import {
  generateIcon,
  generateText,
  generateButton,
  generateImage,
  generateMapImage,
  generateDivider,
  generateSparkline,
  generateLineChart,
  generateBarChart,
  generateComposite,
} from "../generators.js";

const domain = "weather";

// Icons (8)
export const weatherIcons = [
  generateIcon({ id: "weather-icon-sun", domain, iconName: "sf:sun.max.fill", size: 48, color: "#FF9500", tags: ["sunny", "clear"] }),
  generateIcon({ id: "weather-icon-cloud-sun", domain, iconName: "sf:cloud.sun.fill", size: 40, color: "#007AFF", tags: ["partly-cloudy"] }),
  generateIcon({ id: "weather-icon-cloud", domain, iconName: "sf:cloud.fill", size: 36, color: "#8E8E93", tags: ["cloudy"] }),
  generateIcon({ id: "weather-icon-cloud-rain", domain, iconName: "sf:cloud.rain.fill", size: 36, color: "#007AFF", tags: ["rainy"] }),
  generateIcon({ id: "weather-icon-snow", domain, iconName: "sf:snow", size: 36, color: "#00D9FF", tags: ["snowy"] }),
  generateIcon({ id: "weather-icon-wind", domain, iconName: "sf:wind", size: 24, color: "#8E8E93", tags: ["windy"] }),
  generateIcon({ id: "weather-icon-drop", domain, iconName: "sf:drop.fill", size: 20, color: "#007AFF", tags: ["humidity", "rain"] }),
  generateIcon({ id: "weather-icon-thermometer", domain, iconName: "sf:thermometer.medium", size: 20, color: "#FF3B30", tags: ["temperature"] }),
];

// Text (10)
export const weatherText = [
  generateText({ id: "weather-text-title", domain, content: "Weather", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["title"] }),
  generateText({ id: "weather-text-temp-72", domain, content: "72°", fontSize: 56, fontWeight: 200, color: "#000000", tags: ["temperature", "large"] }),
  generateText({ id: "weather-text-temp-68", domain, content: "68°", fontSize: 32, fontWeight: 300, color: "#000000", tags: ["temperature", "medium"] }),
  generateText({ id: "weather-text-condition-sunny", domain, content: "Sunny", fontSize: 18, fontWeight: 500, color: "#000000", tags: ["condition"] }),
  generateText({ id: "weather-text-condition-cloudy", domain, content: "Partly Cloudy", fontSize: 18, fontWeight: 500, color: "#000000", tags: ["condition"] }),
  generateText({ id: "weather-text-location-sf", domain, content: "San Francisco", fontSize: 14, fontWeight: 500, color: "#8E8E93", tags: ["location"] }),
  generateText({ id: "weather-text-label-humidity", domain, content: "Humidity", fontSize: 12, fontWeight: 500, color: "#8E8E93", tags: ["label"] }),
  generateText({ id: "weather-text-value-humidity", domain, content: "65%", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["value", "humidity"] }),
  generateText({ id: "weather-text-label-wind", domain, content: "Wind", fontSize: 12, fontWeight: 500, color: "#8E8E93", tags: ["label"] }),
  generateText({ id: "weather-text-value-wind", domain, content: "12 mph", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["value", "wind"] }),
];

// Buttons (2)
export const weatherButtons = [
  generateButton({ id: "weather-button-forecast", domain, label: "7-Day Forecast", variant: "secondary", size: "small", tags: ["forecast"] }),
  generateButton({ id: "weather-button-map", domain, label: "View Map", variant: "secondary", size: "small", tags: ["map"] }),
];

// Images & Maps (2)
export const weatherImages = [
  generateMapImage({ id: "weather-map-region", domain, width: 200, height: 120, borderRadius: 12, tags: ["map", "region"] }),
  generateImage({ id: "weather-image-radar", domain, width: 180, height: 100, borderRadius: 8, tags: ["radar", "precipitation"] }),
];

// Dividers (1)
export const weatherDividers = [
  generateDivider({ id: "weather-divider", domain, orientation: "horizontal", color: "#E5E5EA", thickness: 1, tags: ["separator"] }),
];

// Sparklines & Charts (6)
export const weatherCharts = [
  generateSparkline({ id: "weather-sparkline-temp", domain, data: [68, 70, 72, 75, 73, 70, 68], width: 120, height: 40, color: "#FF9500", lineWidth: 2, tags: ["temperature", "trend"] }),
  generateSparkline({ id: "weather-sparkline-humidity", domain, data: [60, 62, 65, 68, 66, 64, 62], width: 100, height: 30, color: "#007AFF", lineWidth: 2, tags: ["humidity", "trend"] }),
  generateLineChart({ id: "weather-chart-hourly-temp", domain, data: [65, 67, 70, 72, 74, 75, 76, 75, 73, 70, 68, 66], width: 250, height: 100, color: "#FF9500", lineWidth: 2, smooth: true, tags: ["temperature", "hourly"] }),
  generateLineChart({ id: "weather-chart-weekly-temp", domain, data: [68, 72, 70, 75, 73, 71, 69], width: 200, height: 80, color: "#FF3B30", lineWidth: 2, smooth: true, tags: ["temperature", "weekly"] }),
  generateBarChart({ id: "weather-chart-precipitation", domain, data: [0.1, 0.3, 0.0, 0.2, 0.5, 0.8, 0.1], width: 180, height: 80, color: "#007AFF", tags: ["precipitation", "daily"] }),
  generateBarChart({ id: "weather-chart-wind-speed", domain, data: [8, 12, 10, 15, 18, 14, 10], width: 150, height: 70, color: "#8E8E93", tags: ["wind", "speed"] }),
];

// Composites (12)
export const weatherComposites = [
  generateComposite({
    id: "weather-composite-temp-condition",
    domain,
    nodes: [
      { type: "leaf", component: "Icon", props: { name: "sf:sun.max.fill", size: 48, color: "#FF9500" }},
      { type: "leaf", component: "Text", props: { fontSize: 56, fontWeight: 200, color: "#000000" }, content: "72°" },
      { type: "leaf", component: "Text", props: { fontSize: 18, fontWeight: 500, color: "#000000" }, content: "Sunny" },
    ],
    visualComplexity: "medium",
    size: "large",
    tags: ["temperature", "condition", "main"],
  }),
  generateComposite({
    id: "weather-composite-location-temp",
    domain,
    nodes: [
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 500, color: "#8E8E93" }, content: "San Francisco" },
      { type: "leaf", component: "Text", props: { fontSize: 32, fontWeight: 300, color: "#000000" }, content: "72°" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["location", "temperature"],
  }),
  generateComposite({
    id: "weather-composite-humidity-row",
    domain,
    nodes: [
      { type: "leaf", component: "Icon", props: { name: "sf:drop.fill", size: 18, color: "#007AFF" }},
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 500, color: "#8E8E93" }, content: "Humidity" },
      { type: "leaf", component: "Text", props: { fontSize: 16, fontWeight: 600, color: "#000000" }, content: "65%" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["humidity", "metric-row"],
  }),
  generateComposite({
    id: "weather-composite-wind-row",
    domain,
    nodes: [
      { type: "leaf", component: "Icon", props: { name: "sf:wind", size: 18, color: "#8E8E93" }},
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 500, color: "#8E8E93" }, content: "Wind" },
      { type: "leaf", component: "Text", props: { fontSize: 16, fontWeight: 600, color: "#000000" }, content: "12 mph" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["wind", "metric-row"],
  }),
  generateComposite({
    id: "weather-composite-forecast-item",
    domain,
    nodes: [
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 500, color: "#8E8E93" }, content: "Tomorrow" },
      { type: "leaf", component: "Icon", props: { name: "sf:cloud.sun.fill", size: 24, color: "#007AFF" }},
      { type: "leaf", component: "Text", props: { fontSize: 16, fontWeight: 600, color: "#000000" }, content: "75° / 62°" },
    ],
    visualComplexity: "simple",
    size: "medium",
    tags: ["forecast", "daily"],
  }),
  generateComposite({
    id: "weather-composite-temp-range",
    domain,
    nodes: [
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 600, color: "#FF3B30" }, content: "H: 75°" },
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 600, color: "#007AFF" }, content: "L: 62°" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["temperature", "range", "high-low"],
  }),
  generateComposite({
    id: "weather-composite-hourly-item",
    domain,
    nodes: [
      { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 500, color: "#8E8E93" }, content: "3 PM" },
      { type: "leaf", component: "Icon", props: { name: "sf:sun.max.fill", size: 20, color: "#FF9500" }},
      { type: "leaf", component: "Text", props: { fontSize: 16, fontWeight: 600, color: "#000000" }, content: "75°" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["hourly", "forecast"],
  }),
  generateComposite({
    id: "weather-composite-uv-index",
    domain,
    nodes: [
      { type: "leaf", component: "Text", props: { fontSize: 12, fontWeight: 500, color: "#8E8E93" }, content: "UV Index" },
      { type: "leaf", component: "Text", props: { fontSize: 24, fontWeight: 600, color: "#FF9500" }, content: "7" },
      { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 500, color: "#8E8E93" }, content: "High" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["uv-index", "metric"],
  }),
  generateComposite({
    id: "weather-composite-precipitation-chance",
    domain,
    nodes: [
      { type: "leaf", component: "Icon", props: { name: "sf:cloud.rain.fill", size: 20, color: "#007AFF" }},
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 500, color: "#8E8E93" }, content: "Rain" },
      { type: "leaf", component: "Text", props: { fontSize: 16, fontWeight: 600, color: "#000000" }, content: "30%" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["precipitation", "chance"],
  }),
  generateComposite({
    id: "weather-composite-sunrise-sunset",
    domain,
    nodes: [
      { type: "leaf", component: "Icon", props: { name: "sf:sunrise.fill", size: 18, color: "#FF9500" }},
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 500, color: "#000000" }, content: "6:42 AM" },
      { type: "leaf", component: "Icon", props: { name: "sf:sunset.fill", size: 18, color: "#FF3B30" }},
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 500, color: "#000000" }, content: "7:28 PM" },
    ],
    visualComplexity: "medium",
    size: "medium",
    tags: ["sunrise", "sunset", "time"],
  }),
  generateComposite({
    id: "weather-composite-feels-like",
    domain,
    nodes: [
      { type: "leaf", component: "Icon", props: { name: "sf:thermometer.medium", size: 18, color: "#FF9500" }},
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 500, color: "#8E8E93" }, content: "Feels like" },
      { type: "leaf", component: "Text", props: { fontSize: 16, fontWeight: 600, color: "#000000" }, content: "74°" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["feels-like", "temperature"],
  }),
  generateComposite({
    id: "weather-composite-air-quality",
    domain,
    nodes: [
      { type: "leaf", component: "Text", props: { fontSize: 12, fontWeight: 500, color: "#8E8E93" }, content: "Air Quality" },
      { type: "leaf", component: "Text", props: { fontSize: 20, fontWeight: 600, color: "#34C759" }, content: "Good" },
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 500, color: "#8E8E93" }, content: "AQI 42" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["air-quality", "aqi"],
  }),
];

export const weatherComponents = [
  ...weatherIcons,
  ...weatherText,
  ...weatherButtons,
  ...weatherImages,
  ...weatherDividers,
  ...weatherCharts,
  ...weatherComposites,
];

export const weatherComponentStats = {
  domain: "weather",
  total: weatherComponents.length,
  byCategory: {
    icon: weatherIcons.length,
    text: weatherText.length,
    button: weatherButtons.length,
    image: weatherImages.length,
    divider: weatherDividers.length,
    chart: weatherCharts.length,
    composite: weatherComposites.length,
  },
};
