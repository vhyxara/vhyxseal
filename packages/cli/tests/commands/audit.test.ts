import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { audit } from "../../src/commands/audit.js";

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "vhyxseal-audit-test-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

function makeManifest(
  domain: string,
  components: Array<Record<string, unknown>>,
): Record<string, unknown> {
  return {
    vhyxseal: "1.0.0",
    schemaUrl: "https://vhyxseal.dev/schema/1.0.0",
    domain,
    domainVerified: false,
    verificationToken: "",
    signature: "unsigned",
    signedAt: new Date().toISOString(),
    fingerprint: "testfp",
    capabilities: [],
    components,
    relationships: [],
    agentPolicy: {
      allowedAgents: ["*"],
      blockedAgents: [],
      requireAgentIdentification: false,
      rateLimits: {
        actionsPerMinute: 60,
        actionsPerHour: 1000,
        manifestRequestsPerMinute: 10,
        perAgentSession: false,
      },
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

function makeComponent(
  id: string,
  verifiedBy: "auto" | "manual" | "test" = "manual",
): Record<string, unknown> {
  return {
    id,
    type: "action",
    intent: "submit-form",
    description: "Test component",
    requires: [],
    requiredPermissions: [],
    consequence: "Submits",
    affects: [],
    reversible: false,
    safetyLevel: "low",
    requiresConfirmation: false,
    destructive: false,
    contractVersion: "1.0.0",
    fingerprint: `fp_${id}`,
    lastVerified: new Date().toISOString(),
    verifiedBy,
  };
}

function writeManifestFile(
  domain: string,
  components: Array<Record<string, unknown>>,
): void {
  writeFileSync(
    join(tempDir, "vhyxseal.manifest.json"),
    JSON.stringify(makeManifest(domain, components)),
  );
}

describe("audit", () => {
  it("no manifest file → manifestFound false, all zeros", async () => {
    const result = await audit({ projectPath: tempDir });
    expect(result.manifestFound).toBe(false);
    expect(result.totalComponents).toBe(0);
    expect(result.explicitContracts).toBe(0);
    expect(result.inferredContracts).toBe(0);
    expect(result.missingContracts).toBeNull();
    expect(result.coveragePercent).toBeNull();
  });

  it("valid manifest file → correct total component count", async () => {
    writeManifestFile("test.com", [
      makeComponent("btn-1"),
      makeComponent("btn-2"),
      makeComponent("btn-3"),
    ]);
    const result = await audit({ projectPath: tempDir });
    expect(result.manifestFound).toBe(true);
    expect(result.totalComponents).toBe(3);
  });

  it("explicitContracts counts verifiedBy !== 'auto'", async () => {
    writeManifestFile("test.com", [
      makeComponent("btn-manual", "manual"),
      makeComponent("btn-test", "test"),
      makeComponent("btn-auto", "auto"),
    ]);
    const result = await audit({ projectPath: tempDir });
    expect(result.explicitContracts).toBe(2);
    expect(result.inferredContracts).toBe(1);
  });

  it("inferredContracts counts verifiedBy === 'auto'", async () => {
    writeManifestFile("test.com", [
      makeComponent("btn-manual", "manual"),
      makeComponent("btn-auto-1", "auto"),
      makeComponent("btn-auto-2", "auto"),
    ]);
    const result = await audit({ projectPath: tempDir });
    expect(result.inferredContracts).toBe(2);
    expect(result.explicitContracts).toBe(1);
  });

  it("missingContracts is always null", async () => {
    writeManifestFile("test.com", [makeComponent("btn-1")]);
    const result = await audit({ projectPath: tempDir });
    expect(result.missingContracts).toBeNull();
  });

  it("coveragePercent is always null (D3 — cannot detect missing contracts)", async () => {
    writeManifestFile("test.com", [makeComponent("btn-1"), makeComponent("btn-2")]);
    const result = await audit({ projectPath: tempDir });
    expect(result.coveragePercent).toBeNull();
  });

  it("json: true → returns correct AuditResult shape", async () => {
    writeManifestFile("test.com", [
      makeComponent("btn-1", "manual"),
      makeComponent("btn-2", "auto"),
    ]);
    const result = await audit({ projectPath: tempDir, json: true });
    expect(result.manifestFound).toBe(true);
    expect(result.totalComponents).toBe(2);
    expect(result.explicitContracts).toBe(1);
    expect(result.inferredContracts).toBe(1);
    expect(result.missingContracts).toBeNull();
    expect(result.coveragePercent).toBeNull();
  });

  it("json: false → human readable output, returns same AuditResult", async () => {
    writeManifestFile("test.com", [makeComponent("btn-1")]);
    const result = await audit({ projectPath: tempDir, json: false });
    expect(result.manifestFound).toBe(true);
    expect(result.totalComponents).toBe(1);
  });
});
