# @vhyxseal/vanilla

Framework-free VhyxSeal custom elements. Use them in plain HTML or any framework.

> **Release candidate**

## Install

```bash
npm install @vhyxseal/vanilla @vhyxseal/core
```

## Usage

```ts
import { defineVhyxSealElements, type SealButton } from "@vhyxseal/vanilla";
import { defineContract } from "@vhyxseal/core";

defineVhyxSealElements(); // registers <seal-button>, <seal-input>, <seal-form>,
                          // <seal-nav>, <seal-display>, <seal-confirmation>

const button = document.querySelector<SealButton>("seal-button")!;
button.contract = defineContract({
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
```

```html
<seal-button>Place order</seal-button>
```

Elements register their contract when connected and unregister when removed.

## Server-side rendering

Importing this package on the server (Next.js, Nuxt, Astro, …) is safe:
`defineVhyxSealElements()` does nothing where `customElements` is unavailable.
Call it again in the browser.

## Links

- Documentation — https://vhyxseal.dev
- Source — https://github.com/vhyxara/vhyxseal/tree/main/packages/vanilla
- License — MIT
