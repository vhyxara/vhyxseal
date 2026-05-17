import type { NextConfig } from "next";

/**
 * VhyxSeal Next.js plugin. Wraps your next.config.js to enable automatic
 * manifest generation and the /__agent__/manifest.json route.
 *
 * Automatically injects:
 * - Response headers for /__agent__/manifest.json (Cache-Control, X-VhyxSeal-Version)
 * - A rewrite from /__agent__/manifest.json to /api/vhyxseal-manifest
 *
 * To serve the manifest, create a route handler at:
 * app/api/vhyxseal-manifest/route.ts
 *
 * @param nextConfig - Your existing Next.js config (or empty object)
 * @returns Enhanced NextConfig with VhyxSeal support
 * @example
 * // next.config.ts
 * import { vhyxsealPlugin } from '@vhyxseal/nextjs'
 * export default vhyxsealPlugin({})
 *
 * // app/api/vhyxseal-manifest/route.ts
 * import { handleManifestRoute } from '@vhyxseal/nextjs'
 * export function GET(request) {
 *   const result = handleManifestRoute(request, { domain: 'example.com', ... })
 *   return new Response(result.body, { status: result.status, headers: result.headers })
 * }
 */
export function vhyxsealPlugin(nextConfig: NextConfig = {}): NextConfig {
  return {
    ...nextConfig,

    headers: async () => {
      const existingHeaders =
        typeof nextConfig.headers === "function"
          ? await nextConfig.headers()
          : [];
      return [
        ...existingHeaders,
        {
          source: "/__agent__/manifest.json",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=3600, stale-while-revalidate=86400",
            },
            { key: "X-VhyxSeal-Version", value: "1.0.0" },
          ],
        },
      ];
    },

    rewrites: async () => {
      const existingRewrites =
        typeof nextConfig.rewrites === "function"
          ? await nextConfig.rewrites()
          : [];

      // Handle both array and { beforeFiles, afterFiles, fallback } formats.
      type RewritesResult = Awaited<ReturnType<NonNullable<NextConfig["rewrites"]>>>;
      const normalizeRewrites = (r: RewritesResult) => {
        if (Array.isArray(r)) return r;
        return [...(r.beforeFiles ?? []), ...(r.afterFiles ?? []), ...(r.fallback ?? [])];
      };

      const existing = normalizeRewrites(existingRewrites);

      // Do not add duplicate if developer has already configured this rewrite.
      const alreadyConfigured = existing.some(
        (rw) => rw.source === "/__agent__/manifest.json"
      );

      if (alreadyConfigured) return existing;

      return [
        ...existing,
        {
          source: "/__agent__/manifest.json",
          destination: "/api/vhyxseal-manifest",
        },
      ];
    },
  };
}
