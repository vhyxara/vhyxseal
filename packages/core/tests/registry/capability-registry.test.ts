import { describe, it, expect, beforeEach } from "vitest";
import {
  defineCapability,
  getCapability,
  getAllCapabilities,
  clearCapabilityRegistry,
} from "../../src/registry/capability-registry.js";
import { VhyxSealError, ErrorCode } from "../../src/errors/index.js";
import type { Capability } from "../../src/schema/capability.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validCapability: Capability = {
  id: "purchase-item",
  description: "Browse, select and purchase a product",
  entryPoint: "add-to-cart-btn",
  exitPoints: [
    {
      componentId: "order-confirmation-display",
      outcome: "success",
      description: "Order placed successfully",
    },
    {
      componentId: "payment-error-display",
      outcome: "failure",
      description: "Payment could not be processed",
    },
    {
      componentId: "cart-view",
      outcome: "cancelled",
      description: "User chose not to complete purchase",
    },
  ],
  relationships: [],
  estimatedSteps: 4,
  requiresAuth: true,
  safetyLevel: "high",
};

// ---------------------------------------------------------------------------
// Test isolation
// ---------------------------------------------------------------------------

beforeEach(() => {
  clearCapabilityRegistry();
});

// ---------------------------------------------------------------------------
// defineCapability — valid inputs
// ---------------------------------------------------------------------------

describe("defineCapability — valid inputs", () => {
  it("registers and returns a valid capability", () => {
    const result = defineCapability(validCapability);
    expect(result).toBeDefined();
    expect(result.id).toBe("purchase-item");
  });

  it("returned capability is frozen", () => {
    const result = defineCapability(validCapability);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("accepts a capability with empty relationships array", () => {
    expect(() => defineCapability({ ...validCapability, relationships: [] })).not.toThrow();
  });

  it("accepts estimatedSteps of 1", () => {
    expect(() =>
      defineCapability({ ...validCapability, id: "cap-one-step", estimatedSteps: 1 }),
    ).not.toThrow();
  });

  it("accepts all valid safetyLevel values", () => {
    const levels = ["low", "medium", "high", "critical", "sensitive"] as const;
    for (const safetyLevel of levels) {
      clearCapabilityRegistry();
      expect(() =>
        defineCapability({
          ...validCapability,
          id: `cap-safety-${safetyLevel}`,
          safetyLevel,
        }),
      ).not.toThrow();
    }
  });

  it("accepts all valid exit point outcomes", () => {
    const outcomes = ["success", "failure", "cancelled"] as const;
    for (const outcome of outcomes) {
      clearCapabilityRegistry();
      expect(() =>
        defineCapability({
          ...validCapability,
          id: `cap-outcome-${outcome}`,
          exitPoints: [
            {
              componentId: "some-component",
              outcome,
              description: "An exit point",
            },
          ],
        }),
      ).not.toThrow();
    }
  });
});

// ---------------------------------------------------------------------------
// defineCapability — id validation
// ---------------------------------------------------------------------------

describe("defineCapability — id validation", () => {
  it("throws for empty id", () => {
    let caught: unknown;
    try {
      defineCapability({ ...validCapability, id: "" });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_RELATIONSHIP);
      expect(caught.severity).toBe("error");
    }
  });

  it("throws for duplicate id", () => {
    defineCapability(validCapability);
    let caught: unknown;
    try {
      defineCapability({ ...validCapability });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_RELATIONSHIP);
    }
  });

  it("duplicate id error includes id in context", () => {
    defineCapability(validCapability);
    let caught: unknown;
    try {
      defineCapability({ ...validCapability });
    } catch (e) {
      caught = e;
    }
    if (caught instanceof VhyxSealError) {
      expect(caught.context).toHaveProperty("id", "purchase-item");
    }
  });
});

// ---------------------------------------------------------------------------
// defineCapability — field validation
// ---------------------------------------------------------------------------

