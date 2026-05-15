import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React, { createRef, useState } from "react";
import { SealProvider, useSealContext } from "../../src/provider/index.js";
import { Input } from "../../src/components/index.js";
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
  domain: "test.com",
  domainVerified: false,
  verificationToken: "",
};

function makeContract(id: string) {
  return defineContract({
    id,
    type: "input",
    intent: "search",
    description: "Test input",
    requires: [],
    requiredPermissions: [],
    consequence: "Test",
    affects: ["test"],
    contractVersion: "1.0.0",
  });
}

function ContextCapture({
  onCapture,
}: {
  onCapture: (ctx: SealContextValue) => void;
}) {
  const ctx = useSealContext();
  onCapture(ctx);
  return null;
}

// ---------------------------------------------------------------------------
// Test isolation
// ---------------------------------------------------------------------------

beforeEach(() => {
  clearRelationshipRegistry();
  clearCapabilityRegistry();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Input — rendering", () => {
  it("renders without crashing", () => {
    expect(() => render(<Input />)).not.toThrow();
  });

  it("renders without SealProvider and no contract — no throw", () => {
    expect(() => render(<Input />)).not.toThrow();
  });

  it("renders with SealProvider and no contract — no throw", () => {
    expect(() =>
      render(
        <SealProvider config={validConfig} dev={false}>
          <Input />
        </SealProvider>,
      ),
    ).not.toThrow();
  });
});

describe("Input — HTML attributes", () => {
  it("forwards disabled attribute", () => {
    render(<Input data-testid="inp" disabled />);
    expect((screen.getByTestId("inp") as HTMLInputElement).disabled).toBe(true);
  });

  it("forwards className", () => {
    render(<Input data-testid="inp" className="my-input" />);
    expect(screen.getByTestId("inp").className).toBe("my-input");
  });

  it("forwards type attribute", () => {
    render(<Input data-testid="inp" type="email" />);
    expect((screen.getByTestId("inp") as HTMLInputElement).type).toBe("email");
  });

  it("forwards placeholder attribute", () => {
    render(<Input data-testid="inp" placeholder="Search..." />);
    expect(
      (screen.getByTestId("inp") as HTMLInputElement).placeholder,
    ).toBe("Search...");
  });
});

describe("Input — ref forwarding", () => {
  it("ref.current is the input DOM element after mount", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName.toLowerCase()).toBe("input");
  });
});

describe("Input — contract registration", () => {
  it("registers contract in SealContext when provided", async () => {
    const contract = makeContract("inp-reg-test");
    let capturedCtx: SealContextValue | null = null;

    render(
      <SealProvider config={validConfig} dev={false}>
        <Input contract={contract} />
        <ContextCapture onCapture={(ctx) => { capturedCtx = ctx; }} />
      </SealProvider>,
    );

    await act(async () => {});
    expect(capturedCtx?.contracts.has("inp-reg-test")).toBe(true);
  });

  it("unregisters contract when component unmounts", async () => {
    const contract = makeContract("inp-unmount-test");
    let capturedCtx: SealContextValue | null = null;

    function Parent() {
      const [show, setShow] = useState(true);
      return (
        <SealProvider config={validConfig} dev={false}>
          {show && <Input contract={contract} />}
          <button
            data-testid="toggle"
            onClick={() => { setShow(false); }}
          >
            hide
          </button>
          <ContextCapture onCapture={(ctx) => { capturedCtx = ctx; }} />
        </SealProvider>
      );
    }

    render(<Parent />);
    await act(async () => {});
    expect(capturedCtx?.contracts.has("inp-unmount-test")).toBe(true);

    await act(async () => { screen.getByTestId("toggle").click(); });
    expect(capturedCtx?.contracts.has("inp-unmount-test")).toBe(false);
  });
});
