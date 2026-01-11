import { describe, it, expect } from 'vitest';
import { inlineIconsInSvg } from './SvgIconInliner';
import { D2RendererImpl } from './D2Renderer';
import { iconLibrary } from '../icon-library';
import type { IconLibrary, Icon } from '../icon-library/types';

// Mock icon library for testing
class MockIconLibrary implements IconLibrary {
  private urlToDataUri = new Map<string, string>([
    ['https://icons.terrastruct.com/dev/github.svg', 'data:image/svg+xml;base64,PHN2Zz5tb2NrPC9zdmc+'],
    ['https://icons.terrastruct.com/aws/S3.svg', 'data:image/svg+xml;base64,PHN2Zz5hd3M8L3N2Zz4='],
  ]);

  async initialize(): Promise<void> {}

  search(_query: string, _maxResults?: number): Icon[] {
    return [];
  }

  getDataUriForUrl(url: string): string | undefined {
    return this.urlToDataUri.get(url);
  }
}

describe('inlineIconsInSvg', () => {
  const mockLibrary = new MockIconLibrary();

  it('replaces href with data URI for known icons', () => {
    const svg = `<svg><image href="https://icons.terrastruct.com/dev/github.svg" width="100" height="100"/></svg>`;

    const result = inlineIconsInSvg(svg, mockLibrary);

    expect(result).toBe(`<svg><image href="data:image/svg+xml;base64,PHN2Zz5tb2NrPC9zdmc+" width="100" height="100"/></svg>`);
  });

  it('replaces xlink:href with data URI for known icons', () => {
    const svg = `<svg><image xlink:href="https://icons.terrastruct.com/dev/github.svg" width="100"/></svg>`;

    const result = inlineIconsInSvg(svg, mockLibrary);

    expect(result).toBe(`<svg><image xlink:href="data:image/svg+xml;base64,PHN2Zz5tb2NrPC9zdmc+" width="100"/></svg>`);
  });

  it('leaves unknown URLs unchanged', () => {
    const svg = `<svg><image href="https://example.com/unknown.svg" width="100"/></svg>`;

    const result = inlineIconsInSvg(svg, mockLibrary);

    expect(result).toBe(svg);
  });

  it('handles multiple images in SVG', () => {
    const svg = `<svg>
      <image href="https://icons.terrastruct.com/dev/github.svg"/>
      <image href="https://icons.terrastruct.com/aws/S3.svg"/>
      <image href="https://example.com/other.svg"/>
    </svg>`;

    const result = inlineIconsInSvg(svg, mockLibrary);

    expect(result).toContain('data:image/svg+xml;base64,PHN2Zz5tb2NrPC9zdmc+');
    expect(result).toContain('data:image/svg+xml;base64,PHN2Zz5hd3M8L3N2Zz4=');
    expect(result).toContain('https://example.com/other.svg');
  });

  it('handles SVG without any images', () => {
    const svg = `<svg><rect width="100" height="100"/></svg>`;

    const result = inlineIconsInSvg(svg, mockLibrary);

    expect(result).toBe(svg);
  });
});

describe('inlineIconsInSvg with HTML entity encoding', () => {
  it('handles URLs with HTML-encoded ampersand (&amp;)', () => {
    // D2 HTML-encodes special characters like & -> &amp; in SVG output
    // The library stores URLs with literal &, so lookup fails without decoding
    const mockLibrary: IconLibrary = {
      async initialize() {},
      search() { return []; },
      getDataUriForUrl(url: string) {
        // Library stores URL with literal &
        if (url === 'https://icons.terrastruct.com/aws/Security,%20Identity,%20&%20Compliance/icon.svg') {
          return 'data:image/svg+xml;base64,dGVzdA==';
        }
        return undefined;
      },
    };

    // SVG contains HTML-encoded &amp; (as D2 produces)
    const svg = `<svg><image href="https://icons.terrastruct.com/aws/Security,%20Identity,%20&amp;%20Compliance/icon.svg"/></svg>`;

    const result = inlineIconsInSvg(svg, mockLibrary);

    // Should inline despite the &amp; encoding difference
    expect(result).toContain('data:image/svg+xml;base64,dGVzdA==');
    expect(result).not.toContain('icons.terrastruct.com');
  });
});

describe('inlineIconsInSvg with real D2 renderer', () => {
  it('inlines icons with ampersand in path (e.g., AWS Security, Identity, & Compliance)', async () => {
    const renderer = new D2RendererImpl();

    // Find an icon with & in its path
    const icons = iconLibrary.search('AD Connector', 1);
    expect(icons.length).toBeGreaterThan(0);
    expect(icons[0].url).toContain('&'); // Verify it has ampersand

    const d2Code = `
ad_connector {
  shape: image
  icon: ${icons[0].url}
}
`;
    const result = await renderer.render(d2Code);
    expect(result.error).toBeUndefined();

    // D2 will HTML-encode the & as &amp; in the SVG
    expect(result.svg).toContain('&amp;');

    // After inlining, the URL should be replaced with a data URI
    const inlinedSvg = inlineIconsInSvg(result.svg, iconLibrary);
    expect(inlinedSvg).not.toContain('icons.terrastruct.com');
    expect(inlinedSvg).toContain('data:image/svg+xml;base64,');
  });

  it('inlines icons in D2-generated SVG with shape: image', async () => {
    const renderer = new D2RendererImpl();

    // Use an icon with a simple path (no special chars like & that get HTML-escaped)
    const icons = iconLibrary.search('Alarm Clock', 1);
    expect(icons.length).toBeGreaterThan(0);
    const iconUrl = icons[0].url;

    // Render a D2 diagram with shape: image
    const d2Code = `
icon_display: Alarm Clock {
  shape: image
  icon: ${iconUrl}
}
`;
    const result = await renderer.render(d2Code);
    expect(result.error).toBeUndefined();
    expect(result.svg).toContain('<svg');

    // The SVG should contain the external URL (may be URL-encoded)
    expect(result.svg).toContain('icons.terrastruct.com');

    // After inlining, the URL should be replaced with a data URI
    const inlinedSvg = inlineIconsInSvg(result.svg, iconLibrary);
    expect(inlinedSvg).not.toContain('icons.terrastruct.com');
    expect(inlinedSvg).toContain('data:image/svg+xml;base64,');
  });

  it('inlines icons in D2-generated SVG with icon property', async () => {
    const renderer = new D2RendererImpl();

    // Use an icon with a simple path (no special chars)
    const icons = iconLibrary.search('Graph Bar', 1);
    expect(icons.length).toBeGreaterThan(0);
    const iconUrl = icons[0].url;

    // Render a D2 diagram with icon on a shape
    const d2Code = `
server: Web Server {
  icon: ${iconUrl}
}
`;
    const result = await renderer.render(d2Code);
    expect(result.error).toBeUndefined();
    expect(result.svg).toContain('<svg');

    // The SVG should contain the external URL
    expect(result.svg).toContain('icons.terrastruct.com');

    // After inlining, the URL should be replaced with a data URI
    const inlinedSvg = inlineIconsInSvg(result.svg, iconLibrary);
    expect(inlinedSvg).not.toContain('icons.terrastruct.com');
    expect(inlinedSvg).toContain('data:image/svg+xml;base64,');
  });
});
