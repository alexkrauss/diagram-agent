import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import type { IconLibrary } from '../icon-library/types';

/**
 * Replaces external icon URLs in SVG with inline data URIs.
 * This is necessary because Sharp/Canvas cannot fetch external URLs during SVG-to-PNG conversion.
 *
 * Uses proper XML parsing to handle entity decoding (e.g., &amp; -> &) correctly.
 */
export function inlineIconsInSvg(svg: string, iconLibrary: IconLibrary): string {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const images = doc.getElementsByTagName('image');
  let modified = false;

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    // Check both href and xlink:href attributes
    // Note: use getAttribute('xlink:href') not getAttributeNS, as the namespace may not be declared
    const hrefAttr = image.hasAttribute('href') ? 'href' : 'xlink:href';
    const href = image.getAttribute(hrefAttr);

    if (href?.startsWith('http')) {
      const dataUri = iconLibrary.getDataUriForUrl(href);
      if (dataUri) {
        image.setAttribute(hrefAttr, dataUri);
        modified = true;
      }
    }
  }

  // Only serialize if we made changes, to preserve original formatting when possible
  return modified ? new XMLSerializer().serializeToString(doc) : svg;
}
