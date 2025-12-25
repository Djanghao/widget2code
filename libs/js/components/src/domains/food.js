/**
 * Food domain component library
 * Components for recipes, restaurants, nutrition, meal planning, and dining
 */

import {
  generateIcon,
  generateText,
  generateButton,
  generateImage,
  generateDivider,
  generateIndicator,
  generateProgressBar,
  generateProgressRing,
  generatePieChart,
  generateBarChart,
  generateComposite,
} from "../generators.js";

const domain = "food";

// ============================================================================
// ICONS (22 components)
// ============================================================================

export const foodIcons = [
  // Dining & Utensils
  generateIcon({ id: "food-icon-fork-knife-20", domain, iconName: "sf:fork.knife", size: 20, color: "#FF9500", tags: ["dining", "utensils"] }),
  generateIcon({ id: "food-icon-fork-knife-circle-28", domain, iconName: "sf:fork.knife.circle.fill", size: 28, color: "#FF9500", tags: ["dining", "badge"] }),

  // Food Types
  generateIcon({ id: "food-icon-cup-straw-20", domain, iconName: "sf:cup.and.saucer.fill", size: 20, color: "#8E8E93", tags: ["coffee", "drink"] }),
  generateIcon({ id: "food-icon-carrot-orange-20", domain, iconName: "sf:carrot.fill", size: 20, color: "#FF9500", tags: ["vegetable", "healthy"] }),
  generateIcon({ id: "food-icon-leaf-green-20", domain, iconName: "sf:leaf.fill", size: 20, color: "#34C759", tags: ["vegan", "vegetarian"] }),

  // Restaurant & Delivery
  generateIcon({ id: "food-icon-building-orange-24", domain, iconName: "sf:building.2.fill", size: 24, color: "#FF9500", tags: ["restaurant"] }),
  generateIcon({ id: "food-icon-bag-brown-20", domain, iconName: "sf:bag.fill", size: 20, color: "#8B4513", tags: ["takeout", "delivery"] }),
  generateIcon({ id: "food-icon-cart-blue-20", domain, iconName: "sf:cart.fill", size: 20, color: "#007AFF", tags: ["order", "shopping"] }),

  // Rating & Review
  generateIcon({ id: "food-icon-star-yellow-16", domain, iconName: "sf:star.fill", size: 16, color: "#FFCC00", tags: ["rating", "favorite"] }),
  generateIcon({ id: "food-icon-star-yellow-20", domain, iconName: "sf:star.fill", size: 20, color: "#FFCC00", tags: ["rating"] }),
  generateIcon({ id: "food-icon-star-gray-16", domain, iconName: "sf:star", size: 16, color: "#8E8E93", tags: ["rating"] }),
  generateIcon({ id: "food-icon-heart-red-20", domain, iconName: "sf:heart.fill", size: 20, color: "#FF3B30", tags: ["favorite", "like"] }),
  generateIcon({ id: "food-icon-heart-gray-18", domain, iconName: "sf:heart", size: 18, color: "#8E8E93", tags: ["favorite"] }),

  // Time & Cooking
  generateIcon({ id: "food-icon-timer-orange-20", domain, iconName: "sf:timer", size: 20, color: "#FF9500", tags: ["cooking", "time"] }),
  generateIcon({ id: "food-icon-clock-gray-18", domain, iconName: "sf:clock.fill", size: 18, color: "#8E8E93", tags: ["time"] }),
  generateIcon({ id: "food-icon-flame-red-20", domain, iconName: "sf:flame.fill", size: 20, color: "#FF3B30", tags: ["cooking", "heat", "calories"] }),

  // Location & Delivery
  generateIcon({ id: "food-icon-location-red-20", domain, iconName: "sf:mappin.circle.fill", size: 20, color: "#FF3B30", tags: ["location", "restaurant"] }),
  generateIcon({ id: "food-icon-bicycle-blue-20", domain, iconName: "sf:bicycle", size: 20, color: "#007AFF", tags: ["delivery"] }),
  generateIcon({ id: "food-icon-car-green-18", domain, iconName: "sf:car.fill", size: 18, color: "#34C759", tags: ["delivery", "drive"] }),

  // Misc
  generateIcon({ id: "food-icon-book-brown-20", domain, iconName: "sf:book.fill", size: 20, color: "#8B4513", tags: ["recipe", "cookbook"] }),
  generateIcon({ id: "food-icon-list-gray-20", domain, iconName: "sf:list.bullet", size: 20, color: "#8E8E93", tags: ["menu", "list"] }),
  generateIcon({ id: "food-icon-checkmark-green-18", domain, iconName: "sf:checkmark.circle.fill", size: 18, color: "#34C759", tags: ["complete", "done"] }),
];

