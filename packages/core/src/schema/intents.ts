/**
 * Intent vocabulary — built-in defaults and runtime registration for custom intents.
 */

import type { ComponentContract } from "./contract.js";
import { VhyxSealError, ErrorCode } from "../errors/index.js";

/**
 * Built-in intent vocabulary with smart defaults.
 *
 * Maps each known intent name to a partial ComponentContract supplying default
 * field values. Immutable at both the map level and the individual entry level —
 * neither keys nor entry fields can be mutated at runtime.
 *
 * Extend the vocabulary at runtime using {@link registerIntent}.
 */
export const INTENT_DEFAULTS: Readonly<
  Record<string, Readonly<Partial<ComponentContract>>>
> = {
  "place-order": {
    safetyLevel: "high",
    reversible: true,
    requiresConfirmation: true,
    destructive: false,
  },
  "make-payment": {
    safetyLevel: "critical",
    reversible: false,
    requiresConfirmation: true,
    destructive: false,
  },
  "delete-account": {
    safetyLevel: "critical",
    reversible: false,
    requiresConfirmation: true,
    destructive: true,
  },
  "delete-item": {
    safetyLevel: "high",
    reversible: false,
    requiresConfirmation: true,
    destructive: true,
  },
  "send-message": {
    safetyLevel: "medium",
    reversible: false,
    requiresConfirmation: false,
    destructive: false,
  },
  "save-draft": {
    safetyLevel: "low",
    reversible: true,
    requiresConfirmation: false,
    destructive: false,
  },
  "submit-form": {
    safetyLevel: "medium",
    reversible: false,
    requiresConfirmation: false,
    destructive: false,
  },
  "update-profile": {
    safetyLevel: "medium",
    reversible: true,
    requiresConfirmation: false,
    destructive: false,
  },
  "sign-out": {
    safetyLevel: "low",
    reversible: true,
    requiresConfirmation: false,
    destructive: false,
  },
  "sign-in": {
    safetyLevel: "low",
    reversible: true,
    requiresConfirmation: false,
    destructive: false,
  },
  "apply-filter": {
    safetyLevel: "low",
    reversible: true,
    requiresConfirmation: false,
    destructive: false,
  },
  search: {
    safetyLevel: "low",
    reversible: true,
    requiresConfirmation: false,
    destructive: false,
  },
  "upload-file": {
    safetyLevel: "medium",
    reversible: true,
    requiresConfirmation: false,
    destructive: false,
  },
  "download-file": {
    safetyLevel: "low",
    reversible: true,
    requiresConfirmation: false,
    destructive: false,
  },
  "schedule-meeting": {
    safetyLevel: "medium",
    reversible: true,
    requiresConfirmation: false,
    destructive: false,
  },
  "cancel-booking": {
    safetyLevel: "high",
    reversible: false,
    requiresConfirmation: true,
    destructive: false,
  },
  "publish-content": {
    safetyLevel: "high",
    reversible: true,
    requiresConfirmation: true,
    destructive: false,
  },
  "unpublish-content": {
    safetyLevel: "high",
    reversible: true,
    requiresConfirmation: true,
    destructive: false,
  },
  "share-item": {
    safetyLevel: "medium",
    reversible: true,
    requiresConfirmation: false,
    destructive: false,
  },
  navigate: {
    safetyLevel: "low",
    reversible: true,
    requiresConfirmation: false,
    destructive: false,
  },
  "confirm-action": {
    safetyLevel: "high",
    reversible: false,
    requiresConfirmation: true,
    destructive: false,
  },
  "collect-email": {
    safetyLevel: "low",
    reversible: true,
    requiresConfirmation: false,
    destructive: false,
  },
  "collect-password": {
    safetyLevel: "sensitive",
    reversible: true,
    requiresConfirmation: false,
    destructive: false,
  },
  "collect-payment": {
    safetyLevel: "sensitive",
    reversible: false,
    requiresConfirmation: true,
    destructive: false,
  },
  authenticate: {
    safetyLevel: "medium",
    reversible: true,
    requiresConfirmation: false,
    destructive: false,
  },
} as const;

