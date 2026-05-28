import { CodeBlock } from "../../components/CodeBlock";
import { OnThisPage } from "../../components/OnThisPage";
import { PrevNext } from "../../components/PrevNext";

// ── Type source code (exact from packages/core/src/schema/) ─────────────

const componentContractTs = `export interface ComponentContract {
  // IDENTITY
  id: string;
  type: ComponentType;
  intent: string;
  description: string;

  // PRECONDITIONS
  requires: readonly Condition[];
  requiredPermissions: readonly string[];

  // CONSEQUENCE
  consequence: string;
  affects: readonly string[];
  reversible: boolean;
  reversibleWindow?: number;

  // SAFETY
  safetyLevel: SafetyLevel;
  requiresConfirmation: boolean;
  destructive: boolean;

  // AGENT NAVIGATION HINTS
  alternatives?: readonly string[];
  nextExpected?: readonly string[];
  errorStates?: readonly ErrorState[];

  // CONTRACT METADATA
  contractVersion: string;
  fingerprint?: string;
  lastVerified?: string;
  verifiedBy?: "auto" | "manual" | "test";
  changelog?: readonly ContractChangelog[];
}`;

const conditionTs = `export interface Condition {
  /** Abstract field reference — never expose internals e.g. "user.hasPaymentMethod" */
  field: string;
  operator: "===" | "!==" | ">" | "<" | ">=" | "<=" | "includes" | "excludes";
  value: unknown;
  description: string;
}`;

const errorStateTs = `export interface ErrorState {
  /** What causes this error e.g. "payment declined" */
  trigger: string;
  /** What the UI shows e.g. "red banner with payment failed message" */
  display: string;
  /** What the agent should do e.g. "navigate to update-payment-method" */
  recovery: string;
}`;

const componentTypeTs = `export type ComponentType =
  | "action"        // buttons, triggers — does something
  | "input"         // forms, search, filters — collects data
  | "navigation"    // links, menus, tabs — moves somewhere
  | "display"       // shows current state — read only
  | "confirmation"; // gates a decision — dialogs, modals`;

const safetyLevelTs = `export type SafetyLevel =
  | "low"       // read, filter, sort — agent proceeds freely
  | "medium"    // send message, save draft — proceed with care
  | "high"      // place order, submit form — confirm with human
  | "critical"  // delete account, payment — always require human
  | "sensitive"; // medical, financial data — extra protections apply`;

const compositionTs = `export interface CompositionRelationship {
  type: "composition";
  id: string;
  parent: string;
  children: readonly string[];
  completionRequires: readonly string[];
  description: string;
}`;

const sequenceTs = `export interface SequenceStep {
  order: number;
  componentId: string;
  canSkip: boolean;
  skipCondition?: string;
  onComplete: string;
  onFail: string;
}

export interface SequenceRelationship {
  type: "sequence";
  id: string;
  description: string;
  steps: readonly SequenceStep[];
  linear: boolean;
}`;

const dependencyTs = `export type DependencyEffect =
  | "enables" | "disables" | "shows" | "hides" | "modifies";

export interface DependencyRelationship {
  type: "dependency";
  id: string;
  source: string;
  target: string;
  condition: Condition;
  effect: DependencyEffect;
  description: string;
}`;

const capabilityTs = `export interface Capability {
  id: string;
  description: string;
  entryPoint: string;
  exitPoints: readonly ExitPoint[];
  relationships: readonly CapabilityRelationshipRef[];
  estimatedSteps: number;
  requiresAuth: boolean;
  safetyLevel: SafetyLevel;
  spanPages?: readonly string[];
}`;

const manifestTs = `export interface VhyxSealManifest {
  // Schema identification
  vhyxseal: string;          // schema version e.g. "1.0.0"
  schemaUrl: string;

  // Site identification
  domain: string;
  domainVerified: boolean;
  verificationToken: string;

  // Integrity
  signature: string;         // HMAC-SHA256 or "unsigned" (stub)
  signedAt: string;
  fingerprint: string;

  // Content
  capabilities: readonly Capability[];
  components: readonly ComponentContract[];
  relationships: readonly Relationship[];

  // Policy
  agentPolicy: AgentPolicy;

  // Cache and freshness
  generatedAt: string;       // ISO datetime
  expiresAt: string;
}`;