// ============================================================================
// TEXT (30 components)
// ============================================================================

export const foodText = [
  // Titles & Headers
  generateText({ id: "food-text-title-recipes", domain, content: "Recipes", fontSize: 18, fontWeight: 700, color: "#000000", tags: ["title"] }),
  generateText({ id: "food-text-title-restaurants", domain, content: "Restaurants", fontSize: 18, fontWeight: 700, color: "#000000", tags: ["title"] }),
  generateText({ id: "food-text-title-my-meals", domain, content: "My Meals", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["title"] }),
  generateText({ id: "food-text-title-nutrition", domain, content: "Nutrition", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["title"] }),

  // Recipe Names
  generateText({ id: "food-text-recipe-pasta", domain, content: "Creamy Pasta Carbonara", fontSize: 17, fontWeight: 600, color: "#000000", tags: ["recipe", "name"] }),
  generateText({ id: "food-text-recipe-chicken", domain, content: "Grilled Chicken Salad", fontSize: 17, fontWeight: 600, color: "#000000", tags: ["recipe", "name"] }),
  generateText({ id: "food-text-recipe-tacos", domain, content: "Fish Tacos", fontSize: 17, fontWeight: 600, color: "#000000", tags: ["recipe", "name"] }),
  generateText({ id: "food-text-recipe-pizza", domain, content: "Margherita Pizza", fontSize: 17, fontWeight: 600, color: "#000000", tags: ["recipe", "name"] }),

  // Restaurant Names
  generateText({ id: "food-text-restaurant-1", domain, content: "The Italian Kitchen", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["restaurant", "name"] }),
  generateText({ id: "food-text-restaurant-2", domain, content: "Sushi Bar Tokyo", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["restaurant", "name"] }),
  generateText({ id: "food-text-restaurant-3", domain, content: "Burger Palace", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["restaurant", "name"] }),

  // Cuisines & Categories
  generateText({ id: "food-text-cuisine-italian", domain, content: "Italian", fontSize: 13, fontWeight: 500, color: "#8E8E93", tags: ["cuisine", "category"] }),
  generateText({ id: "food-text-cuisine-japanese", domain, content: "Japanese", fontSize: 13, fontWeight: 500, color: "#8E8E93", tags: ["cuisine", "category"] }),
  generateText({ id: "food-text-cuisine-mexican", domain, content: "Mexican", fontSize: 13, fontWeight: 500, color: "#8E8E93", tags: ["cuisine", "category"] }),
  generateText({ id: "food-text-category-breakfast", domain, content: "Breakfast", fontSize: 14, fontWeight: 600, color: "#FF9500", tags: ["category", "meal"] }),
  generateText({ id: "food-text-category-lunch", domain, content: "Lunch", fontSize: 14, fontWeight: 600, color: "#007AFF", tags: ["category", "meal"] }),
  generateText({ id: "food-text-category-dinner", domain, content: "Dinner", fontSize: 14, fontWeight: 600, color: "#5856D6", tags: ["category", "meal"] }),

  // Timing & Details
  generateText({ id: "food-text-time-15min", domain, content: "15 min", fontSize: 13, fontWeight: 500, color: "#8E8E93", tags: ["time", "duration"] }),
  generateText({ id: "food-text-time-30min", domain, content: "30 min", fontSize: 13, fontWeight: 500, color: "#8E8E93", tags: ["time", "duration"] }),
  generateText({ id: "food-text-time-1hour", domain, content: "1 hour", fontSize: 13, fontWeight: 500, color: "#8E8E93", tags: ["time", "duration"] }),
  generateText({ id: "food-text-servings-2", domain, content: "Serves 2", fontSize: 12, fontWeight: 400, color: "#8E8E93", tags: ["servings"] }),
  generateText({ id: "food-text-servings-4", domain, content: "Serves 4", fontSize: 12, fontWeight: 400, color: "#8E8E93", tags: ["servings"] }),

  // Nutrition
  generateText({ id: "food-text-calories-350", domain, content: "350 cal", fontSize: 14, fontWeight: 600, color: "#FF3B30", tags: ["calories", "nutrition"] }),
  generateText({ id: "food-text-calories-520", domain, content: "520 cal", fontSize: 14, fontWeight: 600, color: "#FF3B30", tags: ["calories", "nutrition"] }),
  generateText({ id: "food-text-protein", domain, content: "25g protein", fontSize: 12, fontWeight: 400, color: "#8E8E93", tags: ["nutrition", "protein"] }),
  generateText({ id: "food-text-carbs", domain, content: "45g carbs", fontSize: 12, fontWeight: 400, color: "#8E8E93", tags: ["nutrition", "carbs"] }),

  // Rating & Reviews
  generateText({ id: "food-text-rating-4-5", domain, content: "4.5", fontSize: 15, fontWeight: 600, color: "#000000", tags: ["rating"] }),
  generateText({ id: "food-text-reviews", domain, content: "(127 reviews)", fontSize: 12, fontWeight: 400, color: "#8E8E93", tags: ["reviews"] }),

  // Pricing
  generateText({ id: "food-text-price-$$", domain, content: "$$", fontSize: 13, fontWeight: 600, color: "#34C759", tags: ["price"] }),
  generateText({ id: "food-text-price-$$$", domain, content: "$$$", fontSize: 13, fontWeight: 600, color: "#FF9500", tags: ["price"] }),
];

