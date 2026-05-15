import { describe, it, expect } from "vitest";
import {
  parseVersion,
  isCompatible,
  negotiateVersion,
  getVersionStage,
  isStableOrBetter,
} from "../../src/versioning/version-negotiation.js";
import { VhyxSealError, ErrorCode } from "../../src/errors/index.js";

// ---------------------------------------------------------------------------
// parseVersion
// ---------------------------------------------------------------------------

describe("parseVersion", () => {
  it("parses '1.0.0' correctly", () => {
    const result = parseVersion("1.0.0");
    expect(result.major).toBe(1);
    expect(result.minor).toBe(0);
    expect(result.patch).toBe(0);
  });

  it("parses '2.13.7' correctly", () => {
    const result = parseVersion("2.13.7");
    expect(result.major).toBe(2);
    expect(result.minor).toBe(13);
    expect(result.patch).toBe(7);
  });

  it("parses '0.9.0' correctly", () => {
    const result = parseVersion("0.9.0");
    expect(result.major).toBe(0);
    expect(result.minor).toBe(9);
    expect(result.patch).toBe(0);
  });

  it("preserves the raw string exactly as provided", () => {
    expect(parseVersion("1.0.0").raw).toBe("1.0.0");
    expect(parseVersion("2.13.7").raw).toBe("2.13.7");
    expect(parseVersion("0.9.0").raw).toBe("0.9.0");
  });

  it("returns a ParsedVersion where raw equals the input", () => {
    const input = "3.14.159";
    expect(parseVersion(input).raw).toBe(input);
  });

  it("throws VHYX_INVALID_SCHEMA_VERSION for '1.0'", () => {
    let caught: unknown;
    try {
      parseVersion("1.0");
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_SCHEMA_VERSION);
      expect(caught.severity).toBe("error");
    }
  });

  it("throws for 'abc'", () => {
    let caught: unknown;
    try {
      parseVersion("abc");
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_SCHEMA_VERSION);
    }
  });

  it("throws for empty string", () => {
    let caught: unknown;
    try {
      parseVersion("");
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_INVALID_SCHEMA_VERSION);
    }
  });

  it("throws for version with pre-release suffix", () => {
    let caught: unknown;
    try {
      parseVersion("1.0.0-beta");
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
  });

  it("throws for version with leading 'v'", () => {
    let caught: unknown;
    try {
      parseVersion("v1.0.0");
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
  });
});

// ---------------------------------------------------------------------------
// isCompatible
// ---------------------------------------------------------------------------

