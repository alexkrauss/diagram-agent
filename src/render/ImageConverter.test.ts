import { describe, it, expect } from 'vitest';
import { createImageConverter } from './ImageConverter';

describe('ImageConverter', () => {
  it('should convert SVG to PNG base64 data URL', async () => {
    const converter = createImageConverter();

    // Simple SVG content
    const svgString = `
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="40" fill="red" />
      </svg>
    `;

    const result = await converter.svgToPngBase64(svgString);

    // Verify it's a valid data URL
    expect(result).toMatch(/^data:image\/png;base64,/);

    // Verify the base64 content exists and is not empty
    const base64Content = result.replace('data:image/png;base64,', '');
    expect(base64Content.length).toBeGreaterThan(0);

    // Verify it's valid base64 (should not throw when decoding)
    expect(() => Buffer.from(base64Content, 'base64')).not.toThrow();
  });

  it('should handle complex D2-generated SVG', async () => {
    const converter = createImageConverter();

    // More complex SVG with text and paths
    const svgString = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="180" height="180" fill="blue" />
        <text x="100" y="100" text-anchor="middle" fill="white">Test</text>
        <path d="M 10 10 L 190 190" stroke="yellow" stroke-width="2" />
      </svg>
    `;

    const result = await converter.svgToPngBase64(svgString);

    expect(result).toMatch(/^data:image\/png;base64,/);
    const base64Content = result.replace('data:image/png;base64,', '');
    expect(base64Content.length).toBeGreaterThan(0);
  });

  it('should handle empty SVG', async () => {
    const converter = createImageConverter();

    const svgString = '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"></svg>';

    const result = await converter.svgToPngBase64(svgString);

    expect(result).toMatch(/^data:image\/png;base64,/);
  });
});
