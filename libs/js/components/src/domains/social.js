/**
 * Social domain component library
 * Components for social media, posts, likes, comments, and followers
 */

import {
  generateIcon, generateText, generateButton, generateImage, generateAppLogo,
  generateDivider, generateIndicator, generateProgressBar, generateComposite
} from "../generators.js";

const domain = "social";

export const socialIcons = [
  generateIcon({ id: "social-icon-heart-red-20", domain, iconName: "sf:heart.fill", size: 20, color: "#FF3B30", tags: ["like", "favorite"] }),
  generateIcon({ id: "social-icon-heart-gray-18", domain, iconName: "sf:heart", size: 18, color: "#8E8E93", tags: ["like"] }),
  generateIcon({ id: "social-icon-bubble-blue-20", domain, iconName: "sf:bubble.left.fill", size: 20, color: "#007AFF", tags: ["comment", "message"] }),
  generateIcon({ id: "social-icon-paperplane-blue-20", domain, iconName: "sf:paperplane.fill", size: 20, color: "#007AFF", tags: ["share", "send"] }),
  generateIcon({ id: "social-icon-bookmark-yellow-18", domain, iconName: "sf:bookmark.fill", size: 18, color: "#FFCC00", tags: ["save", "bookmark"] }),
  generateIcon({ id: "social-icon-person-gray-20", domain, iconName: "sf:person.fill", size: 20, color: "#8E8E93", tags: ["profile", "user"] }),
  generateIcon({ id: "social-icon-person-2-purple-20", domain, iconName: "sf:person.2.fill", size: 20, color: "#5856D6", tags: ["followers", "friends"] }),
  generateIcon({ id: "social-icon-person-add-blue-18", domain, iconName: "sf:person.badge.plus", size: 18, color: "#007AFF", tags: ["follow", "add"] }),
  generateIcon({ id: "social-icon-star-yellow-20", domain, iconName: "sf:star.fill", size: 20, color: "#FFCC00", tags: ["favorite", "featured"] }),
  generateIcon({ id: "social-icon-eye-gray-18", domain, iconName: "sf:eye.fill", size: 18, color: "#8E8E93", tags: ["views", "seen"] }),
  generateIcon({ id: "social-icon-checkmark-blue-16", domain, iconName: "sf:checkmark.seal.fill", size: 16, color: "#007AFF", tags: ["verified", "badge"] }),
  generateIcon({ id: "social-icon-photo-blue-20", domain, iconName: "sf:photo.fill", size: 20, color: "#007AFF", tags: ["photo", "media"] }),
];

