import { useSealContext } from "../provider/context.js";
import type { ComponentContract } from "@vhyxseal/core";

/**
 * Returns the contract registered under the given id, or undefined if not found.
 * Must be used within a SealProvider.
 *
 * @param id - The contract id to look up.
 * @returns The contract if registered, undefined otherwise.
 * @throws {Error} when used outside a SealProvider.
 * @example
 * const contract = useContract('checkout-submit-btn');
 * if (contract) {
 *   console.log(contract.safetyLevel);
 * }
 */
export function useContract(id: string): Readonly<ComponentContract> | undefined {
  const ctx = useSealContext();
  return ctx.contracts.get(id);
}
