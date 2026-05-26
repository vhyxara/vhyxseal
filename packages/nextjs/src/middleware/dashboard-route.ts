import {
  getTokenStats,
  getDomainVerificationStats,
  getActiveKey,
  listKeys,
  getAuditLog,
} from "@vhyxseal/core";

/** Minimal request abstraction for the dashboard route handler. */
export interface DashboardRouteRequest {
  readonly method: string;
}

/** The serialisable response returned by handleDashboardRoute. */
export interface DashboardRouteResponse {
  readonly status: number;
  readonly headers: Record<string, string>;
  readonly body: string;
}

/**
 * Handles the GET /__agent__/dashboard.json route.
 *
 * Returns a JSON payload with six sections of dashboard data sourced
 * from @vhyxseal/core in-memory registries. Read-only — no write operations.
 * Non-GET methods return 405 Method Not Allowed.
 *
 * @param request - Object with a `method` string property
 * @returns DashboardRouteResponse with status, headers, and JSON body
 * @example
 * // app/api/vhyxseal-dashboard/route.ts
 * export function GET(request: Request) {
 *   const result = handleDashboardRoute({ method: request.method })
 *   return new Response(result.body, { status: result.status, headers: result.headers })
 * }
 */
export function handleDashboardRoute(
  request: DashboardRouteRequest,
): DashboardRouteResponse {
  if (request.method !== "GET") {
    return {
      status: 405,
      headers: {
        Allow: "GET",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const tokenStats = getTokenStats();
  const domainStats = getDomainVerificationStats();
  const activeKey = getActiveKey();
  const allKeys = listKeys();

  // Build rotation due timestamp — null if key never expires (expiresAt === 0) or no active key
  const rotationDue: string | null =
    activeKey !== null && activeKey.expiresAt !== 0
      ? new Date(activeKey.expiresAt).toISOString()
      : null;

  const activeKeyId: string | null =
    activeKey !== null ? activeKey.keyId : null;

  const data = {
    generatedAt: new Date().toISOString(),
    contractCoverage: {
      full: 0,
      inferred: 0,
      // per DECISION-D3: null not 0 — missing detection is pending
      missing: null as null,
      total: 0,
    },
    manifestHealth: {
      // no global manifest state tracked
      lastGenerated: null as null,
      // no global manifest state tracked
      fingerprint: null as null,
      // signing is a documented stub (DECISION-D2)
      signatureValid: false,
      version: "1.0.0",
    },
    domainVerification: {
      registeredDomains: domainStats.registeredDomains,
      verifiedDomains: domainStats.verifiedDomains,
      domains: [...domainStats.domains],
    },
    keyManagement: {
      activeKeyId,
      keyCount: allKeys.length,
      rotationDue,
    },
    actionTokens: {
      issued: tokenStats.issued,
      used: tokenStats.used,
      expired: tokenStats.expired,
      replayAttempts: tokenStats.replayAttempts,
    },
    agentPolicy: {
      allowedAgents: [] as string[],
      manifestAccess: "public" as const,
      rateLimitsConfigured: false,
    },
    auditLog: {
      entries: [...getAuditLog()],
      maxEntries: 50,
    },
  };

  return {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store",
    },
    body: JSON.stringify(data),
  };
}
