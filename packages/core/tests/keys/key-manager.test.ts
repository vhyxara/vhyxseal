import { beforeEach, describe, expect, it } from "vitest";
import {
  clearKeyManager,
  getActiveKey,
  listKeys,
  registerKey,
  revokeKey,
  rotateKey,
} from "../../src/keys/key-manager.js";
import { VhyxSealError, ErrorCode } from "../../src/errors/index.js";

const SECRET_64 = "a".repeat(64);   // 64 hex chars = 32 bytes — minimum valid
const SECRET_64B = "b".repeat(64);
const SECRET_128 = "c".repeat(128); // 64 bytes — well above minimum

beforeEach(() => {
  clearKeyManager();
});

// ---------------------------------------------------------------------------
// registerKey
// ---------------------------------------------------------------------------

describe("registerKey", () => {
  it("happy path — returns a 32-character hex keyId", () => {
    const keyId = registerKey(SECRET_64);
    expect(keyId).toMatch(/^[0-9a-f]{32}$/);
  });

  it("keyId is unique on every call (crypto.randomBytes)", () => {
    const id1 = registerKey(SECRET_64);
    const id2 = registerKey(SECRET_64B);
    expect(id1).not.toBe(id2);
  });

  it("registered key appears in listKeys()", () => {
    const keyId = registerKey(SECRET_64);
    const all = listKeys();
    expect(all.some((r) => r.keyId === keyId)).toBe(true);
  });

  it("registered key is active by default", () => {
    const keyId = registerKey(SECRET_64);
    const all = listKeys();
    const rec = all.find((r) => r.keyId === keyId);
    expect(rec?.active).toBe(true);
  });

  it("registered key has algorithm hmac-sha256", () => {
    const keyId = registerKey(SECRET_64);
    const all = listKeys();
    const rec = all.find((r) => r.keyId === keyId);
    expect(rec?.algorithm).toBe("hmac-sha256");
  });

  it("registered key without ttlMs has expiresAt 0 (never expires)", () => {
    const keyId = registerKey(SECRET_64);
    const all = listKeys();
    const rec = all.find((r) => r.keyId === keyId);
    expect(rec?.expiresAt).toBe(0);
  });

  it("registered key with ttlMs=0 has expiresAt 0 (never expires)", () => {
    const keyId = registerKey(SECRET_64, 0);
    const all = listKeys();
    const rec = all.find((r) => r.keyId === keyId);
    expect(rec?.expiresAt).toBe(0);
  });

  it("registered key with ttlMs > 0 has expiresAt set correctly", () => {
    const before = Date.now();
    const keyId = registerKey(SECRET_64, 60000);
    const after = Date.now();
    const all = listKeys();
    const rec = all.find((r) => r.keyId === keyId);
    expect(rec?.expiresAt).toBeGreaterThanOrEqual(before + 60000);
    expect(rec?.expiresAt).toBeLessThanOrEqual(after + 60000);
  });

  it("rejects secret shorter than 64 hex characters", () => {
    let caught: unknown;
    try {
      registerKey("a".repeat(63));
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(VhyxSealError);
    if (caught instanceof VhyxSealError) {
      expect(caught.code).toBe(ErrorCode.VHYX_MANIFEST_SIGNING_FAILED);
    }
  });

  it("rejection error has severity 'error' and recoverable true", () => {
    let caught: unknown;
    try {
      registerKey("short");
    } catch (e) {
      caught = e;
    }
    if (caught instanceof VhyxSealError) {
      expect(caught.severity).toBe("error");
      expect(caught.recoverable).toBe(true);
    }
  });

  it("accepts secret exactly 64 hex chars (boundary case)", () => {
    expect(() => registerKey("a".repeat(64))).not.toThrow();
  });

  it("accepts secret longer than 64 hex chars", () => {
    expect(() => registerKey(SECRET_128)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// getActiveKey
// ---------------------------------------------------------------------------

describe("getActiveKey", () => {
  it("returns null when no keys are registered", () => {
    expect(getActiveKey()).toBeNull();
  });

  it("returns the registered key after registerKey()", () => {
    const keyId = registerKey(SECRET_64);
    const active = getActiveKey();
    expect(active).not.toBeNull();
    expect(active?.keyId).toBe(keyId);
  });

  it("returns most recently registered active key when multiple exist", () => {
    registerKey(SECRET_64);
    const secondId = registerKey(SECRET_64B);
    const active = getActiveKey();
    expect(active?.keyId).toBe(secondId);
  });

  it("returns null after the only key is revoked", () => {
    const keyId = registerKey(SECRET_64);
    revokeKey(keyId);
    expect(getActiveKey()).toBeNull();
  });

  it("returns a copy — mutating the result does not affect the store", () => {
    registerKey(SECRET_64);
    const active = getActiveKey();
    if (active !== null) {
      active.active = false;
    }
    expect(getActiveKey()?.active).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// rotateKey
// ---------------------------------------------------------------------------

describe("rotateKey", () => {
  it("returns a new keyId", () => {
    const oldId = registerKey(SECRET_64);
    const newId = rotateKey(SECRET_64B);
    expect(newId).not.toBe(oldId);
  });

  it("new key is the active key after rotation", () => {
    registerKey(SECRET_64);
    const newId = rotateKey(SECRET_64B);
    expect(getActiveKey()?.keyId).toBe(newId);
  });

  it("old key is deactivated after rotation", () => {
    const oldId = registerKey(SECRET_64);
    rotateKey(SECRET_64B);
    const all = listKeys();
    const old = all.find((r) => r.keyId === oldId);
    expect(old?.active).toBe(false);
  });

  it("old key is preserved in listKeys after rotation (audit trail)", () => {
    const oldId = registerKey(SECRET_64);
    rotateKey(SECRET_64B);
    const all = listKeys();
    expect(all.some((r) => r.keyId === oldId)).toBe(true);
  });

  it("rotateKey with no prior active key still registers new key", () => {
    const newId = rotateKey(SECRET_64);
    expect(getActiveKey()?.keyId).toBe(newId);
  });

  it("throws when new secret is too short", () => {
    registerKey(SECRET_64);
    expect(() => rotateKey("short")).toThrow(VhyxSealError);
  });
});

// ---------------------------------------------------------------------------
// revokeKey
// ---------------------------------------------------------------------------

describe("revokeKey", () => {
  it("marks the key inactive", () => {
    const keyId = registerKey(SECRET_64);
    revokeKey(keyId);
    const all = listKeys();
    const rec = all.find((r) => r.keyId === keyId);
    expect(rec?.active).toBe(false);
  });

  it("preserves the key record in listKeys (audit trail)", () => {
    const keyId = registerKey(SECRET_64);
    revokeKey(keyId);
    const all = listKeys();
    expect(all.some((r) => r.keyId === keyId)).toBe(true);
  });

  it("does not throw when revoking a nonexistent keyId", () => {
    expect(() => revokeKey("nonexistent-key-id")).not.toThrow();
  });

  it("does not affect other keys when one is revoked", () => {
    const id1 = registerKey(SECRET_64);
    const id2 = registerKey(SECRET_64B);
    revokeKey(id1);
    expect(getActiveKey()?.keyId).toBe(id2);
  });
});

// ---------------------------------------------------------------------------
// listKeys
// ---------------------------------------------------------------------------

describe("listKeys", () => {
  it("returns empty array when no keys registered", () => {
    expect(listKeys()).toEqual([]);
  });

  it("returns all keys including inactive", () => {
    const id1 = registerKey(SECRET_64);
    const id2 = registerKey(SECRET_64B);
    revokeKey(id1);
    const all = listKeys();
    expect(all.length).toBe(2);
    expect(all.some((r) => r.keyId === id1)).toBe(true);
    expect(all.some((r) => r.keyId === id2)).toBe(true);
  });

  it("returned records are copies — mutating does not affect store", () => {
    registerKey(SECRET_64);
    const all = listKeys();
    if (all[0] !== undefined) {
      all[0].active = false;
    }
    expect(getActiveKey()).not.toBeNull();
  });
});
