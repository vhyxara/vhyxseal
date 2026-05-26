# Contributing to VhyxSeal

## Development Setup

Prerequisites: Node.js >= 18, pnpm >= 8

```bash
git clone https://github.com/vhyxara/vhyxseal
cd vhyxseal
pnpm install
```

## Running Tests

All packages:

```bash
pnpm test
```

Single package:

```bash
cd packages/core && pnpm test
```

TypeScript check:

```bash
pnpm typecheck
```

## Commit Format

```
type(scope): description
```

Types: feat, fix, docs, test, refactor, chore  
Scope: core, react, vue, vanilla, nextjs, devtools, cli,
testing, style, extension

Examples:

```
feat(core): add intent vocabulary extension API
fix(react): resolve useEffect dependency in SealProvider
docs(nextjs): update manifest route configuration guide
```

## Pull Request Requirements

- All tests pass: `pnpm test`
- TypeScript clean: `pnpm typecheck`
- No new runtime dependencies without prior discussion in Issues
- New behavior requires new tests
- Breaking changes require RFC or issue discussion first

## Proposing Schema Changes

VhyxSeal's contract schema is a versioning commitment.
Changes follow a deliberate process:

1. Open an issue using the Contract Schema Feedback template
2. Community discussion — minimum 7 days
3. RFC update if accepted
4. Implementation with migration notes

## Code of Conduct

See CODE_OF_CONDUCT.md. Enforcement: conduct@vhyxara.com
