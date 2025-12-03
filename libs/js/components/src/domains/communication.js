/**
 * Communication domain component library
 * Expanded with 80+ components for messaging, calls, email, and social communication
 */

import {
  generateIcon,
  generateText,
  generateButton,
  generateImage,
  generateAppLogo,
  generateDivider,
  generateIndicator,
  generateSparkline,
  generateProgressBar,
  generateProgressRing,
  generateCheckbox,
  generateLineChart,
  generateBarChart,
  generatePieChart,
  generateComposite,
} from "../generators.js";

const domain = "communication";

// ============================================================================
// ICONS (25 components)
// ============================================================================

export const communicationIcons = [
  // Messages - various sizes and colors
  generateIcon({ id: "communication-icon-message-green-20", domain, iconName: "sf:message.fill", size: 20, color: "#34C759", tags: ["message", "sms"] }),
  generateIcon({ id: "communication-icon-message-blue-24", domain, iconName: "sf:message.fill", size: 24, color: "#007AFF", tags: ["message", "imessage"] }),
  generateIcon({ id: "communication-icon-message-gray-18", domain, iconName: "sf:message", size: 18, color: "#8E8E93", tags: ["message"] }),
  generateIcon({ id: "communication-icon-message-circle-green", domain, iconName: "sf:message.circle.fill", size: 32, color: "#34C759", tags: ["message", "badge"] }),
  generateIcon({ id: "communication-icon-bubble-left", domain, iconName: "sf:bubble.left.fill", size: 20, color: "#007AFF", tags: ["chat", "message"] }),

  // Calls - various states
  generateIcon({ id: "communication-icon-phone-blue-20", domain, iconName: "sf:phone.fill", size: 20, color: "#007AFF", tags: ["call", "phone"] }),
  generateIcon({ id: "communication-icon-phone-green-24", domain, iconName: "sf:phone.fill", size: 24, color: "#34C759", tags: ["call", "incoming"] }),
  generateIcon({ id: "communication-icon-phone-red-20", domain, iconName: "sf:phone.fill", size: 20, color: "#FF3B30", tags: ["call", "missed"] }),
  generateIcon({ id: "communication-icon-phone-down-red", domain, iconName: "sf:phone.down.fill", size: 20, color: "#FF3B30", tags: ["call", "decline"] }),
  generateIcon({ id: "communication-icon-phone-arrow-up", domain, iconName: "sf:phone.arrow.up.right", size: 18, color: "#34C759", tags: ["call", "outgoing"] }),
  generateIcon({ id: "communication-icon-phone-arrow-down", domain, iconName: "sf:phone.arrow.down.left", size: 18, color: "#007AFF", tags: ["call", "incoming"] }),

  // Video
  generateIcon({ id: "communication-icon-video-purple-20", domain, iconName: "sf:video.fill", size: 20, color: "#5856D6", tags: ["video", "facetime"] }),
  generateIcon({ id: "communication-icon-video-blue-24", domain, iconName: "sf:video.fill", size: 24, color: "#007AFF", tags: ["video"] }),
  generateIcon({ id: "communication-icon-video-circle", domain, iconName: "sf:video.circle.fill", size: 32, color: "#5856D6", tags: ["video", "badge"] }),

  // Email
  generateIcon({ id: "communication-icon-envelope-blue-20", domain, iconName: "sf:envelope.fill", size: 20, color: "#007AFF", tags: ["email", "mail"] }),
  generateIcon({ id: "communication-icon-envelope-gray-18", domain, iconName: "sf:envelope", size: 18, color: "#8E8E93", tags: ["email"] }),
  generateIcon({ id: "communication-icon-envelope-badge", domain, iconName: "sf:envelope.badge.fill", size: 24, color: "#FF3B30", tags: ["email", "unread"] }),
  generateIcon({ id: "communication-icon-envelope-open", domain, iconName: "sf:envelope.open.fill", size: 20, color: "#34C759", tags: ["email", "read"] }),

  // Contacts & People
  generateIcon({ id: "communication-icon-person-gray-18", domain, iconName: "sf:person.fill", size: 18, color: "#8E8E93", tags: ["contact", "person"] }),
  generateIcon({ id: "communication-icon-person-blue-24", domain, iconName: "sf:person.fill", size: 24, color: "#007AFF", tags: ["contact"] }),
  generateIcon({ id: "communication-icon-person-circle", domain, iconName: "sf:person.circle.fill", size: 32, color: "#007AFF", tags: ["contact", "profile"] }),
  generateIcon({ id: "communication-icon-person-2", domain, iconName: "sf:person.2.fill", size: 20, color: "#5856D6", tags: ["group", "contacts"] }),
  generateIcon({ id: "communication-icon-person-crop", domain, iconName: "sf:person.crop.circle.fill", size: 28, color: "#007AFF", tags: ["avatar", "profile"] }),

  // Additional
  generateIcon({ id: "communication-icon-bell-red", domain, iconName: "sf:bell.fill", size: 20, color: "#FF3B30", tags: ["notification", "alert"] }),
  generateIcon({ id: "communication-icon-bell-gray", domain, iconName: "sf:bell", size: 18, color: "#8E8E93", tags: ["notification"] }),
];

