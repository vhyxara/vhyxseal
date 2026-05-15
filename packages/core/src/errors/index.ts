/**
 * VhyxSeal error system.
 *
 * This module IS the error system — it has no errors of its own to throw using
 * VhyxSealError. If something goes wrong constructing a VhyxSealError, native
 * Error behavior surfaces it. This is intentional and documented here.
 */

/**
 * Severity of a VhyxSeal error.
 *
 * Determines how the library and DevTools respond to the error condition.
 * Errors at any severity level never crash the visual layer (DECISION-008).
 */
export type ErrorSeverity =
  | "fatal"   // stops everything — invalid schema, corrupt manifest
  | "error"   // this component broken — contract invalid, field wrong
  | "warning" // degraded experience — contract inferred not specified
  | "info";   // informational — new fields available in newer version

/**
 * All VhyxSeal error codes.
 *
 * SCREAMING_SNAKE_CASE. Every code prefixed with VHYX_.
 * Add codes here when new error conditions are identified.
 * Never remove or rename codes — agents and tooling may depend on them.
 */
export enum ErrorCode {
  // Schema errors
  VHYX_INVALID_SCHEMA_VERSION = "VHYX_INVALID_SCHEMA_VERSION",
  VHYX_CONTRACT_VALIDATION_FAILED = "VHYX_CONTRACT_VALIDATION_FAILED",
  VHYX_UNKNOWN_INTENT = "VHYX_UNKNOWN_INTENT",
  VHYX_INVALID_SAFETY_LEVEL = "VHYX_INVALID_SAFETY_LEVEL",
  VHYX_FIELD_TOO_LONG = "VHYX_FIELD_TOO_LONG",
  VHYX_INJECTION_DETECTED = "VHYX_INJECTION_DETECTED",

  // Manifest errors
  VHYX_MANIFEST_GENERATION_FAILED = "VHYX_MANIFEST_GENERATION_FAILED",
  VHYX_MANIFEST_SIGNING_FAILED = "VHYX_MANIFEST_SIGNING_FAILED",
  VHYX_MANIFEST_VERIFICATION_FAILED = "VHYX_MANIFEST_VERIFICATION_FAILED",
  VHYX_DOMAIN_MISMATCH = "VHYX_DOMAIN_MISMATCH",

  // Contract errors
  VHYX_CONTRACT_DRIFT_DETECTED = "VHYX_CONTRACT_DRIFT_DETECTED",
  VHYX_CONTRACT_STALE = "VHYX_CONTRACT_STALE",
  VHYX_DUPLICATE_COMPONENT_ID = "VHYX_DUPLICATE_COMPONENT_ID",
  VHYX_DUPLICATE_INTENT = "VHYX_DUPLICATE_INTENT",

  // Relationship errors
  VHYX_INVALID_RELATIONSHIP = "VHYX_INVALID_RELATIONSHIP",
  VHYX_CIRCULAR_DEPENDENCY = "VHYX_CIRCULAR_DEPENDENCY",
  VHYX_MISSING_COMPONENT_REF = "VHYX_MISSING_COMPONENT_REF",

  // Security errors
  VHYX_RATE_LIMIT_EXCEEDED = "VHYX_RATE_LIMIT_EXCEEDED",
  VHYX_TOKEN_EXPIRED = "VHYX_TOKEN_EXPIRED",
  VHYX_TOKEN_ALREADY_USED = "VHYX_TOKEN_ALREADY_USED",
  VHYX_AGENT_NOT_ALLOWED = "VHYX_AGENT_NOT_ALLOWED",
}

/**
 * Configuration object passed to the VhyxSealError constructor.
 */
export interface VhyxSealErrorConfig {
  /** Error code from the ErrorCode enum — machine readable identifier. */
  code: ErrorCode;
  /** Human readable description of what went wrong. */
  message: string;
  /** Structured context relevant to this specific error instance. */
  context: Record<string, unknown>;
  /** How severe this error is — determines library and DevTools response. */
  severity: ErrorSeverity;
  /** Whether the caller can recover from this error and continue. */
  recoverable: boolean;
  /** Concrete action the developer should take to fix this error. */
  suggestion: string;
}

/**
 * The base error class for all errors thrown by VhyxSeal.
 *
 * Extends the native Error class so instanceof checks work correctly
 * for both Error and VhyxSealError. All VhyxSeal packages throw this
 * class — never a plain Error.
 *
 * @example
 * throw new VhyxSealError({
 *   code: ErrorCode.VHYX_CONTRACT_VALIDATION_FAILED,
 *   message: "Contract validation failed for component checkout-btn",
 *   context: { componentId: "checkout-btn", field: "safetyLevel" },
 *   severity: "error",
 *   recoverable: true,
 *   suggestion: "safetyLevel must be one of: low | medium | high | critical | sensitive",
 * });
 */
export class VhyxSealError extends Error {
  /** Machine readable error code — use this for programmatic error handling. */
  readonly code: ErrorCode;

  /** Structured context relevant to this specific error instance. */
  readonly context: Record<string, unknown>;

  /** How severe this error is — determines library and DevTools response. */
  readonly severity: ErrorSeverity;

  /** Whether the caller can recover from this error and continue. */
  readonly recoverable: boolean;

  /** Concrete action the developer should take to fix this error. */
  readonly suggestion: string;

  /**
   * Creates a new VhyxSealError.
   *
   * @param config - All fields describing the error condition.
   * @param config.code - ErrorCode enum value — machine readable identifier.
   * @param config.message - Human readable description of what went wrong.
   * @param config.context - Structured context for this error instance.
   * @param config.severity - How severe this error is.
   * @param config.recoverable - Whether the caller can recover and continue.
   * @param config.suggestion - Concrete fix the developer should apply.
   */
  constructor(config: VhyxSealErrorConfig) {
    super(config.message);

    // Restore prototype chain so instanceof VhyxSealError works correctly
    // when TypeScript compiles down to ES5 targets in consuming projects.
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = "VhyxSealError";
    this.code = config.code;
    this.context = config.context;
    this.severity = config.severity;
    this.recoverable = config.recoverable;
    this.suggestion = config.suggestion;

    // Capture stack trace in V8 environments (Node.js, modern browsers).
    if (Error.captureStackTrace !== undefined) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
