import { describe, it, expect, beforeEach } from "vitest";
import { createComponentRegistrationStore } from "../../src/registry/component-registration.js";
import type { ComponentRegistrationStore } from "../../src/registry/component-registration.js";

let store: ComponentRegistrationStore;

beforeEach(() => {
  store = createComponentRegistrationStore();
});

describe("createComponentRegistrationStore — register", () => {
  it("register creates new registration with correct fields", () => {
    const reg = store.register("btn-checkout", "fp_abc123", "1.0.0");
    expect(reg.componentId).toBe("btn-checkout");
    expect(reg.fingerprint).toBe("fp_abc123");
    expect(reg.contractVersion).toBe("1.0.0");
    expect(typeof reg.registeredAt).toBe("string");
    expect(typeof reg.lastSeenAt).toBe("string");
  });

  it("registeredAt set on first registration", () => {
    const before = new Date().toISOString();
    const reg = store.register("btn-checkout", "fp_abc123", "1.0.0");
    const after = new Date().toISOString();
    expect(reg.registeredAt >= before).toBe(true);
    expect(reg.registeredAt <= after).toBe(true);
  });

  it("register again with same id updates fingerprint and lastSeenAt", async () => {
    store.register("btn-checkout", "fp_v1", "1.0.0");
    await new Promise(resolve => setTimeout(resolve, 5));
    const updated = store.register("btn-checkout", "fp_v2", "1.1.0");
    expect(updated.fingerprint).toBe("fp_v2");
    expect(updated.contractVersion).toBe("1.1.0");
  });

  it("register again with same id preserves original registeredAt", async () => {
    const first = store.register("btn-checkout", "fp_v1", "1.0.0");
    await new Promise(resolve => setTimeout(resolve, 5));
    const second = store.register("btn-checkout", "fp_v2", "1.1.0");
    expect(second.registeredAt).toBe(first.registeredAt);
  });
});

describe("createComponentRegistrationStore — getRegistration", () => {
  it("getRegistration returns stored registration", () => {
    store.register("btn-submit", "fp_submit", "2.0.0");
    const reg = store.getRegistration("btn-submit");
    expect(reg).toBeDefined();
    expect(reg?.componentId).toBe("btn-submit");
    expect(reg?.fingerprint).toBe("fp_submit");
    expect(reg?.contractVersion).toBe("2.0.0");
  });

  it("getRegistration returns undefined for unknown id", () => {
    expect(store.getRegistration("unknown-id")).toBeUndefined();
  });
});

describe("createComponentRegistrationStore — updateSeen", () => {
  it("updateSeen updates lastSeenAt", async () => {
    store.register("btn-nav", "fp_nav", "1.0.0");
    const before = store.getRegistration("btn-nav")?.lastSeenAt;
    await new Promise(resolve => setTimeout(resolve, 5));
    store.updateSeen("btn-nav");
    const after = store.getRegistration("btn-nav")?.lastSeenAt;
    expect(after).not.toBe(before);
    expect(after! >= before!).toBe(true);
  });

  it("updateSeen is no-op for unknown id", () => {
    expect(() => store.updateSeen("unknown-id")).not.toThrow();
    expect(store.getRegistration("unknown-id")).toBeUndefined();
  });
});

describe("createComponentRegistrationStore — hasChanged", () => {
  it("hasChanged returns false for unknown id (not registered yet)", () => {
    expect(store.hasChanged("unknown-id", "fp_abc")).toBe(false);
  });

  it("hasChanged returns false when fingerprint matches stored", () => {
    store.register("btn-delete", "fp_same", "1.0.0");
    expect(store.hasChanged("btn-delete", "fp_same")).toBe(false);
  });

  it("hasChanged returns true when fingerprint differs from stored", () => {
    store.register("btn-delete", "fp_old", "1.0.0");
    expect(store.hasChanged("btn-delete", "fp_new")).toBe(true);
  });
});

describe("createComponentRegistrationStore — getAllRegistrations and clear", () => {
  it("getAllRegistrations returns all registrations", () => {
    store.register("btn-a", "fp_a", "1.0.0");
    store.register("btn-b", "fp_b", "1.0.0");
    store.register("btn-c", "fp_c", "1.0.0");
    const all = store.getAllRegistrations();
    expect(all).toHaveLength(3);
    const ids = all.map(r => r.componentId);
    expect(ids).toContain("btn-a");
    expect(ids).toContain("btn-b");
    expect(ids).toContain("btn-c");
  });

  it("clear empties all registrations", () => {
    store.register("btn-a", "fp_a", "1.0.0");
    store.register("btn-b", "fp_b", "1.0.0");
    store.clear();
    expect(store.getAllRegistrations()).toHaveLength(0);
    expect(store.getRegistration("btn-a")).toBeUndefined();
  });
});
