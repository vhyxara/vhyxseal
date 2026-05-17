import React, { useState } from "react";
import type { ReactNode } from "react";
import { useContract } from "@vhyxseal/react";
import type { SafetyLevel } from "@vhyxseal/core";

export interface ContractOverlayProps {
  /** The contract id to display info for */
  contractId: string;
  /** The element to wrap */
  children: ReactNode;
  /** Whether to show the overlay — default true in dev, false in prod */
  enabled?: boolean;
}

const colors = {
  green:  "#22c55e",
  yellow: "#eab308",
  red:    "#ef4444",
  blue:   "#3b82f6",
  gray:   "#6b7280",
} as const;

const tooltipStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "100%",
  left: "0",
  backgroundColor: "#111827",
  color: "#f9fafb",
  fontFamily: "monospace",
  fontSize: "11px",
  padding: "6px 8px",
  borderRadius: "4px",
  border: "1px solid #374151",
  zIndex: 99998,
  whiteSpace: "nowrap",
  pointerEvents: "none",
};

function safetyColor(level: SafetyLevel): string {
  if (level === "low") return colors.gray;
  if (level === "medium") return colors.blue;
  if (level === "critical" || level === "sensitive") return colors.red;
  return colors.yellow; // "high"
}

/**
 * Wraps any element and shows contract info on hover.
 * Automatically disabled in production unless enabled is explicitly set.
 * Must be used within a SealProvider.
 *
 * @param props.contractId - The contract id to display info for
 * @param props.children - The element to wrap
 * @param props.enabled - Override production check — keeps overlay in production when true
 */
export function ContractOverlay({
  contractId,
  children,
  enabled,
}: ContractOverlayProps): ReactNode {
  const [hovered, setHovered] = useState(false);
  const contract = useContract(contractId);

  const isProduction = process.env["NODE_ENV"] === "production";
  if (isProduction && enabled !== true) {
    return <>{children}</>;
  }

  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => { setHovered(true); }}
      onMouseLeave={() => { setHovered(false); }}
    >
      {children}
      {hovered && contract !== undefined && (
        <div style={tooltipStyle}>
          <div>{contract.id}</div>
          <div style={{ color: colors.gray }}>{contract.intent}</div>
          <div>
            Safety:{" "}
            <span style={{ color: safetyColor(contract.safetyLevel) }}>
              {contract.safetyLevel}
            </span>
          </div>
          <div>
            {contract.requiresConfirmation
              ? "⚠️ Requires confirmation"
              : "✓ No confirmation needed"}
          </div>
        </div>
      )}
    </div>
  );
}
