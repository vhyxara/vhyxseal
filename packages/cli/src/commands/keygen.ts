import { randomHex } from "@vhyxseal/core";
import { colors, print } from "../utils/output.js";

/** Result of generating a signing secret. */
export interface KeygenResult {
  /** 64 hex characters (32 random bytes). */
  secret: string;
}

/**
 * Generates a 32-byte HMAC-SHA256 signing secret for manifest signing.
 * @param options - `silent` suppresses printing.
 * @returns The generated secret.
 * @example
 * const { secret } = await keygen({ silent: true });
 */
export async function keygen(options: { silent?: boolean } = {}): Promise<KeygenResult> {
  const secret = randomHex(32);
  if (!options.silent) {
    print(secret);
    print(colors.gray("Store this as VHYXSEAL_SECRET on your server. Never ship it to the browser."));
  }
  return { secret };
}
