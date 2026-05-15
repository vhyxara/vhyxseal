import { describe, it, expect, beforeEach } from "vitest";
import {
  defineRelationship,
  getRelationship,
  getAllRelationships,
  getRelationshipsByType,
  clearRelationshipRegistry,
} from "../../src/registry/relationship-registry.js";
import { VhyxSealError, ErrorCode } from "../../src/errors/index.js";
import type {
  CompositionRelationship,
  SequenceRelationship,
  DependencyRelationship,
  Relationship,
} from "../../src/schema/relationships.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validComposition: CompositionRelationship = {
  type: "composition",
  id: "checkout-form-composition",
  parent: "checkout-form",
  children: ["email-input", "card-input", "submit-btn"],
  completionRequires: ["email-input", "card-input"],
  description: "Checkout form requires email and card before submit",
};

const validSequence: SequenceRelationship = {
  type: "sequence",
  id: "purchase-sequence",
  description: "Steps to complete a purchase",
  linear: true,
  steps: [
    {
      order: 1,
      componentId: "cart-review",
      canSkip: false,
      onComplete: "checkout-form",
      onFail: "cart-error-display",
    },
    {
      order: 2,
      componentId: "checkout-form",
      canSkip: false,
      onComplete: "order-confirmation",
      onFail: "payment-error-display",
    },
  ],
};

const validDependency: DependencyRelationship = {
  type: "dependency",
  id: "payment-method-gate",
  source: "payment-method-input",
  target: "checkout-submit-btn",
  condition: {
    field: "user.hasPaymentMethod",
    operator: "===",
    value: true,
    description: "Payment method must be saved",
  },
  effect: "enables",
  description: "Submit button is enabled only when payment method is saved",
};

// ---------------------------------------------------------------------------
// Test isolation
// ---------------------------------------------------------------------------

beforeEach(() => {
  clearRelationshipRegistry();
});

// ---------------------------------------------------------------------------
// defineRelationship — valid inputs
// ---------------------------------------------------------------------------