describe("isCompatible", () => {
  it("same version → true", () => {
    expect(isCompatible("1.0.0", "1.0.0")).toBe(true);
  });

  it("higher minor in served satisfies request → true", () => {
    expect(isCompatible("1.2.0", "1.3.0")).toBe(true);
  });

  it("lower minor in served cannot satisfy request → false", () => {
    expect(isCompatible("1.2.0", "1.1.0")).toBe(false);
  });

  it("higher patch in served → true", () => {
    expect(isCompatible("1.2.0", "1.2.5")).toBe(true);
  });

  it("lower patch with same minor → true (patch always compatible)", () => {
    expect(isCompatible("1.2.3", "1.2.0")).toBe(true);
  });

  it("different major → false", () => {
    expect(isCompatible("1.0.0", "2.0.0")).toBe(false);
  });

  it("served major lower than requested major → false", () => {
    expect(isCompatible("2.0.0", "1.0.0")).toBe(false);
  });

  it("invalid requestedVersion → false, does not throw", () => {
    expect(() => isCompatible("bad", "1.0.0")).not.toThrow();
    expect(isCompatible("bad", "1.0.0")).toBe(false);
  });

  it("invalid servedVersion → false, does not throw", () => {
    expect(() => isCompatible("1.0.0", "bad")).not.toThrow();
    expect(isCompatible("1.0.0", "bad")).toBe(false);
  });

  it("both invalid → false, does not throw", () => {
    expect(() => isCompatible("bad", "also-bad")).not.toThrow();
    expect(isCompatible("bad", "also-bad")).toBe(false);
  });

  it("v1.0.0 is not compatible with v1.1.0 when served is lower", () => {
    // agent wants 1.1.0, site serves 1.0.0 — cannot satisfy
    expect(isCompatible("1.1.0", "1.0.0")).toBe(false);
  });

  it("v1.1.0 satisfies v1.0.0 (served higher minor)", () => {
    expect(isCompatible("1.0.0", "1.1.0")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// negotiateVersion
// ---------------------------------------------------------------------------

describe("negotiateVersion", () => {
  it("returns exactMatch true when requested version is available", () => {
    const result = negotiateVersion("1.0.0", undefined, ["1.0.0", "1.1.0"]);
    expect(result.compatible).toBe(true);
    expect(result.exactMatch).toBe(true);
    expect(result.servedVersion).toBe("1.0.0");
    expect(result.degradationMessage).toBeUndefined();
  });

  it("no exact match, compatible available → exactMatch false, degradationMessage set", () => {
    const result = negotiateVersion("1.2.0", undefined, ["1.0.0", "1.3.0"]);
    expect(result.compatible).toBe(true);
    expect(result.exactMatch).toBe(false);
    expect(result.servedVersion).toBe("1.3.0");
    expect(result.degradationMessage).toBeDefined();
    expect(typeof result.degradationMessage).toBe("string");
  });

  it("degradationMessage mentions the served version when not exact", () => {
    const result = negotiateVersion("1.2.0", undefined, ["1.3.0"]);
    expect(result.degradationMessage).toContain("1.3.0");
  });

  it("degradationMessage mentions the requested version when not exact", () => {
    const result = negotiateVersion("1.2.0", undefined, ["1.3.0"]);
    expect(result.degradationMessage).toContain("1.2.0");
  });

  it("fallback used when requested has no compatible — degradationMessage mentions fallback", () => {
    // request 2.0.0 with fallback 1.0.0, site only serves 1.x
    const result = negotiateVersion("2.0.0", "1.0.0", ["1.0.0", "1.1.0"]);
    expect(result.compatible).toBe(true);
    expect(result.exactMatch).toBe(false);
    expect(result.degradationMessage).toContain("fallback");
  });

  it("fallback serves the highest compatible match for the fallback version", () => {
    const result = negotiateVersion("2.0.0", "1.0.0", ["1.0.0", "1.3.0"]);
    expect(result.servedVersion).toBe("1.3.0");
  });

  it("nothing compatible → compatible false, degradationMessage set", () => {
    const result = negotiateVersion("3.0.0", undefined, ["1.0.0", "2.0.0"]);
    expect(result.compatible).toBe(false);
    expect(result.degradationMessage).toBeDefined();
    expect(typeof result.degradationMessage).toBe("string");
  });

  it("nothing compatible → servedVersion is the first available version", () => {
    const result = negotiateVersion("3.0.0", undefined, ["1.0.0", "2.0.0"]);
    expect(result.servedVersion).toBe("1.0.0");
  });

  it("nothing compatible with empty availableVersions → servedVersion is '1.0.0'", () => {
    const result = negotiateVersion("1.0.0", undefined, []);
    expect(result.compatible).toBe(false);
    expect(result.servedVersion).toBe("1.0.0");
  });

  it("highest compatible chosen when multiple options exist", () => {
    const result = negotiateVersion(
      "1.0.0",
      undefined,
      ["1.0.0", "1.1.0", "1.2.0", "1.3.0"],
    );
    // Exact match at 1.0.0 — exact wins
    expect(result.exactMatch).toBe(true);
    expect(result.servedVersion).toBe("1.0.0");
  });

  it("highest compatible chosen among non-exact matches", () => {
    // Request 1.1.0 — exact not available, 1.2.0 and 1.3.0 are both compatible
    const result = negotiateVersion(
      "1.1.0",
      undefined,
      ["1.0.0", "1.2.0", "1.3.0"],
    );
    expect(result.servedVersion).toBe("1.3.0");
  });

  it("patch tie-breaking — higher patch chosen", () => {
    const result = negotiateVersion("1.0.0", undefined, ["1.1.2", "1.1.5", "1.1.1"]);
    expect(result.servedVersion).toBe("1.1.5");
  });

  it("no fallback provided and nothing compatible uses first available", () => {
    const result = negotiateVersion("5.0.0", undefined, ["1.0.0"]);
    expect(result.servedVersion).toBe("1.0.0");
    expect(result.compatible).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getVersionStage
// ---------------------------------------------------------------------------

describe("getVersionStage", () => {
  it("'1.0.0' → 'stable'", () => {
    expect(getVersionStage("1.0.0")).toBe("stable");
  });

  it("'0.9.0' → 'beta'", () => {
    expect(getVersionStage("0.9.0")).toBe("beta");
  });

  it("'0.1.0' → 'alpha'", () => {
    expect(getVersionStage("0.1.0")).toBe("alpha");
  });

  it("unknown version → 'draft'", () => {
    expect(getVersionStage("9.9.9")).toBe("draft");
    expect(getVersionStage("0.0.1")).toBe("draft");
    expect(getVersionStage("")).toBe("draft");
  });

  it("does not throw for any input", () => {
    expect(() => getVersionStage("completely-invalid")).not.toThrow();
    expect(() => getVersionStage("")).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// isStableOrBetter
// ---------------------------------------------------------------------------

describe("isStableOrBetter", () => {
  it("'1.0.0' (stable) → true", () => {
    expect(isStableOrBetter("1.0.0")).toBe(true);
  });

  it("'0.9.0' (beta) → false", () => {
    expect(isStableOrBetter("0.9.0")).toBe(false);
  });

  it("'0.1.0' (alpha) → false", () => {
    expect(isStableOrBetter("0.1.0")).toBe(false);
  });

  it("unknown version (draft) → false", () => {
    expect(isStableOrBetter("9.9.9")).toBe(false);
  });

  it("does not throw for any input", () => {
    expect(() => isStableOrBetter("invalid-version")).not.toThrow();
    expect(() => isStableOrBetter("")).not.toThrow();
  });
});
