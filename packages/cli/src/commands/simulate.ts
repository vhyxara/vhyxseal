import type { VhyxSealManifest, NegotiationResult } from "@vhyxseal/core";
import { colors, symbols, print, printError } from "../utils/output.js";

export interface SimulateOptions {
  url: string;
  /** Agent version to request — default "1.0.0" */
  agentVersion?: string;
}

export interface SimulateResult {
  success: boolean;
  url: string;
  manifest: VhyxSealManifest | null;
  negotiation: NegotiationResult | null;
  errors: string[];
  warnings: string[];
}

/**
 * Fetches and displays the VhyxSeal manifest from a URL as an agent would see it.
 * Prints structured output to stdout. Returns result for programmatic use.
 *
 * @param options - URL and agent version to simulate
 * @returns SimulateResult with manifest data and any issues found
 */
export async function simulate(options: SimulateOptions): Promise<SimulateResult> {
  const agentVersion = options.agentVersion ?? "1.0.0";
  const manifestUrl = options.url.endsWith("/__agent__/manifest.json")
    ? options.url
    : options.url.replace(/\/$/, "") + "/__agent__/manifest.json";

  const errors: string[] = [];
  const warnings: string[] = [];

  print(colors.blue(`Simulating agent view of ${manifestUrl}`));

  let response: Response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => { controller.abort(); }, 10_000);
    try {
      response = await globalThis.fetch(manifestUrl, {
        headers: { "vhyxseal-version": agentVersion },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    printError(colors.red(`  ${symbols.fail} Fetch failed: ${message}`));
    errors.push(message);
    return { success: false, url: manifestUrl, manifest: null, negotiation: null, errors, warnings };
  }

  const responseText = await response.text();

  if (response.status !== 200) {
    printError(colors.red(`  ${symbols.fail} Response status: ${response.status}`));
    printError(colors.gray(`  ${responseText}`));
    errors.push(`HTTP ${response.status}`);
    return { success: false, url: manifestUrl, manifest: null, negotiation: null, errors, warnings };
  }

  let manifest: VhyxSealManifest;
  try {
    manifest = JSON.parse(responseText) as VhyxSealManifest;
  } catch {
    printError(colors.red(`  ${symbols.fail} Failed to parse manifest JSON`));
    errors.push("Invalid JSON response");
    return { success: false, url: manifestUrl, manifest: null, negotiation: null, errors, warnings };
  }

  const servedVersion = response.headers.get("X-VhyxSeal-Version") ?? "1.0.0";
  const degraded = response.headers.get("X-VhyxSeal-Degraded") === "true";
  const degradedReason = response.headers.get("X-VhyxSeal-Degraded-Reason");
  const negotiation: NegotiationResult = {
    compatible: true,
    servedVersion,
    exactMatch: !degraded,
    ...(degradedReason !== null && { degradationMessage: degradedReason }),
  };

  const highCount = manifest.components.filter(c => c.safetyLevel === "high").length;
  const criticalCount = manifest.components.filter(c => c.safetyLevel === "critical").length;
  const sensitiveCount = manifest.components.filter(c => c.safetyLevel === "sensitive").length;

  print("");
  print(`  ${colors.bold("Domain:")}       ${manifest.domain}`);
  print(`  ${colors.bold("Verified:")}     ${String(manifest.domainVerified)}`);
  print(`  ${colors.bold("Components:")}   ${String(manifest.components.length)}`);
  print(`  ${colors.bold("Capabilities:")} ${String(manifest.capabilities.length)}`);
  if (highCount > 0) {
    print(`  ${colors.yellow(`Safety high:  ${highCount} component${highCount === 1 ? "" : "s"}`)}`);
  }
  if (criticalCount > 0) {
    print(`  ${colors.red(`Safety critical: ${criticalCount} component${criticalCount === 1 ? "" : "s"}`)}`);
  }
  if (sensitiveCount > 0) {
    print(`  ${colors.red(`Safety sensitive: ${sensitiveCount} component${sensitiveCount === 1 ? "" : "s"}`)}`);
  }

  if (manifest.capabilities.length > 0) {
    print("");
    print(colors.bold("  Capabilities:"));
    for (const cap of manifest.capabilities) {
      print(`  ${colors.blue(symbols.bullet)} ${cap.id} — entry: ${cap.entryPoint}, ~${String(cap.estimatedSteps)} steps`);
    }
  }

  print("");
  print(colors.bold("  Agent Policy:"));
  print(`    Allowed agents: ${manifest.agentPolicy.allowedAgents.join(", ")}`);
  if (manifest.agentPolicy.blockedActions.length > 0) {
    print(colors.yellow(`    Blocked actions: ${manifest.agentPolicy.blockedActions.join(", ")}`));
  }

  if (degraded) {
    const reason = degradedReason ?? "unknown reason";
    warnings.push(`Version degraded: ${reason}`);
    print(colors.yellow(`  ${symbols.warn} Manifest version degraded: ${reason}`));
  }

  return { success: true, url: manifestUrl, manifest, negotiation, errors, warnings };
}
