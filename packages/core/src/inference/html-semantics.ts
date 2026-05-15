/**
 * HTML semantic hints for the inference engine.
 *
 * Internal module — not exported from the package public API.
 * Maps HTML tag names to partial ComponentContract defaults based on
 * the semantic meaning of the element alone, without any attributes.
 *
 * Anchor tag inference is intentionally excluded here because it depends
 * on whether an href attribute is present — that context-sensitive logic
 * lives in inferContract() directly.
 */

import type { ComponentContract } from "../schema/contract.js";

/**
 * Returns a partial contract derived purely from the HTML tag name, or
 * undefined for tags with no useful semantic inference value.
 *
 * @param tagName - Lowercase HTML tag name e.g. "button", "form", "nav".
 * @returns A partial ComponentContract with inferred fields, or undefined.
 */
export function getSemanticHints(
  tagName: string,
): Readonly<Partial<ComponentContract>> | undefined {
  switch (tagName) {
    case "button":
      return { type: "action" };
    case "form":
      return { type: "input" };
    case "select":
    case "textarea":
      return { type: "input" };
    case "dialog":
      return { type: "confirmation" };
    case "nav":
      return { type: "navigation" };
    default:
      return undefined;
  }
}
