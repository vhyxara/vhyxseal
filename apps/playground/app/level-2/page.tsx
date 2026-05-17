"use client";

import { Button } from "@vhyxseal/react";
import { defineContract } from "@vhyxseal/core";
import { DemoLayout } from "../components/Layout";
import { CodeBlock } from "../components/CodeBlock";

// Level 2: partial contract — developer specifies the fields most relevant
// to their use case. The contract is richer than Level 1 but not fully specified.
const level2Contract = defineContract({
  id: "level-2-checkout-btn",
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
  ],
  requiredPermissions: ["write:orders"],
  consequence: "Creates order and charges payment method",
  affects: ["cart", "orders"],
  reversible: true,
  reversibleWindow: 300,
  safetyLevel: "high",
  requiresConfirmation: true,
  destructive: false,
  contractVersion: "1.0.0",
});

export default function Level2Page() {
  return (
    <DemoLayout
      title="Level 2 — Partial Contract"
      description="Specify the fields most relevant to your use case. Preconditions, permissions, and consequences are defined. Agents know what must be true before acting and what changes after."
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
              Button with partial contract — 2 preconditions, 1 permission
            </p>
            <Button
              contract={level2Contract}
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
              border: "1px solid #a855f7",
              borderRadius: "8px",
              padding: "16px",
            }}
          >
            <p style={{ color: "#a855f7", fontSize: "11px", fontFamily: "monospace", margin: "0 0 8px" }}>
              ◕ PARTIAL — developer specified key fields
            </p>
            <ul style={{ margin: 0, padding: "0 0 0 16px", color: "#94a3b8", fontSize: "12px", lineHeight: 1.8 }}>
              <li>requires: 2 preconditions (auth + cart items)</li>
              <li>requiredPermissions: write:orders</li>
              <li>reversibleWindow: 300s</li>
              <li>affects: cart, orders</li>
            </ul>
          </div>
        </div>
      }
      right={
        <div>
          <p style={{ color: "#64748b", fontSize: "12px", fontFamily: "monospace", marginBottom: "8px" }}>
            Resulting contract — partial but richer than Level 1
          </p>
          <CodeBlock value={level2Contract} />
        </div>
      }
    />
  );
}
