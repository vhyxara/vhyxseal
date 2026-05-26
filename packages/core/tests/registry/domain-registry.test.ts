import { describe, it, expect, beforeEach } from "vitest";
import { createDomainRegistry } from "../../src/registry/domain-registry.js";
import type { DomainRegistry } from "../../src/registry/domain-registry.js";

let registry: DomainRegistry;

beforeEach(() => {
  registry = createDomainRegistry();
});

describe("createDomainRegistry — issueToken", () => {
  it("returns token with correct domain", () => {
    const record = registry.issueToken("example.com");
    expect(record.domain).toBe("example.com");
  });

  it("token is a 64-character lowercase hex string (randomBytes(32) — unified format)", () => {
    // Session 5-001 Item 2: token format unified to randomBytes(32).toString('hex').
    // Previously "vhyxs-domain-{hex}" prefix; now plain 64-char hex consistent
    // with action tokens, key IDs, and Constraint 5.
    const record = registry.issueToken("example.com");
    expect(record.token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("token has issuedAt and expiresAt set", () => {
    const record = registry.issueToken("example.com");
    expect(record.issuedAt).toBeTruthy();
    expect(record.expiresAt).toBeTruthy();
    expect(new Date(record.issuedAt).toISOString()).toBe(record.issuedAt);
    expect(new Date(record.expiresAt).toISOString()).toBe(record.expiresAt);
  });

  it("expiresAt is 30 days after issuedAt", () => {
    const record = registry.issueToken("example.com");
    const diff = new Date(record.expiresAt).getTime() - new Date(record.issuedAt).getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    expect(diff).toBe(thirtyDaysMs);
  });

  it("verified is false on issuance", () => {
    const record = registry.issueToken("example.com");
    expect(record.verified).toBe(false);
  });

  it("issueToken on existing domain replaces previous token", () => {
    const first = registry.issueToken("example.com");
    const second = registry.issueToken("example.com");
    expect(second.token).not.toBe(first.token);
    expect(registry.getToken("example.com")?.token).toBe(second.token);
  });
});

describe("createDomainRegistry — verifyToken", () => {
  it("verifyToken with correct token sets verified true and returns true", () => {
    const record = registry.issueToken("example.com");
    const result = registry.verifyToken("example.com", record.token);
    expect(result).toBe(true);
    expect(registry.getToken("example.com")?.verified).toBe(true);
  });

  it("verifyToken with wrong token returns false", () => {
    registry.issueToken("example.com");
    const result = registry.verifyToken("example.com", "wrong-token");
    expect(result).toBe(false);
  });

  it("verifyToken with expired token returns false", () => {
    const record = registry.issueToken("example.com");
    // Manually expire the token
    const stored = registry.getToken("example.com");
    if (stored) {
      // Override expiry to the past by replacing the record via re-issue
      // Directly mutate the stored reference (it's a plain object)
      (stored as { expiresAt: string }).expiresAt = new Date(Date.now() - 1000).toISOString();
    }
    const result = registry.verifyToken("example.com", record.token);
    expect(result).toBe(false);
  });
});

describe("createDomainRegistry — isVerified", () => {
  it("isVerified returns false before verifyToken called", () => {
    registry.issueToken("example.com");
    expect(registry.isVerified("example.com")).toBe(false);
  });

  it("isVerified returns true after successful verifyToken", () => {
    const record = registry.issueToken("example.com");
    registry.verifyToken("example.com", record.token);
    expect(registry.isVerified("example.com")).toBe(true);
  });

  it("isVerified returns false for unknown domain", () => {
    expect(registry.isVerified("unknown.com")).toBe(false);
  });
});

describe("createDomainRegistry — revokeToken and getToken", () => {
  it("revokeToken removes domain — isVerified returns false after", () => {
    const record = registry.issueToken("example.com");
    registry.verifyToken("example.com", record.token);
    expect(registry.isVerified("example.com")).toBe(true);
    registry.revokeToken("example.com");
    expect(registry.isVerified("example.com")).toBe(false);
  });

  it("getToken returns stored token record", () => {
    const issued = registry.issueToken("example.com");
    const stored = registry.getToken("example.com");
    expect(stored).toBeDefined();
    expect(stored?.token).toBe(issued.token);
    expect(stored?.domain).toBe("example.com");
  });

  it("getToken returns undefined for unknown domain", () => {
    expect(registry.getToken("unknown.com")).toBeUndefined();
  });
});
