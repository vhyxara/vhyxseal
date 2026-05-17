import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { SealProvider, withAgentContract } from "@vhyxseal/react";
import { defineContract } from "@vhyxseal/core";
import type { ComponentContract } from "@vhyxseal/core";
import { ContractOverlay } from "../../src/overlay/ContractOverlay.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const testContract: ComponentContract = {
  id: "overlay-btn",
  type: "action",
  intent: "submit-form",
  description: "Overlay test button",
  requires: [],
  requiredPermissions: [],
  consequence: "Submits the form",
  affects: ["form"],
  reversible: false,
  safetyLevel: "high",
  requiresConfirmation: true,
  destructive: false,
  contractVersion: "1.0.0",
  fingerprint: "overlay-fp-abc123",
  lastVerified: new Date().toISOString(),
  verifiedBy: "manual",
};

const noConfirmContract: ComponentContract = {
  ...testContract,
  id: "overlay-no-confirm",
  requiresConfirmation: false,
};

const ContractRegistrar = withAgentContract(() => null, testContract);
const NoConfirmRegistrar = withAgentContract(() => null, noConfirmContract);

const sealConfig = { domain: "test.com", domainVerified: false, verificationToken: "" };

function wrapper({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <SealProvider config={sealConfig}>
      <ContractRegistrar />
      {children}
    </SealProvider>
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("ContractOverlay", () => {
  it("renders children without wrapper div in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const { container } = render(
      <SealProvider config={sealConfig}>
        <ContractRegistrar />
        <ContractOverlay contractId="overlay-btn">
          <span data-testid="child">click me</span>
        </ContractOverlay>
      </SealProvider>,
    );
    // In production, ContractOverlay renders a fragment — no position:relative wrapper div
    const child = container.querySelector("[data-testid='child']")!;
    expect(child).toBeDefined();
    const overlayDiv = container.querySelector("div[style*='position: relative']");
    expect(overlayDiv).toBeNull();
  });

  it("renders wrapper div in development", () => {
    // NODE_ENV is "test" — not "production"
    const { container } = render(
      <ContractOverlay contractId="overlay-btn">
        <span data-testid="child">click me</span>
      </ContractOverlay>,
      { wrapper },
    );
    const child = container.querySelector("[data-testid='child']")!;
    expect(child.parentElement?.tagName).toBe("DIV");
  });

  it("shows tooltip on mouse enter", async () => {
    const { container } = render(
      <ContractOverlay contractId="overlay-btn">
        <span>hover me</span>
      </ContractOverlay>,
      { wrapper },
    );
    const wrapperDiv = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(wrapperDiv);
    await waitFor(() => {
      expect(container.querySelector("[style*='position: absolute']")).not.toBeNull();
    });
  });

  it("hides tooltip on mouse leave", async () => {
    const { container } = render(
      <ContractOverlay contractId="overlay-btn">
        <span>hover me</span>
      </ContractOverlay>,
      { wrapper },
    );
    const wrapperDiv = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(wrapperDiv);
    await waitFor(() => {
      expect(container.querySelector("[style*='position: absolute']")).not.toBeNull();
    });
    fireEvent.mouseLeave(wrapperDiv);
    await waitFor(() => {
      expect(container.querySelector("[style*='position: absolute']")).toBeNull();
    });
  });

  it("tooltip shows contract id", async () => {
    const { container, getByText } = render(
      <ContractOverlay contractId="overlay-btn">
        <span>hover me</span>
      </ContractOverlay>,
      { wrapper },
    );
    const wrapperDiv = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(wrapperDiv);
    await waitFor(() => {
      expect(getByText("overlay-btn")).toBeDefined();
    });
  });

  it("tooltip shows safety level", async () => {
    const { container, getByText } = render(
      <ContractOverlay contractId="overlay-btn">
        <span>hover me</span>
      </ContractOverlay>,
      { wrapper },
    );
    const wrapperDiv = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(wrapperDiv);
    await waitFor(() => {
      expect(getByText("high")).toBeDefined();
    });
  });

  it("shows no tooltip when contract id not found in context", async () => {
    const { container } = render(
      <ContractOverlay contractId="nonexistent-id">
        <span>hover me</span>
      </ContractOverlay>,
      { wrapper },
    );
    const wrapperDiv = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(wrapperDiv);
    await waitFor(() => {
      expect(container.querySelector("[style*='position: absolute']")).toBeNull();
    });
  });

  it("requiresConfirmation true shows warning text in tooltip", async () => {
    const { container, getByText } = render(
      <ContractOverlay contractId="overlay-btn">
        <span>hover me</span>
      </ContractOverlay>,
      { wrapper },
    );
    const wrapperDiv = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(wrapperDiv);
    await waitFor(() => {
      expect(getByText("⚠️ Requires confirmation")).toBeDefined();
    });
  });

  it("requiresConfirmation false shows no-confirmation text in tooltip", async () => {
    const { container, getByText } = render(
      <SealProvider config={sealConfig}>
        <NoConfirmRegistrar />
        <ContractOverlay contractId="overlay-no-confirm">
          <span>hover me</span>
        </ContractOverlay>
      </SealProvider>,
    );
    // NoConfirmRegistrar renders null, so the overlay wrapper div is the first rendered element
    const wrapperDiv = container.querySelector("div[style*='position: relative']") as HTMLElement;
    fireEvent.mouseEnter(wrapperDiv);
    await waitFor(() => {
      expect(getByText("✓ No confirmation needed")).toBeDefined();
    });
  });
});
