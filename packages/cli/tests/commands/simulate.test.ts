import { describe, it, expect, beforeEach } from "vitest";
import { simulate } from "../../src/commands/simulate.js";

// Minimal valid manifest JSON — matches what the route handler returns
function makeValidManifestJson(): Record<string, unknown> {
  return {
    vhyxseal: "1.0.0",
    schemaUrl: "https://vhyxseal.dev/schema/1.0.0.json",
    domain: "example.com",
    domainVerified: false,
    verificationToken: "",
    signature: "unsigned",
    signedAt: new Date().toISOString(),
    fingerprint: "abc123def456",
    capabilities: [],
    components: [],
    relationships: [],
    agentPolicy: {
      allowedAgents: ["*"],
      blockedAgents: [],
      requireAgentIdentification: false,
      rateLimits: { actionsPerMinute: 60, actionsPerHour: 1000, manifestRequestsPerMinute: 10, perAgentSession: false },
      allowedActions: ["*"],
      blockedActions: [],
      requiresConfirmation: [],
      requiresHumanPresent: [],
      manifestAccess: "public",
    },
    generatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  };
}

function mockFetch(status: number, body: unknown, headers: Record<string, string> = {}): void {
  globalThis.fetch = async () =>
    ({
      ok: status >= 200 && status < 300,
      status,
      headers: { get: (k: string) => headers[k] ?? null },
      text: async () => JSON.stringify(body),
      json: async () => body,
    }) as unknown as Response;
}

// Restore a no-op fetch after each test so a leaked mock doesn't bleed through
beforeEach(() => {
  globalThis.fetch = async () => { throw new Error("fetch not mocked"); };
});

describe("simulate", () => {
  it("valid manifest URL returns success: true and non-null manifest", async () => {
    mockFetch(200, makeValidManifestJson());
    const result = await simulate({ url: "http://example.com" });
    expect(result.success).toBe(true);
    expect(result.manifest).not.toBeNull();
  });

  it("URL without path appends /__agent__/manifest.json", async () => {
    let capturedUrl = "";
    globalThis.fetch = async (url: unknown) => {
      capturedUrl = String(url);
      return { ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify(makeValidManifestJson()) } as unknown as Response;
    };
    await simulate({ url: "http://example.com" });
    expect(capturedUrl).toBe("http://example.com/__agent__/manifest.json");
  });

  it("URL already with path does not double-append", async () => {
    let capturedUrl = "";
    globalThis.fetch = async (url: unknown) => {
      capturedUrl = String(url);
      return { ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify(makeValidManifestJson()) } as unknown as Response;
    };
    await simulate({ url: "http://example.com/__agent__/manifest.json" });
    expect(capturedUrl).toBe("http://example.com/__agent__/manifest.json");
  });

  it("non-200 response returns success: false with errors", async () => {
    mockFetch(404, { error: "not found" });
    const result = await simulate({ url: "http://example.com" });
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("invalid JSON body returns success: false", async () => {
    globalThis.fetch = async () =>
      ({ ok: true, status: 200, headers: { get: () => null }, text: async () => "not-valid-json{{" }) as unknown as Response;
    const result = await simulate({ url: "http://example.com" });
    expect(result.success).toBe(false);
  });

  it("network error returns success: false and does not throw to caller", async () => {
    globalThis.fetch = async () => { throw new Error("ECONNREFUSED"); };
    const result = await simulate({ url: "http://example.com" });
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("request includes vhyxseal-version header", async () => {
    let capturedInit: RequestInit | undefined;
    globalThis.fetch = async (_url: unknown, init?: RequestInit) => {
      capturedInit = init;
      return { ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify(makeValidManifestJson()) } as unknown as Response;
    };
    await simulate({ url: "http://example.com" });
    // implementation passes headers as a plain Record<string, string>
    const headers = capturedInit?.headers as Record<string, string> | undefined;
    expect(headers?.["vhyxseal-version"]).toBeDefined();
  });

  it("default agent version is '1.0.0'", async () => {
    let capturedInit: RequestInit | undefined;
    globalThis.fetch = async (_url: unknown, init?: RequestInit) => {
      capturedInit = init;
      return { ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify(makeValidManifestJson()) } as unknown as Response;
    };
    await simulate({ url: "http://example.com" });
    // implementation passes headers as a plain Record<string, string>
    const headers = capturedInit?.headers as Record<string, string> | undefined;
    expect(headers?.["vhyxseal-version"]).toBe("1.0.0");
  });

  it("custom agentVersion is sent in vhyxseal-version header", async () => {
    let capturedInit: RequestInit | undefined;
    globalThis.fetch = async (_url: unknown, init?: RequestInit) => {
      capturedInit = init;
      return { ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify(makeValidManifestJson()) } as unknown as Response;
    };
    await simulate({ url: "http://example.com", agentVersion: "0.9.0" });
    // implementation passes headers as a plain Record<string, string>
    const headers = capturedInit?.headers as Record<string, string> | undefined;
    expect(headers?.["vhyxseal-version"]).toBe("0.9.0");
  });
});
