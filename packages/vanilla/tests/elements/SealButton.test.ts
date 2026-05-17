import { beforeAll, beforeEach, describe, it, expect } from "vitest";
import { defineVhyxSealElements, SealButton } from "../../src/elements/index.js";
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
  id: "btn-test",
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

describe("SealButton", () => {
  it("element can be created via new SealButton()", () => {
    const el = new SealButton();
    expect(el).toBeDefined();
  });

  it("element can be created via document.createElement('seal-button')", () => {
    const el = document.createElement("seal-button");
    expect(el).toBeDefined();
  });

  it("element is instance of HTMLElement", () => {
    const el = new SealButton();
    expect(el instanceof HTMLElement).toBe(true);
  });

  it("element is instance of SealButton", () => {
    const el = new SealButton();
    expect(el instanceof SealButton).toBe(true);
  });

  it("role attribute set to 'button' on connectedCallback", () => {
    const el = new SealButton();
    document.body.appendChild(el);
    expect(el.getAttribute("role")).toBe("button");
  });

  it("tabindex attribute set to '0' on connectedCallback", () => {
    const el = new SealButton();
    document.body.appendChild(el);
    expect(el.getAttribute("tabindex")).toBe("0");
  });

  it("does not overwrite existing role attribute", () => {
    const el = new SealButton();
    el.setAttribute("role", "menuitem");
    document.body.appendChild(el);
    expect(el.getAttribute("role")).toBe("menuitem");
  });

  it("contract setter stores the contract", () => {
    const el = new SealButton();
    el.contract = contract;
    expect(el.contract).toBe(contract);
  });

  it("contract getter returns stored contract", () => {
    const el = new SealButton();
    el.contract = contract;
    expect(el.contract?.id).toBe(contract.id);
  });

  it("connectedCallback registers contract — getter round-trip confirms storage", () => {
    const el = new SealButton();
    el.contract = contract;
    document.body.appendChild(el);
    expect(el.contract).toBe(contract);
    expect(el.isConnected).toBe(true);
  });

  it("disconnectedCallback — after removing from DOM, contract getter still returns value but element is disconnected", () => {
    const el = new SealButton();
    el.contract = contract;
    document.body.appendChild(el);
    expect(el.isConnected).toBe(true);
    el.remove();
    expect(el.isConnected).toBe(false);
    expect(el.contract).toBe(contract);
  });

  it("works without contract — no throw on connect/disconnect", () => {
    const el = new SealButton();
    expect(() => {
      document.body.appendChild(el);
      el.remove();
    }).not.toThrow();
  });
});
