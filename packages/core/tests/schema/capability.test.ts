import { describe, it, expect } from "vitest";
import type {
  ExitPoint,
  CapabilityRelationshipRef,
  Capability,
} from "../../src/schema/capability.js";
import type { CompositionRelationship, SequenceRelationship } from "../../src/schema/relationships.js";

// ---------------------------------------------------------------------------
// ExitPoint
// ---------------------------------------------------------------------------

describe("ExitPoint", () => {
  it("satisfies the type with all required fields", () => {
    const exitPoint: ExitPoint = {
      componentId: "order-confirmation-display",
      outcome: "success",
      description: "Order placed successfully — confirmation shown",
    };
    expect(exitPoint.componentId).toBe("order-confirmation-display");
    expect(exitPoint.outcome).toBe("success");
  });

  it("accepts all three outcome values", () => {
    const outcomes: ExitPoint["outcome"][] = [
      "success",
      "failure",
      "cancelled",
    ];
    for (const outcome of outcomes) {
      const ep: ExitPoint = {
        componentId: "some-component",
        outcome,
        description: `Outcome: ${outcome}`,
      };
      expect(ep.outcome).toBe(outcome);
    }
  });
});

// ---------------------------------------------------------------------------
// CapabilityRelationshipRef
// ---------------------------------------------------------------------------

describe("CapabilityRelationshipRef", () => {
  it("satisfies the type with a composition relationship reference", () => {
    const compositionRel: CompositionRelationship = {
      type: "composition",
      id: "checkout-form-composition",
      parent: "checkout-form",
      children: ["email-input", "card-input", "submit-btn"],
      completionRequires: ["email-input", "card-input"],
      description: "Checkout form composition",
    };
    const ref: CapabilityRelationshipRef = {
      type: "composition",
      ref: compositionRel,
    };
    expect(ref.type).toBe("composition");
    expect(ref.ref.type).toBe("composition");
  });

  it("satisfies the type with a sequence relationship reference", () => {
    const sequenceRel: SequenceRelationship = {
      type: "sequence",
      id: "checkout-flow",
      description: "Checkout sequence",
      steps: [
        {
          order: 1,
          componentId: "cart-review",
          canSkip: false,
          onComplete: "payment-form",
          onFail: "cart-error-display",
        },
      ],
      linear: true,
    };
    const ref: CapabilityRelationshipRef = {
      type: "sequence",
      ref: sequenceRel,
    };
    expect(ref.type).toBe("sequence");
    expect(ref.ref.type).toBe("sequence");
  });
});

// ---------------------------------------------------------------------------
// Capability
// ---------------------------------------------------------------------------

describe("Capability", () => {
  const compositionRel: CompositionRelationship = {
    type: "composition",
    id: "checkout-form-composition",
    parent: "checkout-form",
    children: ["email-input", "card-input", "submit-btn"],
    completionRequires: ["email-input", "card-input"],
    description: "Checkout form composition",
  };

  const minimalCapability: Capability = {
    id: "purchase-item",
    description: "Browse, select and purchase a product",
    entryPoint: "add-to-cart-btn",
    exitPoints: [
      {
        componentId: "order-confirmation-display",
        outcome: "success",
        description: "Purchase completed — order confirmed",
      },
      {
        componentId: "payment-error-display",
        outcome: "failure",
        description: "Payment failed",
      },
    ],
    relationships: [
      {
        type: "composition",
        ref: compositionRel,
      },
    ],
    estimatedSteps: 4,
    requiresAuth: true,
    safetyLevel: "high",
  };

  it("satisfies the type with all required fields", () => {
    expect(minimalCapability.id).toBe("purchase-item");
    expect(minimalCapability.entryPoint).toBe("add-to-cart-btn");
    expect(minimalCapability.estimatedSteps).toBe(4);
    expect(minimalCapability.requiresAuth).toBe(true);
    expect(minimalCapability.safetyLevel).toBe("high");
  });

  it("has exitPoints as a readonly array", () => {
    expect(Array.isArray(minimalCapability.exitPoints)).toBe(true);
    expect(minimalCapability.exitPoints).toHaveLength(2);
  });

  it("has relationships as a readonly array", () => {
    expect(Array.isArray(minimalCapability.relationships)).toBe(true);
    expect(minimalCapability.relationships).toHaveLength(1);
  });

  it("does not require spanPages for single-page capabilities", () => {
    expect(minimalCapability.spanPages).toBeUndefined();
  });

  it("accepts spanPages for multi-page capabilities", () => {
    const multiPageCapability: Capability = {
      ...minimalCapability,
      spanPages: ["/cart", "/checkout", "/confirmation"],
    };
    expect(multiPageCapability.spanPages).toHaveLength(3);
    expect(multiPageCapability.spanPages).toContain("/checkout");
  });

  it("accepts requiresAuth false for public capabilities", () => {
    const publicCapability: Capability = {
      ...minimalCapability,
      id: "search-products",
      requiresAuth: false,
      safetyLevel: "low",
    };
    expect(publicCapability.requiresAuth).toBe(false);
  });

  it("carries safetyLevel of the highest level in the chain", () => {
    const criticalCapability: Capability = {
      ...minimalCapability,
      id: "delete-account",
      safetyLevel: "critical",
    };
    expect(criticalCapability.safetyLevel).toBe("critical");
  });

  it("accepts a capability with multiple exit points covering all outcome types", () => {
    const capability: Capability = {
      ...minimalCapability,
      exitPoints: [
        {
          componentId: "success-display",
          outcome: "success",
          description: "Completed",
        },
        {
          componentId: "error-display",
          outcome: "failure",
          description: "Failed",
        },
        {
          componentId: "cancel-display",
          outcome: "cancelled",
          description: "User cancelled",
        },
      ],
    };
    const outcomes = capability.exitPoints.map((ep) => ep.outcome);
    expect(outcomes).toContain("success");
    expect(outcomes).toContain("failure");
    expect(outcomes).toContain("cancelled");
  });
});
