import { describe, it, expect } from "vitest";
import type {
  ComponentContract,
  ComponentType,
  SafetyLevel,
  Condition,
  ErrorState,
  ContractChangelog,
} from "../../src/schema/contract.js";

// ---------------------------------------------------------------------------
// ComponentType
// ---------------------------------------------------------------------------

describe("ComponentType", () => {
  it("accepts all five valid component type values", () => {
    const types: ComponentType[] = [
      "action",
      "input",
      "navigation",
      "display",
      "confirmation",
    ];
    expect(types).toHaveLength(5);
    for (const t of types) {
      expect(typeof t).toBe("string");
    }
  });
});

// ---------------------------------------------------------------------------
// SafetyLevel
// ---------------------------------------------------------------------------

describe("SafetyLevel", () => {
  it("accepts all five valid safety level values", () => {
    const levels: SafetyLevel[] = [
      "low",
      "medium",
      "high",
      "critical",
      "sensitive",
    ];
    expect(levels).toHaveLength(5);
    for (const l of levels) {
      expect(typeof l).toBe("string");
    }
  });
});

// ---------------------------------------------------------------------------
// Condition
// ---------------------------------------------------------------------------

describe("Condition", () => {
  it("satisfies the type with all required fields", () => {
    const condition: Condition = {
      field: "user.hasPaymentMethod",
      operator: "===",
      value: true,
      description: "User must have a payment method saved",
    };
    expect(condition.field).toBe("user.hasPaymentMethod");
    expect(condition.operator).toBe("===");
    expect(condition.value).toBe(true);
    expect(condition.description).toBe("User must have a payment method saved");
  });

  it("accepts all valid operator values", () => {
    const operators: Condition["operator"][] = [
      "===",
      "!==",
      ">",
      "<",
      ">=",
      "<=",
      "includes",
      "excludes",
    ];
    expect(operators).toHaveLength(8);
  });

  it("accepts unknown value type — string", () => {
    const condition: Condition = {
      field: "user.role",
      operator: "===",
      value: "admin",
      description: "User must be an admin",
    };
    expect(condition.value).toBe("admin");
  });

  it("accepts unknown value type — number", () => {
    const condition: Condition = {
      field: "cart.itemCount",
      operator: ">",
      value: 0,
      description: "Cart must have at least one item",
    };
    expect(condition.value).toBe(0);
  });

  it("accepts unknown value type — null", () => {
    const condition: Condition = {
      field: "user.suspendedAt",
      operator: "===",
      value: null,
      description: "User account must not be suspended",
    };
    expect(condition.value).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// ErrorState
// ---------------------------------------------------------------------------

describe("ErrorState", () => {
  it("satisfies the type with all required fields", () => {
    const errorState: ErrorState = {
      trigger: "payment declined",
      display: "red banner with message payment failed",
      recovery: "navigate to update-payment-method input",
    };
    expect(errorState.trigger).toBe("payment declined");
    expect(errorState.display).toBe("red banner with message payment failed");
    expect(errorState.recovery).toBe("navigate to update-payment-method input");
  });
});

// ---------------------------------------------------------------------------
// ContractChangelog
// ---------------------------------------------------------------------------

describe("ContractChangelog", () => {
  it("satisfies the type with all required fields", () => {
    const entry: ContractChangelog = {
      version: "1.2.0",
      date: "2026-05-14",
      change: "Added reversibleWindow field",
      breakingForAgents: false,
    };
    expect(entry.version).toBe("1.2.0");
    expect(entry.date).toBe("2026-05-14");
    expect(entry.breakingForAgents).toBe(false);
  });

  it("tracks breaking changes for agents", () => {
    const entry: ContractChangelog = {
      version: "2.0.0",
      date: "2027-01-01",
      change: "Renamed intent from checkout to place-order",
      breakingForAgents: true,
    };
    expect(entry.breakingForAgents).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ComponentContract — minimal valid object
// ---------------------------------------------------------------------------

describe("ComponentContract", () => {
  const minimalContract: ComponentContract = {
    id: "checkout-submit-btn",
    type: "action",
    intent: "place-order",
    description: "Submits the current cart as a purchase order",
    requires: [],
    requiredPermissions: [],
    consequence: "Creates an order record and charges the payment method",
    affects: ["cart", "orders"],
    reversible: true,
    safetyLevel: "high",
    requiresConfirmation: true,
    destructive: false,
    contractVersion: "1.0.0",
  };

  it("satisfies the type with all required fields and no optional fields", () => {
    expect(minimalContract.id).toBe("checkout-submit-btn");
    expect(minimalContract.type).toBe("action");
    expect(minimalContract.intent).toBe("place-order");
    expect(minimalContract.safetyLevel).toBe("high");
    expect(minimalContract.requiresConfirmation).toBe(true);
    expect(minimalContract.destructive).toBe(false);
    expect(minimalContract.contractVersion).toBe("1.0.0");
  });

  it("has requires as a readonly array that starts empty", () => {
    expect(Array.isArray(minimalContract.requires)).toBe(true);
    expect(minimalContract.requires).toHaveLength(0);
  });

  it("has requiredPermissions as a readonly array that starts empty", () => {
    expect(Array.isArray(minimalContract.requiredPermissions)).toBe(true);
    expect(minimalContract.requiredPermissions).toHaveLength(0);
  });

  it("has affects as a readonly array", () => {
    expect(Array.isArray(minimalContract.affects)).toBe(true);
    expect(minimalContract.affects).toContain("cart");
    expect(minimalContract.affects).toContain("orders");
  });

  it("accepts all optional fields when provided", () => {
    const fullContract: ComponentContract = {
      ...minimalContract,
      reversibleWindow: 300,
      alternatives: ["save-for-later-btn"],
      nextExpected: ["order-confirmation-display"],
      errorStates: [
        {
          trigger: "payment declined",
          display: "red banner",
          recovery: "navigate to update-payment-method",
        },
      ],
      fingerprint: "vhyxs_a3f8b2c1d4e5",
      lastVerified: "2026-05-14",
      verifiedBy: "manual",
      changelog: [
        {
          version: "1.0.0",
          date: "2026-05-14",
          change: "Initial contract",
          breakingForAgents: false,
        },
      ],
    };
    expect(fullContract.reversibleWindow).toBe(300);
    expect(fullContract.alternatives).toHaveLength(1);
    expect(fullContract.nextExpected).toHaveLength(1);
    expect(fullContract.errorStates).toHaveLength(1);
    expect(fullContract.fingerprint).toBe("vhyxs_a3f8b2c1d4e5");
    expect(fullContract.verifiedBy).toBe("manual");
    expect(fullContract.changelog).toHaveLength(1);
  });

  it("accepts preconditions with all operator types", () => {
    const contract: ComponentContract = {
      ...minimalContract,
      requires: [
        {
          field: "user.authenticated",
          operator: "===",
          value: true,
          description: "User must be logged in",
        },
        {
          field: "cart.hasItems",
          operator: "!==",
          value: false,
          description: "Cart must have items",
        },
        {
          field: "cart.itemCount",
          operator: ">",
          value: 0,
          description: "Cart must have at least one item",
        },
      ],
    };
    expect(contract.requires).toHaveLength(3);
  });

  it("accepts all ComponentType values in the type field", () => {
    const types: ComponentType[] = [
      "action",
      "input",
      "navigation",
      "display",
      "confirmation",
    ];
    for (const componentType of types) {
      const contract: ComponentContract = {
        ...minimalContract,
        type: componentType,
      };
      expect(contract.type).toBe(componentType);
    }
  });

  it("accepts all SafetyLevel values in the safetyLevel field", () => {
    const levels: SafetyLevel[] = [
      "low",
      "medium",
      "high",
      "critical",
      "sensitive",
    ];
    for (const level of levels) {
      const contract: ComponentContract = {
        ...minimalContract,
        safetyLevel: level,
      };
      expect(contract.safetyLevel).toBe(level);
    }
  });

  it("accepts all verifiedBy string values", () => {
    // exactOptionalPropertyTypes: explicit undefined assignment is not allowed.
    // Test the three string values; absence is tested by the minimal contract above.
    const verifiedByValues: Array<"auto" | "manual" | "test"> = [
      "auto",
      "manual",
      "test",
    ];
    for (const value of verifiedByValues) {
      const contract: ComponentContract = {
        ...minimalContract,
        verifiedBy: value,
      };
      expect(contract.verifiedBy).toBe(value);
    }
  });

  it("allows verifiedBy to be absent", () => {
    // minimalContract has no verifiedBy — confirmed here explicitly
    expect(minimalContract.verifiedBy).toBeUndefined();
  });
});
