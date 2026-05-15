import React from "react";
import type { ComponentContract } from "@vhyxseal/core";
import { useContractRegistration } from "../shared/useContractRegistration.js";

/**
 * Props for the Input component.
 * Extends all standard HTML input attributes.
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional VhyxSeal contract. When provided, registers with the nearest SealProvider. */
  contract?: Readonly<ComponentContract>;
}

/**
 * Headless input component with optional VhyxSeal contract registration.
 * Renders a native <input> element. All standard HTML input attributes are forwarded.
 * Supports ref forwarding. Degrades gracefully when no SealProvider is present.
 *
 * @example
 * const searchContract = defineContract({ id: 'search-input', intent: 'search', ... });
 * <Input contract={searchContract} type="search" placeholder="Search..." />
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ contract, ...rest }, ref) {
    useContractRegistration(contract);
    return <input ref={ref} {...rest} />;
  },
);

Input.displayName = "Input";
