# @vhyxseal/cli

Command-line tools for VhyxSeal contracts and manifests.

> **Release candidate**

## Install

```bash
npm install --save-dev @vhyxseal/cli
# or run without installing
npx @vhyxseal/cli --help
```

## Commands

```text
vhyxseal init [--domain example.com] [--force]      create vhyxseal.config.ts
vhyxseal simulate <url> [--agent-version 1.0.0]     fetch a manifest as an agent sees it
vhyxseal verify [--path .] [--strict]               check contracts for drift and staleness
vhyxseal audit [--path .] [--json]                  contract coverage report
vhyxseal diff <before.json> <after.json> [--json] [--strict]
                                                    detect changes that break agents
vhyxseal keygen                                     generate a 32-byte signing secret
vhyxseal sign <manifest.json> [--secret hex] [--verify]
                                                    HMAC-SHA256 sign or verify a manifest
vhyxseal visualize <manifest.json> [-o out.vhyx] [--direction LR|TB]
                                                    animated diagram of your contracts
```

`diff` flags changes that would break existing agents — for example a raised
safety level, a new confirmation gate or a removed component. Add `--strict` to
exit non-zero when any are found, so it can guard CI.

## Programmatic use

Every command is also exported as a function:

```ts
import { diffManifests, manifestToVhyxChart } from "@vhyxseal/cli";
```

## Links

- Documentation — https://vhyxseal.com
- Source — https://github.com/vhyxara/vhyxseal/tree/main/packages/cli
- License — MIT
