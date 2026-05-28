import { CodeBlock } from "../../components/CodeBlock";
import { IntentFilter } from "./IntentFilter";
import { OnThisPage } from "../../components/OnThisPage";
import { PrevNext } from "../../components/PrevNext";

const registerIntentCode = `import { registerIntent } from '@vhyxseal/core'

// Register a domain-specific intent with custom defaults
registerIntent("request-refund", {
  safetyLevel: "high",
  reversible: false,
  requiresConfirmation: true,
  destructive: false,
})

// The intent is now available for components:
// <Button intent="request-refund">Request Refund</Button>
// Library merges your registered defaults — no other fields required`;

export default async function IntentsPage(): Promise<React.ReactElement> {
  return (
    <div>
      <OnThisPage />
      <h1
        style={{
          fontSize: "32px",
          fontWeight: 800,
          color: "var(--docs-text)",
          marginBottom: "8px",
        }}
      >
        Intent Vocabulary
      </h1>
      <p
        style={{
          fontSize: "16px",
          color: "var(--docs-text-muted)",
          marginBottom: "40px",
          lineHeight: 1.6,
        }}
      >
        The built-in intent vocabulary maps common user action names to sensible contract defaults.
        Providing an <code style={{ fontFamily: "monospace", fontSize: "14px" }}>intent</code> prop
        at Level 1 adoption automatically fills safety level, reversibility, and confirmation
        requirements from these defaults.
      </p>

      {/* ── Filterable table ──────────────────────────────────────────── */}
      <section style={{ marginBottom: "48px" }}>
        <h2
          id="built-in-intents"
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--docs-text)",
            marginBottom: "16px",
          }}
        >
          Built-in Intents
        </h2>
        <p
          style={{
            color: "var(--docs-text-muted)",
            fontSize: "14px",
            marginBottom: "16px",
          }}
        >
          25 intents total. Filter by name to find what you need.
        </p>
        <IntentFilter />
      </section>

      {/* ── Custom intents ─────────────────────────────────────────────── */}
      <section style={{ marginBottom: "48px" }}>
        <h2
          id="custom-intents"
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--docs-text)",
            marginBottom: "16px",
            paddingTop: "24px",
            borderTop: "1px solid var(--docs-border)",
          }}
        >
          Registering Custom Intents
        </h2>
        <p
          style={{
            color: "var(--docs-text)",
            lineHeight: 1.7,
            marginBottom: "20px",
          }}
        >
          Use <code style={{ fontFamily: "monospace", fontSize: "13px" }}>registerIntent()</code>{" "}
          to extend the built-in vocabulary with domain-specific intents. Once registered, the
          intent is recognized by <code style={{ fontFamily: "monospace", fontSize: "13px" }}>isKnownIntent()</code>,
          and its defaults are automatically merged when a developer uses the intent at Level 1 or
          Level 2 adoption.
        </p>
        <div style={{ marginBottom: "24px" }}>
          <CodeBlock code={registerIntentCode} lang="typescript" />
        </div>
        <p
          style={{
            color: "var(--docs-text)",
            lineHeight: 1.7,
            marginBottom: "0",
          }}
        >
          Custom intents are appropriate when your domain has actions that don{"'"}t map cleanly to
          the built-in vocabulary — for example, <code style={{ fontFamily: "monospace", fontSize: "13px" }}>request-refund</code>,{" "}
          <code style={{ fontFamily: "monospace", fontSize: "13px" }}>approve-document</code>, or{" "}
          <code style={{ fontFamily: "monospace", fontSize: "13px" }}>archive-record</code>. Keep
          intent names lowercase, hyphen-separated, and descriptive of the action from the
          user{"'"}s perspective. Intent names must be 50 characters or fewer.
        </p>
      </section>
      <PrevNext />
    </div>
  );
}
