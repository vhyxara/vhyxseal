import { describe, it, expect } from "vitest";
import type {
  RelationshipType,
  CompositionRelationship,
  SequenceStep,
  SequenceRelationship,
  DependencyEffect,
  DependencyRelationship,
  Relationship,
} from "../../src/schema/relationships.js";
import type { Condition } from "../../src/schema/contract.js";

// ---------------------------------------------------------------------------
// RelationshipType
// ---------------------------------------------------------------------------

describe("RelationshipType", () => {
  it("accepts all three valid relationship type values", () => {
    const types: RelationshipType[] = [
      "composition",
      "sequence",
      "dependency",
    ];
    expect(types).toHaveLength(3);
    for (const t of types) {
      expect(typeof t).toBe("string");
    }
  });
});

// ---------------------------------------------------------------------------
// DependencyEffect
// ---------------------------------------------------------------------------

describe("DependencyEffect", () => {
  it("accepts all five valid effect values", () => {
    const effects: DependencyEffect[] = [
      "enables",
      "disables",
      "shows",
      "hides",
      "modifies",
    ];
    expect(effects).toHaveLength(5);
    for (const e of effects) {
      expect(typeof e).toBe("string");
    }
  });
});

// ---------------------------------------------------------------------------
// CompositionRelationship
// ---------------------------------------------------------------------------

