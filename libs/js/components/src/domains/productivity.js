/**
 * Productivity domain component library
 * Components for tasks, calendar, notes, reminders, and productivity tools
 */

import {
  generateIcon,
  generateText,
  generateButton,
  generateCheckbox,
  generateDivider,
  generateIndicator,
  generateProgressBar,
  generateBarChart,
  generatePieChart,
  generateComposite,
} from "../generators.js";

const domain = "productivity";

// Icons (8)
export const productivityIcons = [
  generateIcon({ id: "productivity-icon-checkmark", domain, iconName: "sf:checkmark.circle.fill", size: 24, color: "#34C759", tags: ["complete", "done"] }),
  generateIcon({ id: "productivity-icon-list", domain, iconName: "sf:list.bullet", size: 20, color: "#007AFF", tags: ["tasks", "list"] }),
  generateIcon({ id: "productivity-icon-calendar", domain, iconName: "sf:calendar", size: 20, color: "#FF3B30", tags: ["calendar", "date"] }),
  generateIcon({ id: "productivity-icon-note", domain, iconName: "sf:note.text", size: 20, color: "#FF9500", tags: ["note", "text"] }),
  generateIcon({ id: "productivity-icon-bell", domain, iconName: "sf:bell.fill", size: 20, color: "#5856D6", tags: ["reminder", "notification"] }),
  generateIcon({ id: "productivity-icon-flag", domain, iconName: "sf:flag.fill", size: 18, color: "#FF9500", tags: ["priority", "important"] }),
  generateIcon({ id: "productivity-icon-clock", domain, iconName: "sf:clock.fill", size: 20, color: "#007AFF", tags: ["time", "schedule"] }),
  generateIcon({ id: "productivity-icon-folder", domain, iconName: "sf:folder.fill", size: 20, color: "#007AFF", tags: ["project", "folder"] }),
];

// Text (12)
export const productivityText = [
  generateText({ id: "productivity-text-title-tasks", domain, content: "Tasks", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["title"] }),
  generateText({ id: "productivity-text-title-calendar", domain, content: "Calendar", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["title"] }),
  generateText({ id: "productivity-text-title-notes", domain, content: "Notes", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["title"] }),
  generateText({ id: "productivity-text-task-complete-project", domain, content: "Complete project proposal", fontSize: 15, fontWeight: 400, color: "#000000", tags: ["task"] }),
  generateText({ id: "productivity-text-task-review", domain, content: "Review code changes", fontSize: 15, fontWeight: 400, color: "#000000", tags: ["task"] }),
  generateText({ id: "productivity-text-task-meeting", domain, content: "Team meeting at 2 PM", fontSize: 15, fontWeight: 400, color: "#000000", tags: ["task", "meeting"] }),
  generateText({ id: "productivity-text-label-due", domain, content: "Due", fontSize: 12, fontWeight: 500, color: "#8E8E93", tags: ["label", "due-date"] }),
  generateText({ id: "productivity-text-label-priority", domain, content: "High Priority", fontSize: 12, fontWeight: 600, color: "#FF3B30", tags: ["label", "priority"] }),
  generateText({ id: "productivity-text-date-today", domain, content: "Today", fontSize: 14, fontWeight: 600, color: "#FF3B30", tags: ["date"] }),
  generateText({ id: "productivity-text-date-tomorrow", domain, content: "Tomorrow", fontSize: 14, fontWeight: 500, color: "#8E8E93", tags: ["date"] }),
  generateText({ id: "productivity-text-count-5-tasks", domain, content: "5 tasks", fontSize: 13, fontWeight: 500, color: "#8E8E93", tags: ["count"] }),
  generateText({ id: "productivity-text-time-2pm", domain, content: "2:00 PM", fontSize: 14, fontWeight: 500, color: "#000000", tags: ["time"] }),
];

// Buttons (4)
export const productivityButtons = [
  generateButton({ id: "productivity-button-add-task", domain, label: "Add Task", variant: "primary", size: "small", tags: ["action", "add"] }),
  generateButton({ id: "productivity-button-complete", domain, label: "Mark Complete", variant: "secondary", size: "small", tags: ["action", "complete"] }),
  generateButton({ id: "productivity-button-new-note", domain, label: "New Note", variant: "primary", size: "small", tags: ["action", "note"] }),
  generateButton({ id: "productivity-button-view-all", domain, label: "View All", variant: "secondary", size: "small", tags: ["action", "navigation"] }),
];

// Checkboxes (3)
export const productivityCheckboxes = [
  generateCheckbox({ id: "productivity-checkbox-complete", domain, checked: true, size: 20, tags: ["task", "complete"] }),
  generateCheckbox({ id: "productivity-checkbox-incomplete", domain, checked: false, size: 20, tags: ["task", "incomplete"] }),
  generateCheckbox({ id: "productivity-checkbox-partial", domain, checked: false, size: 18, tags: ["task"] }),
];

