// @vitest-environment node
import { describe, it, expect } from "vitest";

describe("server-side import", () => {
  it("imports without a DOM and registration is a no-op", async () => {
    expect(typeof HTMLElement).toBe("undefined");
    const mod = await import("../src/index.js");
    expect(typeof mod.SealButton).toBe("function");
    expect(() => mod.defineVhyxSealElements()).not.toThrow();
  });
});
