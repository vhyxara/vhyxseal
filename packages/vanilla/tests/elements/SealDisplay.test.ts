import { beforeAll, beforeEach, describe, it, expect } from "vitest";
import { defineVhyxSealElements, SealDisplay } from "../../src/elements/index.js";
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
  id: "display-test",
  type: "display",
  intent: "search",
  description: "Test display",
  requires: [],
  requiredPermissions: [],
  consequence: "Displays",
  affects: [],
  reversible: true,
  safetyLevel: "low",
  requiresConfirmation: false,
  destructive: false,
  contractVersion: "1.0.0",
});

describe("SealDisplay", () => {
  it("element can be created via new SealDisplay()", () => {
    const el = new SealDisplay();
    expect(el).toBeDefined();
  });

  it("element can be created via document.createElement('seal-display')", () => {
    const el = document.createElement("seal-display");
    expect(el).toBeDefined();
  });

  it("element is instance of HTMLElement", () => {
    const el = new SealDisplay();
    expect(el instanceof HTMLElement).toBe(true);
  });

  it("element is instance of SealDisplay", () => {
    const el = new SealDisplay();
    expect(el instanceof SealDisplay).toBe(true);
  });

  it("aria-live attribute set to 'polite' on connectedCallback", () => {
    const el = new SealDisplay();
    document.body.appendChild(el);
    expect(el.getAttribute("aria-live")).toBe("polite");
  });

  it("does not overwrite existing aria-live attribute", () => {
    const el = new SealDisplay();
    el.setAttribute("aria-live", "assertive");
    document.body.appendChild(el);
    expect(el.getAttribute("aria-live")).toBe("assertive");
  });

  it("contract setter stores the contract", () => {
    const el = new SealDisplay();
    el.contract = contract;
    expect(el.contract).toBe(contract);
  });

  it("contract getter returns stored contract", () => {
    const el = new SealDisplay();
    el.contract = contract;
    expect(el.contract?.id).toBe(contract.id);
  });

  it("connectedCallback registers contract — getter round-trip confirms storage", () => {
    const el = new SealDisplay();
    el.contract = contract;
    document.body.appendChild(el);
    expect(el.contract).toBe(contract);
    expect(el.isConnected).toBe(true);
  });

  it("disconnectedCallback — after removing from DOM, contract getter still returns value but element is disconnected", () => {
    const el = new SealDisplay();
    el.contract = contract;
    document.body.appendChild(el);
    el.remove();
    expect(el.isConnected).toBe(false);
    expect(el.contract).toBe(contract);
  });

  it("works without contract — no throw on connect/disconnect", () => {
    const el = new SealDisplay();
    expect(() => {
      document.body.appendChild(el);
      el.remove();
    }).not.toThrow();
  });
});
