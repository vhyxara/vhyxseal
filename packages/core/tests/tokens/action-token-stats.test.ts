import { beforeEach, describe, expect, it } from "vitest";
import {
  clearTokens,
  getTokenStats,
  issueToken,
  verifyToken,
} from "../../src/tokens/action-token.js";

beforeEach(() => {
  clearTokens();
});

describe("getTokenStats — initial state", () => {
  it("returns all zeros on fresh state", () => {
    expect(getTokenStats()).toEqual({
      issued: 0,
      used: 0,
      expired: 0,
      replayAttempts: 0,
    });
  });
});

describe("getTokenStats — issued counter", () => {
  it("increments issued by 1 after one issueToken() call", () => {
    issueToken("c1", "comp1", "place-order");
    expect(getTokenStats().issued).toBe(1);
  });

  it("increments issued by call count for multiple issueToken() calls", () => {
    issueToken("c1", "comp1", "place-order");
    issueToken("c2", "comp2", "search");
    issueToken("c3", "comp3", "send-message");
    expect(getTokenStats().issued).toBe(3);
  });
});

describe("getTokenStats — used counter", () => {
  it("increments used by 1 after a successful verifyToken()", () => {
    const id = issueToken("contract-1", "button-1", "place-order");
    verifyToken(id, {
      contractId: "contract-1",
      componentId: "button-1",
      intent: "place-order",
    });
    expect(getTokenStats().used).toBe(1);
  });
});

describe("getTokenStats — replayAttempts counter", () => {
  it("increments replayAttempts when verifyToken() is called on an already-used token", () => {
    const id = issueToken("contract-1", "button-1", "place-order");
    const expected = {
      contractId: "contract-1",
      componentId: "button-1",
      intent: "place-order",
    };
    verifyToken(id, expected); // first verify — succeeds, increments used
    verifyToken(id, expected); // replay attempt
    expect(getTokenStats().replayAttempts).toBe(1);
    // used must not have incremented a second time
    expect(getTokenStats().used).toBe(1);
  });
});

describe("getTokenStats — clearTokens() resets all counters", () => {
  it("resets all counters to 0 after clearTokens()", () => {
    const id = issueToken("contract-1", "button-1", "place-order");
    const expected = {
      contractId: "contract-1",
      componentId: "button-1",
      intent: "place-order",
    };
    verifyToken(id, expected);
    verifyToken(id, expected); // replay
    clearTokens();
    expect(getTokenStats()).toEqual({
      issued: 0,
      used: 0,
      expired: 0,
      replayAttempts: 0,
    });
  });
});

describe("getTokenStats — expired counter", () => {
  it("increments expired >= 1 when a token with 1ms TTL is evicted by a subsequent issueToken()", async () => {
    issueToken("c1", "comp1", "place-order", 1);
    await new Promise<void>((resolve) => setTimeout(resolve, 2));
    // triggering evictExpired via issueToken
    issueToken("c2", "comp2", "search");
    expect(getTokenStats().expired).toBeGreaterThanOrEqual(1);
  });
});
