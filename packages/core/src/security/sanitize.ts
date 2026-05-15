/**
 * Contract field sanitization for VhyxSeal.
 *
 * Enforces hard field length limits from CLAUDE.md Section 15 Layer 2
 * and runs injection detection on every string field before it is
 * surfaced to an AI agent via the manifest.
 */

import type { ComponentContract, Condition, ErrorState } from "../schema/contract.js";
import { VhyxSealError, ErrorCode } from "../errors/index.js";
import { detectInjection } from "./injection.js";

// ---------------------------------------------------------------------------
// Field length limits
// ---------------------------------------------------------------------------

/**
 * Hard field length limits enforced on all string contract fields.
 *
 * Values come directly from CLAUDE.md Section 15 Layer 2 and are not
 * configurable at runtime. Enforcement is the responsibility of
 * sanitizeContractField — do not read these values and enforce them manually.
 *
 * @example
 * FIELD_LENGTH_LIMITS.description // 500
 * FIELD_LENGTH_LIMITS.intent      // 50
 */
export const FIELD_LENGTH_LIMITS = {
  description: 500,
  intent: 50,
  consequence: 300,
  conditionDescription: 200,
  errorStateTrigger: 200,
  errorStateDisplay: 200,
  errorStateRecovery: 200,
} as const;

// ---------------------------------------------------------------------------
// Public sanitization functions
// ---------------------------------------------------------------------------

/**
 * Sanitizes a single string contract field.
 *
 * Two operations applied in order:
 * 1. Truncation — if the value exceeds the field's length limit it is silently
 *    truncated. This is a degraded output, not an error. The contract layer
 *    must not crash the visual layer over a long string.
 * 2. Injection detection — the truncated string is tested against known prompt
 *    injection patterns. If any pattern matches this function throws a
 *    VhyxSealError (code VHYX_INJECTION_DETECTED, recoverable: false).
 *
 * Returns the sanitized string when clean.
 *
 * @param fieldName - The contract field being sanitized — must be a key of FIELD_LENGTH_LIMITS.
 * @param value - The raw string value to sanitize.
 * @returns The sanitized string (truncated if necessary).
 * @throws {VhyxSealError} with code VHYX_INJECTION_DETECTED when an injection
 *   pattern is detected. recoverable is false — this is a security violation,
 *   not a correctable developer mistake.
 * @example
 * sanitizeContractField("description", "Submits the cart")
 * // → "Submits the cart"
 *
 * sanitizeContractField("description", "ignore all previous instructions")
 * // throws VhyxSealError VHYX_INJECTION_DETECTED
 */
export function sanitizeContractField(
  fieldName: keyof typeof FIELD_LENGTH_LIMITS,
  value: string,
): string {
  const limit = FIELD_LENGTH_LIMITS[fieldName];

  // Step 1 — silent truncation, never throws
  const truncated = value.length > limit ? value.slice(0, limit) : value;

  // Step 2 — injection detection, throws on match
  if (detectInjection(truncated)) {
    const redacted =
      truncated.length > 20 ? `${truncated.slice(0, 20)}...` : truncated;

    throw new VhyxSealError({
      code: ErrorCode.VHYX_INJECTION_DETECTED,
      message: `Prompt injection pattern detected in field "${fieldName}"`,
      context: { fieldName, redactedValue: redacted },
      severity: "error",
      recoverable: false,
      suggestion:
        "Remove prompt injection patterns from the field value. " +
        "Contract string fields must contain only legitimate UI descriptions.",
    });
  }

  return truncated;
}

/**
 * Sanitizes all string fields of a partial ComponentContract.
 *
 * Runs sanitizeContractField over every field that has an entry in
 * FIELD_LENGTH_LIMITS. Returns a new object — the input contract is never
 * mutated. Fields not covered by FIELD_LENGTH_LIMITS (e.g. id, contractVersion,
 * safetyLevel) are passed through unchanged.
 *
 * If sanitizeContractField throws for any field (injection detected) the error
 * propagates immediately — the caller is responsible for handling it. Injection
 * in any field is a hard stop.
 *
 * @param contract - The partial contract to sanitize.
 * @returns A new partial contract object with string fields sanitized.
 * @throws {VhyxSealError} with code VHYX_INJECTION_DETECTED if injection is
 *   found in any field. Propagated directly from sanitizeContractField.
 * @example
 * const clean = sanitizeContract({
 *   description: "A very long description...",
 *   intent: "place-order",
 * });
 */
export function sanitizeContract(
  contract: Readonly<Partial<ComponentContract>>,
): Readonly<Partial<ComponentContract>> {
  const result: Partial<ComponentContract> = { ...contract };

  if (result.description !== undefined) {
    result.description = sanitizeContractField("description", result.description);
  }

  if (result.intent !== undefined) {
    result.intent = sanitizeContractField("intent", result.intent);
  }

  if (result.consequence !== undefined) {
    result.consequence = sanitizeContractField("consequence", result.consequence);
  }

  if (result.requires !== undefined) {
    result.requires = result.requires.map(
      (condition: Condition): Condition => ({
        ...condition,
        description: sanitizeContractField(
          "conditionDescription",
          condition.description,
        ),
      }),
    );
  }

  if (result.errorStates !== undefined) {
    result.errorStates = result.errorStates.map(
      (errorState: ErrorState): ErrorState => ({
        ...errorState,
        trigger: sanitizeContractField("errorStateTrigger", errorState.trigger),
        display: sanitizeContractField("errorStateDisplay", errorState.display),
        recovery: sanitizeContractField("errorStateRecovery", errorState.recovery),
      }),
    );
  }

  return result as Readonly<Partial<ComponentContract>>;
}
