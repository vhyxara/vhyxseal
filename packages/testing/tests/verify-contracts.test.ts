import { beforeEach, describe, it, expect } from "vitest";
import { defineContract, clearRelationshipRegistry, clearCapabilityRegistry } from "@vhyxseal/core";
import { verifyContracts } from "../src/verify-contracts.js";

beforeEach(() => {
  clearRelationshipRegistry();
  clearCapabilityRegistry();
});

const baseContract = {
  id: "verify-test-btn",
  type: "action" as const,
  intent: "submit-form",
  description: "Test button for verify contracts",
  requires: [],
  requiredPermissions: [],
  consequence: "Submits the form",
  affects: [],
  reversible: false,
  safetyLevel: "low" as const,
  requiresConfirmation: false,
  destructive: false,
  contractVersion: "1.0.0",
};

// defineContract always sets verifiedBy: "auto". To test the healthy path,
// spread the result and override verifiedBy to "manual".
function makeHealthy(id: string): ReturnType<typeof defineContract> & { verifiedBy: "manual" } {
  return { ...defineContract({ ...baseContract, id }), verifiedBy: "manual" };
}

describe("verifyContracts", () => {
  it("empty array returns all zeros with totalChecked 0", () => {
    const result = verifyContracts([]);
    expect(result.healthy).toHaveLength(0);
    expect(result.stale).toHaveLength(0);
    expect(result.broken).toHaveLength(0);
    expect(result.missing).toHaveLength(0);
    expect(result.totalChecked).toBe(0);
  });

  it("complete valid contract with recent lastVerified is healthy", () => {
    const contract = makeHealthy("verify-healthy-btn");
    const result = verifyContracts([contract]);
    expect(result.healthy).toHaveLength(1);
    expect(result.stale).toHaveLength(0);
    expect(result.broken).toHaveLength(0);
    expect(result.totalChecked).toBe(1);
  });

  it("complete contract with lastVerified 45 days ago is stale", () => {
    const fortyFiveDaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();
    const base = { ...defineContract({ ...baseContract, id: "verify-stale-btn" }), verifiedBy: "manual" as const };
    const contract = { ...base, lastVerified: fortyFiveDaysAgo };
    const result = verifyContracts([contract]);
    expect(result.stale).toHaveLength(1);
    expect(result.healthy).toHaveLength(0);
    expect(result.broken).toHaveLength(0);
    expect(result.stale[0]?.contractId).toBe("verify-stale-btn");
  });

  it("complete contract with verifiedBy 'auto' is stale", () => {
    // defineContract always produces verifiedBy: "auto" — this is the expected stale case
    const contract = defineContract({ ...baseContract, id: "verify-auto-btn" });
    const result = verifyContracts([contract]);
    expect(result.stale).toHaveLength(1);
    expect(result.stale[0]?.status).toBe("stale");
    expect(result.healthy).toHaveLength(0);
  });

  it("partial contract missing required fields is broken", () => {
    const partial = { id: "verify-partial-btn" };
    const result = verifyContracts([partial]);
    expect(result.broken).toHaveLength(1);
    expect(result.broken[0]?.contractId).toBe("verify-partial-btn");
    expect(result.broken[0]?.issues.length).toBeGreaterThan(0);
  });

  it("contract with invalid safetyLevel is broken", () => {
    // as unknown as Readonly<Partial<ComponentContract>> required to pass an invalid safetyLevel
    // that cannot exist in the safe type system but must be tested for runtime validation.
    const invalid = { ...baseContract, id: "verify-invalid-safety", safetyLevel: "extreme" } as unknown as Readonly<Partial<import("@vhyxseal/core").ComponentContract>>;
    const result = verifyContracts([invalid]);
    expect(result.broken).toHaveLength(1);
    expect(result.broken[0]?.issues.some(i => i.includes("not a valid"))).toBe(true);
  });

  it("contract missing fingerprint is broken", () => {
    // Plain object without fingerprint — validateContract passes but fingerprint is absent
    const noFingerprint = { ...baseContract, id: "verify-no-fp-btn" };
    const result = verifyContracts([noFingerprint]);
    expect(result.broken).toHaveLength(1);
    expect(result.broken[0]?.issues.some(i => i.includes("fingerprint"))).toBe(true);
  });

  it("stalenessThresholdDays option overrides default 30 days", () => {
    const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
    const base = makeHealthy("verify-threshold-btn");
    const contract = { ...base, lastVerified: twentyDaysAgo };

    // Default 30 days — 20 days old is healthy
    const defaultResult = verifyContracts([contract]);
    expect(defaultResult.healthy).toHaveLength(1);

    // Custom 10 days — 20 days old is stale
    const strictResult = verifyContracts([contract], { stalenessThresholdDays: 10 });
    expect(strictResult.stale).toHaveLength(1);
  });

  it("multiple contracts are grouped correctly across healthy/stale/broken", () => {
    const healthyContract = makeHealthy("verify-multi-healthy");
    const staleContract = defineContract({ ...baseContract, id: "verify-multi-stale" }); // verifiedBy: "auto" → stale
    const brokenContract = { id: "verify-multi-broken" };

    const result = verifyContracts([healthyContract, staleContract, brokenContract]);
    expect(result.healthy).toHaveLength(1);
    expect(result.stale).toHaveLength(1);
    expect(result.broken).toHaveLength(1);
    expect(result.totalChecked).toBe(3);
  });
});
