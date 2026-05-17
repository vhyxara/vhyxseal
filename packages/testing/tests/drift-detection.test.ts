import { beforeEach, describe, it, expect } from "vitest";
import { defineContract, generateFingerprint, clearRelationshipRegistry, clearCapabilityRegistry } from "@vhyxseal/core";
import { detectDrift, isDriftWarning } from "../src/drift-detection.js";

beforeEach(() => {
  clearRelationshipRegistry();
  clearCapabilityRegistry();
});

const baseContract = {
  id: "drift-test-btn",
  type: "action" as const,
  intent: "submit-form",
  description: "Test button for drift detection",
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

describe("detectDrift", () => {
  it("returns false when fingerprint matches baseline", () => {
    const contract = defineContract({ ...baseContract, id: "drift-match-btn" });
    // defineContract always sets fingerprint; ?? "" satisfies TypeScript's optional typing
    const baseline = contract.fingerprint ?? "";
    expect(detectDrift(contract, baseline)).toBe(false);
  });

  it("returns true when fingerprint differs from baseline", () => {
    const contract = defineContract({ ...baseContract, id: "drift-differ-btn" });
    expect(detectDrift(contract, "vhyxs_00000000")).toBe(true);
  });

  it("uses generateFingerprint on contract when fingerprint field is absent", () => {
    const noFp = { ...baseContract, id: "drift-no-fp-btn" };
    const expectedFp = generateFingerprint(JSON.stringify(noFp));
    expect(detectDrift(noFp, expectedFp)).toBe(false);
    expect(detectDrift(noFp, "vhyxs_00000000")).toBe(true);
  });
});

describe("isDriftWarning", () => {
  it("returns true when lastVerified is older than threshold", () => {
    const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();
    const contract = { ...baseContract, lastVerified: fortyDaysAgo };
    expect(isDriftWarning(contract, 30)).toBe(true);
  });

  it("returns false when lastVerified is recent", () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const contract = { ...baseContract, lastVerified: fiveDaysAgo };
    expect(isDriftWarning(contract, 30)).toBe(false);
  });

  it("returns true when lastVerified is absent (never verified)", () => {
    const contract = { ...baseContract };
    expect(isDriftWarning(contract)).toBe(true);
  });

  it("uses 30 day default when no threshold provided", () => {
    const twentyNineDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString();
    const recentContract = { ...baseContract, lastVerified: twentyNineDaysAgo };
    expect(isDriftWarning(recentContract)).toBe(false);

    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    const staleContract = { ...baseContract, lastVerified: thirtyOneDaysAgo };
    expect(isDriftWarning(staleContract)).toBe(true);
  });

  it("respects custom threshold", () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const contract = { ...baseContract, lastVerified: tenDaysAgo };
    expect(isDriftWarning(contract, 7)).toBe(true);
    expect(isDriftWarning(contract, 14)).toBe(false);
  });
});
