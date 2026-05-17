import { describe, it, expect } from "vitest";
import { createSealRegistry } from "../../src/utils/registry.js";
import { defineContract } from "@vhyxseal/core";

const contract1 = defineContract({
  id: "registry-test-btn",
  type: "action",
  intent: "place-order",
  description: "Test button",
  requires: [],
  requiredPermissions: [],
  consequence: "Places order",
  affects: ["orders"],
  reversible: true,
  safetyLevel: "high",
  requiresConfirmation: true,
  destructive: false,
  contractVersion: "1.0.0",
});

const contract2 = defineContract({
  id: "registry-test-input",
  type: "input",
  intent: "search",
  description: "Test input",
  requires: [],
  requiredPermissions: [],
  consequence: "Searches",
  affects: [],
  reversible: true,
  safetyLevel: "low",
  requiresConfirmation: false,
  destructive: false,
  contractVersion: "1.0.0",
});

describe("createSealRegistry", () => {
  it("returns a SealRegistry object with all required methods", () => {
    const registry = createSealRegistry();
    expect(typeof registry.registerContract).toBe("function");
    expect(typeof registry.unregisterContract).toBe("function");
    expect(typeof registry.getContract).toBe("function");
    expect(typeof registry.getAllContracts).toBe("function");
    expect(typeof registry.clear).toBe("function");
  });

  it("getAllContracts returns empty array initially", () => {
    const registry = createSealRegistry();
    expect(registry.getAllContracts()).toEqual([]);
  });

  it("registerContract stores the contract", () => {
    const registry = createSealRegistry();
    registry.registerContract(contract1);
    expect(registry.getContract(contract1.id)).toBe(contract1);
  });

  it("getContract returns the stored contract", () => {
    const registry = createSealRegistry();
    registry.registerContract(contract1);
    const retrieved = registry.getContract(contract1.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(contract1.id);
  });

  it("getContract returns undefined for unknown id", () => {
    const registry = createSealRegistry();
    expect(registry.getContract("nonexistent-id")).toBeUndefined();
  });

  it("unregisterContract removes the contract", () => {
    const registry = createSealRegistry();
    registry.registerContract(contract1);
    expect(registry.getContract(contract1.id)).toBeDefined();
    registry.unregisterContract(contract1.id);
    expect(registry.getContract(contract1.id)).toBeUndefined();
  });

  it("getAllContracts returns all stored contracts", () => {
    const registry = createSealRegistry();
    registry.registerContract(contract1);
    registry.registerContract(contract2);
    const all = registry.getAllContracts();
    expect(all).toHaveLength(2);
    const ids = all.map((c) => c.id);
    expect(ids).toContain(contract1.id);
    expect(ids).toContain(contract2.id);
  });

  it("clear empties all contracts", () => {
    const registry = createSealRegistry();
    registry.registerContract(contract1);
    registry.registerContract(contract2);
    registry.clear();
    expect(registry.getAllContracts()).toHaveLength(0);
    expect(registry.getContract(contract1.id)).toBeUndefined();
  });

  it("two registries are independent — registering in one does not affect the other", () => {
    const registryA = createSealRegistry();
    const registryB = createSealRegistry();
    registryA.registerContract(contract1);
    expect(registryA.getContract(contract1.id)).toBeDefined();
    expect(registryB.getContract(contract1.id)).toBeUndefined();
    registryB.registerContract(contract2);
    expect(registryB.getContract(contract2.id)).toBeDefined();
    expect(registryA.getContract(contract2.id)).toBeUndefined();
  });
});
