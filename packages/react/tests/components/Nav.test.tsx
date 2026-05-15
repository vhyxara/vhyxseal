import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React, { createRef, useState } from "react";
import { SealProvider, useSealContext } from "../../src/provider/index.js";
import { Nav } from "../../src/components/index.js";
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
    type: "navigation",
    intent: "navigate",
    description: "Test nav",
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

describe("Nav — rendering", () => {
  it("renders without crashing", () => {
    expect(() => render(<Nav>links</Nav>)).not.toThrow();
  });

  it("renders without SealProvider and no contract — no throw", () => {
    expect(() => render(<Nav>links</Nav>)).not.toThrow();
  });

  it("renders with SealProvider and no contract — no throw", () => {
    expect(() =>
      render(
        <SealProvider config={validConfig} dev={false}>
          <Nav>links</Nav>
        </SealProvider>,
      ),
    ).not.toThrow();
  });

  it("renders children", () => {
    render(<Nav><a data-testid="link" href="/">Home</a></Nav>);
    expect(screen.getByTestId("link").textContent).toBe("Home");
  });

  it("renders as nav element", () => {
    render(<Nav data-testid="nav">links</Nav>);
    expect(screen.getByTestId("nav").tagName.toLowerCase()).toBe("nav");
  });
});

describe("Nav — HTML attributes", () => {
  it("forwards className", () => {
    render(<Nav data-testid="nav" className="site-nav">links</Nav>);
    expect(screen.getByTestId("nav").className).toBe("site-nav");
  });

  it("forwards aria-label", () => {
    render(<Nav data-testid="nav" aria-label="Main navigation">links</Nav>);
    expect(screen.getByTestId("nav").getAttribute("aria-label")).toBe(
      "Main navigation",
    );
  });
});

describe("Nav — ref forwarding", () => {
  it("ref.current is the nav DOM element after mount", () => {
    const ref = createRef<HTMLElement>();
    render(<Nav ref={ref}>links</Nav>);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName.toLowerCase()).toBe("nav");
  });
});

describe("Nav — contract registration", () => {
  it("registers contract in SealContext when provided", async () => {
    const contract = makeContract("nav-reg-test");
    let capturedCtx: SealContextValue | null = null;

    render(
      <SealProvider config={validConfig} dev={false}>
        <Nav contract={contract}>links</Nav>
        <ContextCapture onCapture={(ctx) => { capturedCtx = ctx; }} />
      </SealProvider>,
    );

    await act(async () => {});
    expect(capturedCtx?.contracts.has("nav-reg-test")).toBe(true);
  });

  it("unregisters contract when component unmounts", async () => {
    const contract = makeContract("nav-unmount-test");
    let capturedCtx: SealContextValue | null = null;

    function Parent() {
      const [show, setShow] = useState(true);
      return (
        <SealProvider config={validConfig} dev={false}>
          {show && <Nav contract={contract}>links</Nav>}
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
    expect(capturedCtx?.contracts.has("nav-unmount-test")).toBe(true);

    await act(async () => { screen.getByTestId("toggle").click(); });
    expect(capturedCtx?.contracts.has("nav-unmount-test")).toBe(false);
  });
});
