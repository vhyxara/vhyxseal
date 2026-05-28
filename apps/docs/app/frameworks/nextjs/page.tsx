import { CodeBlock } from "../../../components/CodeBlock";
import { OnThisPage } from "../../../components/OnThisPage";
import { PrevNext } from "../../../components/PrevNext";

// ── Code examples ─────────────────────────────────────────────────────────

const installCode = `npm install @vhyxseal/nextjs @vhyxseal/react @vhyxseal/core`;

const pluginSetupCode = `// next.config.ts
import { vhyxsealPlugin } from '@vhyxseal/nextjs'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // your existing config
}

export default vhyxsealPlugin({})(nextConfig)

// vhyxsealPlugin() automatically:
//   1. Injects headers for /__agent__/manifest.json (cache, ETag, version)
//   2. Injects rewrite: /__agent__/manifest.json → /api/vhyxseal-manifest
//   3. Injects headers for /__agent__/dashboard.json (no-cache)
//   4. Injects rewrite: /__agent__/dashboard.json → /api/vhyxseal-dashboard`;

const manifestRouteCode = `// app/api/vhyxseal-manifest/route.ts
import { handleManifestRoute } from '@vhyxseal/nextjs'
import type { ManifestConfig } from '@vhyxseal/core'

const config: ManifestConfig = {
  domain: process.env['VHYXSEAL_DOMAIN'] ?? "example.com",
  domainVerified: process.env['VHYXSEAL_DOMAIN_VERIFIED'] === "true",
  verificationToken: process.env['VHYXSEAL_VERIFICATION_TOKEN'] ?? "",
  agentPolicy: {
    allowedAgents: ["*"],
    requiresConfirmation: ["place-order", "delete-account"],
    rateLimits: {
      actionsPerMinute: 60,
      actionsPerHour: 500,
      manifestRequestsPerMinute: 10,
      perAgentSession: true,
    },
  },
  cacheDurationSeconds: 3600,
}

export async function GET(request: Request) {
  return handleManifestRoute({ request, config })
}`;

const dashboardRouteCode = `// app/api/vhyxseal-dashboard/route.ts
import { handleDashboardRoute } from '@vhyxseal/nextjs'

export async function GET(request: Request) {
  return handleDashboardRoute({ request })
}

// Dashboard served at /__agent__/dashboard.json
// Contains: action token stats, domain verification, audit log, agent policy
// Cache-Control: no-cache, no-store (always fresh)`;

const serverComponentCode = `// Server component — read the manifest server-side
import { getSealManifest } from '@vhyxseal/nextjs'

export default async function ManifestDebugPage() {
  // Fetches from /__agent__/manifest.json at request time
  const manifest = await getSealManifest({
    domain: process.env['VHYXSEAL_DOMAIN'] ?? "localhost:3000",
    domainVerified: false,
    verificationToken: "",
  })

  return (
    <pre>
      {JSON.stringify(
        { fingerprint: manifest?.fingerprint, components: manifest?.components.length },
        null, 2
      )}
    </pre>
  )
}`;

const providerCode = `// app/layout.tsx — SealProvider in App Router
"use client"
import { SealProvider } from '@vhyxseal/react'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SealProvider
      config={{
        domain: "example.com",
        domainVerified: false,
        verificationToken: "",
      }}
    >
      {children}
    </SealProvider>
  )
}

// Then in layout.tsx (Server Component):
// import { ClientProviders } from './ClientProviders'
// <ClientProviders>{children}</ClientProviders>`;

const versionNegotiationCode = `// Version negotiation — agent sends version headers
// Request:
//   vhyxseal-version: 1.0.0
//   vhyxseal-fallback: 0.9.0

// handleManifestRoute reads these headers and:
//   1. Tries to serve manifest compatible with vhyxseal-version
//   2. Falls back to vhyxseal-fallback if exact match not possible
//   3. Adds X-VhyxSeal-Degraded: true when serving fallback version

// Response headers:
//   X-VhyxSeal-Version: 1.0.0
//   X-VhyxSeal-Domain: example.com
//   X-VhyxSeal-Degraded: true (only when degraded)
//   X-VhyxSeal-Degraded-Reason: "..." (only when degraded)`;

const typesCode = `// TypeScript types from @vhyxseal/nextjs
import type {
  ManifestRouteConfig,     // Config for handleManifestRoute
  ManifestRouteRequest,    // Request shape for handleManifestRoute
  ManifestRouteResponse,   // Response shape (status, headers, body)
  DashboardRouteRequest,   // Request shape for handleDashboardRoute
  DashboardRouteResponse,  // Response shape for dashboard
} from '@vhyxseal/nextjs'`;

