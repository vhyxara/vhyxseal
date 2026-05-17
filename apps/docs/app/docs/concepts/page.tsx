const codeStyle: React.CSSProperties = {
  backgroundColor: "#0f172a",
  fontFamily: "monospace",
  fontSize: "13px",
  lineHeight: "1.7",
  padding: "18px 22px",
  borderRadius: "8px",
  border: "1px solid #334155",
  overflowX: "auto",
  color: "#e2e8f0",
  margin: "0 0 24px",
};

const inlineCode: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "13px",
  backgroundColor: "#1e293b",
  padding: "2px 6px",
  borderRadius: "4px",
  color: "#e2e8f0",
};

const h2Style: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#f1f5f9",
  marginTop: "64px",
  marginBottom: "16px",
  paddingTop: "64px",
  borderTop: "1px solid #1e293b",
};

const h3Style: React.CSSProperties = {
  fontSize: "17px",
  fontWeight: 600,
  color: "#e2e8f0",
  marginTop: "32px",
  marginBottom: "10px",
};

const bodyText: React.CSSProperties = {
  color: "#94a3b8",
  lineHeight: 1.75,
  fontSize: "15px",
  marginBottom: "16px",
};

const contractSchemaExample = `export interface ComponentContract {
  // IDENTITY — what is this component
  id: string;                      // unique identifier on the page
  type: ComponentType;             // action | input | navigation | display | confirmation
  intent: string;                  // e.g. "place-order"
  description: string;             // human readable explanation for agent reasoning

  // PRECONDITIONS — what must be true before agent interacts
  requires: Condition[];           // conditions that must all be satisfied
  requiredPermissions: string[];   // e.g. ["write:orders", "read:payment"]

  // CONSEQUENCE — what happens after interaction
  consequence: string;             // plain description of what changes
  affects: string[];               // system areas affected
  reversible: boolean;             // can this action be undone
  reversibleWindow?: number;       // seconds within which it can be undone

  // SAFETY — how carefully should agent proceed
  safetyLevel: SafetyLevel;        // low | medium | high | critical | sensitive
  requiresConfirmation: boolean;   // must agent get human approval first
  destructive: boolean;            // permanently deletes or modifies data

  // CONTRACT METADATA
  contractVersion: string;         // developer managed semver e.g. "1.0.0"
  fingerprint?: string;            // auto generated hash of contract content
}`;

const manifestExample = `// Served at /__agent__/manifest.json
{
  "vhyxseal": "1.0.0",
  "domain": "example.com",
  "domainVerified": false,
  "signature": "unsigned",
  "capabilities": [...],
  "components": [
    {
      "id": "checkout-submit-btn",
      "type": "action",
      "intent": "place-order",
      "safetyLevel": "high",
      "requiresConfirmation": true,
      "reversible": true,
      "reversibleWindow": 300,
      ...
    }
  ],
  "agentPolicy": {
    "allowedAgents": ["*"],
    "blockedActions": [],
    "requiresHumanPresent": []
  },
  "generatedAt": "2026-05-16T00:00:00.000Z",
  "expiresAt": "2026-05-16T01:00:00.000Z"
}`;

const fourLevels = [
  {
    level: "Level 0",
    title: "Zero Effort",
    color: "#6b7280",
    description:
      "Just swap your HTML element for a VhyxSeal component. The library infers intent from component name, props, ARIA labels, and HTML semantics.",
    code: `<Button onClick={handleCheckout}>Place Order</Button>
// Agent gets inferred contract. Not perfect. But something.`,
  },
  {
    level: "Level 1",
    title: "One Prop",
    color: "#3b82f6",
    description:
      "Add a single intent prop. The library looks it up in the intent vocabulary and fills in safety level, confirmation requirements, and reversibility.",
    code: `<Button onClick={handleCheckout} intent="place-order">
  Place Order
</Button>
// safetyLevel: "high", requiresConfirmation: true, reversible: true`,
  },
  {
    level: "Level 2",
    title: "Partial Contract",
    color: "#eab308",
    description:
      "Override specific fields. Everything not specified still comes from intent vocabulary defaults.",
    code: `<Button
  onClick={handleCheckout}
  intent="place-order"
  contract={{
    requires: ["user.authenticated", "cart.hasItems"],
    safetyLevel: "high",
    reversibleWindow: 300,
  }}
>
  Place Order
</Button>`,
  },
  {
    level: "Level 3",
    title: "Full Contract",
    color: "#22c55e",
    description:
      "Define the complete contract outside JSX using defineContract(). Full fingerprinting, preconditions, consequences, error states, and changelog.",
    code: `const contract = defineContract({
  id: "checkout-submit-btn",
  intent: "place-order",
  requires: [
    { field: "user.authenticated", operator: "===", value: true, description: "..." },
    { field: "cart.hasItems", operator: "===", value: true, description: "..." },
  ],
  consequence: "Creates order, charges payment, triggers fulfillment",
  affects: ["cart", "orders", "payment"],
  errorStates: [
    { trigger: "payment declined", display: "red banner", recovery: "update-payment" }
  ],
  contractVersion: "1.0.0"
})`,
  },
];

