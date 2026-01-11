import type { Icon, IconLibrary } from './types';
import iconData from './terrastruct-icons.json';

const BASE_URL = 'https://icons.terrastruct.com/';

interface IconEntry {
  name: string;
  path: string;
  dataUri: string;
}

interface IconDatabase {
  icons: IconEntry[];
}

export class TerrastructIconLibrary implements IconLibrary {
  private icons: IconEntry[];
  private urlToDataUri: Map<string, string>;

  constructor() {
    this.icons = (iconData as IconDatabase).icons;
    // Build a lookup map from URL to dataUri for fast reverse lookup
    this.urlToDataUri = new Map();
    for (const entry of this.icons) {
      const url = BASE_URL + encodeURI(entry.path);
      this.urlToDataUri.set(url, entry.dataUri);
    }
  }

  async initialize(): Promise<void> {
    // No-op for bundled data
  }

  search(query: string, maxResults: number = 10): Icon[] {
    const lowerQuery = query.toLowerCase();

    const matches: Icon[] = [];

    for (const entry of this.icons) {
      if (entry.name.toLowerCase().includes(lowerQuery)) {
        matches.push({
          name: entry.name,
          url: BASE_URL + encodeURI(entry.path),
          dataUri: entry.dataUri,
        });

        if (matches.length >= maxResults) {
          break;
        }
      }
    }

    return matches;
  }

  getDataUriForUrl(url: string): string | undefined {
    return this.urlToDataUri.get(url);
  }
}
