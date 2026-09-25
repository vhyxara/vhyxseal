import { readFileSync } from "node:fs";
import type { ComponentContract, SafetyLevel, VhyxSealManifest } from "@vhyxseal/core";
import { colors, symbols, print } from "../utils/output.js";

/** A single change between two manifest versions. */
export interface ManifestChange {
  /** Component or capability id the change applies to. */
  id: string;
  /** What kind of change happened. */
  kind: "added" | "removed" | "changed";
  /** Field names that changed (empty for added/removed). */
  fields: string[];
  /** True when agents relying on the previous behaviour must update. */
  breakingForAgents: boolean;
  /** Human readable explanation. */
  message: string;
}

/** Result of diffing two manifests. */
export interface DiffResult {
  changes: ManifestChange[];
  breaking: number;
  capabilitiesAdded: string[];
  capabilitiesRemoved: string[];
}

/** Options for the diff command. */
export interface DiffOptions {
  /** Path to the previous manifest JSON. */
  before: string;
  /** Path to the next manifest JSON. */
  after: string;
  /** Print JSON instead of human output. */
  json?: boolean;
  /** Suppress printing (programmatic use). */
  silent?: boolean;
}

const SAFETY_RANK: Readonly<Record<SafetyLevel, number>> = {
  low: 0,
  medium: 1,
  high: 2,
  sensitive: 3,
  critical: 4,
};

const COMPARED_FIELDS: ReadonlyArray<keyof ComponentContract> = [
  "type",
  "intent",
  "safetyLevel",
  "requiresConfirmation",
  "destructive",
  "reversible",
  "requires",
  "requiredPermissions",
  "affects",
  "consequence",
  "contractVersion",
];

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Explains why a field change breaks agents, or returns null when it does not.
 * A change is breaking when an agent that learned the old contract would now
 * act unsafely or fail: stricter safety, new confirmation gates, new
 * destructiveness, lost reversibility, new preconditions or permissions,
 * or a changed intent/type.
 */
function breakingReason(field: keyof ComponentContract, before: ComponentContract, after: ComponentContract): string | null {
  switch (field) {
    case "safetyLevel":
      return SAFETY_RANK[after.safetyLevel] > SAFETY_RANK[before.safetyLevel]
        ? `safetyLevel raised ${before.safetyLevel} → ${after.safetyLevel}`
        : null;
    case "requiresConfirmation":
      return after.requiresConfirmation && !before.requiresConfirmation ? "now requires human confirmation" : null;
    case "destructive":
      return after.destructive && !before.destructive ? "now destructive" : null;
    case "reversible":
      return !after.reversible && before.reversible ? "no longer reversible" : null;
    case "requires":
      return after.requires.length > before.requires.length ? "new preconditions added" : null;
    case "requiredPermissions":
      return after.requiredPermissions.some((p) => !before.requiredPermissions.includes(p))
        ? "new permissions required"
        : null;
    case "intent":
      return `intent changed ${before.intent} → ${after.intent}`;
    case "type":
      return `type changed ${before.type} → ${after.type}`;
    default:
      return null;
  }
}

/**
 * Pure diff of two manifests — no I/O.
 * @param before - Previous manifest.
 * @param after - Next manifest.
 * @returns Structured list of changes with breaking-for-agents classification.
 * @example
 * const result = diffManifests(v1, v2);
 * if (result.breaking > 0) process.exit(1);
 */
export function diffManifests(before: VhyxSealManifest, after: VhyxSealManifest): DiffResult {
  const prev = new Map(before.components.map((c) => [c.id, c]));
  const next = new Map(after.components.map((c) => [c.id, c]));
  const changes: ManifestChange[] = [];

  for (const [id, contract] of next) {
    const old = prev.get(id);
    if (old === undefined) {
      changes.push({ id, kind: "added", fields: [], breakingForAgents: false, message: `added (${contract.intent}, ${contract.safetyLevel})` });
      continue;
    }
    const fields = COMPARED_FIELDS.filter((f) => !same(old[f], contract[f]));
    if (fields.length === 0) continue;
    const reasons = fields.map((f) => breakingReason(f, old, contract)).filter((r): r is string => r !== null);
    changes.push({
      id,
      kind: "changed",
      fields: fields.map(String),
      breakingForAgents: reasons.length > 0,
      message: reasons.length > 0 ? reasons.join("; ") : `changed: ${fields.join(", ")}`,
    });
  }
  for (const [id, contract] of prev) {
    if (!next.has(id)) {
      changes.push({ id, kind: "removed", fields: [], breakingForAgents: true, message: `removed (${contract.intent})` });
    }
  }

  const prevCaps = new Set(before.capabilities.map((c) => c.id));
  const nextCaps = new Set(after.capabilities.map((c) => c.id));
  const capabilitiesAdded = [...nextCaps].filter((c) => !prevCaps.has(c));
  const capabilitiesRemoved = [...prevCaps].filter((c) => !nextCaps.has(c));

  return {
    changes,
    breaking: changes.filter((c) => c.breakingForAgents).length + capabilitiesRemoved.length,
    capabilitiesAdded,
    capabilitiesRemoved,
  };
}

function readManifest(path: string): VhyxSealManifest {
  // JSON.parse returns `any`; the CLI trusts the file shape the same way
  // `verify` and `audit` do and reports parse failures to the user.
  return JSON.parse(readFileSync(path, "utf8")) as VhyxSealManifest;
}

/**
 * CLI entry: diffs two manifest files and prints a structured report.
 * @param options - Paths and output mode.
 * @returns DiffResult for programmatic use.
 * @example
 * await diff({ before: "manifest.v1.json", after: "manifest.v2.json" });
 */
export async function diff(options: DiffOptions): Promise<DiffResult> {
  const result = diffManifests(readManifest(options.before), readManifest(options.after));
  if (options.silent) return result;
  if (options.json) {
    print(JSON.stringify(result, null, 2));
    return result;
  }
  print(colors.bold(`VhyxSeal manifest diff`));
  print(colors.gray(`${options.before} → ${options.after}`));
  if (result.changes.length === 0 && result.capabilitiesAdded.length === 0 && result.capabilitiesRemoved.length === 0) {
    print(colors.green(`${symbols.pass} No contract changes`));
    return result;
  }
  for (const c of result.changes) {
    const symbol = c.breakingForAgents ? symbols.fail : c.kind === "added" ? symbols.pass : symbols.warn;
    const paint = c.breakingForAgents ? colors.red : c.kind === "added" ? colors.green : colors.yellow;
    print(paint(`${symbol} ${c.id} — ${c.message}`));
  }
  for (const cap of result.capabilitiesAdded) print(colors.green(`${symbols.pass} capability ${cap} added`));
  for (const cap of result.capabilitiesRemoved) print(colors.red(`${symbols.fail} capability ${cap} removed`));
  print(
    result.breaking > 0
      ? colors.red(`${result.breaking} change(s) break existing agents — bump contractVersion and add a changelog entry`)
      : colors.green(`No breaking changes for agents`),
  );
  return result;
}
