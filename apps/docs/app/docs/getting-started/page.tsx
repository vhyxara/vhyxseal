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

const headingStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  color: "#f1f5f9",
  marginTop: "48px",
  marginBottom: "12px",
};

const stepLabelStyle: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "11px",
  color: "#3b82f6",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  marginBottom: "6px",
  display: "block",
};

export default function GettingStartedPage() {
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
        {" / "}Getting Started
      </div>

      <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#f8fafc", marginBottom: "16px" }}>
        Getting Started
      </h1>
      <p style={{ fontSize: "16px", color: "#64748b", lineHeight: 1.75, marginBottom: "48px" }}>
        Add VhyxSeal to a Next.js project. Your site will automatically serve a
        machine-readable manifest at{" "}
        <code
          style={{
            fontFamily: "monospace",
            fontSize: "13px",
            backgroundColor: "#1e293b",
            padding: "2px 6px",
            borderRadius: "4px",
            color: "#e2e8f0",
          }}
        >
          /__agent__/manifest.json
        </code>
        {" "}that AI agents can read.
      </p>

      {/* Step 1 */}
      <span style={stepLabelStyle}>Step 1</span>
      <h2 style={{ ...headingStyle, marginTop: 0 }}>Installation</h2>
      <p style={{ color: "#94a3b8", lineHeight: 1.7, marginBottom: "16px" }}>
        Install the React adapter and the Next.js integration:
      </p>
      <pre style={codeStyle}>
        <code>{`npm install @vhyxseal/react @vhyxseal/nextjs`}</code>
      </pre>

      {/* Step 2 */}
      <span style={stepLabelStyle}>Step 2</span>
      <h2 style={{ ...headingStyle, marginTop: 0 }}>Next.js setup</h2>
      <p style={{ color: "#94a3b8", lineHeight: 1.7, marginBottom: "16px" }}>
        Wrap your Next.js config with the VhyxSeal plugin. This adds the{" "}
        <code
          style={{
            fontFamily: "monospace",
            fontSize: "13px",
            backgroundColor: "#1e293b",
            padding: "2px 6px",
            borderRadius: "4px",
            color: "#e2e8f0",
          }}
        >
          Cache-Control
        </code>
        {" "}and{" "}
        <code
          style={{
            fontFamily: "monospace",
            fontSize: "13px",
            backgroundColor: "#1e293b",
            padding: "2px 6px",
            borderRadius: "4px",
            color: "#e2e8f0",
          }}
        >
          X-VhyxSeal-Version
        </code>
        {" "}headers automatically.
      </p>
      <pre style={codeStyle}>
        <code>{`// next.config.ts
import { vhyxsealPlugin } from "@vhyxseal/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};
export default vhyxsealPlugin(nextConfig);`}</code>
      </pre>

      {/* Step 3 */}
      <span style={stepLabelStyle}>Step 3</span>
      <h2 style={{ ...headingStyle, marginTop: 0 }}>Wrap your app with SealProvider</h2>
      <p style={{ color: "#94a3b8", lineHeight: 1.7, marginBottom: "16px" }}>
        Add SealProvider to your root layout. All components inside it can register contracts.
      </p>
      <pre style={codeStyle}>
        <code>{`// app/layout.tsx
import { SealProvider } from "@vhyxseal/react";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SealProvider
          config={{
            domain: "example.com",
            domainVerified: false,
            verificationToken: "",
          }}
        >
          {children}
        </SealProvider>
      </body>
    </html>
  );
}`}</code>
      </pre>

      {/* Step 4 */}
      <span style={stepLabelStyle}>Step 4</span>
      <h2 style={{ ...headingStyle, marginTop: 0 }}>Add your first contract</h2>
      <p style={{ color: "#94a3b8", lineHeight: 1.7, marginBottom: "16px" }}>
        Use a single{" "}
        <code
          style={{
            fontFamily: "monospace",
            fontSize: "13px",
            backgroundColor: "#1e293b",
            padding: "2px 6px",
            borderRadius: "4px",
            color: "#e2e8f0",
          }}
        >
          intent
        </code>
        {" "}prop to get smart defaults from the intent vocabulary.
        No other configuration required for Level 1.
      </p>
      <pre style={codeStyle}>
        <code>{`import { Button } from "@vhyxseal/react";

// Level 1 — one prop. Library fills in the rest from intent vocabulary.
<Button
  onClick={handleCheckout}
  intent="place-order"
>
  Place Order
</Button>

// The manifest at /__agent__/manifest.json will now include:
// {
//   intent: "place-order",
//   safetyLevel: "high",
//   requiresConfirmation: true,
//   reversible: true
// }`}</code>
      </pre>

      {/* Step 5 */}
      <span style={stepLabelStyle}>Step 5</span>
      <h2 style={{ ...headingStyle, marginTop: 0 }}>Add the manifest route</h2>
      <p style={{ color: "#94a3b8", lineHeight: 1.7, marginBottom: "16px" }}>
        Create the route handler that serves the manifest to AI agents.
      </p>
      <pre style={codeStyle}>
        <code>{`// app/__agent__/manifest.json/route.ts
import { handleManifestRoute } from "@vhyxseal/nextjs";
import type { NextRequest } from "next/server";

export function GET(request: NextRequest) {
  const result = handleManifestRoute(request, {
    domain: "example.com",
    domainVerified: false,
    verificationToken: "",
    contracts: [], // contracts are registered by SealProvider at runtime
  });

  return new Response(result.body, {
    status: result.status,
    headers: result.headers,
  });
}`}</code>
      </pre>

      {/* Verify */}
      <div
        style={{
          backgroundColor: "#1e293b",
          border: "1px solid #22c55e",
          borderRadius: "8px",
          padding: "20px 24px",
          marginTop: "40px",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#22c55e",
            marginBottom: "10px",
          }}
        >
          ✅ Verify it works
        </div>
        <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>
          Visit{" "}
          <code
            style={{
              fontFamily: "monospace",
              backgroundColor: "#0f172a",
              padding: "2px 6px",
              borderRadius: "4px",
              color: "#e2e8f0",
            }}
          >
            http://localhost:3000/__agent__/manifest.json
          </code>
          {" "}in your browser. You should see a JSON response with{" "}
          <code
            style={{
              fontFamily: "monospace",
              backgroundColor: "#0f172a",
              padding: "2px 6px",
              borderRadius: "4px",
              color: "#e2e8f0",
            }}
          >
            {'"vhyxseal": "1.0.0"'}
          </code>
          {" "}at the top.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "48px",
        }}
      >
        <a
          href="/docs/concepts"
          style={{
            color: "#3b82f6",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          Core Concepts →
        </a>
      </div>
    </main>
  );
}
