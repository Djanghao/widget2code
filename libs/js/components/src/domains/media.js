/**
 * Media domain component library
 */

import { generateIcon, generateText, generateButton, generateImage, generateDivider, generateProgressBar, generateComposite } from "../generators.js";

const domain = "media";

export const mediaIcons = [
  generateIcon({ id: "media-icon-play", domain, iconName: "sf:play.fill", size: 24, color: "#000000", tags: ["play"] }),
  generateIcon({ id: "media-icon-pause", domain, iconName: "sf:pause.fill", size: 24, color: "#000000", tags: ["pause"] }),
  generateIcon({ id: "media-icon-backward", domain, iconName: "sf:backward.fill", size: 20, color: "#000000", tags: ["skip"] }),
  generateIcon({ id: "media-icon-forward", domain, iconName: "sf:forward.fill", size: 20, color: "#000000", tags: ["skip"] }),
  generateIcon({ id: "media-icon-music-note", domain, iconName: "sf:music.note", size: 24, color: "#FF3B30", tags: ["music"] }),
  generateIcon({ id: "media-icon-headphones", domain, iconName: "sf:headphones", size: 20, color: "#000000", tags: ["audio"] }),
  generateIcon({ id: "media-icon-speaker", domain, iconName: "sf:speaker.wave.2.fill", size: 20, color: "#000000", tags: ["volume"] }),
  generateIcon({ id: "media-icon-photo", domain, iconName: "sf:photo.fill", size: 20, color: "#007AFF", tags: ["photo"] }),
];

export const mediaText = [
  generateText({ id: "media-text-title-music", domain, content: "Music", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["title"] }),
  generateText({ id: "media-text-song-name", domain, content: "Blinding Lights", fontSize: 18, fontWeight: 600, color: "#000000", tags: ["song"] }),
  generateText({ id: "media-text-artist", domain, content: "The Weeknd", fontSize: 14, fontWeight: 400, color: "#8E8E93", tags: ["artist"] }),
  generateText({ id: "media-text-album", domain, content: "After Hours", fontSize: 13, fontWeight: 400, color: "#8E8E93", tags: ["album"] }),
  generateText({ id: "media-text-time-current", domain, content: "1:32", fontSize: 13, fontWeight: 500, color: "#8E8E93", tags: ["time"] }),
  generateText({ id: "media-text-time-total", domain, content: "3:45", fontSize: 13, fontWeight: 500, color: "#8E8E93", tags: ["time"] }),
];

export const mediaButtons = [
  generateButton({ id: "media-button-play", domain, label: "Play", variant: "primary", size: "small", tags: ["play"] }),
  generateButton({ id: "media-button-shuffle", domain, label: "Shuffle", variant: "secondary", size: "small", tags: ["shuffle"] }),
];

export const mediaImages = [
  generateImage({ id: "media-image-album-art-large", domain, width: 150, height: 150, borderRadius: 12, tags: ["album", "cover"] }),
  generateImage({ id: "media-image-album-art-small", domain, width: 60, height: 60, borderRadius: 8, tags: ["album", "cover"] }),
];

export const mediaDividers = [
  generateDivider({ id: "media-divider", domain, orientation: "horizontal", color: "#E5E5EA", thickness: 1, tags: ["separator"] }),
];

export const mediaProgressBars = [
  generateProgressBar({ id: "media-progress-playback", domain, progress: 0.4, width: 250, height: 4, color: "#FF3B30", backgroundColor: "#E5E5EA", tags: ["playback", "scrubber"] }),
  generateProgressBar({ id: "media-progress-volume", domain, progress: 0.7, width: 100, height: 4, color: "#000000", backgroundColor: "#E5E5EA", tags: ["volume"] }),
];

export const mediaComposites = [
  generateComposite({ id: "media-composite-now-playing", domain, nodes: [
    { type: "leaf", component: "Image", width: 60, height: 60, props: { src: "https://via.placeholder.com/150", alt: "album", borderRadius: 8 }},
    { type: "leaf", component: "Text", props: { fontSize: 16, fontWeight: 600, color: "#000000" }, content: "Blinding Lights" },
    { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 400, color: "#8E8E93" }, content: "The Weeknd" },
  ], visualComplexity: "medium", size: "medium", tags: ["now-playing"] }),
  generateComposite({ id: "media-composite-playback-controls", domain, nodes: [
    { type: "leaf", component: "Icon", props: { name: "sf:backward.fill", size: 20, color: "#000000" }},
    { type: "leaf", component: "Icon", props: { name: "sf:play.fill", size: 32, color: "#000000" }},
    { type: "leaf", component: "Icon", props: { name: "sf:forward.fill", size: 20, color: "#000000" }},
  ], visualComplexity: "simple", size: "medium", tags: ["controls"] }),
  generateComposite({ id: "media-composite-time-progress", domain, nodes: [
    { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 500, color: "#8E8E93" }, content: "1:32" },
    { type: "leaf", component: "ProgressBar", width: 200, height: 4, props: { progress: 0.4, color: "#FF3B30", backgroundColor: "#E5E5EA" }},
    { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 500, color: "#8E8E93" }, content: "3:45" },
  ], visualComplexity: "medium", size: "medium", tags: ["time", "progress"] }),
];

export const mediaComponents = [...mediaIcons, ...mediaText, ...mediaButtons, ...mediaImages, ...mediaDividers, ...mediaProgressBars, ...mediaComposites];
export const mediaComponentStats = { domain: "media", total: mediaComponents.length };
