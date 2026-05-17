"use client";

import { SealProvider, Button, useCapability } from "@vhyxseal/react";
import { defineContract } from "@vhyxseal/core";
import { DemoLayout } from "../components/Layout";
import { CodeBlock } from "../components/CodeBlock";

// Full contract from CLAUDE.md Section 11 — Level 3 example.
const orderContract = defineContract({
  id: "checkout-submit-btn",
  type: "action",
  intent: "place-order",
  description: "Submits the current cart as a purchase order",
  requires: [
    {
      field: "user.authenticated",
      operator: "===",
      value: true,
      description: "User must be logged in",
    },
    {
      field: "cart.hasItems",
      operator: "===",
      value: true,
      description: "Cart must have at least one item",
    },
    {
      field: "user.hasPaymentMethod",
      operator: "===",
      value: true,
      description: "Payment method must be saved",
    },
  ],
  requiredPermissions: ["write:orders", "read:payment"],
  consequence: "Creates order record, charges payment method, triggers fulfillment",
  affects: ["cart", "orders", "payment", "inventory"],
  reversible: true,
  reversibleWindow: 300,
  safetyLevel: "high",
  requiresConfirmation: true,
  destructive: false,
  alternatives: ["save-for-later-btn"],
  nextExpected: ["order-confirmation-display", "payment-error-display"],
  errorStates: [
    {
      trigger: "payment declined",
      display: "red banner with message payment failed",
      recovery: "navigate to update-payment-method input",
    },
    {
      trigger: "item out of stock",
      display: "modal listing unavailable items",
      recovery: "remove unavailable items then retry",
    },
  ],
  contractVersion: "1.0.0",
});

const sealConfig = {
  domain: "playground.vhyxseal.dev",
  domainVerified: false,
  verificationToken: "",
};

function Level3Inner() {
  const capability = useCapability();

  const manifestDisplay = capability.manifest
    ? {
        vhyxseal: capability.manifest.vhyxseal,
        domain: capability.manifest.domain,
        generatedAt: capability.manifest.generatedAt,
        componentCount: capability.manifest.components.length,
        components: capability.manifest.components.map((c) => ({
          id: c.id,
          type: c.type,
          intent: c.intent,
          safetyLevel: c.safetyLevel,
          requiresConfirmation: c.requiresConfirmation,
        })),
      }
    : null;

  return (
    <DemoLayout
      title="Level 3 — Full Contract"
      description="Define the complete contract outside JSX. Agents get the full picture — preconditions, consequences, error states, and reversibility. The live manifest updates whenever contracts change."
      left={
        <div>
          <div
            style={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "24px",
              marginBottom: "16px",
            }}
          >
            <p style={{ color: "#64748b", fontSize: "12px", fontFamily: "monospace", marginBottom: "12px" }}>
              Button with full contract — 3 preconditions, 2 permissions, 2 error states
            </p>
            <Button
              contract={orderContract}
              style={{
                backgroundColor: "#3b82f6",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: "6px",
                cursor: "pointer",
                fontFamily: "system-ui",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              Place Order
            </Button>
          </div>
          <div
            style={{
              backgroundColor: "#1e293b",
              border: "1px solid #22c55e",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <p style={{ color: "#22c55e", fontSize: "11px", fontFamily: "monospace", margin: "0 0 8px" }}>
              ✓ FULL — complete contract
            </p>
            <ul style={{ margin: 0, padding: "0 0 0 16px", color: "#94a3b8", fontSize: "12px", lineHeight: 1.8 }}>
              <li>3 preconditions (auth, cart items, payment method)</li>
              <li>2 permissions (write:orders, read:payment)</li>
              <li>reversible within 300 seconds</li>
              <li>2 error states with recovery paths</li>
              <li>nextExpected components defined</li>
            </ul>
          </div>
          <div
            style={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "16px",
            }}
          >
            <p style={{ color: "#64748b", fontSize: "11px", fontFamily: "monospace", margin: "0 0 8px" }}>
              Live manifest — updates as contracts register
            </p>
            <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>
              Contracts registered: <strong style={{ color: "#f1f5f9" }}>{capability.contractCount}</strong>
              {" · "}
              Has contracts: <strong style={{ color: capability.hasContracts ? "#22c55e" : "#ef4444" }}>
                {String(capability.hasContracts)}
              </strong>
            </p>
          </div>
        </div>
      }
      right={
        <div>
          <p style={{ color: "#64748b", fontSize: "12px", fontFamily: "monospace", marginBottom: "8px" }}>
            Full contract definition
          </p>
          <CodeBlock value={orderContract} />
          <p style={{ color: "#64748b", fontSize: "12px", fontFamily: "monospace", marginTop: "16px", marginBottom: "8px" }}>
            Live manifest snapshot
          </p>
          <CodeBlock value={manifestDisplay} />
        </div>
      }
    />
  );
}

export default function Level3Page() {
  return (
    <SealProvider config={sealConfig}>
      <Level3Inner />
    </SealProvider>
  );
}
