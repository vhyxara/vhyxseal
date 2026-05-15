/**
 * Auto-inference engine — produces a best-guess ComponentContract from
 * HTML semantics, ARIA attributes, element props, and text content.
 *
 * This is the foundation of Level 0 adoption: zero-effort contracts.
 * The engine never throws — degraded input always yields a degraded
 * (not absent) result so the visual layer is never affected.
 */

import type { ComponentContract, ComponentType } from "../schema/contract.js";
import {
  isKnownIntent,
  resolveIntentDefaults,
} from "../schema/intents.js";
import { getSemanticHints } from "./html-semantics.js";
import { getAriaHints } from "./aria-hints.js";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * All observable signals about a DOM element that the inference engine uses
 * to derive a partial ComponentContract.
 */
export interface InferenceInput {
  /** The HTML tag name in lowercase e.g. "button", "a", "input". */
  tagName: string;
  /** ARIA role if explicitly set e.g. "button", "link", "textbox". */
  ariaRole?: string;
  /** ARIA label if set. */
  ariaLabel?: string;
  /** The visible text content of the element, trimmed. */
  textContent?: string;
  /** The input type attribute if tagName is "input" e.g. "text", "email", "password", "submit". */
  inputType?: string;
  /** The href attribute if present. */
  href?: string;
  /** Whether the element has a disabled attribute. */
  disabled?: boolean;
  /** Additional data attributes as key-value pairs e.g. { "data-intent": "place-order" }. */
  dataAttributes?: Readonly<Record<string, string>>;
}

/**
 * The output of the inference engine — a partial contract with a confidence
 * rating and explanation of what was and was not inferred.
 */
