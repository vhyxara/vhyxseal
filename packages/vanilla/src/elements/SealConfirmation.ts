import { SealElement } from "./base/SealElement.js";

/**
 * VhyxSeal confirmation custom element. Use as <seal-confirmation>.
 * Manages confirmation state and dispatches custom events.
 *
 * Events dispatched:
 * - vhyxseal:request-confirmation — fired when requestConfirmation() called
 * - vhyxseal:confirmed — fired when confirm() called
 * - vhyxseal:cancelled — fired when cancel() called
 * - vhyxseal:reset — fired when reset() called
 *
 * @example
 * const el = document.querySelector('seal-confirmation');
 * el.addEventListener('vhyxseal:confirmed', () => proceedWithAction());
 * el.requestConfirmation();
 */
export class SealConfirmation extends SealElement {
  // Private fields compile to WeakMap for ES2020 target — true runtime privacy.
  #confirmed = false;
  #isPending = false;

  get confirmed(): boolean { return this.#confirmed; }
  get isPending(): boolean { return this.#isPending; }

  requestConfirmation(): void {
    this.#isPending = true;
    this.dispatchEvent(new CustomEvent("vhyxseal:request-confirmation", { bubbles: true }));
  }

  confirm(): void {
    this.#confirmed = true;
    this.#isPending = false;
    this.dispatchEvent(new CustomEvent("vhyxseal:confirmed", { bubbles: true }));
  }

  cancel(): void {
    this.#isPending = false;
    this.dispatchEvent(new CustomEvent("vhyxseal:cancelled", { bubbles: true }));
  }

  reset(): void {
    this.#confirmed = false;
    this.#isPending = false;
    this.dispatchEvent(new CustomEvent("vhyxseal:reset", { bubbles: true }));
  }
}