export default function ConceptsPage() {
  return (
    <main style={{ maxWidth: "760px", margin: "0 auto", padding: "56px 24px 96px" }}>
      <div
        style={{
          fontSize: "12px",
          color: "#64748b",
          marginBottom: "12px",
          fontFamily: "monospace",
        }}
      >
        <a href="/docs" style={{ color: "#3b82f6", textDecoration: "none" }}>Docs</a>
        {" / "}Core Concepts
      </div>

      <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#f8fafc", marginBottom: "16px" }}>
        Core Concepts
      </h1>
      <p style={{ ...bodyText, fontSize: "17px", marginBottom: "0" }}>
        VhyxSeal adds a semantic contract layer to your UI. Components declare what
        they do, what they need, and what changes when they act — in a machine-readable format
        that AI agents can read and reason over.
      </p>

      {/* What is a contract */}
      <section id="contract">
        <h2 style={{ ...h2Style, borderTop: "none", paddingTop: "48px" }}>
          What is a contract?
        </h2>
        <p style={bodyText}>
          A <strong style={{ color: "#e2e8f0" }}>ComponentContract</strong> is a typed description
          of what a UI component does. It answers four questions for any agent:
        </p>
        <ul
          style={{
            margin: "0 0 24px 0",
            padding: "0 0 0 18px",
            color: "#94a3b8",
            lineHeight: 1.8,
            fontSize: "15px",
          }}
        >
          <li><strong style={{ color: "#e2e8f0" }}>What is it?</strong> — type, intent, description</li>
          <li><strong style={{ color: "#e2e8f0" }}>What does it need?</strong> — preconditions, required permissions</li>
          <li><strong style={{ color: "#e2e8f0" }}>What happens if I use it?</strong> — consequence, affects, reversible</li>
          <li><strong style={{ color: "#e2e8f0" }}>How carefully should I proceed?</strong> — safetyLevel, requiresConfirmation, destructive</li>
        </ul>
        <pre style={codeStyle}>
          <code>{contractSchemaExample}</code>
        </pre>

        <h3 style={h3Style}>Safety levels</h3>
        <p style={bodyText}>
          The <code style={inlineCode}>safetyLevel</code> field tells agents how much caution
          to apply before acting:
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "8px 16px",
            marginBottom: "24px",
            fontFamily: "monospace",
            fontSize: "13px",
          }}
        >
          {[
            { level: "low", color: "#6b7280", desc: "read, filter, sort — agent can proceed freely" },
            { level: "medium", color: "#3b82f6", desc: "send message, save draft — proceed with care" },
            { level: "high", color: "#eab308", desc: "place order, submit form — confirm with human" },
            { level: "critical", color: "#ef4444", desc: "delete account, payment — always require human" },
            { level: "sensitive", color: "#ef4444", desc: "medical, financial data — extra protections apply" },
          ].map(({ level, color, desc }) => (
            <>
              <code key={`level-${level}`} style={{ color, whiteSpace: "nowrap" }}>{level}</code>
              <span key={`desc-${level}`} style={{ color: "#94a3b8" }}>{desc}</span>
            </>
          ))}
        </div>
      </section>

      {/* Four levels */}
      <section id="four-levels">
        <h2 style={h2Style}>The four levels of adoption</h2>
        <p style={bodyText}>
          VhyxSeal is progressively adoptable. Each level adds value. No level is required
          to get to the next. The library infers what it can and lets developers correct
          what inference gets wrong.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {fourLevels.map(({ level, title, color, description, code }) => (
            <div
              key={level}
              style={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "10px",
                padding: "20px 24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "11px",
                    color,
                    backgroundColor: "#0f172a",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    border: `1px solid ${color}`,
                  }}
                >
                  {level}
                </span>
                <span style={{ fontWeight: 600, color: "#e2e8f0", fontSize: "15px" }}>{title}</span>
              </div>
              <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.65, margin: "0 0 12px" }}>
                {description}
              </p>
              <pre style={{ ...codeStyle, margin: 0, padding: "12px 16px" }}>
                <code>{code}</code>
              </pre>
            </div>
          ))}
        </div>
      </section>

      {/* The manifest */}
      <section id="manifest">
        <h2 style={h2Style}>The manifest</h2>
        <p style={bodyText}>
          VhyxSeal automatically generates a manifest at{" "}
          <code style={inlineCode}>/__agent__/manifest.json</code> for every page.
          This is what AI agents read before navigating your site — equivalent to
          OpenAPI for your UI layer.
        </p>
        <p style={bodyText}>
          The manifest contains all registered component contracts, relationships
          between components, capability definitions, and the site&apos;s agent access policy.
          It is generated at build time (or on demand) and cached with a 1-hour TTL.
        </p>
        <pre style={codeStyle}>
          <code>{manifestExample}</code>
        </pre>
        <h3 style={h3Style}>Agent policy</h3>
        <p style={bodyText}>
          Site owners control which agents can act and what they can do via the{" "}
          <code style={inlineCode}>agentPolicy</code> field.
          The default policy allows all agents with reasonable rate limits.
          Sensitive actions can be explicitly blocked or require human presence.
        </p>
      </section>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "64px",
          paddingTop: "32px",
          borderTop: "1px solid #1e293b",
        }}
      >
        <a href="/docs/getting-started" style={{ color: "#3b82f6", textDecoration: "none", fontSize: "14px" }}>
          ← Getting Started
        </a>
        <a href="/docs" style={{ color: "#3b82f6", textDecoration: "none", fontSize: "14px" }}>
          Back to Docs →
        </a>
      </div>
    </main>
  );
}
