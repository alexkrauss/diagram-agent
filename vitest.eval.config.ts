import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    test: {
      // Only match .eval.ts files for evaluation tests
      include: ["**/*.eval.ts"],
      environment: "node",
      globals: true,
      // Increase timeout for LLM agent tests
      testTimeout: 30000, // 30 seconds
      env: {
        // Make all environment variables from .env available to tests
        ...env,
      },
    },
  };
});
