# VhyxSeal DevTools Chrome Extension

Inspect VhyxSeal semantic contracts on any page.

## Installation (Developer Mode)

1. Open Chrome → chrome://extensions
2. Enable Developer Mode
3. Click "Load unpacked"
4. Select packages/extension/

## What it shows

- Contract coverage summary (full / inferred / total)
- Manifest fingerprint and generation time
- Agent policy (allowed agents, access level)

## Requirements

The page must have @vhyxseal/nextjs configured and
vhyxsealPlugin() added to next.config.ts.
The manifest endpoint must be accessible at
/__agent__/manifest.json on the page's domain.

## Alpha

This extension is alpha software.
The manifest format may change before 1.0.
