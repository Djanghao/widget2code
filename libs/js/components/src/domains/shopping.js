/**
 * Shopping domain component library
 * Components for e-commerce, orders, products, and shopping lists
 */

import {
  generateIcon, generateText, generateButton, generateImage, generateDivider,
  generateIndicator, generateProgressBar, generateComposite
} from "../generators.js";

const domain = "shopping";

export const shoppingIcons = [
  generateIcon({ id: "shopping-icon-cart-blue-24", domain, iconName: "sf:cart.fill", size: 24, color: "#007AFF", tags: ["cart"] }),
  generateIcon({ id: "shopping-icon-bag-orange-20", domain, iconName: "sf:bag.fill", size: 20, color: "#FF9500", tags: ["shopping"] }),
  generateIcon({ id: "shopping-icon-creditcard-green-20", domain, iconName: "sf:creditcard.fill", size: 20, color: "#34C759", tags: ["payment"] }),
  generateIcon({ id: "shopping-icon-tag-red-18", domain, iconName: "sf:tag.fill", size: 18, color: "#FF3B30", tags: ["sale", "price"] }),
  generateIcon({ id: "shopping-icon-gift-purple-20", domain, iconName: "sf:gift.fill", size: 20, color: "#5856D6", tags: ["gift"] }),
  generateIcon({ id: "shopping-icon-star-yellow-16", domain, iconName: "sf:star.fill", size: 16, color: "#FFCC00", tags: ["rating"] }),
  generateIcon({ id: "shopping-icon-heart-red-20", domain, iconName: "sf:heart.fill", size: 20, color: "#FF3B30", tags: ["wishlist", "favorite"] }),
  generateIcon({ id: "shopping-icon-box-brown-20", domain, iconName: "sf:shippingbox.fill", size: 20, color: "#8B4513", tags: ["delivery", "package"] }),
  generateIcon({ id: "shopping-icon-truck-blue-20", domain, iconName: "sf:truck.box.fill", size: 20, color: "#007AFF", tags: ["shipping", "delivery"] }),
  generateIcon({ id: "shopping-icon-checkmark-green-20", domain, iconName: "sf:checkmark.circle.fill", size: 20, color: "#34C759", tags: ["delivered"] }),
];

export const shoppingText = [
  generateText({ id: "shopping-text-title-cart", domain, content: "Shopping Cart", fontSize: 18, fontWeight: 700, color: "#000000", tags: ["title"] }),
  generateText({ id: "shopping-text-title-orders", domain, content: "My Orders", fontSize: 18, fontWeight: 700, color: "#000000", tags: ["title"] }),
  generateText({ id: "shopping-text-product-1", domain, content: "Wireless Headphones", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["product"] }),
  generateText({ id: "shopping-text-product-2", domain, content: "Smart Watch", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["product"] }),
  generateText({ id: "shopping-text-price-99", domain, content: "$99.99", fontSize: 18, fontWeight: 700, color: "#000000", tags: ["price"] }),
  generateText({ id: "shopping-text-price-149", domain, content: "$149.00", fontSize: 18, fontWeight: 700, color: "#000000", tags: ["price"] }),
  generateText({ id: "shopping-text-sale-price", domain, content: "$79.99", fontSize: 18, fontWeight: 700, color: "#FF3B30", tags: ["price", "sale"] }),
  generateText({ id: "shopping-text-original-price", domain, content: "$99.99", fontSize: 14, fontWeight: 400, color: "#8E8E93", tags: ["price", "original"] }),
  generateText({ id: "shopping-text-save-20", domain, content: "Save $20", fontSize: 12, fontWeight: 600, color: "#FF3B30", tags: ["discount", "save"] }),
  generateText({ id: "shopping-text-qty-1", domain, content: "Qty: 1", fontSize: 13, fontWeight: 400, color: "#8E8E93", tags: ["quantity"] }),
  generateText({ id: "shopping-text-in-stock", domain, content: "In Stock", fontSize: 12, fontWeight: 600, color: "#34C759", tags: ["stock", "status"] }),
  generateText({ id: "shopping-text-out-stock", domain, content: "Out of Stock", fontSize: 12, fontWeight: 600, color: "#FF3B30", tags: ["stock", "status"] }),
  generateText({ id: "shopping-text-free-shipping", domain, content: "Free Shipping", fontSize: 12, fontWeight: 600, color: "#34C759", tags: ["shipping"] }),
  generateText({ id: "shopping-text-delivered", domain, content: "Delivered", fontSize: 13, fontWeight: 600, color: "#34C759", tags: ["status"] }),
  generateText({ id: "shopping-text-shipped", domain, content: "Shipped", fontSize: 13, fontWeight: 600, color: "#007AFF", tags: ["status"] }),
  generateText({ id: "shopping-text-order-number", domain, content: "Order #12345", fontSize: 14, fontWeight: 600, color: "#000000", tags: ["order"] }),
  generateText({ id: "shopping-text-total", domain, content: "Total: $249.98", fontSize: 16, fontWeight: 700, color: "#000000", tags: ["total", "price"] }),
  generateText({ id: "shopping-text-rating-4-5", domain, content: "4.5", fontSize: 14, fontWeight: 600, color: "#000000", tags: ["rating"] }),
  generateText({ id: "shopping-text-reviews", domain, content: "(248 reviews)", fontSize: 12, fontWeight: 400, color: "#8E8E93", tags: ["reviews"] }),
];