// ============================================================================
// BUTTONS (10 components)
// ============================================================================

export const foodButtons = [
  generateButton({ id: "food-button-view-recipe", domain, label: "View Recipe", variant: "primary", size: "medium", tags: ["action", "recipe"] }),
  generateButton({ id: "food-button-start-cooking", domain, label: "Start Cooking", variant: "primary", size: "medium", tags: ["action", "cook"] }),
  generateButton({ id: "food-button-order-now", domain, label: "Order Now", variant: "primary", size: "medium", tags: ["action", "order"] }),
  generateButton({ id: "food-button-reserve", domain, label: "Reserve Table", variant: "primary", size: "small", tags: ["action", "reservation"] }),
  generateButton({ id: "food-button-save-recipe", domain, label: "Save", variant: "secondary", size: "small", tags: ["action", "save"] }),
  generateButton({ id: "food-button-share", domain, label: "Share", variant: "secondary", size: "small", tags: ["action", "share"] }),
  generateButton({ id: "food-button-directions", domain, label: "Get Directions", variant: "secondary", size: "small", tags: ["action", "navigation"] }),
  generateButton({ id: "food-button-call", domain, label: "Call", variant: "secondary", size: "small", tags: ["action", "phone"] }),
  generateButton({ id: "food-button-add-to-plan", domain, label: "Add to Meal Plan", variant: "secondary", size: "small", tags: ["action", "plan"] }),
  generateButton({ id: "food-button-rate", domain, label: "Rate", variant: "secondary", size: "small", tags: ["action", "review"] }),
];

// ============================================================================
// IMAGES (4 components)
// ============================================================================

