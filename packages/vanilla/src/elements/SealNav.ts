import { SealElement } from "./base/SealElement.js";

/**
 * VhyxSeal nav custom element. Use as <seal-nav>.
 *
 * @example
 * <seal-nav>...</seal-nav>
 */
export class SealNav extends SealElement {
  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "navigation");
    }
  }
}
