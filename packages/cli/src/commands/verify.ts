import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { VhyxSealManifest } from "@vhyxseal/core";
import { colors, symbols, print } from "../utils/output.js";

export interface VerifyOptions {
  /** Path to scan for contract definitions — default process.cwd() */
  projectPath?: string;
  /** Fail on warnings as well as errors — default false */
  strict?: boolean;
}

export interface ContractVerifyResult {
  contractId: string;
  status: "pass" | "warn" | "fail";
  message: string;
}

export interface VerifyResult {
  passed: number;
  warned: number;
  failed: number;
  results: ContractVerifyResult[];
  blockedByCi: boolean;
}

const VALID_SAFETY_LEVELS = new Set<string>([
  "low",
  "medium",
  "high",
  "critical",
  "sensitive",
]);

const STALE_THRESHOLD_DAYS = 30;

/**
 * Verifies contract health in a project. Checks for stale contracts,
 * missing required fields, and drift indicators.
 * Prints structured output per CLAUDE.md Section 14.
 *
 * @param options - Verification options
 * @returns VerifyResult with counts and per-contract results
 */
export async function verify(options: VerifyOptions): Promise<VerifyResult> {
  const projectPath = options.projectPath ?? process.cwd();
  const manifestPath = join(projectPath, "vhyxseal.manifest.json");

  if (!existsSync(manifestPath)) {
    print(colors.blue(`${symbols.info} No manifest file found at ${manifestPath}`));
    print(colors.gray("  To generate one, run: vhyxseal simulate <url>"));
    return { passed: 0, warned: 0, failed: 0, results: [], blockedByCi: false };
  }

  let manifest: VhyxSealManifest;
  try {
    const content = readFileSync(manifestPath, "utf-8");
    manifest = JSON.parse(content) as VhyxSealManifest;
  } catch {
    print(colors.red(`${symbols.fail} Failed to parse ${manifestPath}`));
    return { passed: 0, warned: 0, failed: 1, results: [], blockedByCi: true };
  }

  const results: ContractVerifyResult[] = [];

  for (const contract of manifest.components) {
    let status: "pass" | "warn" | "fail" = "pass";
    let message = "contract verified";

    // fingerprint is optional in the schema — check it exists
    if (!contract.fingerprint) {
      status = "fail";
      message = "fingerprint missing";
    }

    // contractVersion is required but JSON may omit it — falsy check covers both absent and empty
    if (status !== "fail" && !contract.contractVersion) {
      status = "fail";
      message = "contractVersion missing";
    }

    // SafetyLevel is a string union — validate against known values at runtime
    if (status !== "fail" && !VALID_SAFETY_LEVELS.has(contract.safetyLevel)) {
      status = "fail";
      message = "safetyLevel is invalid";
    }

    // lastVerified is optional — only check staleness if present
    if (status !== "fail" && contract.lastVerified !== undefined) {
      const daysSince =
        (Date.now() - new Date(contract.lastVerified).getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysSince > STALE_THRESHOLD_DAYS) {
        status = "warn";
        message = `contract last verified ${Math.floor(daysSince)} days ago — review needed`;
      }
    }

    // Inferred contracts are lower confidence
    if (status === "pass" && contract.verifiedBy === "auto") {
      status = "warn";
      message = "contract is inferred, not manually specified";
    }

    results.push({ contractId: contract.id, status, message });
  }

  // Apply strict mode — warnings become failures
  if (options.strict === true) {
    for (const result of results) {
      if (result.status === "warn") {
        result.status = "fail";
      }
    }
  }

  // Print results
  for (const result of results) {
    if (result.status === "pass") {
      print(`  ${symbols.pass}  ${colors.green(result.contractId)} — ${result.message}`);
    } else if (result.status === "warn") {
      print(`  ${symbols.warn} ${colors.yellow(result.contractId)} — ${result.message}`);
    } else {
      print(`  ${symbols.fail}  ${colors.red(result.contractId)} — ${result.message} — BLOCKS CI`);
    }
  }

  const passed = results.filter(r => r.status === "pass").length;
  const warned = results.filter(r => r.status === "warn").length;
  const failed = results.filter(r => r.status === "fail").length;
  const blockedByCi = failed > 0;

  print("");
  print(
    `  ${colors.green(String(passed))} passed, ` +
    `${colors.yellow(String(warned))} warnings, ` +
    `${colors.red(String(failed))} failed`,
  );
  if (blockedByCi) {
    print(colors.red(`  ${symbols.fail} CI blocked — fix failing contracts before merging`));
  }

  return { passed, warned, failed, results, blockedByCi };
}
