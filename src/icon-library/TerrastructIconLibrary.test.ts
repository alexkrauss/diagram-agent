import { describe, it, expect, beforeEach } from 'vitest';
import { TerrastructIconLibrary } from './TerrastructIconLibrary';

describe('TerrastructIconLibrary', () => {
  let library: TerrastructIconLibrary;

  beforeEach(async () => {
    library = new TerrastructIconLibrary();
    await library.initialize();
  });

  describe('search', () => {
    it('returns icons matching the query', () => {
      const results = library.search('S3');

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((icon) => icon.name.toLowerCase().includes('s3'))).toBe(true);
    });

    it('is case insensitive', () => {
      const resultsLower = library.search('lambda');
      const resultsUpper = library.search('LAMBDA');
      const resultsMixed = library.search('Lambda');

      expect(resultsLower).toEqual(resultsUpper);
      expect(resultsLower).toEqual(resultsMixed);
    });

    it('returns empty array for non-matching query', () => {
      const results = library.search('xyznonexistent12345');

      expect(results).toEqual([]);
    });

    it('respects maxResults limit', () => {
      const results = library.search('aws', 5);

      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('returns up to 10 results by default', () => {
      const results = library.search('amazon');

      expect(results.length).toBeLessThanOrEqual(10);
    });

    it('returns properly encoded URLs', () => {
      const results = library.search('S3');

      for (const icon of results) {
        expect(icon.url).toMatch(/^https:\/\/icons\.terrastruct\.com\//);
        // URL should be valid (no unencoded spaces)
        expect(icon.url).not.toMatch(/ /);
      }
    });

    it('returns icons with name, url, and dataUri properties', () => {
      const results = library.search('database');

      for (const icon of results) {
        expect(icon).toHaveProperty('name');
        expect(icon).toHaveProperty('url');
        expect(icon).toHaveProperty('dataUri');
        expect(typeof icon.name).toBe('string');
        expect(typeof icon.url).toBe('string');
        expect(typeof icon.dataUri).toBe('string');
        expect(icon.dataUri).toMatch(/^data:image\/svg\+xml;base64,/);
      }
    });
  });

  describe('getDataUriForUrl', () => {
    it('returns dataUri for known URL', () => {
      const results = library.search('S3', 1);
      expect(results.length).toBeGreaterThan(0);

      const icon = results[0];
      const dataUri = library.getDataUriForUrl(icon.url);

      expect(dataUri).toBe(icon.dataUri);
    });

    it('returns undefined for unknown URL', () => {
      const dataUri = library.getDataUriForUrl('https://example.com/unknown.svg');

      expect(dataUri).toBeUndefined();
    });
  });

  describe('initialize', () => {
    it('completes without error', async () => {
      const newLibrary = new TerrastructIconLibrary();
      await expect(newLibrary.initialize()).resolves.toBeUndefined();
    });
  });
});
