/**
 * Component registry for managing and querying domain components
 */

import { healthComponents, healthComponentStats } from "./domains/health.js";
import { financeComponents, financeComponentStats } from "./domains/finance.js";
import { weatherComponents, weatherComponentStats } from "./domains/weather.js";
import { productivityComponents, productivityComponentStats } from "./domains/productivity.js";
import { mediaComponents, mediaComponentStats } from "./domains/media.js";
import { communicationComponents, communicationComponentStats } from "./domains/communication.js";
import { smartHomeComponents, smartHomeComponentStats } from "./domains/smart-home.js";
import { navigationComponents, navigationComponentStats } from "./domains/navigation.js";
import { utilitiesComponents, utilitiesComponentStats } from "./domains/utilities.js";
import { sportsComponents, sportsComponentStats } from "./domains/sports.js";

/**
 * Component registry organized by domain
 */
export const componentRegistry = {
  health: healthComponents,
  finance: financeComponents,
  weather: weatherComponents,
  productivity: productivityComponents,
  media: mediaComponents,
  communication: communicationComponents,
  "smart-home": smartHomeComponents,
  navigation: navigationComponents,
  utilities: utilitiesComponents,
  sports: sportsComponents,
};

/**
 * Domain statistics
 */
export const domainStats = {
  health: healthComponentStats,
  finance: financeComponentStats,
  weather: weatherComponentStats,
  productivity: productivityComponentStats,
  media: mediaComponentStats,
  communication: communicationComponentStats,
  "smart-home": smartHomeComponentStats,
  navigation: navigationComponentStats,
  utilities: utilitiesComponentStats,
  sports: sportsComponentStats,
};

/**
 * Get all components across all domains
 */
export function getAllComponents() {
  return Object.values(componentRegistry).flat();
}

/**
 * Get components for a specific domain
 */
export function getComponentsByDomain(domain) {
  return componentRegistry[domain] || [];
}

/**
 * Get component by ID
 */
export function getComponentById(id) {
  const allComponents = getAllComponents();
  return allComponents.find((c) => c.id === id);
}

/**
 * Get components by category
 */
export function getComponentsByCategory(category) {
  const allComponents = getAllComponents();
  return allComponents.filter((c) => c.category === category);
}

/**
 * Get components by primitive type
 */
export function getComponentsByPrimitive(primitive) {
  const allComponents = getAllComponents();
  return allComponents.filter((c) => c.primitives.includes(primitive));
}

/**
 * Get components by semantic fit
 */
export function getComponentsBySemanticFit(semantic) {
  const allComponents = getAllComponents();
  return allComponents.filter((c) => c.metadata.semanticFit.includes(semantic));
}

/**
 * Get components by tag
 */
export function getComponentsByTag(tag) {
  const allComponents = getAllComponents();
  return allComponents.filter((c) => c.metadata.tags.includes(tag));
}

/**
 * Get components by visual complexity
 */
export function getComponentsByComplexity(complexity) {
  const allComponents = getAllComponents();
  return allComponents.filter((c) => c.metadata.visualComplexity === complexity);
}

/**
 * Get components by size
 */
export function getComponentsBySize(size) {
  const allComponents = getAllComponents();
  return allComponents.filter((c) => c.metadata.size === size);
}

/**
 * Query components with multiple filters
 */
export function queryComponents(filters = {}) {
  let results = getAllComponents();

  if (filters.domain) {
    results = results.filter((c) => c.domain === filters.domain);
  }

  if (filters.category) {
    results = results.filter((c) => c.category === filters.category);
  }

  if (filters.primitive) {
    results = results.filter((c) => c.primitives.includes(filters.primitive));
  }

  if (filters.semanticFit) {
    results = results.filter((c) => c.metadata.semanticFit.includes(filters.semanticFit));
  }

  if (filters.tag) {
    results = results.filter((c) => c.metadata.tags.includes(filters.tag));
  }

  if (filters.visualComplexity) {
    results = results.filter((c) => c.metadata.visualComplexity === filters.visualComplexity);
  }

  if (filters.size) {
    results = results.filter((c) => c.metadata.size === filters.size);
  }

  return results;
}

/**
 * Get random component
 */
export function getRandomComponent() {
  const allComponents = getAllComponents();
  const index = Math.floor(Math.random() * allComponents.length);
  return allComponents[index];
}

/**
 * Get random components from a domain
 */
export function getRandomComponentsFromDomain(domain, count = 1) {
  const domainComponents = getComponentsByDomain(domain);
  const shuffled = [...domainComponents].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get registry statistics
 */
export function getRegistryStats() {
  const allComponents = getAllComponents();

  const stats = {
    totalComponents: allComponents.length,
    byDomain: {},
    byCategory: {},
    byPrimitive: {},
    byVisualComplexity: {},
    bySize: {},
  };

  // Count by domain
  Object.keys(componentRegistry).forEach((domain) => {
    stats.byDomain[domain] = componentRegistry[domain].length;
  });

  // Count by category
  allComponents.forEach((c) => {
    stats.byCategory[c.category] = (stats.byCategory[c.category] || 0) + 1;
  });

  // Count by primitive
  allComponents.forEach((c) => {
    c.primitives.forEach((p) => {
      stats.byPrimitive[p] = (stats.byPrimitive[p] || 0) + 1;
    });
  });

  // Count by visual complexity
  allComponents.forEach((c) => {
    const complexity = c.metadata.visualComplexity;
    stats.byVisualComplexity[complexity] = (stats.byVisualComplexity[complexity] || 0) + 1;
  });

  // Count by size
  allComponents.forEach((c) => {
    const size = c.metadata.size;
    stats.bySize[size] = (stats.bySize[size] || 0) + 1;
  });

  return stats;
}

/**
 * Print registry statistics
 */
export function printRegistryStats() {
  const stats = getRegistryStats();

  console.log("\n=== Component Registry Statistics ===");
  console.log(`Total components: ${stats.totalComponents}`);

  console.log("\nBy Domain:");
  Object.entries(stats.byDomain)
    .sort((a, b) => b[1] - a[1])
    .forEach(([domain, count]) => {
      console.log(`  ${domain}: ${count}`);
    });

  console.log("\nBy Category:");
  Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });

  console.log("\nBy Primitive:");
  Object.entries(stats.byPrimitive)
    .sort((a, b) => b[1] - a[1])
    .forEach(([primitive, count]) => {
      console.log(`  ${primitive}: ${count}`);
    });

  console.log("\nBy Visual Complexity:");
  Object.entries(stats.byVisualComplexity)
    .sort((a, b) => b[1] - a[1])
    .forEach(([complexity, count]) => {
      console.log(`  ${complexity}: ${count}`);
    });

  console.log("\nBy Size:");
  Object.entries(stats.bySize)
    .sort((a, b) => b[1] - a[1])
    .forEach(([size, count]) => {
      console.log(`  ${size}: ${count}`);
    });

  console.log("=====================================\n");
}
