import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { SealProvider, useSealContext } from "../../src/provider/index.js";
import { useCapability } from "../../src/hooks/index.js";
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

function makeContract(
  id: string,
  type: "action" | "input" | "navigation" | "display" | "confirmation" = "action",
  safetyLevel: "low" | "medium" | "high" | "critical" | "sensitive" = "low",
) {
  return defineContract({
    id,
    type,
    intent: "search",
    description: "A test component",
    requires: [],
    requiredPermissions: [],
    consequence: "Test",
    affects: ["test"],
    contractVersion: "1.0.0",
    safetyLevel,
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

describe("useCapability — empty state", () => {
  it("returns zero contractCount when no contracts registered", () => {
    const { result } = renderHook(() => useCapability(), { wrapper });
    expect(result.current.contractCount).toBe(0);
  });

  it("hasContracts is false when no contracts registered", () => {
    const { result } = renderHook(() => useCapability(), { wrapper });
    expect(result.current.hasContracts).toBe(false);
  });

  it("byType is empty when no contracts registered", () => {
    const { result } = renderHook(() => useCapability(), { wrapper });
    expect(Object.keys(result.current.byType)).toHaveLength(0);
  });

  it("bySafetyLevel is empty when no contracts registered", () => {
    const { result } = renderHook(() => useCapability(), { wrapper });
    expect(Object.keys(result.current.bySafetyLevel)).toHaveLength(0);
  });
});

describe("useCapability — with contracts", () => {
  it("contractCount reflects the number of registered contracts", async () => {
    const c1 = makeContract("cap-count-1");
    const c2 = makeContract("cap-count-2");

    const { result } = renderHook(
      () => ({ ctx: useSealContext(), cap: useCapability() }),
      { wrapper },
    );

    await act(async () => {
      result.current.ctx.registerContract(c1);
      result.current.ctx.registerContract(c2);
    });

    expect(result.current.cap.contractCount).toBe(2);
  });

  it("hasContracts is true after at least one contract is registered", async () => {
    const c1 = makeContract("cap-has-1");

    const { result } = renderHook(
      () => ({ ctx: useSealContext(), cap: useCapability() }),
      { wrapper },
    );

    await act(async () => {
      result.current.ctx.registerContract(c1);
    });

    expect(result.current.cap.hasContracts).toBe(true);
  });

  it("byType groups contracts under the correct type key", async () => {
    const action = makeContract("cap-type-action", "action");
    const input = makeContract("cap-type-input", "input");
    const nav = makeContract("cap-type-nav", "navigation");

    const { result } = renderHook(
      () => ({ ctx: useSealContext(), cap: useCapability() }),
      { wrapper },
    );

    await act(async () => {
      result.current.ctx.registerContract(action);
      result.current.ctx.registerContract(input);
      result.current.ctx.registerContract(nav);
    });

    expect(result.current.cap.byType["action"]).toHaveLength(1);
    expect(result.current.cap.byType["input"]).toHaveLength(1);
    expect(result.current.cap.byType["navigation"]).toHaveLength(1);
    expect(result.current.cap.byType["action"]?.[0]?.id).toBe("cap-type-action");
  });

  it("byType accumulates multiple contracts with the same type", async () => {
    const a1 = makeContract("cap-bytype-a1", "action");
    const a2 = makeContract("cap-bytype-a2", "action");

    const { result } = renderHook(
      () => ({ ctx: useSealContext(), cap: useCapability() }),
      { wrapper },
    );

    await act(async () => {
      result.current.ctx.registerContract(a1);
      result.current.ctx.registerContract(a2);
    });

    expect(result.current.cap.byType["action"]).toHaveLength(2);
  });

  it("bySafetyLevel groups contracts under the correct safety level key", async () => {
    const low = makeContract("cap-safety-low", "action", "low");
    const high = makeContract("cap-safety-high", "action", "high");

    const { result } = renderHook(
      () => ({ ctx: useSealContext(), cap: useCapability() }),
      { wrapper },
    );

    await act(async () => {
      result.current.ctx.registerContract(low);
      result.current.ctx.registerContract(high);
    });

    expect(result.current.cap.bySafetyLevel["low"]).toHaveLength(1);
    expect(result.current.cap.bySafetyLevel["high"]).toHaveLength(1);
    expect(result.current.cap.bySafetyLevel["low"]?.[0]?.id).toBe("cap-safety-low");
  });

  it("manifest is non-null (generateManifest succeeds even with no contracts)", () => {
    const { result } = renderHook(() => useCapability(), { wrapper });
    expect(result.current.manifest).not.toBeNull();
  });

  it("manifest contains registered contracts", async () => {
    const c1 = makeContract("cap-manifest-btn");

    const { result } = renderHook(
      () => ({ ctx: useSealContext(), cap: useCapability() }),
      { wrapper },
    );

    await act(async () => {
      result.current.ctx.registerContract(c1);
    });

    expect(
      result.current.cap.manifest?.components.some(
        (c) => c.id === "cap-manifest-btn",
      ),
    ).toBe(true);
  });
});

describe("useCapability — outside provider", () => {
  it("throws when used outside a SealProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useCapability())).toThrow();
    spy.mockRestore();
  });
});
