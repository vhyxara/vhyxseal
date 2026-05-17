import type { NextConfig } from "next";
import { vhyxsealPlugin } from "@vhyxseal/nextjs";

// vhyxsealPlugin automatically injects:
// - Cache-Control and X-VhyxSeal-Version headers for /__agent__/manifest.json
// - Rewrite: /__agent__/manifest.json → /api/vhyxseal-manifest
const nextConfig: NextConfig = {};

export default vhyxsealPlugin(nextConfig);
