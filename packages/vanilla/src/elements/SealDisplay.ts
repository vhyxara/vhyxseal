import { SealElement } from "./base/SealElement.js";

/**
 * VhyxSeal display custom element. Use as <seal-display>.
 * Automatically sets aria-live="polite" for accessibility.
 *
 * @example
 * <seal-display>Current status: active</seal-display>
 */
export class SealDisplay extends SealElement {
  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("aria-live")) {
      this.setAttribute("aria-live", "polite");
    }
  }
}
