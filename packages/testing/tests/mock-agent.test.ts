import { beforeEach, describe, it, expect } from "vitest";
import { defineContract, generateManifest, clearRelationshipRegistry, clearCapabilityRegistry } from "@vhyxseal/core";
import { mockAgentSession } from "../src/mock-agent.js";

beforeEach(() => {
  clearRelationshipRegistry();
  clearCapabilityRegistry();
});

const baseContract = {
  type: "action" as const,
  intent: "submit-form",
  description: "Test button",
  requires: [],
  requiredPermissions: [],
  consequence: "Submits the form",
  affects: [],
  reversible: false,
  safetyLevel: "low" as const,
  requiresConfirmation: false,
  destructive: false,
  contractVersion: "1.0.0",
};

const testManifestConfig = {
  domain: "example.com",
  domainVerified: false,
  verificationToken: "",
} as const;

describe("mockAgentSession", () => {
  it("returns a session object", () => {
    const session = mockAgentSession();
    expect(typeof session.navigate).toBe("function");
    expect(typeof session.act).toBe("function");
    expect(typeof session.read).toBe("function");
    expect(typeof session.getActions).toBe("function");
    expect(typeof session.hadUnsafeActions).toBe("function");
    expect(typeof session.reset).toBe("function");
  });

  it("navigate records action with type 'navigate'", () => {
    const session = mockAgentSession();
    session.navigate("my-component");
    const actions = session.getActions();
    expect(actions).toHaveLength(1);
    expect(actions[0]?.type).toBe("navigate");
    expect(actions[0]?.target).toBe("my-component");
  });

  it("act records action with type 'act'", () => {
    const session = mockAgentSession();
    session.act("my-component");
    const actions = session.getActions();
    expect(actions).toHaveLength(1);
    expect(actions[0]?.type).toBe("act");
    expect(actions[0]?.target).toBe("my-component");
  });

  it("read records action with type 'read'", () => {
    const session = mockAgentSession();
    session.read("my-component");
    const actions = session.getActions();
    expect(actions).toHaveLength(1);
    expect(actions[0]?.type).toBe("read");
    expect(actions[0]?.target).toBe("my-component");
  });

  it("getActions returns all recorded actions in order", () => {
    const session = mockAgentSession();
    session.navigate("a");
    session.act("b");
    session.read("c");
    const actions = session.getActions();
    expect(actions).toHaveLength(3);
    expect(actions[0]?.type).toBe("navigate");
    expect(actions[1]?.type).toBe("act");
    expect(actions[2]?.type).toBe("read");
  });

  it("getActions returns newest actions last (insertion order)", () => {
    const session = mockAgentSession();
    session.navigate("first");
    session.navigate("second");
    const actions = session.getActions();
    expect(actions[0]?.target).toBe("first");
    expect(actions[1]?.target).toBe("second");
  });

  it("hadUnsafeActions returns false initially", () => {
    const session = mockAgentSession();
    expect(session.hadUnsafeActions()).toBe(false);
  });

  it("hadUnsafeActions returns true after acting on critical contract without requiresConfirmation", () => {
    const criticalContract = defineContract({
      ...baseContract,
      id: "mock-critical-btn",
      safetyLevel: "critical",
      requiresConfirmation: false,
    });
    const manifest = generateManifest([criticalContract], testManifestConfig);
    const session = mockAgentSession(manifest);
    session.act("mock-critical-btn");
    expect(session.hadUnsafeActions()).toBe(true);
  });

  it("reset clears actions and resets unsafe flag", () => {
    const session = mockAgentSession();
    session.navigate("a");
    session.act("b");
    expect(session.getActions()).toHaveLength(2);
    session.reset();
    expect(session.getActions()).toHaveLength(0);
    expect(session.hadUnsafeActions()).toBe(false);
  });

  it("method chaining works: navigate().act().read()", () => {
    const session = mockAgentSession();
    session.navigate("a").act("b").read("c");
    expect(session.getActions()).toHaveLength(3);
  });

  it("read returns the contract when manifest provided and id found", () => {
    const contract = defineContract({ ...baseContract, id: "mock-read-btn" });
    const manifest = generateManifest([contract], testManifestConfig);
    const session = mockAgentSession(manifest);
    const result = session.read("mock-read-btn");
    expect(result).toBeDefined();
    expect((result as typeof contract).id).toBe("mock-read-btn");
  });

  it("read returns null for unknown component id", () => {
    const session = mockAgentSession();
    const result = session.read("does-not-exist");
    expect(result).toBeNull();
  });
});
