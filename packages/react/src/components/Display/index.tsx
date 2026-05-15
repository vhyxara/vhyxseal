import React from "react";
import type { ComponentContract } from "@vhyxseal/core";
import { useContractRegistration } from "../shared/useContractRegistration.js";

/**
 * Props for the Display component.
 * Extends all standard HTML div attributes.
 */
export interface DisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional VhyxSeal contract. When provided, registers with the nearest SealProvider. */
  contract?: Readonly<ComponentContract>;
  children: React.ReactNode;
  /** ARIA live region behavior. Defaults to "polite". */
  live?: "off" | "polite" | "assertive";
}

/**
 * Headless read-only state display component with optional VhyxSeal contract registration.
 * Renders a <div> with an ARIA live region for accessible dynamic content updates.
 * Supports ref forwarding. Degrades gracefully when no SealProvider is present.
 *
 * @example
 * const statusContract = defineContract({ id: 'order-status', type: 'display', ... });
 * <Display contract={statusContract} live="polite">
 *   Order confirmed — shipping in 2 days
 * </Display>
 */
export const Display = React.forwardRef<HTMLDivElement, DisplayProps>(
  function Display({ contract, children, live, ...rest }, ref) {
    useContractRegistration(contract);
    return (
      <div ref={ref} aria-live={live ?? "polite"} {...rest}>
        {children}
      </div>
    );
  },
);

Display.displayName = "Display";
