import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { init } from "../../src/commands/init.js";

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "vhyxseal-init-test-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("init", () => {
  it("creates vhyxseal.config.ts in the target directory", async () => {
    await init({ projectPath: tempDir });
    expect(existsSync(join(tempDir, "vhyxseal.config.ts"))).toBe(true);
  });

  it("created file contains ManifestConfig content", async () => {
    await init({ projectPath: tempDir });
    const content = readFileSync(join(tempDir, "vhyxseal.config.ts"), "utf-8");
    expect(content).toContain("ManifestConfig");
    expect(content).toContain("domain");
    expect(content).toContain("vhyxsealConfig");
  });

  it("returns configCreated: true and configPath pointing to the file", async () => {
    const result = await init({ projectPath: tempDir });
    expect(result.configCreated).toBe(true);
    expect(result.configPath).toBe(join(tempDir, "vhyxseal.config.ts"));
  });

  it("returns nextSteps as a non-empty array", async () => {
    const result = await init({ projectPath: tempDir });
    expect(Array.isArray(result.nextSteps)).toBe(true);
    expect(result.nextSteps.length).toBeGreaterThan(0);
  });

  it("alreadyExisted is false on first run", async () => {
    const result = await init({ projectPath: tempDir });
    expect(result.alreadyExisted).toBe(false);
  });

  it("when config already exists: returns alreadyExisted: true, configCreated: false without force", async () => {
    // First run creates it
    await init({ projectPath: tempDir });
    // Second run without force should not overwrite
    const result = await init({ projectPath: tempDir });
    expect(result.alreadyExisted).toBe(true);
    expect(result.configCreated).toBe(false);
  });

  it("when config already exists AND force: true: overwrites file, returns configCreated: true", async () => {
    // First run creates the file
    await init({ projectPath: tempDir });
    // Second run with force — should overwrite
    const result = await init({ projectPath: tempDir, force: true });
    expect(result.configCreated).toBe(true);
    expect(result.alreadyExisted).toBe(true);
  });

  it("domain option is embedded in the generated config", async () => {
    await init({ projectPath: tempDir, domain: "my-app.io" });
    const content = readFileSync(join(tempDir, "vhyxseal.config.ts"), "utf-8");
    expect(content).toContain("my-app.io");
  });

  it("default domain is used when domain option not provided", async () => {
    await init({ projectPath: tempDir });
    const content = readFileSync(join(tempDir, "vhyxseal.config.ts"), "utf-8");
    expect(content).toContain("your-domain.com");
  });

  it("adds @vhyxseal/core to package.json dependencies when package.json exists", async () => {
    writeFileSync(
      join(tempDir, "package.json"),
      JSON.stringify({ name: "my-app", dependencies: {} }),
    );
    await init({ projectPath: tempDir });
    const pkg = JSON.parse(readFileSync(join(tempDir, "package.json"), "utf-8")) as Record<string, unknown>;
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps["@vhyxseal/core"]).toBeDefined();
  });

  it("does not duplicate @vhyxseal/core if already in package.json", async () => {
    writeFileSync(
      join(tempDir, "package.json"),
      JSON.stringify({ name: "my-app", dependencies: { "@vhyxseal/core": "^0.0.9" } }),
    );
    await init({ projectPath: tempDir });
    const pkg = JSON.parse(readFileSync(join(tempDir, "package.json"), "utf-8")) as Record<string, unknown>;
    const deps = pkg.dependencies as Record<string, string>;
    // The version should remain at the original value — not overwritten
    expect(deps["@vhyxseal/core"]).toBe("^0.0.9");
  });

  it("skips package.json update when package.json does not exist", async () => {
    // No package.json in tempDir — should not throw
    await expect(init({ projectPath: tempDir })).resolves.not.toThrow();
    expect(existsSync(join(tempDir, "package.json"))).toBe(false);
  });
});
