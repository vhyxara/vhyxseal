import { CodeBlock } from "../../../components/CodeBlock";
import { OnThisPage } from "../../../components/OnThisPage";
import { PrevNext } from "../../../components/PrevNext";

// ── Code block constants (exact from RFC-0001.md at repo root) ────────────

const defineContractCode = `import { defineContract } from '@vhyxseal/core'

const orderContract = defineContract({
  id: "checkout-submit-btn",
  type: "action",
  intent: "place-order",
  description: "Submits the current cart as a purchase order",
  requires: [
    { field: "user.authenticated", operator: "===", value: true, description: "User must be logged in" },
    { field: "cart.hasItems", operator: "===", value: true, description: "Cart must have at least one item" },
    { field: "user.hasPaymentMethod", operator: "===", value: true, description: "Payment method must be saved" }
  ],
  requiredPermissions: ["write:orders", "read:payment"],
  consequence: "Creates order record, charges payment method, triggers fulfillment",
  affects: ["cart", "orders", "payment", "inventory"],
  reversible: true,
  reversibleWindow: 300,
  safetyLevel: "high",
  requiresConfirmation: true,
  destructive: false,
  nextExpected: ["order-confirmation-display", "payment-error-display"],
  errorStates: [
    { trigger: "payment declined", display: "red banner with message payment failed", recovery: "navigate to update-payment-method input" }
  ],
  contractVersion: "1.0.0"
})`;

const registerIntentCode = `import { registerIntent } from '@vhyxseal/core'

registerIntent("request-refund", {
  safetyLevel: "high",
  reversible: false,
  requiresConfirmation: true,
  destructive: false,
})`;

const versionNegotiationHeaders = `vhyxseal-version: 1.0.0
vhyxseal-fallback: 0.9.0`;

const versionResponseHeaders = `X-VhyxSeal-Version: 1.0.0
X-VhyxSeal-Domain: example.com
Cache-Control: public, max-age=3600, stale-while-revalidate=86400
ETag: "{manifest fingerprint}"`;

const httpResponseRequirements = `Content-Type: application/json
Cache-Control: public, max-age=3600, stale-while-revalidate=86400
ETag: "{manifest fingerprint}"
X-VhyxSeal-Version: 1.0.0
X-VhyxSeal-Domain: example.com`;

const componentRegistrationCode = `// On mount
registerContract(contract)

// On unmount
unregisterContract(contract.id)`;

const generateManifestCode = `import { generateManifest } from '@vhyxseal/core'

const manifest = generateManifest(
  contractArray,
  {
    domain: "example.com",
    domainVerified: true,
    verificationToken: "...",
    agentPolicy: { ... }
  },
  mountedComponentIds  // Set<string> — output-time scoping
)`;

const contractSchemaCode = `/** Category of a UI component — determines how agents interpret and interact with it. */
export type ComponentType =
  | "action"        // buttons, triggers — does something
  | "input"         // forms, search, filters — collects data
  | "navigation"    // links, menus, tabs — moves somewhere
  | "display"       // shows current state — read only
  | "confirmation"; // gates a decision — dialogs, modals

/** How carefully an agent must proceed before interacting with a component. */
export type SafetyLevel =
  | "low"       // read, filter, sort — agent can proceed freely
  | "medium"    // send message, save draft — proceed with care
  | "high"      // place order, submit form — confirm with human
  | "critical"  // delete account, payment — always require human
  | "sensitive"; // medical, financial data — extra protections apply

/** A precondition that must be satisfied before an agent interacts with a component. */
export interface Condition {
  /** Abstract field reference — never expose internal data structure e.g. "user.hasPaymentMethod". */
  field: string;
  operator: "===" | "!==" | ">" | "<" | ">=" | "<=" | "includes" | "excludes";
  /** The value to compare against. */
  value: unknown;
  /** Human readable description e.g. "User must have a payment method saved". */
  description: string;
}

/** A known failure mode for a component and how an agent should recover from it. */
export interface ErrorState {
  /** What causes this error e.g. "payment declined". */
  trigger: string;
  /** What the UI shows e.g. "red banner with payment failed message". */
  display: string;
  /** What the agent should do e.g. "navigate to update-payment-method". */
  recovery: string;
}

/** A record of a change to a component contract — used by agents to detect breaking changes. */
export interface ContractChangelog {
  /** Semver version when this change was made e.g. "1.2.0". */
  version: string;
  /** ISO date string of when this change occurred. */
  date: string;
  /** Description of what changed. */
  change: string;
  /** True if agents relying on the previous contract behavior must update their logic. */
  breakingForAgents: boolean;
}

/**
 * The semantic contract for a single UI component.
 *
 * Describes what a component does, what conditions must be true before an agent
 * interacts with it, what consequences follow from interaction, and how safely
 * an agent must proceed.
 */
export interface ComponentContract {
  // IDENTITY
  /** Unique identifier for this component on the page. */
  id: string;
  /** Category of component — how agents interpret it. */
  type: ComponentType;
  /** Machine readable intent e.g. "place-order". */
  intent: string;
  /** Human readable explanation for agent reasoning. Max 500 characters. */
  description: string;

  // PRECONDITIONS
  /** Conditions that must all be satisfied before interaction. */
  requires: readonly Condition[];
  /** Permission scopes required e.g. ["write:orders", "read:payment"]. */
  requiredPermissions: readonly string[];

  // CONSEQUENCE
  /** Plain description of what changes after interaction. Max 300 characters. */
  consequence: string;
  /** System areas affected by this action e.g. ["cart", "orders"]. */
  affects: readonly string[];
  /** Whether this action can be undone. */
  reversible: boolean;
  /** Seconds within which the action can be undone. Only meaningful when reversible is true. */
  reversibleWindow?: number;

  // SAFETY
  /** How carefully the agent must proceed before interacting. */
  safetyLevel: SafetyLevel;
  /** Whether the agent must obtain human approval before acting. */
  requiresConfirmation: boolean;
  /** Whether this action permanently deletes or modifies data. */
  destructive: boolean;

  // AGENT NAVIGATION HINTS
  /** Component ids with similar function the agent can try if this one is unavailable. */
  alternatives?: readonly string[];
  /** Component ids typically interacted with after this one. */
  nextExpected?: readonly string[];
  /** Known failure modes and recovery paths. */
  errorStates?: readonly ErrorState[];

  // CONTRACT METADATA
  /** Developer managed semver e.g. "1.0.0". */
  contractVersion: string;
  /** Auto generated — hash of contract content. */
  fingerprint?: string;
  /** ISO date — when this contract was last confirmed against component behavior. */
  lastVerified?: string;
  verifiedBy?: "auto" | "manual" | "test";
  changelog?: readonly ContractChangelog[];
}`;

const relationshipSchemaCode = `/** The three categories of relationship between components. */
export type RelationshipType = "composition" | "sequence" | "dependency";

/**
 * A composition relationship — components that belong together structurally.
 */
export interface CompositionRelationship {
  type: "composition";
  /** Unique identifier for this relationship. */
  id: string;
  /** Component id of the parent. */
  parent: string;
  /** Component ids of children in order. */
  children: readonly string[];
  /** Child component ids that must be valid before the parent can act. */
  completionRequires: readonly string[];
  description: string;
}

/** A single step in a sequence relationship. */
export interface SequenceStep {
  /** Position of this step in the sequence — starts at 1. */
  order: number;
  /** Component id at this step. */
  componentId: string;
  /** Whether the agent can skip this step. */
  canSkip: boolean;
  /** Condition string under which this step can be skipped. Only meaningful when canSkip is true. */
  skipCondition?: string;
  /** Component id to navigate to on successful completion of this step. */
  onComplete: string;
  /** Component id to navigate to when this step fails. */
  onFail: string;
}

/**
 * A sequence relationship — components with a defined order or flow.
 */
export interface SequenceRelationship {
  type: "sequence";
  /** Unique identifier for this relationship. */
  id: string;
  description: string;
  steps: readonly SequenceStep[];
  /** True if the agent must follow exact step order. False if steps can be skipped or reordered. */
  linear: boolean;
}

/** The effect that one component's state has on another component. */
export type DependencyEffect =
  | "enables"
  | "disables"
  | "shows"
  | "hides"
  | "modifies";

/**
 * A dependency relationship — one component's state gates another's behavior.
 */
export interface DependencyRelationship {
  type: "dependency";
  /** Unique identifier for this relationship. */
  id: string;
  /** Component id whose state matters. */
  source: string;
  /** Component id affected by the source component's state. */
  target: string;
  /** The specific condition being evaluated on the source component. */
  condition: Condition;
  /** How the target component is affected when the condition is met. */
  effect: DependencyEffect;
  description: string;
}

/** A relationship between components — composition, sequence, or dependency. */
export type Relationship =
  | CompositionRelationship
  | SequenceRelationship
  | DependencyRelationship;`;

