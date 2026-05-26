/**
 * Integration tests — exercises multiple @vhyxseal/react modules working together.
 * Each scenario involves at least two modules.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import React, { useState } from "react";
import {
  SealProvider,
  useSealContext,
  withAgentContract,
  useContract,
  useCapability,
  useAgentAction,
  Button,
  Input,
  Nav,
  Form,
  Confirmation,
} from "../../src/index.js";
import type { ConfirmationState } from "../../src/index.js";
import {
  defineContract,
  inferContract,
  clearRelationshipRegistry,
  clearCapabilityRegistry,
} from "@vhyxseal/core";
import type { ManifestConfig, VhyxSealManifest } from "@vhyxseal/core";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const config: ManifestConfig = {
  domain: "integration-test.com",
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
    description: `Integration test contract ${id}`,
    requires: [],
    requiredPermissions: [],
    consequence: "Test",
    affects: ["test"],
    contractVersion: "1.0.0",
    safetyLevel,
  });
}

beforeEach(() => {
  clearRelationshipRegistry();
  clearCapabilityRegistry();
});

// ---------------------------------------------------------------------------
// Scenario 1 — Full component lifecycle with SealProvider
// ---------------------------------------------------------------------------

describe("Scenario 1 — component lifecycle with SealProvider", () => {
  it("contract registers on mount, unregisters on unmount, re-registers on re-mount", async () => {
    const contract = makeContract("s1-lifecycle-btn");
    // Definite assignment — ContextReader assigns during render (TS 5.9 closure narrowing)
    let capturedCtx!: ReturnType<typeof useSealContext>;

    function ContextReader() {
      capturedCtx = useSealContext();
      return null;
    }

    function Parent() {
      const [show, setShow] = useState(true);
      return (
        <SealProvider config={config} dev={false}>
          {show && <Button contract={contract}>click</Button>}
          <button
            data-testid="toggle"
            onClick={() => { setShow((v) => !v); }}
          >
            toggle
          </button>
          <ContextReader />
        </SealProvider>
      );
    }

    render(<Parent />);
    await act(async () => {});

    // Mounted — registered
    expect(capturedCtx.contracts.has("s1-lifecycle-btn")).toBe(true);

    // Unmount
    await act(async () => { screen.getByTestId("toggle").click(); });
    expect(capturedCtx.contracts.has("s1-lifecycle-btn")).toBe(false);

    // Re-mount
    await act(async () => { screen.getByTestId("toggle").click(); });
    expect(capturedCtx.contracts.has("s1-lifecycle-btn")).toBe(true);
  });

  it("useContract hook returns the contract registered by the Button component", async () => {
    const contract = makeContract("s1-hook-btn");

    function ContractReader() {
      const found = useContract("s1-hook-btn");
      return (
        <span data-testid="contract-id">{found?.id ?? "not-found"}</span>
      );
    }

    render(
      <SealProvider config={config} dev={false}>
        <Button contract={contract}>click</Button>
        <ContractReader />
      </SealProvider>,
    );
    await act(async () => {});

    expect(screen.getByTestId("contract-id").textContent).toBe("s1-hook-btn");
  });
});

// ---------------------------------------------------------------------------
// Scenario 2 — withAgentContract HOC + useContract hook
// ---------------------------------------------------------------------------

describe("Scenario 2 — withAgentContract HOC + useContract", () => {
  it("HOC-wrapped component's contract is accessible via useContract", async () => {
    const contract = makeContract("s2-hoc-div");

    function PlainDiv({
      "data-testid": testId,
    }: {
      "data-testid"?: string;
    }) {
      return <div data-testid={testId}>wrapped</div>;
    }

    const WrappedDiv = withAgentContract(PlainDiv, contract);

    function ContractReader() {
      const found = useContract("s2-hoc-div");
      return (
        <span data-testid="found">{found?.id ?? "not-found"}</span>
      );
    }

    render(
      <SealProvider config={config} dev={false}>
        <WrappedDiv data-testid="target" />
        <ContractReader />
      </SealProvider>,
    );
    await act(async () => {});

    expect(screen.getByTestId("target").textContent).toBe("wrapped");
    expect(screen.getByTestId("found").textContent).toBe("s2-hoc-div");
  });

  it("HOC displayName follows WithAgentContract(ComponentName) pattern", () => {
    const contract = makeContract("s2-display-name");

    function MyComponent() {
      return <div>content</div>;
    }

    const Wrapped = withAgentContract(MyComponent, contract);
    expect(Wrapped.displayName).toBe("WithAgentContract(MyComponent)");
  });
});

// ---------------------------------------------------------------------------
// Scenario 3 — Multiple components, useCapability grouping
// ---------------------------------------------------------------------------

describe("Scenario 3 — multiple components + useCapability grouping", () => {
  it("useCapability reflects all registered contracts with correct type and safety grouping", async () => {
    const btnContract = makeContract("s3-btn", "action", "high");
    const inpContract = makeContract("s3-inp", "input", "low");
    const navContract = makeContract("s3-nav", "navigation", "low");

    function CapabilityDisplay() {
      const { contractCount, byType, bySafetyLevel } = useCapability();
      return (
        <div>
          <span data-testid="count">{contractCount}</span>
          <span data-testid="action-count">
            {byType["action"]?.length ?? 0}
          </span>
          <span data-testid="input-count">
            {byType["input"]?.length ?? 0}
          </span>
          <span data-testid="nav-count">
            {byType["navigation"]?.length ?? 0}
          </span>
          <span data-testid="high-count">
            {bySafetyLevel["high"]?.length ?? 0}
          </span>
          <span data-testid="low-count">
            {bySafetyLevel["low"]?.length ?? 0}
          </span>
        </div>
      );
    }

    render(
      <SealProvider config={config} dev={false}>
        <Button contract={btnContract}>order</Button>
        <Input contract={inpContract} />
        <Nav contract={navContract}>nav</Nav>
        <CapabilityDisplay />
      </SealProvider>,
    );
    await act(async () => {});

    expect(screen.getByTestId("count").textContent).toBe("3");
    expect(screen.getByTestId("action-count").textContent).toBe("1");
    expect(screen.getByTestId("input-count").textContent).toBe("1");
    expect(screen.getByTestId("nav-count").textContent).toBe("1");
    expect(screen.getByTestId("high-count").textContent).toBe("1");
    expect(screen.getByTestId("low-count").textContent).toBe("2");
  });
});

// ---------------------------------------------------------------------------
// Scenario 4 — Confirmation + useAgentAction together
// ---------------------------------------------------------------------------

describe("Scenario 4 — Confirmation + useAgentAction independence", () => {
  it("Confirmation state and useAgentAction state are independent and both work", async () => {
    const actionContract = makeContract("s4-action");

    function CombinedTest() {
      const { actions, initiateAction, completeAction } = useAgentAction();

      return (
        <>
          <Confirmation>
            {({
              confirmed,
              isPending,
              requestConfirmation,
              confirm,
            }: ConfirmationState) => (
              <div>
                <span data-testid="conf-confirmed">{String(confirmed)}</span>
                <span data-testid="conf-pending">{String(isPending)}</span>
                <button
                  data-testid="conf-request"
                  onClick={requestConfirmation}
                >
                  Request
                </button>
                <button data-testid="conf-confirm" onClick={confirm}>
                  Confirm
                </button>
              </div>
            )}
          </Confirmation>
          <button
            data-testid="initiate"
            onClick={() => {
              const id = initiateAction(actionContract);
              completeAction(id);
            }}
          >
            Act
          </button>
          <span data-testid="action-count">{actions.length}</span>
          <span data-testid="action-status">
            {actions[0]?.status ?? "none"}
          </span>
        </>
      );
    }

    render(<CombinedTest />);

    // Confirmation: requestConfirmation sets isPending
    await act(async () => { screen.getByTestId("conf-request").click(); });
    expect(screen.getByTestId("conf-pending").textContent).toBe("true");
    expect(screen.getByTestId("conf-confirmed").textContent).toBe("false");

    // Confirmation: confirm sets confirmed true
    await act(async () => { screen.getByTestId("conf-confirm").click(); });
    expect(screen.getByTestId("conf-confirmed").textContent).toBe("true");
    expect(screen.getByTestId("conf-pending").textContent).toBe("false");

    // useAgentAction: initiate + complete are independent of Confirmation
    await act(async () => { screen.getByTestId("initiate").click(); });
    expect(screen.getByTestId("action-count").textContent).toBe("1");
    expect(screen.getByTestId("action-status").textContent).toBe("completed");

    // Confirmation state unchanged after action
    expect(screen.getByTestId("conf-confirmed").textContent).toBe("true");
  });
});

// ---------------------------------------------------------------------------
// Scenario 5 — SealProvider manifest generation
// ---------------------------------------------------------------------------

describe("Scenario 5 — manifest generation with multiple components", () => {
  it("manifest contains all registered contracts and correct domain", async () => {
    const c1 = makeContract("s5-btn");
    const c2 = makeContract("s5-inp", "input");
    const c3 = makeContract("s5-form", "input");

    // Definite assignment — ManifestReader assigns during render (TS 5.9 closure narrowing)
    let capturedManifest!: Readonly<VhyxSealManifest>;

    function ManifestReader() {
      const { manifest } = useCapability();
      if (manifest !== null) capturedManifest = manifest;
      return null;
    }

    render(
      <SealProvider config={config} dev={false}>
        <Button contract={c1}>click</Button>
        <Input contract={c2} />
        <Form contract={c3}>content</Form>
        <ManifestReader />
      </SealProvider>,
    );
    await act(async () => {});

    expect(capturedManifest).not.toBeUndefined();
    expect(capturedManifest.domain).toBe("integration-test.com");
    expect(capturedManifest.components.some((c) => c.id === "s5-btn")).toBe(true);
    expect(capturedManifest.components.some((c) => c.id === "s5-inp")).toBe(true);
    expect(capturedManifest.components.some((c) => c.id === "s5-form")).toBe(true);
    expect(capturedManifest.components).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// Scenario 6 — Graceful degradation outside SealProvider
// ---------------------------------------------------------------------------

describe("Scenario 6 — graceful degradation outside SealProvider", () => {
  it("Button renders without throw when outside SealProvider", async () => {
    const contract = makeContract("s6-btn-outside");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => render(<Button contract={contract}>click</Button>)).not.toThrow();
    await act(async () => {});
    warnSpy.mockRestore();
  });

  it("Input renders without throw when outside SealProvider", async () => {
    const contract = makeContract("s6-inp-outside", "input");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => render(<Input contract={contract} />)).not.toThrow();
    await act(async () => {});
    warnSpy.mockRestore();
  });

  it("useContract throws outside SealProvider", () => {
    function BadReader() {
      useContract("any");
      return null;
    }
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<BadReader />)).toThrow();
    spy.mockRestore();
  });

  it("useCapability throws outside SealProvider", () => {
    function BadCapability() {
      useCapability();
      return null;
    }
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<BadCapability />)).toThrow();
    spy.mockRestore();
  });

  it("useAgentAction works fine outside SealProvider", async () => {
    const { result } = renderHook(() => useAgentAction());
    const contract = makeContract("s6-standalone-action");

    let actionId = "";
    await act(async () => {
      actionId = result.current.initiateAction(contract);
    });

    expect(actionId).toMatch(/^agent-action-/);
    expect(result.current.actions[0]?.status).toBe("pending");
  });
});

// ---------------------------------------------------------------------------
// Scenario 7 — Inference to component
// ---------------------------------------------------------------------------

describe("Scenario 7 — inferContract → defineContract → component", () => {
  it("a contract built from inference registers correctly in SealProvider", async () => {
    const { inferred: partial } = inferContract({
      tagName: "button",
      textContent: "Place Order",
    });

    // Add required fields that inference cannot determine
    const contract = defineContract({
      id: "s7-inferred-btn",
      type: partial.type ?? "action",
      intent: partial.intent ?? "place-order",
      description: partial.description ?? "Inferred place-order button",
      requires: partial.requires ?? [],
      requiredPermissions: partial.requiredPermissions ?? [],
      consequence: partial.consequence ?? "Creates an order",
      affects: partial.affects ?? ["orders"],
      contractVersion: "1.0.0",
      // safetyLevel, requiresConfirmation, reversible, destructive omitted here —
      // defineContract applies INTENT_DEFAULTS for "place-order" (exactOptionalPropertyTypes:
      // partial inference fields are boolean | undefined; omit to avoid explicit undefined)
    });

    // Definite assignment — ContextReader assigns during render (TS 5.9 closure narrowing)
    let capturedCtx!: ReturnType<typeof useSealContext>;
    function ContextReader() {
      capturedCtx = useSealContext();
      return null;
    }

    render(
      <SealProvider config={config} dev={false}>
        <Button contract={contract}>Place Order</Button>
        <ContextReader />
      </SealProvider>,
    );
    await act(async () => {});

    expect(capturedCtx.contracts.has("s7-inferred-btn")).toBe(true);
    expect(capturedCtx.contracts.get("s7-inferred-btn")?.intent).toBe(
      "place-order",
    );
  });

  it("explicit intent overrides inference — INTENT_DEFAULTS apply via defineContract", async () => {
    // inferContract gives us the structural type; we override intent explicitly
    // when inference doesn't recognise the specific text, which is the correct
    // developer workflow: use inference for what it knows, fill gaps manually.
    const { inferred: partial } = inferContract({
      tagName: "button",
      textContent: "Delete Account",
    });

    const contract = defineContract({
      id: "s7-inferred-delete",
      type: partial.type ?? "action",
      // Explicit intent — inference may not map this text to delete-account.
      // defineContract merges INTENT_DEFAULTS for the given intent.
      intent: "delete-account",
      description: "Delete account button",
      requires: [],
      requiredPermissions: [],
      consequence: "Deletes the user account",
      affects: ["user"],
      contractVersion: "1.0.0",
    });

    // Definite assignment — ContextReader assigns during render (TS 5.9 closure narrowing)
    let capturedCtx!: ReturnType<typeof useSealContext>;
    function ContextReader() {
      capturedCtx = useSealContext();
      return null;
    }

    render(
      <SealProvider config={config} dev={false}>
        <Button contract={contract}>Delete Account</Button>
        <ContextReader />
      </SealProvider>,
    );
    await act(async () => {});

    const registered = capturedCtx.contracts.get("s7-inferred-delete");
    expect(registered).toBeDefined();
    // delete-account intent defaults: safetyLevel "critical", destructive true
    expect(registered?.safetyLevel).toBe("critical");
    expect(registered?.destructive).toBe(true);
    expect(registered?.requiresConfirmation).toBe(true);
  });
});
