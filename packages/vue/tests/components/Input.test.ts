import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, inject } from "vue";
import { VhyxSealPlugin, SEAL_CONTEXT_KEY } from "../../src/plugin/index.js";
import { Input } from "../../src/components/Input.js";
import { defineContract } from "@vhyxseal/core";
import type { SealContextValue } from "../../src/plugin/index.js";

const testConfig = { domain: "test.com", domainVerified: false, verificationToken: "" };

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

describe("Input", () => {
  it("renders an input element", () => {
    const wrapper = mount(Input);
    expect(wrapper.find("input").exists()).toBe(true);
  });

  it("passes native attributes through (type, placeholder, disabled)", () => {
    const wrapper = mount(Input, {
      attrs: { type: "text", placeholder: "Search...", disabled: true },
    });
    const input = wrapper.find("input");
    expect(input.attributes("type")).toBe("text");
    expect(input.attributes("placeholder")).toBe("Search...");
    expect(input.attributes("disabled")).toBeDefined();
  });

  it("registers contract on mount when plugin present", () => {
    let ctx: SealContextValue | undefined;
    const Wrapper = defineComponent({
      components: { Input },
      setup() {
        ctx = inject<SealContextValue>(SEAL_CONTEXT_KEY);
      },
      template: `<Input :contract="contract" />`,
      data() {
        return { contract };
      },
    });
    mount(Wrapper, {
      global: { plugins: [[VhyxSealPlugin, { config: testConfig }]] },
    });
    expect(ctx?.contracts.has(contract.id)).toBe(true);
  });

  it("unregisters contract on unmount", () => {
    let ctx: SealContextValue | undefined;
    const Wrapper = defineComponent({
      components: { Input },
      setup() {
        ctx = inject<SealContextValue>(SEAL_CONTEXT_KEY);
      },
      template: `<Input :contract="contract" />`,
      data() {
        return { contract };
      },
    });
    const wrapper = mount(Wrapper, {
      global: { plugins: [[VhyxSealPlugin, { config: testConfig }]] },
    });
    wrapper.unmount();
    expect(ctx?.contracts.has(contract.id)).toBe(false);
  });

  it("works without contract prop — no error", () => {
    expect(() => mount(Input)).not.toThrow();
  });

  it("works without plugin installed — renders input", () => {
    const wrapper = mount(Input, { attrs: { type: "email" } });
    expect(wrapper.find("input").exists()).toBe(true);
  });
});