// Dividers (2)
export const productivityDividers = [
  generateDivider({ id: "productivity-divider-horizontal", domain, orientation: "horizontal", color: "#E5E5EA", thickness: 1, tags: ["separator"] }),
  generateDivider({ id: "productivity-divider-thin", domain, orientation: "horizontal", color: "#F2F2F7", thickness: 0.5, tags: ["separator", "subtle"] }),
];

// Indicators (3)
export const productivityIndicators = [
  generateIndicator({ id: "productivity-indicator-high-priority", domain, color: "#FF3B30", width: 4, height: 40, tags: ["priority", "high"] }),
  generateIndicator({ id: "productivity-indicator-medium-priority", domain, color: "#FF9500", width: 4, height: 40, tags: ["priority", "medium"] }),
  generateIndicator({ id: "productivity-indicator-low-priority", domain, color: "#34C759", width: 4, height: 40, tags: ["priority", "low"] }),
];

// Progress Bars (3)
export const productivityProgressBars = [
  generateProgressBar({ id: "productivity-progress-project", domain, progress: 0.65, width: 200, height: 8, color: "#007AFF", backgroundColor: "#E5E5EA", tags: ["project", "progress"] }),
  generateProgressBar({ id: "productivity-progress-tasks-complete", domain, progress: 0.8, width: 180, height: 6, color: "#34C759", backgroundColor: "#E5E5EA", tags: ["tasks", "completion"] }),
  generateProgressBar({ id: "productivity-progress-goal", domain, progress: 0.4, width: 150, height: 8, color: "#FF9500", backgroundColor: "#E5E5EA", tags: ["goal", "progress"] }),
];

// Charts (4)
export const productivityCharts = [
  generateBarChart({ id: "productivity-chart-tasks-weekly", domain, data: [5, 8, 6, 10, 7, 9, 8], width: 180, height: 80, color: "#007AFF", tags: ["tasks", "weekly"] }),
  generateBarChart({ id: "productivity-chart-hours-daily", domain, data: [6, 7.5, 6, 8, 7, 5, 4], width: 200, height: 90, color: "#34C759", tags: ["hours", "daily"] }),
  generatePieChart({ id: "productivity-chart-time-breakdown", domain, data: [40, 25, 20, 15], labels: ["Work", "Meetings", "Email", "Other"], size: 100, colors: ["#007AFF", "#5856D6", "#FF9500", "#8E8E93"], tags: ["time", "breakdown"] }),
  generatePieChart({ id: "productivity-chart-project-allocation", domain, data: [35, 30, 20, 15], labels: ["Project A", "Project B", "Project C", "Other"], size: 110, colors: ["#007AFF", "#34C759", "#FF9500", "#8E8E93"], tags: ["projects", "allocation"] }),
];

