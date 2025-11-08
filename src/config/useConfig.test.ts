import { describe, it, expect, beforeEach, vi } from "vitest";
import { getConfig, setConfig } from "./useConfig";

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
Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("useConfig", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe("localStorage operations", () => {
    it("should return default config when localStorage is empty", () => {
      const config = getConfig();
      expect(config).toEqual({ apiKey: "" });
    });

    it("should load config from localStorage if it exists", () => {
      const savedConfig = { apiKey: "test-key-123" };
      setConfig(savedConfig);

      const config = getConfig();
      expect(config).toEqual(savedConfig);
    });

    it("should persist config to localStorage", () => {
      const newConfig = { apiKey: "new-api-key" };
      setConfig(newConfig);

      const loaded = getConfig();
      expect(loaded).toEqual(newConfig);
    });

    it("should handle malformed JSON in localStorage gracefully", () => {
      localStorage.setItem("diagent-config", "invalid-json{");

      // Suppress expected error log
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const config = getConfig();
      expect(config).toEqual({ apiKey: "" });

      consoleErrorSpy.mockRestore();
    });

    it("should overwrite existing config in localStorage", () => {
      setConfig({ apiKey: "old-key" });

      const newConfig = { apiKey: "new-key" };
      setConfig(newConfig);

      const loaded = getConfig();
      expect(loaded).toEqual(newConfig);
    });

    it("should use consistent storage key", () => {
      const config = { apiKey: "test-key" };
      setConfig(config);

      const loaded = getConfig();
      expect(loaded).toEqual(config);
    });

    it("should serialize and deserialize config correctly", () => {
      const originalConfig = { apiKey: "special-chars-!@#$%^&*()" };
      setConfig(originalConfig);

      const loaded = getConfig();
      expect(loaded).toEqual(originalConfig);
    });
  });

  describe("Config type validation", () => {
    it("should match Config interface structure", () => {
      const config = getConfig();

      expect(config).toHaveProperty("apiKey");
      expect(typeof config.apiKey).toBe("string");
    });

    it("should handle empty string as valid apiKey", () => {
      const config = { apiKey: "" };
      setConfig(config);

      const loaded = getConfig();
      expect(loaded.apiKey).toBe("");
    });
  });
});
