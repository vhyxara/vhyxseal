/**
 * ARIA role hints for the inference engine.
 *
 * Internal module — not exported from the package public API.
 * Maps explicit ARIA role values to partial ComponentContract defaults.
 * Applied after HTML semantic hints — ARIA can correct or upgrade a type
 * derived from the tag alone.
 */

import type { ComponentContract } from "../schema/contract.js";

/**
 * Returns a partial contract derived from an explicit ARIA role, or
 * undefined for roles with no useful inference value.
 *
 * @param ariaRole - The ARIA role string e.g. "button", "link", "dialog".
 * @returns A partial ComponentContract with inferred fields, or undefined.
 */
export function getAriaHints(
  ariaRole: string,
): Readonly<Partial<ComponentContract>> | undefined {
  switch (ariaRole) {
    case "button":
      return { type: "action" };
    case "link":
      return { type: "navigation" };
    case "textbox":
    case "searchbox":
      return { type: "input" };
    case "dialog":
    case "alertdialog":
      return { type: "confirmation" };
    case "navigation":
      return { type: "navigation" };
    default:
      return undefined;
  }
}
