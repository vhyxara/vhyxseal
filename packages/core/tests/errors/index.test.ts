import { describe, it, expect } from "vitest";
import { VhyxSealError, ErrorCode, ErrorSeverity } from "../../src/errors/index.js";

// ---------------------------------------------------------------------------
// ErrorSeverity
// ---------------------------------------------------------------------------

describe("ErrorSeverity", () => {
  it("has exactly the four expected string literal values", () => {
    const validValues: ErrorSeverity[] = ["fatal", "error", "warning", "info"];
    expect(validValues).toHaveLength(4);
    expect(validValues).toContain("fatal");
    expect(validValues).toContain("error");
    expect(validValues).toContain("warning");
    expect(validValues).toContain("info");
  });
});

// ---------------------------------------------------------------------------
// ErrorCode enum
// ---------------------------------------------------------------------------

describe("ErrorCode", () => {
  it("every value is a string", () => {
    const entries = Object.entries(ErrorCode) as [string, string][];
    for (const [, value] of entries) {
      expect(typeof value).toBe("string");
    }
  });

  it("every value starts with the VHYX_ prefix", () => {
    const values = Object.values(ErrorCode);
    for (const value of values) {
      expect(value).toMatch(/^VHYX_/);
    }
  });

  it("contains all schema error codes", () => {
    expect(ErrorCode.VHYX_INVALID_SCHEMA_VERSION).toBe("VHYX_INVALID_SCHEMA_VERSION");
    expect(ErrorCode.VHYX_CONTRACT_VALIDATION_FAILED).toBe("VHYX_CONTRACT_VALIDATION_FAILED");
    expect(ErrorCode.VHYX_UNKNOWN_INTENT).toBe("VHYX_UNKNOWN_INTENT");
    expect(ErrorCode.VHYX_INVALID_SAFETY_LEVEL).toBe("VHYX_INVALID_SAFETY_LEVEL");
    expect(ErrorCode.VHYX_FIELD_TOO_LONG).toBe("VHYX_FIELD_TOO_LONG");
    expect(ErrorCode.VHYX_INJECTION_DETECTED).toBe("VHYX_INJECTION_DETECTED");
  });

  it("contains all manifest error codes", () => {
    expect(ErrorCode.VHYX_MANIFEST_GENERATION_FAILED).toBe("VHYX_MANIFEST_GENERATION_FAILED");
    expect(ErrorCode.VHYX_MANIFEST_SIGNING_FAILED).toBe("VHYX_MANIFEST_SIGNING_FAILED");
    expect(ErrorCode.VHYX_MANIFEST_VERIFICATION_FAILED).toBe("VHYX_MANIFEST_VERIFICATION_FAILED");
    expect(ErrorCode.VHYX_DOMAIN_MISMATCH).toBe("VHYX_DOMAIN_MISMATCH");
  });

  it("contains all contract error codes", () => {
    expect(ErrorCode.VHYX_CONTRACT_DRIFT_DETECTED).toBe("VHYX_CONTRACT_DRIFT_DETECTED");
    expect(ErrorCode.VHYX_CONTRACT_STALE).toBe("VHYX_CONTRACT_STALE");
    expect(ErrorCode.VHYX_DUPLICATE_COMPONENT_ID).toBe("VHYX_DUPLICATE_COMPONENT_ID");
    expect(ErrorCode.VHYX_DUPLICATE_INTENT).toBe("VHYX_DUPLICATE_INTENT");
  });

  it("contains all relationship error codes", () => {
    expect(ErrorCode.VHYX_INVALID_RELATIONSHIP).toBe("VHYX_INVALID_RELATIONSHIP");
    expect(ErrorCode.VHYX_CIRCULAR_DEPENDENCY).toBe("VHYX_CIRCULAR_DEPENDENCY");
    expect(ErrorCode.VHYX_MISSING_COMPONENT_REF).toBe("VHYX_MISSING_COMPONENT_REF");
  });

  it("contains all security error codes", () => {
    expect(ErrorCode.VHYX_RATE_LIMIT_EXCEEDED).toBe("VHYX_RATE_LIMIT_EXCEEDED");
    expect(ErrorCode.VHYX_TOKEN_EXPIRED).toBe("VHYX_TOKEN_EXPIRED");
    expect(ErrorCode.VHYX_TOKEN_ALREADY_USED).toBe("VHYX_TOKEN_ALREADY_USED");
    expect(ErrorCode.VHYX_AGENT_NOT_ALLOWED).toBe("VHYX_AGENT_NOT_ALLOWED");
  });

  it("has exactly 21 codes total", () => {
    // TypeScript string enums produce only value entries (no reverse mapping).
    const values = Object.values(ErrorCode);
    expect(values).toHaveLength(21);
  });
});

