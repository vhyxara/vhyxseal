import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, inject } from "vue";
import { VhyxSealPlugin, SEAL_CONTEXT_KEY } from "../../src/plugin/index.js";
import { Display } from "../../src/components/Display.js";
import { defineContract } from "@vhyxseal/core";
import type { SealContextValue } from "../../src/plugin/index.js";

const testConfig = { domain: "test.com", domainVerified: false, verificationToken: "" };

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

describe("Display", () => {
  it("renders slot content inside a div element", () => {
    const wrapper = mount(Display, {
      slots: { default: "Status: OK" },
    });
    expect(wrapper.find("div").exists()).toBe(true);
    expect(wrapper.find("div").text()).toBe("Status: OK");
  });

  it("defaults aria-live to polite when not provided", () => {
    const wrapper = mount(Display, { slots: { default: "" } });
    expect(wrapper.find("div").attributes("aria-live")).toBe("polite");
  });

  it("uses provided aria-live value when set", () => {
    const wrapper = mount(Display, {
      attrs: { "aria-live": "assertive" },
      slots: { default: "" },
    });
    expect(wrapper.find("div").attributes("aria-live")).toBe("assertive");
  });

  it("passes other native attributes through (class, id)", () => {
    const wrapper = mount(Display, {
      attrs: { class: "status-display", id: "order-status" },
      slots: { default: "" },
    });
    const div = wrapper.find("div");
    expect(div.classes()).toContain("status-display");
    expect(div.attributes("id")).toBe("order-status");
  });

  it("registers contract on mount when plugin present", () => {
    let ctx: SealContextValue | undefined;
    const Wrapper = defineComponent({
      components: { Display },
      setup() {
        ctx = inject<SealContextValue>(SEAL_CONTEXT_KEY);
      },
      template: `<Display :contract="contract">Status</Display>`,
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
      components: { Display },
      setup() {
        ctx = inject<SealContextValue>(SEAL_CONTEXT_KEY);
      },
      template: `<Display :contract="contract">Status</Display>`,
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

  it("works without plugin installed — renders div with aria-live", () => {
    const wrapper = mount(Display, { slots: { default: "OK" } });
    expect(wrapper.find("div").exists()).toBe(true);
    expect(wrapper.find("div").attributes("aria-live")).toBe("polite");
  });
});
