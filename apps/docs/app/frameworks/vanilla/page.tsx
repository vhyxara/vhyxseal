import { CodeBlock } from "../../../components/CodeBlock";
import { OnThisPage } from "../../../components/OnThisPage";
import { PrevNext } from "../../../components/PrevNext";

// ── Code examples ─────────────────────────────────────────────────────────

const installCode = `npm install @vhyxseal/vanilla @vhyxseal/core`;

const setupCode = `// Register all custom elements at app startup
import { defineVhyxSealElements } from '@vhyxseal/vanilla'

// Safe to call multiple times — guards with customElements.get() before defining
// Also guards typeof customElements === "undefined" for non-browser environments
defineVhyxSealElements()

// Elements are now available as custom HTML elements:
// <seal-button>, <seal-input>, <seal-form>,
// <seal-nav>, <seal-display>, <seal-confirmation>`;

const registryCode = `// createSealRegistry — create an isolated contract registry
import { createSealRegistry } from '@vhyxseal/vanilla'
import { defineContract } from '@vhyxseal/core'

const registry = createSealRegistry()

const contract = defineContract({
  id: "checkout-btn",
  type: "action",
  intent: "place-order",
  description: "Submits the cart as a purchase order",
  requires: [
    { field: "user.authenticated", operator: "===", value: true, description: "User must be logged in" },
  ],
  requiredPermissions: ["write:orders"],
  consequence: "Creates order, charges payment, triggers fulfillment",
  affects: ["cart", "orders", "payment"],
  reversible: true, reversibleWindow: 300,
  safetyLevel: "high", requiresConfirmation: true, destructive: false,
  contractVersion: "1.0.0",
})

registry.register(contract)

// Read contracts
const all = registry.getAll()
const byId = registry.get("checkout-btn")
registry.unregister("checkout-btn")
registry.clear()`;

const buttonCode = `<!-- HTML — use custom elements as standard HTML -->
<seal-button id="checkout-btn">Place Order</seal-button>

<script>
import { SealButton } from '@vhyxseal/vanilla'
import { defineContract } from '@vhyxseal/core'

// Get a reference to the element
const btn = document.getElementById('checkout-btn')

// Set the contract — triggers registration with globalRegistry on connect
btn.setContract(defineContract({
  id: "checkout-btn",
  type: "action",
  intent: "place-order",
  description: "Places the order",
  requires: [{ field: "user.authenticated", operator: "===", value: true, description: "Must be logged in" }],
  requiredPermissions: ["write:orders"],
  consequence: "Creates order and charges payment",
  affects: ["orders", "payment"],
  reversible: true, reversibleWindow: 300,
  safetyLevel: "high", requiresConfirmation: true, destructive: false,
  contractVersion: "1.0.0",
}))

// Contract is registered with globalRegistry when element connects to DOM
// Contract is unregistered when element disconnects from DOM
</script>`;

const confirmationCode = `<!-- SealConfirmation — custom events for confirmation lifecycle -->
<seal-confirmation id="delete-confirm"></seal-confirmation>

<script>
const confirmEl = document.getElementById('delete-confirm')

// Request confirmation (shows confirmation UI, fires 'confirmationrequested')
confirmEl.requestConfirmation()

// Listen for user decisions
confirmEl.addEventListener('confirmationconfirmed', () => {
  performDelete()
})

confirmEl.addEventListener('confirmationcancelled', () => {
  console.log('User cancelled')
})

// Programmatic confirm/cancel (e.g. from modal buttons)
document.getElementById('confirm-btn').addEventListener('click', () => {
  confirmEl.confirm()   // fires 'confirmationconfirmed', bubbles: true
})

document.getElementById('cancel-btn').addEventListener('click', () => {
  confirmEl.cancel()    // fires 'confirmationcancelled', bubbles: true
})

// Check state
console.log(confirmEl.isPending)  // true while waiting for user
console.log(confirmEl.confirmed)  // true after confirmed
</script>`;

const allElementsCode = `// All six custom elements
import {
  SealButton,           // role="button" + tabindex="0" on connect
  SealInput,            // role="textbox" on connect
  SealForm,             // form element with contract registration
  SealNav,              // role="navigation" on connect
  SealDisplay,          // aria-live="polite" on connect (configurable)
  SealConfirmation,     // confirmation lifecycle with custom events
  defineVhyxSealElements, // register all elements at once
} from '@vhyxseal/vanilla'

// Also exported:
import { createSealRegistry } from '@vhyxseal/vanilla'
import type { SealRegistry } from '@vhyxseal/vanilla'`;

const typesCode = `// TypeScript types from @vhyxseal/vanilla
import type {
  SealRegistry,  // Interface for createSealRegistry() return value
} from '@vhyxseal/vanilla'

// SealRegistry interface:
// register(contract: ComponentContract): void
// unregister(id: string): void
// get(id: string): Readonly<ComponentContract> | undefined
// getAll(): ReadonlyMap<string, Readonly<ComponentContract>>
// clear(): void`;