describe("defineCapability — field validation", () => {
  it("throws for empty description", () => {
    let caught: unknown;
    try {
      defineCapability({ ...validCapability, id: "cap-no-desc", description: "" });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_RELATIONSHIP);
    }
  });

  it("throws for empty entryPoint", () => {
    let caught: unknown;
    try {
      defineCapability({
        ...validCapability,
        id: "cap-no-entry",
        entryPoint: "",
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_RELATIONSHIP);
    }
  });

  it("throws for empty exitPoints array", () => {
    let caught: unknown;
    try {
      defineCapability({
        ...validCapability,
        id: "cap-no-exits",
        exitPoints: [],
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_RELATIONSHIP);
    }
  });

  it("throws for exit point with invalid outcome", () => {
    let caught: unknown;
    try {
      defineCapability({
        ...validCapability,
        id: "cap-bad-outcome",
        exitPoints: [
          {
            componentId: "some-component",
            outcome: "partial" as unknown as "success",
            description: "An exit",
          },
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

  it("throws for exit point with empty componentId", () => {
    let caught: unknown;
    try {
      defineCapability({
        ...validCapability,
        id: "cap-bad-exit-id",
        exitPoints: [
          {
            componentId: "",
            outcome: "success",
            description: "An exit",
          },
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

  it("throws for exit point with empty description", () => {
    let caught: unknown;
    try {
      defineCapability({
        ...validCapability,
        id: "cap-bad-exit-desc",
        exitPoints: [
          {
            componentId: "some-component",
            outcome: "success",
            description: "",
          },
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

  it("throws for estimatedSteps of 0", () => {
    let caught: unknown;
    try {
      defineCapability({
        ...validCapability,
        id: "cap-zero-steps",
        estimatedSteps: 0,
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_RELATIONSHIP);
    }
  });

  it("throws for estimatedSteps of -1", () => {
    let caught: unknown;
    try {
      defineCapability({
        ...validCapability,
        id: "cap-neg-steps",
        estimatedSteps: -1,
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_RELATIONSHIP);
    }
  });

  it("throws for non-integer estimatedSteps", () => {
    let caught: unknown;
    try {
      defineCapability({
        ...validCapability,
        id: "cap-float-steps",
        estimatedSteps: 2.5,
      });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_RELATIONSHIP);
    }
  });

  it("throws for invalid safetyLevel", () => {
    let caught: unknown;
    try {
      defineCapability({
        ...validCapability,
        id: "cap-bad-safety",
        safetyLevel: "extreme" as unknown as "high",
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
// getCapability
// ---------------------------------------------------------------------------

describe("getCapability", () => {
  it("returns a registered capability by id", () => {
    defineCapability(validCapability);
    const result = getCapability("purchase-item");
    expect(result).toBeDefined();
    expect(result?.id).toBe("purchase-item");
  });

  it("returns undefined for an unknown id", () => {
    expect(getCapability("not-registered")).toBeUndefined();
  });

  it("does not throw for an unknown id", () => {
    expect(() => getCapability("unknown-id")).not.toThrow();
  });

  it("returns the correct capability among multiple registered", () => {
    defineCapability(validCapability);
    defineCapability({
      ...validCapability,
      id: "sign-in",
      description: "Authenticate the user",
      estimatedSteps: 2,
      safetyLevel: "low",
    });
    expect(getCapability("sign-in")?.description).toBe("Authenticate the user");
    expect(getCapability("purchase-item")?.estimatedSteps).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// getAllCapabilities
// ---------------------------------------------------------------------------

describe("getAllCapabilities", () => {
  it("returns empty array when registry is empty", () => {
    expect(getAllCapabilities()).toHaveLength(0);
  });

  it("returns all registered capabilities", () => {
    defineCapability(validCapability);
    defineCapability({
      ...validCapability,
      id: "sign-in",
      description: "Authenticate the user",
      estimatedSteps: 2,
      safetyLevel: "low",
    });
    expect(getAllCapabilities()).toHaveLength(2);
  });

  it("returns capabilities in insertion order", () => {
    const capA = { ...validCapability, id: "cap-a" };
    const capB = { ...validCapability, id: "cap-b" };
    const capC = { ...validCapability, id: "cap-c" };
    defineCapability(capC);
    defineCapability(capA);
    defineCapability(capB);
    const all = getAllCapabilities();
    expect(all[0]?.id).toBe("cap-c");
    expect(all[1]?.id).toBe("cap-a");
    expect(all[2]?.id).toBe("cap-b");
  });
});

// ---------------------------------------------------------------------------
// clearCapabilityRegistry
// ---------------------------------------------------------------------------

describe("clearCapabilityRegistry", () => {
  it("getAllCapabilities returns empty array after clear", () => {
    defineCapability(validCapability);
    clearCapabilityRegistry();
    expect(getAllCapabilities()).toHaveLength(0);
  });

  it("getCapability returns undefined after clear", () => {
    defineCapability(validCapability);
    clearCapabilityRegistry();
    expect(getCapability("purchase-item")).toBeUndefined();
  });

  it("previously registered id can be re-registered after clear", () => {
    defineCapability(validCapability);
    clearCapabilityRegistry();
    expect(() => defineCapability(validCapability)).not.toThrow();
    expect(getAllCapabilities()).toHaveLength(1);
  });
});
