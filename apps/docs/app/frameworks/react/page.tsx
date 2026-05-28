import { CodeBlock } from "../../../components/CodeBlock";
import { OnThisPage } from "../../../components/OnThisPage";
import { PrevNext } from "../../../components/PrevNext";

// ── Code examples ─────────────────────────────────────────────────────────

const installCode = `npm install @vhyxseal/react @vhyxseal/core`;

const providerSetupCode = `// app/layout.tsx — wrap your application
import { SealProvider } from '@vhyxseal/react'
import type { ManifestConfig } from '@vhyxseal/core'

const config: ManifestConfig = {
  domain: "example.com",
  domainVerified: false,
  verificationToken: "",
  // Optional — all have defaults
  agentPolicy: {
    allowedAgents: ["*"],
    requiresConfirmation: ["place-order", "delete-account"],
  },
  cacheDurationSeconds: 3600,
  schemaVersion: "1.0.0",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SealProvider
          config={config}
          onManifestGenerated={(manifest) => {
            console.log('[VhyxSeal] Manifest updated:', manifest.fingerprint)
          }}
        >
          {children}
        </SealProvider>
      </body>
    </html>
  )
}`;

const withAgentContractCode = `// HOC — wrap any existing component
import { withAgentContract } from '@vhyxseal/react'
import { defineContract } from '@vhyxseal/core'

const contract = defineContract({
  id: "checkout-submit-btn",
  type: "action",
  intent: "place-order",
  description: "Submits the cart as a purchase order",
  requires: [
    { field: "user.authenticated", operator: "===", value: true, description: "Must be logged in" },
    { field: "cart.hasItems", operator: "===", value: true, description: "Cart must have items" },
    { field: "user.hasPaymentMethod", operator: "===", value: true, description: "Payment method required" },
  ],
  requiredPermissions: ["write:orders"],
  consequence: "Creates order, charges payment method, triggers fulfillment",
  affects: ["cart", "orders", "payment", "inventory"],
  reversible: true,
  reversibleWindow: 300,
  safetyLevel: "high",
  requiresConfirmation: true,
  destructive: false,
  contractVersion: "1.0.0",
})

// Wrap any existing component without modifying it
export const CheckoutButton = withAgentContract(
  ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>
      Place Order
    </button>
  ),
  contract,
)`;

const componentCode = `// VhyxSeal components — drop-in replacements with contract support
import { Button, Input, Form, Nav, Display, Confirmation } from '@vhyxseal/react'
import { defineContract } from '@vhyxseal/core'

const searchContract = defineContract({
  id: "site-search-input",
  type: "input",
  intent: "search",
  description: "Search across all site content",
  requires: [],
  requiredPermissions: [],
  consequence: "Filters visible content to match query",
  affects: ["search-results"],
  reversible: true,
  safetyLevel: "low",
  requiresConfirmation: false,
  destructive: false,
  contractVersion: "1.0.0",
})

export function SearchBar() {
  return (
    <Input
      contract={searchContract}
      placeholder="Search..."
      onChange={(e) => performSearch(e.target.value)}
    />
  )
}`;

const hooksCode = `import { useContract, useCapability, useAgentAction } from '@vhyxseal/react'

// useContract — read a registered contract by id
function ContractDebugger({ id }: { id: string }) {
  const contract = useContract(id)
  return <pre>{JSON.stringify(contract, null, 2)}</pre>
}

// useCapability — read the full capability map
function ManifestStats() {
  const capability = useCapability()
  return (
    <div>
      <p>Total contracts: {capability.counts.total}</p>
      <p>Full: {capability.counts.full}</p>
      <p>Inferred: {capability.counts.inferred}</p>
    </div>
  )
}

// useAgentAction — track agent action lifecycle (standalone, no provider needed)
function ActionTracker() {
  const { record, initiate, complete, cancel } = useAgentAction()
  return (
    <button onClick={() => {
      initiate("checkout-submit-btn", "place-order")
      // ... perform action ...
      complete()
    }}>
      Place Order
    </button>
  )
}`;

const typesCode = `// Key TypeScript types exported from @vhyxseal/react
import type {
  SealProviderProps,    // Props for <SealProvider />
  SealContextValue,     // Value of SealContext — accessed via hooks
  ButtonProps,          // Props for <Button />
  InputProps,           // Props for <Input />
  FormProps,            // Props for <Form />
  NavProps,             // Props for <Nav />
  DisplayProps,         // Props for <Display />
  ConfirmationProps,    // Props for <Confirmation />
  ConfirmationState,    // State passed to Confirmation render prop
  CapabilityMap,        // Return type of useCapability()
  AgentActionStatus,    // "idle" | "initiated" | "confirmed" | "completed" | "failed" | "cancelled"
  AgentActionRecord,    // Full record with timestamps and metadata
  UseAgentActionReturn, // Return type of useAgentAction()
} from '@vhyxseal/react'`;

