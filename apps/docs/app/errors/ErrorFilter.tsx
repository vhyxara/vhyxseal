"use client";

import { useState } from "react";

interface ErrorRow {
  readonly code: string;
  readonly severity: "fatal" | "error" | "warning";
  readonly category: "Schema" | "Manifest" | "Contract" | "Relationship" | "Security";
  readonly description: string;
  readonly howToFix: string;
}

// All 21 VHYX_* codes from packages/core/src/errors/index.ts
const ERRORS: readonly ErrorRow[] = [
  // Schema errors
  {
    code: "VHYX_INVALID_SCHEMA_VERSION",
    severity: "error",
    category: "Schema",
    description: "The schema version string is not a valid semver",
    howToFix: "Ensure vhyxseal field is a valid semver string e.g. \"1.0.0\"",
  },
  {
    code: "VHYX_CONTRACT_VALIDATION_FAILED",
    severity: "error",
    category: "Schema",
    description: "A contract failed structural validation — required fields are missing or wrong type",
    howToFix: "Check the error context for the specific field and value that failed",
  },
  {
    code: "VHYX_UNKNOWN_INTENT",
    severity: "error",
    category: "Schema",
    description: "The intent string is not recognized and has no registered defaults",
    howToFix: "Use a built-in intent or call registerIntent() before using a custom intent",
  },
  {
    code: "VHYX_INVALID_SAFETY_LEVEL",
    severity: "error",
    category: "Schema",
    description: "The safetyLevel value is not one of the five valid levels",
    howToFix: "Use one of: low | medium | high | critical | sensitive",
  },
  {
    code: "VHYX_FIELD_TOO_LONG",
    severity: "error",
    category: "Schema",
    description: "A string field exceeds its maximum character limit",
    howToFix: "Shorten the field value — description: 500 chars, intent: 50 chars, consequence: 300 chars",
  },
  {
    code: "VHYX_INJECTION_DETECTED",
    severity: "error",
    category: "Schema",
    description: "A string field matched an injection pattern and was rejected by sanitization",
    howToFix: "Remove prompt injection patterns from the field value — use plain descriptive text",
  },
  // Manifest errors
  {
    code: "VHYX_MANIFEST_GENERATION_FAILED",
    severity: "fatal",
    category: "Manifest",
    description: "generateManifest() could not produce a valid manifest",
    howToFix: "Check the error context for the specific cause — often an invalid domain or empty contracts array",
  },
  {
    code: "VHYX_MANIFEST_SIGNING_FAILED",
    severity: "error",
    category: "Manifest",
    description: "signManifest() failed — typically because no active signing key is registered",
    howToFix: "Register a signing key with rotateKey() before calling signManifest()",
  },
  {
    code: "VHYX_MANIFEST_VERIFICATION_FAILED",
    severity: "error",
    category: "Manifest",
    description: "HMAC verification of a received manifest failed — signature does not match content",
    howToFix: "Ensure the manifest has not been tampered with in transit — re-fetch from source",
  },
  {
    code: "VHYX_DOMAIN_MISMATCH",
    severity: "error",
    category: "Manifest",
    description: "The manifest domain field does not match the domain it is being served from",
    howToFix: "Ensure the domain field in ManifestConfig matches the actual serving domain",
  },
  // Contract errors
  {
    code: "VHYX_CONTRACT_DRIFT_DETECTED",
    severity: "warning",
    category: "Contract",
    description: "A contract fingerprint does not match its recomputed value — contract content may have changed",
    howToFix: "Re-run defineContract() on the component to regenerate the fingerprint",
  },
  {
    code: "VHYX_CONTRACT_STALE",
    severity: "warning",
    category: "Contract",
    description: "A contract has not been verified within the staleness threshold",
    howToFix: "Update lastVerified on the contract or set verifiedBy: \"manual\" after reviewing",
  },
  {
    code: "VHYX_DUPLICATE_COMPONENT_ID",
    severity: "error",
    category: "Contract",
    description: "Two contracts were registered with the same component id on the same page",
    howToFix: "Ensure every component has a unique id within its SealProvider tree",
  },
  {
    code: "VHYX_DUPLICATE_INTENT",
    severity: "warning",
    category: "Contract",
    description: "registerIntent() was called with an intent name that is already registered",
    howToFix: "Use a unique intent name — each intent can only be registered once",
  },
  // Relationship errors
  {
    code: "VHYX_INVALID_RELATIONSHIP",
    severity: "error",
    category: "Relationship",
    description: "A relationship definition failed structural validation — required fields are missing",
    howToFix: "Check the relationship object against the schema in packages/core/src/schema/relationships.ts",
  },
  {
    code: "VHYX_CIRCULAR_DEPENDENCY",
    severity: "fatal",
    category: "Relationship",
    description: "A dependency relationship forms a cycle — A → B → A",
    howToFix: "Break the circular dependency by removing one of the dependency definitions",
  },
  {
    code: "VHYX_MISSING_COMPONENT_REF",
    severity: "warning",
    category: "Relationship",
    description: "A relationship references a component id that is not present in the active registry",
    howToFix: "Ensure the referenced component is mounted and registered before the relationship is resolved",
  },
  // Security errors
  {
    code: "VHYX_RATE_LIMIT_EXCEEDED",
    severity: "error",
    category: "Security",
    description: "An agent exceeded the rate limit defined in AgentPolicy.rateLimits",
    howToFix: "Wait for the rate limit window to reset, or increase limits in AgentPolicy",
  },
  {
    code: "VHYX_TOKEN_EXPIRED",
    severity: "error",
    category: "Security",
    description: "An action token was presented after its 60-second expiry window",
    howToFix: "Issue a new action token — tokens expire 60 seconds after issuance",
  },
  {
    code: "VHYX_TOKEN_ALREADY_USED",
    severity: "error",
    category: "Security",
    description: "An action token was presented a second time after already being consumed",
    howToFix: "Issue a new single-use token for each action — tokens cannot be reused",
  },
  {
    code: "VHYX_AGENT_NOT_ALLOWED",
    severity: "error",
    category: "Security",
    description: "The agent identity is blocked by AgentPolicy.blockedAgents or not in allowedAgents",
    howToFix: "Add the agent to AgentPolicy.allowedAgents or remove it from blockedAgents",
  },
] as const;

