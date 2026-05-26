import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { print, printError } from "../utils/output.js";

/**
 * Options for the audit command.
 */
export interface AuditOptions {
  /** Path to the project root. Defaults to process.cwd(). */
  projectPath?: string;
  /** Output raw JSON instead of human-readable output. */
  json?: boolean;
}

/**
 * Result returned by the audit command.
 */
export interface AuditResult {
  /** Whether a vhyxseal.manifest.json was found. */
  manifestFound: boolean;
  /** Total number of component contracts in the manifest. */
  totalComponents: number;
  /** Components with verifiedBy !== "auto". */
  explicitContracts: number;
  /** Components with verifiedBy === "auto". */
  inferredContracts: number;
  /**
   * Always null — per DECISION-D3, missing contract detection requires
   * DOM observer infrastructure not available at CLI audit time.
   */
  missingContracts: null;
  /**
   * Always null — cannot calculate coverage without missing contract count.
   * Per DECISION-D3.
   */
  coveragePercent: null;
}

interface ManifestComponent {
  verifiedBy?: string;
  [key: string]: unknown;
}

interface RawManifest {
  components?: ManifestComponent[];
  [key: string]: unknown;
}

/**
 * Runs a security audit on the VhyxSeal manifest file.
 * Reads vhyxseal.manifest.json from the project path and analyses
 * contract coverage across all registered components.
 *
 * @param options - Audit options including project path and output format
 * @returns AuditResult with coverage statistics
 * @example
 * const result = await audit({ projectPath: '/my/project' });
 * console.log(result.totalComponents);
 */
export async function audit(options: AuditOptions = {}): Promise<AuditResult> {
  const projectPath = options.projectPath ?? process.cwd();
  const json = options.json ?? false;
  const manifestPath = join(projectPath, "vhyxseal.manifest.json");

  if (!existsSync(manifestPath)) {
    const result: AuditResult = {
      manifestFound: false,
      totalComponents: 0,
      explicitContracts: 0,
      inferredContracts: 0,
      missingContracts: null,
      coveragePercent: null,
    };

    if (json) {
      print(JSON.stringify(result, null, 2));
    } else {
      printError(`No vhyxseal.manifest.json found. Expected at: ${manifestPath}`);
    }

    return result;
  }

  let manifest: RawManifest;
  try {
    const raw = readFileSync(manifestPath, "utf-8");
    manifest = JSON.parse(raw) as RawManifest;
  } catch {
    const result: AuditResult = {
      manifestFound: false,
      totalComponents: 0,
      explicitContracts: 0,
      inferredContracts: 0,
      missingContracts: null,
      coveragePercent: null,
    };
    printError(`Failed to parse vhyxseal.manifest.json: ${manifestPath}`);
    return result;
  }

  const components: ManifestComponent[] = Array.isArray(manifest.components)
    ? manifest.components
    : [];

  const totalComponents = components.length;
  const explicitContracts = components.filter(
    (c) => c.verifiedBy !== "auto",
  ).length;
  const inferredContracts = components.filter(
    (c) => c.verifiedBy === "auto",
  ).length;

  const result: AuditResult = {
    manifestFound: true,
    totalComponents,
    explicitContracts,
    inferredContracts,
    missingContracts: null,
    coveragePercent: null,
  };

  if (json) {
    print(JSON.stringify(result, null, 2));
  } else {
    print(`\n🔒 VhyxSeal Audit`);
    print(`   Manifest: ${manifestPath}`);
    print(`   Total components:    ${totalComponents}`);
    print(`   Explicit contracts:  ${explicitContracts}`);
    print(`   Inferred contracts:  ${inferredContracts}`);
    print(`   Missing contracts:   unknown (requires DOM observer)`);
    print(`   Coverage:            unknown`);
  }

  return result;
}
