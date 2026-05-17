import { beforeAll, beforeEach, describe, it, expect } from "vitest";
import { defineVhyxSealElements, SealForm } from "../../src/elements/index.js";
import { defineContract, clearRelationshipRegistry, clearCapabilityRegistry } from "@vhyxseal/core";

beforeAll(() => {
  defineVhyxSealElements();
});

beforeEach(() => {
  clearRelationshipRegistry();
  clearCapabilityRegistry();
  document.body.innerHTML = "";
});

const contract = defineContract({
  id: "form-test",
  type: "action",
  intent: "submit-form",
  description: "Test form",
  requires: [],
  requiredPermissions: [],
  consequence: "Submits form",
  affects: ["form"],
  reversible: false,
  safetyLevel: "medium",
  requiresConfirmation: false,
  destructive: false,
  contractVersion: "1.0.0",
});

describe("SealForm", () => {
  it("element can be created via new SealForm()", () => {
    const el = new SealForm();
    expect(el).toBeDefined();
  });

  it("element can be created via document.createElement('seal-form')", () => {
    const el = document.createElement("seal-form");
    expect(el).toBeDefined();
  });

  it("element is instance of HTMLElement", () => {
    const el = new SealForm();
    expect(el instanceof HTMLElement).toBe(true);
  });

  it("element is instance of SealForm", () => {
    const el = new SealForm();
    expect(el instanceof SealForm).toBe(true);
  });

  it("contract setter stores the contract", () => {
    const el = new SealForm();
    el.contract = contract;
    expect(el.contract).toBe(contract);
  });

  it("contract getter returns stored contract", () => {
    const el = new SealForm();
    el.contract = contract;
    expect(el.contract?.id).toBe(contract.id);
  });

  it("connectedCallback registers contract — getter round-trip confirms storage", () => {
    const el = new SealForm();
    el.contract = contract;
    document.body.appendChild(el);
    expect(el.contract).toBe(contract);
    expect(el.isConnected).toBe(true);
  });

  it("disconnectedCallback — after removing from DOM, contract getter still returns value but element is disconnected", () => {
    const el = new SealForm();
    el.contract = contract;
    document.body.appendChild(el);
    el.remove();
    expect(el.isConnected).toBe(false);
    expect(el.contract).toBe(contract);
  });

  it("works without contract — no throw on connect/disconnect", () => {
    const el = new SealForm();
    expect(() => {
      document.body.appendChild(el);
      el.remove();
    }).not.toThrow();
  });
});
