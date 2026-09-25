import React from "react";
import { CodeBlock } from "../../components/CodeBlock";

export const metadata = { title: "CLI — VhyxSeal" };

const COMMANDS: Array<{ cmd: string; what: string }> = [
  { cmd: "vhyxseal init [--domain example.com]", what: "Create vhyxseal.config.ts" },
  { cmd: "vhyxseal simulate <url>", what: "Fetch /__agent__/manifest.json the way an agent does, with version negotiation" },
  { cmd: "vhyxseal verify [--strict]", what: "Flag stale or broken contracts; --strict fails CI" },
  { cmd: "vhyxseal audit [--json]", what: "Contract coverage report" },
  { cmd: "vhyxseal diff <before.json> <after.json> [--strict]", what: "Detect changes that break agents: raised safety, new confirmation gates, removed components" },
  { cmd: "vhyxseal keygen", what: "Generate a 32-byte HMAC signing secret" },
  { cmd: "vhyxseal sign <manifest.json> [--verify]", what: "Sign in place (VHYXSEAL_SECRET) or verify an existing signature" },
  { cmd: "vhyxseal visualize <manifest.json> [-o map.vhyx]", what: "Animated VhyxChart map of your contracts and flows" },
];

const ci = `# .github/workflows/contracts.yml
- run: npx vhyxseal verify --strict
- run: npx vhyxseal diff main-manifest.json vhyxseal.manifest.json --strict
- run: npx vhyxseal sign vhyxseal.manifest.json
  env:
    VHYXSEAL_SECRET: \${{ secrets.VHYXSEAL_SECRET }}`;

export default function CliPage(): React.ReactElement {
  return (
    <div>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--docs-text)", marginBottom: 8 }}>CLI</h1>
      <p style={{ color: "var(--docs-text-muted)", marginBottom: 24 }}>
        <code>@vhyxseal/cli</code> ships a <code>vhyxseal</code> binary. Every command is also exported as a function for scripts.
      </p>
      <CodeBlock code="pnpm add -D @vhyxseal/cli" lang="bash" />
      <table style={{ width: "100%", borderCollapse: "collapse", margin: "24px 0", fontSize: 14 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--docs-border)" }}>Command</th>
            <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid var(--docs-border)" }}>What it does</th>
          </tr>
        </thead>
        <tbody>
          {COMMANDS.map((c) => (
            <tr key={c.cmd}>
              <td style={{ padding: 8, borderBottom: "1px solid var(--docs-border)", fontFamily: "var(--vhyx-font-mono, monospace)", whiteSpace: "nowrap" }}>{c.cmd}</td>
              <td style={{ padding: 8, borderBottom: "1px solid var(--docs-border)", color: "var(--docs-text-muted)" }}>{c.what}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--docs-text)", margin: "32px 0 12px" }}>In CI</h2>
      <CodeBlock code={ci} lang="yaml" />
    </div>
  );
}
