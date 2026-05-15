import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
  },
  resolve: {
    alias: {
      // Resolve @vhyxseal/core from its compiled dist during tests.
      // The dist is pre-built; this avoids having to transform TypeScript from source.
      "@vhyxseal/core": resolve(__dirname, "../core/dist/index.js"),
    },
  },
});