const example1Code = `// Example 1 — Checkout flow with confirmation gate
import { Button, Confirmation } from '@vhyxseal/react'
import { defineContract } from '@vhyxseal/core'

const placeOrderContract = defineContract({
  id: "place-order-btn", type: "action", intent: "place-order",
  description: "Places the order",
  requires: [
    { field: "user.authenticated", operator: "===", value: true, description: "Must be logged in" },
  ],
  requiredPermissions: ["write:orders"],
  consequence: "Creates order record and charges payment",
  affects: ["orders", "payment"],
  reversible: true, reversibleWindow: 300,
  safetyLevel: "high", requiresConfirmation: true, destructive: false,
  contractVersion: "1.0.0",
})

export function CheckoutFlow() {
  return (
    <Confirmation contract={placeOrderContract}>
      {({ confirmed, isPending, confirm, cancel }) => (
        <div>
          {isPending && (
            <dialog open>
              <p>Place order for $49.99?</p>
              <button onClick={confirm}>Confirm</button>
              <button onClick={cancel}>Cancel</button>
            </dialog>
          )}
          <Button
            contract={placeOrderContract}
            onClick={confirmed ? () => submitOrder() : undefined}
            disabled={isPending}
          >
            {confirmed ? "Placing Order..." : "Place Order"}
          </Button>
        </div>
      )}
    </Confirmation>
  )
}`;

const example2Code = `// Example 2 — Search form with dependency relationship
import { Input, Button, Form } from '@vhyxseal/react'
import { defineContract, defineRelationship } from '@vhyxseal/core'

const queryInputContract = defineContract({
  id: "search-query-input", type: "input", intent: "search",
  description: "Enter search query",
  requires: [], requiredPermissions: [],
  consequence: "Enables search button when non-empty",
  affects: ["search-state"],
  reversible: true, safetyLevel: "low",
  requiresConfirmation: false, destructive: false,
  contractVersion: "1.0.0",
})

const searchButtonContract = defineContract({
  id: "search-submit-btn", type: "action", intent: "search",
  description: "Submits the search query",
  requires: [{ field: "search.query.length", operator: ">", value: 0, description: "Query must not be empty" }],
  requiredPermissions: [],
  consequence: "Fetches and displays search results",
  affects: ["search-results"],
  reversible: true, safetyLevel: "low",
  requiresConfirmation: false, destructive: false,
  contractVersion: "1.0.0",
})

// Declare the dependency relationship
defineRelationship({
  type: "dependency",
  id: "search-query-enables-button",
  source: "search-query-input",
  target: "search-submit-btn",
  condition: { field: "search.query.length", operator: ">", value: 0, description: "Query non-empty" },
  effect: "enables",
  description: "Non-empty query enables the search button",
})

export function SearchForm() {
  const [query, setQuery] = React.useState("")
  return (
    <Form contract={searchFormContract}>
      <Input contract={queryInputContract} value={query} onChange={e => setQuery(e.target.value)} />
      <Button contract={searchButtonContract} type="submit" disabled={query.length === 0}>
        Search
      </Button>
    </Form>
  )
}`;

// ── Styles ────────────────────────────────────────────────────────────────

const h1Style: React.CSSProperties = { fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--docs-text)", marginBottom: "8px", marginTop: 0 };
const h2Style: React.CSSProperties = { fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--docs-text)", marginBottom: "16px", marginTop: "48px", paddingTop: "36px", borderTop: "1px solid var(--docs-border)" };
const h3Style: React.CSSProperties = { fontSize: "1rem", fontWeight: 600, color: "var(--docs-text)", marginBottom: "8px", marginTop: "24px" };
const leadStyle: React.CSSProperties = { fontSize: "1.0625rem", color: "var(--docs-text-muted)", lineHeight: 1.75, marginBottom: "24px", maxWidth: "660px" };
const noteStyle: React.CSSProperties = { fontSize: "13px", color: "var(--docs-text-muted)", lineHeight: 1.7, marginBottom: "12px" };

/**
 * React adapter guide — nine sections.
 * Zero hardcoded colors — all via --docs-* or --vhyxseal-* CSS custom properties.
 */
