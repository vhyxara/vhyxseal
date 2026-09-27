# @vhyxseal/vue

Vue 3 adapter for VhyxSeal: a plugin, composables and contract-aware components.

> **Release candidate** — requires Vue 3.3 or newer.

## Install

```bash
npm install @vhyxseal/vue @vhyxseal/core
```

## Usage

```ts
// main.ts
import { createApp } from "vue";
import { VhyxSealPlugin } from "@vhyxseal/vue";
import App from "./App.vue";

createApp(App)
  .use(VhyxSealPlugin, {
    config: { domain: "example.com", domainVerified: false, verificationToken: "" },
  })
  .mount("#app");
```

```vue
<script setup lang="ts">
import { Button } from "@vhyxseal/vue";
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
</script>

<template>
  <Button :contract="placeOrder" @click="submitOrder">Place order</Button>
</template>
```

Read registered contracts anywhere with `useContract("place-order")`.

## What's included

- `VhyxSealPlugin`
- Composables — `useSeal`, `useContract`, `useCapability`, `useAgentAction`
- Components — `Button`, `Input`, `Form`, `Nav`, `Display`, `Confirmation`

## Links

- Documentation — https://vhyxseal.com
- Source — https://github.com/vhyxara/vhyxseal/tree/main/packages/vue
- License — MIT
