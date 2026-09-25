import { readFileSync, writeFileSync } from "node:fs";
import { attachSignature, verifyManifest, type VhyxSealManifest } from "@vhyxseal/core";
import { colors, symbols, print, printError } from "../utils/output.js";

/** Options for the sign command. */
export interface SignOptions {
  /** Manifest JSON path. */
  file: string;
  /** Hex secret. Defaults to the VHYXSEAL_SECRET environment variable. */
  secret?: string;
  /** Only verify the existing signature instead of signing. */
  verifyOnly?: boolean;
  /** Suppress printing. */
  silent?: boolean;
}

/** Result of sign/verify. */
export interface SignResult {
  ok: boolean;
  signature: string;
  reason?: string;
}

/**
 * Signs (or verifies) a manifest file in place with HMAC-SHA256.
 * @param options - File, secret, and mode.
 * @returns Whether the operation succeeded and the resulting signature.
 * @example
 * await sign({ file: "public/__agent__/manifest.json" });
 */
export async function sign(options: SignOptions): Promise<SignResult> {
  const secret = options.secret ?? process.env["VHYXSEAL_SECRET"];
  if (secret === undefined || secret.length === 0) {
    if (!options.silent) printError(colors.red(`${symbols.fail} No secret. Pass --secret or set VHYXSEAL_SECRET (see: vhyxseal keygen).`));
    return { ok: false, signature: "", reason: "missing secret" };
  }
  // The manifest file is produced by VhyxSeal tooling; shape is trusted like `verify`.
  const manifest = JSON.parse(readFileSync(options.file, "utf8")) as VhyxSealManifest;
  const key = { algorithm: "hmac-sha256" as const, keyHex: secret, domain: manifest.domain };

  if (options.verifyOnly) {
    const result = verifyManifest(manifest, manifest.signature, key);
    if (!options.silent) {
      print(result.valid ? colors.green(`${symbols.pass} Signature valid`) : colors.red(`${symbols.fail} ${result.reason ?? "invalid"}`));
    }
    return result.valid
      ? { ok: true, signature: manifest.signature }
      : { ok: false, signature: manifest.signature, reason: result.reason ?? "invalid" };
  }

  const signed = attachSignature(manifest, key);
  writeFileSync(options.file, JSON.stringify(signed, null, 2) + "\n");
  if (!options.silent) print(colors.green(`${symbols.pass} Signed ${options.file} → ${signed.signature.slice(0, 24)}…`));
  return { ok: true, signature: signed.signature };
}
