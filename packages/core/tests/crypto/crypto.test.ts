import { describe, it, expect } from "vitest";
import { createHash, createHmac } from "node:crypto";
import {
  sha256Hex,
  hmacSha256Hex,
  randomHex,
  constantTimeEqual,
  hexToBytes,
  bytesToHex,
} from "../../src/crypto/index.js";
import { VhyxSealError } from "../../src/errors/index.js";

describe("sha256Hex", () => {
  it("matches FIPS test vectors", () => {
    expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(sha256Hex("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });

  it("matches Node's implementation across block boundaries and unicode", () => {
    for (const input of ["a".repeat(55), "a".repeat(56), "a".repeat(64), "a".repeat(1000), "héllo 🔒 wörld"]) {
      expect(sha256Hex(input)).toBe(createHash("sha256").update(input, "utf8").digest("hex"));
    }
  });
});

describe("hmacSha256Hex", () => {
  it("matches RFC 4231 test case 1", () => {
    expect(hmacSha256Hex("0b".repeat(20), "Hi There")).toBe(
      "b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7",
    );
  });

  it("matches Node for long keys (> block size)", () => {
    const key = "ab".repeat(100);
    expect(hmacSha256Hex(key, "payload")).toBe(
      createHmac("sha256", Buffer.from(key, "hex")).update("payload").digest("hex"),
    );
  });

  it("throws VhyxSealError for invalid hex keys", () => {
    expect(() => hmacSha256Hex("xyz", "m")).toThrow(VhyxSealError);
  });
});

describe("randomHex", () => {
  it("returns the requested length and differs between calls", () => {
    const a = randomHex(32);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(randomHex(32)).not.toBe(a);
  });
});

describe("helpers", () => {
  it("constantTimeEqual compares exactly", () => {
    expect(constantTimeEqual("abcd", "abcd")).toBe(true);
    expect(constantTimeEqual("abcd", "abce")).toBe(false);
    expect(constantTimeEqual("abc", "abcd")).toBe(false);
  });

  it("hex round-trips", () => {
    expect(bytesToHex(hexToBytes("00ff10ab"))).toBe("00ff10ab");
  });
});
