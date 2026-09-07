/**
 * Utility to compress and optimize images client-side before storing or transmitting.
 * Reduces raw 5MB-15MB camera photos to lightweight 50KB-120KB images (max 1280px dimension, JPEG/WebP @ 82% quality).
 * Prevents LocalStorage QuotaExceededError and ensures ultra-fast page load on slow internet connections.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: "image/jpeg" | "image/webp" | "image/png";
}

export async function compressImageFile(
  file: File,
  options: CompressionOptions = {},
): Promise<string> {
  const detectedMime =
    file.type === "image/png"
      ? "image/png"
      : file.type === "image/webp"
        ? "image/webp"
        : "image/jpeg";
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.85,
    mimeType = options.mimeType ?? detectedMime,
  } = options;

  // If it's a PDF or non-image, read normally as Data URL
  if (!file.type.startsWith("image/")) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        reject(new Error("No data URL found"));
        return;
      }

      // If it's an SVG, don't rasterize to canvas to preserve crisp vector scaling
      if (file.type === "image/svg+xml" || dataUrl.startsWith("data:image/svg")) {
        resolve(dataUrl);
        return;
      }

      compressDataUrl(dataUrl, { maxWidth, maxHeight, quality, mimeType })
        .then(resolve)
        .catch(() => {
          // If canvas compression fails, return raw dataUrl safely
          resolve(dataUrl);
        });
    };
    reader.readAsDataURL(file);
  });
}

export async function compressDataUrl(
  dataUrl: string,
  options: CompressionOptions = {},
): Promise<string> {
  const { maxWidth = 1280, maxHeight = 1280, quality = 0.82, mimeType = "image/jpeg" } = options;

  // Don't compress non-image data URLs or SVGs
  if (!dataUrl.startsWith("data:image/") || dataUrl.startsWith("data:image/svg")) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let { width, height } = img;

      // Calculate proportional scaling
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      // High-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // If output is JPEG, paint white background for transparent images
      if (mimeType === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      try {
        const compressed = canvas.toDataURL(mimeType, quality);
        // Only return compressed if it succeeded and isn't empty
        if (compressed && compressed.length > 50) {
          resolve(compressed);
        } else {
          resolve(dataUrl);
        }
      } catch {
        resolve(dataUrl);
      }
    };

    img.onerror = () => {
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}
