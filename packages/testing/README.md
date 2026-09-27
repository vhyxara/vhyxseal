# @vhyxseal/testing

Test utilities for VhyxSeal contracts. Works with Vitest and Jest.

> **Release candidate**

## Install

```bash
npm install --save-dev @vhyxseal/testing
```

## Matchers

```ts
import { expect } from "vitest";
import { vhyxSealMatchers } from "@vhyxseal/testing";

expect.extend(vhyxSealMatchers);

expect(placeOrder).toHaveValidContract();
expect(placeOrder).toHaveIntent("place-order");
expect(placeOrder).toBeAgentSafe();
```

## Other helpers

- `verifyContracts(contracts, { stalenessThresholdDays })` — health report for a set of contracts
- `detectDrift()` / `isDriftWarning()` — spot contracts that no longer match the UI
- `mockAgentSession(manifest)` — simulate an agent acting on your manifest and flag unsafe actions

## Links

- Documentation — https://vhyxseal.com
- Source — https://github.com/vhyxara/vhyxseal/tree/main/packages/testing
- License — MIT
