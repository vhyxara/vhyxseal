/**
 * Schema version negotiation for VhyxSeal.
 *
 * Handles parsing semver strings, determining compatibility between agent-
 * requested versions and site-served versions, and lifecycle stage tracking.
 * See CLAUDE.md Section 14 for the versioning strategy this implements.
 */

import { VhyxSealError, ErrorCode } from "../errors/index.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The lifecycle stage of a VhyxSeal schema version.
 *
 * Stages progress from draft through alpha, beta, stable, deprecated, to
 * sunset. Agents should only act on stable or deprecated manifests.
 */
export type VersionStage =
  | "draft"
  | "alpha"
  | "beta"
  | "stable"
  | "deprecated"
  | "sunset";

/**
 * A parsed semver string broken into its numeric components.
 *
 * `raw` preserves the original string exactly as provided — useful for
 * round-tripping without reformatting.
 */
export interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  /** The original version string, unchanged. */
  raw: string;
}

/**
 * The result of a version negotiation between an agent and a site.
 *
 * When `compatible` is false the agent received the closest available version
 * but cannot rely on it satisfying its contract expectations.
 */
export interface NegotiationResult {
  /** Whether the requested version can be satisfied. */
  compatible: boolean;
  /** The version that will actually be served. */
  servedVersion: string;
  /** True when the served version exactly matches the requested version. */
  exactMatch: boolean;
  /**
   * Human and machine readable explanation for agents when not an exact match.
   * Absent on exact matches.
   */
  degradationMessage?: string;
}

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

/**
 * Known version lifecycle stages.
 * Versions not listed here default to "draft".
 */
const VERSION_STAGES: Readonly<Record<string, VersionStage>> = {
  "0.1.0": "alpha",
  "0.9.0": "beta",
  "1.0.0": "stable",
} as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parses a semver string into its major, minor, and patch components.
 *
 * Valid format is `\d+.\d+.\d+` — three dot-separated non-negative integers.
 * Pre-release suffixes (e.g. `1.0.0-beta`) are not supported and will throw.
 *
 * @param version - The version string to parse e.g. `"1.2.3"`.
 * @returns A ParsedVersion with numeric components and the original raw string.
 * @throws {VhyxSealError} VHYX_INVALID_SCHEMA_VERSION (severity "error") when
 *   the string does not match the expected semver format.
 * @example
 * parseVersion("1.2.3") // { major: 1, minor: 2, patch: 3, raw: "1.2.3" }
 */
export function parseVersion(version: string): ParsedVersion {
  if (!SEMVER_PATTERN.test(version)) {
    throw new VhyxSealError({
      code: ErrorCode.VHYX_INVALID_SCHEMA_VERSION,
      message: `Invalid schema version "${version}" — expected format is MAJOR.MINOR.PATCH e.g. "1.0.0"`,
      context: { received: version },
      severity: "error",
      recoverable: true,
      suggestion:
        'Provide a valid semver string in the format "MAJOR.MINOR.PATCH" e.g. "1.0.0" or "2.13.7".',
    });
  }

  const parts = version.split(".");
  return {
    major: parseInt(parts[0] ?? "0", 10),
    minor: parseInt(parts[1] ?? "0", 10),
    patch: parseInt(parts[2] ?? "0", 10),
    raw: version,
  };
}

/**
 * Returns true if `servedVersion` satisfies the `requestedVersion`.
 *
 * Compatibility rules from CLAUDE.md Section 14:
 * - Major versions must match exactly.
 * - Within the same major, served minor must be ≥ requested minor.
 * - Patch is always compatible within the same major.minor.
 *
 * Returns false (never throws) when either string is invalid semver.
 *
 * @param requestedVersion - The version an agent is asking for.
 * @param servedVersion - The version the site can offer.
 * @returns true if the served version satisfies the request.
 * @example
 * isCompatible("1.2.0", "1.3.0") // true  — higher minor satisfies
 * isCompatible("1.2.0", "1.1.0") // false — lower minor cannot satisfy
 * isCompatible("1.0.0", "2.0.0") // false — major mismatch
 */
export function isCompatible(
  requestedVersion: string,
  servedVersion: string,
): boolean {
  try {
    const requested = parseVersion(requestedVersion);
    const served = parseVersion(servedVersion);

    if (served.major !== requested.major) {
      return false;
    }
    return served.minor >= requested.minor;
  } catch {
    return false;
  }
}

