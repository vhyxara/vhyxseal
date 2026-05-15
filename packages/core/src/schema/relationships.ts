/**
 * Relationship schema — how components connect to each other.
 *
 * Individual contracts describe single components. Relationships describe flows.
 * Three relationship types cover all cases: composition, sequence, and dependency.
 */

import type { Condition } from "./contract.js";

/** The three categories of relationship between components. */
export type RelationshipType = "composition" | "sequence" | "dependency";

/**
 * A composition relationship — components that belong together structurally.
 *
 * Used when a parent component contains child components and completion of the
 * parent requires specific children to be in a valid state.
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
 *
 * Used when an agent must follow steps in a specific order, such as a checkout flow.
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
 *
 * Used when the state of a source component determines what a target component
 * can do — for example, a form field enabling a submit button.
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
  | DependencyRelationship;
