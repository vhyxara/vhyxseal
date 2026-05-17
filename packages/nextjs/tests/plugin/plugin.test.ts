import { describe, it, expect } from "vitest";
import { vhyxsealPlugin } from "../../src/plugin/index.js";
import type { NextConfig } from "next";

describe("vhyxsealPlugin", () => {
  it("returns a NextConfig object when called with empty config", () => {
    const result = vhyxsealPlugin({});
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  });

  it("does not mutate the input config", () => {
    const input: NextConfig = { reactStrictMode: true };
    const inputCopy = { ...input };
    vhyxsealPlugin(input);
    expect(input).toEqual(inputCopy);
  });

  it("preserves existing config keys", () => {
    const result = vhyxsealPlugin({ reactStrictMode: true, poweredByHeader: false });
    expect(result.reactStrictMode).toBe(true);
    expect(result.poweredByHeader).toBe(false);
  });

  it("preserves existing headers alongside VhyxSeal headers", async () => {
    const existingHeader = {
      source: "/api/(.*)",
      headers: [{ key: "X-Custom", value: "custom-value" }],
    };
    const result = vhyxsealPlugin({
      headers: async () => [existingHeader],
    });
    const headers = await result.headers!();
    const sources = headers.map((h) => h.source);
    expect(sources).toContain("/api/(.*)");
    expect(sources).toContain("/__agent__/manifest.json");
  });

  it("adds /__agent__/manifest.json to the headers config", async () => {
    const result = vhyxsealPlugin({});
    const headers = await result.headers!();
    const agentRoute = headers.find((h) => h.source === "/__agent__/manifest.json");
    expect(agentRoute).toBeDefined();
  });

  it("includes Cache-Control header for the manifest route", async () => {
    const result = vhyxsealPlugin({});
    const headers = await result.headers!();
    const agentRoute = headers.find((h) => h.source === "/__agent__/manifest.json")!;
    const cacheControl = agentRoute.headers.find((h) => h.key === "Cache-Control");
    expect(cacheControl).toBeDefined();
    expect(cacheControl?.value).toContain("max-age=3600");
  });

  it("includes X-VhyxSeal-Version: 1.0.0 header for the manifest route", async () => {
    const result = vhyxsealPlugin({});
    const headers = await result.headers!();
    const agentRoute = headers.find((h) => h.source === "/__agent__/manifest.json")!;
    const versionHeader = agentRoute.headers.find((h) => h.key === "X-VhyxSeal-Version");
    expect(versionHeader).toBeDefined();
    expect(versionHeader?.value).toBe("1.0.0");
  });

  it("rewrites include /__agent__/manifest.json source", async () => {
    const result = vhyxsealPlugin({});
    const rewrites = await result.rewrites!();
    const rewriteList = Array.isArray(rewrites) ? rewrites : [];
    const agentRewrite = rewriteList.find((rw) => rw.source === "/__agent__/manifest.json");
    expect(agentRewrite).toBeDefined();
  });

  it("rewrite destination is /api/vhyxseal-manifest", async () => {
    const result = vhyxsealPlugin({});
    const rewrites = await result.rewrites!();
    const rewriteList = Array.isArray(rewrites) ? rewrites : [];
    const agentRewrite = rewriteList.find((rw) => rw.source === "/__agent__/manifest.json");
    expect(agentRewrite?.destination).toBe("/api/vhyxseal-manifest");
  });

  it("existing array rewrites are preserved and VhyxSeal rewrite is appended", async () => {
    const existingRewrite = { source: "/old-path", destination: "/new-path" };
    const result = vhyxsealPlugin({
      rewrites: async () => [existingRewrite],
    });
    const rewrites = await result.rewrites!();
    const rewriteList = Array.isArray(rewrites) ? rewrites : [];
    const sources = rewriteList.map((rw) => rw.source);
    expect(sources).toContain("/old-path");
    expect(sources).toContain("/__agent__/manifest.json");
  });

  it("existing { beforeFiles, afterFiles, fallback } rewrites are preserved", async () => {
    const beforeEntry = { source: "/before", destination: "/before-dest" };
    const afterEntry = { source: "/after", destination: "/after-dest" };
    const result = vhyxsealPlugin({
      rewrites: async () => ({
        beforeFiles: [beforeEntry],
        afterFiles: [afterEntry],
        fallback: [],
      }),
    });
    const rewrites = await result.rewrites!();
    const rewriteList = Array.isArray(rewrites) ? rewrites : [];
    const sources = rewriteList.map((rw) => rw.source);
    expect(sources).toContain("/before");
    expect(sources).toContain("/after");
    expect(sources).toContain("/__agent__/manifest.json");
  });

  it("does not add duplicate rewrite when /__agent__/manifest.json is already configured", async () => {
    const manualRewrite = {
      source: "/__agent__/manifest.json",
      destination: "/api/custom-manifest",
    };
    const result = vhyxsealPlugin({
      rewrites: async () => [manualRewrite],
    });
    const rewrites = await result.rewrites!();
    const rewriteList = Array.isArray(rewrites) ? rewrites : [];
    const agentRewrites = rewriteList.filter(
      (rw) => rw.source === "/__agent__/manifest.json"
    );
    expect(agentRewrites).toHaveLength(1);
    expect(agentRewrites[0]?.destination).toBe("/api/custom-manifest");
  });

  it("preserves existing rewrites function output", async () => {
    const result = vhyxsealPlugin({
      rewrites: async () => [{ source: "/a", destination: "/b" }],
    });
    const rewrites = await result.rewrites!();
    const rewriteList = Array.isArray(rewrites) ? rewrites : [];
    expect(rewriteList.some((rw) => rw.source === "/a")).toBe(true);
  });
});
