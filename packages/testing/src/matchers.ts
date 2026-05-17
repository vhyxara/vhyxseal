import type { ComponentContract } from "@vhyxseal/core";
import { validateContract } from "@vhyxseal/core";

export interface MatcherResult {
  pass: boolean;
  message: () => string;
}

/**
 * Checks that a contract is complete and valid per validateContract().
 *
 * @param received - The contract to check
 * @returns MatcherResult — use with expect.extend(vhyxSealMatchers)
 * @example — vitest/jest
 * expect(myContract).toHaveValidContract();
 */
export function toHaveValidContract(
  received: Readonly<Partial<ComponentContract>>
): MatcherResult {
  const pass = validateContract(received);
  return {
    pass,
    message: () =>
      pass
        ? `Expected contract "${received.id}" NOT to be valid, but it is`
        : `Expected contract "${received.id}" to be valid, but it is missing required fields`,
  };
}

/**
 * Checks that a contract has the specified intent.
 *
 * @param received - The contract to check
 * @param expected - The expected intent string
 * @returns MatcherResult — use with expect.extend(vhyxSealMatchers)
 * @example — vitest/jest
 * expect(myContract).toHaveIntent('place-order');
 */
export function toHaveIntent(
  received: Readonly<Partial<ComponentContract>>,
  expected: string
): MatcherResult {
  const pass = received.intent === expected;
  return {
    pass,
    message: () =>
      pass
        ? `Expected contract NOT to have intent "${expected}", but it does`
        : `Expected contract to have intent "${expected}", but got "${received.intent ?? "undefined"}"`,
  };
}

/**
 * Checks that a contract is agent-safe: safetyLevel is set, and if
 * safetyLevel is "high", "critical", or "sensitive", requiresConfirmation is true.
 *
 * @param received - The contract to check
 * @returns MatcherResult — use with expect.extend(vhyxSealMatchers)
 * @example — vitest/jest
 * expect(myContract).toBeAgentSafe();
 */
export function toBeAgentSafe(
  received: Readonly<Partial<ComponentContract>>
): MatcherResult {
  const highRisk = new Set(["high", "critical", "sensitive"]);
  const hasSafetyLevel = Boolean(received.safetyLevel);
  const confirmationCorrect =
    !received.safetyLevel ||
    !highRisk.has(received.safetyLevel) ||
    received.requiresConfirmation === true;

  const pass = hasSafetyLevel && confirmationCorrect;

  return {
    pass,
    message: () => {
      if (!hasSafetyLevel) {
        return `Expected contract to be agent-safe, but safetyLevel is not set`;
      }
      return pass
        ? `Expected contract NOT to be agent-safe, but it is`
        : `Expected contract with safetyLevel "${received.safetyLevel}" to have requiresConfirmation: true`;
    },
  };
}

/**
 * All matchers as a plain object for use with expect.extend().
 *
 * @example — vitest
 * import { vhyxSealMatchers } from '@vhyxseal/testing';
 * expect.extend(vhyxSealMatchers);
 *
 * @example — jest
 * import { vhyxSealMatchers } from '@vhyxseal/testing';
 * expect.extend(vhyxSealMatchers);
 */
export const vhyxSealMatchers = {
  toHaveValidContract,
  toHaveIntent,
  toBeAgentSafe,
} as const;

// Type augmentation for vitest.
// These declarations are optional peer augmentations — they add methods to vitest's
// expect() return type. They are ambient and harmless if vitest is not installed.
// @ts-ignore — vitest is an optional peer dependency; module cannot be found during build
// but the declaration is still emitted to .d.ts for consumers who have vitest installed.
declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Type parameter must use `any` default to match vitest's Assertion<T = any> declaration exactly.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> {
    toHaveValidContract(): T;
    toHaveIntent(expected: string): T;
    toBeAgentSafe(): T;
  }
  interface AsymmetricMatchersContaining {
    toHaveValidContract(): void;
    toHaveIntent(expected: string): void;
    toBeAgentSafe(): void;
  }
}

// Type augmentation for jest.
// Ambient global namespace augmentation — harmless if jest is not installed.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toHaveValidContract(): R;
      toHaveIntent(expected: string): R;
      toBeAgentSafe(): R;
    }
  }
}
