import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React, { useState } from "react";
import { SealProvider, useSealContext } from "../../src/provider/index.js";
import { Confirmation } from "../../src/components/index.js";
import type { ConfirmationState } from "../../src/components/index.js";
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
    type: "confirmation",
    intent: "confirm-action",
    description: "Test confirmation",
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

/** Renders Confirmation with a testable UI wired to the render prop state. */
function renderConfirmation(contract?: ReturnType<typeof makeContract>) {
  // exactOptionalPropertyTypes: pass contract only when defined, never pass undefined explicitly
  const contractProps = contract !== undefined ? { contract } : {};
  render(
    <Confirmation {...contractProps}>
      {({
        confirmed,
        isPending,
        requestConfirmation,
        confirm,
        cancel,
        reset,
      }: ConfirmationState) => (
        <div>
          <span data-testid="confirmed">{String(confirmed)}</span>
          <span data-testid="isPending">{String(isPending)}</span>
          <button data-testid="request" onClick={requestConfirmation}>
            Request
          </button>
          <button data-testid="confirm" onClick={confirm}>
            Confirm
          </button>
          <button data-testid="cancel" onClick={cancel}>
            Cancel
          </button>
          <button data-testid="reset" onClick={reset}>
            Reset
          </button>
        </div>
      )}
    </Confirmation>,
  );
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

describe("Confirmation — initial state", () => {
  it("renders children with confirmed false and isPending false initially", () => {
    renderConfirmation();
    expect(screen.getByTestId("confirmed").textContent).toBe("false");
    expect(screen.getByTestId("isPending").textContent).toBe("false");
  });

  it("renders without crashing", () => {
    expect(() =>
      render(<Confirmation>{() => <span>content</span>}</Confirmation>),
    ).not.toThrow();
  });
});

describe("Confirmation — state transitions", () => {
  it("requestConfirmation sets isPending to true", async () => {
    renderConfirmation();
    await act(async () => {
      screen.getByTestId("request").click();
    });
    expect(screen.getByTestId("isPending").textContent).toBe("true");
    expect(screen.getByTestId("confirmed").textContent).toBe("false");
  });

  it("confirm sets confirmed to true and isPending to false", async () => {
    renderConfirmation();
    await act(async () => { screen.getByTestId("request").click(); });
    await act(async () => { screen.getByTestId("confirm").click(); });
    expect(screen.getByTestId("confirmed").textContent).toBe("true");
    expect(screen.getByTestId("isPending").textContent).toBe("false");
  });

  it("cancel sets isPending to false without changing confirmed", async () => {
    renderConfirmation();
    await act(async () => { screen.getByTestId("request").click(); });
    expect(screen.getByTestId("isPending").textContent).toBe("true");

    await act(async () => { screen.getByTestId("cancel").click(); });
    expect(screen.getByTestId("isPending").textContent).toBe("false");
    expect(screen.getByTestId("confirmed").textContent).toBe("false");
  });

  it("reset returns both confirmed and isPending to false", async () => {
    renderConfirmation();
    await act(async () => { screen.getByTestId("request").click(); });
    await act(async () => { screen.getByTestId("confirm").click(); });
    expect(screen.getByTestId("confirmed").textContent).toBe("true");

    await act(async () => { screen.getByTestId("reset").click(); });
    expect(screen.getByTestId("confirmed").textContent).toBe("false");
    expect(screen.getByTestId("isPending").textContent).toBe("false");
  });
});

describe("Confirmation — without SealProvider", () => {
  it("works without any SealProvider in the tree", () => {
    expect(() =>
      render(
        <Confirmation>
          {({ confirmed }) => (
            <span data-testid="val">{String(confirmed)}</span>
          )}
        </Confirmation>,
      ),
    ).not.toThrow();
    expect(screen.getByTestId("val").textContent).toBe("false");
  });

  it("works without a contract prop", () => {
    expect(() =>
      render(
        <Confirmation>
          {({ isPending }) => (
            <span data-testid="val">{String(isPending)}</span>
          )}
        </Confirmation>,
      ),
    ).not.toThrow();
    expect(screen.getByTestId("val").textContent).toBe("false");
  });
});

describe("Confirmation — contract registration", () => {
  it("registers contract in SealContext when provided", async () => {
    const contract = makeContract("conf-reg-test");
    // Definite assignment — ContextCapture assigns during render (TS 5.9 closure narrowing)
    let capturedCtx!: SealContextValue;

    render(
      <SealProvider config={validConfig} dev={false}>
        <Confirmation contract={contract}>
          {() => <span>content</span>}
        </Confirmation>
        <ContextCapture onCapture={(ctx) => { capturedCtx = ctx; }} />
      </SealProvider>,
    );

    await act(async () => {});
    expect(capturedCtx.contracts.has("conf-reg-test")).toBe(true);
  });

  it("unregisters contract when component unmounts", async () => {
    const contract = makeContract("conf-unmount-test");
    // Definite assignment — ContextCapture assigns during render (TS 5.9 closure narrowing)
    let capturedCtx!: SealContextValue;

    function Parent() {
      const [show, setShow] = useState(true);
      return (
        <SealProvider config={validConfig} dev={false}>
          {show && (
            <Confirmation contract={contract}>
              {() => <span>content</span>}
            </Confirmation>
          )}
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
    expect(capturedCtx.contracts.has("conf-unmount-test")).toBe(true);

    await act(async () => { screen.getByTestId("toggle").click(); });
    expect(capturedCtx.contracts.has("conf-unmount-test")).toBe(false);
  });
});
