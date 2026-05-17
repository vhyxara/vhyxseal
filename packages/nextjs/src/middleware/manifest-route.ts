import { negotiateVersion, generateManifest } from "@vhyxseal/core";
import type { ComponentContract, ManifestConfig } from "@vhyxseal/core";

/** Minimal request abstraction compatible with both App Router and Pages Router. */
export interface ManifestRouteRequest {
  headers: {
    get(name: string): string | null;
  };
}

/** The serialisable response returned by handleManifestRoute. */
export interface ManifestRouteResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

/** Configuration for the manifest route handler. */
export interface ManifestRouteConfig {
  /** The domain this manifest is for. */
  domain: string;
  /** Whether domain ownership has been verified. */
  domainVerified?: boolean;
  /** Verification token from the VhyxSeal registry. */
  verificationToken?: string;
  /** Component contracts to include in the manifest. */
  contracts?: ReadonlyArray<Readonly<ComponentContract>>;
  /** Cache duration in seconds — default 3600. */
  cacheDurationSeconds?: number;
}

const AVAILABLE_VERSIONS: ReadonlyArray<string> = ["1.0.0"];
const VHYXSEAL_VERSION = "1.0.0";

/**
 * Handles the GET /__agent__/manifest.json route.
 *
 * Compatible with Next.js App Router Route Handlers and Pages Router API routes.
 * Reads version negotiation headers, generates the manifest, and returns a
 * serialisable response object the caller converts to the framework response.
 *
 * @param request - Minimal request abstraction with a headers.get() method
 * @param config - Domain, contracts, and cache configuration
 * @returns A ManifestRouteResponse with status, headers, and JSON body
 * @example
 * // app/__agent__/manifest.json/route.ts
 * export async function GET(request: Request) {
 *   const result = handleManifestRoute(request, { domain: 'example.com' })
 *   return new Response(result.body, { status: result.status, headers: result.headers })
 * }
 */
export function handleManifestRoute(
  request: ManifestRouteRequest,
  config: ManifestRouteConfig,
): ManifestRouteResponse {
  try {
    const requestedVersion =
      request.headers.get("vhyxseal-version") ?? VHYXSEAL_VERSION;
    const fallbackHeader = request.headers.get("vhyxseal-fallback");
    const fallbackVersion = fallbackHeader !== null ? fallbackHeader : undefined;

    const negotiation = negotiateVersion(
      requestedVersion,
      fallbackVersion,
      AVAILABLE_VERSIONS,
    );

    if (!negotiation.compatible) {
      return {
        status: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "No compatible manifest version available",
          requestedVersion,
          servedVersion: negotiation.servedVersion,
          message: negotiation.degradationMessage,
        }),
      };
    }

    const manifestConfig: ManifestConfig = {
      domain: config.domain,
      domainVerified: config.domainVerified ?? false,
      verificationToken: config.verificationToken ?? "",
      ...(config.cacheDurationSeconds !== undefined && {
        cacheDurationSeconds: config.cacheDurationSeconds,
      }),
    };

    const manifest = generateManifest(
      [...(config.contracts ?? [])],
      manifestConfig,
    );

    const responseHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      ETag: `"${manifest.fingerprint}"`,
      "X-VhyxSeal-Version": VHYXSEAL_VERSION,
      "X-VhyxSeal-Domain": config.domain,
    };

    if (!negotiation.exactMatch && negotiation.degradationMessage !== undefined) {
      responseHeaders["X-VhyxSeal-Degraded"] = "true";
      responseHeaders["X-VhyxSeal-Degraded-Reason"] =
        negotiation.degradationMessage;
    }

    return {
      status: 200,
      headers: responseHeaders,
      body: JSON.stringify(manifest),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: message }),
    };
  }
}
