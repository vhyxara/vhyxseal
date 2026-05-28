import { PrevNext } from "../../components/PrevNext";

export default function ChangelogPage(): React.ReactElement {
  return (
    <div>
      <h1
        style={{
          fontSize: "32px",
          fontWeight: 800,
          color: "var(--docs-text)",
          marginBottom: "8px",
        }}
      >
        Changelog
      </h1>
      <p
        style={{
          fontSize: "16px",
          color: "var(--docs-text-muted)",
          marginBottom: "48px",
          lineHeight: 1.6,
        }}
      >
        All notable changes to VhyxSeal packages. Most recent release first.
      </p>

      {/* ── 1.0.0-rc.1 ────────────────────────────────────────────────── */}
      <section style={{ marginBottom: "64px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "16px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <h2
            id="1-0-0-rc-1"
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--docs-text)",
              margin: 0,
              fontFamily: "monospace",
            }}
          >
            1.0.0-rc.1
          </h2>
          <span
            style={{
              fontSize: "14px",
              color: "var(--docs-text-muted)",
            }}
          >
            2026-05-26
          </span>
          <span
            style={{
              display: "inline-block",
              padding: "2px 10px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: "var(--vhyxseal-color-info)",
              color: "white",
            }}
          >
            Latest
          </span>
        </div>

        {/* Added */}
        <div style={{ marginBottom: "32px" }}>
          <h3
            id="added-1-0-0-rc-1"
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--vhyxseal-color-full)",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "var(--vhyxseal-color-full)",
                flexShrink: 0,
              }}
            />
            Added
          </h3>
          <ul
            style={{
              paddingLeft: "20px",
              margin: 0,
              color: "var(--docs-text)",
              lineHeight: 1.8,
              fontSize: "14px",
            }}
          >
            <li>Complete semantic contract layer for web UI components</li>
            <li>
              <code style={{ fontFamily: "monospace", fontSize: "13px" }}>@vhyxseal/core</code>{" "}
              — zero-dependency foundation with contract schema, inference engine, security layer,
              manifest generator, relationship/capability registries, action tokens, key management
            </li>
            <li>
              <code style={{ fontFamily: "monospace", fontSize: "13px" }}>@vhyxseal/react</code>{" "}
              — React 18+ adapter with SealProvider,{" "}
              <code style={{ fontFamily: "monospace", fontSize: "13px" }}>withAgentContract</code>{" "}
              HOC,{" "}
              <code style={{ fontFamily: "monospace", fontSize: "13px" }}>useContract</code> /{" "}
              <code style={{ fontFamily: "monospace", fontSize: "13px" }}>useCapability</code> /{" "}
              <code style={{ fontFamily: "monospace", fontSize: "13px" }}>useAgentAction</code>{" "}
              hooks
            </li>
            <li>
              <code style={{ fontFamily: "monospace", fontSize: "13px" }}>@vhyxseal/vue</code>{" "}
              — Vue 3 adapter with VhyxSealPlugin and composables
            </li>
            <li>
              <code style={{ fontFamily: "monospace", fontSize: "13px" }}>@vhyxseal/vanilla</code>{" "}
              — Web Components adapter (SealButton, SealInput, SealForm, SealNav, SealDisplay,
              SealConfirmation)
            </li>
            <li>
              <code style={{ fontFamily: "monospace", fontSize: "13px" }}>@vhyxseal/nextjs</code>{" "}
              — Next.js integration with{" "}
              <code style={{ fontFamily: "monospace", fontSize: "13px" }}>vhyxsealPlugin()</code>,{" "}
              <code style={{ fontFamily: "monospace", fontSize: "13px" }}>handleManifestRoute()</code>,{" "}
              <code style={{ fontFamily: "monospace", fontSize: "13px" }}>handleDashboardRoute()</code>
            </li>
            <li>
              <code style={{ fontFamily: "monospace", fontSize: "13px" }}>@vhyxseal/devtools</code>{" "}
              — Development panel and contract overlay
            </li>
            <li>
              <code style={{ fontFamily: "monospace", fontSize: "13px" }}>@vhyxseal/cli</code>{" "}
              — CLI tools: simulate, verify, audit, init
            </li>
            <li>
              <code style={{ fontFamily: "monospace", fontSize: "13px" }}>@vhyxseal/testing</code>{" "}
              — Test utilities: matchers and drift detection
            </li>
            <li>
              <code style={{ fontFamily: "monospace", fontSize: "13px" }}>@vhyxseal/style</code>{" "}
              — CSS design tokens for VhyxSeal tooling
            </li>
            <li>HMAC-SHA256 manifest signing with key management</li>
            <li>Single-use action tokens with 6-step verification</li>
            <li>Domain verification with HMAC-signed tokens</li>
            <li>Injection detection across 14 pattern categories</li>
            <li>
              DevTools audit dashboard at{" "}
              <code style={{ fontFamily: "monospace", fontSize: "13px" }}>/__agent__/dashboard.json</code>
            </li>
            <li>Chrome DevTools extension (Manifest V3)</li>
            <li>RFC-0001 open for community comment</li>
          </ul>
        </div>

        {/* Security */}
        <div style={{ marginBottom: "32px" }}>
          <h3
            id="security-1-0-0-rc-1"
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--vhyxseal-color-missing)",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "var(--vhyxseal-color-missing)",
                flexShrink: 0,
              }}
            />
            Security
          </h3>
          <ul
            style={{
              paddingLeft: "20px",
              margin: 0,
              color: "var(--docs-text)",
              lineHeight: 1.8,
              fontSize: "14px",
            }}
          >
            <li>
              Default agent policy is deny (
              <code style={{ fontFamily: "monospace", fontSize: "13px" }}>allowedAgents: []</code>)
            </li>
            <li>Timing-safe HMAC comparison throughout</li>
            <li>
              <code style={{ fontFamily: "monospace", fontSize: "13px" }}>crypto.randomBytes</code>{" "}
              for all token generation
            </li>
          </ul>
        </div>

        {/* Known Limitations */}
        <div>
          <h3
            id="known-limitations-1-0-0-rc-1"
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--vhyxseal-color-inferred)",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "var(--vhyxseal-color-inferred)",
                flexShrink: 0,
              }}
            />
            Known Limitations
          </h3>
          <ul
            style={{
              paddingLeft: "20px",
              margin: 0,
              color: "var(--docs-text)",
              lineHeight: 1.8,
              fontSize: "14px",
            }}
          >
            <li>
              <strong>Rate limit enforcement:</strong> schema defined,{" "}
              <code style={{ fontFamily: "monospace", fontSize: "13px" }}>AgentPolicy.rateLimits</code>{" "}
              middleware pending (1.1.0)
            </li>
            <li>
              <strong>Registry backend:</strong> local only, hosted registry planned for future
              release
            </li>
            <li>
              <strong>Multi-framework contract inheritance:</strong> planned — cross-framework
              registry not yet available
            </li>
          </ul>
        </div>
      </section>

      {/* ── Footer note ────────────────────────────────────────────────── */}
      <div
        style={{
          paddingTop: "32px",
          borderTop: "1px solid var(--docs-border)",
          fontSize: "14px",
          color: "var(--docs-text-muted)",
          lineHeight: 1.7,
        }}
      >
        <p style={{ margin: 0 }}>
          VhyxSeal follows{" "}
          <a
            href="https://semver.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            semantic versioning
          </a>
          . Within a major version, changes are additive only — fields are never removed or renamed.
          Breaking changes require a major version bump and the RFC process with a 12-month
          migration window. See{" "}
          <a href="/rfc/0001#versioning">RFC-0001 §7 Versioning Commitment</a> for the full policy.
        </p>
      </div>
      <PrevNext />
    </div>
  );
}
