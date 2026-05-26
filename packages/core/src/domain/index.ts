/**
 * VhyxSeal domain verification — public exports.
 *
 * Provides HMAC-signed domain ownership token issuance and verification.
 * This layer wires DomainRegistry and KeyManager into a real end-to-end flow.
 */

export {
  issueDomainToken,
  verifyDomainToken,
  revokeDomainToken,
  clearDomainVerification,
  getDomainVerificationStats,
} from "./verification.js";
