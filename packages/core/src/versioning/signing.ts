/**
 * Manifest signing and verification for VhyxSeal.
 *
 * STUB IMPLEMENTATION — See the JSDoc on signManifest and verifyManifest for
 * full details. The interface is final. The cryptographic implementation will
 * be completed in @vhyxseal/nextjs where the build-time signing context exists.
 */

import type { VhyxSealManifest } from "../manifest/types.js";
import { VhyxSealError, ErrorCode } from "../errors/index.js";
import { generateFingerprint } from "../manifest/generator.js";
import { getActiveKey } from "../keys/index.js";

// DECISION-D2: fires once per cold start when signing is called without a
// real key configured, so stub status is impossible to miss for active devs.
let _d2Warned = false;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A signing key bound to a specific domain.
 *
 * The `algorithm` field is reserved for future use — currently always
 * `"hmac-sha256"`. `keyHex` holds the key material as a hex string.
 * Both the signing and verification operations use the same key (symmetric).
 */
export interface SigningKey {
  /** Algorithm identifier — reserved, currently always "hmac-sha256". */
  algorithm: "hmac-sha256";
  /** The key material as a hex string. */
  keyHex: string;
  /** The domain this key is bound to. Must match the manifest domain. */
  domain: string;
}

/** The result of a successful manifest signing operation. */
export interface SigningResult {
  /** The computed signature string. */
  signature: string;
  /** ISO datetime when signing occurred. */
  signedAt: string;
  /** The algorithm used for signing. */
  algorithm: string;
}

/** The result of a manifest verification attempt. */
export interface VerificationResult {
  /** Whether the signature is valid for this manifest. */
  valid: boolean;
  /**
   * Human readable explanation when the signature is not valid.
   * Absent when `valid` is true.
   */
  reason?: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Signs a manifest with the provided key, returning a SigningResult.
 *
 * **STUB IMPLEMENTATION.** The signature is a content fingerprint prefixed
 * with `"stub_sig_"` — it is NOT a real cryptographic signature. This stub
 * satisfies the interface contract and makes the manifest pipeline functional
 * end-to-end, but provides no actual security.
 *
 * Full cryptographic signing using the Web Crypto API (`globalThis.crypto.subtle`)
 * will be implemented in `@vhyxseal/nextjs` where the build-time signing context
 * is available. This module defines the interface; that module provides the
 * implementation.
 *
 * @param manifest - The manifest to sign.
 * @param key - The signing key — must be bound to the same domain as the manifest.
 * @returns A SigningResult with a stub signature and the current timestamp.
 * @throws {VhyxSealError} VHYX_DOMAIN_MISMATCH (severity "fatal", recoverable false)
 *   when the key's domain does not match the manifest's domain.
 * @example
 * const result = signManifest(manifest, { algorithm: "hmac-sha256", keyHex: "abc123", domain: "example.com" });
 * result.signature // "stub_sig_..."
 */
export function signManifest(
  manifest: Readonly<VhyxSealManifest>,
  key: SigningKey,
): SigningResult {
  if (key.domain !== manifest.domain) {
    throw new VhyxSealError({
      code: ErrorCode.VHYX_DOMAIN_MISMATCH,
      message: `Signing key domain "${key.domain}" does not match manifest domain "${manifest.domain}"`,
      context: { keyDomain: key.domain, manifestDomain: manifest.domain },
      severity: "fatal",
      recoverable: false,
      suggestion:
        "Use a signing key that is bound to the same domain as the manifest being signed.",
    });
  }

  // DECISION-D2: warn once per cold start when no real key is registered
  if (!_d2Warned && getActiveKey() === null) {
    _d2Warned = true;
    console.warn(
      "[VhyxSeal] STUB: signManifest is using a stub implementation. " +
        "No active signing key is registered. " +
        "Manifests are NOT cryptographically signed. " +
        "See DECISION-D2 and README security status.",
    );
  }

  return {
    signature: `stub_sig_${generateFingerprint(JSON.stringify(manifest))}`,
    signedAt: new Date().toISOString(),
    algorithm: key.algorithm,
  };
}

/**
 * Verifies whether a signature is valid for the given manifest and key.
 *
 * **STUB IMPLEMENTATION.** Verification checks only that the signature starts
 * with `"stub_sig_"` — it does NOT perform real cryptographic verification.
 * A domain mismatch causes the function to return `{ valid: false }` rather
 * than throw, since verification is a read operation that should degrade
 * gracefully.
 *
 * Full cryptographic verification will be implemented in `@vhyxseal/nextjs`
 * alongside the real signing implementation.
 *
 * @param manifest - The manifest to verify.
 * @param signature - The signature string to check.
 * @param key - The key to verify against — must be bound to the manifest's domain.
 * @returns A VerificationResult. Never throws.
 * @example
 * verifyManifest(manifest, "stub_sig_abc123", key) // { valid: true }
 * verifyManifest(manifest, "real_sig_...", key)     // { valid: false, reason: "..." }
 */
export function verifyManifest(
  manifest: Readonly<VhyxSealManifest>,
  signature: string,
  key: SigningKey,
): VerificationResult {
  if (key.domain !== manifest.domain) {
    return {
      valid: false,
      reason: "Domain mismatch",
    };
  }

  if (signature.startsWith("stub_sig_")) {
    return { valid: true };
  }

  return {
    valid: false,
    reason: "Signature format not recognized by stub implementation",
  };
}
