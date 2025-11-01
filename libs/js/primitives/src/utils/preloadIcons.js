export async function preloadIcons(iconNames, sfDynamicIconImports, iconCache) {
  if (!iconNames || iconNames.length === 0) {
    console.log('[Icon Preload] ℹ️  No icons to preload');
    return;
  }

  console.log(`[Icon Preload] 🚀 Starting preload of ${iconNames.length} icons...`);
  const startTime = performance.now();

  const loadPromises = iconNames.map(async (iconName, index) => {
    if (iconCache.has(iconName)) {
      console.log(`[Icon Preload] ⚡ Icon ${index + 1}/${iconNames.length}: ${iconName} (cached)`);
      return;
    }

    const loader = sfDynamicIconImports?.[iconName];
    if (!loader) {
      console.warn(`[Icon Preload] ⚠️  Icon ${index + 1}/${iconNames.length}: ${iconName} - loader not found`);
      return;
    }

    console.log(`[Icon Preload] 📥 Icon ${index + 1}/${iconNames.length}: Loading ${iconName}...`);
    const iconStartTime = performance.now();

    try {
      const module = await loader();
      const component = module.default;
      iconCache.set(iconName, component);
      const iconLoadTime = performance.now() - iconStartTime;
      console.log(`[Icon Preload] ✅ Icon ${index + 1}/${iconNames.length}: ${iconName} loaded in ${iconLoadTime.toFixed(2)}ms`);
    } catch (error) {
      console.error(`[Icon Preload] ❌ Icon ${index + 1}/${iconNames.length}: ${iconName} failed:`, error);
    }
  });

  await Promise.all(loadPromises);

  const totalTime = performance.now() - startTime;
  console.log(`[Icon Preload] 🎉 All icons preloaded in ${totalTime.toFixed(2)}ms (avg: ${(totalTime / iconNames.length).toFixed(2)}ms per icon)`);
}
