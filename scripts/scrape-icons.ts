/**
 * Scrapes icons from https://icons.terrastruct.com/ and generates a JSON file.
 * The SVG data is embedded directly in the HTML page as URL-encoded data URIs,
 * so no individual fetches are needed.
 *
 * Run with: npx tsx scripts/scrape-icons.ts
 */

interface IconEntry {
  name: string;
  path: string;
  dataUri: string;
}

interface IconDatabase {
  icons: IconEntry[];
}

/**
 * Converts a URL-encoded SVG data URI to a base64 data URI.
 * The HTML contains: data:image/svg+xml,%3C%3Fxml...
 * We need: data:image/svg+xml;base64,...
 */
function urlEncodedToBase64DataUri(urlEncodedDataUri: string): string {
  // Remove the "data:image/svg+xml," prefix
  const prefix = 'data:image/svg+xml,';
  if (!urlEncodedDataUri.startsWith(prefix)) {
    throw new Error(`Unexpected data URI format: ${urlEncodedDataUri.substring(0, 50)}`);
  }

  const encodedSvg = urlEncodedDataUri.substring(prefix.length);
  const svgText = decodeURIComponent(encodedSvg);
  const base64 = Buffer.from(svgText).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

async function scrapeIcons(): Promise<IconDatabase> {
  const response = await fetch('https://icons.terrastruct.com/');
  if (!response.ok) {
    throw new Error(`Failed to fetch icons page: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();

  // Extract icons from HTML - the pattern is:
  // <div class=icon data-search="Name" onclick='clickIcon("path")'><img class=icon-img data-src="data:image/svg+xml,..." alt="Name">
  const iconRegex = /<div\s+class=icon\s+data-search="([^"]+)"\s+onclick='clickIcon\("([^"]+)"\)'><img[^>]+data-src="(data:image\/svg\+xml,[^"]+)"/g;

  const icons: IconEntry[] = [];
  let match;

  while ((match = iconRegex.exec(html)) !== null) {
    const name = match[1];
    const encodedPath = match[2];
    const urlEncodedDataUri = match[3];

    // Decode the URL-encoded path
    const path = decodeURIComponent(encodedPath);

    // Convert URL-encoded data URI to base64
    try {
      const dataUri = urlEncodedToBase64DataUri(urlEncodedDataUri);
      icons.push({ name, path, dataUri });
    } catch (error) {
      console.warn(`Failed to process icon ${name}: ${error}`);
    }
  }

  console.log(`Found and processed ${icons.length} icons`);

  return { icons };
}

async function main() {
  console.log('Scraping icons from https://icons.terrastruct.com/...');

  const database = await scrapeIcons();

  if (database.icons.length === 0) {
    console.error('No icons found! The HTML structure may have changed.');
    process.exit(1);
  }

  // Write to the icon library source directory
  const outputPath = new URL('../src/icon-library/terrastruct-icons.json', import.meta.url);
  const fs = await import('fs/promises');

  await fs.writeFile(outputPath, JSON.stringify(database, null, 2));

  console.log(`Wrote ${database.icons.length} icons to ${outputPath.pathname}`);

  // Print some stats
  const categories = new Map<string, number>();
  for (const icon of database.icons) {
    const category = icon.path.split('/')[0];
    categories.set(category, (categories.get(category) || 0) + 1);
  }

  console.log('\nCategories:');
  for (const [category, count] of Array.from(categories.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${category}: ${count}`);
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
