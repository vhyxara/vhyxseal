import { beforeAll, beforeEach, describe, it, expect } from "vitest";
import { defineVhyxSealElements, SealConfirmation } from "../../src/elements/index.js";
import { clearRelationshipRegistry, clearCapabilityRegistry } from "@vhyxseal/core";

beforeAll(() => {
  defineVhyxSealElements();
});

beforeEach(() => {
  clearRelationshipRegistry();
  clearCapabilityRegistry();
  document.body.innerHTML = "";
});

describe("SealConfirmation", () => {
  it("confirmed is false initially", () => {
    const el = new SealConfirmation();
    expect(el.confirmed).toBe(false);
  });

  it("isPending is false initially", () => {
    const el = new SealConfirmation();
    expect(el.isPending).toBe(false);
  });

  it("requestConfirmation sets isPending to true", () => {
    const el = new SealConfirmation();
    document.body.appendChild(el);
    el.requestConfirmation();
    expect(el.isPending).toBe(true);
    expect(el.confirmed).toBe(false);
  });

  it("requestConfirmation dispatches vhyxseal:request-confirmation event", () => {
    const el = new SealConfirmation();
    document.body.appendChild(el);
    let fired = false;
    el.addEventListener("vhyxseal:request-confirmation", () => { fired = true; });
    el.requestConfirmation();
    expect(fired).toBe(true);
  });

  it("confirm sets confirmed to true and isPending to false", () => {
    const el = new SealConfirmation();
    document.body.appendChild(el);
    el.requestConfirmation();
    el.confirm();
    expect(el.confirmed).toBe(true);
    expect(el.isPending).toBe(false);
  });

  it("confirm dispatches vhyxseal:confirmed event", () => {
    const el = new SealConfirmation();
    document.body.appendChild(el);
    let fired = false;
    el.addEventListener("vhyxseal:confirmed", () => { fired = true; });
    el.confirm();
    expect(fired).toBe(true);
  });

  it("cancel sets isPending to false without confirming", () => {
    const el = new SealConfirmation();
    document.body.appendChild(el);
    el.requestConfirmation();
    expect(el.isPending).toBe(true);
    el.cancel();
    expect(el.isPending).toBe(false);
    expect(el.confirmed).toBe(false);
  });

  it("cancel dispatches vhyxseal:cancelled event", () => {
    const el = new SealConfirmation();
    document.body.appendChild(el);
    let fired = false;
    el.addEventListener("vhyxseal:cancelled", () => { fired = true; });
    el.cancel();
    expect(fired).toBe(true);
  });

  it("reset sets both confirmed and isPending to false", () => {
    const el = new SealConfirmation();
    document.body.appendChild(el);
    el.requestConfirmation();
    el.confirm();
    expect(el.confirmed).toBe(true);
    el.reset();
    expect(el.confirmed).toBe(false);
    expect(el.isPending).toBe(false);
  });

  it("reset dispatches vhyxseal:reset event", () => {
    const el = new SealConfirmation();
    document.body.appendChild(el);
    let fired = false;
    el.addEventListener("vhyxseal:reset", () => { fired = true; });
    el.reset();
    expect(fired).toBe(true);
  });

  it("events bubble (bubbles: true)", () => {
    const el = new SealConfirmation();
    document.body.appendChild(el);
    let bubbled = false;
    document.body.addEventListener("vhyxseal:confirmed", () => { bubbled = true; });
    el.confirm();
    expect(bubbled).toBe(true);
  });
});
