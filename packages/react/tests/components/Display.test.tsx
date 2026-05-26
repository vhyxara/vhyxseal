import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React, { createRef, useState } from "react";
import { SealProvider, useSealContext } from "../../src/provider/index.js";
import { Display } from "../../src/components/index.js";
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
    type: "display",
    intent: "navigate",
    description: "Test display",
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

describe("Display — rendering", () => {
  it("renders without crashing", () => {
    expect(() => render(<Display>status</Display>)).not.toThrow();
  });

  it("renders without SealProvider and no contract — no throw", () => {
    expect(() => render(<Display>status</Display>)).not.toThrow();
  });

  it("renders with SealProvider and no contract — no throw", () => {
    expect(() =>
      render(
        <SealProvider config={validConfig} dev={false}>
          <Display>status</Display>
        </SealProvider>,
      ),
    ).not.toThrow();
  });

  it("renders children", () => {
    render(<Display data-testid="disp">Order confirmed</Display>);
    expect(screen.getByTestId("disp").textContent).toBe("Order confirmed");
  });

  it("renders as div element", () => {
    render(<Display data-testid="disp">status</Display>);
    expect(screen.getByTestId("disp").tagName.toLowerCase()).toBe("div");
  });
});

describe("Display — aria-live", () => {
  it("defaults aria-live to polite when live prop is not set", () => {
    render(<Display data-testid="disp">status</Display>);
    expect(screen.getByTestId("disp").getAttribute("aria-live")).toBe("polite");
  });

  it("sets aria-live to assertive when live='assertive'", () => {
    render(
      <Display data-testid="disp" live="assertive">
        urgent
      </Display>,
    );
    expect(screen.getByTestId("disp").getAttribute("aria-live")).toBe(
      "assertive",
    );
  });

  it("sets aria-live to off when live='off'", () => {
    render(
      <Display data-testid="disp" live="off">
        silent
      </Display>,
    );
    expect(screen.getByTestId("disp").getAttribute("aria-live")).toBe("off");
  });
});

describe("Display — HTML attributes", () => {
  it("forwards className", () => {
    render(<Display data-testid="disp" className="status-area">status</Display>);
    expect(screen.getByTestId("disp").className).toBe("status-area");
  });
});

describe("Display — ref forwarding", () => {
  it("ref.current is the div DOM element after mount", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Display ref={ref}>status</Display>);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName.toLowerCase()).toBe("div");
  });
});

describe("Display — contract registration", () => {
  it("registers contract in SealContext when provided", async () => {
    const contract = makeContract("disp-reg-test");
    // Definite assignment — ContextCapture assigns during render (TS 5.9 closure narrowing)
    let capturedCtx!: SealContextValue;

    render(
      <SealProvider config={validConfig} dev={false}>
        <Display contract={contract}>status</Display>
        <ContextCapture onCapture={(ctx) => { capturedCtx = ctx; }} />
      </SealProvider>,
    );

    await act(async () => {});
    expect(capturedCtx.contracts.has("disp-reg-test")).toBe(true);
  });

  it("unregisters contract when component unmounts", async () => {
    const contract = makeContract("disp-unmount-test");
    // Definite assignment — ContextCapture assigns during render (TS 5.9 closure narrowing)
    let capturedCtx!: SealContextValue;

    function Parent() {
      const [show, setShow] = useState(true);
      return (
        <SealProvider config={validConfig} dev={false}>
          {show && <Display contract={contract}>status</Display>}
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
    expect(capturedCtx.contracts.has("disp-unmount-test")).toBe(true);

    await act(async () => { screen.getByTestId("toggle").click(); });
    expect(capturedCtx.contracts.has("disp-unmount-test")).toBe(false);
  });
});
