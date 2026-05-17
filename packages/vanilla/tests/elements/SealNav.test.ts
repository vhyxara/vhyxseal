import { beforeAll, beforeEach, describe, it, expect } from "vitest";
import { defineVhyxSealElements, SealNav } from "../../src/elements/index.js";
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
  id: "nav-test",
  type: "navigation",
  intent: "navigate",
  description: "Test nav",
  requires: [],
  requiredPermissions: [],
  consequence: "Navigates",
  affects: [],
  reversible: true,
  safetyLevel: "low",
  requiresConfirmation: false,
  destructive: false,
  contractVersion: "1.0.0",
});

describe("SealNav", () => {
  it("element can be created via new SealNav()", () => {
    const el = new SealNav();
    expect(el).toBeDefined();
  });

  it("element can be created via document.createElement('seal-nav')", () => {
    const el = document.createElement("seal-nav");
    expect(el).toBeDefined();
  });

  it("element is instance of HTMLElement", () => {
    const el = new SealNav();
    expect(el instanceof HTMLElement).toBe(true);
  });

  it("element is instance of SealNav", () => {
    const el = new SealNav();
    expect(el instanceof SealNav).toBe(true);
  });

  it("role attribute set to 'navigation' on connectedCallback", () => {
    const el = new SealNav();
    document.body.appendChild(el);
    expect(el.getAttribute("role")).toBe("navigation");
  });

  it("does not overwrite existing role attribute", () => {
    const el = new SealNav();
    el.setAttribute("role", "menu");
    document.body.appendChild(el);
    expect(el.getAttribute("role")).toBe("menu");
  });

  it("contract setter stores the contract", () => {
    const el = new SealNav();
    el.contract = contract;
    expect(el.contract).toBe(contract);
  });

  it("contract getter returns stored contract", () => {
    const el = new SealNav();
    el.contract = contract;
    expect(el.contract?.id).toBe(contract.id);
  });

  it("connectedCallback registers contract — getter round-trip confirms storage", () => {
    const el = new SealNav();
    el.contract = contract;
    document.body.appendChild(el);
    expect(el.contract).toBe(contract);
    expect(el.isConnected).toBe(true);
  });

  it("disconnectedCallback — after removing from DOM, contract getter still returns value but element is disconnected", () => {
    const el = new SealNav();
    el.contract = contract;
    document.body.appendChild(el);
    el.remove();
    expect(el.isConnected).toBe(false);
    expect(el.contract).toBe(contract);
  });

  it("works without contract — no throw on connect/disconnect", () => {
    const el = new SealNav();
    expect(() => {
      document.body.appendChild(el);
      el.remove();
    }).not.toThrow();
  });
});
