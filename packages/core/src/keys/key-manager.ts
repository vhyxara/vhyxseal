import { randomBytes } from "crypto";
import { VhyxSealError, ErrorCode } from "../errors/index.js";
import { logAudit } from "../audit/index.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A signing key record managed by KeyManager.
 * `expiresAt` of 0 means the key never expires.
 */
export interface SigningKeyRecord {
  keyId: string;
  secret: string;           // hex string, minimum 32 bytes (64 hex chars)
  algorithm: "hmac-sha256";
  createdAt: number;        // Unix ms
  expiresAt: number;        // Unix ms; 0 = never expires
  active: boolean;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const keys = new Map<string, SigningKeyRecord>();

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isExpired(record: SigningKeyRecord): boolean {
  return record.expiresAt !== 0 && record.expiresAt < Date.now();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Registers a new signing key and returns its generated key ID.
 *
 * @param secret - The key material as a hex string. Must be at least 64 hex
 *   characters (32 bytes) to meet HMAC-SHA256 security requirements.
 * @param ttlMs - Optional time-to-live in milliseconds. Omit or pass 0 for a
 *   key that never expires.
 * @returns The generated keyId (32 hex characters from crypto.randomBytes(16)).
 * @throws {VhyxSealError} VHYX_MANIFEST_SIGNING_FAILED when secret is shorter
 *   than 64 hex characters.
 * @example
 * const keyId = registerKey("a".repeat(64));
 */
export function registerKey(secret: string, ttlMs?: number): string {
  if (secret.length < 64) {
    throw new VhyxSealError({
      code: ErrorCode.VHYX_MANIFEST_SIGNING_FAILED,
      message: `Signing key secret must be at least 64 hex characters (32 bytes). Received ${secret.length} characters.`,
      context: { receivedLength: secret.length, requiredLength: 64 },
      severity: "error",
      recoverable: true,
      suggestion:
        "Generate a secure secret with at least 32 random bytes and encode it as a hex string (64 characters minimum).",
    });
  }

  const keyId = randomBytes(16).toString("hex");
  const now = Date.now();
  const expiresAt =
    ttlMs !== undefined && ttlMs > 0 ? now + ttlMs : 0;

  keys.set(keyId, {
    keyId,
    secret,
    algorithm: "hmac-sha256",
    createdAt: now,
    expiresAt,
    active: true,
  });

  return keyId;
}

/**
 * Returns the most recently registered active key, or null if none exists.
 *
 * A key is considered active when its `active` flag is true and it has not
 * expired (or has `expiresAt` of 0).
 *
 * @returns The most recently registered active SigningKeyRecord, or null.
 * @example
 * const key = getActiveKey();
 * if (key !== null) { // use key.secret }
 */
export function getActiveKey(): SigningKeyRecord | null {
  const now = Date.now();
  let latest: SigningKeyRecord | null = null;

  for (const record of keys.values()) {
    if (!record.active) continue;
    if (record.expiresAt !== 0 && record.expiresAt < now) continue;
    // >= so that equal timestamps use Map insertion order as tiebreaker
    if (latest === null || record.createdAt >= latest.createdAt) {
      latest = record;
    }
  }

  return latest !== null ? { ...latest } : null;
}

/**
 * Deactivates the current active key and registers a new one.
 *
 * @param newSecret - The new key material as a hex string (min 64 hex chars).
 * @param ttlMs - Optional TTL for the new key in milliseconds. 0 = never expires.
 * @returns The keyId of the newly registered key.
 * @throws {VhyxSealError} VHYX_MANIFEST_SIGNING_FAILED when newSecret is too short.
 * @example
 * const newKeyId = rotateKey("b".repeat(64));
 */
export function rotateKey(newSecret: string, ttlMs?: number): string {
  const current = getActiveKey();
  if (current !== null) {
    const rec = keys.get(current.keyId);
    if (rec !== undefined) {
      rec.active = false;
    }
  }
  const newKeyId = registerKey(newSecret, ttlMs);
  logAudit({
    action: "key_rotated",
    componentId: null,
    domain: null,
    result: "success",
  });
  return newKeyId;
}

/**
 * Marks a key as inactive without deleting it, preserving the audit trail.
 *
 * No error is thrown if the keyId does not exist.
 *
 * @param keyId - The keyId to revoke.
 * @example
 * revokeKey("a1b2c3d4...");
 */
export function revokeKey(keyId: string): void {
  const rec = keys.get(keyId);
  if (rec !== undefined) {
    rec.active = false;
  }
}

/**
 * Returns all registered keys, both active and inactive.
 *
 * Each returned record is a shallow copy — mutations do not affect the store.
 *
 * @returns Array of all SigningKeyRecord entries.
 * @example
 * const all = listKeys();
 */
export function listKeys(): SigningKeyRecord[] {
  return Array.from(keys.values()).map((r) => ({ ...r }));
}

/**
 * Clears all keys from the in-memory store.
 * For test use only. Do not call in production.
 */
export function clearKeyManager(): void {
  keys.clear();
}
