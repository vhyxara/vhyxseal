import { CodeBlock } from "../../components/CodeBlock";
import { PrevNext } from "../../components/PrevNext";

// ── Code examples ────────────────────────────────────────────────────────────

const installAll = `# Core — zero framework dependency
npm install @vhyxseal/core

# React adapter
npm install @vhyxseal/react

# Next.js integration (automatic manifest route)
npm install @vhyxseal/nextjs

# Development tools
npm install --save-dev @vhyxseal/devtools @vhyxseal/cli`;

const level0Code = `// Level 0 — no code required
// VhyxSeal infers intent from HTML semantics and ARIA
<button type="submit">Place Order</button>`;

const level1Code = `// Level 1 — one prop unlocks intent vocabulary defaults
<Button intent="place-order">Place Order</Button>`;

const level2Code = `// Level 2 — override specific fields
<Button
  intent="place-order"
  contract={{
    safetyLevel: "high",
    requiresConfirmation: true,
  }}
>
  Place Order
</Button>`;

const level3Code = `// Level 3 — complete contract, frozen and fingerprinted
import { defineContract } from '@vhyxseal/core'
import { withAgentContract, Button } from '@vhyxseal/react'

const contract = defineContract({
  id: "checkout-submit-btn",
  type: "action",
  intent: 'place-order',
  description: 'Submits the cart as a purchase order',
  requires: [
    { field: 'user.authenticated', operator: '===', value: true, description: 'User must be logged in' },
    { field: 'cart.hasItems', operator: '===', value: true, description: 'Cart must have at least one item' },
    { field: 'user.hasPaymentMethod', operator: '===', value: true, description: 'Payment method must be saved' },
  ],
  requiredPermissions: ['write:orders', 'read:payment'],
  consequence: 'charges payment method and triggers fulfillment',
  affects: ['cart', 'orders', 'payment', 'inventory'],
  reversible: true,
  reversibleWindow: 300,
  safetyLevel: 'high',
  requiresConfirmation: true,
  destructive: false,
  contractVersion: '1.0.0',
})

export const CheckoutButton = withAgentContract(Button, contract)`;

const providerCode = `// app/layout.tsx
import { SealProvider } from '@vhyxseal/react'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SealProvider
          config={{
            domain: "your-site.com",
            domainVerified: false,
            verificationToken: "",
          }}
        >
          {children}
        </SealProvider>
      </body>
    </html>
  )
}`;

const manifestExample = `// GET /__agent__/manifest.json
{
  "vhyxseal": "1.0.0",
  "schemaUrl": "https://vhyxseal.dev/schema/1.0.0",
  "domain": "your-site.com",
  "domainVerified": false,
  "verificationToken": "",
  "signature": "unsigned",
  "signedAt": "2026-05-27T10:00:00.000Z",
  "fingerprint": "vhyxs_a3f8b2c1",
  "capabilities": [],
  "components": [
    {
      "id": "checkout-submit-btn",
      "type": "action",
      "intent": "place-order",
      "description": "Submits the cart as a purchase order",
      "safetyLevel": "high",
      "requiresConfirmation": true,
      "reversible": true,
      "reversibleWindow": 300,
      "destructive": false,
      "contractVersion": "1.0.0",
      "fingerprint": "vhyxs_d4e5f6a7",
      "verifiedBy": "auto"
    }
  ],
  "relationships": [],
  "agentPolicy": {
    "allowedAgents": ["*"],
    "blockedAgents": [],
    "allowedActions": ["*"]
  },
  "generatedAt": "2026-05-27T10:00:00.000Z",
  "expiresAt": "2026-05-27T11:00:00.000Z"
}`;

const verifyCode = `# Point the CLI simulator at your running app
npx vhyxseal simulate http://localhost:3000

# Expected output:
# ✅ Manifest found at /__agent__/manifest.json
# ✅ Schema version: 1.0.0
# ✅ Components: 12 registered
# ✅ Capabilities: 3 defined
# ⚠️  4 components using inferred contracts — consider upgrading`;

