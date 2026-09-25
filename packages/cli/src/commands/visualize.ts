import { readFileSync, writeFileSync } from "node:fs";
import type {
  ComponentContract,
  ComponentType,
  Relationship,
  SafetyLevel,
  SequenceRelationship,
  VhyxSealManifest,
} from "@vhyxseal/core";
import { colors, symbols, print } from "../utils/output.js";

/** Options for turning a manifest into an animated VhyxChart diagram. */
export interface VisualizeOptions {
  /** Manifest JSON path. */
  file: string;
  /** Output `.vhyx` path. When omitted the diagram is printed to stdout. */
  out?: string;
  /** Layout direction. @default "LR" */
  direction?: "LR" | "TB";
  /** Suppress printing (programmatic use). */
  silent?: boolean;
}

/**
 * Safety level → VhyxChart built-in class.
 * Follows the Vhyxara colour language (spec §18): low is healthy green,
 * medium informational blue, high needs review yellow, critical red,
 * sensitive purple (capability/special handling).
 */
const SAFETY_CLASS: Readonly<Record<SafetyLevel, string>> = {
  low: "success",
  medium: "info",
  high: "warn",
  critical: "danger",
  sensitive: "accent",
};

function safeId(id: string): string {
  const cleaned = id.replace(/[^A-Za-z0-9_]/g, "_");
  return /^[A-Za-z_]/.test(cleaned) ? cleaned : `c_${cleaned}`;
}

function quote(text: string): string {
  return text.replace(/["\n\r[\]{}()|]/g, " ").replace(/\s+/g, " ").trim();
}

function nodeShape(type: ComponentType, label: string): string {
  switch (type) {
    case "input":
      return `[/${label}/]`;
    case "navigation":
      return `([${label}])`;
    case "display":
      return `(${label})`;
    case "confirmation":
      return `{${label}}`;
    case "action":
    default:
      return `[${label}]`;
  }
}

function nodeLine(c: ComponentContract): string {
  const label = `${quote(c.intent)}<br/>${c.safetyLevel}${c.requiresConfirmation ? " · confirm" : ""}`;
  return `  ${safeId(c.id)}${nodeShape(c.type, label)}:::${SAFETY_CLASS[c.safetyLevel]}`;
}

function relationshipLines(r: Relationship): string[] {
  switch (r.type) {
    case "composition":
      return r.children.map((child) => `  ${safeId(r.parent)} --- ${safeId(child)}`);
    case "dependency":
      return [`  ${safeId(r.source)} -.->|${r.effect}| ${safeId(r.target)}`];
    case "sequence": {
      const lines: string[] = [];
      const ordered = [...r.steps].sort((a, b) => a.order - b.order);
      for (const step of ordered) {
        if (step.onComplete && step.onComplete !== step.componentId) {
          lines.push(`  ${safeId(step.componentId)} -->|ok| ${safeId(step.onComplete)}`);
        }
        if (step.onFail && step.onFail !== step.componentId && step.onFail !== step.onComplete) {
          lines.push(`  ${safeId(step.componentId)} -.->|fail| ${safeId(step.onFail)}`);
        }
      }
      return lines;
    }
    default:
      return [];
  }
}

function scenarioFor(seq: SequenceRelationship, byId: ReadonlyMap<string, ComponentContract>): string[] {
  const lines = [`scenario ${quote(seq.description || seq.id)}`];
  const ordered = [...seq.steps].sort((a, b) => a.order - b.order);
  for (const step of ordered) {
    const id = safeId(step.componentId);
    const contract = byId.get(step.componentId);
    lines.push(`  ${id} is active`);
    if (contract?.requiresConfirmation) {
      lines.push(`  note ${id} : human confirmation required`);
      lines.push(`  wait 600ms`);
    }
    if (step.onComplete && step.onComplete !== step.componentId) {
      lines.push(`  ${id} -> ${safeId(step.onComplete)} : ok`);
    }
    lines.push(`  ${id} is done`);
  }
  return lines;
}

/**
 * Converts a VhyxSeal manifest into VhyxChart source: every component becomes a
 * node coloured by safety level, relationships become edges, capabilities
 * become groups, and each sequence relationship becomes a playable scenario.
 *
 * Pure function — no I/O. The output is plain text so this package keeps
 * zero dependency on VhyxChart.
 *
 * @param manifest - The manifest to visualise.
 * @param direction - Layout direction.
 * @returns VhyxChart diagram source.
 * @example
 * const source = manifestToVhyxChart(manifest);
 * // render with @vhyxchart/core: render(parse(source))
 */
export function manifestToVhyxChart(manifest: VhyxSealManifest, direction: "LR" | "TB" = "LR"): string {
  const byId = new Map(manifest.components.map((c) => [c.id, c]));
  const out: string[] = [
    "---",
    `title: ${quote(manifest.domain)} — agent contract map`,
    "---",
    `flowchart ${direction}`,
  ];

  const grouped = new Set<string>();
  for (const cap of manifest.capabilities) {
    const members = new Set<string>([cap.entryPoint, ...cap.exitPoints.map((e) => e.componentId)]);
    for (const ref of cap.relationships) {
      const r = ref.ref;
      if (r.type === "sequence") r.steps.forEach((s) => members.add(s.componentId));
      if (r.type === "composition") [r.parent, ...r.children].forEach((m) => members.add(m));
      if (r.type === "dependency") [r.source, r.target].forEach((m) => members.add(m));
    }
    const present = [...members].filter((m) => byId.has(m) && !grouped.has(m));
    if (present.length === 0) continue;
    out.push(`  subgraph ${safeId(`cap_${cap.id}`)} [${quote(cap.id)} · ${cap.safetyLevel}]`);
    for (const m of present) {
      const c = byId.get(m);
      if (c !== undefined) out.push(`  ${nodeLine(c)}`);
      grouped.add(m);
    }
    out.push("  end");
  }
  for (const c of manifest.components) {
    if (!grouped.has(c.id)) out.push(nodeLine(c));
  }
  for (const r of manifest.relationships) out.push(...relationshipLines(r));

  for (const r of manifest.relationships) {
    if (r.type === "sequence") out.push("", ...scenarioFor(r, byId));
  }
  return out.join("\n") + "\n";
}

/**
 * CLI entry: reads a manifest file and writes (or prints) the diagram.
 * @param options - Input/output paths.
 * @returns The generated VhyxChart source.
 * @example
 * await visualize({ file: "manifest.json", out: "contracts.vhyx" });
 */
export async function visualize(options: VisualizeOptions): Promise<string> {
  // Manifest JSON is produced by VhyxSeal tooling; shape trusted like `verify`.
  const manifest = JSON.parse(readFileSync(options.file, "utf8")) as VhyxSealManifest;
  const source = manifestToVhyxChart(manifest, options.direction ?? "LR");
  if (options.out !== undefined) {
    writeFileSync(options.out, source);
    if (!options.silent) {
      print(colors.green(`${symbols.pass} Wrote ${options.out}`));
      print(colors.gray("Preview it in VS Code (VhyxChart extension) or: npx vhyxchart render " + options.out));
    }
  } else if (!options.silent) {
    print(source);
  }
  return source;
}
