# @vhyxseal/style

Minimal CSS design token package for VhyxSeal tooling.

> **Alpha:** tokens may change before 1.0.

Provides the CSS custom properties used by VhyxSeal DevTools and CLI
output. Not a full design system. Not a component library. Just the tokens.

---

## Installation

```bash
npm install @vhyxseal/style
```

---

## Usage

Import all tokens (recommended):

```css
@import '@vhyxseal/style';
```

Import color tokens only:

```css
@import '@vhyxseal/style/colors';
```

Import safety level tokens only (imports colors automatically):

```css
@import '@vhyxseal/style/safety';
```

---

## Token Reference

### Color Tokens (`--vhyxseal-color-*`)

| Token | Value | Usage |
|---|---|---|
| `--vhyxseal-color-full` | `#22c55e` | Full contract — verified |
| `--vhyxseal-color-inferred` | `#eab308` | Inferred contract — review needed |
| `--vhyxseal-color-missing` | `#ef4444` | Missing contract / error state |
| `--vhyxseal-color-neutral` | `#6b7280` | Neutral / disabled / muted |
| `--vhyxseal-color-info` | `#3b82f6` | Informational / agent activity |
| `--vhyxseal-color-bg` | `#111827` | Panel outer background |
| `--vhyxseal-color-surface` | `#1f2937` | Header and section backgrounds |
| `--vhyxseal-color-border` | `#374151` | Panel border and section dividers |
| `--vhyxseal-color-text` | `#f9fafb` | Primary text |
| `--vhyxseal-color-text-muted` | `#6b7280` | Secondary / muted text |

### Safety Level Tokens (`--vhyxseal-safety-*`)

Maps `SafetyLevel` values to display colors. Matches the `safetyColor()` function in `@vhyxseal/devtools`.

| Token | Color | Hex | Meaning |
|---|---|---|---|
| `--vhyxseal-safety-low` | Gray | `#6b7280` | Agent can proceed freely |
| `--vhyxseal-safety-medium` | Blue | `#3b82f6` | Proceed with care |
| `--vhyxseal-safety-high` | Yellow | `#eab308` | Confirm with human |
| `--vhyxseal-safety-critical` | Red | `#ef4444` | Always require human confirmation |
| `--vhyxseal-safety-sensitive` | Red | `#ef4444` | Extra protections — same urgency as critical |

---

## Color Language

These colors are consistent across all VhyxSeal tooling (DevTools panel, CLI output):

- 🟢 **Green** (`#22c55e`) — healthy, complete, verified contract
- 🟡 **Yellow** (`#eab308`) — inferred contract, needs review, high-safety warning
- 🔴 **Red** (`#ef4444`) — broken, stale, critical-safety, error
- 🔵 **Blue** (`#3b82f6`) — informational, agent activity, medium-safety
- ⚫ **Gray** (`#6b7280`) — disabled, inactive, metadata, low-safety

---

## Example: Using Tokens in DevTools

```css
@import '@vhyxseal/style';

.contract-panel {
  background-color: var(--vhyxseal-color-bg);
  border: 1px solid var(--vhyxseal-color-border);
  color: var(--vhyxseal-color-text);
}

.contract-status--full {
  color: var(--vhyxseal-color-full);
}

.contract-status--inferred {
  color: var(--vhyxseal-color-inferred);
}

.safety-badge {
  color: var(--vhyxseal-safety-high);
}
```

---

## What This Is Not

- Not a CSS framework
- Not a component library
- Not a replacement for your design system
- Not styled components

It is the minimal token surface used internally by VhyxSeal tooling,
made available for developers who want their own tooling to match the
VhyxSeal visual language.

---

## Parent Package

Part of the [VhyxSeal](https://vhyxseal.dev) ecosystem by [Vhyxara](https://vhyxara.com).
