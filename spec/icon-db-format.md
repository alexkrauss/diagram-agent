# D2 Icon Database Format

This document describes the structure of the icon database hosted at `https://icons.terrastruct.com/`, as reverse-engineered from the HTML page.

## Overview

The icon database contains **1,480 icons** organized into 9 categories, primarily focused on cloud infrastructure (AWS, Azure, GCP) and general software development diagrams.

## URL Format

- **Base URL**: `https://icons.terrastruct.com/`
- **Full URL**: `https://icons.terrastruct.com/{category}/{filename}.svg`

Examples:
```
https://icons.terrastruct.com/essentials/073-add.svg
https://icons.terrastruct.com/aws/Asset-Package_07-17-2022/Architecture-Service-Icons_07-17-2022/Arch_Analytics/64/Arch_Amazon-Athena_64.svg
https://icons.terrastruct.com/gcp/Products%20and%20services/Networking/Cloud%20DNS.svg
```

Note: Paths with spaces must be URL-encoded (e.g., `%20` for space).

## Categories

| Category | Count | Description |
|----------|-------|-------------|
| aws | 778 | Amazon Web Services icons |
| azure | 262 | Microsoft Azure icons |
| dev | 123 | Development tools and languages |
| gcp | 109 | Google Cloud Platform icons |
| essentials | 100 | Basic shapes and UI elements |
| social | 37 | Social media and communication |
| emotions | 33 | Emoji-style icons |
| tech | 21 | General technology icons |
| infra | 17 | Infrastructure components |

## HTML Structure

Each icon in the HTML page is represented as:

```html
<div class=icon
     data-search="Icon Name"
     onclick='clickIcon("category%2Fpath%2Fto%2Ficon.svg")'>
  <img data-src="data:image/svg+xml,..." class=lazy>
  <div class=icon-label>Icon Name</div>
</div>
```

### Key Attributes

| Attribute | Description |
|-----------|-------------|
| `data-search` | Searchable name/label for the icon |
| `onclick` | Contains `clickIcon("...")` with URL-encoded path |
| `data-src` | Inline SVG data (URL-encoded) for lazy loading display |

### Subcategory Structure

Icons are grouped into subcategories:

```html
<div data-subcategory="AWS" class=subcategory-icons>
  <!-- icon divs here -->
</div>
```

## Extraction Script

To extract all icon paths from the HTML file:

```bash
grep -oE 'clickIcon\("[^"]+"\)' icons.html | \
  sed 's/clickIcon("//; s/")//' | \
  python3 -c "import sys, urllib.parse; [print(urllib.parse.unquote(l.strip())) for l in sys.stdin]"
```

To generate full URLs with names (TSV format):

```bash
grep -oE 'clickIcon\("[^"]+"\)' icons.html | \
  sed 's/clickIcon("//; s/")//' | \
  python3 -c "
import sys
import urllib.parse

for line in sys.stdin:
    path = urllib.parse.unquote(line.strip())
    url = f'https://icons.terrastruct.com/{urllib.parse.quote(path)}'
    name = path.split('/')[-1].replace('.svg', '')
    print(f'{name}\t{url}')
"
```

## Browser-Based Extraction

For programmatic extraction in a browser context:

```javascript
const icons = Array.from(document.querySelectorAll('.icon')).map(el => {
  const onclick = el.getAttribute('onclick');
  const match = onclick?.match(/clickIcon\("([^"]+)"\)/);
  const path = match ? decodeURIComponent(match[1]) : null;
  return {
    name: el.querySelector('.icon-label')?.textContent || el.dataset.search,
    path: path,
    url: path ? `https://icons.terrastruct.com/${path}` : null
  };
}).filter(icon => icon.path);
```

## Notes

- The page uses lazy loading for icon images via `data-src` attributes
- SVG data is embedded inline as URL-encoded data URIs for preview
- The hosted URLs at `icons.terrastruct.com` serve the actual SVG files
- Icons may be added or removed over time, but existing URLs are stable