// ── Styles ───────────────────────────────────────────────────────────────────

const h1Style: React.CSSProperties = {
  fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
  fontWeight: 800,
  letterSpacing: "-0.03em",
  lineHeight: 1.15,
  color: "var(--docs-text)",
  marginBottom: "8px",
  marginTop: 0,
};

const h2Style: React.CSSProperties = {
  fontSize: "1.375rem",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  color: "var(--docs-text)",
  marginBottom: "20px",
  marginTop: "56px",
  paddingTop: "40px",
  borderTop: "1px solid var(--docs-border)",
};

const h3Style: React.CSSProperties = {
  fontSize: "1rem",
  fontWeight: 700,
  color: "var(--docs-text)",
  marginBottom: "8px",
  marginTop: "32px",
};

const leadStyle: React.CSSProperties = {
  fontSize: "1.0625rem",
  color: "var(--docs-text-muted)",
  lineHeight: 1.75,
  marginBottom: "32px",
  maxWidth: "660px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: "var(--vhyxseal-color-full)",
  marginBottom: "6px",
};

const levelDescStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "var(--docs-text-muted)",
  marginTop: "8px",
  marginBottom: "24px",
  lineHeight: 1.6,
};

/**
 * Getting Started guide — five sections.
 *
 * Section 1: Requirements
 * Section 2: Installation
 * Section 3: Your First Contract (four adoption levels)
 * Section 4: Your First Manifest
 * Section 5: Verify It Works
 *
 * Zero hardcoded colors — all via --docs-* or --vhyxseal-* CSS custom properties.
 */