export const shoppingButtons = [
  generateButton({ id: "shopping-button-add-cart", domain, label: "Add to Cart", variant: "primary", size: "medium", tags: ["action"] }),
  generateButton({ id: "shopping-button-buy-now", domain, label: "Buy Now", variant: "primary", size: "medium", tags: ["action"] }),
  generateButton({ id: "shopping-button-checkout", domain, label: "Checkout", variant: "primary", size: "medium", tags: ["action"] }),
  generateButton({ id: "shopping-button-track-order", domain, label: "Track Order", variant: "secondary", size: "small", tags: ["action"] }),
  generateButton({ id: "shopping-button-wishlist", domain, label: "Add to Wishlist", variant: "secondary", size: "small", tags: ["action"] }),
];

export const shoppingImages = [
  generateImage({ id: "shopping-image-product-large", domain, width: 200, height: 200, borderRadius: 8, tags: ["product"] }),
  generateImage({ id: "shopping-image-product-thumbnail", domain, width: 80, height: 80, borderRadius: 6, tags: ["product", "thumbnail"] }),
];

export const shoppingDividers = [
  generateDivider({ id: "shopping-divider", domain, orientation: "horizontal", color: "#E5E5EA", thickness: 1, tags: ["separator"] }),
];

export const shoppingIndicators = [
  generateIndicator({ id: "shopping-indicator-sale", domain, color: "#FF3B30", thickness: 4, height: "100%", tags: ["sale"] }),
  generateIndicator({ id: "shopping-indicator-new", domain, color: "#007AFF", thickness: 4, height: "100%", tags: ["new"] }),
];

export const shoppingProgressBars = [
  generateProgressBar({ id: "shopping-progress-delivery", domain, progress: 0.75, width: 200, height: 4, color: "#007AFF", backgroundColor: "#E5E5EA", tags: ["delivery"] }),
];

export const shoppingComposites = [
  generateComposite({
    id: "shopping-composite-product-card",
    domain,
    nodes: [
      { type: "leaf", component: "Image", width: 100, height: 100, props: { borderRadius: 8 }},
      { type: "leaf", component: "Text", props: { fontSize: 15, fontWeight: 600, color: "#000000" }, content: "Wireless Headphones" },
      { type: "leaf", component: "Text", props: { fontSize: 16, fontWeight: 700, color: "#000000" }, content: "$99.99" },
      { type: "leaf", component: "Icon", props: { name: "sf:star.fill", size: 14, color: "#FFCC00" }},
      { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 500, color: "#000000" }, content: "4.5" },
    ],
    visualComplexity: "medium",
    size: "medium",
    tags: ["product", "card"]
  }),

  generateComposite({
    id: "shopping-composite-cart-item",
    domain,
    nodes: [
      { type: "leaf", component: "Image", width: 60, height: 60, props: { borderRadius: 6 }},
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 500, color: "#000000" }, content: "Smart Watch" },
      { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 400, color: "#8E8E93" }, content: "Qty: 1" },
      { type: "leaf", component: "Text", props: { fontSize: 15, fontWeight: 600, color: "#000000" }, content: "$149.00" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["cart", "item"]
  }),
];

export const shoppingComponents = [
  ...shoppingIcons,
  ...shoppingText,
  ...shoppingButtons,
  ...shoppingImages,
  ...shoppingDividers,
  ...shoppingIndicators,
  ...shoppingProgressBars,
  ...shoppingComposites,
];

export const shoppingComponentStats = {
  domain: "shopping",
  total: shoppingComponents.length,
  byCategory: {
    icon: shoppingIcons.length,
    text: shoppingText.length,
    button: shoppingButtons.length,
    image: shoppingImages.length,
    divider: shoppingDividers.length,
    indicator: shoppingIndicators.length,
    progressBar: shoppingProgressBars.length,
    composite: shoppingComposites.length,
  },
};
