import { beforeEach, describe, expect, it } from "vitest";
import {
  clearDomainVerification,
  getDomainVerificationStats,
  issueDomainToken,
  revokeDomainToken,
  verifyDomainToken,
} from "../../src/domain/verification.js";
import { clearKeyManager, registerKey } from "../../src/keys/key-manager.js";

beforeEach(() => {
  clearDomainVerification();
  clearKeyManager();
  registerKey("a".repeat(64));
});

describe("getDomainVerificationStats — initial state", () => {
  it("returns empty stats with no state", () => {
    const stats = getDomainVerificationStats();
    expect(stats).toEqual({
      registeredDomains: 0,
      verifiedDomains: 0,
      domains: [],
    });
  });
});

describe("getDomainVerificationStats — after issueDomainToken()", () => {
  it("increments registeredDomains to 1 after one issueDomainToken() call", () => {
    issueDomainToken("example.com");
    const stats = getDomainVerificationStats();
    expect(stats.registeredDomains).toBe(1);
  });

  it("domains array contains the registered domain with verified: false initially", () => {
    issueDomainToken("example.com");
    const stats = getDomainVerificationStats();
    expect(stats.domains).toHaveLength(1);
    const entry = stats.domains[0];
    expect(entry).toBeDefined();
    expect(entry!.domain).toBe("example.com");
    expect(entry!.verified).toBe(false);
  });

  it("tokenExpiry is a valid ISO string for a fresh token", () => {
    issueDomainToken("example.com");
    const stats = getDomainVerificationStats();
    const entry = stats.domains[0];
    expect(entry).toBeDefined();
    expect(entry!.tokenExpiry).not.toBeNull();
    // Should be parseable as a date
    const parsed = new Date(entry!.tokenExpiry as string);
    expect(isNaN(parsed.getTime())).toBe(false);
    // Should be in the future (TTL = 30 days)
    expect(parsed.getTime()).toBeGreaterThan(Date.now());
  });
});

describe("getDomainVerificationStats — after verifyDomainToken()", () => {
  it("sets verified: true after successful verifyDomainToken()", () => {
    const token = issueDomainToken("example.com");
    verifyDomainToken("example.com", token);
    const stats = getDomainVerificationStats();
    expect(stats.verifiedDomains).toBe(1);
    const entry = stats.domains[0];
    expect(entry).toBeDefined();
    expect(entry!.verified).toBe(true);
  });
});

describe("getDomainVerificationStats — after revokeDomainToken()", () => {
  it("removes domain from registeredDomains and domains array after revokeDomainToken()", () => {
    issueDomainToken("example.com");
    revokeDomainToken("example.com");
    const stats = getDomainVerificationStats();
    expect(stats.registeredDomains).toBe(0);
    expect(stats.domains).toHaveLength(0);
  });
});

describe("getDomainVerificationStats — after clearDomainVerification()", () => {
  it("resets all stats to zero after clearDomainVerification()", () => {
    const token = issueDomainToken("example.com");
    verifyDomainToken("example.com", token);
    clearDomainVerification();
    const stats = getDomainVerificationStats();
    expect(stats).toEqual({
      registeredDomains: 0,
      verifiedDomains: 0,
      domains: [],
    });
  });
});