/** Internal registry for intents added at runtime via {@link registerIntent}. */
const customIntentRegistry = new Map<
  string,
  Readonly<Partial<ComponentContract>>
>();

/**
 * Registers a custom intent and its default contract fields at runtime.
 *
 * Extends the built-in {@link INTENT_DEFAULTS} vocabulary with domain-specific
 * intents. Once registered, the intent is recognised by {@link isKnownIntent}
 * and its defaults are returned by {@link resolveIntentDefaults}.
 *
 * @param intent - The intent name to register. Must be a non-empty string of
 *   at most 50 characters and must not already exist in the built-in defaults
 *   or the custom registry.
 * @param defaults - Partial ComponentContract providing default field values
 *   for this intent.
 * @returns void
 * @throws {VhyxSealError} with code VHYX_UNKNOWN_INTENT when intent is empty
 *   or not a string.
 * @throws {VhyxSealError} with code VHYX_FIELD_TOO_LONG when intent exceeds
 *   50 characters.
 * @throws {VhyxSealError} with code VHYX_DUPLICATE_INTENT when intent is already
 *   registered.
 * @example
 * registerIntent("request-refund", {
 *   safetyLevel: "high",
 *   reversible: false,
 *   requiresConfirmation: true,
 *   destructive: false,
 * });
 */
export function registerIntent(
  intent: string,
  defaults: Readonly<Partial<ComponentContract>>,
): void {
  if (typeof intent !== "string" || intent.length === 0) {
    throw new VhyxSealError({
      code: ErrorCode.VHYX_UNKNOWN_INTENT,
      message: "Intent name must be a non-empty string",
      context: { received: intent },
      severity: "error",
      recoverable: true,
      suggestion:
        "Provide a non-empty string as the intent name e.g. \"request-refund\"",
    });
  }

  if (intent.length > 50) {
    throw new VhyxSealError({
      code: ErrorCode.VHYX_FIELD_TOO_LONG,
      message: `Intent name exceeds the 50 character limit (received ${intent.length} characters)`,
      context: { intent, length: intent.length, limit: 50 },
      severity: "error",
      recoverable: true,
      suggestion:
        "Intent names must be 50 characters or fewer. Shorten the intent name.",
    });
  }

  if (
    Object.prototype.hasOwnProperty.call(INTENT_DEFAULTS, intent) ||
    customIntentRegistry.has(intent)
  ) {
    throw new VhyxSealError({
      code: ErrorCode.VHYX_DUPLICATE_INTENT,
      message: `Intent "${intent}" is already registered`,
      context: { intent },
      severity: "warning",
      recoverable: true,
      suggestion:
        "Use a unique intent name. Each intent can only be registered once.",
    });
  }

  customIntentRegistry.set(intent, defaults);
}

/**
 * Resolves the default contract fields for a given intent.
 *
 * Checks {@link INTENT_DEFAULTS} first, then falls back to the custom registry
 * populated by {@link registerIntent}. Returns undefined without throwing when
 * the intent is not found in either source.
 *
 * @param intent - The intent name to look up.
 * @returns The partial ComponentContract defaults for the intent, or undefined
 *   if the intent is not registered.
 */
export function resolveIntentDefaults(
  intent: string,
): Readonly<Partial<ComponentContract>> | undefined {
  const builtin = INTENT_DEFAULTS[intent];
  if (builtin !== undefined) {
    return builtin;
  }
  return customIntentRegistry.get(intent);
}

/**
 * Returns true if the intent exists in either the built-in vocabulary or the
 * custom registry. Does not throw.
 *
 * @param intent - The intent name to test.
 * @returns boolean
 */
export function isKnownIntent(intent: string): boolean {
  if (intent.length === 0) {
    return false;
  }
  return (
    Object.prototype.hasOwnProperty.call(INTENT_DEFAULTS, intent) ||
    customIntentRegistry.has(intent)
  );
}