const example1Code = `<!-- Example 1 — Progressive enhancement of an existing form -->
<form id="checkout-form">
  <seal-input id="card-number-input">
    <input type="text" name="card-number" placeholder="Card number" />
  </seal-input>
  <seal-confirmation id="payment-confirm">
    <seal-button id="pay-now-btn">Pay Now</seal-button>
  </seal-confirmation>
</form>

<script type="module">
import { defineVhyxSealElements } from '@vhyxseal/vanilla'
import { defineContract } from '@vhyxseal/core'

defineVhyxSealElements()

document.getElementById('card-number-input').setContract(
  defineContract({
    id: "card-number-input", type: "input", intent: "collect-payment",
    description: "Credit card number field",
    requires: [], requiredPermissions: [],
    consequence: "Stores card number for payment processing",
    affects: ["payment"],
    reversible: false, safetyLevel: "sensitive",
    requiresConfirmation: false, destructive: false,
    contractVersion: "1.0.0",
  })
)

document.getElementById('pay-now-btn').setContract(
  defineContract({
    id: "pay-now-btn", type: "action", intent: "make-payment",
    description: "Submits payment",
    requires: [
      { field: "payment.cardNumber.isValid", operator: "===", value: true, description: "Card number must be valid" },
    ],
    requiredPermissions: ["write:payments"],
    consequence: "Charges the card and creates a payment record",
    affects: ["payments", "orders"],
    reversible: false, safetyLevel: "critical",
    requiresConfirmation: true, destructive: false,
    contractVersion: "1.0.0",
  })
)
</script>`;

const example2Code = `<!-- Example 2 — Read the manifest using the CLI after setup -->
<!-- (Vanilla JS generates the manifest via createSealRegistry) -->

<script type="module">
import { createSealRegistry } from '@vhyxseal/vanilla'
import { generateManifest } from '@vhyxseal/core'

const registry = createSealRegistry()

// Register contracts
registry.register(searchContract)
registry.register(filterContract)

// Generate manifest for agent consumption
const manifest = generateManifest(
  Array.from(registry.getAll().values()),
  { domain: "example.com", domainVerified: false, verificationToken: "" }
)

// Expose manifest at /__agent__/manifest.json via your server
// e.g. Express: app.get('/__agent__/manifest.json', (_, res) => res.json(manifest))
console.log(manifest.fingerprint)
</script>`;

// ── Styles ────────────────────────────────────────────────────────────────

const h1Style: React.CSSProperties = { fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--docs-text)", marginBottom: "8px", marginTop: 0 };
const h2Style: React.CSSProperties = { fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--docs-text)", marginBottom: "16px", marginTop: "48px", paddingTop: "36px", borderTop: "1px solid var(--docs-border)" };
const h3Style: React.CSSProperties = { fontSize: "1rem", fontWeight: 600, color: "var(--docs-text)", marginBottom: "8px", marginTop: "24px" };
const leadStyle: React.CSSProperties = { fontSize: "1.0625rem", color: "var(--docs-text-muted)", lineHeight: 1.75, marginBottom: "24px", maxWidth: "660px" };
const noteStyle: React.CSSProperties = { fontSize: "13px", color: "var(--docs-text-muted)", lineHeight: 1.7, marginBottom: "12px" };

/**
 * Vanilla JS / Web Components adapter guide — nine sections.
 * Zero hardcoded colors — all via --docs-* or --vhyxseal-* CSS custom properties.
 */
