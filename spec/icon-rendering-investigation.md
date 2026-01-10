# Icon Rendering Investigation

## Problem

D2 diagrams with icons (e.g., `icon: https://icons.terrastruct.com/dev/github.svg`) render correctly in the D2 playground but icons are missing in our eval PNG output.

## Root Cause

When converting SVG to PNG, neither Sharp (Node.js) nor the browser Canvas API will fetch external URLs referenced in `<image href="...">` elements. This is a **security feature**, not a bug:

- **Sharp/librsvg**: Designed to prevent SVGs from making arbitrary network requests during server-side processing
- **Browser Canvas**: Prevents data exfiltration - cross-origin images "taint" the canvas, blocking `toDataURL()`

The D2 playground works because it renders SVG directly in the DOM via innerHTML, where the browser fetches and displays external images normally.

## Why It Has To Be Complex

There's no simple fix because we need PNG output (for agent feedback), and the security restrictions are fundamental:

| Rendering Method | Icons Visible | Can Export PNG |
|-----------------|---------------|----------------|
| SVG via innerHTML | Yes | N/A |
| SVG via `<img>` tag | No | N/A |
| Sharp (Node.js) | No | Yes |
| Canvas API (Browser) | No | Yes |
| html2canvas | No | Yes (but no icons) |

The icons are only visible when the browser fetches them directly into the DOM - but then we can't capture those pixels to PNG due to cross-origin restrictions.

## Solution

**Pre-process SVG to inline external images as base64 data URIs before PNG conversion.**

```
<image href="https://icons.terrastruct.com/dev/github.svg" .../>
```
becomes:
```
<image href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0i..." .../>
```

### Node.js (Eval)

Straightforward - use `fetch()` to download icons and inline them before passing to Sharp.

### Browser

Direct fetch is blocked by CORS (icons.terrastruct.com doesn't send `Access-Control-Allow-Origin` headers).

**Solution**: Use a CORS proxy like `api.cors.lol`:
```javascript
const proxyUrl = 'https://api.cors.lol/?url=' + encodeURIComponent(iconUrl);
const response = await fetch(proxyUrl);
```

## Reproducers

- `scripts/icon-render-reproducer.ts` - Node.js reproducer demonstrating the issue and fix
- `test-output/cors-proxy-test.html` - Browser reproducer using CORS proxy

## Implementation Notes

The inlining logic needs to:
1. Parse SVG for `<image>` elements with `href` attributes containing `http(s)://` URLs
2. Fetch each URL (via CORS proxy in browser)
3. Convert response to base64 data URI
4. Replace the href in the SVG
5. Then pass to Sharp/Canvas for PNG conversion