export const foodImages = [
  generateImage({ id: "food-image-recipe-large", domain, width: 300, height: 200, borderRadius: 12, tags: ["recipe", "photo"] }),
  generateImage({ id: "food-image-dish-medium", domain, width: 150, height: 150, borderRadius: 10, tags: ["dish", "food"] }),
  generateImage({ id: "food-image-restaurant-card", domain, width: 120, height: 90, borderRadius: 8, tags: ["restaurant", "photo"] }),
  generateImage({ id: "food-image-thumbnail", domain, width: 60, height: 60, borderRadius: 8, tags: ["thumbnail"] }),
];

// ============================================================================
// DIVIDERS & INDICATORS (4 components)
// ============================================================================

export const foodDividers = [
  generateDivider({ id: "food-divider-horizontal", domain, orientation: "horizontal", color: "#E5E5EA", thickness: 1, tags: ["separator"] }),
  generateDivider({ id: "food-divider-light", domain, orientation: "horizontal", color: "#F0F0F0", thickness: 1, tags: ["separator"] }),
];

export const foodIndicators = [
  generateIndicator({ id: "food-indicator-orange", domain, color: "#FF9500", thickness: 4, height: "100%", tags: ["category"] }),
  generateIndicator({ id: "food-indicator-green", domain, color: "#34C759", thickness: 4, height: "100%", tags: ["healthy", "vegan"] }),
];

// ============================================================================
// PROGRESS & CHARTS (6 components)
// ============================================================================

export const foodProgressBars = [
  generateProgressBar({ id: "food-progress-calories", domain, progress: 0.7, width: 200, height: 6, color: "#FF3B30", backgroundColor: "#E5E5EA", tags: ["calories", "nutrition"] }),
  generateProgressBar({ id: "food-progress-protein", domain, progress: 0.85, width: 150, height: 4, color: "#007AFF", backgroundColor: "#E5E5EA", tags: ["protein", "nutrition"] }),
];

export const foodProgressRings = [
  generateProgressRing({ id: "food-ring-daily-calories", domain, value: 1450, goal: 2000, size: 100, color: "#FF9500", ringWidth: 12, tags: ["calories", "daily"] }),
  generateProgressRing({ id: "food-ring-macros", domain, value: 75, goal: 100, size: 80, color: "#34C759", ringWidth: 10, tags: ["nutrition", "macros"] }),
];

export const foodCharts = [
  generatePieChart({ id: "food-chart-macros", domain, data: [35, 45, 20], labels: ["Protein", "Carbs", "Fat"], colors: ["#007AFF", "#34C759", "#FF9500"], size: 120, tags: ["nutrition", "macros"] }),
  generateBarChart({ id: "food-chart-weekly-meals", domain, data: [3, 5, 4, 6, 4, 5, 3], labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], color: "#FF9500", width: 250, height: 100, tags: ["meals", "weekly"] }),
];

// ============================================================================
// COMPOSITE COMPONENTS (6 components)
// ============================================================================

