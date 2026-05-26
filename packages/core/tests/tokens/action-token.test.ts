import { beforeEach, describe, expect, it } from "vitest";
import {
  clearTokens,
  issueToken,
  revokeToken,
  verifyToken,
} from "../../src/tokens/action-token.js";

beforeEach(() => {
  clearTokens();
});

describe("issueToken", () => {
  it("returns a 64-character hex string (32 bytes from crypto.randomBytes)", () => {
    const id = issueToken("c1", "comp1", "place-order");
    expect(id).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns a unique id on every call", () => {
    const id1 = issueToken("c1", "comp1", "place-order");
    const id2 = issueToken("c1", "comp1", "place-order");
    expect(id1).not.toBe(id2);
  });
});

describe("verifyToken — happy path", () => {
  it("returns true for a valid, unused token", () => {
    const id = issueToken("contract-1", "button-1", "place-order");
    expect(
      verifyToken(id, {
        contractId: "contract-1",
        componentId: "button-1",
        intent: "place-order",
      }),
    ).toBe(true);
  });
});

describe("verifyToken — used token", () => {
  it("returns false on a second verify attempt (replay blocked)", () => {
    const id = issueToken("contract-1", "button-1", "place-order");
    const expected = {
      contractId: "contract-1",
      componentId: "button-1",
      intent: "place-order",
    };
    expect(verifyToken(id, expected)).toBe(true);
    expect(verifyToken(id, expected)).toBe(false);
  });
});

describe("verifyToken — expired token", () => {
  it("returns false after TTL passes", async () => {
    const id = issueToken("contract-1", "button-1", "place-order", 1);
    await new Promise<void>((resolve) => setTimeout(resolve, 10));
    expect(
      verifyToken(id, {
        contractId: "contract-1",
        componentId: "button-1",
        intent: "place-order",
      }),
    ).toBe(false);
  });
});

describe("verifyToken — field mismatch", () => {
  it("returns false when contractId does not match (step 3)", () => {
    const id = issueToken("contract-1", "button-1", "place-order");
    expect(
      verifyToken(id, {
        contractId: "contract-WRONG",
        componentId: "button-1",
        intent: "place-order",
      }),
    ).toBe(false);
  });

  it("returns false when componentId does not match (step 4)", () => {
    const id = issueToken("contract-1", "button-1", "place-order");
    expect(
      verifyToken(id, {
        contractId: "contract-1",
        componentId: "button-WRONG",
        intent: "place-order",
      }),
    ).toBe(false);
  });

  it("returns false when intent does not match (step 5)", () => {
    const id = issueToken("contract-1", "button-1", "place-order");
    expect(
      verifyToken(id, {
        contractId: "contract-1",
        componentId: "button-1",
        intent: "delete-account",
      }),
    ).toBe(false);
  });
});

describe("verifyToken — nonexistent token", () => {
  it("returns false for a token id that was never issued (step 1)", () => {
    expect(
      verifyToken("nonexistent-token-id", {
        contractId: "c1",
        componentId: "comp1",
        intent: "place-order",
      }),
    ).toBe(false);
  });
});

describe("clearTokens — restart simulation", () => {
  it("returns false after clearTokens() for a previously issued token", () => {
    const id = issueToken("contract-1", "button-1", "place-order");
    clearTokens();
    expect(
      verifyToken(id, {
        contractId: "contract-1",
        componentId: "button-1",
        intent: "place-order",
      }),
    ).toBe(false);
  });
});

describe("revokeToken", () => {
  it("prevents verification of a revoked token", () => {
    const id = issueToken("contract-1", "button-1", "place-order");
    revokeToken(id);
    expect(
      verifyToken(id, {
        contractId: "contract-1",
        componentId: "button-1",
        intent: "place-order",
      }),
    ).toBe(false);
  });

  it("does not throw when revoking a nonexistent token", () => {
    expect(() => revokeToken("never-issued")).not.toThrow();
  });

  it("does not affect other tokens when one is revoked", () => {
    const id1 = issueToken("contract-1", "button-1", "place-order");
    const id2 = issueToken("contract-2", "button-2", "search");
    revokeToken(id1);
    expect(
      verifyToken(id2, {
        contractId: "contract-2",
        componentId: "button-2",
        intent: "search",
      }),
    ).toBe(true);
  });
});

describe("eviction", () => {
  it("expired token is not verifiable after eviction triggered by issueToken", async () => {
    const expiredId = issueToken("c1", "comp1", "intent-a", 1);
    await new Promise<void>((resolve) => setTimeout(resolve, 10));
    // issueToken calls evictExpired internally — expired entry is swept
    issueToken("c2", "comp2", "intent-b");
    expect(
      verifyToken(expiredId, {
        contractId: "c1",
        componentId: "comp1",
        intent: "intent-a",
      }),
    ).toBe(false);
  });

  it("expired token is not verifiable after eviction triggered by verifyToken", async () => {
    const expiredId = issueToken("c1", "comp1", "intent-a", 1);
    await new Promise<void>((resolve) => setTimeout(resolve, 10));
    // verifyToken calls evictExpired before the 6-step check
    expect(
      verifyToken(expiredId, {
        contractId: "c1",
        componentId: "comp1",
        intent: "intent-a",
      }),
    ).toBe(false);
  });
});
