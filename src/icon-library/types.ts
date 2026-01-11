export interface Icon {
  name: string;
  url: string;
  /** SVG content as a data URI (data:image/svg+xml;base64,...) */
  dataUri?: string;
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

  /**
   * Look up the data URI for a given icon URL.
   * Returns the data URI if the URL is from this library, otherwise undefined.
   */
  getDataUriForUrl(url: string): string | undefined;
}
