/**
 * Manifest generator for VhyxSeal.
 *
 * Assembles the VhyxSealManifest from registered contracts, relationships,
 * and capabilities. Does NOT perform cryptographic signing — that is the
 * responsibility of the versioning module (Module 8).
 */

import type { ComponentContract, ComponentType, SafetyLevel } from "../schema/contract.js";
import { VhyxSealError, ErrorCode } from "../errors/index.js";
import { getAllRelationships } from "../registry/relationship-registry.js";
import { getAllCapabilities } from "../registry/capability-registry.js";
import type { VhyxSealManifest, AgentPolicy, ManifestConfig } from "./types.js";

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

const DEFAULT_SCHEMA_VERSION = "1.0.0";
const SCHEMA_URL_BASE = "https://vhyxseal.dev/schema/";
const DEFAULT_CACHE_DURATION_SECONDS = 3600;

const DEFAULT_AGENT_POLICY: Readonly<AgentPolicy> = {
  allowedAgents: ["*"],
  blockedAgents: [],
  requireAgentIdentification: false,
  rateLimits: {
    actionsPerMinute: 60,
    actionsPerHour: 500,
    manifestRequestsPerMinute: 10,
    perAgentSession: true,
  },
  allowedActions: ["*"],
  blockedActions: [],
  requiresConfirmation: [],
  requiresHumanPresent: [],
  manifestAccess: "public",
} as const;

const VALID_COMPONENT_TYPES: readonly string[] = [
  "action",
  "input",
  "navigation",
  "display",
  "confirmation",
];