// ---------------------------------------------------------------------------
// VhyxSealError construction
// ---------------------------------------------------------------------------

describe("VhyxSealError", () => {
  const baseConfig = {
    code: ErrorCode.VHYX_CONTRACT_VALIDATION_FAILED,
    message: "Contract validation failed for component checkout-btn",
    context: {
      componentId: "checkout-btn",
      field: "safetyLevel",
      received: "extreme",
      expected: ["low", "medium", "high", "critical", "sensitive"],
    },
    severity: "error" as ErrorSeverity,
    recoverable: true,
    suggestion: "safetyLevel must be one of: low | medium | high | critical | sensitive",
  };

  it("can be constructed with a valid config", () => {
    const err = new VhyxSealError(baseConfig);
    expect(err).toBeDefined();
  });

  it("is an instance of Error", () => {
    const err = new VhyxSealError(baseConfig);
    expect(err).toBeInstanceOf(Error);
  });

  it("is an instance of VhyxSealError", () => {
    const err = new VhyxSealError(baseConfig);
    expect(err).toBeInstanceOf(VhyxSealError);
  });

  it("has name set to VhyxSealError", () => {
    const err = new VhyxSealError(baseConfig);
    expect(err.name).toBe("VhyxSealError");
  });

  it("has message set from config", () => {
    const err = new VhyxSealError(baseConfig);
    expect(err.message).toBe(baseConfig.message);
  });

  it("has code set from config", () => {
    const err = new VhyxSealError(baseConfig);
    expect(err.code).toBe(ErrorCode.VHYX_CONTRACT_VALIDATION_FAILED);
  });

  it("has severity set from config", () => {
    const err = new VhyxSealError(baseConfig);
    expect(err.severity).toBe("error");
  });

  it("has recoverable set from config when true", () => {
    const err = new VhyxSealError(baseConfig);
    expect(err.recoverable).toBe(true);
  });

  it("has recoverable set from config when false", () => {
    const err = new VhyxSealError({
      ...baseConfig,
      recoverable: false,
    });
    expect(err.recoverable).toBe(false);
  });

  it("has suggestion set from config", () => {
    const err = new VhyxSealError(baseConfig);
    expect(err.suggestion).toBe(baseConfig.suggestion);
  });

  it("has stack defined", () => {
    const err = new VhyxSealError(baseConfig);
    expect(err.stack).toBeDefined();
  });

  it("has context set from config", () => {
    const err = new VhyxSealError(baseConfig);
    expect(err.context).toStrictEqual(baseConfig.context);
  });

  it("preserves context values of different types", () => {
    const err = new VhyxSealError({
      ...baseConfig,
      context: {
        stringField: "value",
        numberField: 42,
        boolField: true,
        nullField: null,
        arrayField: [1, 2, 3],
        nestedField: { a: 1 },
      },
    });
    expect(err.context["stringField"]).toBe("value");
    expect(err.context["numberField"]).toBe(42);
    expect(err.context["boolField"]).toBe(true);
    expect(err.context["nullField"]).toBeNull();
    expect(err.context["arrayField"]).toStrictEqual([1, 2, 3]);
    expect(err.context["nestedField"]).toStrictEqual({ a: 1 });
  });

  it("works with severity fatal", () => {
    const err = new VhyxSealError({ ...baseConfig, severity: "fatal" });
    expect(err.severity).toBe("fatal");
  });

  it("works with severity warning", () => {
    const err = new VhyxSealError({ ...baseConfig, severity: "warning" });
    expect(err.severity).toBe("warning");
  });

  it("works with severity info", () => {
    const err = new VhyxSealError({ ...baseConfig, severity: "info" });
    expect(err.severity).toBe("info");
  });

  it("works with every ErrorCode value", () => {
    for (const code of Object.values(ErrorCode)) {
      const err = new VhyxSealError({ ...baseConfig, code });
      expect(err.code).toBe(code);
    }
  });

  it("can be caught as an Error", () => {
    let caught: unknown;
    try {
      throw new VhyxSealError(baseConfig);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(Error);
    expect(caught).toBeInstanceOf(VhyxSealError);
  });

  it("can be caught and code inspected without type assertion", () => {
    let caught: unknown;
    try {
      throw new VhyxSealError(baseConfig);
    } catch (e) {
      caught = e;
    }
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_CONTRACT_VALIDATION_FAILED);
    } else {
      throw new Error("Expected VhyxSealError to be thrown");
    }
  });
});
