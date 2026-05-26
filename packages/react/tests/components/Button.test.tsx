import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React, { createRef, useState } from "react";
import {
  SealProvider,
  useSealContext,
} from "../../src/provider/index.js";
import { Button } from "../../src/components/index.js";
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
    type: "action",
    intent: "place-order",
    description: "Test button",
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

describe("Button — rendering", () => {
  it("renders without crashing", () => {
    expect(() => render(<Button>click</Button>)).not.toThrow();
  });

  it("renders without SealProvider and no contract — no throw", () => {
    expect(() => render(<Button>click</Button>)).not.toThrow();
  });

  it("renders with SealProvider and no contract — no throw", () => {
    expect(() =>
      render(
        <SealProvider config={validConfig} dev={false}>
          <Button>click</Button>
        </SealProvider>,
      ),
    ).not.toThrow();
  });

  it("renders children", () => {
    render(<Button data-testid="btn">label text</Button>);
    expect(screen.getByTestId("btn").textContent).toBe("label text");
  });
});

describe("Button — HTML attributes", () => {
  it("forwards disabled attribute", () => {
    render(<Button data-testid="btn" disabled>click</Button>);
    expect((screen.getByTestId("btn") as HTMLButtonElement).disabled).toBe(true);
  });

  it("forwards className", () => {
    render(<Button data-testid="btn" className="my-class">click</Button>);
    expect(screen.getByTestId("btn").className).toBe("my-class");
  });

  it("forwards onClick handler", async () => {
    let clicked = false;
    render(
      <Button data-testid="btn" onClick={() => { clicked = true; }}>
        click
      </Button>,
    );
    await act(async () => {
      screen.getByTestId("btn").click();
    });
    expect(clicked).toBe(true);
  });
});

describe("Button — ref forwarding", () => {
  it("ref.current is the button DOM element after mount", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>click</Button>);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName.toLowerCase()).toBe("button");
  });
});

describe("Button — contract registration", () => {
  it("registers contract in SealContext when provided", async () => {
    const contract = makeContract("btn-reg-test");
    // Definite assignment — ContextCapture assigns during render (TS 5.9 closure narrowing)
    let capturedCtx!: SealContextValue;

    render(
      <SealProvider config={validConfig} dev={false}>
        <Button contract={contract}>click</Button>
        <ContextCapture onCapture={(ctx) => { capturedCtx = ctx; }} />
      </SealProvider>,
    );

    await act(async () => {});
    expect(capturedCtx.contracts.has("btn-reg-test")).toBe(true);
  });

  it("unregisters contract when component unmounts", async () => {
    const contract = makeContract("btn-unmount-test");
    // Definite assignment — ContextCapture assigns during render (TS 5.9 closure narrowing)
    let capturedCtx!: SealContextValue;

    function Parent() {
      const [show, setShow] = useState(true);
      return (
        <SealProvider config={validConfig} dev={false}>
          {show && <Button contract={contract}>click</Button>}
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
    expect(capturedCtx.contracts.has("btn-unmount-test")).toBe(true);

    await act(async () => { screen.getByTestId("toggle").click(); });
    expect(capturedCtx.contracts.has("btn-unmount-test")).toBe(false);
  });
});
