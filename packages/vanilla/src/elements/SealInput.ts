import { SealElement } from "./base/SealElement.js";

/**
 * VhyxSeal input custom element. Use as <seal-input>.
 * Wraps a native input with VhyxSeal contract support.
 *
 * @example
 * <seal-input type="email"></seal-input>
 */
export class SealInput extends SealElement {
  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "textbox");
    }
  }
}