const capabilitySchemaCode = `/** One possible end state of a capability — success, failure, or cancellation. */
export interface ExitPoint {
  /** Component id where this exit point is reached. */
  componentId: string;
  outcome: "success" | "failure" | "cancelled";
  description: string;
}

/** A reference to a relationship that is part of a capability. */
export interface CapabilityRelationshipRef {
  type: RelationshipType;
  ref: Relationship;
}

/**
 * A capability — a complete user-facing goal an agent can accomplish on a site.
 */
export interface Capability {
  /** Unique identifier e.g. "purchase-item". */
  id: string;
  /** Human and agent readable description e.g. "browse, select and purchase a product". */
  description: string;
  /** Component id where the agent starts this capability. */
  entryPoint: string;
  /** All possible end states — success, failure, and cancellation paths. */
  exitPoints: readonly ExitPoint[];
  relationships: readonly CapabilityRelationshipRef[];
  /** Approximate number of steps — helps agent plan before executing. */
  estimatedSteps: number;
  /** Whether the user must be authenticated to complete this capability. */
  requiresAuth: boolean;
  /** Highest safety level anywhere in the capability chain. */
  safetyLevel: SafetyLevel;
  /** Routes this capability spans when it crosses multiple pages. */
  spanPages?: readonly string[];
}`;

const manifestSchemaCode = `/** Per-agent action and manifest request rate limits. */
export interface RateLimits {
  actionsPerMinute: number;
  actionsPerHour: number;
  manifestRequestsPerMinute: number;
  perAgentSession: boolean;
}

/**
 * Access policy controlling which agents may act on a site and what they may do.
 * Site owners set this. \`manifestAuth\` is only meaningful when \`manifestAccess\` is \`"private"\`.
 */
export interface AgentPolicy {
  /** Agent identifiers allowed. Use \`["*"]\` for all agents. */
  allowedAgents: readonly string[];
  /** Agent identifier patterns to block. */
  blockedAgents: readonly string[];
  /** Whether agents must identify themselves before acting. */
  requireAgentIdentification: boolean;
  rateLimits: RateLimits;
  /** Intent ids the agent is allowed to execute. Use \`["*"]\` for all. */
  allowedActions: readonly string[];
  /** Intent ids the agent is explicitly blocked from executing. */
  blockedActions: readonly string[];
  /** Intent ids that always require human confirmation regardless of contract settings. */
  requiresConfirmation: readonly string[];
  /** Intent ids that require a verified human to be present in the loop. */
  requiresHumanPresent: readonly string[];
  manifestAccess: "public" | "private";
  /** Authentication scheme required when \`manifestAccess\` is \`"private"\`. */
  manifestAuth?: "bearer-token";
}

/**
 * The complete VhyxSeal manifest for a page or site.
 * Auto-generated — never hand-written. Served at \`/__agent__/manifest.json\`.
 */
export interface VhyxSealManifest {
  // Schema identification
  /** VhyxSeal schema version this manifest conforms to e.g. "1.0.0". */
  vhyxseal: string;
  /** Permanent URL to the schema definition for this version. */
  schemaUrl: string;

  // Site identification
  /** Verified domain this manifest belongs to e.g. "example.com". */
  domain: string;
  domainVerified: boolean;
  /** Verification token issued by the VhyxSeal registry after domain ownership confirmation. */
  verificationToken: string;

  // Integrity
  /** HMAC-SHA256 signature of the manifest content. */
  signature: string;
  /** ISO datetime when the manifest was signed. */
  signedAt: string;
  /** Deterministic content fingerprint for drift detection. NOT a cryptographic signature. */
  fingerprint: string;

  // Content
  capabilities: readonly Capability[];
  components: readonly ComponentContract[];
  relationships: readonly Relationship[];

  // Policy
  agentPolicy: AgentPolicy;

  // Cache and freshness
  /** ISO datetime when this manifest was generated. */
  generatedAt: string;
  /** ISO datetime after which agents should re-fetch the manifest. */
  expiresAt: string;
}`;

const errorSystemCode = `/**
 * Severity of a VhyxSeal error.
 * Errors at any severity level never crash the visual layer.
 */
export type ErrorSeverity =
  | "fatal"   // stops everything — invalid schema, corrupt manifest
  | "error"   // this component broken — contract invalid, field wrong
  | "warning" // degraded experience — contract inferred not specified
  | "info";   // informational — new fields available in newer version

/**
 * All VhyxSeal error codes.
 * SCREAMING_SNAKE_CASE. Every code prefixed with VHYX_.
 * Never remove or rename codes — agents and tooling may depend on them.
 */
export enum ErrorCode {
  // Schema errors
  VHYX_INVALID_SCHEMA_VERSION = "VHYX_INVALID_SCHEMA_VERSION",
  VHYX_CONTRACT_VALIDATION_FAILED = "VHYX_CONTRACT_VALIDATION_FAILED",
  VHYX_UNKNOWN_INTENT = "VHYX_UNKNOWN_INTENT",
  VHYX_INVALID_SAFETY_LEVEL = "VHYX_INVALID_SAFETY_LEVEL",
  VHYX_FIELD_TOO_LONG = "VHYX_FIELD_TOO_LONG",
  VHYX_INJECTION_DETECTED = "VHYX_INJECTION_DETECTED",

  // Manifest errors
  VHYX_MANIFEST_GENERATION_FAILED = "VHYX_MANIFEST_GENERATION_FAILED",
  VHYX_MANIFEST_SIGNING_FAILED = "VHYX_MANIFEST_SIGNING_FAILED",
  VHYX_MANIFEST_VERIFICATION_FAILED = "VHYX_MANIFEST_VERIFICATION_FAILED",
  VHYX_DOMAIN_MISMATCH = "VHYX_DOMAIN_MISMATCH",

  // Contract errors
  VHYX_CONTRACT_DRIFT_DETECTED = "VHYX_CONTRACT_DRIFT_DETECTED",
  VHYX_CONTRACT_STALE = "VHYX_CONTRACT_STALE",
  VHYX_DUPLICATE_COMPONENT_ID = "VHYX_DUPLICATE_COMPONENT_ID",
  VHYX_DUPLICATE_INTENT = "VHYX_DUPLICATE_INTENT",

  // Relationship errors
  VHYX_INVALID_RELATIONSHIP = "VHYX_INVALID_RELATIONSHIP",
  VHYX_CIRCULAR_DEPENDENCY = "VHYX_CIRCULAR_DEPENDENCY",
  VHYX_MISSING_COMPONENT_REF = "VHYX_MISSING_COMPONENT_REF",

  // Security errors
  VHYX_RATE_LIMIT_EXCEEDED = "VHYX_RATE_LIMIT_EXCEEDED",
  VHYX_TOKEN_EXPIRED = "VHYX_TOKEN_EXPIRED",
  VHYX_TOKEN_ALREADY_USED = "VHYX_TOKEN_ALREADY_USED",
  VHYX_AGENT_NOT_ALLOWED = "VHYX_AGENT_NOT_ALLOWED",
}

/** Configuration object passed to the VhyxSealError constructor. */
export interface VhyxSealErrorConfig {
  /** Error code from the ErrorCode enum — machine readable identifier. */
  code: ErrorCode;
  /** Human readable description of what went wrong. */
  message: string;
  /** Structured context relevant to this specific error instance. */
  context: Record<string, unknown>;
  /** How severe this error is — determines library and DevTools response. */
  severity: ErrorSeverity;
  /** Whether the caller can recover from this error and continue. */
  recoverable: boolean;
  /** Concrete action the developer should take to fix this error. */
  suggestion: string;
}

/**
 * The base error class for all errors thrown by VhyxSeal.
 * All VhyxSeal packages throw this class — never a plain Error.
 */
export class VhyxSealError extends Error {
  readonly code: ErrorCode;
  readonly context: Record<string, unknown>;
  readonly severity: ErrorSeverity;
  readonly recoverable: boolean;
  readonly suggestion: string;

  constructor(config: VhyxSealErrorConfig) { /* ... */ }
}`;

// ── Shared table styles ────────────────────────────────────────────────────

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginBottom: "24px",
  fontSize: "14px",
};

const thStyle: React.CSSProperties = {
  padding: "10px 14px",
  textAlign: "left",
  borderBottom: "1px solid var(--docs-border)",
  backgroundColor: "var(--docs-surface)",
  color: "var(--docs-text)",
  fontWeight: 600,
  fontSize: "13px",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderBottom: "1px solid var(--docs-border)",
  color: "var(--docs-text)",
  verticalAlign: "top",
};

const codeInlineStyle: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "12px",
  backgroundColor: "var(--docs-surface)",
  padding: "2px 6px",
  borderRadius: "4px",
  color: "var(--docs-text)",
};

const h2Style: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  color: "var(--docs-text)",
  marginBottom: "16px",
  marginTop: "48px",
  paddingTop: "24px",
  borderTop: "1px solid var(--docs-border)",
};

const h3Style: React.CSSProperties = {
  fontSize: "17px",
  fontWeight: 600,
  color: "var(--docs-text)",
  marginBottom: "12px",
  marginTop: "32px",
};

const pStyle: React.CSSProperties = {
  color: "var(--docs-text)",
  lineHeight: 1.7,
  marginBottom: "16px",
};

const ulStyle: React.CSSProperties = {
  paddingLeft: "20px",
  marginBottom: "16px",
  color: "var(--docs-text)",
  lineHeight: 1.7,
};