export const communicationText = [
  generateText({ id: "communication-text-title-messages", domain, content: "Messages", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["title"] }),
  generateText({ id: "communication-text-contact-name", domain, content: "John Doe", fontSize: 15, fontWeight: 600, color: "#000000", tags: ["contact"] }),
  generateText({ id: "communication-text-message-preview", domain, content: "Hey, how are you?", fontSize: 14, fontWeight: 400, color: "#8E8E93", tags: ["message"] }),
  generateText({ id: "communication-text-time", domain, content: "2:30 PM", fontSize: 12, fontWeight: 400, color: "#8E8E93", tags: ["time"] }),
  generateText({ id: "communication-text-unread-count", domain, content: "3", fontSize: 13, fontWeight: 600, color: "#FFFFFF", tags: ["badge"] }),
];

export const communicationButtons = [
  generateButton({ id: "communication-button-reply", domain, label: "Reply", variant: "primary", size: "small", tags: ["action"] }),
  generateButton({ id: "communication-button-call", domain, label: "Call", variant: "secondary", size: "small", tags: ["call"] }),
];

export const communicationImages = [
  generateImage({ id: "communication-image-avatar", domain, width: 40, height: 40, borderRadius: 20, tags: ["avatar"] }),
  generateAppLogo({ id: "communication-logo-contact", domain, letter: "JD", size: 40, backgroundColor: "#007AFF", textColor: "#FFFFFF", tags: ["contact", "avatar"] }),
];

export const communicationDividers = [
  generateDivider({ id: "communication-divider", domain, orientation: "horizontal", color: "#E5E5EA", thickness: 1, tags: ["separator"] }),
];

export const communicationComposites = [
  generateComposite({ id: "communication-composite-message-row", domain, nodes: [
    { type: "leaf", component: "Image", width: 40, height: 40, props: { src: "https://via.placeholder.com/150", alt: "avatar", borderRadius: 20 }},
    { type: "leaf", component: "Text", props: { fontSize: 15, fontWeight: 600, color: "#000000" }, content: "John Doe" },
    { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 400, color: "#8E8E93" }, content: "Hey, how are you?" },
    { type: "leaf", component: "Text", props: { fontSize: 12, fontWeight: 400, color: "#8E8E93" }, content: "2:30 PM" },
  ], visualComplexity: "medium", size: "medium", tags: ["message", "row"] }),
  generateComposite({ id: "communication-composite-contact-card", domain, nodes: [
    { type: "leaf", component: "AppLogo", width: 50, height: 50, props: { letter: "JD", backgroundColor: "#007AFF", textColor: "#FFFFFF" }},
    { type: "leaf", component: "Text", props: { fontSize: 16, fontWeight: 600, color: "#000000" }, content: "John Doe" },
    { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 400, color: "#8E8E93" }, content: "john@example.com" },
  ], visualComplexity: "simple", size: "medium", tags: ["contact", "card"] }),
];

export const communicationComponents = [...communicationIcons, ...communicationText, ...communicationButtons, ...communicationImages, ...communicationDividers, ...communicationComposites];
export const communicationComponentStats = { domain: "communication", total: communicationComponents.length };
