/**
 * Icon Library Utilities
 * Validates icon names in Widget DSL format (prefix:IconName)
 * Icons are rendered using the Icon primitive component which handles lazy loading
 */

// Supported react-icons library prefixes
// Widget DSL uses format: "prefix:IconName" (e.g., "lu:LuHeart", "pi:PiHeartBold")
// The import path is always "react-icons/{prefix}"
const SUPPORTED_ICON_LIBRARIES = new Set([
  "lu", // Lucide Icons
  "ai", // Ant Design Icons
  "bi", // BoxIcons
  "bs", // Bootstrap Icons
  "cg", // CSS.gg
  "ci", // Circum Icons
  "di", // Devicons
  "fa", // Font Awesome 5
  "fa6", // Font Awesome 6
  "fc", // Flat Color Icons
  "fi", // Feather Icons
  "gi", // Game Icons
  "go", // GitHub Octicons
  "gr", // Grommet Icons
  "hi", // Heroicons v1
  "hi2", // Heroicons v2
  "im", // IcoMoon Free
  "io", // Ionicons 4
  "io5", // Ionicons 5
  "lia", // Line Awesome
  "md", // Material Design Icons
  "pi", // Phosphor Icons
  "rx", // Radix Icons
  "ri", // Remix Icons
  "si", // Simple Icons
  "sl", // Simple Line Icons
  "tb", // Tabler Icons
  "tfi", // Themify Icons
  "ti", // Typicons
  "vsc", // VS Code Icons
  "wi", // Weather Icons
]);

/**
 * Parse icon name in format "prefix:IconName" and validate
 * Used by compiler to detect Icon components in Widget DSL
 * @param {string} iconName - The icon name to parse (e.g., "lu:LuHeart")
 * @returns {Object} - Parsed icon information with isIcon flag
 */
export function parseIconName(iconName) {
  if (!iconName || typeof iconName !== "string") {
    return { isIcon: false };
  }

  const colonIndex = iconName.indexOf(":");
  if (colonIndex === -1) {
    return { isIcon: false };
  }

  const library = iconName.substring(0, colonIndex);
  const name = iconName.substring(colonIndex + 1);

  if (!SUPPORTED_ICON_LIBRARIES.has(library) || !name) {
    return { isIcon: false };
  }

  return {
    isIcon: true,
    library,
    name,
  };
}