describe("CompositionRelationship", () => {
  it("satisfies the type with all required fields", () => {
    const rel: CompositionRelationship = {
      type: "composition",
      id: "checkout-form-composition",
      parent: "checkout-form",
      children: ["email-input", "card-input", "submit-btn"],
      completionRequires: ["email-input", "card-input"],
      description: "Checkout form requires email and card fields to be valid",
    };
    expect(rel.type).toBe("composition");
    expect(rel.id).toBe("checkout-form-composition");
    expect(rel.parent).toBe("checkout-form");
    expect(rel.children).toHaveLength(3);
    expect(rel.completionRequires).toHaveLength(2);
  });

  it("has children as a readonly array", () => {
    const rel: CompositionRelationship = {
      type: "composition",
      id: "nav-composition",
      parent: "main-nav",
      children: ["home-link", "products-link", "account-link"],
      completionRequires: [],
      description: "Main navigation group",
    };
    expect(Array.isArray(rel.children)).toBe(true);
  });

  it("accepts empty completionRequires when no children are required", () => {
    const rel: CompositionRelationship = {
      type: "composition",
      id: "info-panel-composition",
      parent: "info-panel",
      children: ["title-display", "body-display"],
      completionRequires: [],
      description: "Read-only info panel — no completion requirements",
    };
    expect(rel.completionRequires).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// SequenceStep
// ---------------------------------------------------------------------------

describe("SequenceStep", () => {
  it("satisfies the type with all required fields", () => {
    const step: SequenceStep = {
      order: 1,
      componentId: "cart-review",
      canSkip: false,
      onComplete: "shipping-form",
      onFail: "cart-error-display",
    };
    expect(step.order).toBe(1);
    expect(step.componentId).toBe("cart-review");
    expect(step.canSkip).toBe(false);
    expect(step.onComplete).toBe("shipping-form");
    expect(step.onFail).toBe("cart-error-display");
  });

  it("accepts skipCondition when canSkip is true", () => {
    const step: SequenceStep = {
      order: 2,
      componentId: "shipping-form",
      canSkip: true,
      skipCondition: "user.hasDefaultShippingAddress === true",
      onComplete: "payment-form",
      onFail: "shipping-error-display",
    };
    expect(step.canSkip).toBe(true);
    expect(step.skipCondition).toBe(
      "user.hasDefaultShippingAddress === true",
    );
  });
});

// ---------------------------------------------------------------------------
// SequenceRelationship
// ---------------------------------------------------------------------------

describe("SequenceRelationship", () => {
  const step1: SequenceStep = {
    order: 1,
    componentId: "cart-review",
    canSkip: false,
    onComplete: "payment-form",
    onFail: "cart-error-display",
  };
  const step2: SequenceStep = {
    order: 2,
    componentId: "payment-form",
    canSkip: false,
    onComplete: "order-confirmation-display",
    onFail: "payment-error-display",
  };

  it("satisfies the type with two steps", () => {
    const rel: SequenceRelationship = {
      type: "sequence",
      id: "checkout-flow",
      description: "Linear checkout from cart to order confirmation",
      steps: [step1, step2],
      linear: true,
    };
    expect(rel.type).toBe("sequence");
    expect(rel.steps).toHaveLength(2);
    expect(rel.linear).toBe(true);
  });

  it("has steps as a readonly array", () => {
    const rel: SequenceRelationship = {
      type: "sequence",
      id: "onboarding-flow",
      description: "User onboarding sequence",
      steps: [step1, step2],
      linear: false,
    };
    expect(Array.isArray(rel.steps)).toBe(true);
  });

  it("accepts linear false for non-linear sequences", () => {
    const rel: SequenceRelationship = {
      type: "sequence",
      id: "flexible-wizard",
      description: "Multi-step form where order is flexible",
      steps: [step1, step2],
      linear: false,
    };
    expect(rel.linear).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// DependencyRelationship
// ---------------------------------------------------------------------------

describe("DependencyRelationship", () => {
  const condition: Condition = {
    field: "email-input.isValid",
    operator: "===",
    value: true,
    description: "Email input must be valid",
  };

  it("satisfies the type with all required fields", () => {
    const rel: DependencyRelationship = {
      type: "dependency",
      id: "email-enables-submit",
      source: "email-input",
      target: "submit-btn",
      condition,
      effect: "enables",
      description: "Submit button is enabled only when email input is valid",
    };
    expect(rel.type).toBe("dependency");
    expect(rel.source).toBe("email-input");
    expect(rel.target).toBe("submit-btn");
    expect(rel.effect).toBe("enables");
  });

  it("accepts all DependencyEffect values", () => {
    const effects: DependencyEffect[] = [
      "enables",
      "disables",
      "shows",
      "hides",
      "modifies",
    ];
    for (const effect of effects) {
      const rel: DependencyRelationship = {
        type: "dependency",
        id: `rel-${effect}`,
        source: "source-component",
        target: "target-component",
        condition,
        effect,
        description: `Source ${effect} target`,
      };
      expect(rel.effect).toBe(effect);
    }
  });
});

// ---------------------------------------------------------------------------
// Relationship union
// ---------------------------------------------------------------------------

describe("Relationship union", () => {
  it("accepts a CompositionRelationship as a Relationship", () => {
    const rel: Relationship = {
      type: "composition",
      id: "form-composition",
      parent: "form",
      children: ["input", "button"],
      completionRequires: ["input"],
      description: "Form composition",
    };
    expect(rel.type).toBe("composition");
  });

  it("accepts a SequenceRelationship as a Relationship", () => {
    const rel: Relationship = {
      type: "sequence",
      id: "flow",
      description: "A flow",
      steps: [
        {
          order: 1,
          componentId: "step-one",
          canSkip: false,
          onComplete: "step-two",
          onFail: "error",
        },
      ],
      linear: true,
    };
    expect(rel.type).toBe("sequence");
  });

  it("accepts a DependencyRelationship as a Relationship", () => {
    const rel: Relationship = {
      type: "dependency",
      id: "dep",
      source: "source",
      target: "target",
      condition: {
        field: "source.isValid",
        operator: "===",
        value: true,
        description: "Source must be valid",
      },
      effect: "enables",
      description: "Source enables target",
    };
    expect(rel.type).toBe("dependency");
  });

  it("can discriminate union members by type field", () => {
    const relationships: Relationship[] = [
      {
        type: "composition",
        id: "c1",
        parent: "p",
        children: [],
        completionRequires: [],
        description: "composition",
      },
      {
        type: "sequence",
        id: "s1",
        description: "sequence",
        steps: [],
        linear: true,
      },
      {
        type: "dependency",
        id: "d1",
        source: "a",
        target: "b",
        condition: {
          field: "a.state",
          operator: "===",
          value: "ready",
          description: "A must be ready",
        },
        effect: "shows",
        description: "dependency",
      },
    ];

    for (const r of relationships) {
      if (r.type === "composition") {
        expect(r.parent).toBeDefined();
      } else if (r.type === "sequence") {
        expect(r.steps).toBeDefined();
      } else {
        expect(r.source).toBeDefined();
      }
    }
  });
});
