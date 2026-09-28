# VhyxSeal

**Seal the contract between your UI and the agentic web.**

AI agents are starting to use websites on people's behalf — but a web page only
shows them pixels and markup. They have to guess what a button does, whether it
is safe to press, and whether a human should confirm first.

VhyxSeal gives every component a **contract**: its intent, preconditions,
consequences, safety level and whether it needs human confirmation. Your site
publishes all contracts as a signed manifest at `/__agent__/manifest.json`, so
agents know what they can do — and what they must not do alone.

Think of it as **OpenAPI for your UI**.

[![npm](https://img.shields.io/npm/v/@vhyxseal/core?label=%40vhyxseal%2Fcore)](https://www.npmjs.com/package/@vhyxseal/core)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

> **Release candidate** — the contract schema is stable; small API changes may still land before 1.0.

## Quick start (React)

```bash
npm install @vhyxseal/react @vhyxseal/core
```

```tsx
import { SealProvider, Button } from "@vhyxseal/react";
import { defineContract } from "@vhyxseal/core";

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

export function Checkout() {
  return (
    <SealProvider config={{ domain: "example.com", domainVerified: false, verificationToken: "" }}>
      <Button contract={placeOrder} onClick={submitOrder}>
        Place order
      </Button>
    </SealProvider>
  );
}
```

The button renders exactly as before. Behind it, agents now see an action with
intent `place-order`, safety level `high`, and a rule that a human must confirm.

Serve the manifest from Next.js with `@vhyxseal/nextjs`, sign it with
`npx @vhyxseal/cli keygen` and `sign`, and check what changed for agents in CI
with `vhyxseal diff --strict`.

## Packages

| Package | What it does |
|---|---|
| [`@vhyxseal/core`](packages/core) | Contract schema, inference, manifest generation, HMAC-SHA256 signing, injection detection. Zero dependencies. |
| [`@vhyxseal/react`](packages/react) | `SealProvider`, `withAgentContract`, hooks and headless components |
| [`@vhyxseal/vue`](packages/vue) | Vue 3 plugin, composables and components |
| [`@vhyxseal/vanilla`](packages/vanilla) | Framework-free custom elements (`<seal-button>` …), safe to import during SSR |
| [`@vhyxseal/nextjs`](packages/nextjs) | Config plugin and `/__agent__/manifest.json` route handler |
| [`@vhyxseal/cli`](packages/cli) | `init`, `simulate`, `verify`, `audit`, `diff`, `keygen`, `sign`, `visualize` |
| [`@vhyxseal/devtools`](packages/devtools) | In-page panel and overlay for inspecting contracts |
| [`@vhyxseal/testing`](packages/testing) | Matchers, drift detection and a mock agent session |
| [`@vhyxseal/style`](packages/style) | CSS tokens for VhyxSeal tooling |

## Security model

- **Structural trust** — agents decide from typed fields (`safetyLevel`, `requiresConfirmation`, `destructive`), never from free text alone
- **Signed manifests** — HMAC-SHA256 over a canonical payload, bound to your domain
- **Prompt-injection sanitising** — every string field is checked and length-limited before an agent sees it
- **Single-use action tokens** — short-lived, and rejected on replay
- **Abstract conditions** — contracts reference `user.hasPaymentMethod`, never your database fields

Found a vulnerability? See [SECURITY.md](SECURITY.md) — please don't open a public issue.

## Specification

The contract layer is specified in [RFC-0001](RFC-0001.md). Breaking changes go
through the RFC process in [`docs/rfc`](docs/rfc).

## Develop

Requires Node.js 20.19+ and pnpm 9+.

```bash
pnpm install
pnpm build
pnpm test
pnpm --filter @vhyxseal/docs dev         # documentation site
pnpm --filter @vhyxseal/playground dev   # playground, http://localhost:3001
```

See [CONTRIBUTING.md](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md).

## Family

VhyxSeal is part of the Vhyxara family:

- [**VhyxUI**](https://github.com/vhyxara/vhyxUI) — accessible React components with VhyxSeal contracts built in
- [**VhyxChart**](https://github.com/vhyxara/vhyxchart) — animated, text-defined diagrams; `vhyxseal visualize` turns any manifest into one

## License

[MIT](LICENSE) © Vhyxara · [vhyxseal.com](https://vhyxseal.com)
