/**
 * Component contract schema — the DNA of VhyxSeal.
 *
 * Every other system in the library builds on the types defined here.
 * Do not modify without leadership approval. All changes must be logged in decisions.md.
 */

/** Category of a UI component — determines how agents interpret and interact with it. */
export type ComponentType =
  | "action"       // buttons, triggers — does something
  | "input"        // forms, search, filters — collects data
  | "navigation"   // links, menus, tabs — moves somewhere
  | "display"      // shows current state — read only
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
 * an agent must proceed. This is the core primitive of VhyxSeal.
 */
export interface ComponentContract {
  // IDENTITY — what is this component
  /** Unique identifier for this component on the page. */
  id: string;
  /** Category of component — how agents interpret it. */
  type: ComponentType;
  /** Machine readable intent e.g. "place-order". */
  intent: string;
  /** Human readable explanation for agent reasoning. */
  description: string;

  // PRECONDITIONS — what must be true before agent interacts
  /** Conditions that must all be satisfied before interaction. */
  requires: readonly Condition[];
  /** Permission scopes required e.g. ["write:orders", "read:payment"]. */
  requiredPermissions: readonly string[];

  // CONSEQUENCE — what happens after interaction
  /** Plain description of what changes after interaction. */
  consequence: string;
  /** System areas affected by this action e.g. ["cart", "orders"]. */
  affects: readonly string[];
  /** Whether this action can be undone. */
  reversible: boolean;
  /** Seconds within which the action can be undone. Only meaningful when reversible is true. */
  reversibleWindow?: number;

  // SAFETY — how carefully should agent proceed
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

  // CONTRACT METADATA — versioning and integrity
  /** Developer managed semver e.g. "1.0.0". */
  contractVersion: string;
  /** Auto generated — hash of contract content. */
  fingerprint?: string;
  /** ISO date — when this contract was last confirmed against component behavior. */
  lastVerified?: string;
  verifiedBy?: "auto" | "manual" | "test";
  changelog?: readonly ContractChangelog[];
}
