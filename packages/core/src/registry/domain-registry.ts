/**
 * Domain verification token store — in-memory implementation.
 *
 * Issues and verifies domain ownership tokens. Persistent storage
 * is a Stage 4B concern.
 */

import { randomBytes } from "crypto";

export interface DomainVerificationToken {
  domain: string;
  token: string;
  issuedAt: string;
  expiresAt: string;
  verified: boolean;
}

export interface DomainRegistry {
  issueToken: (domain: string) => DomainVerificationToken;
  verifyToken: (domain: string, token: string) => boolean;
  getToken: (domain: string) => DomainVerificationToken | undefined;
  revokeToken: (domain: string) => void;
  isVerified: (domain: string) => boolean;
}

const TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Creates an in-memory domain verification registry.
 * Issues and verifies domain ownership tokens.
 *
 * Token format: randomBytes(32).toString('hex') — 64 hex characters.
 * This is consistent with action tokens, key IDs, and Constraint 5
 * (Session 5-001 Item 2 — token format unification).
 * Token expiry: 30 days from issuance
 *
 * This is the in-memory implementation. Persistent storage
 * is a Stage 4B concern.
 *
 * @returns DomainRegistry instance
 */
export function createDomainRegistry(): DomainRegistry {
  const store = new Map<string, DomainVerificationToken>();

  function issueToken(domain: string): DomainVerificationToken {
    const now = new Date();
    const record: DomainVerificationToken = {
      domain,
      token: randomBytes(32).toString("hex"),
      issuedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + TOKEN_EXPIRY_MS).toISOString(),
      verified: false,
    };
    store.set(domain, record);
    return record;
  }

  function verifyToken(domain: string, token: string): boolean {
    const record = store.get(domain);
    if (record === undefined) return false;
    if (record.token !== token) return false;
    if (new Date(record.expiresAt).getTime() < Date.now()) return false;
    record.verified = true;
    return true;
  }

  function getToken(domain: string): DomainVerificationToken | undefined {
    return store.get(domain);
  }

  function revokeToken(domain: string): void {
    store.delete(domain);
  }

  function isVerified(domain: string): boolean {
    const record = store.get(domain);
    if (record === undefined) return false;
    if (!record.verified) return false;
    if (new Date(record.expiresAt).getTime() < Date.now()) return false;
    return true;
  }

  return { issueToken, verifyToken, getToken, revokeToken, isVerified };
}
