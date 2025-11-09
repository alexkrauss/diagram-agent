import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  return {
    test: {
      // Exclude .eval.ts files from normal test runs
      exclude: ["**/node_modules/**", "**/*.eval.ts"],
      environment: "node",
      globals: true,
      // Increase timeout for LLM agent tests
      testTimeout: 30000, // 30 seconds
      // Run tests sequentially (one at a time) instead of in parallel
      threads: false,
    },
  };
});
