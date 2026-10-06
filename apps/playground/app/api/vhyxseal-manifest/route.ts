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

// What an AI agent can do in the VhyxSeal playground. The security lab runs entirely in the browser with
// throwaway keys, so its "attacks" are simulations that change no real data.
const CONTRACTS = [
  defineContract({ ...common, id: "open-level", type: "navigation", intent: "navigate", description: "Open an adoption level (0 to 3) to see what an agent reads at that level", consequence: "Navigates within the playground", safetyLevel: "low" }),
  defineContract({ ...common, id: "tamper-manifest", type: "input", intent: "simulate-attack", description: "In the security lab, simulate an attacker downgrading a contract or verifying with the wrong key", consequence: "The demo manifest fails verification; no real data changes", safetyLevel: "low" }),
  defineContract({ ...common, id: "rotate-key", type: "action", intent: "simulate-attack", description: "Generate a new throwaway signing key for the security lab", consequence: "Re-signs the demo manifest in this tab", safetyLevel: "low" }),
  defineContract({ ...common, id: "replay-token", type: "action", intent: "simulate-attack", description: "Replay a used single-use action token to see it rejected", consequence: "The demo shows the replay being blocked", safetyLevel: "low" }),
  defineContract({ ...common, id: "visualize-manifest", type: "input", intent: "apply-filter", description: "Paste a manifest into the visualizer to draw it as an animated flow", consequence: "Re-renders the diagram", safetyLevel: "low" }),
  defineContract({ ...common, id: "toggle-theme", type: "action", intent: "apply-filter", description: "Switch between the dark and light theme", consequence: "Changes colours on this device only", safetyLevel: "low" }),
];

export function GET(request: NextRequest) {
  const result = handleManifestRoute(request, {
    domain: "play.vhyxseal.com",
    domainVerified: false,
    verificationToken: "",
    contracts: CONTRACTS,
  });
  return new Response(result.body, { status: result.status, headers: result.headers });
}
