import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, inject } from "vue";
import { VhyxSealPlugin, SEAL_CONTEXT_KEY } from "../../src/plugin/index.js";
import { Form } from "../../src/components/Form.js";
import { defineContract } from "@vhyxseal/core";
import type { SealContextValue } from "../../src/plugin/index.js";

const testConfig = { domain: "test.com", domainVerified: false, verificationToken: "" };

const contract = defineContract({
  id: "form-test",
  type: "action",
  intent: "submit-form",
  description: "Test form",
  requires: [],
  requiredPermissions: [],
  consequence: "Submits",
  affects: ["form"],
  reversible: false,
  safetyLevel: "medium",
  requiresConfirmation: false,
  destructive: false,
  contractVersion: "1.0.0",
});

describe("Form", () => {
  it("renders slot content inside a form element", () => {
    const wrapper = mount(Form, {
      slots: { default: "<input />" },
    });
    expect(wrapper.find("form").exists()).toBe(true);
    expect(wrapper.find("form input").exists()).toBe(true);
  });

  it("passes native attributes through (id, class)", () => {
    const wrapper = mount(Form, {
      attrs: { id: "checkout-form", class: "form-dark" },
      slots: { default: "" },
    });
    const form = wrapper.find("form");
    expect(form.attributes("id")).toBe("checkout-form");
    expect(form.classes()).toContain("form-dark");
  });

  it("registers contract on mount when plugin present", () => {
    let ctx: SealContextValue | undefined;
    const Wrapper = defineComponent({
      components: { Form },
      setup() {
        ctx = inject<SealContextValue>(SEAL_CONTEXT_KEY);
      },
      template: `<Form :contract="contract"><input /></Form>`,
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
      components: { Form },
      setup() {
        ctx = inject<SealContextValue>(SEAL_CONTEXT_KEY);
      },
      template: `<Form :contract="contract"><input /></Form>`,
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
    expect(() => mount(Form, { slots: { default: "" } })).not.toThrow();
  });

  it("works without plugin installed — renders form", () => {
    const wrapper = mount(Form, { slots: { default: "" } });
    expect(wrapper.find("form").exists()).toBe(true);
  });
});
