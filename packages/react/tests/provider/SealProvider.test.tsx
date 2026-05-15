import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, renderHook } from "@testing-library/react";
import React, { useEffect } from "react";
import {
  SealProvider,
  useSealContext,
  type SealProviderProps,
} from "../../src/provider/index.js";
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
  domain: "example.com",
  domainVerified: false,
  verificationToken: "",
};

function makeContract(id: string, intent = "place-order") {
  return defineContract({
    id,
    type: "action",
    intent,
    description: "A test button",
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
// Helpers
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <SealProvider config={validConfig} dev={false}>
      {children}
    </SealProvider>
  );
}

// ---------------------------------------------------------------------------
// Rendering basics
// ---------------------------------------------------------------------------

describe("SealProvider — rendering", () => {
  it("renders children without crashing", () => {
    render(
      <SealProvider config={validConfig} dev={false}>
        <div data-testid="child">hello</div>
      </SealProvider>,
    );
    expect(screen.getByTestId("child")).toBeDefined();
  });

  it("renders in production mode (dev: false) without error", () => {
    expect(() =>
      render(
        <SealProvider config={validConfig} dev={false}>
          <div>production</div>
        </SealProvider>,
      ),
    ).not.toThrow();
  });

  it("renders without explicit dev prop without error", () => {
    expect(() =>
      render(
        <SealProvider config={validConfig}>
          <div>no dev prop</div>
        </SealProvider>,
      ),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// useSealContext — outside provider
// ---------------------------------------------------------------------------

describe("useSealContext — outside provider", () => {
  it("throws when used outside SealProvider", () => {
    function BadComponent() {
      useSealContext();
      return null;
    }
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<BadComponent />)).toThrow();
    spy.mockRestore();
  });

  it("error message mentions SealProvider", () => {
    function BadComponent() {
      useSealContext();
      return null;
    }
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    let caught: unknown;
    try {
      render(<BadComponent />);
    } catch (e) {
      caught = e;
    }
    spy.mockRestore();
    expect(caught).toBeInstanceOf(Error);
    if (caught instanceof Error) {
      expect(caught.message).toContain("SealProvider");
    }
  });
});

// ---------------------------------------------------------------------------
// useSealContext — inside provider
// ---------------------------------------------------------------------------

describe("useSealContext — inside provider", () => {
  it("returns a context value when inside SealProvider", () => {
    const { result } = renderHook(() => useSealContext(), { wrapper });
    expect(result.current).not.toBeNull();
  });

  it("contracts map is initially empty", () => {
    const { result } = renderHook(() => useSealContext(), { wrapper });
    expect(result.current.contracts.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// registerContract
// ---------------------------------------------------------------------------

describe("registerContract", () => {
  it("adds a contract to the context — readable via useSealContext", async () => {
    const contract = makeContract("reg-btn-1");

    // Use renderHook to get stable references — destructure registerContract
    // to avoid [ctx] deps which would cause an infinite re-register loop.
    const { result } = renderHook(() => useSealContext(), { wrapper });

    await act(async () => {
      result.current.registerContract(contract);
    });

    expect(result.current.contracts.has("reg-btn-1")).toBe(true);
  });

  it("registers multiple contracts with different ids", async () => {
    const c1 = makeContract("multi-btn-1");
    const c2 = makeContract("multi-btn-2", "search");

    const { result } = renderHook(() => useSealContext(), { wrapper });

    await act(async () => {
      result.current.registerContract(c1);
      result.current.registerContract(c2);
    });

    expect(result.current.contracts.size).toBe(2);
  });

  it("registering with same id replaces the existing contract", async () => {
    const v1 = makeContract("replace-btn");
    const v2 = makeContract("replace-btn");

    const { result } = renderHook(() => useSealContext(), { wrapper });

    await act(async () => {
      result.current.registerContract(v1);
    });
    expect(result.current.contracts.size).toBe(1);

    await act(async () => {
      result.current.registerContract(v2);
    });
    // Still 1 — replaced, not added
    expect(result.current.contracts.size).toBe(1);
  });

  it("contract is retrievable by id after registration", async () => {
    const contract = makeContract("retrieve-btn");
    const { result } = renderHook(() => useSealContext(), { wrapper });

    await act(async () => {
      result.current.registerContract(contract);
    });

    expect(result.current.contracts.get("retrieve-btn")?.id).toBe("retrieve-btn");
  });
});

// ---------------------------------------------------------------------------
// unregisterContract
// ---------------------------------------------------------------------------

describe("unregisterContract", () => {
  it("removes a registered contract by id", async () => {
    const contract = makeContract("remove-btn");
    const { result } = renderHook(() => useSealContext(), { wrapper });

    await act(async () => {
      result.current.registerContract(contract);
    });
    expect(result.current.contracts.size).toBe(1);

    await act(async () => {
      result.current.unregisterContract("remove-btn");
    });
    expect(result.current.contracts.size).toBe(0);
  });

  it("unregisterContract is silent for an unknown id", () => {
    const { result } = renderHook(() => useSealContext(), { wrapper });
    expect(() => {
      act(() => {
        result.current.unregisterContract("does-not-exist");
      });
    }).not.toThrow();
  });

  it("after unregister the contract is gone from the map", async () => {
    const contract = makeContract("gone-btn");
    const { result } = renderHook(() => useSealContext(), { wrapper });

    await act(async () => { result.current.registerContract(contract); });
    expect(result.current.contracts.has("gone-btn")).toBe(true);

    await act(async () => { result.current.unregisterContract("gone-btn"); });
    expect(result.current.contracts.has("gone-btn")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Manifest generation
// ---------------------------------------------------------------------------

describe("manifest generation", () => {
  it("manifest is defined (generateManifest succeeds with empty contracts)", () => {
    const { result } = renderHook(() => useSealContext(), { wrapper });
    // generateManifest with empty components is valid — manifest should be non-null
    expect(result.current.manifest).not.toBeNull();
  });

  it("manifest is non-null after a contract is registered", async () => {
    const contract = makeContract("manifest-btn");
    const { result } = renderHook(() => useSealContext(), { wrapper });

    await act(async () => {
      result.current.registerContract(contract);
    });

    expect(result.current.manifest).not.toBeNull();
  });

  it("manifest domain matches config domain", async () => {
    const contract = makeContract("domain-btn");
    const { result } = renderHook(() => useSealContext(), { wrapper });

    await act(async () => {
      result.current.registerContract(contract);
    });

    expect(result.current.manifest?.domain).toBe("example.com");
  });

  it("manifest components contains registered contract", async () => {
    const contract = makeContract("component-btn");
    const { result } = renderHook(() => useSealContext(), { wrapper });

    await act(async () => {
      result.current.registerContract(contract);
    });

    expect(
      result.current.manifest?.components.some((c) => c.id === "component-btn"),
    ).toBe(true);
  });

  it("onManifestGenerated callback is called when a contract is registered", async () => {
    const contract = makeContract("callback-btn");
    const onGenerated = vi.fn();

    function wrapperWithCallback({ children }: { children: React.ReactNode }) {
      return (
        <SealProvider
          config={validConfig}
          dev={false}
          onManifestGenerated={onGenerated}
        >
          {children}
        </SealProvider>
      );
    }

    const { result } = renderHook(() => useSealContext(), {
      wrapper: wrapperWithCallback,
    });

    await act(async () => {
      result.current.registerContract(contract);
    });

    expect(onGenerated).toHaveBeenCalled();
  });

  it("onManifestGenerated receives the manifest object", async () => {
    const contract = makeContract("cb-check-btn");
    let receivedManifest: Parameters<Required<SealProviderProps>["onManifestGenerated"]>[0] | null = null;

    function wrapperWithCallback({ children }: { children: React.ReactNode }) {
      return (
        <SealProvider
          config={validConfig}
          dev={false}
          onManifestGenerated={(m) => { receivedManifest = m; }}
        >
          {children}
        </SealProvider>
      );
    }

    const { result } = renderHook(() => useSealContext(), {
      wrapper: wrapperWithCallback,
    });

    await act(async () => {
      result.current.registerContract(contract);
    });

    expect(receivedManifest).not.toBeNull();
    expect(receivedManifest?.domain).toBe("example.com");
  });
});

// ---------------------------------------------------------------------------
// isDev
// ---------------------------------------------------------------------------

describe("isDev", () => {
  it("isDev is false when dev prop is explicitly false", () => {
    const { result } = renderHook(() => useSealContext(), { wrapper });
    expect(result.current.isDev).toBe(false);
  });

  it("isDev is true when dev prop is explicitly true", () => {
    function devWrapper({ children }: { children: React.ReactNode }) {
      return (
        <SealProvider config={validConfig} dev={true}>
          {children}
        </SealProvider>
      );
    }
    const { result } = renderHook(() => useSealContext(), {
      wrapper: devWrapper,
    });
    expect(result.current.isDev).toBe(true);
  });
});
