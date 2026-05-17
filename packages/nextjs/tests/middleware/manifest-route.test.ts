import { describe, it, expect } from "vitest";
import { handleManifestRoute } from "../../src/middleware/manifest-route.js";
import type { ManifestRouteRequest, ManifestRouteConfig } from "../../src/middleware/manifest-route.js";

function mockRequest(headers: Record<string, string> = {}): ManifestRouteRequest {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  };
}

const baseConfig: ManifestRouteConfig = {
  domain: "test.com",
  domainVerified: false,
  verificationToken: "",
};

describe("handleManifestRoute", () => {
  it("returns status 200 for a valid request", () => {
    const result = handleManifestRoute(mockRequest(), baseConfig);
    expect(result.status).toBe(200);
  });

  it("returns Content-Type: application/json", () => {
    const result = handleManifestRoute(mockRequest(), baseConfig);
    expect(result.headers["Content-Type"]).toBe("application/json");
  });

  it("returns Cache-Control header with max-age=3600", () => {
    const result = handleManifestRoute(mockRequest(), baseConfig);
    expect(result.headers["Cache-Control"]).toContain("max-age=3600");
  });

  it("returns a non-empty ETag header", () => {
    const result = handleManifestRoute(mockRequest(), baseConfig);
    const etag = result.headers["ETag"];
    expect(etag).toBeDefined();
    expect((etag ?? "").length).toBeGreaterThan(0);
  });

  it("returns X-VhyxSeal-Version: 1.0.0", () => {
    const result = handleManifestRoute(mockRequest(), baseConfig);
    expect(result.headers["X-VhyxSeal-Version"]).toBe("1.0.0");
  });

  it("returns X-VhyxSeal-Domain matching config.domain", () => {
    const result = handleManifestRoute(mockRequest(), baseConfig);
    expect(result.headers["X-VhyxSeal-Domain"]).toBe("test.com");
  });

  it("returns a valid JSON body", () => {
    const result = handleManifestRoute(mockRequest(), baseConfig);
    expect(() => JSON.parse(result.body)).not.toThrow();
  });

  it("body contains vhyxseal field", () => {
    const result = handleManifestRoute(mockRequest(), baseConfig);
    const body = JSON.parse(result.body) as Record<string, unknown>;
    expect(body["vhyxseal"]).toBeDefined();
  });

  it("body contains capabilities array", () => {
    const result = handleManifestRoute(mockRequest(), baseConfig);
    const body = JSON.parse(result.body) as Record<string, unknown>;
    expect(Array.isArray(body["capabilities"])).toBe(true);
  });

  it("body contains agentPolicy object", () => {
    const result = handleManifestRoute(mockRequest(), baseConfig);
    const body = JSON.parse(result.body) as Record<string, unknown>;
    expect(typeof body["agentPolicy"]).toBe("object");
    expect(body["agentPolicy"]).not.toBeNull();
  });

  it("body contains components array", () => {
    const result = handleManifestRoute(mockRequest(), baseConfig);
    const body = JSON.parse(result.body) as Record<string, unknown>;
    expect(Array.isArray(body["components"])).toBe(true);
  });

  describe("version negotiation", () => {
    it("request with vhyxseal-version: 1.0.0 — compatible, no degradation header", () => {
      const result = handleManifestRoute(
        mockRequest({ "vhyxseal-version": "1.0.0" }),
        baseConfig,
      );
      expect(result.status).toBe(200);
      expect(result.headers["X-VhyxSeal-Degraded"]).toBeUndefined();
    });

    it("request with vhyxseal-version: 2.0.0 — returns status 400 with error body", () => {
      const result = handleManifestRoute(
        mockRequest({ "vhyxseal-version": "2.0.0" }),
        baseConfig,
      );
      expect(result.status).toBe(400);
      const body = JSON.parse(result.body) as Record<string, unknown>;
      expect(body["error"]).toBeDefined();
      expect(body["requestedVersion"]).toBe("2.0.0");
    });

    it("compatible fallback — returns 200 with X-VhyxSeal-Degraded: true", () => {
      // Request version 1.1.0 (not available); fallback 1.0.0 (available)
      // negotiateVersion will find 1.0.0 compatible via fallback path
      const result = handleManifestRoute(
        mockRequest({
          "vhyxseal-version": "1.1.0",
          "vhyxseal-fallback": "1.0.0",
        }),
        baseConfig,
      );
      // 1.1.0 is not available; 1.0.0 satisfies as compatible (lower minor)
      // served via step 2: highest compatible for requestedVersion
      // isCompatible("1.1.0", "1.0.0") — served 1.0.0 < requested 1.1.0 → not compatible for step 2
      // step 3: fallback 1.0.0, highest compatible for 1.0.0 in ["1.0.0"] → 1.0.0 exact → degraded
      expect(result.status).toBe(200);
      expect(result.headers["X-VhyxSeal-Degraded"]).toBe("true");
    });

    it("handleManifestRoute never throws — returns 500 on internal error", () => {
      // Pass an invalid config that will cause generateManifest to throw
      const badConfig = {
        domain: "",
        domainVerified: false,
        verificationToken: "",
      };
      let result: ReturnType<typeof handleManifestRoute> | undefined;
      expect(() => {
        result = handleManifestRoute(mockRequest(), badConfig);
      }).not.toThrow();
      expect(result).toBeDefined();
      expect(result!.status).toBe(500);
    });
  });
});
