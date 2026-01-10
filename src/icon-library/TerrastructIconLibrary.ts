import type { Icon, IconLibrary } from './types';
import iconData from './terrastruct-icons.json';

const BASE_URL = 'https://icons.terrastruct.com/';

interface IconEntry {
  name: string;
  path: string;
}

interface IconDatabase {
  icons: IconEntry[];
}

export class TerrastructIconLibrary implements IconLibrary {
  private icons: IconEntry[];

  constructor() {
    this.icons = (iconData as IconDatabase).icons;
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
        });

        if (matches.length >= maxResults) {
          break;
        }
      }
    }

    return matches;
  }
}
