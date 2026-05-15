import { useSealContext } from "../provider/context.js";
import type { ComponentContract } from "@vhyxseal/core";

/**
 * Structured view of all contracts registered in the current SealProvider scope.
 * Useful for DevTools panels and agent-facing components.
 */
export interface CapabilityMap {
  /** All contracts keyed by component id. */
  contracts: ReadonlyMap<string, Readonly<ComponentContract>>;
  /** Total number of registered contracts. */
  contractCount: number;
  /** Contracts grouped by ComponentType (action, input, navigation, display, confirmation). */
  byType: Readonly<Record<string, ReadonlyArray<Readonly<ComponentContract>>>>;
  /** Contracts grouped by SafetyLevel (low, medium, high, critical, sensitive). */
  bySafetyLevel: Readonly<
    Record<string, ReadonlyArray<Readonly<ComponentContract>>>
  >;
  /** True when at least one contract is registered. */
  hasContracts: boolean;
  /** The most recently generated manifest, or null. */
  manifest: ReturnType<typeof useSealContext>["manifest"];
}

/**
 * Returns a structured capability map of all contracts in the current SealProvider scope.
 * Useful for DevTools panels and agent-facing components that need a higher-level view.
 * Must be used within a SealProvider.
 *
 * @returns CapabilityMap derived from all registered contracts.
 * @throws {Error} when used outside a SealProvider.
 * @example
 * const { contractCount, byType, hasContracts } = useCapability();
 * if (hasContracts) {
 *   const actionContracts = byType['action'] ?? [];
 * }
 */
export function useCapability(): CapabilityMap {
  const ctx = useSealContext();
  const { contracts } = ctx;

  const byType: Record<string, Readonly<ComponentContract>[]> = {};
  const bySafetyLevel: Record<string, Readonly<ComponentContract>[]> = {};

  for (const contract of contracts.values()) {
    const type = contract.type;
    if (!byType[type]) byType[type] = [];
    byType[type]!.push(contract);

    const level = contract.safetyLevel;
    if (!bySafetyLevel[level]) bySafetyLevel[level] = [];
    bySafetyLevel[level]!.push(contract);
  }

  return {
    contracts,
    contractCount: contracts.size,
    byType,
    bySafetyLevel,
    hasContracts: contracts.size > 0,
    manifest: ctx.manifest,
  };
}
