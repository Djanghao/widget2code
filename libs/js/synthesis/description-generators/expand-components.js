import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Component Expansion System
 * Automatically generates additional component variations for each domain
 */

const DOMAINS_DIR = path.join(__dirname, '../libs/js/components/src/domains');

/**
 * Expansion templates for each domain
 * Defines additional components to generate beyond what currently exists
 */
const expansionTemplates = {
  communication: {
    // Add 60+ more components
    icons: [
      { name: "paperplane.fill", sizes: [18, 20, 24], colors: ["#007AFF", "#34C759"], tags: ["send", "message"] },
      { name: "star.fill", sizes: [16, 20], colors: ["#FFCC00", "#FF9500"], tags: ["favorite", "starred"] },
      { name: "pin.fill", sizes: [16, 18], colors: ["#FF3B30", "#FF9500"], tags: ["pinned", "important"] },
      { name: "trash.fill", sizes: [18, 20], colors: ["#FF3B30", "#8E8E93"], tags: ["delete", "trash"] },
      { name: "archivebox.fill", sizes: [18, 20], colors: ["#007AFF", "#8E8E93"], tags: ["archive"] },
      { name: "flag.fill", sizes: [16, 18], colors: ["#FF9500", "#FF3B30"], tags: ["flag", "important"] },
      { name: "checkmark.circle.fill", sizes: [20, 24], colors: ["#34C759"], tags: ["read", "delivered"] },
      { name: "ellipsis.circle.fill", sizes: [20], colors: ["#8E8E93"], tags: ["more", "options"] },
    ],
    text: [
      { content: "Email", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["title"] },
      { content: "Inbox", fontSize: 18, fontWeight: 700, color: "#000000", tags: ["title"] },
      { content: "Sent", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["title"] },
      { content: "Drafts", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["title"] },
      { content: "Jane Smith", fontSize: 15, fontWeight: 600, color: "#000000", tags: ["contact", "name"] },
      { content: "Alex Johnson", fontSize: 15, fontWeight: 600, color: "#000000", tags: ["contact", "name"] },
      { content: "Sarah Williams", fontSize: 15, fontWeight: 600, color: "#000000", tags: ["contact", "name"] },
      { content: "Mike Brown", fontSize: 15, fontWeight: 600, color: "#000000", tags: ["contact", "name"] },
      { content: "Team Meeting Tomorrow", fontSize: 15, fontWeight: 500, color: "#000000", tags: ["subject", "email"] },
      { content: "Project Update", fontSize: 15, fontWeight: 500, color: "#000000", tags: ["subject"] },
      { content: "Lunch plans?", fontSize: 14, fontWeight: 400, color: "#8E8E93", tags: ["message", "preview"] },
      { content: "See you soon!", fontSize: 14, fontWeight: 400, color: "#8E8E93", tags: ["message", "preview"] },
      { content: "Thanks for your help", fontSize: 14, fontWeight: 400, color: "#8E8E93", tags: ["message", "preview"] },
      { content: "Can we reschedule?", fontSize: 14, fontWeight: 400, color: "#8E8E93", tags: ["message", "preview"] },
      { content: "9:45 AM", fontSize: 12, fontWeight: 400, color: "#8E8E93", tags: ["time"] },
      { content: "Yesterday", fontSize: 12, fontWeight: 400, color: "#8E8E93", tags: ["time"] },
      { content: "Monday", fontSize: 12, fontWeight: 400, color: "#8E8E93", tags: ["time", "date"] },
      { content: "Now", fontSize: 12, fontWeight: 600, color: "#007AFF", tags: ["time", "recent"] },
      { content: "5", fontSize: 13, fontWeight: 700, color: "#FFFFFF", tags: ["badge", "unread"] },
      { content: "12", fontSize: 13, fontWeight: 700, color: "#FFFFFF", tags: ["badge", "unread"] },
      { content: "New", fontSize: 11, fontWeight: 700, color: "#FF3B30", tags: ["label", "new"] },
      { content: "Unread", fontSize: 11, fontWeight: 600, color: "#007AFF", tags: ["label"] },
      { content: "Missed Call", fontSize: 13, fontWeight: 500, color: "#FF3B30", tags: ["call", "status"] },
      { content: "Incoming Call", fontSize: 13, fontWeight: 500, color: "#34C759", tags: ["call", "status"] },
      { content: "Voicemail", fontSize: 13, fontWeight: 500, color: "#5856D6", tags: ["voicemail"] },
      { content: "5 min", fontSize: 12, fontWeight: 400, color: "#8E8E93", tags: ["duration", "call"] },
      { content: "15 min", fontSize: 12, fontWeight: 400, color: "#8E8E93", tags: ["duration"] },
      { content: "Mobile", fontSize: 12, fontWeight: 400, color: "#8E8E93", tags: ["label", "phone"] },
      { content: "Home", fontSize: 12, fontWeight: 400, color: "#8E8E93", tags: ["label", "phone"] },
      { content: "Work", fontSize: 12, fontWeight: 400, color: "#8E8E93", tags: ["label", "phone"] },
    ],
    buttons: [
      { label: "Send", variant: "primary", size: "small", tags: ["action", "send"] },
      { label: "Delete", variant: "secondary", size: "small", tags: ["action", "delete"] },
      { label: "Archive", variant: "secondary", size: "small", tags: ["action", "archive"] },
      { label: "Forward", variant: "secondary", size: "small", tags: ["action", "forward"] },
      { label: "Compose", variant: "primary", size: "medium", tags: ["action", "new"] },
      { label: "Video Call", variant: "primary", size: "small", tags: ["action", "video"] },
      { label: "Accept", variant: "primary", size: "medium", tags: ["action", "call"] },
      { label: "Decline", variant: "secondary", size: "medium", tags: ["action", "call"] },
    ],
  },

  // Add similar expansions for other domains...
  media: {
    icons: [
      { name: "speaker.wave.1.fill", sizes: [18, 20], colors: ["#000000", "#8E8E93"], tags: ["volume", "low"] },
      { name: "speaker.wave.3.fill", sizes: [20, 24], colors: ["#000000"], tags: ["volume", "high"] },
      { name: "speaker.slash.fill", sizes: [20], colors: ["#FF3B30"], tags: ["mute", "volume"] },
      { name: "shuffle", sizes: [20, 24], colors: ["#007AFF", "#8E8E93"], tags: ["shuffle"] },
      { name: "repeat", sizes: [20], colors: ["#007AFF", "#8E8E93"], tags: ["repeat"] },
      { name: "heart.fill", sizes: [20, 24], colors: ["#FF3B30"], tags: ["favorite", "like"] },
      { name: "heart", sizes: [20], colors: ["#8E8E93"], tags: ["favorite"] },
      { name: "plus.circle.fill", sizes: [24, 28], colors: ["#007AFF"], tags: ["add", "playlist"] },
      { name: "ellipsis", sizes: [20], colors: ["#8E8E93"], tags: ["more", "options"] },
      { name: "airpodspro", sizes: [24], colors: ["#000000"], tags: ["airpods", "audio"] },
    ],
    text: [
      { content: "Now Playing", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["title"] },
      { content: "Recently Played", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["title"] },
      { content: "My Playlist", fontSize: 18, fontWeight: 700, color: "#000000", tags: ["title", "playlist"] },
      { content: "Podcasts", fontSize: 16, fontWeight: 600, color: "#000000", tags: ["title"] },
      { content: "Levitating", fontSize: 18, fontWeight: 700, color: "#000000", tags: ["song"] },
      { content: "good 4 u", fontSize: 18, fontWeight: 600, color: "#000000", tags: ["song"] },
      { content: "Stay", fontSize: 17, fontWeight: 600, color: "#000000", tags: ["song"] },
      { content: "Dua Lipa", fontSize: 14, fontWeight: 400, color: "#8E8E93", tags: ["artist"] },
      { content: "Olivia Rodrigo", fontSize: 14, fontWeight: 400, color: "#8E8E93", tags: ["artist"] },
      { content: "The Kid LAROI, Justin Bieber", fontSize: 13, fontWeight: 400, color: "#8E8E93", tags: ["artist"] },
      { content: "Future Nostalgia", fontSize: 13, fontWeight: 400, color: "#8E8E93", tags: ["album"] },
      { content: "SOUR", fontSize: 13, fontWeight: 400, color: "#8E8E93", tags: ["album"] },
      { content: "Episode 42: The Future of AI", fontSize: 15, fontWeight: 500, color: "#000000", tags: ["podcast", "episode"] },
      { content: "Tech Talk Daily", fontSize: 14, fontWeight: 400, color: "#8E8E93", tags: ["podcast"] },
      { content: "0:00", fontSize: 12, fontWeight: 500, color: "#8E8E93", tags: ["time"] },
      { content: "2:15", fontSize: 13, fontWeight: 500, color: "#8E8E93", tags: ["time"] },
      { content: "4:32", fontSize: 13, fontWeight: 500, color: "#8E8E93", tags: ["time"] },
      { content: "45 min left", fontSize: 12, fontWeight: 400, color: "#8E8E93", tags: ["time", "remaining"] },
    ],
    buttons: [
      { label: "Like", variant: "secondary", size: "small", tags: ["action", "favorite"] },
      { label: "Add to Playlist", variant: "secondary", size: "small", tags: ["action", "playlist"] },
      { label: "Download", variant: "secondary", size: "small", tags: ["action", "download"] },
      { label: "Share", variant: "secondary", size: "small", tags: ["action", "share"] },
    ],
  },

  // Will add more domain expansions...
};