export default async function Rfc0001Page(): Promise<React.ReactElement> {
  return (
    <div>
      <OnThisPage />
      {/* ── RFC Header block ─────────────────────────────────────────── */}
      <div
        style={{
          padding: "16px 20px",
          backgroundColor: "var(--docs-surface)",
          border: "1px solid var(--docs-border)",
          borderRadius: "8px",
          marginBottom: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <p
              style={{
                fontWeight: 700,
                fontSize: "14px",
                color: "var(--docs-text)",
                marginBottom: "4px",
                margin: 0,
              }}
            >
              RFC-0001 — VhyxSeal Semantic Contract Layer
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "var(--docs-text-muted)",
                marginTop: "4px",
                marginBottom: 0,
              }}
            >
              Status:{" "}
              <span
                style={{
                  color: "var(--vhyxseal-color-info)",
                  fontWeight: 600,
                }}
              >
                OPEN FOR COMMENT
              </span>
              {" · "}Comment period: 30 days minimum from 2026-05-27
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <a
              href="https://github.com/vhyxara/vhyxseal/discussions"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "8px 16px",
                backgroundColor: "var(--vhyxseal-color-full)",
                color: "white",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Open Discussion ↗
            </a>
            <a
              href="https://github.com/vhyxara/vhyxseal/blob/main/RFC-0001.md"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "8px 16px",
                border: "1px solid var(--docs-border)",
                color: "var(--docs-text)",
                borderRadius: "6px",
                fontSize: "13px",
                textDecoration: "none",
              }}
            >
              View on GitHub ↗
            </a>
          </div>
        </div>
      </div>

      {/* ── Title ─────────────────────────────────────────────────────── */}
      <h1
        style={{
          fontSize: "32px",
          fontWeight: 800,
          color: "var(--docs-text)",
          marginBottom: "8px",
        }}
      >
        RFC-0001: VhyxSeal Semantic Contract Layer
      </h1>
      <p
        style={{
          fontSize: "14px",
          color: "var(--docs-text-muted)",
          marginBottom: "40px",
        }}
      >
        Version 1.0.0-rc.1 · Published 2026-05-27 · Repository:{" "}
        <a
          href="https://github.com/vhyxara/vhyxseal"
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/vhyxara/vhyxseal
        </a>
      </p>

      {/* ── Table of Contents ─────────────────────────────────────────── */}
      <div
        style={{
          padding: "20px 24px",
          backgroundColor: "var(--docs-surface)",
          border: "1px solid var(--docs-border)",
          borderRadius: "8px",
          marginBottom: "48px",
        }}
      >
        <p
          style={{
            fontWeight: 600,
            fontSize: "13px",
            color: "var(--docs-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "12px",
            margin: 0,
            paddingBottom: "12px",
          }}
        >
          Table of Contents
        </p>
        <ol
          style={{
            paddingLeft: "20px",
            margin: 0,
            color: "var(--docs-text)",
            fontSize: "14px",
            lineHeight: 2,
          }}
        >
          <li><a href="#abstract">Abstract</a></li>
          <li><a href="#prior-art">Prior Art and Differentiation</a></li>
          <li><a href="#motivation">Motivation</a></li>
          <li><a href="#contract-model">The Contract Model</a></li>
          <li><a href="#manifest">The Manifest</a></li>
          <li><a href="#security-model">Security Model</a></li>
          <li><a href="#framework-guide">Framework Implementation Guide</a></li>
          <li><a href="#compliance-levels">Compliance Levels</a></li>
          <li><a href="#versioning">Versioning Commitment</a></li>
          <li><a href="#not-in-rfc">What Is Not In This RFC</a></li>
          <li><a href="#rfc-process">RFC Process</a></li>
          <li><a href="#reference">Reference</a></li>
        </ol>
      </div>

      {/* ── Section 1: Abstract ────────────────────────────────────────── */}
      <h2 id="abstract" style={h2Style}>1. Abstract</h2>
      <p style={pStyle}>
        VhyxSeal is a framework-agnostic semantic contract layer for the web — a standard that
        gives every UI component a machine-readable declaration of what it does, what must be
        true before it can be used, what changes after it is used, and how safely an automated
        agent must proceed. It is not a component library. It is not a framework. It is the
        missing contract layer that makes web interfaces readable, navigable, and safe for both
        humans and AI agents simultaneously — without replacing or altering anything that already exists.
      </p>
      <p style={pStyle}>
        This document specifies VhyxSeal version 1.0.0-rc.1. It is addressed to three audiences:
        framework authors who will build adapters on top of the specification, application developers
        who will attach contracts to their components, and AI agent developers who will consume
        contracts to act on behalf of users. The specification is open for public comment for a
        minimum of 30 days from the published date above. All feedback is reviewed by Vhyxara
        Leadership before a final 1.0.0 release decision is made.
      </p>

      {/* ── Section 1.5: Prior Art ─────────────────────────────────────── */}
      <h2 id="prior-art" style={h2Style}>1.5. Prior Art and Differentiation</h2>
      <p style={pStyle}>
        Several existing standards address adjacent problems. This section acknowledges each honestly.
      </p>
      <p style={pStyle}>
        <strong>Schema.org structured data</strong> gives pages machine-readable metadata about
        their content — articles, products, events, organizations. Search engines and knowledge
        graphs consume it. It solves content description well. It does not address interactive
        component behavior: there is no schema.org type for "this button places a purchase order
        that is reversible within 5 minutes and requires payment method confirmation". Schema.org
        describes what a page <em>contains</em>. VhyxSeal describes what a page <em>can do</em>.
      </p>
      <p style={pStyle}>
        <strong>OpenGraph</strong> solves a specific and valuable problem: telling social platforms
        how to render a preview of a URL. It has no notion of interactive components, agent
        authorization, safety levels, or action confirmation requirements. It is a metadata layer
        for passive display. VhyxSeal is a contract layer for active interaction.
      </p>
      <p style={pStyle}>
        <strong>ARIA and the accessibility tree</strong> give assistive technologies the information
        they need to navigate and describe UI to users with disabilities. ARIA is a human-assistive
        standard. It tells a screen reader what a button{"'"}s label is. It does not tell an AI agent
        whether clicking that button will charge a credit card, whether a human must confirm first,
        or what the agent should do if the action fails. VhyxSeal builds on the semantic intent that
        ARIA establishes and extends it into the domain of agent safety and action authorization.
      </p>
      <p style={pStyle}>
        <strong>Browser computer use — screenshot-based agents</strong> can click buttons on any
        website without any standard at all. They operate by looking at screenshots and inferring
        intent from appearance. This works, up to a point. The problem is not whether agents{" "}
        <em>can</em> act — they already can. The problem is whether they can act <em>correctly</em>.
        An agent clicking "Confirm" from a screenshot has no way to know whether that action places
        a $500 order, saves a draft, or verifies an email address. VhyxSeal does not replace
        screenshot-based agents. It gives the button a voice — not a visual, a semantic contract.
        An agent that reads a contract before acting knows the intent, the preconditions, the
        consequences, and the safety level before it touches anything.
      </p>
      <p style={pStyle}>
        None of these approaches are wrong. Each solves a real problem in its domain. VhyxSeal is
        additive. It sits alongside Schema.org, OpenGraph, and ARIA as a fourth layer — one designed
        specifically for the era of AI agents acting on behalf of humans.
      </p>

      {/* ── Section 2: Motivation ──────────────────────────────────────── */}
      <h2 id="motivation" style={h2Style}>2. Motivation</h2>
      <p style={pStyle}>
        An agent lands on a checkout page. It is helping a user complete a purchase. The page has a
        button labeled "Confirm". The agent has no additional information about what this button does.
        It could place a $500 order, finalize an address, save the cart as a draft, or confirm an
        email subscription. The agent acts. It places the $500 order when the user wanted to save a
        draft. The cost is real — a charge the user did not intend, a support ticket, a refund
        process. This is not a hypothetical. Every agent operating on web UI today faces this problem,
        on every page, with every interactive element whose purpose is not encoded in its label.
      </p>
      <p style={pStyle}>
        The problem compounds as agents become more capable. A less capable agent operating cautiously
        on a narrow set of tasks causes limited damage when it misunderstands a button. A highly capable
        agent, trusted with more consequential actions across a broader surface area, causes far more
        damage when it misunderstands the same button. Increased capability without increased semantic
        clarity does not reduce risk — it amplifies it. The gap between what agents can do and what
        they should do grows wider every time a new model is released without a corresponding
        improvement in the information available to them at the point of action.
      </p>
      <p style={pStyle}>
        The API world solved this problem a decade ago. Before OpenAPI, every API was a black box.
        You read documentation if it existed, you made requests and observed responses, and your
        integrations broke whenever the undocumented behavior changed. OpenAPI did not make APIs
        smarter. It did not add new capabilities to existing APIs. It gave them a contract — a
        machine-readable declaration of what each endpoint does, what parameters it accepts, what it
        returns, and what can go wrong. Consumers could understand what an API did before calling it.
        VhyxSeal does the same thing for UI components. It does not change what the button does.
        It gives the button a contract.
      </p>
      <p style={pStyle}>
        Without a standard, every framework builds its own agent integration and every agent must
        carry framework-specific knowledge to navigate. A React-based site requires one approach, a
        Vue-based site requires another, a server-rendered site with no framework requires a third.
        The web fragments into agent-readable islands and opaque surfaces, and the islands speak
        different dialects. This is the trajectory of a web without a contract standard. Standards
        work when they are adopted early, before fragmentation is entrenched. VhyxSeal is early.
      </p>

      {/* ── Section 3: The Contract Model ─────────────────────────────── */}
      <h2 id="contract-model" style={h2Style}>3. The Contract Model</h2>
      <p style={pStyle}>
        A component contract is a machine-readable declaration attached to a single UI component.
        It answers four questions an agent needs answered before acting:
      </p>
      <ul style={ulStyle}>
        <li><strong>Intent</strong>: What does this component do? (<code style={codeInlineStyle}>place-order</code>, <code style={codeInlineStyle}>delete-item</code>, <code style={codeInlineStyle}>search</code>)</li>
        <li><strong>Preconditions</strong>: What must be true before an agent can interact? (user authenticated, cart non-empty, payment method saved)</li>
        <li><strong>Consequences</strong>: What changes after interaction? (order created, payment charged, data deleted)</li>
        <li><strong>Safety</strong>: How carefully must the agent proceed? (low → high → critical → sensitive)</li>
      </ul>
      <p style={pStyle}>
        Contracts are declared by developers and consumed by agents. The visual component renders
        exactly as it does today — the contract runs alongside it without modifying any existing behavior.
      </p>

      <h3 id="four-adoption-levels" style={h3Style}>The Four Adoption Levels</h3>
      <p style={pStyle}>
        VhyxSeal is designed for progressive adoption. Each level adds value independently. No level
        is a prerequisite for the next.
      </p>
      <p style={pStyle}>
        <strong>Level 0 — Zero Effort.</strong> The library infers a contract from HTML semantics,
        element type, ARIA labels, and text content. No developer action required. An inferred
        contract is imprecise but actionable — an agent knows more than it would from the raw DOM
        alone. DevTools marks inferred contracts with a yellow indicator.
      </p>
      <p style={pStyle}>
        <strong>Level 1 — Single Intent Prop.</strong> The developer provides one{" "}
        <code style={codeInlineStyle}>intent</code> string. The library looks up the intent in the
        built-in vocabulary and fills in safety level, confirmation requirements, and reversibility
        from known defaults. One prop turns an opaque button into a partially-specified contract.
      </p>
      <p style={pStyle}>
        <strong>Level 2 — Partial Overrides.</strong> The developer provides an{" "}
        <code style={codeInlineStyle}>intent</code> and overrides specific fields — preconditions,
        safety level, reversible window. The library merges overrides with vocabulary defaults.
        Fields not specified still come from the vocabulary.
      </p>
      <p style={pStyle}>
        <strong>Level 3 — Full Contract.</strong> The developer calls{" "}
        <code style={codeInlineStyle}>defineContract()</code> with a complete contract object. The
        result is frozen, fingerprinted, versioned, and fully specified. DevTools marks these green.
        Agents have maximum information. This is the pattern for high-safety components where
        precision matters.
      </p>
      <div style={{ marginBottom: "24px" }}>
        <CodeBlock code={defineContractCode} lang="typescript" />
      </div>

      <h3 id="intent-vocabulary-section" style={h3Style}>The Intent Vocabulary</h3>
      <p style={pStyle}>
        The intent vocabulary is a built-in dictionary of 25 common user actions, each mapped to
        sensible defaults for safety level, reversibility, confirmation requirements, and
        destructiveness. When a developer provides an intent string, the library resolves these
        defaults automatically.
      </p>
      <p style={pStyle}>
        The vocabulary is extensible. Developers register domain-specific intents using{" "}
        <code style={codeInlineStyle}>registerIntent()</code>:
      </p>
      <div style={{ marginBottom: "24px" }}>
        <CodeBlock code={registerIntentCode} lang="typescript" />
      </div>
      <p style={pStyle}>
        Community contributions to the vocabulary are accepted through the standard RFC process.
      </p>

      <h3 id="relationship-system" style={h3Style}>The Relationship System</h3>
      <p style={pStyle}>
        Individual contracts describe single components. The relationship system describes how
        components connect to form flows. Three relationship types cover all cases.
      </p>
      <p style={pStyle}>
        <strong>Composition</strong> — components that belong together structurally. A form and its
        fields. The parent cannot complete its action until specified children are in a valid state.
      </p>
      <p style={pStyle}>
        <strong>Sequence</strong> — components with a defined order. A checkout flow: cart → shipping
        → payment → confirmation. Each step declares what happens on success and what happens on
        failure. Steps can be marked as skippable under defined conditions.
      </p>
      <p style={pStyle}>
        <strong>Dependency</strong> — one component{"'"}s state gates another{"'"}s behavior. A payment
        method input that enables the checkout button. The dependency specifies the condition evaluated
        on the source component and the effect produced on the target: enables, disables, shows, hides,
        or modifies.
      </p>
      <p style={pStyle}>
        Relationships are defined using{" "}
        <code style={codeInlineStyle}>defineRelationship()</code> and{" "}
        <code style={codeInlineStyle}>defineSequence()</code>.
      </p>

      <h3 id="capability-system" style={h3Style}>The Capability System</h3>
      <p style={pStyle}>
        Capabilities are the highest level of abstraction — what agents actually think in. An agent
        thinks "I want to purchase this item", not "click button id checkout-btn". A capability
        groups the components and relationships that together fulfill a user-facing goal.
      </p>
      <p style={pStyle}>
        <code style={codeInlineStyle}>defineCapability()</code> creates a capability with an entry
        point, all possible exit points (success, failure, cancelled), the relationships involved,
        an estimated step count to help agents plan, and a safety level reflecting the highest safety
        level anywhere in the capability chain.
      </p>
      <p style={pStyle}>
        When a capability spans multiple pages — for example, a checkout that runs across{" "}
        <code style={codeInlineStyle}>/cart</code>,{" "}
        <code style={codeInlineStyle}>/checkout</code>, and{" "}
        <code style={codeInlineStyle}>/confirmation</code> — each page manifest references the
        capability id and declares the current page{"'"}s position in the sequence.
      </p>

      <h3 id="safety-levels" style={h3Style}>Safety Levels</h3>
      <p style={pStyle}>
        Safety levels determine how cautiously an agent must proceed:
      </p>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Level</th>
            <th style={thStyle}>When Used</th>
            <th style={thStyle}>Agent Behavior</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}><code style={codeInlineStyle}>low</code></td>
            <td style={tdStyle}>Read, filter, sort, navigate</td>
            <td style={tdStyle}>Agent may proceed freely</td>
          </tr>
          <tr>
            <td style={tdStyle}><code style={codeInlineStyle}>medium</code></td>
            <td style={tdStyle}>Send message, save draft, update profile</td>
            <td style={tdStyle}>Agent proceeds with care</td>
          </tr>
          <tr>
            <td style={tdStyle}><code style={codeInlineStyle}>high</code></td>
            <td style={tdStyle}>Place order, publish content, cancel booking</td>
            <td style={tdStyle}>Agent should confirm with human</td>
          </tr>
          <tr>
            <td style={tdStyle}><code style={codeInlineStyle}>critical</code></td>
            <td style={tdStyle}>Delete account, make payment</td>
            <td style={tdStyle}>Agent must always require human confirmation</td>
          </tr>
          <tr>
            <td style={tdStyle}><code style={codeInlineStyle}>sensitive</code></td>
            <td style={tdStyle}>Collect password, collect payment info</td>
            <td style={tdStyle}>Extra protections apply — structural trust required</td>
          </tr>
        </tbody>
      </table>
      <p style={pStyle}>
        Agents must treat <code style={codeInlineStyle}>critical</code> and{" "}
        <code style={codeInlineStyle}>sensitive</code> components as requiring human presence in the
        loop regardless of other contract settings.
      </p>

      {/* ── Section 4: The Manifest ────────────────────────────────────── */}
      <h2 id="manifest" style={h2Style}>4. The Manifest</h2>
      <p style={pStyle}>
        The manifest is a page-level aggregation of all registered component contracts. It is
        auto-generated from the contracts on the page — never hand-written. Agents fetch the manifest
        before acting to understand everything a page can do.
      </p>

      <h3 id="manifest-url" style={h3Style}>The <code style={codeInlineStyle}>/__agent__/manifest.json</code> Convention</h3>
      <p style={pStyle}>
        Every VhyxSeal-enabled site serves its manifest at{" "}
        <code style={codeInlineStyle}>/__agent__/manifest.json</code>. This is the canonical URL.
        Agents know where to look without any site-specific configuration.
      </p>
      <p style={pStyle}>
        The manifest is served via a URL rewrite, making the convention framework-transparent. For
        Next.js, <code style={codeInlineStyle}>@vhyxseal/nextjs</code> automatically injects the
        rewrite from <code style={codeInlineStyle}>/__agent__/manifest.json</code> to the
        framework{"'"}s actual handler route. Agents and tools built against the spec require no
        framework-specific knowledge.
      </p>

      <h3 id="version-negotiation" style={h3Style}>Version Negotiation</h3>
      <p style={pStyle}>
        Agents include version preference headers in their manifest request:
      </p>
      <div style={{ marginBottom: "16px" }}>
        <CodeBlock code={versionNegotiationHeaders} lang="text" />
      </div>
      <p style={pStyle}>
        The site applies a four-step fallback algorithm:
      </p>
      <ol style={{ ...ulStyle, paddingLeft: "24px" }}>
        <li><strong>Exact match</strong> — the requested version is available. Return it.</li>
        <li><strong>Compatible</strong> — same major version, served minor ≥ requested minor. Return with compatibility note.</li>
        <li><strong>Fallback</strong> — serve the highest version compatible with the fallback header.</li>
        <li><strong>Incompatible</strong> — no compatible version available. Return degradation message.</li>
      </ol>
      <p style={pStyle}>The response includes:</p>
      <div style={{ marginBottom: "24px" }}>
        <CodeBlock code={versionResponseHeaders} lang="text" />
      </div>

      <h3 id="manifest-structure" style={h3Style}>Manifest Structure</h3>
      <p style={pStyle}>
        The full manifest structure is defined in{" "}
        <a href="#reference">Section 10</a>. The top-level fields are:
      </p>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Field</th>
            <th style={thStyle}>Description</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["vhyxseal", "Schema version this manifest conforms to, e.g. \"1.0.0\""],
            ["schemaUrl", "Permanent URL to the schema definition for this version"],
            ["domain", "Verified domain this manifest belongs to"],
            ["domainVerified", "Whether domain ownership has been confirmed"],
            ["verificationToken", "Token issued by the VhyxSeal registry after domain confirmation"],
            ["signature", "HMAC-SHA256 signature of the manifest content"],
            ["signedAt", "ISO datetime of signing"],
            ["fingerprint", "Deterministic content hash for drift detection"],
            ["capabilities", "All capabilities defined on this page"],
            ["components", "All component contracts registered on this page"],
            ["relationships", "All relationships between components"],
            ["agentPolicy", "Site owner's access policy for agents"],
            ["generatedAt", "ISO datetime of generation"],
            ["expiresAt", "ISO datetime after which agents should re-fetch"],
          ].map(([field, desc]) => (
            <tr key={field}>
              <td style={tdStyle}><code style={codeInlineStyle}>{field}</code></td>
              <td style={tdStyle}>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 id="manifest-signing" style={h3Style}>Manifest Signing</h3>
      <p style={pStyle}>
        Manifests are signed using HMAC-SHA256. The HMAC input is the JSON-serialized manifest with
        the <code style={codeInlineStyle}>signature</code> and{" "}
        <code style={codeInlineStyle}>signedAt</code> fields excluded — this is the standard pattern
        for self-describing signed documents.
      </p>
      <p style={pStyle}>
        Agents must verify the signature before trusting any contract data in the manifest. Signature
        failure means rejecting the entire manifest and applying maximum safety defaults.
      </p>
      <p style={pStyle}>
        Signing requires a key registered with{" "}
        <code style={codeInlineStyle}>@vhyxseal/core</code>{"'"}s key management module. Public
        verification is performed using the same key. Key rotation is supported — tokens issued
        before rotation remain verifiable because the signing key ID is stored at issuance time.
      </p>

      <h3 id="http-response" style={h3Style}>HTTP Response Requirements</h3>
      <div style={{ marginBottom: "24px" }}>
        <CodeBlock code={httpResponseRequirements} lang="text" />
      </div>

      {/* ── Section 5: Security Model ──────────────────────────────────── */}
      <h2 id="security-model" style={h2Style}>5. Security Model</h2>
      <p style={pStyle}>
        VhyxSeal sits between AI agents and the websites they act on. This position requires a
        serious and layered security posture built in from the beginning, not added later.
      </p>

      <h3 id="threat-model" style={h3Style}>Threat Model</h3>
      <p style={pStyle}>The threats this specification addresses:</p>
      <ul style={ulStyle}>
        <li><strong>Prompt injection via contract fields</strong> — a malicious actor embedding agent-manipulating instructions in contract string fields (description, consequence, intent)</li>
        <li><strong>Manifest tampering</strong> — an attacker modifying the manifest in transit or at rest to misrepresent what components do</li>
        <li><strong>Replay attacks on action tokens</strong> — an attacker capturing and re-submitting an action token to trigger an action multiple times</li>
        <li><strong>Domain spoofing</strong> — a manifest claiming to belong to a domain it does not actually serve</li>
        <li><strong>Agent abuse via missing rate limits</strong> — agents hammering the manifest endpoint or executing actions at unlimited rate</li>
      </ul>

      <h3 id="defenses" style={h3Style}>Defenses</h3>
      <p style={pStyle}>
        <strong>Injection detection.</strong> All contract string fields pass through a sanitization
        layer before the manifest is generated. The library checks against 14 injection pattern
        categories covering known prompt injection signatures. Fields that fail sanitization are
        rejected; the affected contract is excluded from the manifest and a typed error is emitted.
      </p>
      <p style={pStyle}>
        <strong>Field length limits.</strong> Hard limits are enforced on all string fields:
      </p>
      <ul style={ulStyle}>
        <li><code style={codeInlineStyle}>description</code>: 500 characters maximum</li>
        <li><code style={codeInlineStyle}>intent</code>: 50 characters maximum</li>
        <li><code style={codeInlineStyle}>consequence</code>: 300 characters maximum</li>
        <li><code style={codeInlineStyle}>condition.description</code>: 200 characters maximum</li>
      </ul>
      <p style={pStyle}>
        <strong>Structural trust over textual trust.</strong> Agent safety decisions must derive from
        the typed fields — <code style={codeInlineStyle}>safetyLevel</code>,{" "}
        <code style={codeInlineStyle}>requiresConfirmation</code>,{" "}
        <code style={codeInlineStyle}>destructive</code> — not from the text of{" "}
        <code style={codeInlineStyle}>description</code> or{" "}
        <code style={codeInlineStyle}>consequence</code>. This is documented in the agent SDK. No
        agent implementation should make safety decisions based solely on free-text fields.
      </p>
      <p style={pStyle}>
        <strong>Manifest integrity.</strong> Every manifest is HMAC-SHA256 signed. Agents verify
        the signature before reading any contract data. A failed signature means reject and default
        to maximum safety.
      </p>
      <p style={pStyle}>
        <strong>Action tokens.</strong> Every agent action generates a single-use cryptographic token.
        The token expires in 60 seconds and is consumed on first use. A replay attempt fails because
        the token is either expired or already marked used. Verification executes six ordered checks:
        token existence, expiry, contract ID match, component ID match, intent match, used-flag check
        and atomic mark.
      </p>
      <p style={pStyle}>
        <strong>Domain binding.</strong> Manifests are cryptographically bound to their verified domain
        using HMAC-signed verification tokens. An agent receiving a manifest for{" "}
        <code style={codeInlineStyle}>example.com</code> verifies that the manifest{"'"}s domain token
        was issued for <code style={codeInlineStyle}>example.com</code> before trusting any contract
        within it.
      </p>
      <p style={pStyle}>
        <strong>Agent policy defaults.</strong> The{" "}
        <code style={codeInlineStyle}>agentPolicy</code> field in every manifest gives site owners
        explicit control over which agents may act and what they may do. The default policy allows
        all agents with reasonable rate limits. Site owners who want stricter controls can specify{" "}
        <code style={codeInlineStyle}>allowedAgents</code>,{" "}
        <code style={codeInlineStyle}>blockedAgents</code>,{" "}
        <code style={codeInlineStyle}>blockedActions</code>,{" "}
        <code style={codeInlineStyle}>requiresConfirmation</code>, and{" "}
        <code style={codeInlineStyle}>requiresHumanPresent</code> lists.
      </p>

      <h3 id="not-in-scope" style={h3Style}>What Is Not In Scope</h3>
      <ul style={ulStyle}>
        <li><strong>Consuming application security.</strong> VhyxSeal does not protect the application itself — only the contract layer.</li>
        <li><strong>Network transport security.</strong> Use HTTPS. VhyxSeal assumes a secure transport layer.</li>
        <li><strong>Agent authentication.</strong> Verifying the identity of the agent making requests is out of scope for this RFC. This is a planned future extension.</li>
      </ul>

      <h3 id="known-limitations-security" style={h3Style}>Known Limitations</h3>
      <div
        style={{
          padding: "16px 20px",
          backgroundColor: "var(--docs-surface)",
          border: "1px solid var(--docs-border)",
          borderLeft: "4px solid var(--vhyxseal-color-inferred)",
          borderRadius: "0 8px 8px 0",
          marginBottom: "24px",
        }}
      >
        <p style={{ ...pStyle, marginBottom: 0, fontWeight: 600 }}>
          The following capabilities are defined in this RFC but not yet enforced in 1.0.0-rc.1:
        </p>
      </div>
      <ul style={ulStyle}>
        <li><strong>Rate limiting:</strong> <code style={codeInlineStyle}>AgentPolicy.rateLimits</code> is defined in the schema. Enforcement requires server-side middleware that is not included in this release.</li>
        <li><strong>Registry backend:</strong> Domain verification tokens are issued and verified locally. A hosted registry for cross-domain verification is planned for a future release.</li>
        <li><strong>Multi-framework contract inheritance:</strong> Contracts defined in one framework adapter are not automatically available to another. Unified registry is planned.</li>
      </ul>
      <p style={pStyle}>
        These are intentional sequencing decisions, not design gaps. The schema is stable. The
        enforcement comes next.
      </p>

      {/* ── Section 6: Framework Implementation Guide ──────────────────── */}
      <h2 id="framework-guide" style={h2Style}>6. Framework Implementation Guide</h2>
      <p style={pStyle}>
        This section specifies what a VhyxSeal-compliant framework adapter must provide. It is
        written for framework authors building adapters for React, Vue, Angular, Svelte, or other
        UI frameworks.
      </p>

      <h3 id="required-adapter-components" style={h3Style}>Required Adapter Components</h3>
      <p style={pStyle}>A compliant adapter must provide:</p>
      <ol style={{ ...ulStyle, paddingLeft: "24px" }}>
        <li><strong>A context provider</strong> — equivalent to <code style={codeInlineStyle}>SealProvider</code> in <code style={codeInlineStyle}>@vhyxseal/react</code>. This component owns the registry of contracts for the current render tree and exposes the manifest to any consumer.</li>
        <li><code style={codeInlineStyle}>registerContract()</code> <strong>and</strong> <code style={codeInlineStyle}>unregisterContract()</code> <strong>APIs</strong> — called by components on mount and unmount respectively. Registration includes the full <code style={codeInlineStyle}>ComponentContract</code> object. Unregistration removes it from the manifest.</li>
        <li><code style={codeInlineStyle}>generateManifest()</code> <strong>integration</strong> — the provider must call <code style={codeInlineStyle}>generateManifest()</code> from <code style={codeInlineStyle}>@vhyxseal/core</code> with the set of currently mounted component IDs. It must not implement custom manifest generation logic.</li>
        <li><strong>An inference engine for Level 0 adoption</strong> — the adapter must be able to infer a partial contract from HTML semantics, ARIA attributes, element type, and text content when no contract is explicitly provided.</li>
        <li><strong>DevTools integration</strong> (recommended, not required) — the adapter should integrate with <code style={codeInlineStyle}>@vhyxseal/devtools</code> to provide the development-time contract overlay and panel.</li>
      </ol>

      <h3 id="seal-provider-responsibilities" style={h3Style}>SealProvider Responsibilities</h3>
      <p style={pStyle}>The context provider:</p>
      <ul style={ulStyle}>
        <li>Owns a <code style={codeInlineStyle}>Map&lt;string, ComponentContract&gt;</code> of all contracts registered in its subtree</li>
        <li>Exposes <code style={codeInlineStyle}>registerContract(contract)</code> and <code style={codeInlineStyle}>unregisterContract(id)</code> as stable callbacks to child components</li>
        <li>Passes the set of mounted component IDs to <code style={codeInlineStyle}>generateManifest()</code> when generating the manifest — this allows output-time scoping that prevents cross-provider contract bleed</li>
        <li>Returns a <code style={codeInlineStyle}>Readonly&lt;VhyxSealManifest&gt;</code> or <code style={codeInlineStyle}>null</code> from its context value</li>
        <li>Must never render its own visible UI</li>
      </ul>

      <h3 id="component-registration" style={h3Style}>Component Registration Protocol</h3>
      <p style={pStyle}>
        Components register their contracts on mount and unregister on unmount:
      </p>
      <div style={{ marginBottom: "16px" }}>
        <CodeBlock code={componentRegistrationCode} lang="typescript" />
      </div>
      <p style={pStyle}>
        A contract that fails validation is silently excluded from the manifest in production. In
        development, a <code style={codeInlineStyle}>VhyxSealError</code> is emitted and displayed
        in DevTools. The component renders normally in both cases — contract errors never affect the
        visual layer (DECISION-008).
      </p>

      <h3 id="manifest-generation" style={h3Style}>Manifest Generation Requirements</h3>
      <p style={pStyle}>
        Adapters must call <code style={codeInlineStyle}>generateManifest()</code> from{" "}
        <code style={codeInlineStyle}>@vhyxseal/core</code>:
      </p>
      <div style={{ marginBottom: "16px" }}>
        <CodeBlock code={generateManifestCode} lang="typescript" />
      </div>
      <p style={pStyle}>
        Custom manifest generation is not permitted. All adapters must use this function to ensure
        that schema validation, fingerprinting, and policy merging behavior are consistent across
        frameworks.
      </p>

      <h3 id="reference-implementations" style={h3Style}>Reference Implementations</h3>
      <p style={pStyle}>Three reference implementations are available:</p>
      <ul style={ulStyle}>
        <li><code style={codeInlineStyle}>@vhyxseal/react</code> — React 18+ adapter with SealProvider, HOC (<code style={codeInlineStyle}>withAgentContract</code>), hooks (<code style={codeInlineStyle}>useContract</code>, <code style={codeInlineStyle}>useCapability</code>, <code style={codeInlineStyle}>useAgentAction</code>), and components (<code style={codeInlineStyle}>Button</code>, <code style={codeInlineStyle}>Input</code>, <code style={codeInlineStyle}>Form</code>, <code style={codeInlineStyle}>Nav</code>, <code style={codeInlineStyle}>Display</code>, <code style={codeInlineStyle}>Confirmation</code>)</li>
        <li><code style={codeInlineStyle}>@vhyxseal/vue</code> — Vue 3 adapter with plugin, composables (<code style={codeInlineStyle}>useSeal</code>, <code style={codeInlineStyle}>useContract</code>, <code style={codeInlineStyle}>useCapability</code>, <code style={codeInlineStyle}>useAgentAction</code>), and the same six components</li>
        <li><code style={codeInlineStyle}>@vhyxseal/vanilla</code> — Web Components adapter with <code style={codeInlineStyle}>SealButton</code>, <code style={codeInlineStyle}>SealInput</code>, <code style={codeInlineStyle}>SealForm</code>, <code style={codeInlineStyle}>SealNav</code>, <code style={codeInlineStyle}>SealDisplay</code>, <code style={codeInlineStyle}>SealConfirmation</code> custom elements and <code style={codeInlineStyle}>createSealRegistry()</code></li>
      </ul>
      <p style={pStyle}>
        Community adapters for other frameworks should follow the same patterns as the reference
        implementations. An adapter specification document is available in the repository.
      </p>

      {/* ── Section 6.5: Compliance Levels ────────────────────────────── */}
      <h2 id="compliance-levels" style={h2Style}>6.5. Compliance Levels</h2>
      <p style={pStyle}>
        This section formally defines three levels of VhyxSeal compliance. These levels are
        cumulative — Level 3 implies Level 2, which implies Level 1.
      </p>

      <h3 id="level-1-compliance" style={h3Style}>Level 1 — Manifest Compliant</h3>
      <p style={{ ...pStyle, fontWeight: 600 }}>Requirements:</p>
      <ul style={ulStyle}>
        <li>The site generates a valid <code style={codeInlineStyle}>/__agent__/manifest.json</code> response</li>
        <li>The manifest declares a <code style={codeInlineStyle}>vhyxseal</code> schema version field</li>
        <li>The manifest is served with correct <code style={codeInlineStyle}>Content-Type: application/json</code></li>
      </ul>
      <p style={{ ...pStyle, fontWeight: 600 }}>What agents can do at this level:</p>
      <ul style={ulStyle}>
        <li>Discover that the site has a VhyxSeal-enabled manifest</li>
        <li>Read the schema version</li>
        <li>Determine that the site participates in the VhyxSeal standard</li>
      </ul>
      <p style={pStyle}>
        Level 1 compliance is the minimum for agent discovery. Component-level contracts are not required.
      </p>

      <h3 id="level-2-compliance" style={h3Style}>Level 2 — Contract Compliant</h3>
      <p style={{ ...pStyle, fontWeight: 600 }}>Requirements:</p>
      <ul style={ulStyle}>
        <li>All interactive components on the page have contracts (explicit or inferred)</li>
        <li>The inference engine is implemented so Level 0 developer adoption works</li>
        <li>DevTools integration is present for development visibility</li>
      </ul>
      <p style={{ ...pStyle, fontWeight: 600 }}>What agents can do at this level:</p>
      <ul style={ulStyle}>
        <li>Read component intent, safety level, and confirmation requirements before acting</li>
        <li>Understand preconditions and avoid attempting actions that will fail</li>
        <li>Navigate relationships between components to understand multi-step flows</li>
        <li>Plan capability execution using entry points and estimated step counts</li>
      </ul>
      <p style={pStyle}>Level 2 is the target compliance level for most applications.</p>

      <h3 id="level-3-compliance" style={h3Style}>Level 3 — Security Compliant</h3>
      <p style={{ ...pStyle, fontWeight: 600 }}>Requirements:</p>
      <ul style={ulStyle}>
        <li>HMAC-SHA256 manifest signing is implemented and active</li>
        <li>Single-use action tokens are implemented and enforced</li>
        <li>Domain verification tokens are issued and verified</li>
      </ul>
      <p style={{ ...pStyle, fontWeight: 600 }}>What agents can do at this level:</p>
      <ul style={ulStyle}>
        <li>Cryptographically verify manifest integrity before trusting any contract data</li>
        <li>Use single-use tokens for high-safety confirmed actions</li>
        <li>Trust domain binding — the manifest is proven to belong to the claimed domain</li>
      </ul>
      <p style={pStyle}>
        Note: VhyxSeal ships at Level 2 compliance by default. Level 3 requires{" "}
        <code style={codeInlineStyle}>@vhyxseal/nextjs</code> and key configuration.
      </p>

      {/* ── Section 7: Versioning Commitment ──────────────────────────── */}
      <h2 id="versioning" style={h2Style}>7. Versioning Commitment</h2>
      <p style={pStyle}>
        VhyxSeal version 1.0.0 carries a formal stability guarantee. This section defines precisely
        what that guarantee covers and what it does not.
      </p>

      <h3 id="semver-policy" style={h3Style}>Semantic Versioning Policy</h3>
      <p style={pStyle}>
        VhyxSeal follows semantic versioning. Within a major version, changes are additive only.
        Fields are never removed. Fields are never renamed. New optional fields may be added with
        documented defaults.
      </p>

      <h3 id="breaking-changes" style={h3Style}>What Constitutes a Breaking Change</h3>
      <p style={pStyle}>
        The following changes require a major version bump and the full RFC process with a 12-month
        migration window:
      </p>
      <ul style={ulStyle}>
        <li>Removing a field from the contract schema</li>
        <li>Changing the manifest URL convention (<code style={codeInlineStyle}>/__agent__/manifest.json</code>)</li>
        <li>Changing the version negotiation algorithm</li>
        <li>Removing a built-in intent from the vocabulary</li>
        <li>Changing the string value of any <code style={codeInlineStyle}>ErrorCode</code> enum member</li>
      </ul>

      <h3 id="non-breaking-changes" style={h3Style}>What Does Not Constitute a Breaking Change</h3>
      <p style={pStyle}>The following changes are permitted within a major version:</p>
      <ul style={ulStyle}>
        <li>Adding new optional fields to any schema interface</li>
        <li>Adding new built-in intents to the vocabulary</li>
        <li>Adding new <code style={codeInlineStyle}>ErrorCode</code> enum members</li>
        <li>Performance improvements to library internals</li>
        <li>Bug fixes that do not alter documented behavior</li>
      </ul>

      <h3 id="deprecation-policy" style={h3Style}>Deprecation Policy</h3>
      <p style={pStyle}>
        Fields marked as deprecated remain in the schema for the full duration of the current major
        version. Deprecation is announced in the project <code style={codeInlineStyle}>CHANGELOG.md</code> and,
        for significant deprecations, through a new RFC. The minimum deprecation window before removal
        is 12 months. No silent removals — every removal is announced at least 6 months before it
        takes effect.
      </p>

      <h3 id="stability-guarantee" style={h3Style}>The 1.0.0 Stability Guarantee</h3>
      <p style={{ ...pStyle, fontWeight: 600 }}>What it guarantees:</p>
      <ul style={ulStyle}>
        <li>The contract schema fields and types defined in this RFC will not change without a major version bump</li>
        <li>The <code style={codeInlineStyle}>/__agent__/manifest.json</code> URL convention is stable</li>
        <li>The version negotiation algorithm described in Section 4 is stable</li>
        <li>Additions to the built-in intent vocabulary are backward compatible — existing agent behavior is unaffected</li>
        <li><code style={codeInlineStyle}>ErrorCode</code> string values are stable — agents and tooling may depend on them</li>
      </ul>
      <p style={{ ...pStyle, fontWeight: 600 }}>What it does <em>not</em> guarantee:</p>
      <ul style={ulStyle}>
        <li>Implementation internals of <code style={codeInlineStyle}>@vhyxseal/core</code> — internal functions not part of the public API may change</li>
        <li>Framework adapter APIs — <code style={codeInlineStyle}>@vhyxseal/react</code>, <code style={codeInlineStyle}>@vhyxseal/vue</code>, and <code style={codeInlineStyle}>@vhyxseal/vanilla</code> are versioned independently</li>
        <li>DevTools, CLI, and extension UI — tooling surfaces evolve independently of the schema</li>
      </ul>

      {/* ── Section 8: What Is Not In This RFC ────────────────────────── */}
      <h2 id="not-in-rfc" style={h2Style}>8. What Is Not In This RFC</h2>
      <p style={pStyle}>
        The following capabilities are defined in this RFC but not yet enforced in 1.0.0-rc.1:
      </p>
      <p style={pStyle}>
        <strong>Rate limiting.</strong> The <code style={codeInlineStyle}>AgentPolicy.rateLimits</code>{" "}
        object is fully defined in the schema with fields for{" "}
        <code style={codeInlineStyle}>actionsPerMinute</code>,{" "}
        <code style={codeInlineStyle}>actionsPerHour</code>,{" "}
        <code style={codeInlineStyle}>manifestRequestsPerMinute</code>, and{" "}
        <code style={codeInlineStyle}>perAgentSession</code>. Declaring these values in a manifest
        has no enforcement effect in 1.0.0-rc.1. Server-side middleware that reads and enforces
        these limits is planned and will ship as a separate module. This is a sequencing decision —
        the schema is stable; the enforcement runtime comes next.
      </p>
      <p style={pStyle}>
        <strong>Registry backend.</strong> Domain verification tokens are currently issued and
        verified within the same process using local HMAC operations. There is no centralized
        registry that allows cross-domain verification or independent token validation. A hosted
        registry is planned for a future release. In the meantime, domain verification provides
        meaningful security within a single deployment but does not support scenarios requiring
        external trust chains.
      </p>
      <p style={pStyle}>
        <strong>Multi-framework contract inheritance.</strong> Contracts registered in a{" "}
        <code style={codeInlineStyle}>SealProvider</code> in a React application are not visible to
        a Vue component rendered in a different subtree. Each framework adapter maintains its own
        registry. A unified cross-framework registry is planned. Until that ships, cross-framework
        contract sharing requires manual coordination.
      </p>

      {/* ── Section 9: RFC Process ─────────────────────────────────────── */}
      <h2 id="rfc-process" style={h2Style}>9. RFC Process</h2>

      <h3 id="how-to-comment" style={h3Style}>How to Comment</h3>
      <p style={pStyle}>
        Submit feedback through{" "}
        <a
          href="https://github.com/vhyxara/vhyxseal/discussions"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub Discussions
        </a>{" "}
        on the <code style={codeInlineStyle}>vhyxara/vhyxseal</code> repository.
      </p>
      <p style={pStyle}>
        Apply the label <strong>RFC-0001</strong> to your discussion thread.
      </p>
      <p style={pStyle}>
        The comment period is open for a minimum of 30 days from the published date of this document.
        Early closure does not occur — the period may be extended if significant feedback is still arriving.
      </p>

      <h3 id="feedback-in-scope" style={h3Style}>What Feedback Is In Scope</h3>
      <p style={pStyle}>The following are in scope for this RFC:</p>
      <ul style={ulStyle}>
        <li>Contract schema fields and types — are they sufficient, is anything missing, are any types wrong</li>
        <li>Manifest structure and the <code style={codeInlineStyle}>/__agent__/manifest.json</code> URL convention</li>
        <li>Security model design — threat coverage, defense adequacy, known limitations</li>
        <li>Compliance level definitions — are the three levels the right divisions</li>
        <li>Versioning policy — breaking change definitions, deprecation window length</li>
      </ul>

      <h3 id="feedback-out-of-scope" style={h3Style}>What Feedback Is Out of Scope</h3>
      <p style={pStyle}>The following are out of scope for this RFC:</p>
      <ul style={ulStyle}>
        <li>Framework-specific implementation details — how <code style={codeInlineStyle}>@vhyxseal/react</code> renders components, what the hook APIs look like</li>
        <li>VhyxUI component library decisions — visual design, styling, theme systems</li>
        <li>Infrastructure and hosting decisions — where the registry backend runs, deployment architecture</li>
      </ul>
      <p style={pStyle}>
        Out-of-scope feedback will not be dismissed — it will be routed to the appropriate venue.
        The RFC process is specifically for the schema, manifest, and specification decisions in
        this document.
      </p>

      <h3 id="how-decisions-made" style={h3Style}>How Decisions Are Made</h3>
      <p style={pStyle}>
        All feedback is reviewed by Vhyxara Super Leaders. Every piece of feedback receives a
        response — either acknowledgment and incorporation, or a reasoned explanation of why it was
        not adopted.
      </p>
      <p style={pStyle}>
        Significant changes to the specification require an updated RFC draft to be published and a
        new comment period. Breaking changes to the schema require a new RFC version (RFC-0001.1 or
        a new RFC-0002 as appropriate). Minor clarifications — typo fixes, improved wording,
        additional examples — are merged directly without a new comment period.
      </p>

      <h3 id="after-rfc-closes" style={h3Style}>After the RFC Closes</h3>
      <p style={pStyle}>When the minimum comment period ends:</p>
      <ol style={{ ...ulStyle, paddingLeft: "24px" }}>
        <li>All feedback is reviewed and addressed or documented as rejected with reasons</li>
        <li>Any required revisions are made to the specification</li>
        <li>Vhyxara Leadership makes the 1.0.0 release decision</li>
        <li>RFC-0001 is marked as <strong>Accepted</strong> (if adopted as written) or <strong>Revised</strong> (if significant changes were incorporated before acceptance)</li>
        <li>The 1.0.0 npm release follows the acceptance decision</li>
      </ol>

      {/* ── Section 10: Reference ──────────────────────────────────────── */}
      <h2 id="reference" style={h2Style}>10. Reference</h2>

      <h3 id="ref-contract-schema" style={h3Style}>10.1. Contract Schema</h3>
      <p style={pStyle}>
        The following TypeScript interfaces define the complete contract schema as implemented in{" "}
        <code style={codeInlineStyle}>packages/core/src/schema/contract.ts</code>.
      </p>
      <div style={{ marginBottom: "32px" }}>
        <CodeBlock code={contractSchemaCode} lang="typescript" />
      </div>

      <h3 id="ref-relationship-schema" style={h3Style}>10.2. Relationship Schema</h3>
      <p style={pStyle}>
        The following TypeScript interfaces define the relationship schema as implemented in{" "}
        <code style={codeInlineStyle}>packages/core/src/schema/relationships.ts</code>.
      </p>
      <div style={{ marginBottom: "32px" }}>
        <CodeBlock code={relationshipSchemaCode} lang="typescript" />
      </div>

      <h3 id="ref-capability-schema" style={h3Style}>10.3. Capability Schema</h3>
      <p style={pStyle}>
        The following TypeScript interfaces define the capability schema as implemented in{" "}
        <code style={codeInlineStyle}>packages/core/src/schema/capability.ts</code>.
      </p>
      <div style={{ marginBottom: "32px" }}>
        <CodeBlock code={capabilitySchemaCode} lang="typescript" />
      </div>

      <h3 id="ref-manifest-schema" style={h3Style}>10.4. Manifest Schema</h3>
      <p style={pStyle}>
        The following TypeScript interfaces define the manifest schema as implemented in{" "}
        <code style={codeInlineStyle}>packages/core/src/manifest/types.ts</code>.
      </p>
      <div style={{ marginBottom: "32px" }}>
        <CodeBlock code={manifestSchemaCode} lang="typescript" />
      </div>

      <h3 id="ref-error-system" style={h3Style}>10.5. Error System</h3>
      <p style={pStyle}>
        The following types define the error system as implemented in{" "}
        <code style={codeInlineStyle}>packages/core/src/errors/index.ts</code>.
      </p>
      <div style={{ marginBottom: "24px" }}>
        <CodeBlock code={errorSystemCode} lang="typescript" />
      </div>

      <h4
        style={{
          fontSize: "15px",
          fontWeight: 600,
          color: "var(--docs-text)",
          marginTop: "24px",
          marginBottom: "12px",
        }}
      >
        Error Code Reference
      </h4>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Code</th>
            <th style={thStyle}>Category</th>
            <th style={thStyle}>Description</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["VHYX_INVALID_SCHEMA_VERSION", "Schema", "The schema version string is not a valid semver"],
            ["VHYX_CONTRACT_VALIDATION_FAILED", "Schema", "A contract failed structural validation"],
            ["VHYX_UNKNOWN_INTENT", "Schema", "The intent string is not recognized and has no registered defaults"],
            ["VHYX_INVALID_SAFETY_LEVEL", "Schema", "The safetyLevel value is not one of the five valid levels"],
            ["VHYX_FIELD_TOO_LONG", "Schema", "A string field exceeds its maximum character limit"],
            ["VHYX_INJECTION_DETECTED", "Schema", "A string field matched an injection pattern and was rejected"],
            ["VHYX_MANIFEST_GENERATION_FAILED", "Manifest", "generateManifest() could not produce a valid manifest"],
            ["VHYX_MANIFEST_SIGNING_FAILED", "Manifest", "signManifest() failed — typically no active key registered"],
            ["VHYX_MANIFEST_VERIFICATION_FAILED", "Manifest", "HMAC verification of a received manifest failed"],
            ["VHYX_DOMAIN_MISMATCH", "Manifest", "The manifest domain does not match the serving domain"],
            ["VHYX_CONTRACT_DRIFT_DETECTED", "Contract", "A contract fingerprint does not match its computed value"],
            ["VHYX_CONTRACT_STALE", "Contract", "A contract has not been verified within the staleness threshold"],
            ["VHYX_DUPLICATE_COMPONENT_ID", "Contract", "Two contracts were registered with the same component id"],
            ["VHYX_DUPLICATE_INTENT", "Contract", "registerIntent() was called with an already-registered intent name"],
            ["VHYX_INVALID_RELATIONSHIP", "Relationship", "A relationship definition failed structural validation"],
            ["VHYX_CIRCULAR_DEPENDENCY", "Relationship", "A dependency relationship forms a cycle"],
            ["VHYX_MISSING_COMPONENT_REF", "Relationship", "A relationship references a component id not present in the registry"],
            ["VHYX_RATE_LIMIT_EXCEEDED", "Security", "An agent exceeded the rate limit defined in AgentPolicy.rateLimits"],
            ["VHYX_TOKEN_EXPIRED", "Security", "An action token was presented after its 60-second expiry window"],
            ["VHYX_TOKEN_ALREADY_USED", "Security", "An action token was presented a second time after already being consumed"],
            ["VHYX_AGENT_NOT_ALLOWED", "Security", "The agent identity is blocked by AgentPolicy.blockedAgents"],
          ].map(([code, category, description]) => (
            <tr key={code}>
              <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "12px" }}>{code}</td>
              <td style={tdStyle}>{category}</td>
              <td style={tdStyle}>{description}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 id="ref-intent-vocabulary" style={h3Style}>10.6. Intent Vocabulary</h3>
      <p style={pStyle}>
        All 25 built-in intents and their default contract field values. These defaults are applied
        when a developer provides only an intent string (Level 1 adoption) or when{" "}
        <code style={codeInlineStyle}>resolveIntentDefaults()</code> is called directly.
      </p>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Intent</th>
            <th style={thStyle}>Safety Level</th>
            <th style={thStyle}>Reversible</th>
            <th style={thStyle}>Requires Confirmation</th>
            <th style={thStyle}>Destructive</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["place-order", "high", "yes", "yes", "no"],
            ["make-payment", "critical", "no", "yes", "no"],
            ["delete-account", "critical", "no", "yes", "yes"],
            ["delete-item", "high", "no", "yes", "yes"],
            ["send-message", "medium", "no", "no", "no"],
            ["save-draft", "low", "yes", "no", "no"],
            ["submit-form", "medium", "no", "no", "no"],
            ["update-profile", "medium", "yes", "no", "no"],
            ["sign-out", "low", "yes", "no", "no"],
            ["sign-in", "low", "yes", "no", "no"],
            ["apply-filter", "low", "yes", "no", "no"],
            ["search", "low", "yes", "no", "no"],
            ["upload-file", "medium", "yes", "no", "no"],
            ["download-file", "low", "yes", "no", "no"],
            ["schedule-meeting", "medium", "yes", "no", "no"],
            ["cancel-booking", "high", "no", "yes", "no"],
            ["publish-content", "high", "yes", "yes", "no"],
            ["unpublish-content", "high", "yes", "yes", "no"],
            ["share-item", "medium", "yes", "no", "no"],
            ["navigate", "low", "yes", "no", "no"],
            ["confirm-action", "high", "no", "yes", "no"],
            ["collect-email", "low", "yes", "no", "no"],
            ["collect-password", "sensitive", "yes", "no", "no"],
            ["collect-payment", "sensitive", "no", "yes", "no"],
            ["authenticate", "medium", "yes", "no", "no"],
          ].map(([intent, safety, reversible, confirmation, destructive]) => (
            <tr key={intent}>
              <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "12px" }}>{intent}</td>
              <td style={tdStyle}>{safety}</td>
              <td style={tdStyle}>{reversible}</td>
              <td style={tdStyle}>{confirmation}</td>
              <td style={tdStyle}>{destructive}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={pStyle}>
        Extend the vocabulary using <code style={codeInlineStyle}>registerIntent()</code>. See
        Section 3 for the API signature and an example.
      </p>

      {/* ── Footer block ──────────────────────────────────────────────── */}
      <div
        style={{
          marginTop: "64px",
          paddingTop: "32px",
          borderTop: "1px solid var(--docs-border)",
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <a
          href="https://github.com/vhyxara/vhyxseal/discussions"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "12px 24px",
            backgroundColor: "var(--vhyxseal-color-full)",
            color: "white",
            borderRadius: "8px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Comment on GitHub Discussions ↗
        </a>
        <a
          href="https://github.com/vhyxara/vhyxseal/blob/main/RFC-0001.md"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "12px 24px",
            border: "1px solid var(--docs-border)",
            color: "var(--docs-text)",
            borderRadius: "8px",
            textDecoration: "none",
          }}
        >
          View Raw on GitHub ↗
        </a>
      </div>

      <p
        style={{
          marginTop: "32px",
          fontSize: "13px",
          color: "var(--docs-text-muted)",
          fontStyle: "italic",
        }}
      >
        RFC-0001 — VhyxSeal Semantic Contract Layer — Version 1.0.0-rc.1
        <br />
        Published 2026-05-27 — Open for comment —{" "}
        <a
          href="https://github.com/vhyxara/vhyxseal/discussions"
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/vhyxara/vhyxseal/discussions
        </a>
      </p>
      <PrevNext />
    </div>
  );
}
