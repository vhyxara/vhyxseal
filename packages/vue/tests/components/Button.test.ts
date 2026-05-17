import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, inject } from "vue";
import { VhyxSealPlugin, SEAL_CONTEXT_KEY } from "../../src/plugin/index.js";
import { Button } from "../../src/components/Button.js";
import { defineContract } from "@vhyxseal/core";
import type { SealContextValue } from "../../src/plugin/index.js";

const testConfig = { domain: "test.com", domainVerified: false, verificationToken: "" };

const contract = defineContract({
  id: "btn-test",
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

describe("Button", () => {
  it("renders slot content inside a button element", () => {
    const wrapper = mount(Button, {
      slots: { default: "Click me" },
    });
    expect(wrapper.find("button").exists()).toBe(true);
    expect(wrapper.find("button").text()).toBe("Click me");
  });

  it("passes native attributes through (class, disabled, type)", () => {
    const wrapper = mount(Button, {
      attrs: { disabled: true, type: "submit", class: "my-btn" },
      slots: { default: "OK" },
    });
    const btn = wrapper.find("button");
    expect(btn.attributes("disabled")).toBeDefined();
    expect(btn.attributes("type")).toBe("submit");
    expect(btn.classes()).toContain("my-btn");
  });

  it("registers contract on mount when plugin present", () => {
    let ctx: SealContextValue | undefined;
    const Wrapper = defineComponent({
      components: { Button },
      setup() {
        ctx = inject<SealContextValue>(SEAL_CONTEXT_KEY);
      },
      template: `<Button :contract="contract">OK</Button>`,
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
      components: { Button },
      setup() {
        ctx = inject<SealContextValue>(SEAL_CONTEXT_KEY);
      },
      template: `<Button :contract="contract">OK</Button>`,
      data() {
        return { contract };
      },
    });
    const wrapper = mount(Wrapper, {
      global: { plugins: [[VhyxSealPlugin, { config: testConfig }]] },
    });
    expect(ctx?.contracts.has(contract.id)).toBe(true);
    wrapper.unmount();
    expect(ctx?.contracts.has(contract.id)).toBe(false);
  });

  it("works without contract prop — no error", () => {
    expect(() =>
      mount(Button, { slots: { default: "OK" } }),
    ).not.toThrow();
  });

  it("works without plugin installed — no error, renders button", () => {
    const wrapper = mount(Button, {
      slots: { default: "OK" },
    });
    expect(wrapper.find("button").exists()).toBe(true);
  });
});
