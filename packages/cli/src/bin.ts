#!/usr/bin/env node
/**
 * `vhyxseal` executable. Parses argv and dispatches to command functions.
 * Kept separate from index.ts so importing the library never runs the CLI.
 */
import { init } from "./commands/init.js";
import { simulate } from "./commands/simulate.js";
import { verify } from "./commands/verify.js";
import { audit } from "./commands/audit.js";
import { diff } from "./commands/diff.js";
import { keygen } from "./commands/keygen.js";
import { sign } from "./commands/sign.js";
import { visualize } from "./commands/visualize.js";
import { colors, print, printError } from "./utils/output.js";

/** Parsed command line. */
export interface ParsedArgs {
  command: string | undefined;
  positionals: string[];
  flags: Record<string, string | true>;
}

/**
 * Minimal argv parser: `--flag`, `--key value`, `--key=value`, `-o value`.
 * @param argv - Arguments after the executable name.
 * @returns Command, positionals, and flags.
 * @example
 * parseArgs(["diff", "a.json", "b.json", "--json"])
 */
export function parseArgs(argv: readonly string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags: Record<string, string | true> = {};
  const valueFlags = new Set(["domain", "out", "o", "secret", "path", "agent-version", "direction"]);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] ?? "";
    if (arg.startsWith("--") || (arg.startsWith("-") && arg.length === 2)) {
      const body = arg.replace(/^--?/, "");
      const eq = body.indexOf("=");
      if (eq >= 0) {
        flags[body.slice(0, eq)] = body.slice(eq + 1);
      } else if (valueFlags.has(body) && i + 1 < argv.length) {
        flags[body] = argv[++i] ?? "";
      } else {
        flags[body] = true;
      }
    } else {
      positionals.push(arg);
    }
  }
  const [command, ...rest] = positionals;
  return { command, positionals: rest, flags };
}

const HELP = `${colors.bold("vhyxseal")} — seal the contract between your UI and the agentic web

Usage: vhyxseal <command> [options]

  init [--domain example.com] [--force]      create vhyxseal.config.ts
  simulate <url> [--agent-version 1.0.0]     fetch a manifest as an agent sees it
  verify [--path .] [--strict]               check contracts for drift and staleness
  audit [--path .] [--json]                  contract coverage report
  diff <before.json> <after.json> [--json]   detect changes that break agents
  keygen                                     generate a 32-byte signing secret
  sign <manifest.json> [--secret hex] [--verify]
                                             HMAC-SHA256 sign or verify a manifest
  visualize <manifest.json> [-o out.vhyx] [--direction LR|TB]
                                             animated VhyxChart diagram of your contracts
`;

function str(flags: ParsedArgs["flags"], ...names: string[]): string | undefined {
  for (const n of names) {
    const v = flags[n];
    if (typeof v === "string") return v;
  }
  return undefined;
}

/**
 * Runs the CLI and returns a process exit code.
 * @param argv - Arguments after the executable name.
 * @returns 0 on success, 1 on failure.
 * @example
 * process.exitCode = await run(process.argv.slice(2));
 */
export async function run(argv: readonly string[]): Promise<number> {
  const { command, positionals, flags } = parseArgs(argv);
  const need = (n: number, usage: string): boolean => {
    if (positionals.length >= n) return true;
    printError(colors.red(`Usage: vhyxseal ${usage}`));
    return false;
  };
  try {
    switch (command) {
      case "init": {
        const domain = str(flags, "domain");
        await init({ ...(domain !== undefined ? { domain } : {}), force: flags["force"] === true });
        return 0;
      }
      case "simulate": {
        if (!need(1, "simulate <url>")) return 1;
        const agentVersion = str(flags, "agent-version");
        const r = await simulate({ url: positionals[0] ?? "", ...(agentVersion !== undefined ? { agentVersion } : {}) });
        return r.success ? 0 : 1;
      }
      case "verify": {
        const projectPath = str(flags, "path");
        const r = await verify({ ...(projectPath !== undefined ? { projectPath } : {}), strict: flags["strict"] === true });
        return r.blockedByCi ? 1 : 0;
      }
      case "audit": {
        const projectPath = str(flags, "path");
        await audit({ ...(projectPath !== undefined ? { projectPath } : {}), json: flags["json"] === true });
        return 0;
      }
      case "diff": {
        if (!need(2, "diff <before.json> <after.json>")) return 1;
        const r = await diff({ before: positionals[0] ?? "", after: positionals[1] ?? "", json: flags["json"] === true });
        return r.breaking > 0 && flags["strict"] === true ? 1 : 0;
      }
      case "keygen":
        await keygen();
        return 0;
      case "sign": {
        if (!need(1, "sign <manifest.json>")) return 1;
        const secret = str(flags, "secret");
        const r = await sign({ file: positionals[0] ?? "", ...(secret !== undefined ? { secret } : {}), verifyOnly: flags["verify"] === true });
        return r.ok ? 0 : 1;
      }
      case "visualize": {
        if (!need(1, "visualize <manifest.json>")) return 1;
        const out = str(flags, "out", "o");
        const direction = str(flags, "direction") === "TB" ? "TB" : "LR";
        await visualize({ file: positionals[0] ?? "", direction, ...(out !== undefined ? { out } : {}) });
        return 0;
      }
      case undefined:
      case "help":
      case "--help":
        print(HELP);
        return 0;
      default:
        printError(colors.red(`Unknown command "${command}"`));
        print(HELP);
        return 1;
    }
  } catch (err) {
    printError(colors.red(err instanceof Error ? err.message : String(err)));
    return 1;
  }
}

// Only execute when invoked as a script, not when imported by tests.
const invokedDirectly =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  typeof process.argv[1] === "string" &&
  /vhyxseal(\.js)?$|bin\.js$/.test(process.argv[1]);

if (invokedDirectly) {
  void run(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
