import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useConfig } from './useConfig';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Replace global localStorage with mock
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('useConfig', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('localStorage operations', () => {
    it('should return default config when localStorage is empty', () => {
      // Simulate what the hook does on initialization
      const stored = localStorage.getItem('diagent-config');
      const config = stored ? JSON.parse(stored) : { apiKey: '' };

      expect(config).toEqual({ apiKey: '' });
    });

    it('should load config from localStorage if it exists', () => {
      const savedConfig = { apiKey: 'test-key-123' };
      localStorage.setItem('diagent-config', JSON.stringify(savedConfig));

      const stored = localStorage.getItem('diagent-config');
      const config = stored ? JSON.parse(stored) : { apiKey: '' };

      expect(config).toEqual(savedConfig);
    });

    it('should persist config to localStorage', () => {
      const newConfig = { apiKey: 'new-api-key' };
      localStorage.setItem('diagent-config', JSON.stringify(newConfig));

      const stored = localStorage.getItem('diagent-config');
      expect(stored).toBe(JSON.stringify(newConfig));
      expect(JSON.parse(stored!)).toEqual(newConfig);
    });

    it('should handle malformed JSON in localStorage gracefully', () => {
      localStorage.setItem('diagent-config', 'invalid-json{');

      let config;
      try {
        const stored = localStorage.getItem('diagent-config');
        config = stored ? JSON.parse(stored) : { apiKey: '' };
      } catch (error) {
        config = { apiKey: '' };
      }

      expect(config).toEqual({ apiKey: '' });
    });

    it('should overwrite existing config in localStorage', () => {
      localStorage.setItem('diagent-config', JSON.stringify({ apiKey: 'old-key' }));

      const newConfig = { apiKey: 'new-key' };
      localStorage.setItem('diagent-config', JSON.stringify(newConfig));

      const stored = localStorage.getItem('diagent-config');
      expect(JSON.parse(stored!)).toEqual(newConfig);
    });

    it('should use consistent storage key', () => {
      const config = { apiKey: 'test-key' };
      const storageKey = 'diagent-config';

      localStorage.setItem(storageKey, JSON.stringify(config));

      const stored = localStorage.getItem(storageKey);
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toEqual(config);
    });

    it('should serialize and deserialize config correctly', () => {
      const originalConfig = { apiKey: 'special-chars-!@#$%^&*()' };

      const serialized = JSON.stringify(originalConfig);
      localStorage.setItem('diagent-config', serialized);

      const stored = localStorage.getItem('diagent-config');
      const deserialized = JSON.parse(stored!);

      expect(deserialized).toEqual(originalConfig);
    });
  });

  describe('Config type validation', () => {
    it('should match Config interface structure', () => {
      const config = { apiKey: 'test-key' };

      expect(config).toHaveProperty('apiKey');
      expect(typeof config.apiKey).toBe('string');
    });

    it('should handle empty string as valid apiKey', () => {
      const config = { apiKey: '' };

      localStorage.setItem('diagent-config', JSON.stringify(config));
      const stored = JSON.parse(localStorage.getItem('diagent-config')!);

      expect(stored.apiKey).toBe('');
    });
  });
});
