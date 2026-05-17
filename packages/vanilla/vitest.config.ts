import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
  },
  resolve: {
    alias: {
      "@vhyxseal/core": new URL("../core/dist/index.js", import.meta.url).pathname,
    },
  },
});
