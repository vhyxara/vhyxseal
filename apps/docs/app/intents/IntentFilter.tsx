"use client";

import { useState } from "react";

interface IntentRow {
  readonly intent: string;
  readonly safetyLevel: string;
  readonly reversible: boolean;
  readonly requiresConfirmation: boolean;
  readonly destructive: boolean;
}

// Data sourced from packages/core/src/schema/intents.ts INTENT_DEFAULTS
const INTENTS: readonly IntentRow[] = [
  { intent: "place-order", safetyLevel: "high", reversible: true, requiresConfirmation: true, destructive: false },
  { intent: "make-payment", safetyLevel: "critical", reversible: false, requiresConfirmation: true, destructive: false },
  { intent: "delete-account", safetyLevel: "critical", reversible: false, requiresConfirmation: true, destructive: true },
  { intent: "delete-item", safetyLevel: "high", reversible: false, requiresConfirmation: true, destructive: true },
  { intent: "send-message", safetyLevel: "medium", reversible: false, requiresConfirmation: false, destructive: false },
  { intent: "save-draft", safetyLevel: "low", reversible: true, requiresConfirmation: false, destructive: false },
  { intent: "submit-form", safetyLevel: "medium", reversible: false, requiresConfirmation: false, destructive: false },
  { intent: "update-profile", safetyLevel: "medium", reversible: true, requiresConfirmation: false, destructive: false },
  { intent: "sign-out", safetyLevel: "low", reversible: true, requiresConfirmation: false, destructive: false },
  { intent: "sign-in", safetyLevel: "low", reversible: true, requiresConfirmation: false, destructive: false },
  { intent: "apply-filter", safetyLevel: "low", reversible: true, requiresConfirmation: false, destructive: false },
  { intent: "search", safetyLevel: "low", reversible: true, requiresConfirmation: false, destructive: false },
  { intent: "upload-file", safetyLevel: "medium", reversible: true, requiresConfirmation: false, destructive: false },
  { intent: "download-file", safetyLevel: "low", reversible: true, requiresConfirmation: false, destructive: false },
  { intent: "schedule-meeting", safetyLevel: "medium", reversible: true, requiresConfirmation: false, destructive: false },
  { intent: "cancel-booking", safetyLevel: "high", reversible: false, requiresConfirmation: true, destructive: false },
  { intent: "publish-content", safetyLevel: "high", reversible: true, requiresConfirmation: true, destructive: false },
  { intent: "unpublish-content", safetyLevel: "high", reversible: true, requiresConfirmation: true, destructive: false },
  { intent: "share-item", safetyLevel: "medium", reversible: true, requiresConfirmation: false, destructive: false },
  { intent: "navigate", safetyLevel: "low", reversible: true, requiresConfirmation: false, destructive: false },
  { intent: "confirm-action", safetyLevel: "high", reversible: false, requiresConfirmation: true, destructive: false },
  { intent: "collect-email", safetyLevel: "low", reversible: true, requiresConfirmation: false, destructive: false },
  { intent: "collect-password", safetyLevel: "sensitive", reversible: true, requiresConfirmation: false, destructive: false },
  { intent: "collect-payment", safetyLevel: "sensitive", reversible: false, requiresConfirmation: true, destructive: false },
  { intent: "authenticate", safetyLevel: "medium", reversible: true, requiresConfirmation: false, destructive: false },
] as const;

function safetyBadgeColor(level: string): string {
  switch (level) {
    case "low": return "var(--vhyxseal-color-full)";
    case "medium": return "var(--vhyxseal-color-info)";
    case "high": return "var(--vhyxseal-color-inferred)";
    case "critical": return "var(--vhyxseal-color-missing)";
    case "sensitive": return "var(--vhyxseal-color-capability)";
    default: return "var(--vhyxseal-color-neutral)";
  }
}

export function IntentFilter(): React.ReactElement {
  const [query, setQuery] = useState("");

  const filtered = query.trim() === ""
    ? INTENTS
    : INTENTS.filter((row) =>
        row.intent.toLowerCase().includes(query.trim().toLowerCase())
      );

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <input
          type="search"
          placeholder="Filter intents…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); }}
          style={{
            width: "100%",
            maxWidth: "360px",
            padding: "8px 14px",
            fontSize: "14px",
            backgroundColor: "var(--docs-surface)",
            border: "1px solid var(--docs-border)",
            borderRadius: "6px",
            color: "var(--docs-text)",
            outline: "none",
          }}
          aria-label="Filter intent vocabulary"
        />
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: "var(--docs-text-muted)", fontSize: "14px" }}>
          No intents match your search.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr>
                {(["Intent", "Safety Level", "Reversible", "Requires Confirmation", "Destructive"] as const).map(
                  (col) => (
                    <th
                      key={col}
                      style={{
                        padding: "10px 14px",
                        textAlign: "left",
                        borderBottom: "1px solid var(--docs-border)",
                        backgroundColor: "var(--docs-surface)",
                        color: "var(--docs-text)",
                        fontWeight: 600,
                        fontSize: "13px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.intent}>
                  <td
                    style={{
                      padding: "10px 14px",
                      borderBottom: "1px solid var(--docs-border)",
                      fontFamily: "monospace",
                      fontSize: "13px",
                      color: "var(--docs-text)",
                    }}
                  >
                    {row.intent}
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      borderBottom: "1px solid var(--docs-border)",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "white",
                        backgroundColor: safetyBadgeColor(row.safetyLevel),
                      }}
                    >
                      {row.safetyLevel}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      borderBottom: "1px solid var(--docs-border)",
                      color: row.reversible
                        ? "var(--vhyxseal-color-full)"
                        : "var(--docs-text-muted)",
                    }}
                  >
                    {row.reversible ? "yes" : "no"}
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      borderBottom: "1px solid var(--docs-border)",
                      color: row.requiresConfirmation
                        ? "var(--vhyxseal-color-inferred)"
                        : "var(--docs-text-muted)",
                    }}
                  >
                    {row.requiresConfirmation ? "yes" : "no"}
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      borderBottom: "1px solid var(--docs-border)",
                      color: row.destructive
                        ? "var(--vhyxseal-color-missing)"
                        : "var(--docs-text-muted)",
                    }}
                  >
                    {row.destructive ? "yes" : "no"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