/**
 * Generate expanded icon components from template
 */
function generateIconExpansion(domain, iconTemplate) {
  const components = [];
  const { name, sizes, colors, tags } = iconTemplate;

  sizes.forEach(size => {
    colors.forEach((color, idx) => {
      const colorName = color === "#000000" ? "black" :
                       color === "#FFFFFF" ? "white" :
                       color === "#FF3B30" ? "red" :
                       color === "#34C759" ? "green" :
                       color === "#007AFF" ? "blue" :
                       color === "#FFCC00" ? "yellow" :
                       color === "#FF9500" ? "orange" :
                       color === "#5856D6" ? "purple" :
                       color === "#8E8E93" ? "gray" : "custom";

      const baseId = name.replace(/\./g, '-');
      const id = `${domain}-icon-${baseId}-${colorName}-${size}`;

      components.push(`  generateIcon({ id: "${id}", domain, iconName: "sf:${name}", size: ${size}, color: "${color}", tags: ${JSON.stringify(tags)} }),`);
    });
  });

  return components;
}

/**
 * Generate expanded text components from template
 */
function generateTextExpansion(domain, textTemplate) {
  const { content, fontSize, fontWeight, color, tags } = textTemplate;
  const sanitizedContent = content.replace(/'/g, "\\'");
  const baseId = content.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30);

  const id = `${domain}-text-${baseId}`;

  return `  generateText({ id: "${id}", domain, content: "${sanitizedContent}", fontSize: ${fontSize}, fontWeight: ${fontWeight}, color: "${color}", tags: ${JSON.stringify(tags)} }),`;
}

