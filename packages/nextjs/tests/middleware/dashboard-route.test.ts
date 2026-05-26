import { beforeEach, describe, expect, it } from "vitest";
import { handleDashboardRoute } from "../../src/middleware/dashboard-route.js";
import {
  clearTokens,
  clearKeyManager,
  clearDomainVerification,
} from "@vhyxseal/core";

beforeEach(() => {
  clearTokens();
  clearKeyManager();
  clearDomainVerification();
});

describe("handleDashboardRoute — method guard", () => {
  it("returns 405 for POST method", () => {
    const result = handleDashboardRoute({ method: "POST" });
    expect(result.status).toBe(405);
  });

  it("returns 405 for PUT method", () => {
    const result = handleDashboardRoute({ method: "PUT" });
    expect(result.status).toBe(405);
  });
});

describe("handleDashboardRoute — GET response", () => {
  it("returns 200 for GET method", () => {
    const result = handleDashboardRoute({ method: "GET" });
    expect(result.status).toBe(200);
  });

  it("returns Content-Type: application/json for GET", () => {
    const result = handleDashboardRoute({ method: "GET" });
    expect(result.headers["Content-Type"]).toBe("application/json");
  });

  it("body parses as valid JSON for GET", () => {
    const result = handleDashboardRoute({ method: "GET" });
    expect(() => JSON.parse(result.body)).not.toThrow();
  });

  it("body has all six top-level keys", () => {
    const result = handleDashboardRoute({ method: "GET" });
    const body = JSON.parse(result.body) as Record<string, unknown>;
    expect(body).toHaveProperty("generatedAt");
    expect(body).toHaveProperty("contractCoverage");
    expect(body).toHaveProperty("manifestHealth");
    expect(body).toHaveProperty("domainVerification");
    expect(body).toHaveProperty("keyManagement");
    expect(body).toHaveProperty("actionTokens");
    expect(body).toHaveProperty("agentPolicy");
  });
});

describe("handleDashboardRoute — contractCoverage", () => {
  it("contractCoverage.missing is null (not undefined, not 0)", () => {
    const result = handleDashboardRoute({ method: "GET" });
    const body = JSON.parse(result.body) as Record<string, unknown>;
    const cov = body["contractCoverage"] as Record<string, unknown>;
    // JSON.parse returns null for JSON null, and undefined properties are omitted
    expect(cov["missing"]).toBeNull();
  });
});

describe("handleDashboardRoute — manifestHealth", () => {
  it("manifestHealth.lastGenerated is null (not undefined)", () => {
    const result = handleDashboardRoute({ method: "GET" });
    const body = JSON.parse(result.body) as Record<string, unknown>;
    const mh = body["manifestHealth"] as Record<string, unknown>;
    expect(mh["lastGenerated"]).toBeNull();
  });

  it("manifestHealth.fingerprint is null (not undefined)", () => {
    const result = handleDashboardRoute({ method: "GET" });
    const body = JSON.parse(result.body) as Record<string, unknown>;
    const mh = body["manifestHealth"] as Record<string, unknown>;
    expect(mh["fingerprint"]).toBeNull();
  });
});

describe("handleDashboardRoute — keyManagement with no key registered", () => {
  it("keyManagement.activeKeyId is null when no key registered", () => {
    const result = handleDashboardRoute({ method: "GET" });
    const body = JSON.parse(result.body) as Record<string, unknown>;
    const km = body["keyManagement"] as Record<string, unknown>;
    expect(km["activeKeyId"]).toBeNull();
  });

  it("keyManagement.rotationDue is null when no key registered", () => {
    const result = handleDashboardRoute({ method: "GET" });
    const body = JSON.parse(result.body) as Record<string, unknown>;
    const km = body["keyManagement"] as Record<string, unknown>;
    expect(km["rotationDue"]).toBeNull();
  });
});

describe("handleDashboardRoute — actionTokens initial state", () => {
  it("actionTokens.issued is 0 initially (number, not null)", () => {
    const result = handleDashboardRoute({ method: "GET" });
    const body = JSON.parse(result.body) as Record<string, unknown>;
    const at = body["actionTokens"] as Record<string, unknown>;
    expect(at["issued"]).toBe(0);
    expect(typeof at["issued"]).toBe("number");
  });
});

describe("handleDashboardRoute — agentPolicy", () => {
  it("agentPolicy.allowedAgents is an array", () => {
    const result = handleDashboardRoute({ method: "GET" });
    const body = JSON.parse(result.body) as Record<string, unknown>;
    const ap = body["agentPolicy"] as Record<string, unknown>;
    expect(Array.isArray(ap["allowedAgents"])).toBe(true);
  });

  it("agentPolicy.manifestAccess is 'public'", () => {
    const result = handleDashboardRoute({ method: "GET" });
    const body = JSON.parse(result.body) as Record<string, unknown>;
    const ap = body["agentPolicy"] as Record<string, unknown>;
    expect(ap["manifestAccess"]).toBe("public");
  });
});
