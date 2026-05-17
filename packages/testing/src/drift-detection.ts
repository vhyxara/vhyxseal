import type { ComponentContract } from "@vhyxseal/core";
import { generateFingerprint } from "@vhyxseal/core";

/**
 * Detects if a contract has drifted from a previously recorded state.
 * Compares the current contract's fingerprint against a stored baseline.
 *
 * @param contract - Current contract
 * @param baselineFingerprint - Previously recorded fingerprint to compare against
 * @returns true if drift detected (fingerprints differ), false if matching
 * @example
 * const drifted = detectDrift(currentContract, storedFingerprint);
 * if (drifted) { // contract changed — update tests }
 */
export function detectDrift(
  contract: Readonly<Partial<ComponentContract>>,
  baselineFingerprint: string
): boolean {
  const currentFingerprint =
    contract.fingerprint ?? generateFingerprint(JSON.stringify(contract));
  return currentFingerprint !== baselineFingerprint;
}

/**
 * Returns true if the contract's lastVerified date is older than the threshold.
 * Use in CI to flag contracts that need manual review.
 *
 * @param contract - Contract to check
 * @param thresholdDays - Days before a contract is considered stale (default 30)
 * @returns true if the contract is stale or has never been verified
 * @example
 * if (isDriftWarning(contract, 14)) {
 *   console.warn('Contract needs review');
 * }
 */
export function isDriftWarning(
  contract: Readonly<Partial<ComponentContract>>,
  thresholdDays = 30
): boolean {
  if (!contract.lastVerified) return true;
  const daysSince =
    (Date.now() - new Date(contract.lastVerified).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince > thresholdDays;
}
