/**
 * Manifest-specific types for VhyxSeal.
 *
 * Defines the full manifest structure, agent policy, rate limits, and the
 * configuration input for manifest generation.
 */

import type { Capability } from "../schema/capability.js";
import type { ComponentContract } from "../schema/contract.js";
import type { Relationship } from "../schema/relationships.js";

// ---------------------------------------------------------------------------
// Agent policy and rate limits
// ---------------------------------------------------------------------------

/** Per-agent action and manifest request rate limits. */
export interface RateLimits {
  actionsPerMinute: number;
  actionsPerHour: number;
  manifestRequestsPerMinute: number;
  perAgentSession: boolean;
}

/**
 * Access policy controlling which agents may act on a site and what they may do.
 *
 * Site owners set this. Default policy allows all agents with reasonable rate limits.
 * `manifestAuth` is only meaningful when `manifestAccess` is `"private"`.
 */
export interface AgentPolicy {
  /** Agent identifiers allowed. Use `["*"]` for all agents. */
  allowedAgents: readonly string[];
  /** Agent identifier patterns to block. */
  blockedAgents: readonly string[];
  /** Whether agents must identify themselves before acting. */
  requireAgentIdentification: boolean;
  rateLimits: RateLimits;
  /** Intent ids the agent is allowed to execute. Use `["*"]` for all. */
  allowedActions: readonly string[];
  /** Intent ids the agent is explicitly blocked from executing. */
  blockedActions: readonly string[];
  /** Intent ids that always require human confirmation regardless of contract settings. */
  requiresConfirmation: readonly string[];
  /** Intent ids that require a verified human to be present in the loop. */
  requiresHumanPresent: readonly string[];
  manifestAccess: "public" | "private";
  /** Authentication scheme required when `manifestAccess` is `"private"`. */
  manifestAuth?: "bearer-token";
}

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

/**
 * The complete VhyxSeal manifest for a page or site.
 *
 * Auto-generated — never hand-written. Served at `/__agent__/manifest.json`.
 * Contains all component contracts, relationships, capabilities, and the
 * site's agent access policy.
 */
export interface VhyxSealManifest {
  // Schema identification
  /** VhyxSeal schema version this manifest conforms to e.g. "1.0.0". */
  vhyxseal: string;
  /** Permanent URL to the schema definition for this version. */
  schemaUrl: string;

  // Site identification
  /** Verified domain this manifest belongs to e.g. "example.com". */
  domain: string;
  domainVerified: boolean;
  /** Verification token issued by the VhyxSeal registry after domain ownership confirmation. */
  verificationToken: string;

  // Integrity
  /**
   * Cryptographic signature of the manifest content.
   * Set to `"unsigned"` until signing is performed by the versioning module.
   */
  signature: string;
  /** ISO datetime when the manifest was signed. Matches `generatedAt` until actual signing. */
  signedAt: string;
  /** Deterministic content fingerprint for drift detection. NOT a cryptographic signature. */
  fingerprint: string;

  // Content
  capabilities: readonly Capability[];
  components: readonly ComponentContract[];
  relationships: readonly Relationship[];

  // Policy
  agentPolicy: AgentPolicy;

  // Cache and freshness
  /** ISO datetime when this manifest was generated. */
  generatedAt: string;
  /** ISO datetime after which agents should re-fetch the manifest. */
  expiresAt: string;
}

// ---------------------------------------------------------------------------
// Generation config
// ---------------------------------------------------------------------------

/**
 * Configuration input for manifest generation.
 *
 * Domain is the only required field. All other fields have sensible defaults
 * appropriate for development and testing.
 */
export interface ManifestConfig {
  /** The domain this manifest is for e.g. "example.com". Must be non-empty. */
  domain: string;
  /** Whether domain ownership has been verified with the VhyxSeal registry. */
  domainVerified: boolean;
  /** Verification token from the VhyxSeal registry — empty string if not yet verified. */
  verificationToken: string;
  /** Agent access policy — defaults applied for any fields not provided. */
  agentPolicy?: Partial<AgentPolicy>;
  /** How long in seconds the manifest should be considered fresh. Default 3600 (1 hour). */
  cacheDurationSeconds?: number;
  /** VhyxSeal schema version this manifest targets. Default "1.0.0". */
  schemaVersion?: string;
}
