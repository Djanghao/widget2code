import html2canvas from 'html2canvas';

export async function captureWidgetAsPNG(widgetElement, options = {}) {
  const { scale = 2, backgroundColor = null, targetWidth, targetHeight, autoResizeOnly = false } = options;

  // Calculate scale to match target dimensions if specified
  let finalScale = scale;
  if (targetWidth && targetHeight) {
    const rect = widgetElement.getBoundingClientRect();
    const scaleW = targetWidth / rect.width;
    const scaleH = targetHeight / rect.height;
    // Use the larger scale to ensure at least one dimension matches target
    finalScale = Math.max(scaleW, scaleH);
  }

  const canvas = await html2canvas(widgetElement, {
    backgroundColor,
    scale: finalScale,
    logging: false,
    useCORS: true
  });

  // If autoResizeOnly is true, return the scaled canvas without exact resize
  if (autoResizeOnly) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob from canvas'));
          return;
        }
        resolve(blob);
      }, 'image/png');
    });
  }

  // If target dimensions are specified and canvas doesn't match exactly, resize
  let finalCanvas = canvas;
  if (targetWidth && targetHeight && (canvas.width !== targetWidth || canvas.height !== targetHeight)) {
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = targetWidth;
    outputCanvas.height = targetHeight;

    const ctx = outputCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Resize the entire canvas to target dimensions (no cropping)
    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, targetWidth, targetHeight);

    finalCanvas = outputCanvas;
  }

  return new Promise((resolve, reject) => {
    finalCanvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create blob from canvas'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

export async function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportWidget(widgetElement, presetCode, metadata, options = {}) {
  const blob = await captureWidgetAsPNG(widgetElement, options);
  const filename = generateFilename(presetCode, metadata);

  if (options.returnBlob) {
    return { blob, filename, metadata };
  }

  await downloadBlob(blob, filename);
  return { filename, metadata };
}

function generateUniqueCode() {
  return Math.random().toString(36).substring(2, 9);
}

export function generateFilename(presetCode, metadata) {
  const { width, height, aspectRatio } = metadata;
  const arFormatted = aspectRatio.toFixed(4).replace('.', '-');
  const uniqueCode = generateUniqueCode();
  return `${presetCode}_${width}x${height}_ar${arFormatted}_${uniqueCode}.png`;
}
