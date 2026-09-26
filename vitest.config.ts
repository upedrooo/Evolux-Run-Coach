import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["code-samples/**/*.test.ts"], environment: "node" },
});