export const foodComposites = [
  generateComposite({
    id: "food-composite-recipe-card",
    domain,
    nodes: [
      { type: "leaf", component: "Image", width: 120, height: 90, props: { borderRadius: 8 }},
      { type: "leaf", component: "Text", props: { fontSize: 16, fontWeight: 600, color: "#000000" }, content: "Creamy Pasta Carbonara" },
      { type: "leaf", component: "Icon", props: { name: "sf:timer", size: 16, color: "#8E8E93" }},
      { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 400, color: "#8E8E93" }, content: "30 min" },
      { type: "leaf", component: "Icon", props: { name: "sf:star.fill", size: 14, color: "#FFCC00" }},
      { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 500, color: "#000000" }, content: "4.5" },
    ],
    visualComplexity: "medium",
    size: "medium",
    tags: ["recipe", "card"]
  }),

  generateComposite({
    id: "food-composite-restaurant-card",
    domain,
    nodes: [
      { type: "leaf", component: "Image", width: 80, height: 60, props: { borderRadius: 8 }},
      { type: "leaf", component: "Text", props: { fontSize: 15, fontWeight: 600, color: "#000000" }, content: "The Italian Kitchen" },
      { type: "leaf", component: "Text", props: { fontSize: 12, fontWeight: 400, color: "#8E8E93" }, content: "Italian • $$" },
      { type: "leaf", component: "Icon", props: { name: "sf:star.fill", size: 14, color: "#FFCC00" }},
      { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 500, color: "#000000" }, content: "4.5 (127)" },
    ],
    visualComplexity: "medium",
    size: "medium",
    tags: ["restaurant", "card"]
  }),

  generateComposite({
    id: "food-composite-nutrition-facts",
    domain,
    nodes: [
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 700, color: "#000000" }, content: "NUTRITION FACTS" },
      { type: "leaf", component: "Text", props: { fontSize: 18, fontWeight: 700, color: "#FF3B30" }, content: "520 calories" },
      { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 400, color: "#8E8E93" }, content: "25g protein • 45g carbs • 18g fat" },
    ],
    visualComplexity: "simple",
    size: "medium",
    tags: ["nutrition", "facts"]
  }),

  generateComposite({
    id: "food-composite-meal-plan-item",
    domain,
    nodes: [
      { type: "leaf", component: "Indicator", props: { color: "#FF9500", thickness: 4 }},
      { type: "leaf", component: "Icon", props: { name: "sf:fork.knife", size: 20, color: "#FF9500" }},
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 600, color: "#000000" }, content: "Breakfast" },
      { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 400, color: "#8E8E93" }, content: "Avocado Toast • 350 cal" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["meal-plan", "item"]
  }),

  generateComposite({
    id: "food-composite-order-status",
    domain,
    nodes: [
      { type: "leaf", component: "Icon", props: { name: "sf:bag.fill", size: 24, color: "#FF9500" }},
      { type: "leaf", component: "Text", props: { fontSize: 16, fontWeight: 600, color: "#000000" }, content: "Order #1234" },
      { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 500, color: "#34C759" }, content: "On the way" },
      { type: "leaf", component: "Text", props: { fontSize: 12, fontWeight: 400, color: "#8E8E93" }, content: "Arriving in 15 min" },
    ],
    visualComplexity: "simple",
    size: "medium",
    tags: ["order", "delivery", "status"]
  }),

  generateComposite({
    id: "food-composite-ingredient-list",
    domain,
    nodes: [
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 600, color: "#000000" }, content: "Ingredients" },
      { type: "leaf", component: "Icon", props: { name: "sf:checkmark.circle.fill", size: 18, color: "#34C759" }},
      { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 400, color: "#000000" }, content: "2 cups pasta" },
      { type: "leaf", component: "Icon", props: { name: "sf:circle", size: 18, color: "#E5E5EA" }},
      { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 400, color: "#000000" }, content: "4 eggs" },
    ],
    visualComplexity: "medium",
    size: "medium",
    tags: ["ingredients", "list", "recipe"]
  }),
];

// ============================================================================
// EXPORTS
// ============================================================================

export const foodComponents = [
  ...foodIcons,
  ...foodText,
  ...foodButtons,
  ...foodImages,
  ...foodDividers,
  ...foodIndicators,
  ...foodProgressBars,
  ...foodProgressRings,
  ...foodCharts,
  ...foodComposites,
];

export const foodComponentStats = {
  domain: "food",
  total: foodComponents.length,
  byCategory: {
    icon: foodIcons.length,
    text: foodText.length,
    button: foodButtons.length,
    image: foodImages.length,
    divider: foodDividers.length,
    indicator: foodIndicators.length,
    progressBar: foodProgressBars.length,
    progressRing: foodProgressRings.length,
    chart: foodCharts.length,
    composite: foodComposites.length,
  },
};
