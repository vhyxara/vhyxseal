import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
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
