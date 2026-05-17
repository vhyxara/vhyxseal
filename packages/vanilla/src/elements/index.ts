import { SealButton } from "./SealButton.js";
import { SealInput } from "./SealInput.js";
import { SealForm } from "./SealForm.js";
import { SealNav } from "./SealNav.js";
import { SealDisplay } from "./SealDisplay.js";
import { SealConfirmation } from "./SealConfirmation.js";

export { SealButton, SealInput, SealForm, SealNav, SealDisplay, SealConfirmation };

/**
 * Registers all VhyxSeal custom elements with the browser's custom element registry.
 * Call once at app startup before using any seal-* elements in HTML.
 *
 * @example
 * import { defineVhyxSealElements } from '@vhyxseal/vanilla';
 * defineVhyxSealElements();
 * // Now <seal-button>, <seal-input> etc. work in HTML
 */
export function defineVhyxSealElements(): void {
  if (typeof customElements === "undefined") return;
  if (!customElements.get("seal-button")) customElements.define("seal-button", SealButton);
  if (!customElements.get("seal-input")) customElements.define("seal-input", SealInput);
  if (!customElements.get("seal-form")) customElements.define("seal-form", SealForm);
  if (!customElements.get("seal-nav")) customElements.define("seal-nav", SealNav);
  if (!customElements.get("seal-display")) customElements.define("seal-display", SealDisplay);
  if (!customElements.get("seal-confirmation")) customElements.define("seal-confirmation", SealConfirmation);
}