export const socialText = [
  generateText({ id: "social-text-title-feed", domain, content: "Feed", fontSize: 18, fontWeight: 700, color: "#000000", tags: ["title"] }),
  generateText({ id: "social-text-title-profile", domain, content: "Profile", fontSize: 18, fontWeight: 700, color: "#000000", tags: ["title"] }),
  generateText({ id: "social-text-username-1", domain, content: "@johndoe", fontSize: 15, fontWeight: 600, color: "#007AFF", tags: ["username"] }),
  generateText({ id: "social-text-username-2", domain, content: "@janedoe", fontSize: 15, fontWeight: 600, color: "#007AFF", tags: ["username"] }),
  generateText({ id: "social-text-name-1", domain, content: "John Doe", fontSize: 16, fontWeight: 700, color: "#000000", tags: ["name"] }),
  generateText({ id: "social-text-name-2", domain, content: "Jane Smith", fontSize: 16, fontWeight: 700, color: "#000000", tags: ["name"] }),
  generateText({ id: "social-text-bio", domain, content: "Product designer & coffee lover ☕", fontSize: 13, fontWeight: 400, color: "#000000", tags: ["bio", "description"] }),
  generateText({ id: "social-text-post-1", domain, content: "Just finished an amazing project!", fontSize: 14, fontWeight: 400, color: "#000000", tags: ["post", "content"] }),
  generateText({ id: "social-text-post-2", domain, content: "Great day at the beach 🌊", fontSize: 14, fontWeight: 400, color: "#000000", tags: ["post", "content"] }),
  generateText({ id: "social-text-likes-125", domain, content: "125 likes", fontSize: 13, fontWeight: 600, color: "#000000", tags: ["likes", "engagement"] }),
  generateText({ id: "social-text-likes-1-2k", domain, content: "1.2K likes", fontSize: 13, fontWeight: 600, color: "#000000", tags: ["likes", "engagement"] }),
  generateText({ id: "social-text-comments-45", domain, content: "45 comments", fontSize: 13, fontWeight: 400, color: "#8E8E93", tags: ["comments"] }),
  generateText({ id: "social-text-views-850", domain, content: "850 views", fontSize: 12, fontWeight: 400, color: "#8E8E93", tags: ["views"] }),
  generateText({ id: "social-text-followers-2-5k", domain, content: "2.5K", fontSize: 16, fontWeight: 700, color: "#000000", tags: ["followers", "count"] }),
  generateText({ id: "social-text-following-342", domain, content: "342", fontSize: 16, fontWeight: 700, color: "#000000", tags: ["following", "count"] }),
  generateText({ id: "social-text-posts-128", domain, content: "128", fontSize: 16, fontWeight: 700, color: "#000000", tags: ["posts", "count"] }),
  generateText({ id: "social-text-label-followers", domain, content: "Followers", fontSize: 12, fontWeight: 400, color: "#8E8E93", tags: ["label"] }),
  generateText({ id: "social-text-label-following", domain, content: "Following", fontSize: 12, fontWeight: 400, color: "#8E8E93", tags: ["label"] }),
  generateText({ id: "social-text-label-posts", domain, content: "Posts", fontSize: 12, fontWeight: 400, color: "#8E8E93", tags: ["label"] }),
  generateText({ id: "social-text-time-2h", domain, content: "2h ago", fontSize: 12, fontWeight: 400, color: "#8E8E93", tags: ["time"] }),
  generateText({ id: "social-text-time-yesterday", domain, content: "Yesterday", fontSize: 12, fontWeight: 400, color: "#8E8E93", tags: ["time"] }),
  generateText({ id: "social-text-verified", domain, content: "Verified", fontSize: 11, fontWeight: 600, color: "#007AFF", tags: ["verified", "badge"] }),
];

export const socialButtons = [
  generateButton({ id: "social-button-follow", domain, label: "Follow", variant: "primary", size: "small", tags: ["action", "follow"] }),
  generateButton({ id: "social-button-following", domain, label: "Following", variant: "secondary", size: "small", tags: ["action", "unfollow"] }),
  generateButton({ id: "social-button-message", domain, label: "Message", variant: "secondary", size: "small", tags: ["action", "dm"] }),
  generateButton({ id: "social-button-share", domain, label: "Share", variant: "secondary", size: "small", tags: ["action", "share"] }),
  generateButton({ id: "social-button-edit-profile", domain, label: "Edit Profile", variant: "secondary", size: "medium", tags: ["action", "edit"] }),
];

export const socialImages = [
  generateImage({ id: "social-image-post-square", domain, width: 300, height: 300, borderRadius: 8, tags: ["post", "photo"] }),
  generateImage({ id: "social-image-story-circle", domain, width: 60, height: 60, borderRadius: 30, tags: ["story", "avatar"] }),
  generateImage({ id: "social-image-avatar-40", domain, width: 40, height: 40, borderRadius: 20, tags: ["avatar", "profile"] }),
];

export const socialLogos = [
  generateAppLogo({ id: "social-logo-user-1", domain, letter: "JD", size: 40, backgroundColor: "#007AFF", textColor: "#FFFFFF", tags: ["avatar", "profile"] }),
  generateAppLogo({ id: "social-logo-user-2", domain, letter: "JS", size: 50, backgroundColor: "#5856D6", textColor: "#FFFFFF", tags: ["avatar", "profile"] }),
];