const CATEGORIES = ["Schema", "Manifest", "Contract", "Relationship", "Security"] as const;

type Category = (typeof CATEGORIES)[number];

function severityColor(severity: string): string {
  switch (severity) {
    case "fatal": return "var(--vhyxseal-color-missing)";
    case "error": return "var(--vhyxseal-color-missing)";
    case "warning": return "var(--vhyxseal-color-inferred)";
    default: return "var(--vhyxseal-color-info)";
  }
}

function categoryColor(category: string): string {
  switch (category) {
    case "Schema": return "var(--vhyxseal-color-info)";
    case "Manifest": return "var(--vhyxseal-color-capability)";
    case "Contract": return "var(--vhyxseal-color-full)";
    case "Relationship": return "var(--vhyxseal-color-inferred)";
    case "Security": return "var(--vhyxseal-color-missing)";
    default: return "var(--vhyxseal-color-neutral)";
  }
}

export function ErrorFilter(): React.ReactElement {
  const [query, setQuery] = useState("");

  const filtered = query.trim() === ""
    ? ERRORS
    : ERRORS.filter((row) =>
        row.code.toLowerCase().includes(query.trim().toLowerCase())
      );

  const filteredByCategory = CATEGORIES.map((cat) => ({
    category: cat as Category,
    rows: filtered.filter((r) => r.category === cat),
  })).filter((group) => group.rows.length > 0);

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <input
          type="search"
          placeholder="Filter error codes…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); }}
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "8px 14px",
            fontSize: "14px",
            backgroundColor: "var(--docs-surface)",
            border: "1px solid var(--docs-border)",
            borderRadius: "6px",
            color: "var(--docs-text)",
            outline: "none",
          }}
          aria-label="Filter error codes"
        />
      </div>

      {filteredByCategory.length === 0 ? (
        <p style={{ color: "var(--docs-text-muted)", fontSize: "14px" }}>
          No error codes match your search.
        </p>
      ) : (
        filteredByCategory.map(({ category, rows }) => (
          <section key={category} style={{ marginBottom: "40px" }}>
            <h2
              id={`category-${category.toLowerCase()}`}
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--docs-text)",
                marginBottom: "16px",
                paddingTop: "16px",
                borderTop: "1px solid var(--docs-border)",
              }}
            >
              {category} Errors
            </h2>
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
                    {(["Code", "Severity", "Category", "Description", "How To Fix"] as const).map(
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
                  {rows.map((row) => (
                    <tr key={row.code}>
                      <td
                        style={{
                          padding: "10px 14px",
                          borderBottom: "1px solid var(--docs-border)",
                          fontFamily: "monospace",
                          fontSize: "12px",
                          color: "var(--docs-text)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.code}
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          borderBottom: "1px solid var(--docs-border)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            color: "white",
                            backgroundColor: severityColor(row.severity),
                          }}
                        >
                          {row.severity}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          borderBottom: "1px solid var(--docs-border)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: categoryColor(row.category),
                            border: "1px solid currentColor",
                          }}
                        >
                          {row.category}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          borderBottom: "1px solid var(--docs-border)",
                          color: "var(--docs-text)",
                          lineHeight: 1.5,
                        }}
                      >
                        {row.description}
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          borderBottom: "1px solid var(--docs-border)",
                          color: "var(--docs-text-muted)",
                          lineHeight: 1.5,
                          fontSize: "13px",
                        }}
                      >
                        {row.howToFix}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