const appRouterExample = `// App Router — full example
// 1. next.config.ts
import { vhyxsealPlugin } from '@vhyxseal/nextjs'
export default vhyxsealPlugin({})({})

// 2. app/api/vhyxseal-manifest/route.ts
import { handleManifestRoute } from '@vhyxseal/nextjs'
export const GET = (req: Request) =>
  handleManifestRoute({ request: req, config: { domain: "example.com", domainVerified: false, verificationToken: "" } })

// 3. app/api/vhyxseal-dashboard/route.ts
import { handleDashboardRoute } from '@vhyxseal/nextjs'
export const GET = (req: Request) => handleDashboardRoute({ request: req })

// 4. app/layout.tsx (client wrapper)
"use client"
import { SealProvider } from '@vhyxseal/react'
export function Providers({ children }) {
  return <SealProvider config={{ domain: "example.com", domainVerified: false, verificationToken: "" }}>{children}</SealProvider>
}

// Manifest live at: /__agent__/manifest.json
// Dashboard live at: /__agent__/dashboard.json`;

const pagesRouterExample = `// Pages Router — SealProvider in _app.tsx
import type { AppProps } from 'next/app'
import { SealProvider } from '@vhyxseal/react'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SealProvider
      config={{
        domain: "example.com",
        domainVerified: false,
        verificationToken: "",
      }}
    >
      <Component {...pageProps} />
    </SealProvider>
  )
}

// pages/api/vhyxseal-manifest.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { handleManifestRoute } from '@vhyxseal/nextjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const result = await handleManifestRoute({
    request: req as unknown as Request,
    config: { domain: "example.com", domainVerified: false, verificationToken: "" },
  })
  res.status(result.status).json(result.body)
}`;

// ── Styles ────────────────────────────────────────────────────────────────

const h1Style: React.CSSProperties = { fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--docs-text)", marginBottom: "8px", marginTop: 0 };
const h2Style: React.CSSProperties = { fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--docs-text)", marginBottom: "16px", marginTop: "48px", paddingTop: "36px", borderTop: "1px solid var(--docs-border)" };
const h3Style: React.CSSProperties = { fontSize: "1rem", fontWeight: 600, color: "var(--docs-text)", marginBottom: "8px", marginTop: "24px" };
const leadStyle: React.CSSProperties = { fontSize: "1.0625rem", color: "var(--docs-text-muted)", lineHeight: 1.75, marginBottom: "24px", maxWidth: "660px" };
const noteStyle: React.CSSProperties = { fontSize: "13px", color: "var(--docs-text-muted)", lineHeight: 1.7, marginBottom: "12px" };

/**
 * Next.js adapter guide — nine sections.
 * Zero hardcoded colors — all via --docs-* or --vhyxseal-* CSS custom properties.
 */
