import { useState, useEffect } from 'react';

export interface Config {
  apiKey: string;
}

const CONFIG_KEY = 'diagent-config';

const defaultConfig: Config = {
  apiKey: '',
};

/**
 * Loads config from localStorage.
 * Returns default config if localStorage is empty or parsing fails.
 */
export function getConfig(): Config {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    return stored ? JSON.parse(stored) : defaultConfig;
  } catch (error) {
    console.error('Failed to load config from localStorage:', error);
    return defaultConfig;
  }
}

/**
 * Saves config to localStorage.
 * Logs error if save fails but does not throw.
 */
export function setConfig(config: Config): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save config to localStorage:', error);
  }
}

/**
 * React hook for managing config state with localStorage persistence.
 */
export function useConfig(): [Config, (config: Config) => void] {
  const [config, setConfigState] = useState<Config>(getConfig);

  useEffect(() => {
    setConfig(config);
  }, [config]);

  return [config, setConfigState];
}
