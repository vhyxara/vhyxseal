import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
  },
  resolve: {
    alias: {
      "@vhyxseal/core": new URL("../core/dist/index.js", import.meta.url).pathname,
      "@vhyxseal/react": new URL("../react/src/index.ts", import.meta.url).pathname,
    },
  },
});