export default function ReactGuidePage(): React.ReactElement {
  return (
    <>
      <OnThisPage />
      <h1 style={h1Style}>React Adapter</h1>
      <p style={leadStyle}>
        <code style={{ backgroundColor: "var(--docs-code-bg)", padding: "2px 5px", borderRadius: "4px", fontSize: "13px" }}>@vhyxseal/react</code>{" "}
        is a thin adapter on top of{" "}
        <code style={{ backgroundColor: "var(--docs-code-bg)", padding: "2px 5px", borderRadius: "4px", fontSize: "13px" }}>@vhyxseal/core</code>.
        It provides six headless UI components, three hooks, a context provider,
        and a higher-order component for wrapping existing components. All business
        logic lives in core — this package is pure React plumbing.
      </p>

      {/* 1 — What it provides */}
      <section>
        <h2 style={h2Style}>What the Adapter Provides</h2>
        <ul style={{ ...noteStyle, paddingLeft: "20px", lineHeight: 2.2 }}>
          <li><strong style={{ color: "var(--docs-text)" }}>SealProvider</strong> — context provider that collects contracts and generates the manifest</li>
          <li><strong style={{ color: "var(--docs-text)" }}>withAgentContract()</strong> — HOC to add a contract to any existing component without modifying it</li>
          <li><strong style={{ color: "var(--docs-text)" }}>useContract(id)</strong> — reads a registered contract by component id</li>
          <li><strong style={{ color: "var(--docs-text)" }}>useCapability()</strong> — reads the full capability map with counts</li>
          <li><strong style={{ color: "var(--docs-text)" }}>useAgentAction()</strong> — tracks agent action lifecycle (standalone, no provider needed)</li>
          <li><strong style={{ color: "var(--docs-text)" }}>Button, Input, Form, Nav, Display, Confirmation</strong> — headless components with contract registration built in</li>
        </ul>
      </section>

      {/* 2 — Installation */}
      <section>
        <h2 style={h2Style}>Installation</h2>
        <CodeBlock code={installCode} lang="bash" />
        <p style={{ ...noteStyle, marginTop: "8px" }}>
          React ≥ 18 required. Works with React 19. Fully compatible with
          Next.js App Router (including Server Components) and Pages Router.
        </p>
      </section>

      {/* 3 — Full setup */}
      <section>
        <h2 style={h2Style}>Full Setup</h2>
        <p style={noteStyle}>
          Place SealProvider at the root of your component tree. Every
          VhyxSeal component in the subtree automatically registers its
          contract.
        </p>
        <CodeBlock code={providerSetupCode} lang="tsx" filename="app/layout.tsx" />
      </section>

      {/* 4 — SealProvider config */}
      <section>
        <h2 style={h2Style}>SealProvider Configuration</h2>
        <p style={noteStyle}>The SealProvider config maps directly to ManifestConfig from @vhyxseal/core.</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", marginBottom: "16px" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--docs-border)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--docs-text-muted)" }}>Prop</th>
                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--docs-border)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--docs-text-muted)" }}>Type</th>
                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--docs-border)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--docs-text-muted)" }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["config", "ManifestConfig", "Required. domain, domainVerified, verificationToken, and optional policy/cache"],
                ["dev", "boolean", "Optional. Enable verbose logging. Defaults to NODE_ENV !== production"],
                ["onManifestGenerated", "(manifest) => void", "Optional. Called each time a new manifest is generated"],
                ["children", "ReactNode", "Required. The component tree that can register contracts"],
              ].map(([prop, type, desc]) => (
                <tr key={String(prop)}>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--docs-border)", fontFamily: "monospace", fontSize: "12px", color: "var(--vhyxseal-color-info)" }}>{prop}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--docs-border)", fontFamily: "monospace", fontSize: "12px", color: "var(--docs-text-muted)" }}>{type}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--docs-border)", fontSize: "13px", color: "var(--docs-text-muted)" }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5 — withAgentContract */}
      <section>
        <h2 style={h2Style}>withAgentContract HOC</h2>
        <p style={noteStyle}>
          Wraps any existing component without modifying it. The contract is a
          completely separate concern — existing component code is untouched.
        </p>
        <CodeBlock code={withAgentContractCode} lang="tsx" />
      </section>

      {/* 6 — Hooks reference */}
      <section>
        <h2 style={h2Style}>Hooks Reference</h2>
        <CodeBlock code={hooksCode} lang="tsx" />
        <h3 style={h3Style}>Available Components</h3>
        <CodeBlock code={componentCode} lang="tsx" />
      </section>

      {/* 7 — TypeScript types */}
      <section>
        <h2 style={h2Style}>TypeScript Types</h2>
        <CodeBlock code={typesCode} lang="typescript" />
      </section>

      {/* 8 — Common patterns */}
      <section>
        <h2 style={h2Style}>Common Patterns</h2>
        <h3 style={h3Style}>Checkout flow with confirmation gate</h3>
        <CodeBlock code={example1Code} lang="tsx" />
        <h3 style={{ ...h3Style, marginTop: "32px" }}>Search form with dependency relationship</h3>
        <CodeBlock code={example2Code} lang="tsx" />
      </section>

      {/* 9 — Known limitations */}
      <section style={{ paddingBottom: "80px" }}>
        <h2 style={h2Style}>Known Limitations</h2>
        <ul style={{ ...noteStyle, paddingLeft: "20px", lineHeight: 2.2 }}>
          <li>Server Components cannot use hooks — use <code style={{ backgroundColor: "var(--docs-code-bg)", padding: "2px 4px", borderRadius: "3px", fontSize: "12px" }}>withAgentContract</code> or component-level <code style={{ backgroundColor: "var(--docs-code-bg)", padding: "2px 4px", borderRadius: "3px", fontSize: "12px" }}>contract</code> prop for RSC-compatible components</li>
          <li>SealProvider uses React Context — wrap it in a Client Component boundary in App Router</li>
          <li>useAgentAction is standalone and does not require SealProvider</li>
          <li>All six components (Button, Input, Form, Nav, Display, Confirmation) gracefully degrade outside SealProvider — they render without contract registration and do not throw</li>
        </ul>
      </section>
      <PrevNext />
    </>
  );
}
