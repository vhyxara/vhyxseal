import React from "react";
import type { ComponentContract } from "@vhyxseal/core";
import { useContractRegistration } from "../shared/useContractRegistration.js";

/**
 * Props for the Nav component.
 * Extends all standard HTML element attributes.
 */
export interface NavProps extends React.HTMLAttributes<HTMLElement> {
  /** Optional VhyxSeal contract. When provided, registers with the nearest SealProvider. */
  contract?: Readonly<ComponentContract>;
  children: React.ReactNode;
}

/**
 * Headless navigation wrapper with optional VhyxSeal contract registration.
 * Renders a native <nav> element. All standard HTML attributes are forwarded.
 * Supports ref forwarding. Degrades gracefully when no SealProvider is present.
 *
 * @example
 * const navContract = defineContract({ id: 'main-nav', intent: 'navigate', ... });
 * <Nav contract={navContract}>
 *   <a href="/home">Home</a>
 * </Nav>
 */
export const Nav = React.forwardRef<HTMLElement, NavProps>(
  function Nav({ contract, children, ...rest }, ref) {
    useContractRegistration(contract);
    return (
      <nav ref={ref} {...rest}>
        {children}
      </nav>
    );
  },
);

Nav.displayName = "Nav";
