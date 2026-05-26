/**
 * D2 stub-disclosure warning — isolated tests.
 *
 * Each vitest test file runs in its own worker, so the module-level `warned`
 * boolean in signing.ts starts as false here, independent of other test files.
 * This file contains no static import of signing.ts so the first dynamic import
 * is truly fresh.
 *
 * vi.isolateModules is not available in vitest 1.6.x; per-file isolation is
 * the correct substitute.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateManifest } from "../../src/manifest/generator.js";
import {
  clearRelationshipRegistry,
} from "../../src/registry/relationship-registry.js";
import {
  clearCapabilityRegistry,
} from "../../src/registry/capability-registry.js";
import { clearKeyManager } from "../../src/keys/key-manager.js";
import type { ManifestConfig } from "../../src/manifest/types.js";

const validConfig: ManifestConfig = {
  domain: "example.com",
  domainVerified: false,
  verificationToken: "",
};

beforeEach(() => {
  clearRelationshipRegistry();
  clearCapabilityRegistry();
  clearKeyManager();
});

describe("D2: stub disclosure warning — isolated (fresh module state per file)", () => {
  it("D2: warning fires exactly once on first signManifest call when no active key is configured", async () => {
    // This file has no static import of signing.ts.
    // The dynamic import below is the FIRST load of signing.ts in this worker.
    // warned=false, getActiveKey()===null → D2 condition met → fires once.
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      const { signManifest } = await import("../../src/versioning/signing.js");
      const manifest = generateManifest([], validConfig);
      // First call — fires
      signManifest(manifest, {
        algorithm: "hmac-sha256",
        keyHex: "a".repeat(64),
        domain: "example.com",
      });
      // Second call — warned=true, guard prevents re-fire
      signManifest(manifest, {
        algorithm: "hmac-sha256",
        keyHex: "a".repeat(64),
        domain: "example.com",
      });
      expect(warnSpy).toHaveBeenCalledTimes(1);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("D2: no warning fires when active key is registered before signManifest", async () => {
    // vi.resetModules() clears the module cache so signing.ts is fresh again
    // (warned=false) and key-manager.ts is also fresh (keys Map is empty).
    vi.resetModules();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      // Import key-manager first so its instance is cached before signing.ts loads.
      // signing.ts's import of keys/index.js will resolve to the same instance.
      const { registerKey } = await import("../../src/keys/key-manager.js");
      const { signManifest } = await import("../../src/versioning/signing.js");

      const secret = "b".repeat(64);
      registerKey(secret);
      // getActiveKey() now returns non-null → D2 condition is false → no warn
      const manifest = generateManifest([], validConfig);
      signManifest(manifest, {
        algorithm: "hmac-sha256",
        keyHex: secret,
        domain: "example.com",
      });
      signManifest(manifest, {
        algorithm: "hmac-sha256",
        keyHex: secret,
        domain: "example.com",
      });
      expect(warnSpy).toHaveBeenCalledTimes(0);
    } finally {
      warnSpy.mockRestore();
    }
  });
});
