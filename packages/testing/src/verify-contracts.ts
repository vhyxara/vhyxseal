import type { ComponentContract } from "@vhyxseal/core";
import { validateContract } from "@vhyxseal/core";

export interface ContractHealthReport {
  contractId: string;
  status: "healthy" | "stale" | "broken";
  issues: string[];
}

export interface VerifyContractsResult {
  healthy: readonly ContractHealthReport[];
  stale: readonly ContractHealthReport[];
  broken: readonly ContractHealthReport[];
  missing: readonly string[];
  totalChecked: number;
}

/**
 * Verifies the health of an array of component contracts.
 * Checks for: missing required fields, stale lastVerified dates,
 * missing fingerprints, and inferred-only contracts.
 *
 * @param contracts - Array of contracts to verify
 * @param options - Verification options
 * @returns VerifyContractsResult with contracts grouped by health status
 * @example
 * const result = verifyContracts([myContract]);
 * expect(result.broken).toHaveLength(0);
 */
export function verifyContracts(
  contracts: ReadonlyArray<Readonly<Partial<ComponentContract>>>,
  options: { stalenessThresholdDays?: number } = {}
): VerifyContractsResult {
  const thresholdDays = options.stalenessThresholdDays ?? 30;
  const healthy: ContractHealthReport[] = [];
  const stale: ContractHealthReport[] = [];
  const broken: ContractHealthReport[] = [];

  for (const contract of contracts) {
    const id = contract.id ?? "(unknown)";
    const issues: string[] = [];

    if (!validateContract(contract)) {
      issues.push("Contract is incomplete — missing required fields");
    }

    if (!contract.fingerprint) {
      issues.push("Contract has no fingerprint — run defineContract() to generate one");
    }

    if (!contract.contractVersion) {
      issues.push("contractVersion is missing");
    }

    const validSafetyLevels = new Set(["low", "medium", "high", "critical", "sensitive"]);
    if (contract.safetyLevel && !validSafetyLevels.has(contract.safetyLevel)) {
      issues.push(`safetyLevel "${contract.safetyLevel}" is not a valid SafetyLevel`);
    }

    let isStale = false;
    if (contract.lastVerified) {
      const lastVerifiedDate = new Date(contract.lastVerified);
      const daysSince = (Date.now() - lastVerifiedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > thresholdDays) {
        isStale = true;
        issues.push(
          `Contract last verified ${Math.floor(daysSince)} days ago — review recommended`
        );
      }
    }

    if (contract.verifiedBy === "auto") {
      issues.push("Contract is inferred — consider specifying it explicitly with defineContract()");
    }

    const report: ContractHealthReport = { contractId: id, status: "healthy", issues };

    if (issues.some(i => i.includes("incomplete") || i.includes("missing") || i.includes("not a valid") || i.includes("fingerprint"))) {
      report.status = "broken";
      broken.push(report);
    } else if (isStale || contract.verifiedBy === "auto") {
      report.status = "stale";
      stale.push(report);
    } else {
      healthy.push(report);
    }
  }

  return {
    healthy,
    stale,
    broken,
    missing: [],
    totalChecked: contracts.length,
  };
}