export default function GettingStartedPage(): React.ReactElement {
  return (
    <>
      {/* ── Section 1 — Requirements ──────────────────────────────── */}
      <section>
        <h1 style={h1Style}>Getting Started</h1>
        <p style={leadStyle}>
          VhyxSeal is a semantic contract layer for web UI. This guide walks
          you from zero to a live manifest in under three minutes.
        </p>

        <h2 style={{ ...h2Style, borderTop: "none", paddingTop: 0, marginTop: 0 }}>
          Requirements
        </h2>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
            color: "var(--docs-text)",
            marginBottom: "32px",
          }}
        >
          <tbody>
            {[
              ["Node.js", "≥ 18.0.0"],
              ["TypeScript", "≥ 5.0 (recommended)"],
              ["React", "≥ 18 (for @vhyxseal/react)"],
            ].map(([dep, version]) => (
              <tr
                key={dep}
                style={{ borderBottom: "1px solid var(--docs-border)" }}
              >
                <td
                  style={{
                    padding: "10px 0",
                    fontFamily: "monospace",
                    color: "var(--docs-text)",
                    width: "200px",
                  }}
                >
                  {dep}
                </td>
                <td
                  style={{ padding: "10px 0", color: "var(--docs-text-muted)" }}
                >
                  {version}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── Section 2 — Installation ───────────────────────────────── */}
      <section>
        <h2 style={h2Style}>Installation</h2>
        <p style={leadStyle}>
          Install only the packages you need. Start with{" "}
          <code
            style={{
              backgroundColor: "var(--docs-code-bg)",
              padding: "2px 5px",
              borderRadius: "4px",
              fontSize: "13px",
            }}
          >
            @vhyxseal/core
          </code>{" "}
          and add adapters as your project grows.
        </p>
        <CodeBlock code={installAll} lang="bash" />
      </section>

      {/* ── Section 3 — Your First Contract ───────────────────────── */}
      <section>
        <h2 style={h2Style}>Your First Contract</h2>
        <p style={leadStyle}>
          VhyxSeal has four adoption levels. Each adds more precision for agents.
          Start at Level 0 — add detail incrementally as your needs grow.
        </p>

        {/* Level 0 */}
        <h3 style={h3Style}>Level 0 — Zero Effort</h3>
        <p style={levelDescStyle}>
          Use standard HTML and ARIA. VhyxSeal infers the contract automatically.
          Agents get something useful immediately — no extra code required.
        </p>
        <p style={labelStyle}>Level 0 — Inferred</p>
        <CodeBlock code={level0Code} lang="tsx" />

        {/* Level 1 */}
        <h3 style={h3Style}>Level 1 — Single Intent Prop</h3>
        <p style={levelDescStyle}>
          Add one{" "}
          <code
            style={{
              backgroundColor: "var(--docs-code-bg)",
              padding: "2px 5px",
              borderRadius: "4px",
              fontSize: "13px",
            }}
          >
            intent
          </code>{" "}
          prop. VhyxSeal looks up the intent in its built-in vocabulary and
          fills in safety level, confirmation requirements, and reversibility
          automatically.
        </p>
        <p style={labelStyle}>Level 1 — Intent vocabulary</p>
        <CodeBlock code={level1Code} lang="tsx" />

        {/* Level 2 */}
        <h3 style={h3Style}>Level 2 — Partial Contract</h3>
        <p style={levelDescStyle}>
          Override specific fields. Everything you do not specify still comes
          from the intent vocabulary defaults. The agent gets a complete
          contract — you only wrote the parts that differ.
        </p>
        <p style={labelStyle}>Level 2 — Partial overrides</p>
        <CodeBlock code={level2Code} lang="tsx" />

        {/* Level 3 */}
        <h3 style={h3Style}>Level 3 — Full Contract</h3>
        <p style={levelDescStyle}>
          Define the complete contract once outside JSX. Frozen, fingerprinted,
          and auto-versioned. Agents get the full picture — intent, preconditions,
          consequences, safety, error recovery, and navigation hints.
        </p>
        <p style={labelStyle}>Level 3 — Full specification</p>
        <CodeBlock code={level3Code} lang="typescript" />
      </section>

      {/* ── Section 4 — Your First Manifest ───────────────────────── */}
      <section>
        <h2 style={h2Style}>Your First Manifest</h2>
        <p style={leadStyle}>
          Wrap your app in{" "}
          <code
            style={{
              backgroundColor: "var(--docs-code-bg)",
              padding: "2px 5px",
              borderRadius: "4px",
              fontSize: "13px",
            }}
          >
            SealProvider
          </code>
          . VhyxSeal collects contracts from the component tree and
          auto-generates{" "}
          <code
            style={{
              backgroundColor: "var(--docs-code-bg)",
              padding: "2px 5px",
              borderRadius: "4px",
              fontSize: "13px",
            }}
          >
            /__agent__/manifest.json
          </code>{" "}
          whenever components mount or update.
        </p>

        <CodeBlock code={providerCode} lang="tsx" filename="app/layout.tsx" />

        <p
          style={{
            fontSize: "14px",
            color: "var(--docs-text-muted)",
            marginTop: "24px",
            marginBottom: "16px",
            lineHeight: 1.7,
          }}
        >
          The manifest is generated automatically. Here is a minimal example
          with one registered contract:
        </p>

        <CodeBlock
          code={manifestExample}
          lang="json"
          filename="/__agent__/manifest.json"
        />
      </section>

      {/* ── Section 5 — Verify It Works ───────────────────────────── */}
      <section style={{ paddingBottom: "80px" }}>
        <h2 style={h2Style}>Verify It Works</h2>
        <p style={leadStyle}>
          Use the VhyxSeal CLI to simulate what an AI agent sees when it visits
          your app. Run this against your local development server.
        </p>
        <CodeBlock code={verifyCode} lang="bash" />
        <p
          style={{
            fontSize: "14px",
            color: "var(--docs-text-muted)",
            marginTop: "20px",
            lineHeight: 1.7,
            fontStyle: "italic",
          }}
        >
          Components using Level 0 (inferred) contracts show as warnings.
          Upgrade to Level 1–3 to eliminate them.
        </p>
      </section>
      <PrevNext />
    </>
  );
}
