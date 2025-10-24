/**
 * Interface for converting SVG strings to PNG base64 data URLs
 */
export interface ImageConverter {
  /**
   * Converts an SVG string to a PNG base64 data URL
   * @param svgString - The SVG content as a string
   * @returns Promise resolving to a data URL in format "data:image/png;base64,..."
   */
  svgToPngBase64(svgString: string): Promise<string>;
}

/**
 * Browser implementation using Canvas API
 */
class BrowserImageConverter implements ImageConverter {
  async svgToPngBase64(svgString: string): Promise<string> {
    // Create a blob from the SVG string
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    try {
      // Load SVG into an Image element
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load SVG image'));
        img.src = url;
      });

      // Create canvas and draw the image
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas 2D context');
      }

      ctx.drawImage(img, 0, 0);

      // Convert to PNG base64
      return canvas.toDataURL('image/png');
    } finally {
      // Clean up the object URL
      URL.revokeObjectURL(url);
    }
  }
}

/**
 * Node.js implementation using Sharp library
 */
class NodeImageConverter implements ImageConverter {
  async svgToPngBase64(svgString: string): Promise<string> {
    // Dynamic import to avoid bundling Sharp in browser builds
    const sharp = (await import('sharp')).default;

    // Convert SVG to PNG buffer
    const pngBuffer = await sharp(Buffer.from(svgString))
      .png()
      .toBuffer();

    // Convert buffer to base64 data URL
    return `data:image/png;base64,${pngBuffer.toString('base64')}`;
  }
}

/**
 * Factory function to create the appropriate ImageConverter for the current environment
 */
export function createImageConverter(): ImageConverter {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return new BrowserImageConverter();
  } else {
    // Node.js environment (tests)
    return new NodeImageConverter();
  }
}
