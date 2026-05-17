import { SealElement } from "./base/SealElement.js";

/**
 * VhyxSeal button custom element. Use as <seal-button>.
 * Functionally identical to a native <button> with VhyxSeal contract support.
 *
 * @example
 * <seal-button id="checkout-btn">Place Order</seal-button>
 *
 * @example — setting contract via JavaScript
 * const btn = document.querySelector('seal-button');
 * btn.contract = defineContract({ id: 'checkout-btn', ... });
 */
export class SealButton extends SealElement {
  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "button");
    }
    if (!this.hasAttribute("tabindex")) {
      this.setAttribute("tabindex", "0");
    }
  }
}
