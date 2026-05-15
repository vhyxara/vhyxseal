import { useState, useCallback, type ReactNode } from "react";
import type { ComponentContract } from "@vhyxseal/core";
import { useContractRegistration } from "../shared/useContractRegistration.js";

/**
 * State and handlers exposed to the Confirmation render prop.
 */
export interface ConfirmationState {
  /** True once the user has confirmed the action. */
  confirmed: boolean;
  /** True while the confirmation UI is being presented to the user. */
  isPending: boolean;
  /** Request confirmation — transitions to pending state. */
  requestConfirmation: () => void;
  /** User confirmed — sets confirmed true and clears pending. */
  confirm: () => void;
  /** User cancelled — clears pending, leaves confirmed unchanged. */
  cancel: () => void;
  /** Reset to initial state (confirmed false, isPending false). */
  reset: () => void;
}

/**
 * Props for the Confirmation component.
 */
export interface ConfirmationProps {
  /** Optional VhyxSeal contract. When provided, registers with the nearest SealProvider. */
  contract?: Readonly<ComponentContract>;
  /**
   * Render prop. Receives the current confirmation state and handlers.
   * The component renders nothing itself — the caller provides the UI.
   */
  children: (state: ConfirmationState) => ReactNode;
}

/**
 * Headless confirmation gate component with optional VhyxSeal contract registration.
 * Manages confirmation lifecycle state and exposes it via render prop.
 * The component renders no DOM elements of its own — developers bring their own UI.
 * Does not require a SealProvider.
 *
 * @example
 * <Confirmation contract={deleteContract}>
 *   {({ confirmed, isPending, requestConfirmation, confirm, cancel }) => (
 *     <>
 *       <button onClick={requestConfirmation}>Delete</button>
 *       {isPending && (
 *         <dialog open>
 *           <p>Are you sure?</p>
 *           <button onClick={confirm}>Yes</button>
 *           <button onClick={cancel}>No</button>
 *         </dialog>
 *       )}
 *     </>
 *   )}
 * </Confirmation>
 */
export function Confirmation({
  contract,
  children,
}: ConfirmationProps): ReactNode {
  useContractRegistration(contract);

  const [confirmed, setConfirmed] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const requestConfirmation = useCallback((): void => {
    setIsPending(true);
  }, []);

  const confirm = useCallback((): void => {
    setConfirmed(true);
    setIsPending(false);
  }, []);

  const cancel = useCallback((): void => {
    setIsPending(false);
  }, []);

  const reset = useCallback((): void => {
    setConfirmed(false);
    setIsPending(false);
  }, []);

  return children({
    confirmed,
    isPending,
    requestConfirmation,
    confirm,
    cancel,
    reset,
  });
}
