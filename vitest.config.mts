import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      include: [
        "lib/**/*.ts",
        "db/index.ts",
        "proxy.ts",
        "app/**/actions.ts",
        "app/**/actions/*.ts",
      ],
    },
  },
})
