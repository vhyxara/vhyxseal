/**
 * Capability schema — the highest level of abstraction in VhyxSeal.
 *
 * Capabilities are what agents think in. An agent thinks "I want to purchase this item"
 * not "click button id checkout-btn". A capability groups the relationships and components
 * that together fulfill a user-facing goal.
 */

import type { SafetyLevel } from "./contract.js";
import type { Relationship, RelationshipType } from "./relationships.js";

/** One possible end state of a capability — success, failure, or cancellation. */
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
 *
 * Groups the entry point, exit points, and relationships that together allow an
 * agent to accomplish something meaningful, such as "purchase-item" or "sign-in".
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
}
