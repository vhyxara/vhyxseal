"use client";

import { Button } from "@vhyxseal/react";
import { inferContract } from "@vhyxseal/core";
import { DemoLayout } from "../components/Layout";
import { CodeBlock } from "../components/CodeBlock";

const inferred = inferContract({
  tagName: "button",
  textContent: "Place Order",
  dataAttributes: {},
});

export default function Level0Page() {
  return (
    <DemoLayout
      title="Level 0 — Zero Effort"
      description="Drop in a component with no contract. The library infers intent from the tag name, text content, and ARIA attributes. Agents get something — not perfect, but better than nothing."
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
              Rendered component — no contract specified
            </p>
            <Button
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
              border: "1px solid #eab308",
              borderRadius: "8px",
              padding: "16px",
            }}
          >
            <p style={{ color: "#eab308", fontSize: "11px", fontFamily: "monospace", margin: "0 0 8px" }}>
              ⚠ INFERRED — not specified by developer
            </p>
            <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0, lineHeight: 1.6 }}>
              Confidence: <strong style={{ color: "#f1f5f9" }}>{inferred.confidence}</strong>
            </p>
            <p style={{ color: "#94a3b8", fontSize: "12px", margin: "4px 0 0", lineHeight: 1.6 }}>
              {inferred.reasoning}
            </p>
          </div>
        </div>
      }
      right={
        <div>
          <p style={{ color: "#64748b", fontSize: "12px", fontFamily: "monospace", marginBottom: "8px" }}>
            inferContract() output — what the agent sees
          </p>
          <CodeBlock
            value={{
              inferred: inferred.inferred,
              confidence: inferred.confidence,
              reasoning: inferred.reasoning,
              missing: inferred.missing,
            }}
          />
        </div>
      }
    />
  );
}
