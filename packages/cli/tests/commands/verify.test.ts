import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFileSync, mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { verify } from "../../src/commands/verify.js";

// Manifest-like JSON object — plain Record to avoid type constraints when
// deliberately omitting required fields to test runtime validation
function makeManifestJson(components: Array<Record<string, unknown>>): Record<string, unknown> {
  return {
    vhyxseal: "1.0.0",
    schemaUrl: "https://vhyxseal.dev/schema/1.0.0.json",
    domain: "test.com",
    domainVerified: false,
    verificationToken: "",
    signature: "unsigned",
    signedAt: new Date().toISOString(),
    fingerprint: "testfingerprint",
    capabilities: [],
    components,
    relationships: [],
    agentPolicy: {
      allowedAgents: ["*"],
      blockedAgents: [],
      requireAgentIdentification: false,
      rateLimits: { actionsPerMinute: 60, actionsPerHour: 1000, manifestRequestsPerMinute: 10, perAgentSession: false },
      allowedActions: ["*"],
      blockedActions: [],
      requiresConfirmation: [],
      requiresHumanPresent: [],
      manifestAccess: "public",
    },
    generatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  };
}

function makeContractJson(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "test-btn",
    type: "action",
    intent: "submit-form",
    description: "Test button",
    requires: [],
    requiredPermissions: [],
    consequence: "Submits the form",
    affects: ["form"],
    reversible: false,
    safetyLevel: "low",
    requiresConfirmation: false,
    destructive: false,
    contractVersion: "1.0.0",
    fingerprint: "abc123def456",
    lastVerified: new Date().toISOString(),
    verifiedBy: "manual",
    ...overrides,
  };
}

let tempDir: string;
let manifestPath: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "vhyxseal-test-"));
  manifestPath = join(tempDir, "vhyxseal.manifest.json");
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

function writeManifest(components: Array<Record<string, unknown>>): void {
  writeFileSync(manifestPath, JSON.stringify(makeManifestJson(components)));
}

describe("verify", () => {
  it("no manifest file found → 0 passed, 0 failed, blockedByCi false", async () => {
    // tempDir exists but has no manifest file written
    const result = await verify({ projectPath: tempDir });
    expect(result.passed).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.warned).toBe(0);
    expect(result.results).toHaveLength(0);
    expect(result.blockedByCi).toBe(false);
  });

  it("all contracts healthy → all pass, blockedByCi false", async () => {
    writeManifest([
      makeContractJson({ id: "btn-1" }),
      makeContractJson({ id: "btn-2" }),
    ]);
    const result = await verify({ projectPath: tempDir });
    expect(result.passed).toBe(2);
    expect(result.warned).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.blockedByCi).toBe(false);
  });

  it("contract with lastVerified 47 days ago is warned", async () => {
    const staleDate = new Date(Date.now() - 47 * 24 * 60 * 60 * 1000).toISOString();
    writeManifest([makeContractJson({ lastVerified: staleDate })]);
    const result = await verify({ projectPath: tempDir });
    expect(result.warned).toBe(1);
    expect(result.passed).toBe(0);
    expect(result.failed).toBe(0);
    const r = result.results[0];
    expect(r?.status).toBe("warn");
    expect(r?.message).toContain("days ago");
  });

  it("contract missing fingerprint → failed, blockedByCi true", async () => {
    // Omit fingerprint from the JSON fixture deliberately
    const contract = makeContractJson();
    delete contract["fingerprint"];
    writeManifest([contract]);
    const result = await verify({ projectPath: tempDir });
    expect(result.failed).toBe(1);
    expect(result.blockedByCi).toBe(true);
    expect(result.results[0]?.message).toContain("fingerprint");
  });

  it("contract missing contractVersion → failed", async () => {
    // Omit contractVersion from the JSON fixture deliberately
    const contract = makeContractJson();
    delete contract["contractVersion"];
    writeManifest([contract]);
    const result = await verify({ projectPath: tempDir });
    expect(result.failed).toBe(1);
    expect(result.results[0]?.message).toContain("contractVersion");
  });

  it("contract with verifiedBy 'auto' is warned", async () => {
    writeManifest([makeContractJson({ verifiedBy: "auto" })]);
    const result = await verify({ projectPath: tempDir });
    expect(result.warned).toBe(1);
    expect(result.passed).toBe(0);
    expect(result.results[0]?.status).toBe("warn");
    expect(result.results[0]?.message).toContain("inferred");
  });

  it("strict mode: warnings become failures, blockedByCi true", async () => {
    const staleDate = new Date(Date.now() - 47 * 24 * 60 * 60 * 1000).toISOString();
    writeManifest([makeContractJson({ lastVerified: staleDate })]);
    const result = await verify({ projectPath: tempDir, strict: true });
    expect(result.failed).toBe(1);
    expect(result.warned).toBe(0);
    expect(result.blockedByCi).toBe(true);
  });

  it("multiple contracts mixed → correct counts", async () => {
    const staleDate = new Date(Date.now() - 47 * 24 * 60 * 60 * 1000).toISOString();
    const missingFp = makeContractJson({ id: "bad-btn" });
    delete missingFp["fingerprint"];
    writeManifest([
      makeContractJson({ id: "good-btn-1" }),
      makeContractJson({ id: "good-btn-2" }),
      makeContractJson({ id: "stale-btn", lastVerified: staleDate }),
      missingFp,
    ]);
    const result = await verify({ projectPath: tempDir });
    expect(result.passed).toBe(2);
    expect(result.warned).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.blockedByCi).toBe(true);
  });
});
