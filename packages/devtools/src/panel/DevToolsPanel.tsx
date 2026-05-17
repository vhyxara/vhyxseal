import React from "react";
import type { ReactNode } from "react";
import { useCapability } from "@vhyxseal/react";
import type { ComponentContract, SafetyLevel } from "@vhyxseal/core";

export interface DevToolsPanelProps {
  /** Override dev detection — useful for testing */
  forceVisible?: boolean;
}

const colors = {
  green:  "#22c55e",
  yellow: "#eab308",
  red:    "#ef4444",
  blue:   "#3b82f6",
  gray:   "#6b7280",
} as const;

const panelStyle: React.CSSProperties = {
  position: "fixed",
  bottom: "16px",
  right: "16px",
  width: "320px",
  backgroundColor: "#111827",
  color: "#f9fafb",
  fontFamily: "monospace",
  fontSize: "12px",
  borderRadius: "8px",
  border: "1px solid #374151",
  zIndex: 99999,
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 12px",
  borderBottom: "1px solid #374151",
  backgroundColor: "#1f2937",
};

const sectionStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderBottom: "1px solid #1f2937",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  padding: "2px 0",
  alignItems: "center",
};

function statusIcon(contract: Readonly<ComponentContract>): string {
  if (contract.verifiedBy === "auto") return "⚠️";
  if (!contract.fingerprint) return "❌";
  return "✅";
}

function safetyColor(level: SafetyLevel): string {
  if (level === "low") return colors.gray;
  if (level === "medium") return colors.blue;
  if (level === "critical" || level === "sensitive") return colors.red;
  return colors.yellow; // "high"
}

/**
 * Floating DevTools panel. Reads all registered contracts from context and
 * renders a fixed-position overlay with contract health and coverage info.
 * Automatically renders null in production unless forceVisible is set.
 *
 * @param props.forceVisible - Override production check — for testing only
 */
export function DevToolsPanel({ forceVisible }: DevToolsPanelProps): ReactNode {
  const capability = useCapability();

  const isProduction = process.env["NODE_ENV"] === "production";
  if (isProduction && forceVisible !== true) {
    return null;
  }

  const allContracts = [...capability.contracts.values()];
  const contractCount = capability.contractCount;
  const fullCount = allContracts.filter(
    c => c.verifiedBy !== "auto" && Boolean(c.fingerprint),
  ).length;
  const inferredCount = allContracts.filter(c => c.verifiedBy === "auto").length;
  const missingCount = 0;

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span>🔒 VhyxSeal DevTools</span>
        <span style={{ color: colors.gray }}>v1.0.0</span>
      </div>

      <div style={sectionStyle}>
        <div>Contracts: {contractCount}</div>
        <div style={{ color: colors.green }}>{fullCount} full</div>
        <div style={{ color: colors.yellow }}>{inferredCount} inferred</div>
        <div style={{ color: colors.red }}>{missingCount} missing</div>
      </div>

      <div style={sectionStyle}>
        {allContracts.map(contract => (
          <div key={contract.id} style={rowStyle}>
            <span>{statusIcon(contract)}</span>
            <span>{contract.id}</span>
            <span style={{ color: colors.gray }}>{contract.intent}</span>
            <span style={{ color: safetyColor(contract.safetyLevel) }}>{contract.safetyLevel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
