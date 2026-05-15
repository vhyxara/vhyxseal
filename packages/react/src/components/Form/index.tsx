import React from "react";
import type { ComponentContract } from "@vhyxseal/core";
import { useContractRegistration } from "../shared/useContractRegistration.js";

/**
 * Props for the Form component.
 * Extends all standard HTML form attributes.
 */
export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  /** Optional VhyxSeal contract. When provided, registers with the nearest SealProvider. */
  contract?: Readonly<ComponentContract>;
  children: React.ReactNode;
}

/**
 * Headless form wrapper with optional VhyxSeal contract registration.
 * Renders a native <form> element. All standard HTML form attributes are forwarded.
 * Supports ref forwarding. Degrades gracefully when no SealProvider is present.
 *
 * @example
 * const loginContract = defineContract({ id: 'login-form', intent: 'authenticate', ... });
 * <Form contract={loginContract} onSubmit={handleSubmit}>
 *   <Input type="email" /><Button type="submit">Sign In</Button>
 * </Form>
 */
export const Form = React.forwardRef<HTMLFormElement, FormProps>(
  function Form({ contract, children, ...rest }, ref) {
    useContractRegistration(contract);
    return (
      <form ref={ref} {...rest}>
        {children}
      </form>
    );
  },
);

Form.displayName = "Form";
