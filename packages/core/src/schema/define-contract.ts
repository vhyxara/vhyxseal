/**
 * defineContract — the primary developer API for creating typed component contracts.
 *
 * This is the Level 3 adoption entry point. Merges intent vocabulary defaults,
 * sanitizes all string fields, fingerprints the content, and validates completeness
 * before returning a sealed contract object.
 */

import type { ComponentContract } from "./contract.js";
import { resolveIntentDefaults } from "./intents.js";
import { sanitizeContract } from "../security/index.js";
import { generateFingerprint, validateContract } from "../manifest/generator.js";
import { VhyxSealError, ErrorCode } from "../errors/index.js";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Checks which required ComponentContract fields are absent or invalid. */
function findMissingFields(
  contract: Readonly<Partial<ComponentContract>>,
): ReadonlyArray<keyof ComponentContract> {
  const missing: Array<keyof ComponentContract> = [];

  if (typeof contract.id !== "string" || contract.id.length === 0) {
    missing.push("id");
  }
  if (contract.type === undefined) {
    missing.push("type");
  }
  if (typeof contract.intent !== "string" || contract.intent.length === 0) {
    missing.push("intent");
  }
  if (
    typeof contract.description !== "string" ||
    contract.description.length === 0
  ) {
    missing.push("description");
  }
  if (!Array.isArray(contract.requires)) {
    missing.push("requires");
  }
  if (!Array.isArray(contract.requiredPermissions)) {
    missing.push("requiredPermissions");
  }
  if (
    typeof contract.consequence !== "string" ||
    contract.consequence.length === 0
  ) {
    missing.push("consequence");
  }
  if (!Array.isArray(contract.affects)) {
    missing.push("affects");
  }
  if (typeof contract.reversible !== "boolean") {
    missing.push("reversible");
  }
  if (contract.safetyLevel === undefined) {
    missing.push("safetyLevel");
  }
  if (typeof contract.requiresConfirmation !== "boolean") {
    missing.push("requiresConfirmation");
  }
  if (typeof contract.destructive !== "boolean") {
    missing.push("destructive");
  }
  if (
    typeof contract.contractVersion !== "string" ||
    contract.contractVersion.length === 0
  ) {
    missing.push("contractVersion");
  }

  return missing;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Creates a validated, sanitized, and fingerprinted ComponentContract.
 *
 * This is the primary API for developers defining contracts at Level 3.
 * Explicit fields in the provided contract always override intent vocabulary defaults.
 *
 * Steps performed:
 * 1. Merge intent vocabulary defaults under the provided fields (explicit wins).
 * 2. Sanitize all string fields against injection patterns and length limits.
 * 3. Generate a content fingerprint for drift detection.
 * 4. Set lastVerified and verifiedBy metadata.
 * 5. Validate completeness — throws if required fields are still missing.
 *
 * @param contract - The contract definition. The `intent` field is used to look up
 *   vocabulary defaults for safetyLevel, reversible, requiresConfirmation, and destructive.
 * @returns A readonly, fingerprinted ComponentContract.
 * @throws {VhyxSealError} VHYX_INJECTION_DETECTED if any string field contains
 *   a prompt injection pattern. recoverable: false.
 * @throws {VhyxSealError} VHYX_CONTRACT_VALIDATION_FAILED if required fields are
 *   still missing after merging intent defaults. recoverable: true. Context includes
 *   the list of missing field names.
 * @example
 * const orderContract = defineContract({
 *   id: "checkout-submit-btn",
 *   type: "action",
 *   intent: "place-order",
 *   description: "Submits the current cart as a purchase order",
 *   requires: [{ field: "user.authenticated", operator: "===", value: true, description: "User must be logged in" }],
 *   requiredPermissions: ["write:orders"],
 *   consequence: "Creates order record and charges payment method",
 *   affects: ["cart", "orders"],
 *   contractVersion: "1.0.0",
 * });
 */
export function defineContract(
  contract: Readonly<Partial<ComponentContract>>,
): Readonly<ComponentContract> {
  // Step 1 — merge intent defaults under provided fields (provided wins)
  let merged: Readonly<Partial<ComponentContract>>;
  if (contract.intent !== undefined) {
    const intentDefaults = resolveIntentDefaults(contract.intent);
    merged = intentDefaults !== undefined
      ? { ...intentDefaults, ...contract }
      : contract;
  } else {
    merged = contract;
  }

  // Step 2 — sanitize all string fields (may throw on injection)
  const sanitized = sanitizeContract(merged);

  // Steps 3–5 — add fingerprint and verification metadata
  const withMeta: Partial<ComponentContract> = {
    ...sanitized,
    fingerprint: generateFingerprint(JSON.stringify(sanitized)),
    lastVerified: new Date().toISOString(),
    verifiedBy: "auto",
  };

  // Step 6 — validate completeness
  if (!validateContract(withMeta)) {
    const missingFields = findMissingFields(withMeta);
    throw new VhyxSealError({
      code: ErrorCode.VHYX_CONTRACT_VALIDATION_FAILED,
      message: `Contract validation failed: missing required fields [${missingFields.join(", ")}]`,
      context: { missingFields },
      severity: "error",
      recoverable: true,
      suggestion: `Add the missing fields to the contract definition: ${missingFields.join(", ")}.`,
    });
  }

  // Step 7 — return complete, frozen contract
  return Object.freeze(withMeta) as Readonly<ComponentContract>;
}
