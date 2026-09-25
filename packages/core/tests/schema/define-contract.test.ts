import { describe, it, expect } from "vitest";
import { defineContract, defineContractTemplate } from "../../src/schema/define-contract.js";
import { VhyxSealError } from "../../src/errors/index.js";
import type { ComponentContract } from "../../src/schema/contract.js";

// ---------------------------------------------------------------------------
// Minimal valid template (all required fields except id)
// ---------------------------------------------------------------------------
const minimalTemplate: Omit<ComponentContract, "id"> = {
  type: "action",
  intent: "trigger-action",
  description: "A generic action button for testing",
  requires: [],
  requiredPermissions: [],
  consequence: "Triggers the associated action",
  affects: [],
  reversible: false,
  safetyLevel: "low",
  requiresConfirmation: false,
  destructive: false,
  contractVersion: "1.0.0",
};

// ---------------------------------------------------------------------------
// defineContract — regression guard (already covered in integration tests,
// but a dedicated file keeps the surface clean and obvious)
// ---------------------------------------------------------------------------
describe("defineContract", () => {
  it("returns a frozen contract with all required fields", () => {
    const contract = defineContract({ ...minimalTemplate, id: "test-btn" });
    expect(contract.id).toBe("test-btn");
    expect(contract.fingerprint).toBeTruthy();
    expect(Object.isFrozen(contract)).toBe(true);
  });

  it("throws VHYX_CONTRACT_VALIDATION_FAILED when id is missing", () => {
    expect(() =>
      defineContract({ type: "action", intent: "search", description: "x", requires: [], requiredPermissions: [], consequence: "y", affects: [], reversible: false, safetyLevel: "low", requiresConfirmation: false, destructive: false, contractVersion: "1.0.0" }),
    ).toThrow(VhyxSealError);
  });
});

// ---------------------------------------------------------------------------
// defineContractTemplate
// ---------------------------------------------------------------------------
describe("defineContractTemplate", () => {
  it("returns object without id field", () => {
    const template = defineContractTemplate(minimalTemplate);
    expect("id" in template).toBe(false);
  });

  it("fingerprint is present and non-empty string", () => {
    const template = defineContractTemplate(minimalTemplate);
    expect(typeof template.fingerprint).toBe("string");
    expect(template.fingerprint.length).toBeGreaterThan(0);
  });

  it("returned object is frozen", () => {
    const template = defineContractTemplate(minimalTemplate);
    expect(Object.isFrozen(template)).toBe(true);
  });

  it("injecting id after the fact works: { ...template, id }", () => {
    const template = defineContractTemplate(minimalTemplate);
    const contract = { ...template, id: "my-btn-instance" };
    expect(contract.id).toBe("my-btn-instance");
    expect(contract.type).toBe("action");
    expect(contract.fingerprint).toBeTruthy();
  });

  it("two calls with identical fields produce identical fingerprint", () => {
    const a = defineContractTemplate(minimalTemplate);
    const b = defineContractTemplate({ ...minimalTemplate });
    expect(a.fingerprint).toBe(b.fingerprint);
  });

  it("missing required field (not id) throws VhyxSealError", () => {
    const { description: _omitted, ...withoutDescription } = minimalTemplate;
    expect(() =>
      defineContractTemplate(withoutDescription as Omit<ComponentContract, "id">),
    ).toThrow(VhyxSealError);
  });

  it("missing safetyLevel throws VhyxSealError", () => {
    const { safetyLevel: _omitted, ...withoutSafety } = minimalTemplate;
    expect(() =>
      defineContractTemplate(withoutSafety as Omit<ComponentContract, "id">),
    ).toThrow(VhyxSealError);
  });
});
