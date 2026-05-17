import { beforeAll, beforeEach, describe, it, expect } from "vitest";
import { defineVhyxSealElements, SealInput } from "../../src/elements/index.js";
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
  id: "input-test",
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

describe("SealInput", () => {
  it("element can be created via new SealInput()", () => {
    const el = new SealInput();
    expect(el).toBeDefined();
  });

  it("element can be created via document.createElement('seal-input')", () => {
    const el = document.createElement("seal-input");
    expect(el).toBeDefined();
  });

  it("element is instance of HTMLElement", () => {
    const el = new SealInput();
    expect(el instanceof HTMLElement).toBe(true);
  });

  it("element is instance of SealInput", () => {
    const el = new SealInput();
    expect(el instanceof SealInput).toBe(true);
  });

  it("role attribute set to 'textbox' on connectedCallback", () => {
    const el = new SealInput();
    document.body.appendChild(el);
    expect(el.getAttribute("role")).toBe("textbox");
  });

  it("does not overwrite existing role attribute", () => {
    const el = new SealInput();
    el.setAttribute("role", "searchbox");
    document.body.appendChild(el);
    expect(el.getAttribute("role")).toBe("searchbox");
  });

  it("contract setter stores the contract", () => {
    const el = new SealInput();
    el.contract = contract;
    expect(el.contract).toBe(contract);
  });

  it("contract getter returns stored contract", () => {
    const el = new SealInput();
    el.contract = contract;
    expect(el.contract?.id).toBe(contract.id);
  });

  it("connectedCallback registers contract — getter round-trip confirms storage", () => {
    const el = new SealInput();
    el.contract = contract;
    document.body.appendChild(el);
    expect(el.contract).toBe(contract);
    expect(el.isConnected).toBe(true);
  });

  it("disconnectedCallback — after removing from DOM, contract getter still returns value but element is disconnected", () => {
    const el = new SealInput();
    el.contract = contract;
    document.body.appendChild(el);
    el.remove();
    expect(el.isConnected).toBe(false);
    expect(el.contract).toBe(contract);
  });

  it("works without contract — no throw on connect/disconnect", () => {
    const el = new SealInput();
    expect(() => {
      document.body.appendChild(el);
      el.remove();
    }).not.toThrow();
  });
});
