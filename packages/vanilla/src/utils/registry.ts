import type { ComponentContract } from "@vhyxseal/core";

export interface SealRegistry {
  registerContract: (contract: Readonly<ComponentContract>) => void;
  unregisterContract: (id: string) => void;
  getContract: (id: string) => Readonly<ComponentContract> | undefined;
  getAllContracts: () => ReadonlyArray<Readonly<ComponentContract>>;
  clear: () => void;
}

/**
 * Creates an isolated VhyxSeal contract registry for use outside a framework context.
 * Each call returns a new independent registry instance.
 *
 * For use in vanilla JavaScript projects without a framework.
 * In React projects use SealProvider. In Vue projects use VhyxSealPlugin.
 *
 * @returns A new isolated SealRegistry instance
 * @example
 * const registry = createSealRegistry();
 * registry.registerContract(myContract);
 * const all = registry.getAllContracts();
 */
export function createSealRegistry(): SealRegistry {
  const contracts = new Map<string, Readonly<ComponentContract>>();

  return {
    registerContract(contract) {
      contracts.set(contract.id, contract);
    },
    unregisterContract(id) {
      contracts.delete(id);
    },
    getContract(id) {
      return contracts.get(id);
    },
    getAllContracts() {
      return [...contracts.values()];
    },
    clear() {
      contracts.clear();
    },
  };
}
