/**
 * Manifest signing and verification for VhyxSeal.
 *
 * Real HMAC-SHA256 signing over a canonical JSON serialisation of the
 * manifest (DECISION-029 replaces the D2 stub). Pure TypeScript, synchronous,
 * zero dependencies — identical output in Node, browsers, and edge runtimes.
 *
 * Signature format: `hmac-sha256:<64 hex chars>`.
 * Signed payload: the manifest with `signature` and `signedAt` removed,
 * serialised with recursively sorted object keys.
 *
 * Known limitation (documented, see SECURITY.md): HMAC is symmetric. Anyone
 * who can verify can also sign, so a shared key proves integrity between
 * parties that already trust each other (your server ↔ your agent gateway).
 * Public-key signatures for third-party agents are tracked for v2.
 */

import type { VhyxSealManifest } from "../manifest/types.js";
import { VhyxSealError, ErrorCode } from "../errors/index.js";
import { getActiveKey } from "../keys/index.js";
import { hmacSha256Hex, constantTimeEqual } from "../crypto/index.js";

/** Prefix of every signature produced by this module. */
export const SIGNATURE_PREFIX = "hmac-sha256:";

/** Minimum key length in hex characters (32 bytes). */
const MIN_KEY_HEX_LENGTH = 64;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A signing key bound to a specific domain.
 * `keyHex` holds at least 32 bytes of key material as hex.
 * Both the signing and verification operations use the same key (symmetric).
 */
export interface SigningKey {
  /** Algorithm identifier — currently always "hmac-sha256". */
  algorithm: "hmac-sha256";
  /** The key material as a hex string (minimum 64 hex characters). */
  keyHex: string;
  /** The domain this key is bound to. Must match the manifest domain. */
  domain: string;
}

/** The result of a successful manifest signing operation. */
export interface SigningResult {
  /** The computed signature string, `hmac-sha256:<hex>`. */
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
// Canonical serialisation
// ---------------------------------------------------------------------------

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      const child = source[key];
      if (child !== undefined) sorted[key] = canonicalize(child);
    }
    return sorted;
  }
  return value;
}

/**
 * Returns the exact string that is signed for a manifest: the manifest minus
 * `signature`/`signedAt`, with object keys sorted recursively.
 * @param manifest - The manifest to serialise.
 * @returns Deterministic JSON string.
 * @example
 * canonicalManifestPayload(manifest) // '{"agentPolicy":{...},...}'
 */
export function canonicalManifestPayload(manifest: Readonly<VhyxSealManifest>): string {
  const { signature: _signature, signedAt: _signedAt, ...rest } = manifest;
  return JSON.stringify(canonicalize(rest));
}

function assertStrongKey(key: SigningKey): void {
  if (key.keyHex.length < MIN_KEY_HEX_LENGTH || /[^0-9a-fA-F]/.test(key.keyHex)) {
    throw new VhyxSealError({
      code: ErrorCode.VHYX_MANIFEST_SIGNING_FAILED,
      message: `Signing key must be at least ${MIN_KEY_HEX_LENGTH} hex characters (32 bytes).`,
      context: { receivedLength: key.keyHex.length, requiredLength: MIN_KEY_HEX_LENGTH },
      severity: "error",
      recoverable: true,
      suggestion: "Generate one with `vhyxseal keygen` or randomHex(32) and keep it server-side.",
    });
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Signs a manifest with HMAC-SHA256 and returns the signature.
 *
 * @param manifest - The manifest to sign.
 * @param key - The signing key — must be bound to the same domain as the manifest.
 * @returns A SigningResult containing `hmac-sha256:<hex>` and the signing time.
 * @throws {VhyxSealError} VHYX_DOMAIN_MISMATCH (fatal) when key and manifest domains differ.
 * @throws {VhyxSealError} VHYX_MANIFEST_SIGNING_FAILED when the key is shorter than 32 bytes.
 * @example
 * const result = signManifest(manifest, { algorithm: "hmac-sha256", keyHex: secret, domain: "example.com" });
 * result.signature // "hmac-sha256:9f2c..."
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
  assertStrongKey(key);

  const mac = hmacSha256Hex(key.keyHex, canonicalManifestPayload(manifest));
  return {
    signature: `${SIGNATURE_PREFIX}${mac}`,
    signedAt: new Date().toISOString(),
    algorithm: key.algorithm,
  };
}

/**
 * Returns a copy of the manifest with `signature` and `signedAt` filled in.
 * When `key` is omitted, the active key from the KeyManager is used.
 *
 * @param manifest - The manifest to sign.
 * @param key - Optional explicit key; defaults to the active KeyManager key bound to the manifest domain.
 * @returns A new, signed manifest object.
 * @throws {VhyxSealError} VHYX_MANIFEST_SIGNING_FAILED when no key is available.
 * @example
 * registerKey(process.env.VHYXSEAL_SECRET);
 * const signed = attachSignature(generateManifest(contracts, config));
 */
export function attachSignature(
  manifest: Readonly<VhyxSealManifest>,
  key?: SigningKey,
): VhyxSealManifest {
  let resolved = key;
  if (resolved === undefined) {
    const active = getActiveKey();
    if (active === null) {
      throw new VhyxSealError({
        code: ErrorCode.VHYX_MANIFEST_SIGNING_FAILED,
        message: "attachSignature: no key passed and no active key registered",
        context: {},
        severity: "error",
        recoverable: true,
        suggestion: "Call registerKey(secret) at startup or pass a SigningKey explicitly.",
      });
    }
    resolved = { algorithm: "hmac-sha256", keyHex: active.secret, domain: manifest.domain };
  }
  const result = signManifest(manifest, resolved);
  return { ...manifest, signature: result.signature, signedAt: result.signedAt };
}

/**
 * Verifies an HMAC-SHA256 manifest signature in constant time.
 *
 * @param manifest - The manifest to verify.
 * @param signature - The signature string to check (`hmac-sha256:<hex>`).
 * @param key - The key to verify against — must be bound to the manifest's domain.
 * @returns A VerificationResult. Never throws.
 * @example
 * verifyManifest(manifest, manifest.signature, key) // { valid: true }
 */
export function verifyManifest(
  manifest: Readonly<VhyxSealManifest>,
  signature: string,
  key: SigningKey,
): VerificationResult {
  if (key.domain !== manifest.domain) {
    return { valid: false, reason: "Domain mismatch" };
  }
  if (signature.startsWith("stub_sig_")) {
    return {
      valid: false,
      reason: "Legacy stub signatures are no longer accepted — re-sign with hmac-sha256",
    };
  }
  if (!signature.startsWith(SIGNATURE_PREFIX)) {
    return { valid: false, reason: "Unrecognised signature format" };
  }
  try {
    assertStrongKey(key);
    const expected = hmacSha256Hex(key.keyHex, canonicalManifestPayload(manifest));
    const received = signature.slice(SIGNATURE_PREFIX.length).toLowerCase();
    return constantTimeEqual(expected, received)
      ? { valid: true }
      : { valid: false, reason: "Signature does not match manifest content" };
  } catch {
    return { valid: false, reason: "Invalid verification key" };
  }
}
