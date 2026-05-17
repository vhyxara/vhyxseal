"use client";

import { Button } from "@vhyxseal/react";
import { defineContract, resolveIntentDefaults } from "@vhyxseal/core";
import { DemoLayout } from "../components/Layout";
import { CodeBlock } from "../components/CodeBlock";

const intentDefaults = resolveIntentDefaults("place-order");

// Level 1: minimal contract with just intent and required fields.
// The intent vocabulary fills in safetyLevel, requiresConfirmation, and reversible.
const level1Contract = defineContract({
  id: "level-1-place-order-btn",
  type: "action",
  intent: "place-order",
  description: "Places an order",
  requires: [],
  requiredPermissions: [],
  consequence: "Order is placed",
  affects: ["orders"],
  reversible: true,
  safetyLevel: "high",
  requiresConfirmation: true,
  destructive: false,
  contractVersion: "1.0.0",
});

export default function Level1Page() {
  return (
    <DemoLayout
      title="Level 1 — One Prop"
      description="Add a single intent prop. The intent vocabulary knows that 'place-order' is high safety, requires confirmation, and is reversible. One prop fills in the most important contract fields."
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
              Button with intent="place-order"
            </p>
            <Button
              contract={level1Contract}
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
              border: "1px solid #3b82f6",
              borderRadius: "8px",
              padding: "16px",
            }}
          >
            <p style={{ color: "#3b82f6", fontSize: "11px", fontFamily: "monospace", margin: "0 0 8px" }}>
              ◑ PARTIAL — intent fills in defaults
            </p>
            <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0, lineHeight: 1.6 }}>
              safetyLevel: <strong style={{ color: "#ef4444" }}>high</strong>
              {" · "}
              requiresConfirmation: <strong style={{ color: "#22c55e" }}>true</strong>
              {" · "}
              reversible: <strong style={{ color: "#22c55e" }}>true</strong>
            </p>
          </div>
        </div>
      }
      right={
        <div>
          <p style={{ color: "#64748b", fontSize: "12px", fontFamily: "monospace", marginBottom: "8px" }}>
            resolveIntentDefaults("place-order") — what the vocabulary fills in
          </p>
          <CodeBlock value={intentDefaults} />
          <p style={{ color: "#64748b", fontSize: "12px", fontFamily: "monospace", marginTop: "16px", marginBottom: "8px" }}>
            Resulting contract (intent + minimum fields)
          </p>
          <CodeBlock value={level1Contract} />
        </div>
      }
    />
  );
}
