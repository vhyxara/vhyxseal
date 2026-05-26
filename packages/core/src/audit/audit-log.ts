/**
 * In-memory circular audit log buffer.
 *
 * Records security-relevant actions across VhyxSeal core modules.
 * Maximum 50 entries — oldest entry evicted when limit is reached.
 * Zero runtime dependencies — uses Array.push and Array.shift only.
 *
 * Consumers read the log via getAuditLog().
 * The dashboard route surfaces it at /__agent__/dashboard.json.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The set of actions that can be recorded in the audit log.
 * manifest_generated is reserved for future wiring — not yet emitted.
 */
export type AuditAction =
  | "token_issued"
  | "token_verified"
  | "token_expired"
  | "domain_registered"
  | "domain_verified"
  | "key_rotated"
  | "manifest_generated";

/** A single audit log entry with a server-assigned timestamp. */
export interface AuditLogEntry {
  readonly timestamp: string;     // ISO 8601
  readonly action: AuditAction;
  readonly componentId: string | null;
  readonly domain: string | null;
  readonly result: "success" | "failure";
}

// ---------------------------------------------------------------------------
// Circular buffer
// ---------------------------------------------------------------------------

const MAX_ENTRIES = 50;
const entries: AuditLogEntry[] = [];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Appends an entry to the circular audit log buffer.
 * When the buffer exceeds MAX_ENTRIES (50), the oldest entry is evicted.
 * The timestamp is assigned automatically — callers do not provide it.
 *
 * @param entry - The audit event without a timestamp
 */
export function logAudit(
  entry: Omit<AuditLogEntry, "timestamp">,
): void {
  const full: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    ...entry,
  };
  entries.push(full);
  if (entries.length > MAX_ENTRIES) {
    entries.shift();
  }
}

/**
 * Returns a snapshot of all current audit log entries, oldest first.
 * The returned array is a shallow copy — mutations do not affect the buffer.
 *
 * @returns ReadonlyArray of AuditLogEntry, up to MAX_ENTRIES (50)
 */
export function getAuditLog(): ReadonlyArray<AuditLogEntry> {
  return [...entries];
}

/**
 * Clears all entries from the in-memory audit log buffer.
 * For test isolation only. Do not call in production.
 *
 * @internal
 */
export function clearAuditLog(): void {
  entries.length = 0;
}
