import { describe, it, expect, beforeEach } from "vitest";
import {
  generateManifest,
  generateFingerprint,
  validateContract,
} from "../../src/manifest/generator.js";
import {
  clearRelationshipRegistry,
  defineRelationship,
} from "../../src/registry/relationship-registry.js";
import {
  clearCapabilityRegistry,
  defineCapability,
} from "../../src/registry/capability-registry.js";
import { VhyxSealError, ErrorCode } from "../../src/errors/index.js";
import type { ComponentContract } from "../../src/schema/contract.js";
import type { ManifestConfig } from "../../src/manifest/types.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validConfig: ManifestConfig = {
  domain: "example.com",
  domainVerified: false,
  verificationToken: "",
};

const completeContract: ComponentContract = {
  id: "checkout-submit-btn",
  type: "action",
  intent: "place-order",
  description: "Submits the current cart as a purchase order",
  requires: [
    {
      field: "user.authenticated",
      operator: "===",
      value: true,
      description: "User must be logged in",
    },
  ],
  requiredPermissions: ["write:orders"],
  consequence: "Creates order record and charges payment method",
  affects: ["cart", "orders"],
  reversible: true,
  reversibleWindow: 300,
  safetyLevel: "high",
  requiresConfirmation: true,
  destructive: false,
  contractVersion: "1.0.0",
};

// ---------------------------------------------------------------------------
// Test isolation
// ---------------------------------------------------------------------------

beforeEach(() => {
  clearRelationshipRegistry();
  clearCapabilityRegistry();
});

// ---------------------------------------------------------------------------
// generateManifest — basic shape
// ---------------------------------------------------------------------------

describe("generateManifest — basic shape", () => {
  it("returns a manifest with the correct domain", () => {
    const result = generateManifest([], validConfig);
    expect(result.domain).toBe("example.com");
  });

  it("generatedAt is a valid ISO date string", () => {
    const result = generateManifest([], validConfig);
    const date = new Date(result.generatedAt);
    expect(date.toISOString()).toBe(result.generatedAt);
  });

  it("expiresAt is after generatedAt", () => {
    const result = generateManifest([], validConfig);
    expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(
      new Date(result.generatedAt).getTime(),
    );
  });

  it("expiresAt is exactly 3600 seconds after generatedAt by default", () => {
    const result = generateManifest([], validConfig);
    const diff =
      new Date(result.expiresAt).getTime() -
      new Date(result.generatedAt).getTime();
    expect(diff).toBe(3600 * 1000);
  });

  it("expiresAt respects a custom cacheDurationSeconds", () => {
    const result = generateManifest([], {
      ...validConfig,
      cacheDurationSeconds: 7200,
    });
    const diff =
      new Date(result.expiresAt).getTime() -
      new Date(result.generatedAt).getTime();
    expect(diff).toBe(7200 * 1000);
  });

  it("fingerprint starts with 'vhyxs_'", () => {
    const result = generateManifest([], validConfig);
    expect(result.fingerprint.startsWith("vhyxs_")).toBe(true);
  });

  it("signature is 'unsigned'", () => {
    const result = generateManifest([], validConfig);
    expect(result.signature).toBe("unsigned");
  });

  it("signedAt equals generatedAt", () => {
    const result = generateManifest([], validConfig);
    expect(result.signedAt).toBe(result.generatedAt);
  });

  it("vhyxseal field is set to default schema version", () => {
    const result = generateManifest([], validConfig);
    expect(result.vhyxseal).toBe("1.0.0");
  });

  it("schemaUrl uses default version when schemaVersion not provided", () => {
    const result = generateManifest([], validConfig);
    expect(result.schemaUrl).toBe("https://vhyxseal.dev/schema/1.0.0");
  });

  it("schemaVersion override is reflected in schemaUrl and vhyxseal field", () => {
    const result = generateManifest([], {
      ...validConfig,
      schemaVersion: "2.0.0",
    });
    expect(result.schemaUrl).toBe("https://vhyxseal.dev/schema/2.0.0");
    expect(result.vhyxseal).toBe("2.0.0");
  });

  it("domainVerified is passed through from config", () => {
    const result = generateManifest([], {
      ...validConfig,
      domainVerified: true,
      verificationToken: "tok_abc123",
    });
    expect(result.domainVerified).toBe(true);
    expect(result.verificationToken).toBe("tok_abc123");
  });

  it("empty components array produces manifest with empty components", () => {
    const result = generateManifest([], validConfig);
    expect(result.components).toHaveLength(0);
  });

  it("components are included in the manifest", () => {
    const result = generateManifest([completeContract], validConfig);
    expect(result.components).toHaveLength(1);
    expect(result.components[0]?.id).toBe("checkout-submit-btn");
  });
});

