/**
 * Relationship registry — stores, validates, and retrieves component relationships.
 *
 * Relationships connect components into meaningful flows: composition (structural),
 * sequence (ordered steps), and dependency (state gates). The registry is the
 * authoritative source of all registered relationships for manifest generation.
 */

import type {
  Relationship,
  RelationshipType,
  SequenceRelationship,
  DependencyEffect,
} from "../schema/relationships.js";
import { VhyxSealError, ErrorCode } from "../errors/index.js";

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

const relationshipRegistry = new Map<string, Readonly<Relationship>>();

// ---------------------------------------------------------------------------
// Validation constants
// ---------------------------------------------------------------------------

const VALID_TYPES: readonly string[] = ["composition", "sequence", "dependency"];

const VALID_EFFECTS: readonly string[] = [
  "enables",
  "disables",
  "shows",
  "hides",
  "modifies",
];

const VALID_OPERATORS: readonly string[] = [
  "===",
  "!==",
  ">",
  "<",
  ">=",
  "<=",
  "includes",
  "excludes",
];

// ---------------------------------------------------------------------------
// Internal validation helpers
// ---------------------------------------------------------------------------

function validateNonEmptyString(
  value: unknown,
  fieldPath: string,
  relationshipId: string,
): void {
  if (typeof value !== "string" || value.length === 0) {
    throw new VhyxSealError({
      code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
      message: `Invalid relationship "${relationshipId}": field "${fieldPath}" must be a non-empty string`,
      context: { relationshipId, fieldPath, received: value },
      severity: "error",
      recoverable: true,
      suggestion: `Provide a non-empty string for "${fieldPath}".`,
    });
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validates and registers a relationship, returning it frozen.
 *
 * Performs structural validation appropriate to the relationship type before
 * registering. All fields are checked for correctness at runtime so that
 * JavaScript callers and `as`-cast bypasses are caught.
 *
 * @param relationship - The relationship to register.
 * @returns The registered relationship as a frozen Readonly object.
 * @throws {VhyxSealError} VHYX_INVALID_RELATIONSHIP when id is empty.
 * @throws {VhyxSealError} VHYX_INVALID_RELATIONSHIP when id is already registered.
 * @throws {VhyxSealError} VHYX_INVALID_RELATIONSHIP when type is not one of "composition" | "sequence" | "dependency".
 * @throws {VhyxSealError} VHYX_INVALID_RELATIONSHIP when composition fields are invalid (empty parent, empty children, empty description).
 * @throws {VhyxSealError} VHYX_INVALID_RELATIONSHIP when sequence fields are invalid (empty steps, invalid step fields, duplicate order values).
 * @throws {VhyxSealError} VHYX_INVALID_RELATIONSHIP when dependency fields are invalid (empty source/target, invalid effect, invalid condition operator, empty description).
 * @throws {VhyxSealError} VHYX_CIRCULAR_DEPENDENCY when source and target are the same component id.
 * @example
 * const rel = defineRelationship({
 *   type: "dependency",
 *   id: "payment-method-gate",
 *   source: "payment-method-input",
 *   target: "checkout-submit-btn",
 *   condition: { field: "user.hasPaymentMethod", operator: "===", value: true, description: "Payment method must be saved" },
 *   effect: "enables",
 *   description: "Submit button enabled only when payment method is saved",
 * });
 */
export function defineRelationship<T extends Relationship>(
  relationship: T,
): Readonly<T> {
  // Validate id
  if (
    typeof relationship.id !== "string" ||
    relationship.id.length === 0
  ) {
    throw new VhyxSealError({
      code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
      message: "Relationship id must be a non-empty string",
      context: { received: relationship.id },
      severity: "error",
      recoverable: true,
      suggestion:
        "Provide a non-empty string id unique across all registered relationships.",
    });
  }

  // Validate id uniqueness
  if (relationshipRegistry.has(relationship.id)) {
    throw new VhyxSealError({
      code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
      message: `Relationship id "${relationship.id}" is already registered`,
      context: { id: relationship.id },
      severity: "error",
      recoverable: true,
      suggestion:
        `Choose a unique id. "${relationship.id}" is already in the registry.`,
    });
  }

  // Validate type
  const typeAsString: string = relationship.type;
  if (!VALID_TYPES.includes(typeAsString)) {
    throw new VhyxSealError({
      code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
      message: `Invalid relationship type "${String(relationship.type)}"`,
      context: { id: relationship.id, received: relationship.type },
      severity: "error",
      recoverable: true,
      suggestion:
        'Relationship type must be one of: "composition" | "sequence" | "dependency".',
    });
  }

  // Type-specific validation
  if (relationship.type === "composition") {
    validateNonEmptyString(relationship.parent, "parent", relationship.id);

    if (
      !Array.isArray(relationship.children) ||
      relationship.children.length === 0
    ) {
      throw new VhyxSealError({
        code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
        message: `Composition relationship "${relationship.id}": children must be a non-empty array`,
        context: { id: relationship.id },
        severity: "error",
        recoverable: true,
        suggestion:
          "Provide at least one child component id in the children array.",
      });
    }

    if (!Array.isArray(relationship.completionRequires)) {
      throw new VhyxSealError({
        code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
        message: `Composition relationship "${relationship.id}": completionRequires must be an array`,
        context: { id: relationship.id },
        severity: "error",
        recoverable: true,
        suggestion:
          "Provide an array for completionRequires (can be empty if no children are required before parent acts).",
      });
    }

    validateNonEmptyString(
      relationship.description,
      "description",
      relationship.id,
    );
  } else if (relationship.type === "sequence") {
    validateNonEmptyString(
      relationship.description,
      "description",
      relationship.id,
    );

    if (
      !Array.isArray(relationship.steps) ||
      relationship.steps.length === 0
    ) {
      throw new VhyxSealError({
        code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
        message: `Sequence relationship "${relationship.id}": steps must be a non-empty array`,
        context: { id: relationship.id },
        severity: "error",
        recoverable: true,
        suggestion: "Provide at least one step in the sequence.",
      });
    }

    const seenOrders = new Set<number>();
    for (const step of relationship.steps) {
      if (typeof step.order !== "number") {
        throw new VhyxSealError({
          code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
          message: `Sequence relationship "${relationship.id}": step.order must be a number`,
          context: { id: relationship.id, step },
          severity: "error",
          recoverable: true,
          suggestion: "Each step must have a numeric order value.",
        });
      }

      if (seenOrders.has(step.order)) {
        throw new VhyxSealError({
          code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
          message: `Sequence relationship "${relationship.id}": duplicate step order value ${step.order}`,
          context: { id: relationship.id, duplicateOrder: step.order },
          severity: "error",
          recoverable: true,
          suggestion:
            "Each step must have a unique order value within the sequence.",
        });
      }
      seenOrders.add(step.order);

      if (
        typeof step.componentId !== "string" ||
        step.componentId.length === 0
      ) {
        throw new VhyxSealError({
          code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
          message: `Sequence relationship "${relationship.id}": step.componentId must be a non-empty string`,
          context: { id: relationship.id, order: step.order },
          severity: "error",
          recoverable: true,
          suggestion: "Each step must reference a non-empty component id.",
        });
      }

      if (typeof step.canSkip !== "boolean") {
        throw new VhyxSealError({
          code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
          message: `Sequence relationship "${relationship.id}": step.canSkip must be a boolean`,
          context: { id: relationship.id, order: step.order },
          severity: "error",
          recoverable: true,
          suggestion: "Set canSkip to true or false for each step.",
        });
      }

      if (
        typeof step.onComplete !== "string" ||
        step.onComplete.length === 0
      ) {
        throw new VhyxSealError({
          code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
          message: `Sequence relationship "${relationship.id}": step.onComplete must be a non-empty string`,
          context: { id: relationship.id, order: step.order },
          severity: "error",
          recoverable: true,
          suggestion:
            "Each step must specify a non-empty onComplete component id.",
        });
      }

      if (typeof step.onFail !== "string" || step.onFail.length === 0) {
        throw new VhyxSealError({
          code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
          message: `Sequence relationship "${relationship.id}": step.onFail must be a non-empty string`,
          context: { id: relationship.id, order: step.order },
          severity: "error",
          recoverable: true,
          suggestion:
            "Each step must specify a non-empty onFail component id.",
        });
      }
    }
  } else if (relationship.type === "dependency") {
    validateNonEmptyString(relationship.source, "source", relationship.id);
    validateNonEmptyString(relationship.target, "target", relationship.id);

    if (relationship.source === relationship.target) {
      throw new VhyxSealError({
        code: ErrorCode.VHYX_CIRCULAR_DEPENDENCY,
        message: `Dependency relationship "${relationship.id}": source and target must be different component ids`,
        context: {
          id: relationship.id,
          source: relationship.source,
          target: relationship.target,
        },
        severity: "error",
        recoverable: true,
        suggestion:
          "source and target must reference different component ids. A component cannot depend on itself.",
      });
    }

    const effectAsString: string = relationship.effect;
    if (!VALID_EFFECTS.includes(effectAsString)) {
      throw new VhyxSealError({
        code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
        message: `Dependency relationship "${relationship.id}": invalid effect "${String(relationship.effect)}"`,
        context: { id: relationship.id, received: relationship.effect },
        severity: "error",
        recoverable: true,
        suggestion:
          'effect must be one of: "enables" | "disables" | "shows" | "hides" | "modifies".',
      });
    }

    const operatorAsString: string = relationship.condition.operator;
    if (!VALID_OPERATORS.includes(operatorAsString)) {
      throw new VhyxSealError({
        code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
        message: `Dependency relationship "${relationship.id}": invalid condition operator "${String(relationship.condition.operator)}"`,
        context: {
          id: relationship.id,
          received: relationship.condition.operator,
        },
        severity: "error",
        recoverable: true,
        suggestion:
          'condition.operator must be one of: "===" | "!==" | ">" | "<" | ">=" | "<=" | "includes" | "excludes".',
      });
    }

    validateNonEmptyString(
      relationship.description,
      "description",
      relationship.id,
    );
  }

  const frozen = Object.freeze(relationship);
  relationshipRegistry.set(relationship.id, frozen);
  return frozen;
}

/**
 * Returns the relationship registered under the given id, or undefined if
 * no relationship with that id has been registered.
 *
 * @param id - The relationship id to look up.
 * @returns The registered relationship, or undefined.
 */
export function getRelationship(id: string): Readonly<Relationship> | undefined {
  return relationshipRegistry.get(id);
}

/**
 * Returns all registered relationships in insertion order.
 *
 * @returns An array of all registered relationships.
 */
export function getAllRelationships(): ReadonlyArray<Readonly<Relationship>> {
  return Array.from(relationshipRegistry.values());
}

/**
 * Returns all registered relationships of the specified type.
 *
 * @param type - The relationship type to filter by.
 * @returns An array of relationships of the given type, in insertion order.
 */
export function getRelationshipsByType<T extends RelationshipType>(
  type: T,
): ReadonlyArray<Readonly<Relationship>> {
  const result: Array<Readonly<Relationship>> = [];
  for (const relationship of relationshipRegistry.values()) {
    if (relationship.type === type) {
      result.push(relationship);
    }
  }
  return result;
}

/**
 * Clears all entries from the relationship registry.
 *
 * **Intended for test use only. Do not call in production code.**
 * Calling this in production will silently discard all registered
 * relationships, breaking manifest generation.
 */
export function clearRelationshipRegistry(): void {
  relationshipRegistry.clear();
}

/**
 * Convenience wrapper for defining a SequenceRelationship.
 *
 * Equivalent to `defineRelationship({ type: "sequence", ...sequence })`.
 * Adds the discriminant `type` field and delegates all validation to
 * `defineRelationship`.
 *
 * @param sequence - The sequence definition without the `type` field.
 * @returns A readonly registered SequenceRelationship.
 * @throws {VhyxSealError} VHYX_INVALID_RELATIONSHIP if validation fails.
 * @throws {VhyxSealError} VHYX_INVALID_RELATIONSHIP if the id is already registered.
 * @example
 * const checkoutFlow = defineSequence({
 *   id: "checkout-flow",
 *   description: "Three step checkout process",
 *   linear: true,
 *   steps: [
 *     { order: 1, componentId: "cart", canSkip: false, onComplete: "checkout", onFail: "error" },
 *   ],
 * });
 */
export function defineSequence(
  sequence: Omit<SequenceRelationship, "type">,
): Readonly<SequenceRelationship> {
  const full: SequenceRelationship = { type: "sequence", ...sequence };
  return defineRelationship(full);
}
