/**
 * VhyxSeal security layer — public exports.
 *
 * Exposes sanitization and injection detection utilities.
 * The internal INJECTION_PATTERNS array is intentionally not exported —
 * consumers should use detectInjection() and getInjectionPatternCount().
 */

export {
  sanitizeContractField,
  sanitizeContract,
  FIELD_LENGTH_LIMITS,
} from "./sanitize.js";

export { detectInjection, getInjectionPatternCount } from "./injection.js";
