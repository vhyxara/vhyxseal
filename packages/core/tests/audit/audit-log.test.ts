import { describe, it, expect, beforeEach } from "vitest";
import {
  logAudit,
  getAuditLog,
  clearAuditLog,
} from "../../src/audit/audit-log.js";

beforeEach(() => {
  clearAuditLog();
});

describe("logAudit — basic entry recording", () => {
  it("records an entry with the correct action", () => {
    logAudit({ action: "token_issued", componentId: "btn-1", domain: null, result: "success" });
    const log = getAuditLog();
    expect(log).toHaveLength(1);
    expect(log[0]?.action).toBe("token_issued");
  });

  it("records componentId and domain correctly", () => {
    logAudit({ action: "domain_verified", componentId: null, domain: "example.com", result: "success" });
    const entry = getAuditLog()[0];
    expect(entry?.componentId).toBeNull();
    expect(entry?.domain).toBe("example.com");
  });

  it("records result field correctly", () => {
    logAudit({ action: "token_expired", componentId: "btn-2", domain: null, result: "failure" });
    const entry = getAuditLog()[0];
    expect(entry?.result).toBe("failure");
  });

  it("adds an ISO timestamp automatically", () => {
    const before = Date.now();
    logAudit({ action: "key_rotated", componentId: null, domain: null, result: "success" });
    const after = Date.now();
    const entry = getAuditLog()[0];
    expect(entry?.timestamp).toBeTruthy();
    const ts = new Date(entry?.timestamp ?? "").getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it("timestamp is a valid ISO string", () => {
    logAudit({ action: "manifest_generated", componentId: null, domain: null, result: "success" });
    const entry = getAuditLog()[0];
    expect(() => new Date(entry?.timestamp ?? "").toISOString()).not.toThrow();
    expect(new Date(entry?.timestamp ?? "").toISOString()).toBe(entry?.timestamp);
  });
});

describe("logAudit — multiple entries and ordering", () => {
  it("records multiple entries in insertion order", () => {
    logAudit({ action: "token_issued", componentId: "a", domain: null, result: "success" });
    logAudit({ action: "token_verified", componentId: "b", domain: null, result: "success" });
    logAudit({ action: "token_expired", componentId: "c", domain: null, result: "failure" });
    const log = getAuditLog();
    expect(log).toHaveLength(3);
    expect(log[0]?.action).toBe("token_issued");
    expect(log[1]?.action).toBe("token_verified");
    expect(log[2]?.action).toBe("token_expired");
  });

  it("records all supported action types without error", () => {
    const actions = [
      "token_issued",
      "token_verified",
      "token_expired",
      "domain_registered",
      "domain_verified",
      "key_rotated",
      "manifest_generated",
    ] as const;
    actions.forEach((action) => {
      logAudit({ action, componentId: null, domain: null, result: "success" });
    });
    expect(getAuditLog()).toHaveLength(actions.length);
  });
});

describe("logAudit — circular buffer at MAX_ENTRIES (50)", () => {
  it("does not exceed 50 entries when 51 are logged", () => {
    for (let i = 0; i < 51; i++) {
      logAudit({ action: "token_issued", componentId: `c-${i}`, domain: null, result: "success" });
    }
    expect(getAuditLog()).toHaveLength(50);
  });

  it("evicts the oldest entry when capacity is exceeded", () => {
    for (let i = 0; i < 50; i++) {
      logAudit({ action: "token_issued", componentId: `old-${i}`, domain: null, result: "success" });
    }
    logAudit({ action: "key_rotated", componentId: "new-entry", domain: null, result: "success" });
    const log = getAuditLog();
    expect(log).toHaveLength(50);
    // First entry is now the second-oldest — "old-0" is gone
    expect(log[0]?.componentId).toBe("old-1");
    // Last entry is the newest
    expect(log[49]?.componentId).toBe("new-entry");
  });

  it("maintains exactly 50 entries after many overwrites", () => {
    for (let i = 0; i < 200; i++) {
      logAudit({ action: "token_issued", componentId: `c-${i}`, domain: null, result: "success" });
    }
    expect(getAuditLog()).toHaveLength(50);
    // Most recent 50 are kept
    const log = getAuditLog();
    expect(log[0]?.componentId).toBe("c-150");
    expect(log[49]?.componentId).toBe("c-199");
  });
});

describe("getAuditLog — immutability", () => {
  it("returns a copy — mutations do not affect the store", () => {
    logAudit({ action: "token_issued", componentId: "x", domain: null, result: "success" });
    const log = getAuditLog() as unknown as Array<{ action: string }>;
    // Mutate the returned array
    (log as unknown[]).push({ action: "injected", componentId: null, domain: null, result: "failure", timestamp: "" });
    // Store should be unaffected
    expect(getAuditLog()).toHaveLength(1);
  });
});

describe("clearAuditLog — test utility", () => {
  it("removes all entries", () => {
    logAudit({ action: "token_issued", componentId: null, domain: null, result: "success" });
    logAudit({ action: "key_rotated", componentId: null, domain: null, result: "success" });
    clearAuditLog();
    expect(getAuditLog()).toHaveLength(0);
  });

  it("allows fresh entries after clear", () => {
    logAudit({ action: "token_issued", componentId: null, domain: null, result: "success" });
    clearAuditLog();
    logAudit({ action: "domain_verified", componentId: null, domain: "example.com", result: "success" });
    const log = getAuditLog();
    expect(log).toHaveLength(1);
    expect(log[0]?.action).toBe("domain_verified");
  });
});
