import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["src/**/*.d.ts", "src/types/**/*.ts"],
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "html", "json"],
    },
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
  },
});