const agentPolicyTs = `export interface AgentPolicy {
  allowedAgents: readonly string[];          // ["*"] for all
  blockedAgents: readonly string[];
  requireAgentIdentification: boolean;
  rateLimits: RateLimits;
  allowedActions: readonly string[];         // intent ids; ["*"] for all
  blockedActions: readonly string[];
  requiresConfirmation: readonly string[];   // intent ids
  requiresHumanPresent: readonly string[];   // intent ids
  manifestAccess: "public" | "private";
  manifestAuth?: "bearer-token";             // only when manifestAccess is "private"
}`;

const rateLimitsTs = `export interface RateLimits {
  actionsPerMinute: number;
  actionsPerHour: number;
  manifestRequestsPerMinute: number;
  perAgentSession: boolean;
}`;

const contractExample = `import { defineContract } from '@vhyxseal/core'

const checkoutContract = defineContract({
  id: "checkout-submit-btn",
  type: "action",
  intent: "place-order",
  description: "Submits the cart as a purchase order",
  requires: [
    { field: "user.authenticated", operator: "===", value: true, description: "User must be logged in" },
    { field: "cart.hasItems", operator: "===", value: true, description: "Cart must have items" },
  ],
  requiredPermissions: ["write:orders"],
  consequence: "Creates order, charges payment, triggers fulfillment",
  affects: ["cart", "orders", "payment"],
  reversible: true,
  reversibleWindow: 300,
  safetyLevel: "high",
  requiresConfirmation: true,
  destructive: false,
  contractVersion: "1.0.0",
})`;

const capabilityExample = `import { defineCapability } from '@vhyxseal/core'

const purchaseCapability = defineCapability({
  id: "purchase-item",
  description: "Browse, select, and purchase a product",
  entryPoint: "product-add-to-cart-btn",
  exitPoints: [
    { componentId: "order-confirmation-display", outcome: "success", description: "Order placed" },
    { componentId: "payment-error-display", outcome: "failure", description: "Payment failed" },
  ],
  relationships: [],
  estimatedSteps: 4,
  requiresAuth: true,
  safetyLevel: "high",
})`;

const manifestExample = `// GET /__agent__/manifest.json
{
  "vhyxseal": "1.0.0",
  "domain": "example.com",
  "domainVerified": true,
  "signature": "unsigned",
  "fingerprint": "vhyxs_a3f8b2c1",
  "components": [...],
  "relationships": [],
  "capabilities": [...],
  "agentPolicy": {
    "allowedAgents": ["*"],
    "blockedAgents": [],
    "allowedActions": ["*"],
    "blockedActions": [],
    "requiresConfirmation": ["place-order", "delete-account"],
    "rateLimits": {
      "actionsPerMinute": 60,
      "actionsPerHour": 500,
      "manifestRequestsPerMinute": 10,
      "perAgentSession": true
    }
  },
  "generatedAt": "2026-05-27T10:00:00.000Z",
  "expiresAt": "2026-05-27T11:00:00.000Z"
}`;

// ── Shared styles ─────────────────────────────────────────────────────────

const h1Style: React.CSSProperties = {
  fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
  fontWeight: 800,
  letterSpacing: "-0.03em",
  color: "var(--docs-text)",
  marginBottom: "8px",
  marginTop: 0,
};

const h2Style: React.CSSProperties = {
  fontSize: "1.25rem",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  color: "var(--docs-text)",
  marginBottom: "12px",
  marginTop: "56px",
  paddingTop: "40px",
  borderTop: "1px solid var(--docs-border)",
  fontFamily: "monospace",
};

const descStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "var(--docs-text-muted)",
  lineHeight: 1.7,
  marginBottom: "16px",
  maxWidth: "660px",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px",
  marginBottom: "20px",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 12px",
  color: "var(--docs-text-muted)",
  borderBottom: "1px solid var(--docs-border)",
  fontWeight: 600,
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const tdStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderBottom: "1px solid var(--docs-border)",
  color: "var(--docs-text)",
  verticalAlign: "top",
};

