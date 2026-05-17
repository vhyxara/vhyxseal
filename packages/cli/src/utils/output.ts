export const colors = {
  green:  (s: string): string => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string): string => `\x1b[33m${s}\x1b[0m`,
  red:    (s: string): string => `\x1b[31m${s}\x1b[0m`,
  blue:   (s: string): string => `\x1b[34m${s}\x1b[0m`,
  gray:   (s: string): string => `\x1b[90m${s}\x1b[0m`,
  bold:   (s: string): string => `\x1b[1m${s}\x1b[0m`,
} as const;

export const symbols = {
  pass:   "✅",
  warn:   "⚠️ ",
  fail:   "❌",
  info:   "ℹ️ ",
  bullet: "•",
} as const;

/** Print a line to stdout */
export function print(line: string): void {
  process.stdout.write(line + "\n");
}

/** Print a line to stderr */
export function printError(line: string): void {
  process.stderr.write(line + "\n");
}
