import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, inject } from "vue";
import { VhyxSealPlugin, SEAL_CONTEXT_KEY } from "../../src/plugin/index.js";
import { Nav } from "../../src/components/Nav.js";
import { defineContract } from "@vhyxseal/core";
import type { SealContextValue } from "../../src/plugin/index.js";

const testConfig = { domain: "test.com", domainVerified: false, verificationToken: "" };

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

describe("Nav", () => {
  it("renders slot content inside a nav element", () => {
    const wrapper = mount(Nav, {
      slots: { default: "<a href='/'>Home</a>" },
    });
    expect(wrapper.find("nav").exists()).toBe(true);
    expect(wrapper.find("nav a").exists()).toBe(true);
  });

  it("passes native attributes through (aria-label, class)", () => {
    const wrapper = mount(Nav, {
      attrs: { "aria-label": "Main navigation", class: "main-nav" },
      slots: { default: "" },
    });
    const nav = wrapper.find("nav");
    expect(nav.attributes("aria-label")).toBe("Main navigation");
    expect(nav.classes()).toContain("main-nav");
  });

  it("registers contract on mount when plugin present", () => {
    let ctx: SealContextValue | undefined;
    const Wrapper = defineComponent({
      components: { Nav },
      setup() {
        ctx = inject<SealContextValue>(SEAL_CONTEXT_KEY);
      },
      template: `<Nav :contract="contract"><a href="/">Home</a></Nav>`,
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
      components: { Nav },
      setup() {
        ctx = inject<SealContextValue>(SEAL_CONTEXT_KEY);
      },
      template: `<Nav :contract="contract"><a href="/">Home</a></Nav>`,
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
    expect(() => mount(Nav, { slots: { default: "" } })).not.toThrow();
  });

  it("works without plugin installed — renders nav", () => {
    const wrapper = mount(Nav, { slots: { default: "" } });
    expect(wrapper.find("nav").exists()).toBe(true);
  });
});
