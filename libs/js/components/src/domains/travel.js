/**
 * Travel domain component library
 * Components for flights, hotels, bookings, trips, and destinations
 */

import {
  generateIcon,
  generateText,
  generateButton,
  generateImage,
  generateDivider,
  generateIndicator,
  generateProgressBar,
  generateBarChart,
  generateComposite,
} from "../generators.js";

const domain = "travel";

// ============================================================================
// ICONS (20 components)
// ============================================================================

export const travelIcons = [
  // Flights
  generateIcon({ id: "travel-icon-airplane-blue-24", domain, iconName: "sf:airplane", size: 24, color: "#007AFF", tags: ["flight", "plane"] }),
  generateIcon({ id: "travel-icon-airplane-departure-20", domain, iconName: "sf:airplane.departure", size: 20, color: "#34C759", tags: ["flight", "departure"] }),
  generateIcon({ id: "travel-icon-airplane-arrival-20", domain, iconName: "sf:airplane.arrival", size: 20, color: "#FF9500", tags: ["flight", "arrival"] }),
  generateIcon({ id: "travel-icon-airplane-circle-28", domain, iconName: "sf:airplane.circle.fill", size: 28, color: "#007AFF", tags: ["flight", "badge"] }),

  // Hotels & Accommodation
  generateIcon({ id: "travel-icon-building-blue-24", domain, iconName: "sf:building.2.fill", size: 24, color: "#007AFF", tags: ["hotel", "building"] }),
  generateIcon({ id: "travel-icon-bed-purple-20", domain, iconName: "sf:bed.double.fill", size: 20, color: "#5856D6", tags: ["hotel", "room"] }),
  generateIcon({ id: "travel-icon-house-fill-20", domain, iconName: "sf:house.fill", size: 20, color: "#FF9500", tags: ["accommodation", "home"] }),

  // Transportation
  generateIcon({ id: "travel-icon-car-blue-20", domain, iconName: "sf:car.fill", size: 20, color: "#007AFF", tags: ["car", "rental"] }),
  generateIcon({ id: "travel-icon-train-green-20", domain, iconName: "sf:tram.fill", size: 20, color: "#34C759", tags: ["train", "transit"] }),
  generateIcon({ id: "travel-icon-bus-orange-20", domain, iconName: "sf:bus.fill", size: 20, color: "#FF9500", tags: ["bus", "transit"] }),

  // Activities & Places
  generateIcon({ id: "travel-icon-map-red-24", domain, iconName: "sf:map.fill", size: 24, color: "#FF3B30", tags: ["map", "navigation"] }),
  generateIcon({ id: "travel-icon-location-red-20", domain, iconName: "sf:mappin.circle.fill", size: 20, color: "#FF3B30", tags: ["location", "place"] }),
  generateIcon({ id: "travel-icon-camera-gray-20", domain, iconName: "sf:camera.fill", size: 20, color: "#8E8E93", tags: ["photo", "tourist"] }),
  generateIcon({ id: "travel-icon-bag-blue-20", domain, iconName: "sf:bag.fill", size: 20, color: "#007AFF", tags: ["luggage", "baggage"] }),
  generateIcon({ id: "travel-icon-suitcase-purple-24", domain, iconName: "sf:suitcase.fill", size: 24, color: "#5856D6", tags: ["luggage", "travel"] }),

  // Booking & Check
  generateIcon({ id: "travel-icon-ticket-orange-20", domain, iconName: "sf:ticket.fill", size: 20, color: "#FF9500", tags: ["ticket", "booking"] }),
  generateIcon({ id: "travel-icon-checkmark-green-20", domain, iconName: "sf:checkmark.circle.fill", size: 20, color: "#34C759", tags: ["confirmed", "booked"] }),
  generateIcon({ id: "travel-icon-clock-gray-18", domain, iconName: "sf:clock.fill", size: 18, color: "#8E8E93", tags: ["time", "schedule"] }),
  generateIcon({ id: "travel-icon-calendar-blue-20", domain, iconName: "sf:calendar", size: 20, color: "#007AFF", tags: ["date", "calendar"] }),
  generateIcon({ id: "travel-icon-star-yellow-16", domain, iconName: "sf:star.fill", size: 16, color: "#FFCC00", tags: ["rating", "favorite"] }),
];

