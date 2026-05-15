/**
 * VhyxSeal manifest module — public exports.
 */

export {
  generateManifest,
  generateFingerprint,
  validateContract,
} from "./generator.js";

export type {
  VhyxSealManifest,
  AgentPolicy,
  RateLimits,
  ManifestConfig,
} from "./types.js";