const VALID_SAFETY_LEVELS: readonly string[] = [
  "low",
  "medium",
  "high",
  "critical",
  "sensitive",
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** djb2 non-cryptographic hash algorithm. Returns an unsigned 32-bit integer. */
function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Merges a partial AgentPolicy over the defaults without introducing
 * `undefined` for the optional `manifestAuth` property.
 * `exactOptionalPropertyTypes: true` requires that optional properties are
 * absent rather than explicitly set to undefined.
 */
function mergeAgentPolicy(partial: Partial<AgentPolicy> | undefined): AgentPolicy {
  const p = partial ?? {};
  const base: AgentPolicy = {
    allowedAgents: p.allowedAgents ?? DEFAULT_AGENT_POLICY.allowedAgents,
    blockedAgents: p.blockedAgents ?? DEFAULT_AGENT_POLICY.blockedAgents,
    requireAgentIdentification:
      p.requireAgentIdentification ??
      DEFAULT_AGENT_POLICY.requireAgentIdentification,
    rateLimits: p.rateLimits ?? DEFAULT_AGENT_POLICY.rateLimits,
    allowedActions: p.allowedActions ?? DEFAULT_AGENT_POLICY.allowedActions,
    blockedActions: p.blockedActions ?? DEFAULT_AGENT_POLICY.blockedActions,
    requiresConfirmation:
      p.requiresConfirmation ?? DEFAULT_AGENT_POLICY.requiresConfirmation,
    requiresHumanPresent:
      p.requiresHumanPresent ?? DEFAULT_AGENT_POLICY.requiresHumanPresent,
    manifestAccess: p.manifestAccess ?? DEFAULT_AGENT_POLICY.manifestAccess,
  };
  if (p.manifestAuth !== undefined) {
    base.manifestAuth = p.manifestAuth;
  }
  return base;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates a deterministic content fingerprint for drift detection.
 *
 * Uses the djb2 hash algorithm to produce a stable, non-cryptographic
 * fingerprint from the content string. The output is prefixed with `"vhyxs_"`
 * for easy identification.
 *
 * **This is NOT a cryptographic signature.** It is a content hash used to
 * detect whether a manifest has changed between requests (drift detection).
 * Cryptographic signing of manifests is performed separately by the
 * versioning module.
 *
 * @param content - The string to fingerprint.
 * @returns A fingerprint string of the form `"vhyxs_"` followed by 8 hex characters.
 * @example
 * generateFingerprint("hello") // "vhyxs_00ab1234"
 * generateFingerprint("")      // "vhyxs_00000000"
 */
export function generateFingerprint(content: string): string {
  return "vhyxs_" + djb2(content).toString(16).padStart(8, "0");
}

/**
 * Type predicate — returns true if the partial contract has all required
 * fields for a complete ComponentContract.
 *
 * Checks that every required field is present, of the correct type, and
 * (for strings) non-empty. Never throws — returns false for any invalid input
 * including null, undefined, or non-object values.
 *
 * @param contract - The partial contract to validate.
 * @returns true if contract is a complete ComponentContract, false otherwise.
 * @example
 * if (validateContract(partialContract)) {
 *   // TypeScript now knows partialContract is ComponentContract
 *   console.log(partialContract.id);
 * }
 */
export function validateContract(
  contract: Readonly<Partial<ComponentContract>>,
): contract is ComponentContract {
  if (contract === null || typeof contract !== "object") {
    return false;
  }

  // Required non-empty strings
  const stringFields = [
    "id",
    "intent",
    "description",
    "consequence",
    "contractVersion",
  ] as const;
  for (const field of stringFields) {
    const val = contract[field];
    if (typeof val !== "string" || val.length === 0) {
      return false;
    }
  }

  // type — must be a valid ComponentType
  const typeVal: string | undefined =
    typeof contract.type === "string" ? contract.type : undefined;
  if (typeVal === undefined || !VALID_COMPONENT_TYPES.includes(typeVal)) {
    return false;
  }

  // safetyLevel — must be a valid SafetyLevel
  const safetyVal: string | undefined =
    typeof contract.safetyLevel === "string" ? contract.safetyLevel : undefined;
  if (safetyVal === undefined || !VALID_SAFETY_LEVELS.includes(safetyVal)) {
    return false;
  }

  // Required arrays (can be empty)
  const arrayFields = ["requires", "requiredPermissions", "affects"] as const;
  for (const field of arrayFields) {
    if (!Array.isArray(contract[field])) {
      return false;
    }
  }

  // Required booleans — must be strictly true or false
  const booleanFields = [
    "reversible",
    "requiresConfirmation",
    "destructive",
  ] as const;
  for (const field of booleanFields) {
    if (typeof contract[field] !== "boolean") {
      return false;
    }
  }

  return true;
}

/**
 * Generates a complete VhyxSealManifest from a set of component contracts
 * and a configuration object.
 *
 * Pulls registered relationships and capabilities from their respective
 * registries. Merges any provided `agentPolicy` fields over the defaults —
 * provided fields override defaults, absent fields use defaults.
 *
 * **Signing**: `signature` is set to `"unsigned"` and `signedAt` is set to
 * `generatedAt`. Actual cryptographic signing is performed by the versioning
 * module (Module 8) after manifest generation. This is intentional and correct
 * for this stage.
 *
 * @param components - Component contracts to include in the manifest.
 * @param config - Generation configuration including domain and policy.
 * @returns A complete VhyxSealManifest.
 * @throws {VhyxSealError} VHYX_MANIFEST_GENERATION_FAILED (severity "fatal") when domain is empty.
 * @throws {VhyxSealError} VHYX_DUPLICATE_COMPONENT_ID (severity "error") when two components share an id.
 * @example
 * const manifest = generateManifest(contracts, {
 *   domain: "example.com",
 *   domainVerified: false,
 *   verificationToken: "",
 * });
 */
export function generateManifest(
  components: ReadonlyArray<Readonly<ComponentContract>>,
  config: ManifestConfig,
): VhyxSealManifest {
  // Step 1 — validate config
  if (typeof config.domain !== "string" || config.domain.length === 0) {
    throw new VhyxSealError({
      code: ErrorCode.VHYX_MANIFEST_GENERATION_FAILED,
      message: "Manifest generation failed: domain must be a non-empty string",
      context: { received: config.domain },
      severity: "fatal",
      recoverable: false,
      suggestion: 'Provide a non-empty domain string e.g. "example.com".',
    });
  }

  // Step 2 — validate components for duplicate ids
  const seenIds = new Set<string>();
  for (const component of components) {
    if (seenIds.has(component.id)) {
      throw new VhyxSealError({
        code: ErrorCode.VHYX_DUPLICATE_COMPONENT_ID,
        message: `Manifest generation failed: duplicate component id "${component.id}"`,
        context: { duplicateId: component.id },
        severity: "error",
        recoverable: true,
        suggestion: `Ensure every component has a unique id. "${component.id}" appears more than once.`,
      });
    }
    seenIds.add(component.id);
  }

  // Step 3 — pull relationships from registry
  const relationships = getAllRelationships();

  // Step 4 — pull capabilities from registry
  const capabilities = getAllCapabilities();

  // Step 5 — merge agent policy
  const agentPolicy = mergeAgentPolicy(config.agentPolicy);

  // Step 6 — timestamps
  const now = new Date();
  const generatedAt = now.toISOString();
  const cacheDuration = config.cacheDurationSeconds ?? DEFAULT_CACHE_DURATION_SECONDS;
  const expiresAt = new Date(now.getTime() + cacheDuration * 1000).toISOString();

  // Step 7 — schema version and URL
  const schemaVersion = config.schemaVersion ?? DEFAULT_SCHEMA_VERSION;
  const schemaUrl = SCHEMA_URL_BASE + schemaVersion;

  // Step 8 — fingerprint (content hash, not cryptographic)
  const contentForFingerprint = JSON.stringify({
    domain: config.domain,
    vhyxseal: schemaVersion,
    components,
    relationships,
    capabilities,
    generatedAt,
  });
  const fingerprint = generateFingerprint(contentForFingerprint);

  // Steps 9–12 — assemble manifest
  return {
    vhyxseal: schemaVersion,
    schemaUrl,
    domain: config.domain,
    domainVerified: config.domainVerified,
    verificationToken: config.verificationToken,
    // Signing is performed by the versioning module — placeholder values here
    signature: "unsigned",
    signedAt: generatedAt,
    fingerprint,
    capabilities,
    components,
    relationships,
    agentPolicy,
    generatedAt,
    expiresAt,
  };
}
