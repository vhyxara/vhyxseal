import { inject, ref, readonly, computed } from "vue";
import { SEAL_CONTEXT_KEY } from "../plugin/index.js";
import type { SealContextValue } from "../plugin/index.js";
import type { ComponentContract, SafetyLevel } from "@vhyxseal/core";

/**
 * Injects the VhyxSeal context. Must be called inside a component that is
 * a descendant of an app using VhyxSealPlugin.
 *
 * @throws {Error} when used outside VhyxSealPlugin scope
 */
export function useSeal(): SealContextValue {
  const ctx = inject<SealContextValue>(SEAL_CONTEXT_KEY);
  if (!ctx) {
    throw new Error(
      "[VhyxSeal] useSeal() must be called inside a component within an app " +
        "that has installed VhyxSealPlugin. Call app.use(VhyxSealPlugin, options) first.",
    );
  }
  return ctx;
}

/**
 * Returns the contract registered under the given id, or undefined if not found.
 * Must be called within a component under VhyxSealPlugin.
 *
 * @param id - The contract id to look up
 * @returns The contract if registered, undefined otherwise
 */
export function useContract(id: string): Readonly<ComponentContract> | undefined {
  const ctx = useSeal();
  return ctx.contracts.get(id);
}

/**
 * Returns a structured capability map of all registered contracts.
 * Must be called within a component under VhyxSealPlugin.
 *
 * @returns Capability map with contracts, counts, groupings, and current manifest
 */
export function useCapability() {
  const ctx = useSeal();
  const contracts = ctx.contracts;

  const byType: Record<string, Readonly<ComponentContract>[]> = {};
  const bySafetyLevel: Record<string, Readonly<ComponentContract>[]> = {};

  for (const contract of contracts.values()) {
    if (!byType[contract.type]) byType[contract.type] = [];
    byType[contract.type]!.push(contract);
    if (!bySafetyLevel[contract.safetyLevel]) bySafetyLevel[contract.safetyLevel] = [];
    bySafetyLevel[contract.safetyLevel]!.push(contract);
  }

  return {
    contracts,
    contractCount: contracts.size,
    byType: readonly(byType),
    bySafetyLevel: readonly(bySafetyLevel),
    hasContracts: contracts.size > 0,
    manifest: ctx.manifest,
  };
}

/** Lifecycle status of an agent-initiated action. */
export type AgentActionStatus =
  | "idle"
  | "pending"
  | "confirmed"
  | "completed"
  | "failed"
  | "cancelled";

/** Record of a single agent action and its full lifecycle. */
export interface AgentActionRecord {
  actionId: string;
  contractId: string;
  intent: string;
  safetyLevel: SafetyLevel;
  requiresConfirmation: boolean;
  humanConfirmed: boolean;
  status: AgentActionStatus;
  initiatedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

/**
 * Self-contained action tracking composable. Does NOT require VhyxSealPlugin.
 * Mirrors React useAgentAction in behavior and lifecycle.
 *
 * @returns Action tracking functions and reactive state
 * @example
 * const { initiateAction, completeAction, actions } = useAgentAction()
 */
export function useAgentAction() {
  const actions = ref<AgentActionRecord[]>([]);
  let counter = 0;

  function initiateAction(contract: Readonly<ComponentContract>): string {
    counter += 1;
    const actionId = `agent-action-${counter}-${Date.now()}`;
    actions.value = [
      {
        actionId,
        contractId: contract.id,
        intent: contract.intent,
        safetyLevel: contract.safetyLevel,
        requiresConfirmation: contract.requiresConfirmation,
        humanConfirmed: false,
        status: "pending",
        initiatedAt: new Date().toISOString(),
      },
      ...actions.value,
    ];
    return actionId;
  }

  function updateAction(actionId: string, updates: Partial<AgentActionRecord>): void {
    actions.value = actions.value.map(a =>
      a.actionId === actionId ? { ...a, ...updates } : a,
    );
  }

  return {
    actions: readonly(actions),
    currentAction: computed(() => actions.value[0] ?? null),
    isActionInProgress: computed(() =>
      actions.value.some(a => a.status === "pending" || a.status === "confirmed"),
    ),
    initiateAction,
    confirmAction: (id: string) => { updateAction(id, { humanConfirmed: true, status: "confirmed" }); },
    completeAction: (id: string) => { updateAction(id, { status: "completed", completedAt: new Date().toISOString() }); },
    failAction: (id: string, errorMessage: string) => { updateAction(id, { status: "failed", completedAt: new Date().toISOString(), errorMessage }); },
    cancelAction: (id: string) => { updateAction(id, { status: "cancelled", completedAt: new Date().toISOString() }); },
    clearActions: () => { actions.value = []; },
  };
}
