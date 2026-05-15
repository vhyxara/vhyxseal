import { useContext, useEffect } from "react";
import { SealContext } from "../../provider/context.js";
import type { ComponentContract } from "@vhyxseal/core";

/**
 * Internal hook. Registers a contract with the nearest SealProvider on mount and
 * unregisters on unmount. No-ops gracefully when no SealProvider is present or
 * when contract is undefined.
 *
 * @param contract - The contract to register, or undefined for no-op.
 * @internal — not exported from the package public API.
 */
export function useContractRegistration(
  contract: Readonly<ComponentContract> | undefined,
): void {
  const ctx = useContext(SealContext);

  useEffect(() => {
    if (!contract || !ctx) return;
    ctx.registerContract(contract);
    return () => {
      ctx.unregisterContract(contract.id);
    };
    // contract.id and contract.fingerprint as deps — re-register when contract identity or
    // content changes. ctx intentionally omitted: registerContract / unregisterContract are
    // stable useCallback references from SealProvider; including ctx causes infinite render
    // loops (Session 012 finding: "never put [ctx] in useEffect deps").
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract?.id, contract?.fingerprint]);
}
