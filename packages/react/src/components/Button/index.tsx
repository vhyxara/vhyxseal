import React from "react";
import type { ComponentContract } from "@vhyxseal/core";
import { useContractRegistration } from "../shared/useContractRegistration.js";

/**
 * Props for the Button component.
 * Extends all standard HTML button attributes.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Optional VhyxSeal contract. When provided, registers with the nearest SealProvider. */
  contract?: Readonly<ComponentContract>;
  children: React.ReactNode;
}

/**
 * Headless action button with optional VhyxSeal contract registration.
 * Renders a native <button> element. All standard HTML button attributes are forwarded.
 * Supports ref forwarding. Degrades gracefully when no SealProvider is present.
 *
 * @example
 * const orderContract = defineContract({ id: 'place-order-btn', intent: 'place-order', ... });
 * <Button contract={orderContract} onClick={handleOrder}>Place Order</Button>
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ contract, children, ...rest }, ref) {
    useContractRegistration(contract);
    return (
      <button ref={ref} {...rest}>
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