// ============================================================================
// TEXT (25 components)
// ============================================================================

export const travelText = [
  // Titles
  generateText({ id: "travel-text-title-my-trips", domain, content: "My Trips", fontSize: 18, fontWeight: 700, color: "#000000", tags: ["title"] }),
  generateText({ id: "travel-text-title-upcoming", domain, content: "Upcoming", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["title"] }),
  generateText({ id: "travel-text-title-flight", domain, content: "Flight", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["title"] }),
  generateText({ id: "travel-text-title-hotel", domain, content: "Hotel", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["title"] }),

  // Destinations
  generateText({ id: "travel-text-dest-new-york", domain, content: "New York", fontSize: 20, fontWeight: 700, color: "#000000", tags: ["destination", "city"] }),
  generateText({ id: "travel-text-dest-london", domain, content: "London", fontSize: 20, fontWeight: 700, color: "#000000", tags: ["destination", "city"] }),
  generateText({ id: "travel-text-dest-tokyo", domain, content: "Tokyo", fontSize: 20, fontWeight: 700, color: "#000000", tags: ["destination", "city"] }),
  generateText({ id: "travel-text-dest-paris", domain, content: "Paris", fontSize: 20, fontWeight: 700, color: "#000000", tags: ["destination", "city"] }),

  // Flight details
  generateText({ id: "travel-text-flight-number", domain, content: "UA 1234", fontSize: 16, fontWeight: 600, color: "#007AFF", tags: ["flight", "number"] }),
  generateText({ id: "travel-text-airline", domain, content: "United Airlines", fontSize: 14, fontWeight: 500, color: "#000000", tags: ["airline"] }),
  generateText({ id: "travel-text-gate", domain, content: "Gate B12", fontSize: 14, fontWeight: 500, color: "#000000", tags: ["gate", "airport"] }),
  generateText({ id: "travel-text-seat", domain, content: "Seat 12A", fontSize: 13, fontWeight: 400, color: "#8E8E93", tags: ["seat"] }),
  generateText({ id: "travel-text-terminal", domain, content: "Terminal 3", fontSize: 13, fontWeight: 400, color: "#8E8E93", tags: ["terminal", "airport"] }),

  // Times & Duration
  generateText({ id: "travel-text-depart-time", domain, content: "10:30 AM", fontSize: 18, fontWeight: 600, color: "#000000", tags: ["time", "departure"] }),
  generateText({ id: "travel-text-arrive-time", domain, content: "2:45 PM", fontSize: 18, fontWeight: 600, color: "#000000", tags: ["time", "arrival"] }),
  generateText({ id: "travel-text-duration", domain, content: "4h 15m", fontSize: 14, fontWeight: 500, color: "#8E8E93", tags: ["duration", "time"] }),
  generateText({ id: "travel-text-boarding", domain, content: "Boarding: 9:45 AM", fontSize: 13, fontWeight: 500, color: "#FF9500", tags: ["boarding", "time"] }),

  // Hotel details
  generateText({ id: "travel-text-hotel-name", domain, content: "The Grand Hotel", fontSize: 17, fontWeight: 600, color: "#000000", tags: ["hotel", "name"] }),
  generateText({ id: "travel-text-hotel-address", domain, content: "123 Main St, Downtown", fontSize: 13, fontWeight: 400, color: "#8E8E93", tags: ["hotel", "address"] }),
  generateText({ id: "travel-text-check-in", domain, content: "Check-in: 3:00 PM", fontSize: 13, fontWeight: 500, color: "#000000", tags: ["check-in", "hotel"] }),
  generateText({ id: "travel-text-check-out", domain, content: "Check-out: 11:00 AM", fontSize: 13, fontWeight: 500, color: "#000000", tags: ["check-out", "hotel"] }),
  generateText({ id: "travel-text-nights", domain, content: "3 nights", fontSize: 13, fontWeight: 400, color: "#8E8E93", tags: ["duration", "hotel"] }),

  // Status & Info
  generateText({ id: "travel-text-on-time", domain, content: "On Time", fontSize: 13, fontWeight: 600, color: "#34C759", tags: ["status"] }),
  generateText({ id: "travel-text-delayed", domain, content: "Delayed", fontSize: 13, fontWeight: 600, color: "#FF3B30", tags: ["status"] }),
  generateText({ id: "travel-text-confirmed", domain, content: "Confirmed", fontSize: 12, fontWeight: 600, color: "#34C759", tags: ["status", "booking"] }),
];

