import { defineContract } from "@vhyxseal/core";
import { handleManifestRoute } from "@vhyxseal/nextjs";
import type { NextRequest } from "next/server";

const common = {
  requires: [],
  requiredPermissions: [],
  affects: [],
  reversible: true,
  requiresConfirmation: false,
  destructive: false,
  contractVersion: "1.0.0",
} as const;

// What an AI agent can do on the VhyxSeal docs. Nothing here changes data, so every action is low risk.
const CONTRACTS = [
  defineContract({ ...common, id: "search-docs", type: "input", intent: "search", description: "Search the VhyxSeal documentation", consequence: "Shows matching pages", safetyLevel: "low" }),
  defineContract({ ...common, id: "open-page", type: "navigation", intent: "navigate", description: "Open a docs page: schema, intents, security, frameworks, CLI, errors or the RFC", consequence: "Navigates within the docs", safetyLevel: "low" }),
  defineContract({ ...common, id: "copy-code", type: "action", intent: "copy-text", description: "Copy a code example or the install command", consequence: "Clipboard changes", safetyLevel: "low" }),
  defineContract({ ...common, id: "toggle-theme", type: "action", intent: "apply-filter", description: "Switch between the dark and light theme", consequence: "Changes colours on this device only", safetyLevel: "low" }),
  defineContract({ ...common, id: "open-security-lab", type: "navigation", intent: "navigate", description: "Open the security lab in the playground", consequence: "Navigates to play.vhyxseal.com", safetyLevel: "low" }),
  defineContract({ ...common, id: "family-switch", type: "navigation", intent: "navigate", description: "Switch to the VhyxUI or VhyxChart documentation", consequence: "Navigates to another docs site", safetyLevel: "low" }),
];

export function GET(request: NextRequest) {
  const result = handleManifestRoute(request, {
    domain: "docs.vhyxseal.com",
    domainVerified: false,
    verificationToken: "",
    contracts: CONTRACTS,
  });

  return new Response(result.body, {
    status: result.status,
    headers: result.headers,
  });
}
