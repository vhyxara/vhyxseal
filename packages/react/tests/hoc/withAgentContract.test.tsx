import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React, { useState } from "react";
import { SealProvider, useSealContext } from "../../src/provider/index.js";
import { withAgentContract } from "../../src/hoc/index.js";
import {
  defineContract,
  clearRelationshipRegistry,
  clearCapabilityRegistry,
} from "@vhyxseal/core";
import type { ManifestConfig } from "@vhyxseal/core";
import type { SealContextValue } from "../../src/provider/context.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validConfig: ManifestConfig = {
  domain: "example.com",
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
// Helpers
// ---------------------------------------------------------------------------

/** Renders a child inside a SealProvider and captures the context. */
function renderWithContext(
  child: React.ReactNode,
): { getContext: () => SealContextValue | null } {
  let capturedCtx: SealContextValue | null = null;

  function ContextCapture() {
    capturedCtx = useSealContext();
    return null;
  }

  render(
    <SealProvider config={validConfig} dev={false}>
      {child}
      <ContextCapture />
    </SealProvider>,
  );

  return { getContext: () => capturedCtx };
}

// ---------------------------------------------------------------------------
// Inside SealProvider
// ---------------------------------------------------------------------------

describe("withAgentContract — inside SealProvider", () => {
  it("wrapped component renders correctly with all props passed through", () => {
    const contract = makeContract("props-test-btn");

    function TestButton({
      label,
      disabled,
    }: {
      label: string;
      disabled?: boolean;
    }) {
      return (
        <button data-testid="wrapped-btn" disabled={disabled}>
          {label}
        </button>
      );
    }

    const WrappedButton = withAgentContract(TestButton, contract);

    render(
      <SealProvider config={validConfig} dev={false}>
        <WrappedButton label="Click me" disabled={true} />
      </SealProvider>,
    );

    const btn = screen.getByTestId("wrapped-btn");
    expect(btn.textContent).toBe("Click me");
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it("contract is registered in SealContext after mount", async () => {
    const contract = makeContract("hoc-register-btn");

    function Inner() {
      return <span>inner</span>;
    }
    const Wrapped = withAgentContract(Inner, contract);

    const { getContext } = renderWithContext(<Wrapped />);

    await act(async () => {});

    expect(getContext()?.contracts.has("hoc-register-btn")).toBe(true);
  });

  it("contract is unregistered when component unmounts", async () => {
    const contract = makeContract("hoc-unmount-btn");

    function Inner() {
      return <span>inner</span>;
    }
    const Wrapped = withAgentContract(Inner, contract);

    // Definite assignment — ContextCapture assigns during render (TS 5.9 closure narrowing)
    let capturedCtx!: SealContextValue;

    function ContextCapture() {
      capturedCtx = useSealContext();
      return null;
    }

    function Parent() {
      const [show, setShow] = useState(true);
      return (
        <SealProvider config={validConfig} dev={false}>
          {show && <Wrapped />}
          <button
            data-testid="toggle"
            onClick={() => {
              setShow(false);
            }}
          >
            hide
          </button>
          <ContextCapture />
        </SealProvider>
      );
    }

    render(<Parent />);
    await act(async () => {});
    expect(capturedCtx.contracts.has("hoc-unmount-btn")).toBe(true);

    await act(async () => {
      screen.getByTestId("toggle").click();
    });

    expect(capturedCtx.contracts.has("hoc-unmount-btn")).toBe(false);
  });

  it("sets displayName correctly", () => {
    function MyButton() {
      return <button>click</button>;
    }
    const contract = makeContract("display-name-btn");
    const Wrapped = withAgentContract(MyButton, contract);
    expect(Wrapped.displayName).toBe("WithAgentContract(MyButton)");
  });

  it("registers new contract when switched to a component with a different fingerprint", async () => {
    const contractA = makeContract("hoc-fp-a");
    const contractB = makeContract("hoc-fp-b");

    function Inner() {
      return <span>inner</span>;
    }
    const WrappedA = withAgentContract(Inner, contractA);
    const WrappedB = withAgentContract(Inner, contractB);

    // Definite assignment — ContextCapture assigns during render (TS 5.9 closure narrowing)
    let capturedCtx!: SealContextValue;

    function ContextCapture() {
      capturedCtx = useSealContext();
      return null;
    }

    function Parent() {
      const [useB, setUseB] = useState(false);
      return (
        <SealProvider config={validConfig} dev={false}>
          {!useB ? <WrappedA /> : <WrappedB />}
          <button
            data-testid="switch"
            onClick={() => {
              setUseB(true);
            }}
          >
            switch
          </button>
          <ContextCapture />
        </SealProvider>
      );
    }

    render(<Parent />);
    await act(async () => {});
    expect(capturedCtx.contracts.has("hoc-fp-a")).toBe(true);
    expect(capturedCtx.contracts.has("hoc-fp-b")).toBe(false);

    await act(async () => {
      screen.getByTestId("switch").click();
    });

    expect(capturedCtx.contracts.has("hoc-fp-a")).toBe(false);
    expect(capturedCtx.contracts.has("hoc-fp-b")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Outside SealProvider
// ---------------------------------------------------------------------------

describe("withAgentContract — outside SealProvider", () => {
  it("renders without throwing outside a provider", async () => {
    const contract = makeContract("hoc-outside-btn");

    function Inner() {
      return <span data-testid="no-provider">content</span>;
    }
    const Wrapped = withAgentContract(Inner, contract);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => render(<Wrapped />)).not.toThrow();
    await act(async () => {});
    warnSpy.mockRestore();
  });

  it("emits console.warn in dev mode when outside provider", async () => {
    const contract = makeContract("hoc-warn-btn");

    function Inner() {
      return <span>inner</span>;
    }
    const Wrapped = withAgentContract(Inner, contract);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Wrapped />);
    await act(async () => {});

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[VhyxSeal]"),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(contract.id),
    );
    warnSpy.mockRestore();
  });

  it("component output renders correctly despite no provider", async () => {
    const contract = makeContract("hoc-render-outside-btn");

    function Inner() {
      return <p data-testid="outside-render">hello</p>;
    }
    const Wrapped = withAgentContract(Inner, contract);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Wrapped />);
    await act(async () => {});
    warnSpy.mockRestore();

    expect(screen.getByTestId("outside-render").textContent).toBe("hello");
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("withAgentContract — edge cases", () => {
  it("two wrapped components with different ids both register in the same provider", async () => {
    const c1 = makeContract("hoc-edge-1");
    const c2 = makeContract("hoc-edge-2");

    function CompA() {
      return <span>a</span>;
    }
    function CompB() {
      return <span>b</span>;
    }

    const WrappedA = withAgentContract(CompA, c1);
    const WrappedB = withAgentContract(CompB, c2);

    const { getContext } = renderWithContext(
      <>
        <WrappedA />
        <WrappedB />
      </>,
    );

    await act(async () => {});

    expect(getContext()?.contracts.has("hoc-edge-1")).toBe(true);
    expect(getContext()?.contracts.has("hoc-edge-2")).toBe(true);
  });

  it("preserves existing displayName of the wrapped component in the HOC name", () => {
    function AnyComponent() {
      return <div>comp</div>;
    }
    AnyComponent.displayName = "MyCustomButton";

    const contract = makeContract("hoc-display-name-custom");
    const Wrapped = withAgentContract(AnyComponent, contract);
    expect(Wrapped.displayName).toBe("WithAgentContract(MyCustomButton)");
  });

  it("falls back to Component in displayName when wrapped component has no name", () => {
    // Arrow functions assigned to variables may have inferred names,
    // but an anonymous function expression has no name.
    const contract = makeContract("hoc-anon-btn");
    // Force an anonymous component type by removing the name
    const Anon = (() => {
      const fn: React.FunctionComponent = () => <span>anon</span>;
      Object.defineProperty(fn, "name", { value: "" });
      return fn;
    })();

    const Wrapped = withAgentContract(Anon, contract);
    expect(Wrapped.displayName).toBe("WithAgentContract(Component)");
  });
});