// ============================================================================
// BUTTONS (8 components)
// ============================================================================

export const travelButtons = [
  generateButton({ id: "travel-button-check-in", domain, label: "Check In", variant: "primary", size: "medium", tags: ["action", "check-in"] }),
  generateButton({ id: "travel-button-view-ticket", domain, label: "View Ticket", variant: "secondary", size: "small", tags: ["action", "ticket"] }),
  generateButton({ id: "travel-button-get-directions", domain, label: "Directions", variant: "secondary", size: "small", tags: ["action", "navigation"] }),
  generateButton({ id: "travel-button-book-now", domain, label: "Book Now", variant: "primary", size: "medium", tags: ["action", "booking"] }),
  generateButton({ id: "travel-button-cancel", domain, label: "Cancel Trip", variant: "secondary", size: "small", tags: ["action", "cancel"] }),
  generateButton({ id: "travel-button-modify", domain, label: "Modify", variant: "secondary", size: "small", tags: ["action", "modify"] }),
  generateButton({ id: "travel-button-share-trip", domain, label: "Share Trip", variant: "secondary", size: "small", tags: ["action", "share"] }),
  generateButton({ id: "travel-button-add-to-calendar", domain, label: "Add to Calendar", variant: "secondary", size: "small", tags: ["action", "calendar"] }),
];

// ============================================================================
// IMAGES (3 components)
// ============================================================================

export const travelImages = [
  generateImage({ id: "travel-image-destination-large", domain, width: 300, height: 200, borderRadius: 12, tags: ["destination", "photo"] }),
  generateImage({ id: "travel-image-hotel-medium", domain, width: 200, height: 150, borderRadius: 8, tags: ["hotel", "photo"] }),
  generateImage({ id: "travel-image-thumbnail-small", domain, width: 60, height: 60, borderRadius: 8, tags: ["thumbnail"] }),
];

// ============================================================================
// DIVIDERS (2 components)
// ============================================================================

export const travelDividers = [
  generateDivider({ id: "travel-divider-horizontal", domain, orientation: "horizontal", color: "#E5E5EA", thickness: 1, tags: ["separator"] }),
  generateDivider({ id: "travel-divider-dashed", domain, orientation: "horizontal", type: "dashed", color: "#C7C7CC", thickness: 1, tags: ["separator"] }),
];

// ============================================================================
// INDICATORS (3 components)
// ============================================================================

export const travelIndicators = [
  generateIndicator({ id: "travel-indicator-blue", domain, color: "#007AFF", thickness: 4, height: "100%", tags: ["status", "flight"] }),
  generateIndicator({ id: "travel-indicator-green", domain, color: "#34C759", thickness: 4, height: "100%", tags: ["status", "confirmed"] }),
  generateIndicator({ id: "travel-indicator-orange", domain, color: "#FF9500", thickness: 4, height: "100%", tags: ["status", "pending"] }),
];

// ============================================================================
// PROGRESS BARS (2 components)
// ============================================================================

export const travelProgressBars = [
  generateProgressBar({ id: "travel-progress-trip", domain, progress: 0.6, width: 200, height: 6, color: "#007AFF", backgroundColor: "#E5E5EA", tags: ["progress", "trip"] }),
  generateProgressBar({ id: "travel-progress-booking", domain, progress: 0.8, width: 180, height: 4, color: "#34C759", backgroundColor: "#E5E5EA", tags: ["progress", "booking"] }),
];

// ============================================================================
// CHARTS (2 components)
// ============================================================================

export const travelCharts = [
  generateBarChart({ id: "travel-chart-expenses", domain, data: [500, 750, 600, 900], labels: ["Flight", "Hotel", "Food", "Activities"], color: "#007AFF", width: 250, height: 120, tags: ["chart", "expenses"] }),
  generateBarChart({ id: "travel-chart-monthly-trips", domain, data: [2, 3, 1, 4], labels: ["Jan", "Feb", "Mar", "Apr"], color: "#FF9500", width: 200, height: 100, tags: ["chart", "trips"] }),
];

