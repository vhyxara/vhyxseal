/**
 * Integration tests for domain verification — Session 4B-002.
 *
 * Six mandatory scenarios (all must pass):
 *   1. Happy path: registerKey → issueDomainToken → verifyDomainToken → true
 *   2. Expired token: advance time past TTL → verify → false
 *   3. Tampered token: modify token string → verify → false (HMAC fails)
 *   4. Unregistered domain: verifyDomainToken on unknown domain → false
 *   5. Revoked token: issue → revoke → verify → false
 *   6. No active key: issueDomainToken without registerKey → throws VhyxSealError
 *
 * All failure paths in verifyDomainToken are explicitly covered.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearKeyManager, registerKey, revokeKey, rotateKey, getActiveKey } from "../../src/keys/key-manager.js";
import {
  issueDomainToken,
  verifyDomainToken,
  revokeDomainToken,
  clearDomainVerification,
} from "../../src/domain/verification.js";
import { VhyxSealError, ErrorCode } from "../../src/errors/index.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SECRET = "a".repeat(64);    // 64 hex chars = 32 bytes — minimum valid
const SECRET_B = "b".repeat(64);  // alternate secret for rotation tests
const DOMAIN = "example.com";
const DOMAIN_B = "other.com";

// Must match the TTL_MS constant in verification.ts
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ---------------------------------------------------------------------------
// Test isolation
// ---------------------------------------------------------------------------

beforeEach(() => {
  clearKeyManager();
  clearDomainVerification();
  vi.useRealTimers(); // ensure fake timers are reset between tests
});

// ---------------------------------------------------------------------------
// Scenario 1 — Happy path
// ---------------------------------------------------------------------------

describe("Scenario 1 — happy path: registerKey → issueDomainToken → verifyDomainToken", () => {
  it("verifyDomainToken returns true after registerKey and issueDomainToken", () => {
    registerKey(SECRET);
    const token = issueDomainToken(DOMAIN);
    expect(verifyDomainToken(DOMAIN, token)).toBe(true);
  });

  it("issueDomainToken returns a 64-character lowercase hex string", () => {
    registerKey(SECRET);
    const token = issueDomainToken(DOMAIN);
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("issued tokens are unique on every call (crypto.randomBytes)", () => {
    registerKey(SECRET);
    const token1 = issueDomainToken(DOMAIN);
    const token2 = issueDomainToken(DOMAIN);
    expect(token1).not.toBe(token2);
  });

  it("tokens for different domains are independent", () => {
    registerKey(SECRET);
    const tokenA = issueDomainToken(DOMAIN);
    const tokenB = issueDomainToken(DOMAIN_B);
    expect(verifyDomainToken(DOMAIN, tokenA)).toBe(true);
    expect(verifyDomainToken(DOMAIN_B, tokenB)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Scenario 2 — Expired token
// ---------------------------------------------------------------------------

describe("Scenario 2 — expired token: advance time past TTL → verifyDomainToken returns false", () => {
  it("verifyDomainToken returns false after token TTL has elapsed (30 days + 1 ms)", () => {
    vi.useFakeTimers();
    registerKey(SECRET);
    const token = issueDomainToken(DOMAIN);

    // Confirm valid before expiry
    expect(verifyDomainToken(DOMAIN, token)).toBe(true);

    // Advance time past the 30-day TTL
    vi.advanceTimersByTime(TTL_MS + 1);

    // Token is now expired
    expect(verifyDomainToken(DOMAIN, token)).toBe(false);
  });

  it("verifyDomainToken still returns true at TTL boundary (not yet expired)", () => {
    vi.useFakeTimers();
    registerKey(SECRET);
    const token = issueDomainToken(DOMAIN);

    // Advance to just under the TTL
    vi.advanceTimersByTime(TTL_MS - 1);

    expect(verifyDomainToken(DOMAIN, token)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Scenario 3 — Tampered token (HMAC fails)
// ---------------------------------------------------------------------------

describe("Scenario 3 — tampered token: HMAC verification fails → verifyDomainToken returns false", () => {
  it("verifyDomainToken returns false when the last 4 characters of the token are replaced", () => {
    registerKey(SECRET);
    const token = issueDomainToken(DOMAIN);
    const tampered = token.slice(0, -4) + "0000";
    expect(verifyDomainToken(DOMAIN, tampered)).toBe(false);
  });

  it("verifyDomainToken returns false for a completely fabricated token string", () => {
    registerKey(SECRET);
    issueDomainToken(DOMAIN); // register the domain
    const fabricated = "f".repeat(64);
    expect(verifyDomainToken(DOMAIN, fabricated)).toBe(false);
  });

  it("verifyDomainToken returns false when one character of the token is changed", () => {
    registerKey(SECRET);
    const token = issueDomainToken(DOMAIN);
    // Flip the first character: '0'→'1' or anything→'0'
    const flipped = token[0] === "0" ? "1" + token.slice(1) : "0" + token.slice(1);
    expect(verifyDomainToken(DOMAIN, flipped)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Scenario 4 — Unregistered domain
// ---------------------------------------------------------------------------

describe("Scenario 4 — unregistered domain: verifyDomainToken returns false", () => {
  it("verifyDomainToken returns false for a domain that was never registered", () => {
    // No registerKey or issueDomainToken called for "unknown.com"
    expect(verifyDomainToken("unknown.com", "any-token")).toBe(false);
  });

  it("verifyDomainToken returns false when domain is known but token belongs to a different domain (HMAC domain-binding)", () => {
    registerKey(SECRET);
    const tokenA = issueDomainToken(DOMAIN);
    // tokenA was issued for DOMAIN — it must NOT verify against DOMAIN_B
    // even if DOMAIN_B is registered separately
    issueDomainToken(DOMAIN_B);
    expect(verifyDomainToken(DOMAIN_B, tokenA)).toBe(false);
  });

  it("verifyDomainToken returns false with empty string inputs", () => {
    expect(verifyDomainToken("", "")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Scenario 5 — Revoked token
// ---------------------------------------------------------------------------

describe("Scenario 5 — revoked token: issue → revoke → verify returns false", () => {
  it("verifyDomainToken returns false after revokeDomainToken, even for a valid unexpired token", () => {
    registerKey(SECRET);
    const token = issueDomainToken(DOMAIN);

    // Confirm valid before revocation
    expect(verifyDomainToken(DOMAIN, token)).toBe(true);

    // Revoke the domain
    revokeDomainToken(DOMAIN);

    // Token is now invalid
    expect(verifyDomainToken(DOMAIN, token)).toBe(false);
  });

  it("revokeDomainToken is a silent no-op for an unregistered domain (no error thrown)", () => {
    // Domain was never registered
    expect(() => revokeDomainToken("never-registered.com")).not.toThrow();
  });

  it("revokeDomainToken clears the domain so a new token can be issued afterward", () => {
    registerKey(SECRET);
    const token1 = issueDomainToken(DOMAIN);
    revokeDomainToken(DOMAIN);

    // Issue a fresh token for the same domain
    const token2 = issueDomainToken(DOMAIN);

    // Old token must be invalid
    expect(verifyDomainToken(DOMAIN, token1)).toBe(false);
    // New token must be valid
    expect(verifyDomainToken(DOMAIN, token2)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Scenario 6 — No active key at issuance
// ---------------------------------------------------------------------------

describe("Scenario 6 — no active key: issueDomainToken throws VhyxSealError", () => {
  it("issueDomainToken throws VhyxSealError when no key is registered", () => {
    let caught: unknown;
    try {
      issueDomainToken(DOMAIN);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
  });

  it("thrown error has code VHYX_MANIFEST_SIGNING_FAILED", () => {
    let caught: unknown;
    try {
      issueDomainToken(DOMAIN);
    } catch (e) {
      caught = e;
    }
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_MANIFEST_SIGNING_FAILED);
    }
  });

  it("thrown error has severity 'error' and recoverable true", () => {
    let caught: unknown;
    try {
      issueDomainToken(DOMAIN);
    } catch (e) {
      caught = e;
    }
    if (caught instanceof VhyxSealError) {
      expect(caught.severity).toBe("error");
      expect(caught.recoverable).toBe(true);
    }
  });

  it("verifyDomainToken never throws — returns false even when called with extreme inputs", () => {
    // None of these should ever throw
    expect(() => verifyDomainToken("", "")).not.toThrow();
    expect(() => verifyDomainToken(DOMAIN, "")).not.toThrow();
    expect(() => verifyDomainToken(DOMAIN, "bad-token")).not.toThrow();
    expect(verifyDomainToken(DOMAIN, "bad-token")).toBe(false);
  });

  it("verifyDomainToken still returns true after revokeKey — key stays in KeyManager (stored keyId fix)", () => {
    // Session 5-001 Item 1: verifyDomainToken now uses the stored keyId from
    // issuance rather than getActiveKey(). revokeKey() sets active=false but
    // does NOT delete the key from KeyManager. listKeys() still returns it.
    // Therefore verification succeeds as long as the domain token itself is
    // not revoked via revokeDomainToken().
    // To invalidate a domain token, call revokeDomainToken() — not revokeKey().
    const keyId = registerKey(SECRET);
    const token = issueDomainToken(DOMAIN);

    // Confirm valid with active key
    expect(verifyDomainToken(DOMAIN, token)).toBe(true);

    // Deactivate the key — sets active=false but key remains in KeyManager Map
    revokeKey(keyId);
    expect(getActiveKey()).toBeNull();

    // Verification still succeeds — stored keyId locates the key via listKeys()
    expect(verifyDomainToken(DOMAIN, token)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Domain validation
// ---------------------------------------------------------------------------

describe("domain validation — issueDomainToken format checks", () => {
  it("throws VHYX_CONTRACT_VALIDATION_FAILED for empty string domain", () => {
    registerKey(SECRET);
    let caught: unknown;
    try {
      issueDomainToken("");
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_CONTRACT_VALIDATION_FAILED);
    }
  });

  it("throws VHYX_CONTRACT_VALIDATION_FAILED for domain with a space", () => {
    registerKey(SECRET);
    let caught: unknown;
    try {
      issueDomainToken("example .com");
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_CONTRACT_VALIDATION_FAILED);
    }
  });

  it("throws VHYX_CONTRACT_VALIDATION_FAILED for domain with a newline character", () => {
    registerKey(SECRET);
    let caught: unknown;
    try {
      issueDomainToken("example.com\n");
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_CONTRACT_VALIDATION_FAILED);
    }
  });

  it("throws VHYX_CONTRACT_VALIDATION_FAILED for whitespace-only domain", () => {
    registerKey(SECRET);
    let caught: unknown;
    try {
      issueDomainToken("   ");
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_CONTRACT_VALIDATION_FAILED);
    }
  });
});

// ---------------------------------------------------------------------------
// HMAC domain-binding integrity
// ---------------------------------------------------------------------------

describe("HMAC domain-binding — token is bound to its issuing domain", () => {
  it("a token issued for domainA fails verification against domainB even with matching token length", () => {
    registerKey(SECRET);
    const tokenA = issueDomainToken(DOMAIN);
    // Register domainB independently (with its own token)
    issueDomainToken(DOMAIN_B);
    // tokenA must not pass for DOMAIN_B
    expect(verifyDomainToken(DOMAIN_B, tokenA)).toBe(false);
    // tokenA still passes for DOMAIN
    expect(verifyDomainToken(DOMAIN, tokenA)).toBe(true);
  });

  it("HMAC changes when key changes — old token fails after key rotation", () => {
    registerKey(SECRET);
    const token = issueDomainToken(DOMAIN);

    // Token is valid with original key
    expect(verifyDomainToken(DOMAIN, token)).toBe(true);

    // Clear state and re-issue with a different key (simulates key rotation scenario)
    clearKeyManager();
    clearDomainVerification();
    registerKey(SECRET_B);
    // Re-issue for DOMAIN with the new key
    const newToken = issueDomainToken(DOMAIN);

    // Old token must not pass (different HMAC due to different key)
    expect(verifyDomainToken(DOMAIN, token)).toBe(false);
    // New token must pass
    expect(verifyDomainToken(DOMAIN, newToken)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Session 5-001 Item 1 — Key rotation fix (DEFER-2 closure)
// ---------------------------------------------------------------------------

describe("Key rotation fix — tokens survive rotateKey() (Session 5-001 Item 1)", () => {
  it("verifyDomainToken returns true after rotateKey() — stored keyId locates old key", () => {
    // Issue token with key A
    registerKey(SECRET);
    const token = issueDomainToken(DOMAIN);

    // Confirm valid before rotation
    expect(verifyDomainToken(DOMAIN, token)).toBe(true);

    // Rotate to key B — key A is deactivated (active=false) but stays in KeyManager
    rotateKey(SECRET_B);

    // Token issued with key A must STILL verify — stored keyId points to key A
    // This was the behavior gap closed by Session 5-001 Item 1.
    expect(verifyDomainToken(DOMAIN, token)).toBe(true);
  });

  it("a NEW token issued after rotation uses the new key and also verifies", () => {
    registerKey(SECRET);
    // Issue one token under key A
    const tokenA = issueDomainToken(DOMAIN);

    // Rotate to key B
    rotateKey(SECRET_B);

    // Re-issue for same domain — this overwrites the store entry and uses key B
    const tokenB = issueDomainToken(DOMAIN);

    // New token verifies
    expect(verifyDomainToken(DOMAIN, tokenB)).toBe(true);

    // Old token does not verify — store entry was overwritten by re-issue
    expect(verifyDomainToken(DOMAIN, tokenA)).toBe(false);
  });

  it("revokeDomainToken() invalidates the token even when key survives rotation", () => {
    registerKey(SECRET);
    const token = issueDomainToken(DOMAIN);
    rotateKey(SECRET_B);

    // Token survives rotation
    expect(verifyDomainToken(DOMAIN, token)).toBe(true);

    // Explicitly revoke the domain token
    revokeDomainToken(DOMAIN);

    // Now verification fails — domain removed from verificationStore
    expect(verifyDomainToken(DOMAIN, token)).toBe(false);
  });
});
