/**
 * Scrapes icons from https://icons.terrastruct.com/ and generates a JSON file.
 *
 * Run with: npx tsx scripts/scrape-icons.ts
 */

interface IconEntry {
  name: string;
  path: string;
}

interface IconDatabase {
  icons: IconEntry[];
}

async function scrapeIcons(): Promise<IconDatabase> {
  const response = await fetch('https://icons.terrastruct.com/');
  if (!response.ok) {
    throw new Error(`Failed to fetch icons page: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();

  // Extract icons using regex based on the HTML structure documented in spec/icon-db-format.md
  // Pattern: <div class=icon data-search="Icon Name" onclick='clickIcon("path/to/icon.svg")'>
  const iconRegex = /<div\s+class=icon\s+data-search="([^"]+)"\s+onclick='clickIcon\("([^"]+)"\)'/g;

  const icons: IconEntry[] = [];
  let match;

  while ((match = iconRegex.exec(html)) !== null) {
    const name = match[1];
    const encodedPath = match[2];
    // Decode the URL-encoded path
    const path = decodeURIComponent(encodedPath);

    icons.push({ name, path });
  }

  console.log(`Found ${icons.length} icons`);

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
