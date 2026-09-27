# @vhyxseal/devtools

An in-page panel and overlay for inspecting VhyxSeal contracts while you develop.

> **Release candidate** — requires React 18 or newer and `@vhyxseal/react`.

## Install

```bash
npm install --save-dev @vhyxseal/devtools
```

## Usage

Render the panel anywhere inside your `SealProvider`:

```tsx
import { SealProvider } from "@vhyxseal/react";
import { DevToolsPanel } from "@vhyxseal/devtools";

<SealProvider config={sealConfig}>
  <App />
  <DevToolsPanel />
</SealProvider>
```

The panel only shows in development. Pass `forceVisible` to show it anyway.

Wrap a single element with `ContractOverlay` to show its contract on hover:

```tsx
import { ContractOverlay } from "@vhyxseal/devtools";

<ContractOverlay contractId="place-order">
  <Button contract={placeOrder}>Place order</Button>
</ContractOverlay>
```

## Links

- Documentation — https://vhyxseal.com
- Source — https://github.com/vhyxara/vhyxseal/tree/main/packages/devtools
- License — MIT
