/**
 * VhyxSeal versioning module — public exports.
 *
 * Exposes version negotiation utilities and the manifest signing interface.
 */

export {
  parseVersion,
  isCompatible,
  negotiateVersion,
  getVersionStage,
  isStableOrBetter,
} from "./version-negotiation.js";

export type {
  ParsedVersion,
  NegotiationResult,
  VersionStage,
} from "./version-negotiation.js";

export { signManifest, verifyManifest } from "./signing.js";

export type {
  SigningKey,
  SigningResult,
  VerificationResult,
} from "./signing.js";
