/**
 * SealContext — React context for the VhyxSeal contract layer.
 *
 * Kept in a separate file from the provider so hooks can import the context
 * without pulling in the provider JSX.
 */

import { createContext, useContext } from "react";
import type { ComponentContract, VhyxSealManifest } from "@vhyxseal/core";

/**
 * The value shape exposed by SealContext to all consumers.
 */
export interface SealContextValue {
  /** All contracts registered in this provider scope, keyed by component id. */
  contracts: ReadonlyMap<string, Readonly<ComponentContract>>;
  /**
   * Register a contract from a child component.
   * Called during render or in an effect — replaces any existing contract with the same id.
   */
  registerContract: (contract: Readonly<ComponentContract>) => void;
  /**
   * Unregister a contract by id.
   * Called when a child component unmounts. Silent if the id is not found.
   */
  unregisterContract: (id: string) => void;
  /** The most recently generated manifest, or null if generation has not yet occurred. */
  manifest: Readonly<VhyxSealManifest> | null;
  /** True when the provider is in development mode — enables verbose logging and DevTools. */
  isDev: boolean;
}

/** The React context for VhyxSeal. Default value is null — must be provided by SealProvider. */
export const SealContext = createContext<SealContextValue | null>(null);

/**
 * Returns the SealContext value. Throws when called outside a SealProvider.
 *
 * Throws a native Error (not VhyxSealError) because this is a developer
 * mistake caught at development time, not a runtime contract error that
 * should be handled gracefully.
 *
 * @throws {Error} when used outside a SealProvider.
 */
export function useSealContext(): SealContextValue {
  const ctx = useContext(SealContext);
  if (ctx === null) {
    throw new Error(
      "[VhyxSeal] useSealContext must be used within a SealProvider. " +
        "Wrap your application or component tree with <SealProvider>.",
    );
  }
  return ctx;
}
