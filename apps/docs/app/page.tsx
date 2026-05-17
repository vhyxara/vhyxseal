const codeBlockStyle: React.CSSProperties = {
  backgroundColor: "#0f172a",
  fontFamily: "monospace",
  fontSize: "13px",
  lineHeight: "1.7",
  padding: "20px 24px",
  borderRadius: "8px",
  border: "1px solid #334155",
  overflowX: "auto",
  color: "#e2e8f0",
  margin: 0,
};

const level3Example = `import { defineContract } from '@vhyxseal/core'
import { Button } from '@vhyxseal/react'

const orderContract = defineContract({
  id: "checkout-submit-btn",
  type: "action",
  intent: "place-order",
  description: "Submits the current cart as a purchase order",
  requires: [
    {
      field: "user.authenticated",
      operator: "===",
      value: true,
      description: "User must be logged in"
    },
    {
      field: "cart.hasItems",
      operator: "===",
      value: true,
      description: "Cart must have at least one item"
    },
    {
      field: "user.hasPaymentMethod",
      operator: "===",
      value: true,
      description: "Payment method must be saved"
    }
  ],
  requiredPermissions: ["write:orders", "read:payment"],
  consequence: "Creates order record, charges payment method, triggers fulfillment",
  affects: ["cart", "orders", "payment", "inventory"],
  reversible: true,
  reversibleWindow: 300,
  safetyLevel: "high",
  requiresConfirmation: true,
  destructive: false,
  contractVersion: "1.0.0"
})

// Clean JSX — contract defined separately
<Button onClick={handleCheckout} contract={orderContract}>
  Place Order
</Button>`;

const quickStartStep1 = `npm install @vhyxseal/react @vhyxseal/nextjs`;

const quickStartStep2 = `// next.config.ts
import { vhyxsealPlugin } from "@vhyxseal/nextjs";
export default vhyxsealPlugin({});`;

const quickStartStep3 = `// app/layout.tsx
import { SealProvider } from "@vhyxseal/react";

export default function Layout({ children }) {
  return (
    <SealProvider config={{ domain: "example.com", domainVerified: false, verificationToken: "" }}>
      {children}
    </SealProvider>
  );
}`;

const problemsAgents = [
  "DOM is visual, not semantic — agents guess intent from appearance",
  "No action schema exists for the UI layer",
  "Agents cannot discover what a site can do before navigating it",
  "No safety contracts — agents can trigger destructive actions blindly",
  "No precondition awareness — agents attempt actions that will fail",
  "No consequence awareness — agents don't know what changes after acting",
];

const problemsDevelopers = [
  "Accessibility is always an afterthought — we bake it in",
  "Components don't know about each other — we build relationships",
  "Error states not first class — we make them required",
  "No native action history in UI layer — we build it in",
  "No standard contract between UI and its consumers",
  "No audit trail of what AI agents did on a site",
];

