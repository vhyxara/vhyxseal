import type { ComponentContract, VhyxSealManifest } from "@vhyxseal/core";

export interface MockAgentAction {
  type: "navigate" | "act" | "read";
  target: string;
  timestamp: string;
  result: unknown;
}

export interface MockAgentSession {
  /** Simulates agent navigating to a component by id */
  navigate: (componentId: string) => MockAgentSession;
  /** Simulates agent acting on a component — checks safety constraints */
  act: (componentId: string, payload?: unknown) => MockAgentSession;
  /** Simulates agent reading a display component */
  read: (componentId: string) => unknown;
  /** Returns all actions taken in this session */
  getActions: () => ReadonlyArray<MockAgentAction>;
  /** Returns whether the session attempted any unsafe actions */
  hadUnsafeActions: () => boolean;
  /** Resets the session action history */
  reset: () => MockAgentSession;
}

/**
 * Creates a mock agent session for testing contract behavior.
 * Simulates how an AI agent would interact with your components.
 *
 * The mock agent respects safetyLevel and requiresConfirmation constraints —
 * acting on a "critical" contract without confirmation is flagged as unsafe.
 *
 * @param manifest - Optional manifest to validate actions against
 * @returns MockAgentSession with navigate, act, read, and inspection methods
 * @example
 * const agent = mockAgentSession(manifest);
 * agent.navigate('checkout-form').act('checkout-submit-btn');
 * expect(agent.hadUnsafeActions()).toBe(false);
 */
export function mockAgentSession(
  manifest?: Readonly<VhyxSealManifest>
): MockAgentSession {
  const actions: MockAgentAction[] = [];
  let unsafeActionsDetected = false;

  const contractMap = new Map<string, Readonly<ComponentContract>>();
  if (manifest) {
    for (const contract of manifest.components) {
      contractMap.set(contract.id, contract);
    }
  }

  const session: MockAgentSession = {
    navigate(componentId) {
      actions.push({
        type: "navigate",
        target: componentId,
        timestamp: new Date().toISOString(),
        result: { navigated: true },
      });
      return session;
    },

    act(componentId, payload) {
      const contract = contractMap.get(componentId);

      if (contract) {
        const highRisk = new Set(["critical", "sensitive"]);
        if (highRisk.has(contract.safetyLevel) && !contract.requiresConfirmation) {
          unsafeActionsDetected = true;
        }
        if (contract.requiresConfirmation) {
          actions.push({
            type: "act",
            target: componentId,
            timestamp: new Date().toISOString(),
            result: { acted: true, payload, requiresConfirmation: true },
          });
          return session;
        }
      }

      actions.push({
        type: "act",
        target: componentId,
        timestamp: new Date().toISOString(),
        result: { acted: true, payload },
      });
      return session;
    },

    read(componentId) {
      actions.push({
        type: "read",
        target: componentId,
        timestamp: new Date().toISOString(),
        result: { read: true },
      });
      return contractMap.get(componentId) ?? null;
    },

    getActions() {
      return [...actions];
    },

    hadUnsafeActions() {
      return unsafeActionsDetected;
    },

    reset() {
      actions.length = 0;
      unsafeActionsDetected = false;
      return session;
    },
  };

  return session;
}
