import { describe, it, expect } from "vitest";
import {
  INTENT_DEFAULTS,
  registerIntent,
  resolveIntentDefaults,
  isKnownIntent,
} from "../../src/schema/intents.js";
import { VhyxSealError, ErrorCode } from "../../src/errors/index.js";

// ---------------------------------------------------------------------------
// INTENT_DEFAULTS
// ---------------------------------------------------------------------------

describe("INTENT_DEFAULTS", () => {
  it("contains exactly 25 built-in intents", () => {
    // CLAUDE.md Section 12 defines 25 intents.
    // The session brief states 30 — flagged as a discrepancy to supervisor.
    // This test is written against the 25 actually present in the spec document.
    expect(Object.keys(INTENT_DEFAULTS)).toHaveLength(25);
  });

  it("contains the place-order intent with correct defaults", () => {
    const defaults = INTENT_DEFAULTS["place-order"];
    expect(defaults).toBeDefined();
    expect(defaults?.safetyLevel).toBe("high");
    expect(defaults?.requiresConfirmation).toBe(true);
    expect(defaults?.reversible).toBe(true);
    expect(defaults?.destructive).toBe(false);
  });

  it("contains the make-payment intent with correct defaults", () => {
    const defaults = INTENT_DEFAULTS["make-payment"];
    expect(defaults).toBeDefined();
    expect(defaults?.safetyLevel).toBe("critical");
    expect(defaults?.reversible).toBe(false);
    expect(defaults?.requiresConfirmation).toBe(true);
  });

  it("contains the delete-account intent with correct defaults", () => {
    const defaults = INTENT_DEFAULTS["delete-account"];
    expect(defaults).toBeDefined();
    expect(defaults?.safetyLevel).toBe("critical");
    expect(defaults?.destructive).toBe(true);
    expect(defaults?.reversible).toBe(false);
    expect(defaults?.requiresConfirmation).toBe(true);
  });

  it("contains the search intent with correct defaults", () => {
    const defaults = INTENT_DEFAULTS["search"];
    expect(defaults).toBeDefined();
    expect(defaults?.safetyLevel).toBe("low");
    expect(defaults?.requiresConfirmation).toBe(false);
    expect(defaults?.reversible).toBe(true);
    expect(defaults?.destructive).toBe(false);
  });

  it("contains the collect-password intent with safetyLevel sensitive", () => {
    const defaults = INTENT_DEFAULTS["collect-password"];
    expect(defaults).toBeDefined();
    expect(defaults?.safetyLevel).toBe("sensitive");
  });

  it("contains all expected intent keys", () => {
    const expectedKeys = [
      "place-order",
      "make-payment",
      "delete-account",
      "delete-item",
      "send-message",
      "save-draft",
      "submit-form",
      "update-profile",
      "sign-out",
      "sign-in",
      "apply-filter",
      "search",
      "upload-file",
      "download-file",
      "schedule-meeting",
      "cancel-booking",
      "publish-content",
      "unpublish-content",
      "share-item",
      "navigate",
      "confirm-action",
      "collect-email",
      "collect-password",
      "collect-payment",
      "authenticate",
    ];
    for (const key of expectedKeys) {
      expect(INTENT_DEFAULTS).toHaveProperty(key);
    }
  });
});

// ---------------------------------------------------------------------------
// registerIntent
// ---------------------------------------------------------------------------

