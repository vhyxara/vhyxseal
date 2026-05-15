import { describe, it, expect, beforeEach } from "vitest";
import { signManifest, verifyManifest } from "../../src/versioning/signing.js";
import {
  clearRelationshipRegistry,
} from "../../src/registry/relationship-registry.js";
import {
  clearCapabilityRegistry,
} from "../../src/registry/capability-registry.js";
import { generateManifest } from "../../src/manifest/generator.js";
import { VhyxSealError, ErrorCode } from "../../src/errors/index.js";
import type { SigningKey } from "../../src/versioning/signing.js";
import type { ManifestConfig } from "../../src/manifest/types.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validConfig: ManifestConfig = {
  domain: "example.com",
  domainVerified: false,
  verificationToken: "",
};

const matchingKey: SigningKey = {
  algorithm: "hmac-sha256",
  keyHex: "deadbeefcafe0000",
  domain: "example.com",
};

const mismatchedKey: SigningKey = {
  algorithm: "hmac-sha256",
  keyHex: "deadbeefcafe0000",
  domain: "attacker.com",
};

// ---------------------------------------------------------------------------
// Test isolation
// ---------------------------------------------------------------------------

beforeEach(() => {
  clearRelationshipRegistry();
  clearCapabilityRegistry();
});

// ---------------------------------------------------------------------------
// signManifest
// ---------------------------------------------------------------------------

describe("signManifest", () => {
  it("returns a SigningResult with signature starting 'stub_sig_' for matching domain", () => {
    const manifest = generateManifest([], validConfig);
    const result = signManifest(manifest, matchingKey);
    expect(result.signature.startsWith("stub_sig_")).toBe(true);
  });

  it("returned signedAt is a valid ISO date string", () => {
    const manifest = generateManifest([], validConfig);
    const result = signManifest(manifest, matchingKey);
    const date = new Date(result.signedAt);
    expect(date.toISOString()).toBe(result.signedAt);
  });

  it("returned algorithm matches the key's algorithm", () => {
    const manifest = generateManifest([], validConfig);
    const result = signManifest(manifest, matchingKey);
    expect(result.algorithm).toBe("hmac-sha256");
  });

  it("throws VHYX_DOMAIN_MISMATCH when key domain does not match manifest domain", () => {
    const manifest = generateManifest([], validConfig);
    let caught: unknown;
    try {
      signManifest(manifest, mismatchedKey);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_DOMAIN_MISMATCH);
    }
  });

  it("domain mismatch error has severity 'fatal'", () => {
    const manifest = generateManifest([], validConfig);
    let caught: unknown;
    try {
      signManifest(manifest, mismatchedKey);
    } catch (e) {
      caught = e;
    }
    if (caught instanceof VhyxSealError) {
      expect(caught.severity).toBe("fatal");
    }
  });

  it("domain mismatch error has recoverable: false", () => {
    const manifest = generateManifest([], validConfig);
    let caught: unknown;
    try {
      signManifest(manifest, mismatchedKey);
    } catch (e) {
      caught = e;
    }
    if (caught instanceof VhyxSealError) {
      expect(caught.recoverable).toBe(false);
    }
  });

  it("domain mismatch error context includes both domains", () => {
    const manifest = generateManifest([], validConfig);
    let caught: unknown;
    try {
      signManifest(manifest, mismatchedKey);
    } catch (e) {
      caught = e;
    }
    if (caught instanceof VhyxSealError) {
      expect(caught.context).toHaveProperty("keyDomain", "attacker.com");
      expect(caught.context).toHaveProperty("manifestDomain", "example.com");
    }
  });

  it("same manifest signed twice produces same signature (deterministic content)", () => {
    // Since the stub uses generateFingerprint (deterministic), same content = same sig
    const manifest = generateManifest([], validConfig);
    const r1 = signManifest(manifest, matchingKey);
    const r2 = signManifest(manifest, matchingKey);
    expect(r1.signature).toBe(r2.signature);
  });
});

// ---------------------------------------------------------------------------
// verifyManifest
// ---------------------------------------------------------------------------

describe("verifyManifest", () => {
  it("stub signature → valid true", () => {
    const manifest = generateManifest([], validConfig);
    const { signature } = signManifest(manifest, matchingKey);
    const result = verifyManifest(manifest, signature, matchingKey);
    expect(result.valid).toBe(true);
  });

  it("stub signature → reason is undefined (absent)", () => {
    const manifest = generateManifest([], validConfig);
    const { signature } = signManifest(manifest, matchingKey);
    const result = verifyManifest(manifest, signature, matchingKey);
    expect(result.reason).toBeUndefined();
  });

  it("non-stub signature → valid false", () => {
    const manifest = generateManifest([], validConfig);
    const result = verifyManifest(manifest, "real_cryptographic_sig_xyz", matchingKey);
    expect(result.valid).toBe(false);
  });

  it("non-stub signature → reason is set", () => {
    const manifest = generateManifest([], validConfig);
    const result = verifyManifest(manifest, "real_cryptographic_sig_xyz", matchingKey);
    expect(typeof result.reason).toBe("string");
    expect((result.reason?.length ?? 0) > 0).toBe(true);
  });

  it("domain mismatch → valid false (does not throw)", () => {
    const manifest = generateManifest([], validConfig);
    expect(() =>
      verifyManifest(manifest, "stub_sig_abc", mismatchedKey),
    ).not.toThrow();
    const result = verifyManifest(manifest, "stub_sig_abc", mismatchedKey);
    expect(result.valid).toBe(false);
  });

  it("domain mismatch → reason is 'Domain mismatch'", () => {
    const manifest = generateManifest([], validConfig);
    const result = verifyManifest(manifest, "stub_sig_abc", mismatchedKey);
    expect(result.reason).toBe("Domain mismatch");
  });

  it("empty signature string → valid false", () => {
    const manifest = generateManifest([], validConfig);
    const result = verifyManifest(manifest, "", matchingKey);
    expect(result.valid).toBe(false);
  });
});