export default function NextjsGuidePage(): React.ReactElement {
  return (
    <>
      <OnThisPage />
      <h1 style={h1Style}>Next.js Adapter</h1>
      <p style={leadStyle}>
        <code style={{ backgroundColor: "var(--docs-code-bg)", padding: "2px 5px", borderRadius: "4px", fontSize: "13px" }}>@vhyxseal/nextjs</code>{" "}
        provides a Next.js config plugin, manifest and dashboard route handlers,
        and server component utilities. It auto-injects the{" "}
        <code style={{ backgroundColor: "var(--docs-code-bg)", padding: "2px 5px", borderRadius: "4px", fontSize: "13px" }}>/__agent__/manifest.json</code>{" "}
        and{" "}
        <code style={{ backgroundColor: "var(--docs-code-bg)", padding: "2px 5px", borderRadius: "4px", fontSize: "13px" }}>/__agent__/dashboard.json</code>{" "}
        rewrites — no manual routing configuration required.
      </p>

      {/* 1 */}
      <section>
        <h2 style={h2Style}>What the Adapter Provides</h2>
        <ul style={{ ...noteStyle, paddingLeft: "20px", lineHeight: 2.2 }}>
          <li><strong style={{ color: "var(--docs-text)" }}>vhyxsealPlugin()</strong> — wraps next.config.ts to auto-inject rewrites and cache headers</li>
          <li><strong style={{ color: "var(--docs-text)" }}>handleManifestRoute()</strong> — route handler for app/api/vhyxseal-manifest/route.ts</li>
          <li><strong style={{ color: "var(--docs-text)" }}>handleDashboardRoute()</strong> — route handler for app/api/vhyxseal-dashboard/route.ts</li>
          <li><strong style={{ color: "var(--docs-text)" }}>getSealManifest()</strong> — fetch manifest in React Server Components</li>
        </ul>
      </section>

      {/* 2 */}
      <section>
        <h2 style={h2Style}>Installation</h2>
        <CodeBlock code={installCode} lang="bash" />
        <p style={{ ...noteStyle, marginTop: "8px" }}>
          Next.js ≥ 14 supported. App Router and Pages Router both covered.
        </p>
      </section>

      {/* 3 */}
      <section>
        <h2 style={h2Style}>Full Setup</h2>
        <CodeBlock code={pluginSetupCode} lang="typescript" filename="next.config.ts" />
        <CodeBlock code={manifestRouteCode} lang="typescript" filename="app/api/vhyxseal-manifest/route.ts" />
        <CodeBlock code={dashboardRouteCode} lang="typescript" filename="app/api/vhyxseal-dashboard/route.ts" />
      </section>

      {/* 4 */}
      <section>
        <h2 style={h2Style}>SealProvider in Next.js</h2>
        <p style={noteStyle}>
          SealProvider uses React Context and must be in a Client Component.
          Wrap it in a ClientProviders component and import it from a Server Component layout.
        </p>
        <CodeBlock code={providerCode} lang="tsx" />
      </section>

      {/* 5 */}
      <section>
        <h2 style={h2Style}>vhyxsealPlugin() Options</h2>
        <p style={noteStyle}>
          Currently accepts an empty options object. Future versions will
          add customization for the rewrite destination and header values.
          Plugin auto-injects both manifest and dashboard rewrites with
          independent duplicate guards — if you already have a rewrite for
          the canonical URL, the plugin leaves it unchanged.
        </p>
        <CodeBlock code={versionNegotiationCode} lang="typescript" />
      </section>

      {/* 6 */}
      <section>
        <h2 style={h2Style}>Server Component Utilities</h2>
        <CodeBlock code={serverComponentCode} lang="tsx" />
      </section>

      {/* 7 */}
      <section>
        <h2 style={h2Style}>TypeScript Types</h2>
        <CodeBlock code={typesCode} lang="typescript" />
      </section>

      {/* 8 */}
      <section>
        <h2 style={h2Style}>Common Patterns</h2>
        <h3 style={h3Style}>App Router — complete setup</h3>
        <CodeBlock code={appRouterExample} lang="typescript" />
        <h3 style={{ ...h3Style, marginTop: "32px" }}>Pages Router setup</h3>
        <CodeBlock code={pagesRouterExample} lang="tsx" />
      </section>

      {/* 9 */}
      <section style={{ paddingBottom: "80px" }}>
        <h2 style={h2Style}>Known Limitations</h2>
        <ul style={{ ...noteStyle, paddingLeft: "20px", lineHeight: 2.2 }}>
          <li>
            <strong style={{ color: "var(--docs-text)" }}>Underscore route constraint (DECISION-028):</strong>{" "}
            Next.js ignores route segments starting with underscore. The{" "}
            <code style={{ backgroundColor: "var(--docs-code-bg)", padding: "2px 4px", borderRadius: "3px", fontSize: "12px" }}>__agent__</code>{" "}
            directory cannot be used as a direct Next.js route. The plugin auto-injects a rewrite to solve this — the canonical URL{" "}
            <code style={{ backgroundColor: "var(--docs-code-bg)", padding: "2px 4px", borderRadius: "3px", fontSize: "12px" }}>/__agent__/manifest.json</code>{" "}
            works correctly for agents
          </li>
          <li>
            <code style={{ backgroundColor: "var(--docs-code-bg)", padding: "2px 4px", borderRadius: "3px", fontSize: "12px" }}>getSealManifest()</code>{" "}
            fetches over HTTP — not available during static export (next export). Use in dynamic routes only
          </li>
          <li>SealProvider must be in a Client Component — use a ClientProviders wrapper pattern in App Router</li>
          <li>
            The nextjs package exports dual CJS/ESM (DECISION-027) — it is consumed inside{" "}
            <code style={{ backgroundColor: "var(--docs-code-bg)", padding: "2px 4px", borderRadius: "3px", fontSize: "12px" }}>next.config.ts</code>{" "}
            which is compiled to CommonJS by Next.js
          </li>
        </ul>
      </section>
      <PrevNext />
    </>
  );
}
