export interface Icon {
  name: string;
  url: string;
}

export interface IconLibrary {
  /**
   * Initialize the library. Called at agent startup.
   * For bundled libraries, this is a no-op. For future scraped libraries, this would fetch data.
   */
  initialize(): Promise<void>;

  /**
   * Search for icons matching a query string.
   * Returns up to maxResults icons (default 10).
   * Matching is case-insensitive substring on name.
   */
  search(query: string, maxResults?: number): Icon[];
}