export interface InferenceResult {
  /** The inferred partial contract — only fields we are confident about. */
  inferred: Readonly<Partial<ComponentContract>>;
  /** Confidence level of the inference. */
  confidence: "high" | "medium" | "low";
  /** Human readable explanation of what was inferred and why — for DevTools display. */
  reasoning: string;
  /** Fields that could not be inferred and should be specified by the developer. */
  missing: ReadonlyArray<keyof ComponentContract>;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns the higher of two confidence levels.
 */
function maxConfidence(
  a: "high" | "medium" | "low",
  b: "high" | "medium" | "low",
): "high" | "medium" | "low" {
  if (a === "high" || b === "high") return "high";
  if (a === "medium" || b === "medium") return "medium";
  return "low";
}

/**
 * Text pattern → intent mapping for button-type elements.
 * Only applied when no higher-priority signal has provided an intent.
 * Confidence stays "medium" because text content is unreliable.
 */
function inferIntentFromText(textLower: string): string | undefined {
  if (textLower.includes("delete") || textLower.includes("remove")) {
    return "delete-item";
  }
  if (textLower.includes("cancel")) {
    return "cancel-booking";
  }
  if (textLower.includes("pay") || textLower.includes("checkout") || textLower.includes("purchase") || textLower.includes("order")) {
    return "place-order";
  }
  if (textLower.includes("publish")) {
    return "publish-content";
  }
  if (textLower.includes("share")) {
    return "share-item";
  }
  if (textLower.includes("upload")) {
    return "upload-file";
  }
  if (textLower.includes("download")) {
    return "download-file";
  }
  if (textLower.includes("send")) {
    return "send-message";
  }
  if (textLower.includes("search")) {
    return "search";
  }
  if (textLower.includes("sign in") || textLower.includes("log in") || textLower.includes("login")) {
    return "sign-in";
  }
  if (textLower.includes("sign out") || textLower.includes("log out") || textLower.includes("logout")) {
    return "sign-out";
  }
  if (textLower.includes("submit") || textLower.includes("save")) {
    return "submit-form";
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Infers a partial ComponentContract from observable element signals.
 *
 * Applies inference in priority order:
 * 1. data-intent attribute (highest confidence)
 * 2. input[type] attribute
 * 3. Semantic HTML tag name
 * 4. ARIA role
 * 5. Text content heuristics (lowest confidence, action elements only)
 *
 * Never throws — completely unknown input returns a low-confidence result
 * with an empty inferred object rather than an error.
 *
 * @param input - Observable signals about the element.
 * @returns An InferenceResult with the partial contract, confidence, reasoning, and missing fields.
 * @example
 * const result = inferContract({
 *   tagName: "button",
 *   textContent: "Place Order",
 * });
 * // result.inferred.type === "action"
 * // result.inferred.intent === "place-order"
 * // result.confidence === "medium"
 */
export function inferContract(input: InferenceInput): InferenceResult {
  // Working state accumulated across priority levels
  let type: ComponentType | undefined;
  let intent: string | undefined;
  let safetyLevel: ComponentContract["safetyLevel"] | undefined;
  let reversible: boolean | undefined;
  let requiresConfirmation: boolean | undefined;
  let destructive: boolean | undefined;
  let confidence: "high" | "medium" | "low" = "low";
  const reasoningParts: string[] = [];

  /**
   * Merges intent defaults into working state without overwriting values
   * already set by a higher-priority signal.
   */
  function applyIntentDefaults(resolvedIntent: string): void {
    const defaults = resolveIntentDefaults(resolvedIntent);
    if (defaults === undefined) return;
    if (safetyLevel === undefined && defaults.safetyLevel !== undefined) {
      safetyLevel = defaults.safetyLevel;
    }
    if (reversible === undefined && defaults.reversible !== undefined) {
      reversible = defaults.reversible;
    }
    if (requiresConfirmation === undefined && defaults.requiresConfirmation !== undefined) {
      requiresConfirmation = defaults.requiresConfirmation;
    }
    if (destructive === undefined && defaults.destructive !== undefined) {
      destructive = defaults.destructive;
    }
  }

  // -------------------------------------------------------------------------
  // Priority 1 — data-intent attribute
  // -------------------------------------------------------------------------
  const dataIntent = input.dataAttributes?.["data-intent"];
  if (dataIntent !== undefined && dataIntent.length > 0) {
    intent = dataIntent;
    if (isKnownIntent(dataIntent)) {
      applyIntentDefaults(dataIntent);
      confidence = maxConfidence(confidence, "high");
      reasoningParts.push(
        `Intent explicitly declared via data-intent attribute ("${dataIntent}")`,
      );
    } else {
      confidence = maxConfidence(confidence, "medium");
      reasoningParts.push(
        `data-intent attribute present but intent "${dataIntent}" is not in the known vocabulary`,
      );
    }
  }

  // -------------------------------------------------------------------------
  // Priority 2 — input[type] inference
  // -------------------------------------------------------------------------
  if (input.tagName === "input") {
    switch (input.inputType) {
      case "password":
        type = "input";
        if (intent === undefined) {
          intent = "collect-password";
          applyIntentDefaults("collect-password");
        }
        confidence = maxConfidence(confidence, "high");
        reasoningParts.push("input[type=password] — collect-password intent inferred");
        break;

      case "email":
        type = "input";
        if (intent === undefined) {
          intent = "collect-email";
          applyIntentDefaults("collect-email");
        }
        confidence = maxConfidence(confidence, "high");
        reasoningParts.push("input[type=email] — collect-email intent inferred");
        break;

      case "submit":
        // submit inputs are actions, not inputs
        type = "action";
        if (intent === undefined) {
          intent = "submit-form";
          applyIntentDefaults("submit-form");
        }
        confidence = maxConfidence(confidence, "medium");
        reasoningParts.push("input[type=submit] — action type, submit-form intent inferred");
        break;

      case "search":
        type = "input";
        if (intent === undefined) {
          intent = "search";
          applyIntentDefaults("search");
        }
        confidence = maxConfidence(confidence, "high");
        reasoningParts.push("input[type=search] — search intent inferred");
        break;

      default:
        // All other input types: type is "input", no intent inferred
        type = "input";
        if (confidence === "low") {
          confidence = "low";
        }
        reasoningParts.push(
          `input[type=${input.inputType ?? "text"}] — input type inferred, no intent`,
        );
        break;
    }
  }

  // -------------------------------------------------------------------------
  // Priority 3 — semantic HTML tag
  // -------------------------------------------------------------------------
  if (type === undefined) {
    if (input.tagName === "a") {
      if (input.href !== undefined && input.href.length > 0) {
        type = "navigation";
        if (intent === undefined) {
          intent = "navigate";
          applyIntentDefaults("navigate");
        }
        confidence = maxConfidence(confidence, "high");
        reasoningParts.push("<a href> — navigation type, navigate intent inferred");
      } else {
        type = "action";
        confidence = maxConfidence(confidence, "low");
        reasoningParts.push("<a> without href — action type inferred, no intent");
      }
    } else {
      const semanticHints = getSemanticHints(input.tagName);
      if (semanticHints?.type !== undefined) {
        type = semanticHints.type;
        if (input.tagName === "nav") {
          confidence = maxConfidence(confidence, "high");
          reasoningParts.push("<nav> — navigation type inferred from semantic HTML");
        } else {
          confidence = maxConfidence(confidence, "medium");
          reasoningParts.push(
            `<${input.tagName}> — ${type} type inferred from semantic HTML`,
          );
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Priority 4 — ARIA role
  // -------------------------------------------------------------------------
  if (input.ariaRole !== undefined) {
    const ariaHints = getAriaHints(input.ariaRole);
    if (ariaHints?.type !== undefined) {
      type = ariaHints.type;
      reasoningParts.push(
        `ARIA role="${input.ariaRole}" — type set to ${type}`,
      );
      // button role upgrades confidence from medium → high
      if (input.ariaRole === "button" && confidence === "medium") {
        confidence = "high";
        reasoningParts.push(`ARIA role="button" upgrades confidence to high`);
      }
      if (input.ariaRole === "navigation") {
        confidence = maxConfidence(confidence, "high");
      }
    }
  }

  // -------------------------------------------------------------------------
  // Priority 5 — text content heuristics (action type only, no intent yet)
  // -------------------------------------------------------------------------
  if (
    type === "action" &&
    intent === undefined &&
    input.textContent !== undefined &&
    input.textContent.length > 0
  ) {
    const textLower = input.textContent.toLowerCase();
    const textIntent = inferIntentFromText(textLower);
    if (textIntent !== undefined) {
      intent = textIntent;
      applyIntentDefaults(textIntent);
      confidence = maxConfidence(confidence, "medium");
      reasoningParts.push(
        `Text content "${input.textContent}" suggests intent "${textIntent}"`,
      );
    }
  }

  // -------------------------------------------------------------------------
  // Build the inferred partial contract
  // -------------------------------------------------------------------------
  const inferred: Partial<ComponentContract> = {};
  if (type !== undefined) inferred.type = type;
  if (intent !== undefined) inferred.intent = intent;
  if (safetyLevel !== undefined) inferred.safetyLevel = safetyLevel;
  if (reversible !== undefined) inferred.reversible = reversible;
  if (requiresConfirmation !== undefined) inferred.requiresConfirmation = requiresConfirmation;
  if (destructive !== undefined) inferred.destructive = destructive;

  // -------------------------------------------------------------------------
  // Calculate missing fields
  // -------------------------------------------------------------------------
  const missing: Array<keyof ComponentContract> = [
    "id",
    "description",
    "requires",
    "requiredPermissions",
    "consequence",
    "affects",
    "contractVersion",
  ];
  if (inferred.safetyLevel === undefined) missing.push("safetyLevel");
  if (inferred.reversible === undefined) missing.push("reversible");
  if (inferred.requiresConfirmation === undefined) missing.push("requiresConfirmation");
  if (inferred.destructive === undefined) missing.push("destructive");

  if (reasoningParts.length === 0) {
    reasoningParts.push(
      `No meaningful signals found for tag "${input.tagName}" — inference yielded no result`,
    );
  }

  return {
    inferred: inferred as Readonly<Partial<ComponentContract>>,
    confidence,
    reasoning: reasoningParts.join("; "),
    missing: missing as ReadonlyArray<keyof ComponentContract>,
  };
}
