import { handleManifestRoute } from "@vhyxseal/nextjs";
import type { NextRequest } from "next/server";

export function GET(request: NextRequest) {
  const result = handleManifestRoute(request, {
    domain: "playground.vhyxseal.dev",
    domainVerified: false,
    verificationToken: "",
    contracts: [],
  });
  return new Response(result.body, { status: result.status, headers: result.headers });
}
