# @vhyxseal/nextjs

Next.js integration for VhyxSeal. Serves your contract manifest at
`/__agent__/manifest.json` with the right caching and version headers.

> **Release candidate** — requires Next.js 13 or newer.

## Install

```bash
npm install @vhyxseal/nextjs @vhyxseal/core
```

## Usage

```ts
// next.config.ts
import { vhyxsealPlugin } from "@vhyxseal/nextjs";

export default vhyxsealPlugin({
  // your existing Next.js config
});
```

```ts
// app/api/vhyxseal-manifest/route.ts
import { handleManifestRoute } from "@vhyxseal/nextjs";
import { contracts } from "@/lib/contracts";

export function GET(request: Request) {
  const result = handleManifestRoute(request, { domain: "example.com", contracts });
  return new Response(result.body, { status: result.status, headers: result.headers });
}
```

The plugin rewrites `/__agent__/manifest.json` to that route and adds the
response headers agents expect.

## What's included

- `vhyxsealPlugin` — wraps `next.config`
- `handleManifestRoute` — version negotiation and response building
- `getSealManifest` — generate a manifest in server code

## Links

- Documentation — https://vhyxseal.com
- Source — https://github.com/vhyxara/vhyxseal/tree/main/packages/nextjs
- License — MIT