/**
 * Selects the best version to serve given an agent request and available versions.
 *
 * Four-step fallback logic:
 * 1. Exact match for `requestedVersion` → serve it, `exactMatch: true`.
 * 2. Highest compatible version for `requestedVersion` → serve it with degradation message.
 * 3. If `fallbackVersion` provided, highest compatible version for it → serve with fallback message.
 * 4. Nothing compatible → return `compatible: false` with the first available version.
 *
 * "Highest compatible" means the compatible version with the greatest minor,
 * then greatest patch within that minor.
 *
 * @param requestedVersion - The agent's preferred version.
 * @param fallbackVersion - An older version the agent will also accept. May be undefined.
 * @param availableVersions - All versions the site can serve.
 * @returns A NegotiationResult describing the outcome.
 * @example
 * negotiateVersion("1.2.0", "1.0.0", ["1.0.0", "1.3.0"])
 * // { compatible: true, servedVersion: "1.3.0", exactMatch: false, degradationMessage: "..." }
 */
export function negotiateVersion(
  requestedVersion: string,
  fallbackVersion: string | undefined,
  availableVersions: ReadonlyArray<string>,
): NegotiationResult {
  // Step 1 — exact match
  if (availableVersions.includes(requestedVersion)) {
    return {
      compatible: true,
      servedVersion: requestedVersion,
      exactMatch: true,
    };
  }

  // Step 2 — highest compatible for requested
  const bestForRequested = findHighestCompatible(
    requestedVersion,
    availableVersions,
  );
  if (bestForRequested !== undefined) {
    return {
      compatible: true,
      servedVersion: bestForRequested,
      exactMatch: false,
      degradationMessage: `Serving ${bestForRequested} — exact version ${requestedVersion} not available`,
    };
  }

  // Step 3 — highest compatible for fallback
  if (fallbackVersion !== undefined) {
    const bestForFallback = findHighestCompatible(
      fallbackVersion,
      availableVersions,
    );
    if (bestForFallback !== undefined) {
      return {
        compatible: true,
        servedVersion: bestForFallback,
        exactMatch: false,
        degradationMessage: `Serving fallback version ${bestForFallback}`,
      };
    }
  }

  // Step 4 — nothing compatible
  const fallbackServed = availableVersions[0] ?? "1.0.0";
  return {
    compatible: false,
    servedVersion: fallbackServed,
    exactMatch: false,
    degradationMessage:
      "No compatible version available. Agent should update to support served version.",
  };
}

/**
 * Returns the lifecycle stage for the given schema version string.
 *
 * Unknown versions return `"draft"`. Never throws.
 *
 * @param version - The version string to look up e.g. `"1.0.0"`.
 * @returns The lifecycle stage of the version.
 * @example
 * getVersionStage("1.0.0") // "stable"
 * getVersionStage("0.9.0") // "beta"
 * getVersionStage("9.9.9") // "draft"
 */
export function getVersionStage(version: string): VersionStage {
  return VERSION_STAGES[version] ?? "draft";
}

/**
 * Returns true if the version is at a stage where agents can safely rely on it.
 *
 * `"stable"` and `"deprecated"` are both trustworthy — deprecated was once
 * stable and is still supported within its migration window.
 * `"draft"`, `"alpha"`, `"beta"`, and `"sunset"` all return false.
 *
 * Never throws.
 *
 * @param version - The version string to evaluate.
 * @returns true for stable and deprecated versions, false otherwise.
 * @example
 * isStableOrBetter("1.0.0") // true
 * isStableOrBetter("0.9.0") // false — beta
 */
export function isStableOrBetter(version: string): boolean {
  const stage = getVersionStage(version);
  return stage === "stable" || stage === "deprecated";
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Among all versions in `available` that are compatible with `requestedVersion`,
 * returns the one with the highest minor version, then highest patch.
 * Returns undefined when no compatible version exists.
 */
function findHighestCompatible(
  requestedVersion: string,
  available: ReadonlyArray<string>,
): string | undefined {
  let best: ParsedVersion | undefined;

  for (const candidate of available) {
    if (!isCompatible(requestedVersion, candidate)) {
      continue;
    }
    try {
      const parsed = parseVersion(candidate);
      if (
        best === undefined ||
        parsed.minor > best.minor ||
        (parsed.minor === best.minor && parsed.patch > best.patch)
      ) {
        best = parsed;
      }
    } catch {
      // skip invalid candidates
    }
  }

  return best?.raw;
}
