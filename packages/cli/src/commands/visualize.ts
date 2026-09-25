import { readFileSync, writeFileSync } from "node:fs";
import type { VhyxSealManifest } from "@vhyxseal/core";
import { manifestToVhyxChart } from "../visualize/index.js";
import { colors, symbols, print } from "../utils/output.js";

export { manifestToVhyxChart };

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
