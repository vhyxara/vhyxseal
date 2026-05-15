import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { SealProvider, useSealContext } from "../../src/provider/index.js";
import { useContract } from "../../src/hooks/index.js";
import {
  defineContract,
  clearRelationshipRegistry,
  clearCapabilityRegistry,
} from "@vhyxseal/core";
import type { ManifestConfig } from "@vhyxseal/core";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validConfig: ManifestConfig = {
  domain: "test.com",
  domainVerified: false,
  verificationToken: "",
};

function makeContract(id: string, intent = "search") {
  return defineContract({
    id,
    type: "action",
    intent,
    description: "A test component",
    requires: [],
    requiredPermissions: [],
    consequence: "Performs a test action",
    affects: ["test"],
    contractVersion: "1.0.0",
  });
}

// ---------------------------------------------------------------------------
// Test isolation
// ---------------------------------------------------------------------------

beforeEach(() => {
  clearRelationshipRegistry();
  clearCapabilityRegistry();
});

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <SealProvider config={validConfig} dev={false}>
      {children}
    </SealProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useContract", () => {
  it("returns undefined when id is not registered", () => {
    const { result } = renderHook(() => useContract("nonexistent-id"), {
      wrapper,
    });
    expect(result.current).toBeUndefined();
  });

  it("returns the contract when it is registered", async () => {
    const contract = makeContract("uc-register-btn");

    const { result } = renderHook(
      () => ({
        ctx: useSealContext(),
        found: useContract("uc-register-btn"),
      }),
      { wrapper },
    );

    await act(async () => {
      result.current.ctx.registerContract(contract);
    });

    expect(result.current.found).toBeDefined();
    expect(result.current.found?.id).toBe("uc-register-btn");
  });

  it("updates when a contract with the same id is re-registered", async () => {
    const v1 = makeContract("uc-update-btn", "search");
    const v2 = makeContract("uc-update-btn", "navigate");

    const { result } = renderHook(
      () => ({
        ctx: useSealContext(),
        found: useContract("uc-update-btn"),
      }),
      { wrapper },
    );

    await act(async () => {
      result.current.ctx.registerContract(v1);
    });
    expect(result.current.found?.intent).toBe("search");

    await act(async () => {
      result.current.ctx.registerContract(v2);
    });
    expect(result.current.found?.intent).toBe("navigate");
  });

  it("throws when used outside a SealProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useContract("any-id"))).toThrow();
    spy.mockRestore();
  });
});
