# @vhyxseal/core

The zero-dependency foundation of VhyxSeal — the semantic contract layer between
web UI and AI agents. Every other VhyxSeal package builds on this one.

> **Release candidate** — the API is stable; small changes may still land before 1.0.

## Install

```bash
npm install @vhyxseal/core
```

## What it provides

- **Contract schema** — `ComponentContract`, `Condition`, `ErrorState`, `Relationship`, `Capability`
- **`defineContract()`** — fills sensible defaults from a built-in intent vocabulary
- **Inference** — `inferContract()` derives contracts from HTML semantics
- **Manifests** — `generateManifest()` builds the document agents read at `/__agent__/manifest.json`
- **Signing** — HMAC-SHA256 `signManifest()` / `verifyManifest()` / `attachSignature()`
- **Security** — prompt-injection detection and field sanitisation
- **Action tokens** — `issueToken()`, `verifyToken()`, `revokeToken()`
- **Key management** — `registerKey()`, `rotateKey()`, `revokeKey()`
- **Versioning** — agent/site version negotiation

## Usage

```ts
import { defineContract, generateManifest, signManifest } from "@vhyxseal/core";

const placeOrder = defineContract({
  id: "place-order",
  type: "action",
  intent: "place-order", // fills safety level, confirmation and reversibility defaults
  description: "Places the current cart as an order",
  consequence: "Creates an order and charges the saved card",
  affects: ["orders", "payments"],
  requires: [],
  requiredPermissions: [],
  contractVersion: "1.0.0",
});

const manifest = generateManifest([placeOrder], {
  domain: "example.com",
  domainVerified: false,
  verificationToken: "",
});

const { signature } = signManifest(manifest, {
  algorithm: "hmac-sha256",
  keyHex: process.env.VHYXSEAL_SECRET!, // ≥ 64 hex characters (32 bytes)
  domain: "example.com",                // must match the manifest domain
});
```

Generate a secret with `npx @vhyxseal/cli keygen`, and keep it on the server.

## Runtime support

No runtime dependencies. Hashing and signing are implemented in TypeScript and use
`globalThis.crypto.getRandomValues`, so the same code runs in Node.js, browsers,
edge runtimes and workers.

## Links

- Documentation — https://vhyxseal.dev
- Source — https://github.com/vhyxara/vhyxseal/tree/main/packages/core
- License — MIT
