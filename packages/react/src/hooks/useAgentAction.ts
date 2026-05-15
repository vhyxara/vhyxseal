import { useState, useRef, useCallback } from "react";
import type { ComponentContract, SafetyLevel } from "@vhyxseal/core";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Lifecycle status of a single agent-initiated action.
 */
export type AgentActionStatus =
  | "idle"
  | "pending"
  | "confirmed"
  | "completed"
  | "failed"
  | "cancelled";

/**
 * Immutable record of an agent action attempt, from initiation to terminal state.
 */
export interface AgentActionRecord {
  /** Unique identifier for this action instance. */
  actionId: string;
  /** The contract id of the component the agent acted on. */
  contractId: string;
  /** The intent from the component contract. */
  intent: string;
  /** The safety level inherited from the component contract. */
  safetyLevel: SafetyLevel;
  /** Whether the contract required human confirmation. */
  requiresConfirmation: boolean;
  /** True once a human has explicitly confirmed the action. */
  humanConfirmed: boolean;
  /** Current lifecycle status. */
  status: AgentActionStatus;
  /** ISO datetime when the action was initiated. */
  initiatedAt: string;
  /** ISO datetime when the action reached a terminal state. */
  completedAt?: string;
  /** Human-readable error message when status is "failed". */
  errorMessage?: string;
}

/**
 * Return value of useAgentAction.
 */
export interface UseAgentActionReturn {
  /** All action records, newest first. */
  actions: ReadonlyArray<AgentActionRecord>;
  /** The most recently initiated action, or null when none. */
  currentAction: Readonly<AgentActionRecord> | null;
  /**
   * Initiate a new action from the given contract.
   * @returns The actionId of the newly created record.
   */
  initiateAction: (contract: Readonly<ComponentContract>) => string;
  /** Mark an action as confirmed by a human. */
  confirmAction: (actionId: string) => void;
  /** Mark an action as successfully completed. */
  completeAction: (actionId: string) => void;
  /** Mark an action as failed with an error message. */
  failAction: (actionId: string, errorMessage: string) => void;
  /** Mark an action as cancelled. */
  cancelAction: (actionId: string) => void;
  /** Clear the entire action history. */
  clearActions: () => void;
  /** True when any action currently has status "pending" or "confirmed". */
  isActionInProgress: boolean;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Builds an updated AgentActionRecord from an existing record and explicit field
 * overrides. Avoids Partial<T> spread which is unsafe under exactOptionalPropertyTypes.
 */
function applyUpdate(
  existing: AgentActionRecord,
  status?: AgentActionStatus,
  humanConfirmed?: boolean,
  completedAt?: string,
  errorMessage?: string,
): AgentActionRecord {
  const next: AgentActionRecord = {
    actionId: existing.actionId,
    contractId: existing.contractId,
    intent: existing.intent,
    safetyLevel: existing.safetyLevel,
    requiresConfirmation: existing.requiresConfirmation,
    humanConfirmed: humanConfirmed ?? existing.humanConfirmed,
    status: status ?? existing.status,
    initiatedAt: existing.initiatedAt,
  };
  const resolvedCompleted = completedAt ?? existing.completedAt;
  if (resolvedCompleted !== undefined) {
    next.completedAt = resolvedCompleted;
  }
  const resolvedError = errorMessage ?? existing.errorMessage;
  if (resolvedError !== undefined) {
    next.errorMessage = resolvedError;
  }
  return next;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Tracks agent-initiated actions with a full lifecycle from initiation to terminal state.
 * Does not require SealProvider. Can be used anywhere in the component tree.
 *
 * @returns UseAgentActionReturn — the action list, mutation functions, and derived state.
 * @example
 * const { initiateAction, confirmAction, completeAction, isActionInProgress } = useAgentAction();
 *
 * // Agent clicks a button
 * const actionId = initiateAction(contract);
 *
 * // Human confirms
 * confirmAction(actionId);
 *
 * // Action completes
 * completeAction(actionId);
 */
export function useAgentAction(): UseAgentActionReturn {
  const [actions, setActions] = useState<AgentActionRecord[]>([]);
  const counterRef = useRef(0);

  const updateById = useCallback(
    (
      actionId: string,
      status?: AgentActionStatus,
      humanConfirmed?: boolean,
      completedAt?: string,
      errorMessage?: string,
    ): void => {
      setActions((prev) =>
        prev.map((a) =>
          a.actionId === actionId
            ? applyUpdate(a, status, humanConfirmed, completedAt, errorMessage)
            : a,
        ),
      );
    },
    [],
  );

  const initiateAction = useCallback(
    (contract: Readonly<ComponentContract>): string => {
      counterRef.current += 1;
      const actionId = `agent-action-${counterRef.current}-${Date.now()}`;
      const record: AgentActionRecord = {
        actionId,
        contractId: contract.id,
        intent: contract.intent,
        safetyLevel: contract.safetyLevel,
        requiresConfirmation: contract.requiresConfirmation,
        humanConfirmed: false,
        status: "pending",
        initiatedAt: new Date().toISOString(),
      };
      setActions((prev) => [record, ...prev]);
      return actionId;
    },
    [],
  );

  const confirmAction = useCallback(
    (actionId: string): void => {
      updateById(actionId, "confirmed", true);
    },
    [updateById],
  );

  const completeAction = useCallback(
    (actionId: string): void => {
      updateById(actionId, "completed", undefined, new Date().toISOString());
    },
    [updateById],
  );

  const failAction = useCallback(
    (actionId: string, errorMessage: string): void => {
      updateById(
        actionId,
        "failed",
        undefined,
        new Date().toISOString(),
        errorMessage,
      );
    },
    [updateById],
  );

  const cancelAction = useCallback(
    (actionId: string): void => {
      updateById(actionId, "cancelled", undefined, new Date().toISOString());
    },
    [updateById],
  );

  const clearActions = useCallback((): void => {
    setActions([]);
  }, []);

  const currentAction: Readonly<AgentActionRecord> | null =
    actions[0] ?? null;

  const isActionInProgress = actions.some(
    (a) => a.status === "pending" || a.status === "confirmed",
  );

  return {
    actions,
    currentAction,
    initiateAction,
    confirmAction,
    completeAction,
    failAction,
    cancelAction,
    clearActions,
    isActionInProgress,
  };
}
