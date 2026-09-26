import { globalRegistry } from "../../utils/global-registry.js";
import type { ComponentContract } from "@vhyxseal/core";

/**
 * `HTMLElement` does not exist during server-side rendering (Next.js, Nuxt, Astro).
 * Falling back to an empty class keeps importing this package safe on the server;
 * elements are only ever constructed in a browser, where the real base is used.
 */
const BaseElement: typeof HTMLElement =
  typeof HTMLElement === "undefined"
    ? (class {} as unknown as typeof HTMLElement)
    : HTMLElement;

/**
 * Base class for all VhyxSeal custom elements.
 * Handles contract registration and unregistration via Web Component lifecycle.
 * @internal — extend this to create VhyxSeal custom elements
 */
export abstract class SealElement extends BaseElement {
  // Private class fields compile to WeakMap for ES2020 target — true runtime privacy.
  #contract: Readonly<ComponentContract> | undefined = undefined;

  /**
   * Sets the contract for this element and re-registers it if already connected.
   */
  set contract(value: Readonly<ComponentContract> | undefined) {
    this.#contract = value;
    if (this.isConnected && value) {
      globalRegistry.registerContract(value);
    }
  }

  get contract(): Readonly<ComponentContract> | undefined {
    return this.#contract;
  }

  connectedCallback(): void {
    if (this.#contract) {
      globalRegistry.registerContract(this.#contract);
    }
  }

  disconnectedCallback(): void {
    if (this.#contract) {
      globalRegistry.unregisterContract(this.#contract.id);
    }
  }
}