/**
 * Generate expanded button components from template
 */
function generateButtonExpansion(domain, buttonTemplate) {
  const { label, variant, size, tags } = buttonTemplate;
  const baseId = label.toLowerCase().replace(/\s+/g, '-');
  const id = `${domain}-button-${baseId}`;

  return `  generateButton({ id: "${id}", domain, label: "${label}", variant: "${variant}", size: "${size}", tags: ${JSON.stringify(tags)} }),`;
}

/**
 * Generate expansion code for a domain
 */
function generateExpansionCode(domain) {
  const template = expansionTemplates[domain];
  if (!template) {
    console.log(`  ⚠️  No expansion template for ${domain}`);
    return null;
  }

  let code = `\n// ============================================================================\n`;
  code += `// EXPANDED COMPONENTS (Auto-generated)\n`;
  code += `// ============================================================================\n\n`;

  // Icons
  if (template.icons) {
    code += `// Additional icons (${template.icons.length} templates)\n`;
    template.icons.forEach(iconTemplate => {
      const iconCode = generateIconExpansion(domain, iconTemplate);
      code += iconCode.join('\n') + '\n';
    });
    code += '\n';
  }

  // Text
  if (template.text) {
    code += `// Additional text (${template.text.length} components)\n`;
    template.text.forEach(textTemplate => {
      code += generateTextExpansion(domain, textTemplate) + '\n';
    });
    code += '\n';
  }

  // Buttons
  if (template.buttons) {
    code += `// Additional buttons (${template.buttons.length} components)\n`;
    template.buttons.forEach(buttonTemplate => {
      code += generateButtonExpansion(domain, buttonTemplate) + '\n';
    });
  }

  return code;
}

/**
 * Print expansion summary without writing files
 */
function printExpansionSummary() {
  console.log('📊 Component Expansion Summary\n');
  console.log('This script will generate additional components for:');
  console.log('='.repeat(60));

  Object.keys(expansionTemplates).forEach(domain => {
    const template = expansionTemplates[domain];
    let totalNew = 0;

    if (template.icons) {
      template.icons.forEach(t => {
        totalNew += t.sizes.length * t.colors.length;
      });
    }
    if (template.text) totalNew += template.text.length;
    if (template.buttons) totalNew += template.buttons.length;

    console.log(`${domain.padEnd(20)} +${totalNew.toString().padStart(3)} new components`);
  });

  console.log('='.repeat(60));
  console.log('\nTo apply these expansions, the generated code needs to be');
  console.log('manually added to the respective domain files.\n');
}

// Run the summary
printExpansionSummary();

// Export for potential import
export { expansionTemplates, generateExpansionCode };
