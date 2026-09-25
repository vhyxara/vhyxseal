/**
 * Isomorphic, zero-dependency cryptographic primitives for @vhyxseal/core.
 *
 * Why this exists (DECISION-029): core previously imported Node's `crypto`
 * module at the top level of four files. Browser bundlers either fail the
 * build or ship `undefined` for `randomBytes`, so every React/Vue/vanilla
 * consumer of core was one call away from a runtime crash. These helpers use
 * only `globalThis.crypto.getRandomValues` (available in every browser, Node
 * >= 19, Deno, Bun, edge runtimes) plus a synchronous SHA-256/HMAC written in
 * plain TypeScript. Core keeps zero runtime dependencies (DECISION-012).
 *
 * Internal module — not part of the public API surface except `hmacSha256Hex`
 * and `sha256Hex`, which are re-exported for manifest signing consumers.
 */

import { VhyxSealError, ErrorCode } from "../errors/index.js";

// ---------------------------------------------------------------------------
// Encoding helpers
// ---------------------------------------------------------------------------

const HEX = "0123456789abcdef";

/** Encodes bytes as lowercase hex. */
export function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i] ?? 0;
    out += (HEX[b >>> 4] ?? "0") + (HEX[b & 15] ?? "0");
  }
  return out;
}

/**
 * Decodes a hex string into bytes.
 * @throws {VhyxSealError} when the input is not valid even-length hex.
 */
export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0 || /[^0-9a-fA-F]/.test(hex)) {
    throw new VhyxSealError({
      code: ErrorCode.VHYX_MANIFEST_SIGNING_FAILED,
      message: "Key material must be an even-length hex string",
      context: { length: hex.length },
      severity: "error",
      recoverable: true,
      suggestion: "Encode secrets as lowercase hex, e.g. generate with randomHex(32).",
    });
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** UTF-8 encodes a string without relying on Buffer. */
export function utf8(input: string): Uint8Array {
  return new TextEncoder().encode(input);
}

// ---------------------------------------------------------------------------
// Randomness
// ---------------------------------------------------------------------------

interface WebCryptoLike {
  getRandomValues<T extends ArrayBufferView>(array: T): T;
}

function getWebCrypto(): WebCryptoLike {
  const candidate = (globalThis as { crypto?: WebCryptoLike }).crypto;
  if (candidate === undefined || typeof candidate.getRandomValues !== "function") {
    throw new VhyxSealError({
      code: ErrorCode.VHYX_MANIFEST_SIGNING_FAILED,
      message: "No secure random source available (globalThis.crypto.getRandomValues)",
      context: {},
      severity: "fatal",
      recoverable: false,
      suggestion: "Run on Node.js >= 19, a modern browser, Deno, Bun, or an edge runtime.",
    });
  }
  return candidate;
}

/**
 * Returns `byteLength` cryptographically secure random bytes as hex.
 * @param byteLength - Number of random bytes (output is twice as many hex chars).
 * @returns Lowercase hex string.
 * @throws {VhyxSealError} when no secure random source exists.
 * @example
 * randomHex(32) // 64 hex chars
 */
export function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  getWebCrypto().getRandomValues(bytes);
  return bytesToHex(bytes);
}

// ---------------------------------------------------------------------------
// SHA-256 (FIPS 180-4)
// ---------------------------------------------------------------------------

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n));
}

/**
 * Computes the SHA-256 digest of the given bytes.
 * @param data - Input bytes.
 * @returns 32-byte digest.
 */
export function sha256(data: Uint8Array): Uint8Array {
  const bitLength = data.length * 8;
  const paddedLength = Math.ceil((data.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(data);
  padded[data.length] = 0x80;
  const view = new DataView(padded.buffer);
  // 64-bit big-endian length; inputs are far below 2^53 bits.
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false);
  view.setUint32(paddedLength - 4, bitLength >>> 0, false);

  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const w = new Uint32Array(64);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const w15 = w[i - 15] ?? 0;
      const w2 = w[i - 2] ?? 0;
      const s0 = rotr(w15, 7) ^ rotr(w15, 18) ^ (w15 >>> 3);
      const s1 = rotr(w2, 17) ^ rotr(w2, 19) ^ (w2 >>> 10);
      w[i] = ((w[i - 16] ?? 0) + s0 + (w[i - 7] ?? 0) + s1) >>> 0;
    }
    let a = h[0] ?? 0, b = h[1] ?? 0, c = h[2] ?? 0, d = h[3] ?? 0;
    let e = h[4] ?? 0, f = h[5] ?? 0, g = h[6] ?? 0, hh = h[7] ?? 0;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + (K[i] ?? 0) + (w[i] ?? 0)) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h[0] = ((h[0] ?? 0) + a) >>> 0; h[1] = ((h[1] ?? 0) + b) >>> 0;
    h[2] = ((h[2] ?? 0) + c) >>> 0; h[3] = ((h[3] ?? 0) + d) >>> 0;
    h[4] = ((h[4] ?? 0) + e) >>> 0; h[5] = ((h[5] ?? 0) + f) >>> 0;
    h[6] = ((h[6] ?? 0) + g) >>> 0; h[7] = ((h[7] ?? 0) + hh) >>> 0;
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) outView.setUint32(i * 4, h[i] ?? 0, false);
  return out;
}

/**
 * SHA-256 of a UTF-8 string, as lowercase hex.
 * @param input - String to hash.
 * @returns 64-character hex digest.
 * @example
 * sha256Hex("abc") // "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
 */
export function sha256Hex(input: string): string {
  return bytesToHex(sha256(utf8(input)));
}

/**
 * HMAC-SHA256 (RFC 2104).
 * @param key - Key bytes.
 * @param message - Message bytes.
 * @returns 32-byte MAC.
 */
export function hmacSha256(key: Uint8Array, message: Uint8Array): Uint8Array {
  const blockSize = 64;
  let k = key.length > blockSize ? sha256(key) : key;
  const padded = new Uint8Array(blockSize);
  padded.set(k);
  k = padded;
  const inner = new Uint8Array(blockSize + message.length);
  const outer = new Uint8Array(blockSize + 32);
  for (let i = 0; i < blockSize; i++) {
    const byte = k[i] ?? 0;
    inner[i] = byte ^ 0x36;
    outer[i] = byte ^ 0x5c;
  }
  inner.set(message, blockSize);
  outer.set(sha256(inner), blockSize);
  return sha256(outer);
}

/**
 * HMAC-SHA256 with a hex key over a UTF-8 message, returned as hex.
 * @param keyHex - Key material as hex.
 * @param message - UTF-8 message.
 * @returns 64-character hex MAC.
 * @throws {VhyxSealError} when keyHex is not valid hex.
 * @example
 * hmacSha256Hex("0b".repeat(20), "Hi There")
 */
export function hmacSha256Hex(keyHex: string, message: string): string {
  return bytesToHex(hmacSha256(hexToBytes(keyHex), utf8(message)));
}

/**
 * Constant-time string comparison for equal-length hex digests.
 * Returns false immediately only on a length mismatch (length is not secret).
 * @param a - First string.
 * @param b - Second string.
 * @returns True when identical.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
