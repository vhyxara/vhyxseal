import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React, { createRef, useState } from "react";
import { SealProvider, useSealContext } from "../../src/provider/index.js";
import { Form } from "../../src/components/index.js";
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
    intent: "authenticate",
    description: "Test form",
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

describe("Form — rendering", () => {
  it("renders without crashing", () => {
    expect(() => render(<Form>content</Form>)).not.toThrow();
  });

  it("renders without SealProvider and no contract — no throw", () => {
    expect(() => render(<Form>content</Form>)).not.toThrow();
  });

  it("renders with SealProvider and no contract — no throw", () => {
    expect(() =>
      render(
        <SealProvider config={validConfig} dev={false}>
          <Form>content</Form>
        </SealProvider>,
      ),
    ).not.toThrow();
  });

  it("renders children", () => {
    render(<Form data-testid="form"><span data-testid="child">inner</span></Form>);
    expect(screen.getByTestId("child").textContent).toBe("inner");
  });
});

describe("Form — HTML attributes", () => {
  it("forwards className", () => {
    render(<Form data-testid="form" className="my-form">content</Form>);
    expect(screen.getByTestId("form").className).toBe("my-form");
  });

  it("forwards onSubmit handler", async () => {
    let submitted = false;
    render(
      <Form
        data-testid="form"
        onSubmit={(e) => {
          e.preventDefault();
          submitted = true;
        }}
      >
        content
      </Form>,
    );
    await act(async () => {
      screen.getByTestId("form").dispatchEvent(
        new Event("submit", { bubbles: true }),
      );
    });
    expect(submitted).toBe(true);
  });
});

describe("Form — ref forwarding", () => {
  it("ref.current is the form DOM element after mount", () => {
    const ref = createRef<HTMLFormElement>();
    render(<Form ref={ref}>content</Form>);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName.toLowerCase()).toBe("form");
  });
});

describe("Form — contract registration", () => {
  it("registers contract in SealContext when provided", async () => {
    const contract = makeContract("form-reg-test");
    let capturedCtx: SealContextValue | null = null;

    render(
      <SealProvider config={validConfig} dev={false}>
        <Form contract={contract}>content</Form>
        <ContextCapture onCapture={(ctx) => { capturedCtx = ctx; }} />
      </SealProvider>,
    );

    await act(async () => {});
    expect(capturedCtx?.contracts.has("form-reg-test")).toBe(true);
  });

  it("unregisters contract when component unmounts", async () => {
    const contract = makeContract("form-unmount-test");
    let capturedCtx: SealContextValue | null = null;

    function Parent() {
      const [show, setShow] = useState(true);
      return (
        <SealProvider config={validConfig} dev={false}>
          {show && <Form contract={contract}>content</Form>}
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
    expect(capturedCtx?.contracts.has("form-unmount-test")).toBe(true);

    await act(async () => { screen.getByTestId("toggle").click(); });
    expect(capturedCtx?.contracts.has("form-unmount-test")).toBe(false);
  });
});