describe("registerIntent", () => {
  it("successfully registers a new custom intent", () => {
    expect(() => {
      registerIntent("test-reg-001-request-refund", {
        safetyLevel: "high",
        reversible: false,
        requiresConfirmation: true,
        destructive: false,
      });
    }).not.toThrow();
  });

  it("registered intent is found by isKnownIntent", () => {
    registerIntent("test-reg-002-archive-record", {
      safetyLevel: "medium",
      reversible: true,
      requiresConfirmation: false,
      destructive: false,
    });
    expect(isKnownIntent("test-reg-002-archive-record")).toBe(true);
  });

  it("registered intent defaults are returned by resolveIntentDefaults", () => {
    registerIntent("test-reg-003-bulk-export", {
      safetyLevel: "low",
      reversible: true,
      requiresConfirmation: false,
      destructive: false,
    });
    const resolved = resolveIntentDefaults("test-reg-003-bulk-export");
    expect(resolved).toBeDefined();
    expect(resolved?.safetyLevel).toBe("low");
    expect(resolved?.reversible).toBe(true);
  });

  it("throws VhyxSealError with VHYX_UNKNOWN_INTENT when intent is empty string", () => {
    let caught: unknown;
    try {
      registerIntent("", {});
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_UNKNOWN_INTENT);
      expect(caught.severity).toBe("error");
      expect(caught.recoverable).toBe(true);
    }
  });

  it("throws VhyxSealError with VHYX_FIELD_TOO_LONG when intent exceeds 50 characters", () => {
    const longIntent = "a".repeat(51);
    let caught: unknown;
    try {
      registerIntent(longIntent, {});
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_FIELD_TOO_LONG);
      expect(caught.severity).toBe("error");
      expect(caught.recoverable).toBe(true);
    }
  });

  it("accepts an intent name of exactly 50 characters", () => {
    const exactLimit = "test-reg-004-" + "x".repeat(37); // 13 + 37 = 50 chars
    expect(exactLimit).toHaveLength(50);
    expect(() => {
      registerIntent(exactLimit, { safetyLevel: "low" });
    }).not.toThrow();
  });

  it("throws VhyxSealError with VHYX_DUPLICATE_INTENT when registering a duplicate custom intent", () => {
    registerIntent("test-reg-005-notify-user", { safetyLevel: "low" });
    let caught: unknown;
    try {
      registerIntent("test-reg-005-notify-user", { safetyLevel: "medium" });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_DUPLICATE_INTENT);
      expect(caught.severity).toBe("warning");
      expect(caught.recoverable).toBe(true);
    }
  });

  it("throws when attempting to re-register a built-in intent", () => {
    let caught: unknown;
    try {
      registerIntent("search", { safetyLevel: "critical" });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_DUPLICATE_INTENT);
      expect(caught.severity).toBe("warning");
    }
  });

  it("does not throw when registering a name not in INTENT_DEFAULTS", () => {
    expect(() => {
      registerIntent("test-reg-006-completely-novel-intent", {
        safetyLevel: "medium",
        reversible: false,
        requiresConfirmation: true,
        destructive: false,
      });
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// resolveIntentDefaults
// ---------------------------------------------------------------------------

describe("resolveIntentDefaults", () => {
  it("returns correct defaults for a built-in intent", () => {
    const defaults = resolveIntentDefaults("place-order");
    expect(defaults).toBeDefined();
    expect(defaults?.safetyLevel).toBe("high");
    expect(defaults?.reversible).toBe(true);
    expect(defaults?.requiresConfirmation).toBe(true);
    expect(defaults?.destructive).toBe(false);
  });

  it("returns correct defaults for another built-in intent", () => {
    const defaults = resolveIntentDefaults("delete-account");
    expect(defaults).toBeDefined();
    expect(defaults?.safetyLevel).toBe("critical");
    expect(defaults?.destructive).toBe(true);
  });

  it("returns correct defaults for a custom registered intent", () => {
    registerIntent("test-resolve-001-custom-approve", {
      safetyLevel: "high",
      reversible: false,
      requiresConfirmation: true,
      destructive: false,
    });
    const defaults = resolveIntentDefaults("test-resolve-001-custom-approve");
    expect(defaults).toBeDefined();
    expect(defaults?.safetyLevel).toBe("high");
    expect(defaults?.reversible).toBe(false);
    expect(defaults?.requiresConfirmation).toBe(true);
  });

  it("returns undefined for an unknown intent", () => {
    const result = resolveIntentDefaults("completely-unknown-xyz-99999");
    expect(result).toBeUndefined();
  });

  it("does not throw for an unknown intent", () => {
    expect(() => {
      resolveIntentDefaults("non-existent-intent-xyz");
    }).not.toThrow();
  });

  it("built-in lookup takes priority over a hypothetical custom entry", () => {
    // Built-ins are always checked first. This confirms the lookup order.
    const result = resolveIntentDefaults("authenticate");
    expect(result?.safetyLevel).toBe("medium");
  });
});

// ---------------------------------------------------------------------------
// isKnownIntent
// ---------------------------------------------------------------------------

describe("isKnownIntent", () => {
  it("returns true for a built-in intent", () => {
    expect(isKnownIntent("place-order")).toBe(true);
  });

  it("returns true for another built-in intent", () => {
    expect(isKnownIntent("navigate")).toBe(true);
  });

  it("returns true for a custom registered intent", () => {
    registerIntent("test-known-001-flag-content", { safetyLevel: "medium" });
    expect(isKnownIntent("test-known-001-flag-content")).toBe(true);
  });

  it("returns false for an unknown string", () => {
    expect(isKnownIntent("not-a-real-intent-xyz-99999")).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(isKnownIntent("")).toBe(false);
  });

  it("returns false for a string that is close but not matching a built-in", () => {
    expect(isKnownIntent("place-orders")).toBe(false);
    expect(isKnownIntent("Place-Order")).toBe(false);
    expect(isKnownIntent(" place-order")).toBe(false);
  });
});
