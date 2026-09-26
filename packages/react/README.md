# @vhyxseal/react

React adapter for VhyxSeal. Wrap your app in `SealProvider`, attach contracts to
components, and VhyxSeal keeps an up-to-date manifest that AI agents can read.

> **Release candidate** — requires React 18 or newer.

## Install

```bash
npm install @vhyxseal/react @vhyxseal/core
```

## Usage

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

export function App() {
  return (
    <SealProvider config={{ domain: "example.com", domainVerified: false, verificationToken: "" }}>
      <Button contract={placeOrder} onClick={submitOrder}>
        Place order
      </Button>
    </SealProvider>
  );
}
```

Already have your own components? Wrap them instead:

```tsx
import { withAgentContract } from "@vhyxseal/react";

const SealedCheckoutButton = withAgentContract(CheckoutButton, placeOrder);
```

## What's included

- `SealProvider`, `useSealContext`
- `withAgentContract` — refs are forwarded
- Hooks — `useContract`, `useCapability`, `useAgentAction`
- Headless components — `Button`, `Input`, `Form`, `Nav`, `Display`, `Confirmation`

## Links

- Documentation — https://vhyxseal.dev
- Source — https://github.com/vhyxara/vhyxseal/tree/main/packages/react
- License — MIT