// Composites (12)
export const productivityComposites = [
  generateComposite({
    id: "productivity-composite-task-item",
    domain,
    nodes: [
      { type: "leaf", component: "Checkbox", props: { checked: false, size: 20 }},
      { type: "leaf", component: "Text", props: { fontSize: 15, fontWeight: 400, color: "#000000" }, content: "Complete project proposal" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["task", "item"],
  }),
  generateComposite({
    id: "productivity-composite-task-completed",
    domain,
    nodes: [
      { type: "leaf", component: "Checkbox", props: { checked: true, size: 20 }},
      { type: "leaf", component: "Text", props: { fontSize: 15, fontWeight: 400, color: "#8E8E93" }, content: "Review code changes" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["task", "complete"],
  }),
  generateComposite({
    id: "productivity-composite-task-priority",
    domain,
    nodes: [
      { type: "leaf", component: "Indicator", width: 4, height: 50, props: { color: "#FF3B30" }},
      { type: "leaf", component: "Checkbox", props: { checked: false, size: 20 }},
      { type: "leaf", component: "Text", props: { fontSize: 15, fontWeight: 400, color: "#000000" }, content: "Urgent: Submit report" },
      { type: "leaf", component: "Icon", props: { name: "sf:flag.fill", size: 16, color: "#FF3B30" }},
    ],
    visualComplexity: "medium",
    size: "medium",
    tags: ["task", "priority", "urgent"],
  }),
  generateComposite({
    id: "productivity-composite-calendar-event",
    domain,
    nodes: [
      { type: "leaf", component: "Icon", props: { name: "sf:calendar", size: 18, color: "#FF3B30" }},
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 600, color: "#000000" }, content: "Team Meeting" },
      { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 400, color: "#8E8E93" }, content: "2:00 PM - 3:00 PM" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["calendar", "event"],
  }),
  generateComposite({
    id: "productivity-composite-note-preview",
    domain,
    nodes: [
      { type: "leaf", component: "Icon", props: { name: "sf:note.text", size: 20, color: "#FF9500" }},
      { type: "leaf", component: "Text", props: { fontSize: 15, fontWeight: 600, color: "#000000" }, content: "Meeting Notes" },
      { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 400, color: "#8E8E93" }, content: "Discussion points and action items..." },
    ],
    visualComplexity: "simple",
    size: "medium",
    tags: ["note", "preview"],
  }),
  generateComposite({
    id: "productivity-composite-reminder",
    domain,
    nodes: [
      { type: "leaf", component: "Icon", props: { name: "sf:bell.fill", size: 18, color: "#5856D6" }},
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 500, color: "#000000" }, content: "Reminder" },
      { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 400, color: "#8E8E93" }, content: "Call client at 3 PM" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["reminder"],
  }),
  generateComposite({
    id: "productivity-composite-project-progress",
    domain,
    nodes: [
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 600, color: "#000000" }, content: "Project Alpha" },
      { type: "leaf", component: "ProgressBar", width: 180, height: 6, props: { progress: 0.65, color: "#007AFF", backgroundColor: "#E5E5EA" }},
      { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 500, color: "#8E8E93" }, content: "65% complete" },
    ],
    visualComplexity: "medium",
    size: "medium",
    tags: ["project", "progress"],
  }),
  generateComposite({
    id: "productivity-composite-due-date",
    domain,
    nodes: [
      { type: "leaf", component: "Icon", props: { name: "sf:clock.fill", size: 16, color: "#FF3B30" }},
      { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 500, color: "#FF3B30" }, content: "Due Today" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["due-date", "urgent"],
  }),
  generateComposite({
    id: "productivity-composite-task-count",
    domain,
    nodes: [
      { type: "leaf", component: "Icon", props: { name: "sf:list.bullet", size: 18, color: "#007AFF" }},
      { type: "leaf", component: "Text", props: { fontSize: 24, fontWeight: 600, color: "#000000" }, content: "12" },
      { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 500, color: "#8E8E93" }, content: "tasks pending" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["tasks", "count"],
  }),
  generateComposite({
    id: "productivity-composite-folder-item",
    domain,
    nodes: [
      { type: "leaf", component: "Icon", props: { name: "sf:folder.fill", size: 20, color: "#007AFF" }},
      { type: "leaf", component: "Text", props: { fontSize: 15, fontWeight: 500, color: "#000000" }, content: "Work Projects" },
      { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 400, color: "#8E8E93" }, content: "8 items" },
    ],
    visualComplexity: "simple",
    size: "small",
    tags: ["folder", "project"],
  }),
  generateComposite({
    id: "productivity-composite-time-block",
    domain,
    nodes: [
      { type: "leaf", component: "Text", props: { fontSize: 13, fontWeight: 600, color: "#8E8E93" }, content: "2:00 PM" },
      { type: "leaf", component: "Indicator", width: 4, height: 40, props: { color: "#007AFF" }},
      { type: "leaf", component: "Text", props: { fontSize: 15, fontWeight: 500, color: "#000000" }, content: "Team Meeting" },
    ],
    visualComplexity: "simple",
    size: "medium",
    tags: ["calendar", "time-block"],
  }),
  generateComposite({
    id: "productivity-composite-focus-timer",
    domain,
    nodes: [
      { type: "leaf", component: "Icon", props: { name: "sf:timer", size: 24, color: "#FF3B30" }},
      { type: "leaf", component: "Text", props: { fontSize: 32, fontWeight: 300, color: "#000000" }, content: "25:00" },
      { type: "leaf", component: "Text", props: { fontSize: 14, fontWeight: 500, color: "#8E8E93" }, content: "Focus Time" },
    ],
    visualComplexity: "medium",
    size: "medium",
    tags: ["timer", "focus", "pomodoro"],
  }),
];

export const productivityComponents = [
  ...productivityIcons,
  ...productivityText,
  ...productivityButtons,
  ...productivityCheckboxes,
  ...productivityDividers,
  ...productivityIndicators,
  ...productivityProgressBars,
  ...productivityCharts,
  ...productivityComposites,
];

export const productivityComponentStats = {
  domain: "productivity",
  total: productivityComponents.length,
  byCategory: {
    icon: productivityIcons.length,
    text: productivityText.length,
    button: productivityButtons.length,
    checkbox: productivityCheckboxes.length,
    divider: productivityDividers.length,
    indicator: productivityIndicators.length,
    progress: productivityProgressBars.length,
    chart: productivityCharts.length,
    composite: productivityComposites.length,
  },
};