const problemsWeb = [
  "APIs have OpenAPI specs — UI has nothing",
  "No standard contract between UI and its consumers",
  "No audit trail of what AI agents did on a site",
  "No access control for AI agents at the UI layer",
  "No trust verification between agents and sites",
  "No machine-readable action schema for the web",
];

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "80px 24px 64px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "20px",
            padding: "4px 14px",
            fontSize: "12px",
            color: "#3b82f6",
            marginBottom: "24px",
            fontFamily: "monospace",
          }}
        >
          Stage 2 — Early Alpha
        </div>
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 52px)",
            fontWeight: 800,
            lineHeight: 1.15,
            margin: "0 0 24px",
            color: "#f8fafc",
          }}
        >
          Seal the contract between your UI and the agentic web
        </h1>
        <p
          style={{
            fontSize: "18px",
            color: "#94a3b8",
            lineHeight: 1.7,
            maxWidth: "620px",
            margin: "0 auto 40px",
          }}
        >
          VhyxSeal is the missing semantic contract layer that makes web UI readable,
          navigable, and safe for both humans and AI agents simultaneously.
          Think of it as OpenAPI for your UI layer.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href="/docs/getting-started"
            style={{
              backgroundColor: "#3b82f6",
              color: "#fff",
              padding: "12px 28px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "15px",
            }}
          >
            Get Started
          </a>
          <a
            href="/docs"
            style={{
              backgroundColor: "#1e293b",
              color: "#f1f5f9",
              padding: "12px 28px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "15px",
              border: "1px solid #334155",
            }}
          >
            Read the Docs
          </a>
        </div>
      </section>

      {/* Three eras */}
      <section
        style={{
          backgroundColor: "#1e293b",
          borderTop: "1px solid #334155",
          borderBottom: "1px solid #334155",
          padding: "48px 24px",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2
            style={{
              textAlign: "center",
              fontSize: "22px",
              color: "#f1f5f9",
              marginBottom: "40px",
              fontWeight: 600,
            }}
          >
            The web was built in three eras
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "24px",
            }}
          >
            {[
              { era: "Era 1", label: "Built for humans reading", color: "#6b7280" },
              { era: "Era 2", label: "Adapted for Google crawling (SEO, structured data, sitemaps)", color: "#6b7280" },
              { era: "Era 3", label: "Must work for AI agents acting on behalf of humans", color: "#22c55e", now: true },
            ].map(({ era, label, color, now }) => (
              <div
                key={era}
                style={{
                  backgroundColor: "#0f172a",
                  border: `1px solid ${now ? "#22c55e" : "#334155"}`,
                  borderRadius: "8px",
                  padding: "20px 24px",
                }}
              >
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: "11px",
                    color,
                    marginBottom: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {era}{now ? " — NOW" : ""}
                </div>
                <div style={{ fontSize: "15px", color: "#cbd5e1", lineHeight: 1.5 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
          <p
            style={{
              textAlign: "center",
              color: "#64748b",
              marginTop: "32px",
              fontSize: "15px",
              lineHeight: 1.7,
            }}
          >
            VhyxSeal adds a second nervous system that runs alongside your existing UI.
            Not replacing anything. Coexisting. Extending.
          </p>
        </div>
      </section>

      {/* Problems */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "72px 24px" }}>
        <h2
          style={{
            textAlign: "center",
            fontSize: "28px",
            color: "#f1f5f9",
            marginBottom: "8px",
            fontWeight: 700,
          }}
        >
          The problems we are solving
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "#64748b",
            marginBottom: "48px",
            fontSize: "16px",
          }}
        >
          The same problems that make UI unreadable for agents cause pain for developers.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
          }}
        >
          {[
            { title: "For AI Agents", color: "#ef4444", items: problemsAgents },
            { title: "For Developers", color: "#3b82f6", items: problemsDevelopers },
            { title: "For The Web", color: "#a855f7", items: problemsWeb },
          ].map(({ title, color, items }) => (
            <div
              key={title}
              style={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "10px",
                padding: "24px",
              }}
            >
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "16px",
                  marginTop: 0,
                }}
              >
                {title}
              </h3>
              <ul style={{ margin: 0, padding: "0 0 0 18px", listStyle: "none" }}>
                {items.map((item, i) => (
                  <li
                    key={i}
                    style={{
                      color: "#94a3b8",
                      fontSize: "13px",
                      lineHeight: 1.65,
                      marginBottom: "8px",
                      paddingLeft: "4px",
                      position: "relative",
                    }}
                  >
                    <span style={{ color: "#334155", marginRight: "8px" }}>—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Code example */}
      <section
        style={{
          backgroundColor: "#1e293b",
          borderTop: "1px solid #334155",
          borderBottom: "1px solid #334155",
          padding: "72px 24px",
        }}
      >
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "28px",
              color: "#f1f5f9",
              marginBottom: "12px",
              fontWeight: 700,
            }}
          >
            A fully specified contract
          </h2>
          <p style={{ color: "#64748b", marginBottom: "32px", fontSize: "15px", lineHeight: 1.7 }}>
            Level 3 — the full developer experience. Defined once, reused everywhere.
            Agents get the complete picture before they act.
          </p>
          <pre style={codeBlockStyle}>
            <code>{level3Example}</code>
          </pre>
        </div>
      </section>

      {/* Quick start */}
      <section style={{ maxWidth: "860px", margin: "0 auto", padding: "72px 24px 96px" }}>
        <h2
          style={{
            fontSize: "28px",
            color: "#f1f5f9",
            marginBottom: "12px",
            fontWeight: 700,
          }}
        >
          Get started in three steps
        </h2>
        <p style={{ color: "#64748b", marginBottom: "40px", fontSize: "15px", lineHeight: 1.7 }}>
          Zero config required to get a manifest. Add contracts progressively.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {[
            { step: "01", title: "Install", code: quickStartStep1 },
            { step: "02", title: "Add the Next.js plugin", code: quickStartStep2 },
            { step: "03", title: "Wrap your app with SealProvider", code: quickStartStep3 },
          ].map(({ step, title, code }) => (
            <div
              key={step}
              style={{
                display: "grid",
                gridTemplateColumns: "40px 1fr",
                gap: "16px",
                alignItems: "start",
              }}
            >
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: "11px",
                  color: "#3b82f6",
                  fontWeight: 700,
                  paddingTop: "4px",
                }}
              >
                {step}
              </div>
              <div>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#e2e8f0",
                    marginBottom: "10px",
                  }}
                >
                  {title}
                </div>
                <pre style={{ ...codeBlockStyle, padding: "14px 18px" }}>
                  <code>{code}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "40px", textAlign: "center" }}>
          <a
            href="/docs/getting-started"
            style={{
              color: "#3b82f6",
              textDecoration: "none",
              fontSize: "15px",
              fontWeight: 500,
            }}
          >
            Read the full getting started guide →
          </a>
        </div>
      </section>
    </main>
  );
}