describe("defineRelationship — valid inputs", () => {
  it("registers and returns a valid composition relationship", () => {
    const result = defineRelationship(validComposition);
    expect(result).toBeDefined();
    expect(result.id).toBe("checkout-form-composition");
    expect(result.type).toBe("composition");
  });

  it("registers and returns a valid sequence relationship", () => {
    const result = defineRelationship(validSequence);
    expect(result).toBeDefined();
    expect(result.id).toBe("purchase-sequence");
    expect(result.type).toBe("sequence");
  });

  it("registers and returns a valid dependency relationship", () => {
    const result = defineRelationship(validDependency);
    expect(result).toBeDefined();
    expect(result.id).toBe("payment-method-gate");
    expect(result.type).toBe("dependency");
  });

  it("returned composition relationship is frozen", () => {
    const result = defineRelationship(validComposition);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("returned sequence relationship is frozen", () => {
    const result = defineRelationship(validSequence);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("returned dependency relationship is frozen", () => {
    const result = defineRelationship(validDependency);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("accepts dependency with all valid operator values", () => {
    const operators = [
      "===",
      "!==",
      ">",
      "<",
      ">=",
      "<=",
      "includes",
      "excludes",
    ] as const;
    for (const operator of operators) {
      clearRelationshipRegistry();
      expect(() =>
        defineRelationship({
          ...validDependency,
          id: `dep-op-${operator.replace(/[^a-z]/g, "x")}`,
          condition: { ...validDependency.condition, operator },
        }),
      ).not.toThrow();
    }
  });

  it("accepts composition with empty completionRequires array", () => {
    expect(() =>
      defineRelationship({
        ...validComposition,
        id: "comp-empty-completion",
        completionRequires: [],
      }),
    ).not.toThrow();
  });

  it("accepts sequence with a single step", () => {
    expect(() =>
      defineRelationship({
        ...validSequence,
        id: "seq-single-step",
        steps: [validSequence.steps[0]!],
      }),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// defineRelationship — id validation
// ---------------------------------------------------------------------------

describe("defineRelationship — id validation", () => {
  it("throws VHYX_INVALID_RELATIONSHIP for empty id", () => {
    let caught: unknown;
    try {
      defineRelationship({ ...validComposition, id: "" });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_RELATIONSHIP);
      expect(caught.severity).toBe("error");
    }
  });

  it("throws VHYX_INVALID_RELATIONSHIP for duplicate id", () => {
    defineRelationship(validComposition);
    let caught: unknown;
    try {
      defineRelationship({ ...validComposition });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_RELATIONSHIP);
    }
  });

  it("duplicate id error includes the id in context", () => {
    defineRelationship(validComposition);
    let caught: unknown;
    try {
      defineRelationship({ ...validComposition });
    } catch (e) {
      caught = e;
    }
    if (caught instanceof VhyxSealError) {
      expect(caught.context).toHaveProperty("id", "checkout-form-composition");
    }
  });
});

// ---------------------------------------------------------------------------
// defineRelationship — type validation
// ---------------------------------------------------------------------------

describe("defineRelationship — type validation", () => {
  it("throws VHYX_INVALID_RELATIONSHIP for invalid type", () => {
    let caught: unknown;
    try {
      defineRelationship({
        ...validComposition,
        id: "bad-type",
        type: "mutation" as unknown as "composition",
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_RELATIONSHIP);
    }
  });
});

// ---------------------------------------------------------------------------
// defineRelationship — composition validation
// ---------------------------------------------------------------------------

describe("defineRelationship — composition validation", () => {
  it("throws for empty parent", () => {
    let caught: unknown;
    try {
      defineRelationship({ ...validComposition, id: "comp-bad", parent: "" });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_RELATIONSHIP);
    }
  });

  it("throws for empty children array", () => {
    let caught: unknown;
    try {
      defineRelationship({
        ...validComposition,
        id: "comp-no-children",
        children: [],
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_RELATIONSHIP);
    }
  });

  it("throws for empty description", () => {
    let caught: unknown;
    try {
      defineRelationship({
        ...validComposition,
        id: "comp-no-desc",
        description: "",
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_RELATIONSHIP);
    }
  });
});

// ---------------------------------------------------------------------------
// defineRelationship — sequence validation
// ---------------------------------------------------------------------------

describe("defineRelationship — sequence validation", () => {
  it("throws for empty steps array", () => {
    let caught: unknown;
    try {
      defineRelationship({ ...validSequence, id: "seq-no-steps", steps: [] });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_RELATIONSHIP);
    }
  });

  it("throws for duplicate step order values", () => {
    let caught: unknown;
    try {
      defineRelationship({
        ...validSequence,
        id: "seq-dup-order",
        steps: [
          { order: 1, componentId: "step-a", canSkip: false, onComplete: "step-b", onFail: "error" },
          { order: 1, componentId: "step-b", canSkip: false, onComplete: "step-c", onFail: "error" },
        ],
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_RELATIONSHIP);
    }
  });

  it("throws for empty componentId in a step", () => {
    let caught: unknown;
    try {
      defineRelationship({
        ...validSequence,
        id: "seq-bad-step",
        steps: [
          { order: 1, componentId: "", canSkip: false, onComplete: "next", onFail: "error" },
        ],
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_RELATIONSHIP);
    }
  });

  it("throws for empty onComplete in a step", () => {
    let caught: unknown;
    try {
      defineRelationship({
        ...validSequence,
        id: "seq-bad-oncomplete",
        steps: [
          { order: 1, componentId: "step-a", canSkip: false, onComplete: "", onFail: "error" },
        ],
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_RELATIONSHIP);
    }
  });

  it("throws for empty onFail in a step", () => {
    let caught: unknown;
    try {
      defineRelationship({
        ...validSequence,
        id: "seq-bad-onfail",
        steps: [
          { order: 1, componentId: "step-a", canSkip: false, onComplete: "next", onFail: "" },
        ],
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_RELATIONSHIP);
    }
  });

  it("throws for empty description", () => {
    let caught: unknown;
    try {
      defineRelationship({
        ...validSequence,
        id: "seq-no-desc",
        description: "",
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_RELATIONSHIP);
    }
  });
});

// ---------------------------------------------------------------------------
// defineRelationship — dependency validation
// ---------------------------------------------------------------------------

describe("defineRelationship — dependency validation", () => {
  it("throws VHYX_CIRCULAR_DEPENDENCY when source and target are the same", () => {
    let caught: unknown;
    try {
      defineRelationship({
        ...validDependency,
        id: "dep-self-loop",
        source: "same-component",
        target: "same-component",
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_CIRCULAR_DEPENDENCY);
    }
  });

  it("throws VHYX_INVALID_RELATIONSHIP for invalid condition operator", () => {
    let caught: unknown;
    try {
      defineRelationship({
        ...validDependency,
        id: "dep-bad-op",
        condition: {
          field: "user.authenticated",
          operator: "!=" as unknown as "===",
          value: true,
          description: "User authenticated",
        },
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_RELATIONSHIP);
    }
  });

  it("throws for empty source", () => {
    let caught: unknown;
    try {
      defineRelationship({ ...validDependency, id: "dep-no-src", source: "" });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_RELATIONSHIP);
    }
  });

  it("throws for empty target", () => {
    let caught: unknown;
    try {
      defineRelationship({ ...validDependency, id: "dep-no-tgt", target: "" });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_RELATIONSHIP);
    }
  });

  it("throws for invalid effect value", () => {
    let caught: unknown;
    try {
      defineRelationship({
        ...validDependency,
        id: "dep-bad-effect",
        effect: "transforms" as unknown as "enables",
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_RELATIONSHIP);
    }
  });

  it("throws for empty description", () => {
    let caught: unknown;
    try {
      defineRelationship({
        ...validDependency,
        id: "dep-no-desc",
        description: "",
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_RELATIONSHIP);
    }
  });
});

// ---------------------------------------------------------------------------
// getRelationship
// ---------------------------------------------------------------------------

describe("getRelationship", () => {
  it("returns a registered relationship by id", () => {
    defineRelationship(validComposition);
    const result = getRelationship("checkout-form-composition");
    expect(result).toBeDefined();
    expect(result?.id).toBe("checkout-form-composition");
  });

  it("returns undefined for an unknown id", () => {
    expect(getRelationship("not-registered")).toBeUndefined();
  });

  it("does not throw for an unknown id", () => {
    expect(() => getRelationship("unknown-id")).not.toThrow();
  });

  it("returns the correct relationship when multiple are registered", () => {
    defineRelationship(validComposition);
    defineRelationship(validSequence);
    defineRelationship(validDependency);
    expect(getRelationship("purchase-sequence")?.type).toBe("sequence");
    expect(getRelationship("payment-method-gate")?.type).toBe("dependency");
  });
});

// ---------------------------------------------------------------------------
// getAllRelationships
// ---------------------------------------------------------------------------

describe("getAllRelationships", () => {
  it("returns an empty array when registry is empty", () => {
    expect(getAllRelationships()).toHaveLength(0);
  });

  it("returns all registered relationships", () => {
    defineRelationship(validComposition);
    defineRelationship(validSequence);
    defineRelationship(validDependency);
    expect(getAllRelationships()).toHaveLength(3);
  });

  it("returns relationships in insertion order", () => {
    defineRelationship(validDependency);
    defineRelationship(validComposition);
    defineRelationship(validSequence);
    const all = getAllRelationships();
    expect(all[0]?.id).toBe("payment-method-gate");
    expect(all[1]?.id).toBe("checkout-form-composition");
    expect(all[2]?.id).toBe("purchase-sequence");
  });
});

// ---------------------------------------------------------------------------
// getRelationshipsByType
// ---------------------------------------------------------------------------

describe("getRelationshipsByType", () => {
  it("returns only composition relationships when requested", () => {
    defineRelationship(validComposition);
    defineRelationship(validSequence);
    defineRelationship(validDependency);
    const compositions = getRelationshipsByType("composition");
    expect(compositions).toHaveLength(1);
    expect(compositions[0]?.type).toBe("composition");
  });

  it("returns only sequence relationships when requested", () => {
    defineRelationship(validComposition);
    defineRelationship(validSequence);
    defineRelationship(validDependency);
    const sequences = getRelationshipsByType("sequence");
    expect(sequences).toHaveLength(1);
    expect(sequences[0]?.type).toBe("sequence");
  });

  it("returns only dependency relationships when requested", () => {
    defineRelationship(validComposition);
    defineRelationship(validSequence);
    defineRelationship(validDependency);
    const deps = getRelationshipsByType("dependency");
    expect(deps).toHaveLength(1);
    expect(deps[0]?.type).toBe("dependency");
  });

  it("returns empty array when no relationships of that type exist", () => {
    defineRelationship(validSequence);
    expect(getRelationshipsByType("composition")).toHaveLength(0);
  });

  it("returns multiple relationships when multiple of the same type are registered", () => {
    defineRelationship(validComposition);
    defineRelationship({ ...validComposition, id: "comp-two", parent: "other-form" });
    const comps = getRelationshipsByType("composition");
    expect(comps).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// clearRelationshipRegistry
// ---------------------------------------------------------------------------

describe("clearRelationshipRegistry", () => {
  it("getAllRelationships returns empty array after clear", () => {
    defineRelationship(validComposition);
    defineRelationship(validSequence);
    clearRelationshipRegistry();
    expect(getAllRelationships()).toHaveLength(0);
  });

  it("getRelationship returns undefined after clear", () => {
    defineRelationship(validComposition);
    clearRelationshipRegistry();
    expect(getRelationship("checkout-form-composition")).toBeUndefined();
  });

  it("previously registered id can be re-registered after clear", () => {
    defineRelationship(validComposition);
    clearRelationshipRegistry();
    expect(() => defineRelationship(validComposition)).not.toThrow();
    expect(getAllRelationships()).toHaveLength(1);
  });
});
