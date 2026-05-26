import { randomBytes } from "crypto";
import { logAudit } from "../audit/index.js";

interface IssuedToken {
  contractId: string;
  componentId: string;
  intent: string;
  expiresAt: number;
  used: boolean;
}

const issued = new Map<string, IssuedToken>();

let issuedCount = 0;
let usedCount = 0;
let expiredCount = 0;
let replayAttemptCount = 0;

function evictExpired(): void {
  const now = Date.now();
  for (const [id, token] of issued) {
    if (token.expiresAt < now) {
      expiredCount++;
      issued.delete(id);
      logAudit({
        action: "token_expired",
        componentId: token.componentId,
        domain: null,
        result: "failure",
      });
    }
  }
}

/**
 * Issues a single-use action token scoped to a contract, component, and intent.
 * @param contractId - The contract ID the token is issued for
 * @param componentId - The component ID the token is issued for
 * @param intent - The intent the token authorises
 * @param ttlMs - Time-to-live in milliseconds (default: 60000)
 * @returns A 64-character hex token ID
 */
export function issueToken(
  contractId: string,
  componentId: string,
  intent: string,
  ttlMs: number = 60000,
): string {
  evictExpired();
  const tokenId = randomBytes(32).toString("hex");
  issued.set(tokenId, {
    contractId,
    componentId,
    intent,
    expiresAt: Date.now() + ttlMs,
    used: false,
  });
  issuedCount++;
  logAudit({
    action: "token_issued",
    componentId,
    domain: null,
    result: "success",
  });
  return tokenId;
}

/**
 * Verifies a token against the expected contract context.
 * Executes exactly 6 checks in security-locked order (D7).
 * Marks the token as used on success — replay attempts return false.
 * @param tokenId - The token ID returned by issueToken
 * @param expected - The expected contractId, componentId, and intent
 * @returns true if the token is valid and unused; false otherwise
 */
export function verifyToken(
  tokenId: string,
  expected: { contractId: string; componentId: string; intent: string },
): boolean {
  evictExpired();
  const token = issued.get(tokenId);
  if (!token) return false;
  if (Date.now() >= token.expiresAt) return false;
  if (token.contractId !== expected.contractId) return false;
  if (token.componentId !== expected.componentId) return false;
  if (token.intent !== expected.intent) return false;
  if (token.used) { replayAttemptCount++; return false; }
  token.used = true;
  usedCount++;
  logAudit({
    action: "token_verified",
    componentId: token.componentId,
    domain: null,
    result: "success",
  });
  return true;
}

/**
 * Revokes a token immediately, preventing any future verification.
 * No error is thrown if the token does not exist.
 * @param tokenId - The token ID to revoke
 */
export function revokeToken(tokenId: string): void {
  issued.delete(tokenId);
}

/**
 * Clears all issued tokens from the in-memory store.
 * For test use only. Do not call in production.
 */
export function clearTokens(): void {
  issued.clear();
  issuedCount = 0;
  usedCount = 0;
  expiredCount = 0;
  replayAttemptCount = 0;
}

/**
 * Returns a snapshot of action token telemetry counters.
 * Counters are cumulative since module load or last clearTokens() call.
 * @returns Object with issued, used, expired, and replayAttempts counts
 */
export function getTokenStats(): {
  readonly issued: number;
  readonly used: number;
  readonly expired: number;
  readonly replayAttempts: number;
} {
  return {
    issued: issuedCount,
    used: usedCount,
    expired: expiredCount,
    replayAttempts: replayAttemptCount,
  };
}
