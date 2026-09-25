import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  defineContract,
  generateManifest,
  clearRelationshipRegistry,
  clearCapabilityRegistry,
  type ComponentContract,
  type VhyxSealManifest,
} from "@vhyxseal/core";
import { diffManifests, diff } from "../../src/commands/diff.js";
import { keygen } from "../../src/commands/keygen.js";
import { sign } from "../../src/commands/sign.js";
import { manifestToVhyxChart, visualize } from "../../src/commands/visualize.js";
import { parseArgs, run } from "../../src/bin.js";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "vhyxseal-cli-"));
  clearRelationshipRegistry();
  clearCapabilityRegistry();
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function contract(id: string, overrides: Partial<ComponentContract> = {}): ComponentContract {
  return defineContract({
    id,
    type: "action",
    intent: "place-order",
    description: "Places an order",
    requires: [],
    requiredPermissions: [],
    consequence: "Creates an order",
    affects: ["orders"],
    reversible: true,
    safetyLevel: "high",
    requiresConfirmation: true,
    destructive: false,
    contractVersion: "1.0.0",
    ...overrides,
  });
}

function manifest(components: ComponentContract[], extra: Partial<VhyxSealManifest> = {}): VhyxSealManifest {
  return { ...generateManifest(components, { domain: "shop.test", domainVerified: false, verificationToken: "" }), ...extra };
}

describe("diffManifests", () => {
  it("reports no changes for identical manifests", () => {
    const m = manifest([contract("a")]);
    expect(diffManifests(m, m)).toMatchObject({ changes: [], breaking: 0 });
  });

  it("classifies raised safety, removal and new confirmation as breaking", () => {
    const before = manifest([contract("a", { safetyLevel: "low", requiresConfirmation: false }), contract("gone")]);
    const after = manifest([contract("a", { safetyLevel: "critical", requiresConfirmation: true }), contract("new")]);
    const r = diffManifests(before, after);
    const a = r.changes.find((c) => c.id === "a");
    expect(a?.breakingForAgents).toBe(true);
    expect(a?.message).toMatch(/safetyLevel raised low → critical/);
    expect(r.changes.find((c) => c.id === "gone")?.kind).toBe("removed");
    expect(r.changes.find((c) => c.id === "new")?.breakingForAgents).toBe(false);
    expect(r.breaking).toBe(2);
  });

  it("lowering safety is a non-breaking change", () => {
    const r = diffManifests(manifest([contract("a")]), manifest([contract("a", { safetyLevel: "low" })]));
    expect(r.changes[0]?.breakingForAgents).toBe(false);
  });

  it("diff() reads files and returns the same result", async () => {
    const b = join(dir, "b.json");
    const a = join(dir, "a.json");
    writeFileSync(b, JSON.stringify(manifest([contract("x")])));
    writeFileSync(a, JSON.stringify(manifest([])));
    const r = await diff({ before: b, after: a, silent: true });
    expect(r.breaking).toBe(1);
  });
});

describe("keygen + sign", () => {
  it("generates a 64 hex secret", async () => {
    expect((await keygen({ silent: true })).secret).toMatch(/^[0-9a-f]{64}$/);
  });

  it("signs in place and verifies; tampering fails verification", async () => {
    const file = join(dir, "m.json");
    writeFileSync(file, JSON.stringify(manifest([contract("a")])));
    const { secret } = await keygen({ silent: true });
    const signed = await sign({ file, secret, silent: true });
    expect(signed.ok).toBe(true);
    expect(signed.signature.startsWith("hmac-sha256:")).toBe(true);
    expect((await sign({ file, secret, verifyOnly: true, silent: true })).ok).toBe(true);

    const data = JSON.parse(readFileSync(file, "utf8")) as VhyxSealManifest;
    writeFileSync(file, JSON.stringify({ ...data, domainVerified: true }));
    expect((await sign({ file, secret, verifyOnly: true, silent: true })).ok).toBe(false);
  });

  it("fails without a secret", async () => {
    const file = join(dir, "m.json");
    writeFileSync(file, JSON.stringify(manifest([])));
    const prev = process.env["VHYXSEAL_SECRET"];
    delete process.env["VHYXSEAL_SECRET"];
    expect((await sign({ file, silent: true })).ok).toBe(false);
    if (prev !== undefined) process.env["VHYXSEAL_SECRET"] = prev;
  });
});

describe("manifestToVhyxChart", () => {
  const seqManifest = (): VhyxSealManifest =>
    manifest([contract("cart-btn", { safetyLevel: "low", requiresConfirmation: false }), contract("pay-btn", { type: "confirmation" })], {
      relationships: [
        {
          type: "sequence",
          id: "checkout",
          description: "Checkout flow",
          linear: true,
          steps: [
            { order: 1, componentId: "cart-btn", canSkip: false, onComplete: "pay-btn", onFail: "cart-btn" },
            { order: 2, componentId: "pay-btn", canSkip: false, onComplete: "pay-btn", onFail: "cart-btn" },
          ],
        },
      ],
    });

  it("emits a flowchart with safety classes, edges and a scenario", () => {
    const src = manifestToVhyxChart(seqManifest());
    expect(src).toContain("flowchart LR");
    expect(src).toMatch(/cart_btn\[place-order<br\/>low\]:::success/);
    expect(src).toMatch(/pay_btn\{place-order<br\/>high · confirm\}:::warn/);
    expect(src).toContain("cart_btn -->|ok| pay_btn");
    expect(src).toContain("scenario Checkout flow");
    expect(src).toContain("note pay_btn : human confirmation required");
  });

  it("sanitises ids and labels", () => {
    const src = manifestToVhyxChart(manifest([contract("9 weird-id", { intent: "x[y]" })]));
    expect(src).toContain("c_9_weird_id[x y<br/>high · confirm]");
  });

  it("visualize() writes a file", async () => {
    const file = join(dir, "m.json");
    const out = join(dir, "out.vhyx");
    writeFileSync(file, JSON.stringify(seqManifest()));
    await visualize({ file, out, silent: true });
    expect(readFileSync(out, "utf8")).toContain("flowchart LR");
  });
});

describe("bin", () => {
  it("parses flags and positionals", () => {
    expect(parseArgs(["diff", "a", "b", "--json", "-o", "x.vhyx", "--domain=d.com"])).toEqual({
      command: "diff",
      positionals: ["a", "b"],
      flags: { json: true, o: "x.vhyx", domain: "d.com" },
    });
  });

  it("prints help and returns 0; unknown command returns 1", async () => {
    const out = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const err = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    expect(await run(["help"])).toBe(0);
    expect(await run(["nope"])).toBe(1);
    expect(await run(["diff"])).toBe(1);
    out.mockRestore();
    err.mockRestore();
  });
});
