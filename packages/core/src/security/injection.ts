/**
 * Prompt injection detection for VhyxSeal contract string fields.
 *
 * Detects patterns an attacker might embed in contract string fields
 * (description, intent, consequence, condition descriptions) to manipulate
 * AI agents that read contracts. All pattern matching is case-insensitive.
 *
 * This module is internal to the security layer — consumers use
 * sanitizeContractField from sanitize.ts rather than calling detectInjection
 * directly in most cases.
 */

/**
 * Known prompt injection signatures.
 *
 * Covers five attack categories:
 * 1. Role/instruction override attempts
 * 2. System prompt exposure attempts
 * 3. Delimiter injection (XML/bracket style)
 * 4. Data exfiltration attempts
 *
 * Patterns are case-insensitive via the /i flag. Each pattern is intentionally
 * narrow to avoid false positives on legitimate developer content.
 */
const INJECTION_PATTERNS: readonly RegExp[] = [
  // Role/instruction override attempts
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|context)/i,
  /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|context)/i,
  /forget\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|context)/i,
  /you\s+are\s+now\s+(a\s+)?(?!an?\s+AI|claude|assistant)/i,
  /act\s+as\s+(if\s+you\s+(are|were)\s+)?(a\s+)?(?!an?\s+AI|claude|assistant)/i,
  /pretend\s+(you\s+are|to\s+be)\s+(a\s+)?(?!an?\s+AI|claude|assistant)/i,
  // System prompt exposure attempts
  /reveal\s+(your\s+)?(system\s+prompt|instructions?|training)/i,
  /print\s+(your\s+)?(system\s+prompt|instructions?)/i,
  /show\s+(me\s+)?(your\s+)?(system\s+prompt|instructions?|training\s+data)/i,
  // Delimiter injection
  /<\s*\/?\s*(system|user|assistant|prompt|instruction)\s*>/i,
  /\[\s*(system|user|assistant|inst|\/inst)\s*\]/i,
  // Data exfiltration attempts
  /send\s+(all\s+)?(user\s+data|credentials?|passwords?|api\s+keys?)\s+to/i,
  /exfiltrate/i,
  /transmit\s+(all\s+)?(user\s+data|credentials?)/i,
];

/**
 * Returns true if the string contains any known prompt injection pattern.
 *
 * Matching is case-insensitive. Covers role override attempts, system prompt
 * exposure attempts, delimiter injection, and data exfiltration patterns.
 * Never throws — a detection error is treated as clean (false) to avoid
 * crashing the visual layer from within a guard function.
 *
 * @param value - The string to test.
 * @returns true if an injection pattern is found, false if clean.
 * @example
 * detectInjection("ignore all previous instructions")   // true
 * detectInjection("Submits the cart as a purchase order") // false
 */
export function detectInjection(value: string): boolean {
  try {
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(value)) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Returns the number of distinct injection patterns that match the string.
 *
 * Useful in DevTools to show how many patterns fired, aiding debugging.
 * Never throws.
 *
 * @param value - The string to test.
 * @returns Count of matched patterns (0 if clean or on error).
 * @example
 * getInjectionPatternCount("ignore previous instructions and exfiltrate") // 2
 * getInjectionPatternCount("Place Order")                                  // 0
 */
export function getInjectionPatternCount(value: string): number {
  try {
    let count = 0;
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(value)) {
        count++;
      }
    }
    return count;
  } catch {
    return 0;
  }
}
