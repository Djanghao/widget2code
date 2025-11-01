export async function preloadImages(imageUrls) {
  if (!imageUrls || imageUrls.length === 0) {
    console.log('[Image Preload] ℹ️  No images to preload');
    return;
  }

  console.log(`[Image Preload] 🚀 Starting preload of ${imageUrls.length} images...`);
  const startTime = performance.now();

  const loadPromises = imageUrls.map(async (url, index) => {
    console.log(`[Image Preload] 📥 Image ${index + 1}/${imageUrls.length}: Loading ${url}...`);
    const imageStartTime = performance.now();

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const imageLoadTime = performance.now() - imageStartTime;
        console.log(`[Image Preload] ✅ Image ${index + 1}/${imageUrls.length}: ${url} loaded in ${imageLoadTime.toFixed(2)}ms (${img.width}×${img.height})`);
        resolve();
      };

      img.onerror = (error) => {
        const imageLoadTime = performance.now() - imageStartTime;
        console.error(`[Image Preload] ❌ Image ${index + 1}/${imageUrls.length}: ${url} failed after ${imageLoadTime.toFixed(2)}ms:`, error);
        resolve();
      };

      img.src = url;
    });
  });

  await Promise.all(loadPromises);

  const totalTime = performance.now() - startTime;
  console.log(`[Image Preload] 🎉 All images preloaded in ${totalTime.toFixed(2)}ms (avg: ${(totalTime / imageUrls.length).toFixed(2)}ms per image)`);
}