// ---------------------------------------------------------------------------
// generateManifest — agent policy
// ---------------------------------------------------------------------------

describe("generateManifest — agentPolicy", () => {
  it("applies default agent policy when none provided", () => {
    const result = generateManifest([], validConfig);
    expect(result.agentPolicy.allowedAgents).toEqual(["*"]);
    expect(result.agentPolicy.manifestAccess).toBe("public");
    expect(result.agentPolicy.requireAgentIdentification).toBe(false);
    expect(result.agentPolicy.rateLimits.actionsPerMinute).toBe(60);
  });

  it("partial override — provided fields replace defaults", () => {
    const result = generateManifest([], {
      ...validConfig,
      agentPolicy: {
        requireAgentIdentification: true,
        manifestAccess: "private",
        manifestAuth: "bearer-token",
      },
    });
    expect(result.agentPolicy.requireAgentIdentification).toBe(true);
    expect(result.agentPolicy.manifestAccess).toBe("private");
    expect(result.agentPolicy.manifestAuth).toBe("bearer-token");
  });

  it("partial override — unset fields stay at defaults", () => {
    const result = generateManifest([], {
      ...validConfig,
      agentPolicy: { requireAgentIdentification: true },
    });
    // These were not provided, so they stay at default values
    expect(result.agentPolicy.allowedAgents).toEqual(["*"]);
    expect(result.agentPolicy.rateLimits.actionsPerMinute).toBe(60);
    expect(result.agentPolicy.manifestAccess).toBe("public");
  });

  it("allowedAgents override replaces default", () => {
    const result = generateManifest([], {
      ...validConfig,
      agentPolicy: { allowedAgents: ["anthropic/claude"] },
    });
    expect(result.agentPolicy.allowedAgents).toEqual(["anthropic/claude"]);
  });

  it("rateLimits override replaces entire rateLimits object", () => {
    const result = generateManifest([], {
      ...validConfig,
      agentPolicy: {
        rateLimits: {
          actionsPerMinute: 10,
          actionsPerHour: 100,
          manifestRequestsPerMinute: 2,
          perAgentSession: false,
        },
      },
    });
    expect(result.agentPolicy.rateLimits.actionsPerMinute).toBe(10);
    expect(result.agentPolicy.rateLimits.perAgentSession).toBe(false);
  });

  it("manifestAuth is absent when not provided", () => {
    const result = generateManifest([], validConfig);
    expect(result.agentPolicy.manifestAuth).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// generateManifest — registry integration
// ---------------------------------------------------------------------------

describe("generateManifest — registry integration", () => {
  it("relationships from registry are included in manifest", () => {
    defineRelationship({
      type: "dependency",
      id: "test-dep",
      source: "field-a",
      target: "btn-b",
      condition: {
        field: "user.authenticated",
        operator: "===",
        value: true,
        description: "User must be authenticated",
      },
      effect: "enables",
      description: "Button enabled when authenticated",
    });
    const result = generateManifest([], validConfig);
    expect(result.relationships).toHaveLength(1);
    expect(result.relationships[0]?.id).toBe("test-dep");
  });

  it("capabilities from registry are included in manifest", () => {
    defineCapability({
      id: "test-cap",
      description: "A test capability",
      entryPoint: "entry-btn",
      exitPoints: [
        {
          componentId: "success-display",
          outcome: "success",
          description: "Completed",
        },
      ],
      relationships: [],
      estimatedSteps: 2,
      requiresAuth: false,
      safetyLevel: "low",
    });
    const result = generateManifest([], validConfig);
    expect(result.capabilities).toHaveLength(1);
    expect(result.capabilities[0]?.id).toBe("test-cap");
  });

  it("empty registries produce empty relationships and capabilities arrays", () => {
    const result = generateManifest([], validConfig);
    expect(result.relationships).toHaveLength(0);
    expect(result.capabilities).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// generateManifest — validation errors
// ---------------------------------------------------------------------------

describe("generateManifest — validation errors", () => {
  it("throws VHYX_MANIFEST_GENERATION_FAILED for empty domain", () => {
    let caught: unknown;
    try {
      generateManifest([], { ...validConfig, domain: "" });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_MANIFEST_GENERATION_FAILED);
      expect(caught.severity).toBe("fatal");
    }
  });

  it("throws VHYX_DUPLICATE_COMPONENT_ID when two components share an id", () => {
    const duplicate = { ...completeContract };
    let caught: unknown;
    try {
      generateManifest([completeContract, duplicate], validConfig);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_DUPLICATE_COMPONENT_ID);
      expect(caught.severity).toBe("error");
    }
  });

  it("duplicate component id error includes the duplicate id in context", () => {
    const duplicate = { ...completeContract };
    let caught: unknown;
    try {
      generateManifest([completeContract, duplicate], validConfig);
    } catch (e) {
      caught = e;
    }
    if (caught instanceof VhyxSealError) {
      expect(caught.context).toHaveProperty("duplicateId", "checkout-submit-btn");
    }
  });
});

// ---------------------------------------------------------------------------
// generateFingerprint
// ---------------------------------------------------------------------------

describe("generateFingerprint", () => {
  it("returns a string", () => {
    expect(typeof generateFingerprint("hello")).toBe("string");
  });

  it("output starts with 'vhyxs_'", () => {
    expect(generateFingerprint("hello").startsWith("vhyxs_")).toBe(true);
  });

  it("same input always returns the same output (deterministic)", () => {
    const a = generateFingerprint("deterministic content");
    const b = generateFingerprint("deterministic content");
    expect(a).toBe(b);
  });

  it("different input returns different output", () => {
    const a = generateFingerprint("content-alpha");
    const b = generateFingerprint("content-beta");
    expect(a).not.toBe(b);
  });

  it("empty string input returns a string without throwing", () => {
    expect(() => generateFingerprint("")).not.toThrow();
    expect(typeof generateFingerprint("")).toBe("string");
  });

  it("empty string input returns a vhyxs_ prefixed result", () => {
    expect(generateFingerprint("").startsWith("vhyxs_")).toBe(true);
  });

  it("output has exactly 8 hex characters after the prefix", () => {
    const fp = generateFingerprint("test content here");
    const hexPart = fp.slice("vhyxs_".length);
    expect(hexPart).toMatch(/^[0-9a-f]{8}$/);
  });

  it("long content produces consistent fingerprint", () => {
    const longContent = "x".repeat(10000);
    const a = generateFingerprint(longContent);
    const b = generateFingerprint(longContent);
    expect(a).toBe(b);
  });

  it("fingerprint changes when content changes", () => {
    const fp1 = generateFingerprint("version 1 content");
    const fp2 = generateFingerprint("version 2 content");
    expect(fp1).not.toBe(fp2);
  });
});

// ---------------------------------------------------------------------------
// validateContract
// ---------------------------------------------------------------------------

describe("validateContract", () => {
  it("returns true for a complete valid contract", () => {
    expect(validateContract(completeContract)).toBe(true);
  });

  it("returns false when id is missing", () => {
    const { id: _id, ...rest } = completeContract;
    expect(validateContract(rest)).toBe(false);
  });

  it("returns false when id is empty string", () => {
    expect(validateContract({ ...completeContract, id: "" })).toBe(false);
  });

  it("returns false when intent is missing", () => {
    const { intent: _intent, ...rest } = completeContract;
    expect(validateContract(rest)).toBe(false);
  });

  it("returns false when description is missing", () => {
    const { description: _desc, ...rest } = completeContract;
    expect(validateContract(rest)).toBe(false);
  });

  it("returns false when type is missing", () => {
    const { type: _type, ...rest } = completeContract;
    expect(validateContract(rest)).toBe(false);
  });

  it("returns false when type is an invalid value", () => {
    expect(
      validateContract({
        ...completeContract,
        type: "button" as unknown as "action",
      }),
    ).toBe(false);
  });

  it("returns false when safetyLevel is missing", () => {
    const { safetyLevel: _sl, ...rest } = completeContract;
    expect(validateContract(rest)).toBe(false);
  });

  it("returns false when safetyLevel is an invalid value", () => {
    expect(
      validateContract({
        ...completeContract,
        safetyLevel: "extreme" as unknown as "high",
      }),
    ).toBe(false);
  });

  it("returns false when consequence is missing", () => {
    const { consequence: _c, ...rest } = completeContract;
    expect(validateContract(rest)).toBe(false);
  });

  it("returns false when contractVersion is missing", () => {
    const { contractVersion: _cv, ...rest } = completeContract;
    expect(validateContract(rest)).toBe(false);
  });

  it("returns false when requires array is missing", () => {
    const { requires: _r, ...rest } = completeContract;
    expect(validateContract(rest)).toBe(false);
  });

  it("returns true when requires is an empty array", () => {
    expect(validateContract({ ...completeContract, requires: [] })).toBe(true);
  });

  it("returns false when requiredPermissions is missing", () => {
    const { requiredPermissions: _rp, ...rest } = completeContract;
    expect(validateContract(rest)).toBe(false);
  });

  it("returns false when affects is missing", () => {
    const { affects: _a, ...rest } = completeContract;
    expect(validateContract(rest)).toBe(false);
  });

  it("returns false when reversible is missing", () => {
    const { reversible: _rev, ...rest } = completeContract;
    expect(validateContract(rest)).toBe(false);
  });

  it("returns true when reversible is false (boolean false is valid)", () => {
    expect(
      validateContract({ ...completeContract, reversible: false }),
    ).toBe(true);
  });

  it("returns false when requiresConfirmation is missing", () => {
    const { requiresConfirmation: _rc, ...rest } = completeContract;
    expect(validateContract(rest)).toBe(false);
  });

  it("returns false when destructive is missing", () => {
    const { destructive: _d, ...rest } = completeContract;
    expect(validateContract(rest)).toBe(false);
  });

  it("does not throw for any input — empty object", () => {
    expect(() => validateContract({})).not.toThrow();
    expect(validateContract({})).toBe(false);
  });

  it("does not throw for a fully empty partial", () => {
    expect(() => validateContract({})).not.toThrow();
  });

  it("returns false for an empty partial contract", () => {
    expect(validateContract({})).toBe(false);
  });

  it("returns true for all valid component types", () => {
    const types = [
      "action",
      "input",
      "navigation",
      "display",
      "confirmation",
    ] as const;
    for (const type of types) {
      expect(validateContract({ ...completeContract, type })).toBe(true);
    }
  });

  it("returns true for all valid safety levels", () => {
    const levels = [
      "low",
      "medium",
      "high",
      "critical",
      "sensitive",
    ] as const;
    for (const safetyLevel of levels) {
      expect(validateContract({ ...completeContract, safetyLevel })).toBe(true);
    }
  });
});
