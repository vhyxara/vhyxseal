import { CodeBlock } from "../components/CodeBlock";

const installCode = `npm install @vhyxseal/core @vhyxseal/react`;

const step2Code = `import { SealProvider } from '@vhyxseal/react'

export default function App({ children }) {
  return <SealProvider>{children}</SealProvider>
}`;

const step3Code = `import { withAgentContract } from '@vhyxseal/react'
import { defineContract } from '@vhyxseal/core'

const contract = defineContract({
  intent: 'place-order',
  safetyLevel: 'high',
  requiresConfirmation: true,
  consequence: 'charges payment method and triggers fulfillment'
})

export const CheckoutButton = withAgentContract(
  ({ onClick }) => <button onClick={onClick}>Place Order</button>,
  contract
)`;

/**
 * Landing page — three sections exactly.
 *
 * Section 1: Hero — headline, description, action buttons, install command.
 * Section 2: The problem in one scenario — narrative, two paragraphs.
 * Section 3: Three-minute setup — three steps with code blocks.
 *
 * Zero hardcoded colors — all via --docs-* or --vhyxseal-* CSS custom properties.
 */
export default function HomePage(): React.ReactElement {
  return (
    <>
      {/* ── Section 1 — Hero ────────────────────────────────────────── */}
      <section style={{ padding: "80px 0 64px" }}>
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: "var(--docs-text)",
            marginBottom: "24px",
            maxWidth: "700px",
          }}
        >
          The semantic contract layer for AI-agent-readable UI.
        </h1>

        <p
          style={{
            fontSize: "clamp(1rem, 2vw, 1.25rem)",
            color: "var(--docs-text-muted)",
            maxWidth: "600px",
            lineHeight: 1.7,
            marginBottom: "40px",
          }}
        >
          VhyxSeal gives every UI component a machine-readable contract.
          Agents understand intent, preconditions, consequences, and safety.
          Your UI becomes navigable — not just visible.
        </p>

        {/* Three action buttons */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "48px",
          }}
        >
          <a
            href="/getting-started"
            style={{
              padding: "12px 24px",
              backgroundColor: "var(--vhyxseal-color-full)",
              color: "white",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "15px",
              textDecoration: "none",
            }}
          >
            Get Started
          </a>
          <a
            href="/rfc/0001"
            style={{
              padding: "12px 24px",
              border: "1px solid var(--docs-border)",
              color: "var(--docs-text)",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "15px",
              textDecoration: "none",
              backgroundColor: "var(--docs-surface)",
            }}
          >
            Read the RFC
          </a>
          <a
            href="https://github.com/vhyxara/vhyxseal"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "12px 24px",
              color: "var(--docs-text-muted)",
              fontSize: "15px",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            GitHub ↗
          </a>
        </div>

        {/* Install command — copy button from CodeBlock */}
        <CodeBlock code={installCode} lang="bash" />
      </section>

      {/* ── Section 2 — The Problem In One Scenario ─────────────────── */}
      <section
        style={{
          padding: "64px 0",
          borderTop: "1px solid var(--docs-border)",
        }}
      >
        <h2
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--docs-text)",
            marginBottom: "24px",
          }}
        >
          The missing contract problem.
        </h2>

        <p
          style={{
            fontSize: "1.0625rem",
            lineHeight: 1.75,
            color: "var(--docs-text-muted)",
            maxWidth: "680px",
            marginBottom: "20px",
          }}
        >
          An AI agent lands on a checkout page. It sees a button labeled
          &ldquo;Submit.&rdquo; It cannot know if pressing it places a $500
          order, saves a draft, or deletes an account. It guesses. Sometimes it
          guesses wrong. This is not an agent intelligence problem. It is a
          missing contract problem.
        </p>

        <p
          style={{
            fontSize: "1.0625rem",
            lineHeight: 1.75,
            color: "var(--docs-text-muted)",
            maxWidth: "680px",
          }}
        >
          VhyxSeal gives that button a contract. Intent: place-order. Safety
          level: high. Requires confirmation: true. Consequence: charges payment
          method and triggers fulfillment. The agent reads the contract before
          acting. No guessing. No wrong calls.
        </p>
      </section>

      {/* ── Section 3 — Three Minute Setup ──────────────────────────── */}
      <section
        style={{
          padding: "64px 0",
          borderTop: "1px solid var(--docs-border)",
        }}
      >
        <h2
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--docs-text)",
            marginBottom: "48px",
          }}
        >
          Up in three minutes.
        </h2>

        {/* Step 1 */}
        <div style={{ marginBottom: "40px" }}>
          <p
            style={{
              fontSize: "13px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--vhyxseal-color-full)",
              marginBottom: "8px",
            }}
          >
            Step 1 — Install
          </p>
          <CodeBlock code={installCode} lang="bash" />
        </div>

        {/* Step 2 */}
        <div style={{ marginBottom: "40px" }}>
          <p
            style={{
              fontSize: "13px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--vhyxseal-color-full)",
              marginBottom: "8px",
            }}
          >
            Step 2 — Wrap your app
          </p>
          <CodeBlock code={step2Code} lang="tsx" />
        </div>

        {/* Step 3 */}
        <div style={{ marginBottom: "40px" }}>
          <p
            style={{
              fontSize: "13px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--vhyxseal-color-full)",
              marginBottom: "8px",
            }}
          >
            Step 3 — Add a contract
          </p>
          <CodeBlock code={step3Code} lang="tsx" />
        </div>

        <p
          style={{
            fontSize: "15px",
            color: "var(--docs-text-muted)",
            fontStyle: "italic",
          }}
        >
          Your manifest is now live at{" "}
          <code
            style={{
              backgroundColor: "var(--docs-code-bg)",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "14px",
              fontStyle: "normal",
            }}
          >
            /__agent__/manifest.json
          </code>
        </p>
      </section>
    </>
  );
}