// ============================================================================
// COMPOSITE COMPONENTS (5 components)
// ============================================================================

export const travelComposites = [
  generateComposite({
    id: "travel-composite-flight-card",
    domain,
    nodes: [
      { type: "leaf", component: "Icon", props: { name: "sf:airplane.departure", size: 24, color: "#007AFF" }},
      { type: "leaf", component: "Text", props: { fontSize: 16, fontWeight: 600, color: "#000000" }, content: "UA 1234" },
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 400, color: "#8E8E93" }, content: "New York → London" },
      { type: "leaf", component: "Text", props: { fontSize: 18, fontWeight: 600, color: "#000000" }, content: "10:30 AM" },
    ],
    visualComplexity: "medium",
    size: "medium",
    tags: ["flight", "card"]
  }),

  generateComposite({
    id: "travel-composite-hotel-booking",
    domain,
    nodes: [
      { type: "leaf", component: "Image", width: 80, height: 60, props: { borderRadius: 8 }},
      { type: "leaf", component: "Text", props: { fontSize: 16, fontWeight: 600, color: "#000000" }, content: "The Grand Hotel" },
      { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 400, color: "#8E8E93" }, content: "3 nights • Check-in Mar 15" },
      { type: "leaf", component: "Icon", props: { name: "sf:star.fill", size: 14, color: "#FFCC00" }},
    ],
    visualComplexity: "medium",
    size: "medium",
    tags: ["hotel", "booking"]
  }),

  generateComposite({
    id: "travel-composite-itinerary-item",
    domain,
    nodes: [
      { type: "leaf", component: "Indicator", props: { color: "#007AFF", thickness: 4 }},
      { type: "leaf", component: "Text", props: { fontSize: 12, fontWeight: 600, color: "#8E8E93" }, content: "10:30 AM" },
      { type: "leaf", component: "Icon", props: { name: "sf:mappin.circle.fill", size: 20, color: "#FF3B30" }},
      { type: "leaf", component: "Text", props: { fontSize: 15, fontWeight: 500, color: "#000000" }, content: "Visit Eiffel Tower" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["itinerary", "activity"]
  }),

  generateComposite({
    id: "travel-composite-boarding-pass",
    domain,
    nodes: [
      { type: "leaf", component: "Text", props: { fontSize: 16, fontWeight: 700, color: "#000000" }, content: "BOARDING PASS" },
      { type: "leaf", component: "Text", props: { fontSize: 24, fontWeight: 700, color: "#007AFF" }, content: "UA 1234" },
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 400, color: "#8E8E93" }, content: "Gate B12 • Seat 12A" },
      { type: "leaf", component: "Text", props: { fontSize: 18, fontWeight: 600, color: "#000000" }, content: "10:30 AM" },
    ],
    visualComplexity: "medium",
    size: "large",
    tags: ["boarding-pass", "flight"]
  }),

  generateComposite({
    id: "travel-composite-trip-summary",
    domain,
    nodes: [
      { type: "leaf", component: "Icon", props: { name: "sf:suitcase.fill", size: 28, color: "#5856D6" }},
      { type: "leaf", component: "Text", props: { fontSize: 18, fontWeight: 700, color: "#000000" }, content: "Paris Trip" },
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 400, color: "#8E8E93" }, content: "Mar 15-20, 2024 • 5 days" },
      { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 600, color: "#34C759" }, content: "Confirmed" },
    ],
    visualComplexity: "simple",
    size: "medium",
    tags: ["trip", "summary"]
  }),
];

// ============================================================================
// EXPORTS
// ============================================================================

export const travelComponents = [
  ...travelIcons,
  ...travelText,
  ...travelButtons,
  ...travelImages,
  ...travelDividers,
  ...travelIndicators,
  ...travelProgressBars,
  ...travelCharts,
  ...travelComposites,
];

export const travelComponentStats = {
  domain: "travel",
  total: travelComponents.length,
  byCategory: {
    icon: travelIcons.length,
    text: travelText.length,
    button: travelButtons.length,
    image: travelImages.length,
    divider: travelDividers.length,
    indicator: travelIndicators.length,
    progressBar: travelProgressBars.length,
    chart: travelCharts.length,
    composite: travelComposites.length,
  },
};
