import { describe, it, expect } from "vitest";
import { createApp, defineComponent, inject } from "vue";
import { VhyxSealPlugin, SEAL_CONTEXT_KEY } from "../../src/plugin/index.js";
import { useSeal } from "../../src/composables/useSeal.js";
import { defineContract } from "@vhyxseal/core";
import type { SealContextValue } from "../../src/plugin/index.js";

const testConfig = { domain: "test.com", domainVerified: false, verificationToken: "" };

function mountWithPlugin(template = "<div/>") {
  let ctx: SealContextValue | undefined;
  const Root = defineComponent({
    setup() {
      ctx = inject<SealContextValue>(SEAL_CONTEXT_KEY);
    },
    template,
  });
  const app = createApp(Root);
  app.use(VhyxSealPlugin, { config: testConfig });
  app.mount(document.createElement("div"));
  return { app, getCtx: () => ctx };
}

const contract = defineContract({
  id: "plugin-test-btn",
  type: "action",
  intent: "submit-form",
  description: "Test button",
  requires: [],
  requiredPermissions: [],
  consequence: "Submits",
  affects: ["form"],
  reversible: false,
  safetyLevel: "low",
  requiresConfirmation: false,
  destructive: false,
  contractVersion: "1.0.0",
});

describe("VhyxSealPlugin", () => {
  it("installs without error on a Vue app", () => {
    const app = createApp({ template: "<div/>" });
    expect(() => app.use(VhyxSealPlugin, { config: testConfig })).not.toThrow();
  });

  it("provides non-null context that child components can inject", () => {
    const { getCtx } = mountWithPlugin();
    expect(getCtx()).toBeDefined();
    expect(getCtx()).not.toBeNull();
  });

  it("useSeal() outside plugin scope throws with helpful message", () => {
    // inject() returns undefined outside setup() — useSeal() throws immediately
    expect(() => useSeal()).toThrow("VhyxSeal");
  });

  it("registerContract adds the contract to context", () => {
    const { getCtx } = mountWithPlugin();
    const ctx = getCtx()!;
    ctx.registerContract(contract);
    expect(ctx.contracts.has(contract.id)).toBe(true);
    expect(ctx.contracts.get(contract.id)?.id).toBe(contract.id);
  });

  it("unregisterContract removes the contract from context", () => {
    const { getCtx } = mountWithPlugin();
    const ctx = getCtx()!;
    ctx.registerContract(contract);
    expect(ctx.contracts.has(contract.id)).toBe(true);
    ctx.unregisterContract(contract.id);
    expect(ctx.contracts.has(contract.id)).toBe(false);
  });
});
