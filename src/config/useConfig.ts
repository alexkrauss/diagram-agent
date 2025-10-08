import { useState, useEffect } from 'react';

export interface Config {
  apiKey: string;
}

const CONFIG_KEY = 'diagent-config';

const defaultConfig: Config = {
  apiKey: '',
};

export function useConfig(): [Config, (config: Config) => void] {
  const [config, setConfigState] = useState<Config>(() => {
    try {
      const stored = localStorage.getItem(CONFIG_KEY);
      return stored ? JSON.parse(stored) : defaultConfig;
    } catch (error) {
      console.error('Failed to load config from localStorage:', error);
      return defaultConfig;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save config to localStorage:', error);
    }
  }, [config]);

  return [config, setConfigState];
}
