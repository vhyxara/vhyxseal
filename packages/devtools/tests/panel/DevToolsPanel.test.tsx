import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { SealProvider, withAgentContract } from "@vhyxseal/react";
import { defineContract } from "@vhyxseal/core";
import type { ComponentContract } from "@vhyxseal/core";
import { DevToolsPanel } from "../../src/panel/DevToolsPanel.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const inferredContract = defineContract({
  id: "inferred-btn",
  type: "action",
  intent: "submit-form",
  description: "An inferred button",
  requires: [],
  requiredPermissions: [],
  consequence: "Submits the form",
  affects: ["form"],
  reversible: false,
  safetyLevel: "low",
  requiresConfirmation: false,
  destructive: false,
  contractVersion: "1.0.0",
});

// Manually constructed full contract — defineContract always sets verifiedBy: "auto"
// so we construct this directly to test the fullCount path
const fullContract: ComponentContract = {
  id: "full-btn",
  type: "action",
  intent: "submit-form",
  description: "A fully specified button",
  requires: [],
  requiredPermissions: [],
  consequence: "Submits the form",
  affects: ["form"],
  reversible: false,
  safetyLevel: "high",
  requiresConfirmation: true,
  destructive: false,
  contractVersion: "1.0.0",
  fingerprint: "manual-fingerprint-abc123",
  lastVerified: new Date().toISOString(),
  verifiedBy: "manual",
};

// Null-rendering components that only exist to register their contracts
const InferredRegistrar = withAgentContract(() => null, inferredContract);
const FullRegistrar = withAgentContract(() => null, fullContract);

// ---------------------------------------------------------------------------
// Wrappers
// ---------------------------------------------------------------------------

const sealConfig = { domain: "test.com", domainVerified: false, verificationToken: "" };

function wrapper({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <SealProvider config={sealConfig}>
      {children}
    </SealProvider>
  );
}

function wrapperWithContracts({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <SealProvider config={sealConfig}>
      <InferredRegistrar />
      <FullRegistrar />
      {children}
    </SealProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("DevToolsPanel", () => {
  it("renders null in production when forceVisible is not set", () => {
    vi.stubEnv("NODE_ENV", "production");
    const { container } = render(<DevToolsPanel />, { wrapper });
    expect(container.firstChild).toBeNull();
  });

  it("renders panel with forceVisible={true} even in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const { getByText } = render(<DevToolsPanel forceVisible={true} />, { wrapper });
    expect(getByText("🔒 VhyxSeal DevTools")).toBeDefined();
  });

  it("renders in development (NODE_ENV is not production)", () => {
    // vitest sets NODE_ENV to "test" by default — not "production"
    const { getByText } = render(<DevToolsPanel />, { wrapper });
    expect(getByText("🔒 VhyxSeal DevTools")).toBeDefined();
  });

  it("shows correct contract count", async () => {
    const { getByText } = render(
      <SealProvider config={sealConfig}>
        <InferredRegistrar />
        <DevToolsPanel />
      </SealProvider>,
    );
    await waitFor(() => {
      expect(getByText("Contracts: 1")).toBeDefined();
    });
  });

  it("shows 'full' count for contracts with fingerprint and verifiedBy !== 'auto'", async () => {
    const { getByText } = render(
      <SealProvider config={sealConfig}>
        <FullRegistrar />
        <DevToolsPanel />
      </SealProvider>,
    );
    await waitFor(() => {
      expect(getByText("1 full")).toBeDefined();
    });
  });

  it("shows 'inferred' count for contracts with verifiedBy === 'auto'", async () => {
    const { getByText } = render(
      <SealProvider config={sealConfig}>
        <InferredRegistrar />
        <DevToolsPanel />
      </SealProvider>,
    );
    await waitFor(() => {
      expect(getByText("1 inferred")).toBeDefined();
    });
  });

  it("shows contract id in the panel", async () => {
    const { getByText } = render(<DevToolsPanel />, { wrapper: wrapperWithContracts });
    await waitFor(() => {
      expect(getByText("inferred-btn")).toBeDefined();
    });
  });

  it("shows contract intent in the panel", async () => {
    const { getByText } = render(<DevToolsPanel />, { wrapper: wrapperWithContracts });
    await waitFor(() => {
      // Both contracts use submit-form — check at least one intent appears
      const elements = document.querySelectorAll("span");
      const intents = [...elements].map(el => el.textContent);
      expect(intents.some(t => t === "submit-form")).toBe(true);
    });
  });

  it("shows safety level label in the panel", async () => {
    const { getByText } = render(
      <SealProvider config={sealConfig}>
        <FullRegistrar />
        <DevToolsPanel />
      </SealProvider>,
    );
    await waitFor(() => {
      expect(getByText("high")).toBeDefined();
    });
  });
});