export const socialDividers = [
  generateDivider({ id: "social-divider", domain, orientation: "horizontal", color: "#E5E5EA", thickness: 1, tags: ["separator"] }),
];

export const socialIndicators = [
  generateIndicator({ id: "social-indicator-red", domain, color: "#FF3B30", thickness: 3, height: "100%", tags: ["live", "active"] }),
  generateIndicator({ id: "social-indicator-blue", domain, color: "#007AFF", thickness: 3, height: "100%", tags: ["story", "unread"] }),
];

export const socialProgressBars = [
  generateProgressBar({ id: "social-progress-story", domain, progress: 0.5, width: 100, height: 2, color: "#FFFFFF", backgroundColor: "rgba(255,255,255,0.3)", tags: ["story", "progress"] }),
];

export const socialComposites = [
  generateComposite({
    id: "social-composite-post",
    domain,
    nodes: [
      { type: "leaf", component: "AppLogo", width: 40, height: 40, props: { letter: "JD", backgroundColor: "#007AFF", textColor: "#FFFFFF" }},
      { type: "leaf", component: "Text", props: { fontSize: 15, fontWeight: 600, color: "#000000" }, content: "John Doe" },
      { type: "leaf", component: "Text", props: { fontSize: 12, fontWeight: 400, color: "#8E8E93" }, content: "2h ago" },
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 400, color: "#000000" }, content: "Just finished an amazing project!" },
      { type: "leaf", component: "Icon", props: { name: "sf:heart.fill", size: 18, color: "#FF3B30" }},
      { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 600, color: "#000000" }, content: "125 likes" },
    ],
    visualComplexity: "medium",
    size: "medium",
    tags: ["post", "feed"]
  }),

  generateComposite({
    id: "social-composite-profile-stats",
    domain,
    nodes: [
      { type: "leaf", component: "Text", props: { fontSize: 16, fontWeight: 700, color: "#000000" }, content: "128" },
      { type: "leaf", component: "Text", props: { fontSize: 12, fontWeight: 400, color: "#8E8E93" }, content: "Posts" },
      { type: "leaf", component: "Text", props: { fontSize: 16, fontWeight: 700, color: "#000000" }, content: "2.5K" },
      { type: "leaf", component: "Text", props: { fontSize: 12, fontWeight: 400, color: "#8E8E93" }, content: "Followers" },
      { type: "leaf", component: "Text", props: { fontSize: 16, fontWeight: 700, color: "#000000" }, content: "342" },
      { type: "leaf", component: "Text", props: { fontSize: 12, fontWeight: 400, color: "#8E8E93" }, content: "Following" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["profile", "stats"]
  }),

  generateComposite({
    id: "social-composite-story",
    domain,
    nodes: [
      { type: "leaf", component: "Image", width: 60, height: 60, props: { borderRadius: 30 }},
      { type: "leaf", component: "Indicator", props: { color: "#007AFF", thickness: 3 }},
      { type: "leaf", component: "Text", props: { fontSize: 11, fontWeight: 400, color: "#8E8E93" }, content: "@johndoe" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["story", "avatar"]
  }),
];

export const socialComponents = [
  ...socialIcons,
  ...socialText,
  ...socialButtons,
  ...socialImages,
  ...socialLogos,
  ...socialDividers,
  ...socialIndicators,
  ...socialProgressBars,
  ...socialComposites,
];

export const socialComponentStats = {
  domain: "social",
  total: socialComponents.length,
  byCategory: {
    icon: socialIcons.length,
    text: socialText.length,
    button: socialButtons.length,
    image: socialImages.length,
    logo: socialLogos.length,
    divider: socialDividers.length,
    indicator: socialIndicators.length,
    progressBar: socialProgressBars.length,
    composite: socialComposites.length,
  },
};
