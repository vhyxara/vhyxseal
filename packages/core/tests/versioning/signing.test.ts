import { describe, it, expect, beforeEach } from "vitest";
import {
  signManifest,
  verifyManifest,
  attachSignature,
  canonicalManifestPayload,
  SIGNATURE_PREFIX,
} from "../../src/versioning/signing.js";
import { clearRelationshipRegistry } from "../../src/registry/relationship-registry.js";
import { clearCapabilityRegistry } from "../../src/registry/capability-registry.js";
import { clearKeyManager, registerKey } from "../../src/keys/key-manager.js";
import { generateManifest } from "../../src/manifest/generator.js";
import { VhyxSealError, ErrorCode } from "../../src/errors/index.js";
import type { SigningKey } from "../../src/versioning/signing.js";
import type { ManifestConfig } from "../../src/manifest/types.js";

const validConfig: ManifestConfig = {
  domain: "example.com",
  domainVerified: false,
  verificationToken: "",
};

const SECRET = "a1".repeat(32);

const matchingKey: SigningKey = { algorithm: "hmac-sha256", keyHex: SECRET, domain: "example.com" };
const mismatchedKey: SigningKey = { algorithm: "hmac-sha256", keyHex: SECRET, domain: "attacker.com" };
const otherKey: SigningKey = { algorithm: "hmac-sha256", keyHex: "b2".repeat(32), domain: "example.com" };

beforeEach(() => {
  clearRelationshipRegistry();
  clearCapabilityRegistry();
  clearKeyManager();
});

function catchError(fn: () => unknown): unknown {
  try {
    fn();
  } catch (e) {
    return e;
  }
  return undefined;
}

describe("signManifest", () => {
  it("produces an hmac-sha256 signature with a 64-char hex MAC", () => {
    const result = signManifest(generateManifest([], validConfig), matchingKey);
    expect(result.signature.startsWith(SIGNATURE_PREFIX)).toBe(true);
    expect(result.signature.slice(SIGNATURE_PREFIX.length)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returned signedAt is a valid ISO date string", () => {
    const result = signManifest(generateManifest([], validConfig), matchingKey);
    expect(new Date(result.signedAt).toISOString()).toBe(result.signedAt);
  });

  it("returned algorithm matches the key's algorithm", () => {
    expect(signManifest(generateManifest([], validConfig), matchingKey).algorithm).toBe("hmac-sha256");
  });

  it("throws fatal, non-recoverable VHYX_DOMAIN_MISMATCH with both domains in context", () => {
    const caught = catchError(() => signManifest(generateManifest([], validConfig), mismatchedKey));
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_DOMAIN_MISMATCH);
      expect(caught.severity).toBe("fatal");
      expect(caught.recoverable).toBe(false);
      expect(caught.context).toHaveProperty("keyDomain", "attacker.com");
      expect(caught.context).toHaveProperty("manifestDomain", "example.com");
    }
  });

  it("rejects keys shorter than 32 bytes", () => {
    const caught = catchError(() =>
      signManifest(generateManifest([], validConfig), { ...matchingKey, keyHex: "deadbeef" }),
    );
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_MANIFEST_SIGNING_FAILED);
    }
  });

  it("is deterministic for identical content", () => {
    const manifest = generateManifest([], validConfig);
    expect(signManifest(manifest, matchingKey).signature).toBe(signManifest(manifest, matchingKey).signature);
  });

  it("different keys produce different signatures", () => {
    const manifest = generateManifest([], validConfig);
    expect(signManifest(manifest, matchingKey).signature).not.toBe(signManifest(manifest, otherKey).signature);
  });

  it("does not emit the legacy stub warning", () => {
    const warn = console.warn;
    let calls = 0;
    console.warn = (): void => { calls++; };
    try {
      signManifest(generateManifest([], validConfig), matchingKey);
    } finally {
      console.warn = warn;
    }
    expect(calls).toBe(0);
  });
});

describe("canonicalManifestPayload", () => {
  it("ignores key order and signature fields", () => {
    const manifest = generateManifest([], validConfig);
    const reordered = Object.fromEntries(Object.entries(manifest).reverse()) as typeof manifest;
    const resigned = { ...manifest, signature: "x", signedAt: "y" };
    expect(canonicalManifestPayload(reordered)).toBe(canonicalManifestPayload(manifest));
    expect(canonicalManifestPayload(resigned)).toBe(canonicalManifestPayload(manifest));
  });
});

describe("verifyManifest", () => {
  it("accepts a signature it produced", () => {
    const manifest = generateManifest([], validConfig);
    const { signature } = signManifest(manifest, matchingKey);
    const result = verifyManifest(manifest, signature, matchingKey);
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("detects tampering with manifest content", () => {
    const manifest = generateManifest([], validConfig);
    const { signature } = signManifest(manifest, matchingKey);
    const tampered = { ...manifest, domainVerified: true };
    const result = verifyManifest(tampered, signature, matchingKey);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/does not match/);
  });

  it("rejects signatures made with a different key", () => {
    const manifest = generateManifest([], validConfig);
    const { signature } = signManifest(manifest, otherKey);
    expect(verifyManifest(manifest, signature, matchingKey).valid).toBe(false);
  });

  it("rejects legacy stub signatures with an explanation", () => {
    const result = verifyManifest(generateManifest([], validConfig), "stub_sig_abc", matchingKey);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/stub/i);
  });

  it("rejects unknown formats and empty strings", () => {
    const manifest = generateManifest([], validConfig);
    expect(verifyManifest(manifest, "real_cryptographic_sig_xyz", matchingKey).valid).toBe(false);
    expect(verifyManifest(manifest, "", matchingKey).valid).toBe(false);
  });

  it("domain mismatch → valid false with reason, never throws", () => {
    const manifest = generateManifest([], validConfig);
    expect(() => verifyManifest(manifest, "hmac-sha256:00", mismatchedKey)).not.toThrow();
    expect(verifyManifest(manifest, "hmac-sha256:00", mismatchedKey)).toEqual({ valid: false, reason: "Domain mismatch" });
  });

  it("weak verification key → valid false, never throws", () => {
    const manifest = generateManifest([], validConfig);
    const { signature } = signManifest(manifest, matchingKey);
    expect(verifyManifest(manifest, signature, { ...matchingKey, keyHex: "ab" }).valid).toBe(false);
  });
});

describe("attachSignature", () => {
  it("fills signature and signedAt using an explicit key", () => {
    const manifest = generateManifest([], validConfig);
    const signed = attachSignature(manifest, matchingKey);
    expect(signed.signature.startsWith(SIGNATURE_PREFIX)).toBe(true);
    expect(verifyManifest(signed, signed.signature, matchingKey).valid).toBe(true);
    expect(manifest.signature).toBe("unsigned");
  });

  it("falls back to the active KeyManager key", () => {
    registerKey(SECRET);
    const signed = attachSignature(generateManifest([], validConfig));
    expect(verifyManifest(signed, signed.signature, matchingKey).valid).toBe(true);
  });

  it("throws when no key is available", () => {
    const caught = catchError(() => attachSignature(generateManifest([], validConfig)));
    expect(caught).toBeInstanceOf(VhyxSealError);
  });
});