const monoStyle: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "12px",
  color: "var(--vhyxseal-color-info)",
};

const reqStyle: React.CSSProperties = {
  ...monoStyle,
  color: "var(--vhyxseal-color-full)",
};

const optStyle: React.CSSProperties = {
  ...monoStyle,
  color: "var(--vhyxseal-color-neutral)",
};

/**
 * Schema Reference — all 10 VhyxSeal types documented.
 *
 * Dense and accurate. Every field. Every type. Every valid value.
 * Interfaces match exact source from packages/core/src/schema/.
 *
 * Zero hardcoded colors — all via --docs-* or --vhyxseal-* CSS custom properties.
 */
export default function SchemaPage(): React.ReactElement {
  return (
    <>
      <OnThisPage />
      <h1 style={h1Style}>Schema Reference</h1>
      <p style={descStyle}>
        The authoritative reference for all VhyxSeal types. Interfaces are
        exact copies from{" "}
        <code
          style={{
            backgroundColor: "var(--docs-code-bg)",
            padding: "2px 5px",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          packages/core/src/schema/
        </code>
        . Do not modify the schema without leadership approval — all changes
        must be logged in{" "}
        <code
          style={{
            backgroundColor: "var(--docs-code-bg)",
            padding: "2px 5px",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          .claude/decisions.md
        </code>
        .
      </p>

      {/* 1 — ComponentContract */}
      <section>
        <h2 style={h2Style}>ComponentContract</h2>
        <p style={descStyle}>
          The core primitive. Describes what a component does, what an agent
          must verify before interacting, what changes after interaction, and
          how carefully the agent must proceed.
        </p>
        <CodeBlock
          code={componentContractTs}
          lang="typescript"
          filename="packages/core/src/schema/contract.ts"
        />

        <div style={{ overflowX: "auto", marginTop: "16px" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Field</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Required</th>
                <th style={thStyle}>Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["id", "string", true, "Unique identifier for this component on the page"],
                ["type", "ComponentType", true, "Category of component — how agents interpret it"],
                ["intent", "string", true, "Machine-readable intent e.g. place-order"],
                ["description", "string", true, "Human-readable explanation for agent reasoning"],
                ["requires", "Condition[]", true, "Preconditions that must all be satisfied"],
                ["requiredPermissions", "string[]", true, "Permission scopes required"],
                ["consequence", "string", true, "Plain description of what changes after interaction"],
                ["affects", "string[]", true, "System areas affected e.g. [cart, orders]"],
                ["reversible", "boolean", true, "Whether the action can be undone"],
                ["reversibleWindow", "number", false, "Seconds within which undo is possible"],
                ["safetyLevel", "SafetyLevel", true, "How carefully the agent must proceed"],
                ["requiresConfirmation", "boolean", true, "Agent must obtain human approval first"],
                ["destructive", "boolean", true, "Permanently deletes or modifies data"],
                ["alternatives", "string[]", false, "Other component ids with similar function"],
                ["nextExpected", "string[]", false, "Component ids typically following this one"],
                ["errorStates", "ErrorState[]", false, "Known failure modes and recovery paths"],
                ["contractVersion", "string", true, "Developer-managed semver e.g. 1.0.0"],
                ["fingerprint", "string", false, "Auto-generated — hash of contract content"],
                ["lastVerified", "string", false, "ISO date — when contract was last confirmed"],
                ["verifiedBy", "auto | manual | test", false, "How the contract was verified"],
                ["changelog", "ContractChangelog[]", false, "History of changes to this contract"],
              ].map(([field, type, required, desc]) => (
                <tr key={String(field)}>
                  <td style={{ ...tdStyle, ...monoStyle }}>{field}</td>
                  <td style={{ ...tdStyle, ...monoStyle }}>{type}</td>
                  <td style={tdStyle}>
                    <span style={required ? reqStyle : optStyle}>
                      {required ? "required" : "optional"}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: "var(--docs-text-muted)" }}>
                    {desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <CodeBlock code={contractExample} lang="typescript" />
      </section>

      {/* 2 — Condition */}
      <section>
        <h2 style={h2Style}>Condition</h2>
        <p style={descStyle}>
          A precondition that must be satisfied before an agent interacts.
          Always use abstract field references — never expose internal data
          structure or database field names.
        </p>
        <CodeBlock
          code={conditionTs}
          lang="typescript"
          filename="packages/core/src/schema/contract.ts"
        />
        <div style={{ overflowX: "auto", marginTop: "16px" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Field</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Required</th>
                <th style={thStyle}>Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["field", "string", true, "Abstract reference e.g. user.hasPaymentMethod — never internal DB field names"],
                ["operator", "=== | !== | > | < | >= | <= | includes | excludes", true, "Comparison operator"],
                ["value", "unknown", true, "The value to compare against"],
                ["description", "string", true, "Human-readable e.g. User must have a payment method saved"],
              ].map(([field, type, , desc]) => (
                <tr key={String(field)}>
                  <td style={{ ...tdStyle, ...monoStyle }}>{field}</td>
                  <td style={{ ...tdStyle, ...monoStyle, maxWidth: "200px" }}>{type}</td>
                  <td style={tdStyle}><span style={reqStyle}>required</span></td>
                  <td style={{ ...tdStyle, color: "var(--docs-text-muted)" }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3 — ErrorState */}
      <section>
        <h2 style={h2Style}>ErrorState</h2>
        <p style={descStyle}>
          A known failure mode for a component and how an agent should recover.
          Include every failure mode that an agent might encounter.
        </p>
        <CodeBlock
          code={errorStateTs}
          lang="typescript"
          filename="packages/core/src/schema/contract.ts"
        />
        <div style={{ overflowX: "auto", marginTop: "16px" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Field</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["trigger", "string", "What causes this error e.g. payment declined"],
                ["display", "string", "What the UI shows e.g. red banner with payment failed message"],
                ["recovery", "string", "What the agent should do e.g. navigate to update-payment-method"],
              ].map(([field, type, desc]) => (
                <tr key={String(field)}>
                  <td style={{ ...tdStyle, ...monoStyle }}>{field}</td>
                  <td style={{ ...tdStyle, ...monoStyle }}>{type}</td>
                  <td style={{ ...tdStyle, color: "var(--docs-text-muted)" }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4 — ComponentType */}
      <section>
        <h2 style={h2Style}>ComponentType</h2>
        <p style={descStyle}>
          The five categories of UI component. Determines how agents interpret
          and interact with a component.
        </p>
        <CodeBlock
          code={componentTypeTs}
          lang="typescript"
          filename="packages/core/src/schema/contract.ts"
        />
        <div style={{ overflowX: "auto", marginTop: "16px" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Value</th>
                <th style={thStyle}>Use when</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["action", "Buttons, triggers — the component causes something to happen"],
                ["input", "Forms, search fields, filters — the component collects data"],
                ["navigation", "Links, menus, tabs — the component moves to another location"],
                ["display", "Read-only content showing current state — agent reads, does not act"],
                ["confirmation", "Modals, dialogs — the component gates a decision"],
              ].map(([val, desc]) => (
                <tr key={String(val)}>
                  <td style={{ ...tdStyle, ...monoStyle }}>{val}</td>
                  <td style={{ ...tdStyle, color: "var(--docs-text-muted)" }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5 — SafetyLevel */}
      <section>
        <h2 style={h2Style}>SafetyLevel</h2>
        <p style={descStyle}>
          Controls how carefully an agent must proceed. Higher levels require
          explicit human confirmation. When in doubt, choose the higher level.
        </p>
        <CodeBlock
          code={safetyLevelTs}
          lang="typescript"
          filename="packages/core/src/schema/contract.ts"
        />
        <div style={{ overflowX: "auto", marginTop: "16px" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Value</th>
                <th style={thStyle}>Confirmation</th>
                <th style={thStyle}>Examples</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["low", "Not required", "Search, filter, sort, navigate, sign-out"],
                ["medium", "Not required", "Send message, save draft, update profile, upload file"],
                ["high", "Required", "Place order, submit form, publish content, cancel booking"],
                ["critical", "Always required", "Delete account, make payment, irreversible data changes"],
                ["sensitive", "Required", "Medical data, financial information, passwords"],
              ].map(([val, conf, examples]) => (
                <tr key={String(val)}>
                  <td style={{ ...tdStyle, ...monoStyle }}>{val}</td>
                  <td style={{ ...tdStyle, color: "var(--docs-text-muted)", fontSize: "13px" }}>{conf}</td>
                  <td style={{ ...tdStyle, color: "var(--docs-text-muted)", fontSize: "13px" }}>{examples}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6 — Relationship types */}
      <section>
        <h2 style={h2Style}>Relationship Types</h2>
        <p style={descStyle}>
          Three relationship types cover all component interactions. Use
          relationships to describe flows that span multiple components.
        </p>

        <h3
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--docs-text)",
            fontFamily: "monospace",
            marginBottom: "8px",
            marginTop: "24px",
          }}
        >
          CompositionRelationship
        </h3>
        <p style={{ ...descStyle, marginBottom: "12px" }}>
          Components that belong together structurally. Used when a parent
          requires specific children to be valid before it can act.
        </p>
        <CodeBlock
          code={compositionTs}
          lang="typescript"
          filename="packages/core/src/schema/relationships.ts"
        />

        <h3
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--docs-text)",
            fontFamily: "monospace",
            marginBottom: "8px",
            marginTop: "32px",
          }}
        >
          SequenceRelationship
        </h3>
        <p style={{ ...descStyle, marginBottom: "12px" }}>
          Components with a defined order. Used for multi-step flows like
          checkout or onboarding where the agent must follow steps in sequence.
        </p>
        <CodeBlock
          code={sequenceTs}
          lang="typescript"
          filename="packages/core/src/schema/relationships.ts"
        />

        <h3
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--docs-text)",
            fontFamily: "monospace",
            marginBottom: "8px",
            marginTop: "32px",
          }}
        >
          DependencyRelationship
        </h3>
        <p style={{ ...descStyle, marginBottom: "12px" }}>
          One component&apos;s state gates another&apos;s behavior. Used when filling
          an input enables a button, or selecting a plan shows additional fields.
        </p>
        <CodeBlock
          code={dependencyTs}
          lang="typescript"
          filename="packages/core/src/schema/relationships.ts"
        />
      </section>

      {/* 7 — Capability */}
      <section>
        <h2 style={h2Style}>Capability</h2>
        <p style={descStyle}>
          The highest level of abstraction. Agents think in capabilities — not
          individual components. A capability groups all relationships and
          components needed to accomplish a user-facing goal.
        </p>
        <CodeBlock
          code={capabilityTs}
          lang="typescript"
          filename="packages/core/src/schema/capability.ts"
        />
        <div style={{ overflowX: "auto", marginTop: "16px" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Field</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Required</th>
                <th style={thStyle}>Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["id", "string", true, "Unique capability identifier e.g. purchase-item"],
                ["description", "string", true, "Human and agent readable description"],
                ["entryPoint", "string", true, "Component id where the capability starts"],
                ["exitPoints", "ExitPoint[]", true, "All possible end states (success, failure, cancelled)"],
                ["relationships", "CapabilityRelationshipRef[]", true, "Relationships that make up this capability"],
                ["estimatedSteps", "number", true, "Approximate step count — helps agent plan"],
                ["requiresAuth", "boolean", true, "User must be authenticated"],
                ["safetyLevel", "SafetyLevel", true, "Highest safety level in the capability chain"],
                ["spanPages", "string[]", false, "Routes this capability spans across multiple pages"],
              ].map(([field, type, required, desc]) => (
                <tr key={String(field)}>
                  <td style={{ ...tdStyle, ...monoStyle }}>{field}</td>
                  <td style={{ ...tdStyle, ...monoStyle }}>{type}</td>
                  <td style={tdStyle}>
                    <span style={required ? reqStyle : optStyle}>
                      {required ? "required" : "optional"}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: "var(--docs-text-muted)" }}>
                    {desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CodeBlock code={capabilityExample} lang="typescript" />
      </section>

      {/* 8 — VhyxSealManifest */}
      <section>
        <h2 style={h2Style}>VhyxSealManifest</h2>
        <p style={descStyle}>
          The complete manifest served at{" "}
          <code
            style={{
              backgroundColor: "var(--docs-code-bg)",
              padding: "2px 5px",
              borderRadius: "4px",
              fontSize: "12px",
            }}
          >
            /__agent__/manifest.json
          </code>
          . Auto-generated — never hand-written. Contains all contracts,
          relationships, capabilities, and the site&apos;s agent access policy.
        </p>
        <CodeBlock
          code={manifestTs}
          lang="typescript"
          filename="packages/core/src/manifest/types.ts"
        />
        <CodeBlock code={manifestExample} lang="json" />
      </section>

      {/* 9 — AgentPolicy */}
      <section>
        <h2 style={h2Style}>AgentPolicy</h2>
        <p style={descStyle}>
          Access policy controlling which agents may act on a site. Site owners
          set this in{" "}
          <code
            style={{
              backgroundColor: "var(--docs-code-bg)",
              padding: "2px 5px",
              borderRadius: "4px",
              fontSize: "12px",
            }}
          >
            SealProvider config
          </code>
          . The default policy allows all agents with reasonable rate limits.
        </p>
        <CodeBlock
          code={agentPolicyTs}
          lang="typescript"
          filename="packages/core/src/manifest/types.ts"
        />
        <div style={{ overflowX: "auto", marginTop: "16px" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Field</th>
                <th style={thStyle}>Default</th>
                <th style={thStyle}>Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["allowedAgents", '["*"]', "Use specific agent identifiers to restrict access"],
                ["blockedAgents", "[]", "Patterns to explicitly block"],
                ["requireAgentIdentification", "false", "Agents must identify before acting"],
                ["allowedActions", '["*"]', "Restrict to specific intent ids"],
                ["blockedActions", "[]", "Explicitly blocked intent ids"],
                ["requiresConfirmation", "[]", "Intent ids always needing human confirmation"],
                ["requiresHumanPresent", "[]", "Intent ids needing verified human in loop"],
                ["manifestAccess", '"public"', "Set to private to require bearer token"],
              ].map(([field, def, desc]) => (
                <tr key={String(field)}>
                  <td style={{ ...tdStyle, ...monoStyle }}>{field}</td>
                  <td style={{ ...tdStyle, ...monoStyle, color: "var(--docs-text-muted)" }}>{def}</td>
                  <td style={{ ...tdStyle, color: "var(--docs-text-muted)" }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 10 — RateLimits */}
      <section id="rate-limits" style={{ paddingBottom: "0" }}>
        <h2 style={h2Style}>RateLimits</h2>
        <p style={descStyle}>
          Per-agent rate limits. Configured within{" "}
          <code
            style={{
              backgroundColor: "var(--docs-code-bg)",
              padding: "2px 5px",
              borderRadius: "4px",
              fontSize: "12px",
            }}
          >
            AgentPolicy.rateLimits
          </code>
          . Rate limit enforcement is schema-defined but not yet enforced by
          VhyxSeal middleware in 1.0.0-rc — see the Security guide for details.
        </p>
        <CodeBlock
          code={rateLimitsTs}
          lang="typescript"
          filename="packages/core/src/manifest/types.ts"
        />
        <div style={{ overflowX: "auto", marginTop: "16px" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Field</th>
                <th style={thStyle}>Default</th>
                <th style={thStyle}>Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["actionsPerMinute", "60", "Maximum agent actions per minute"],
                ["actionsPerHour", "500", "Maximum agent actions per hour"],
                ["manifestRequestsPerMinute", "10", "Maximum manifest fetches per minute"],
                ["perAgentSession", "true", "Apply limits per agent session (true) or globally (false)"],
              ].map(([field, def, desc]) => (
                <tr key={String(field)}>
                  <td style={{ ...tdStyle, ...monoStyle }}>{field}</td>
                  <td style={{ ...tdStyle, ...monoStyle, color: "var(--docs-text-muted)" }}>{def}</td>
                  <td style={{ ...tdStyle, color: "var(--docs-text-muted)" }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <PrevNext />
    </>
  );
}
