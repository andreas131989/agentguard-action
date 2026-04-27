import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
    coverage: {
      reporter: ["text", "html"],
      exclude: ["dist/**", "node_modules/**"]
    }
  }
});
