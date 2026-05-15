/**
 * Capability registry — stores, validates, and retrieves capabilities.
 *
 * Capabilities are the highest level of abstraction — they represent complete
 * user-facing goals an agent can accomplish (e.g. "purchase-item"). The registry
 * is the authoritative source of all registered capabilities for manifest generation.
 */

import type { Capability } from "../schema/capability.js";
import type { RelationshipType } from "../schema/relationships.js";
import type { SafetyLevel } from "../schema/contract.js";
import { VhyxSealError, ErrorCode } from "../errors/index.js";

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

const capabilityRegistry = new Map<string, Readonly<Capability>>();

// ---------------------------------------------------------------------------
// Validation constants
// ---------------------------------------------------------------------------

const VALID_SAFETY_LEVELS: readonly string[] = [
  "low",
  "medium",
  "high",
  "critical",
  "sensitive",
];

const VALID_OUTCOMES: readonly string[] = ["success", "failure", "cancelled"];

const VALID_RELATIONSHIP_TYPES: readonly string[] = [
  "composition",
  "sequence",
  "dependency",
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validates and registers a capability, returning it frozen.
 *
 * All required fields are validated at runtime so that JavaScript callers
 * and type-bypass patterns are caught. Reuses VHYX_INVALID_RELATIONSHIP as
 * the error code — no capability-specific code exists in the schema yet.
 *
 * @param capability - The capability to register.
 * @returns The registered capability as a frozen Readonly object.
 * @throws {VhyxSealError} VHYX_INVALID_RELATIONSHIP when id is empty.
 * @throws {VhyxSealError} VHYX_INVALID_RELATIONSHIP when id is already registered.
 * @throws {VhyxSealError} VHYX_INVALID_RELATIONSHIP when description is empty.
 * @throws {VhyxSealError} VHYX_INVALID_RELATIONSHIP when entryPoint is empty.
 * @throws {VhyxSealError} VHYX_INVALID_RELATIONSHIP when exitPoints is empty or an exit point has an invalid outcome or empty componentId/description.
 * @throws {VhyxSealError} VHYX_INVALID_RELATIONSHIP when relationships is not an array.
 * @throws {VhyxSealError} VHYX_INVALID_RELATIONSHIP when estimatedSteps is not a positive integer.
 * @throws {VhyxSealError} VHYX_INVALID_RELATIONSHIP when safetyLevel is not a valid SafetyLevel value.
 * @throws {VhyxSealError} VHYX_INVALID_RELATIONSHIP when a relationship ref has an invalid type.
 * @example
 * const cap = defineCapability({
 *   id: "purchase-item",
 *   description: "Browse, select and purchase a product",
 *   entryPoint: "add-to-cart-btn",
 *   exitPoints: [
 *     { componentId: "order-confirmation-display", outcome: "success", description: "Order placed successfully" },
 *     { componentId: "payment-error-display", outcome: "failure", description: "Payment failed" },
 *   ],
 *   relationships: [],
 *   estimatedSteps: 4,
 *   requiresAuth: true,
 *   safetyLevel: "high",
 * });
 */
export function defineCapability(capability: Capability): Readonly<Capability> {
  // Validate id
  if (typeof capability.id !== "string" || capability.id.length === 0) {
    throw new VhyxSealError({
      code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
      message: "Capability id must be a non-empty string",
      context: { received: capability.id },
      severity: "error",
      recoverable: true,
      suggestion:
        'Provide a non-empty string id unique across all registered capabilities e.g. "purchase-item".',
    });
  }

  // Validate id uniqueness
  if (capabilityRegistry.has(capability.id)) {
    throw new VhyxSealError({
      code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
      message: `Capability id "${capability.id}" is already registered`,
      context: { id: capability.id },
      severity: "error",
      recoverable: true,
      suggestion: `Choose a unique id. "${capability.id}" is already in the registry.`,
    });
  }

  // Validate description
  if (
    typeof capability.description !== "string" ||
    capability.description.length === 0
  ) {
    throw new VhyxSealError({
      code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
      message: `Capability "${capability.id}": description must be a non-empty string`,
      context: { id: capability.id },
      severity: "error",
      recoverable: true,
      suggestion: "Provide a human and agent readable description for the capability.",
    });
  }

  // Validate entryPoint
  if (
    typeof capability.entryPoint !== "string" ||
    capability.entryPoint.length === 0
  ) {
    throw new VhyxSealError({
      code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
      message: `Capability "${capability.id}": entryPoint must be a non-empty string`,
      context: { id: capability.id },
      severity: "error",
      recoverable: true,
      suggestion:
        "entryPoint must be the component id where an agent starts this capability.",
    });
  }

  // Validate exitPoints
  if (
    !Array.isArray(capability.exitPoints) ||
    capability.exitPoints.length === 0
  ) {
    throw new VhyxSealError({
      code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
      message: `Capability "${capability.id}": exitPoints must be a non-empty array`,
      context: { id: capability.id },
      severity: "error",
      recoverable: true,
      suggestion:
        "Provide at least one exit point covering the success outcome.",
    });
  }

  for (const exitPoint of capability.exitPoints) {
    if (
      typeof exitPoint.componentId !== "string" ||
      exitPoint.componentId.length === 0
    ) {
      throw new VhyxSealError({
        code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
        message: `Capability "${capability.id}": exit point componentId must be a non-empty string`,
        context: { id: capability.id, exitPoint },
        severity: "error",
        recoverable: true,
        suggestion:
          "Each exit point must reference a non-empty component id.",
      });
    }

    const outcomeAsString: string = exitPoint.outcome;
    if (!VALID_OUTCOMES.includes(outcomeAsString)) {
      throw new VhyxSealError({
        code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
        message: `Capability "${capability.id}": invalid exit point outcome "${String(exitPoint.outcome)}"`,
        context: { id: capability.id, received: exitPoint.outcome },
        severity: "error",
        recoverable: true,
        suggestion:
          'Exit point outcome must be one of: "success" | "failure" | "cancelled".',
      });
    }

    if (
      typeof exitPoint.description !== "string" ||
      exitPoint.description.length === 0
    ) {
      throw new VhyxSealError({
        code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
        message: `Capability "${capability.id}": exit point description must be a non-empty string`,
        context: { id: capability.id, exitPoint },
        severity: "error",
        recoverable: true,
        suggestion: "Each exit point must have a non-empty description.",
      });
    }
  }

  // Validate relationships array
  if (!Array.isArray(capability.relationships)) {
    throw new VhyxSealError({
      code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
      message: `Capability "${capability.id}": relationships must be an array`,
      context: { id: capability.id },
      severity: "error",
      recoverable: true,
      suggestion: "Provide an array for relationships (can be empty).",
    });
  }

  for (const relRef of capability.relationships) {
    if (typeof relRef.ref !== "object" || relRef.ref === null) {
      throw new VhyxSealError({
        code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
        message: `Capability "${capability.id}": relationship ref must be an object`,
        context: { id: capability.id },
        severity: "error",
        recoverable: true,
        suggestion: "Each relationship ref must contain a valid Relationship object.",
      });
    }

    const relTypeAsString: string = relRef.type;
    if (!VALID_RELATIONSHIP_TYPES.includes(relTypeAsString)) {
      throw new VhyxSealError({
        code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
        message: `Capability "${capability.id}": invalid relationship ref type "${String(relRef.type)}"`,
        context: { id: capability.id, received: relRef.type },
        severity: "error",
        recoverable: true,
        suggestion:
          'Relationship ref type must be one of: "composition" | "sequence" | "dependency".',
      });
    }
  }

  // Validate estimatedSteps
  if (
    !Number.isInteger(capability.estimatedSteps) ||
    capability.estimatedSteps <= 0
  ) {
    throw new VhyxSealError({
      code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
      message: `Capability "${capability.id}": estimatedSteps must be a positive integer`,
      context: { id: capability.id, received: capability.estimatedSteps },
      severity: "error",
      recoverable: true,
      suggestion: "estimatedSteps must be an integer greater than 0.",
    });
  }

  // Validate safetyLevel
  const safetyLevelAsString: string = capability.safetyLevel;
  if (!VALID_SAFETY_LEVELS.includes(safetyLevelAsString)) {
    throw new VhyxSealError({
      code: ErrorCode.VHYX_INVALID_RELATIONSHIP,
      message: `Capability "${capability.id}": invalid safetyLevel "${String(capability.safetyLevel)}"`,
      context: { id: capability.id, received: capability.safetyLevel },
      severity: "error",
      recoverable: true,
      suggestion:
        'safetyLevel must be one of: "low" | "medium" | "high" | "critical" | "sensitive".',
    });
  }

  const frozen = Object.freeze(capability);
  capabilityRegistry.set(capability.id, frozen);
  return frozen;
}

/**
 * Returns the capability registered under the given id, or undefined if
 * no capability with that id has been registered.
 *
 * @param id - The capability id to look up.
 * @returns The registered capability, or undefined.
 */
export function getCapability(id: string): Readonly<Capability> | undefined {
  return capabilityRegistry.get(id);
}

/**
 * Returns all registered capabilities in insertion order.
 *
 * @returns An array of all registered capabilities.
 */
export function getAllCapabilities(): ReadonlyArray<Readonly<Capability>> {
  return Array.from(capabilityRegistry.values());
}

/**
 * Clears all entries from the capability registry.
 *
 * **Intended for test use only. Do not call in production code.**
 * Calling this in production will silently discard all registered
 * capabilities, breaking manifest generation.
 */
export function clearCapabilityRegistry(): void {
  capabilityRegistry.clear();
}