export default function VanillaGuidePage(): React.ReactElement {
  return (
    <>
      <OnThisPage />
      <h1 style={h1Style}>Vanilla JS / Web Components</h1>
      <p style={leadStyle}>
        <code style={{ backgroundColor: "var(--docs-code-bg)", padding: "2px 5px", borderRadius: "4px", fontSize: "13px" }}>@vhyxseal/vanilla</code>{" "}
        provides Web Components custom elements and a contract registry for
        framework-free JavaScript environments. Use it to add semantic contracts
        to any HTML page, Astro site, plain JavaScript app, or as a progressive
        enhancement layer on existing markup.
      </p>

      {/* 1 */}
      <section>
        <h2 style={h2Style}>What the Adapter Provides</h2>
        <ul style={{ ...noteStyle, paddingLeft: "20px", lineHeight: 2.2 }}>
          <li><strong style={{ color: "var(--docs-text)" }}>SealButton, SealInput, SealForm, SealNav, SealDisplay, SealConfirmation</strong> — Web Components custom elements with contract registration lifecycle</li>
          <li><strong style={{ color: "var(--docs-text)" }}>defineVhyxSealElements()</strong> — registers all six custom elements with the browser</li>
          <li><strong style={{ color: "var(--docs-text)" }}>createSealRegistry()</strong> — creates an isolated contract registry for non-browser environments</li>
          <li>All elements auto-register with the internal module-level registry on DOM connect and unregister on disconnect</li>
        </ul>
      </section>

      {/* 2 */}
      <section>
        <h2 style={h2Style}>Installation</h2>
        <CodeBlock code={installCode} lang="bash" />
        <p style={{ ...noteStyle, marginTop: "8px" }}>
          Browser-only. Custom elements require a browser environment with{" "}
          <code style={{ backgroundColor: "var(--docs-code-bg)", padding: "2px 4px", borderRadius: "3px", fontSize: "12px" }}>customElements</code>{" "}
          support (all modern browsers).
        </p>
      </section>

      {/* 3 */}
      <section>
        <h2 style={h2Style}>Full Setup</h2>
        <CodeBlock code={setupCode} lang="javascript" />
      </section>

      {/* 4 */}
      <section>
        <h2 style={h2Style}>createSealRegistry()</h2>
        <p style={noteStyle}>
          For server-side or testing use cases where the browser registry is not available.
          Creates an isolated, non-global registry.
        </p>
        <CodeBlock code={registryCode} lang="typescript" />
      </section>

      {/* 5 */}
      <section>
        <h2 style={h2Style}>Custom Elements Usage</h2>
        <h3 style={h3Style}>SealButton</h3>
        <p style={noteStyle}>Adds role=&ldquo;button&rdquo; and tabindex=&ldquo;0&rdquo; on connect. Registers contract with globalRegistry.</p>
        <CodeBlock code={buttonCode} lang="html" />
        <h3 style={{ ...h3Style, marginTop: "28px" }}>SealConfirmation</h3>
        <p style={noteStyle}>Custom confirmation lifecycle with typed custom events. Events bubble to parent elements.</p>
        <CodeBlock code={confirmationCode} lang="html" />
      </section>

      {/* 6 */}
      <section>
        <h2 style={h2Style}>All Elements Reference</h2>
        <CodeBlock code={allElementsCode} lang="typescript" />
        <div style={{ overflowX: "auto", marginTop: "16px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", marginBottom: "16px" }}>
            <thead>
              <tr>
                {["Element", "HTML Tag", "ARIA setup on connect", "Notes"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--docs-border)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--docs-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["SealButton", "<seal-button>", 'role="button", tabindex="0"', "Keyboard accessible by default"],
                ["SealInput", "<seal-input>", 'role="textbox"', "Wraps any input element"],
                ["SealForm", "<seal-form>", "—", "Form container with contract registration"],
                ["SealNav", "<seal-nav>", 'role="navigation"', "Navigation landmark"],
                ["SealDisplay", "<seal-display>", 'aria-live="polite"', "Configurable via aria-live attribute"],
                ["SealConfirmation", "<seal-confirmation>", "—", "Fires confirmationrequested, confirmationconfirmed, confirmationcancelled custom events"],
              ].map(([el, tag, aria, notes]) => (
                <tr key={String(el)}>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--docs-border)", fontFamily: "monospace", fontSize: "12px", color: "var(--vhyxseal-color-info)" }}>{el}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--docs-border)", fontFamily: "monospace", fontSize: "12px", color: "var(--docs-text)" }}>{tag}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--docs-border)", fontFamily: "monospace", fontSize: "12px", color: "var(--docs-text-muted)" }}>{aria}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--docs-border)", fontSize: "13px", color: "var(--docs-text-muted)" }}>{notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 7 */}
      <section>
        <h2 style={h2Style}>TypeScript Types</h2>
        <CodeBlock code={typesCode} lang="typescript" />
      </section>

      {/* 8 */}
      <section>
        <h2 style={h2Style}>Common Patterns</h2>
        <h3 style={h3Style}>Progressive enhancement of an existing form</h3>
        <CodeBlock code={example1Code} lang="html" />
        <h3 style={{ ...h3Style, marginTop: "32px" }}>Generating a manifest server-side</h3>
        <CodeBlock code={example2Code} lang="html" />
      </section>

      {/* 9 */}
      <section style={{ paddingBottom: "80px" }}>
        <h2 style={h2Style}>Known Limitations</h2>
        <ul style={{ ...noteStyle, paddingLeft: "20px", lineHeight: 2.2 }}>
          <li>Browser-only — custom elements require a DOM environment. Use createSealRegistry() for server-side or test environments</li>
          <li>The internal globalRegistry is not exported from the public API — use createSealRegistry() for isolated registries</li>
          <li>Private class fields (#contract, #confirmed, #isPending) compile to WeakMap-based implementation targeting ES2020 — true runtime privacy, small performance overhead</li>
          <li>defineVhyxSealElements() is idempotent — safe to call multiple times, guards with customElements.get() before each define()</li>
          <li>No built-in manifest serving — use your server framework to serve the registry contents at /__agent__/manifest.json (see example 2)</li>
        </ul>
      </section>
      <PrevNext />
    </>
  );
}
