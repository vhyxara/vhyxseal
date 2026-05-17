import { beforeEach, describe, it, expect } from "vitest";
import { defineContract, clearRelationshipRegistry, clearCapabilityRegistry } from "@vhyxseal/core";
import { toHaveValidContract, toHaveIntent, toBeAgentSafe, vhyxSealMatchers } from "../src/matchers.js";

beforeEach(() => {
  clearRelationshipRegistry();
  clearCapabilityRegistry();
});

const baseContract = {
  id: "matcher-test-btn",
  type: "action" as const,
  intent: "submit-form",
  description: "Test button for matchers",
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

describe("toHaveValidContract", () => {
  it("valid contract returns pass true", () => {
    const contract = defineContract({ ...baseContract, id: "matcher-valid-btn" });
    const result = toHaveValidContract(contract);
    expect(result.pass).toBe(true);
  });

  it("partial contract returns pass false and message mentions contract id", () => {
    const partial = { id: "matcher-partial-btn" };
    const result = toHaveValidContract(partial);
    expect(result.pass).toBe(false);
    expect(result.message()).toContain("matcher-partial-btn");
  });
});

describe("toHaveIntent", () => {
  it("matching intent returns pass true", () => {
    const contract = { ...baseContract, id: "matcher-intent-match", intent: "search" };
    const result = toHaveIntent(contract, "search");
    expect(result.pass).toBe(true);
  });

  it("wrong intent returns pass false with message showing expected and received", () => {
    const contract = { ...baseContract, id: "matcher-intent-wrong", intent: "search" };
    const result = toHaveIntent(contract, "place-order");
    expect(result.pass).toBe(false);
    expect(result.message()).toContain("place-order");
    expect(result.message()).toContain("search");
  });
});

describe("toBeAgentSafe", () => {
  it("low safety level returns pass true", () => {
    const contract = { ...baseContract, id: "matcher-low-safety", safetyLevel: "low" as const };
    const result = toBeAgentSafe(contract);
    expect(result.pass).toBe(true);
  });

  it("high safety with requiresConfirmation true returns pass true", () => {
    const contract = {
      ...baseContract,
      id: "matcher-high-confirmed",
      safetyLevel: "high" as const,
      requiresConfirmation: true,
    };
    const result = toBeAgentSafe(contract);
    expect(result.pass).toBe(true);
  });

  it("high safety with requiresConfirmation false returns pass false", () => {
    const contract = {
      ...baseContract,
      id: "matcher-high-unconfirmed",
      safetyLevel: "high" as const,
      requiresConfirmation: false,
    };
    const result = toBeAgentSafe(contract);
    expect(result.pass).toBe(false);
    expect(result.message()).toContain("requiresConfirmation");
  });

  it("critical safety with requiresConfirmation false returns pass false", () => {
    const contract = {
      ...baseContract,
      id: "matcher-critical-unconfirmed",
      safetyLevel: "critical" as const,
      requiresConfirmation: false,
    };
    const result = toBeAgentSafe(contract);
    expect(result.pass).toBe(false);
  });

  it("no safetyLevel returns pass false", () => {
    const contract = { id: "matcher-no-safety" };
    const result = toBeAgentSafe(contract);
    expect(result.pass).toBe(false);
    expect(result.message()).toContain("safetyLevel is not set");
  });
});

describe("vhyxSealMatchers", () => {
  it("has all three matcher keys", () => {
    expect(typeof vhyxSealMatchers.toHaveValidContract).toBe("function");
    expect(typeof vhyxSealMatchers.toHaveIntent).toBe("function");
    expect(typeof vhyxSealMatchers.toBeAgentSafe).toBe("function");
  });
});
