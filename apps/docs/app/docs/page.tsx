const sections = [
  {
    title: "Getting Started",
    href: "/docs/getting-started",
    description: "Install VhyxSeal, set up the Next.js plugin, and add your first contract.",
    color: "#22c55e",
  },
  {
    title: "Core Concepts",
    href: "/docs/concepts",
    description: "Component contracts, relationships, capabilities, and the manifest schema.",
    color: "#3b82f6",
  },
  {
    title: "Developer Experience",
    href: "/docs/concepts#four-levels",
    description: "The four progressive adoption levels — from zero-effort to full contract.",
    color: "#eab308",
  },
  {
    title: "Security",
    href: "/docs/concepts#security",
    description: "Eight security layers: manifest signing, domain binding, agent policy, and more.",
    color: "#ef4444",
  },
  {
    title: "API Reference",
    href: "/docs/concepts#api",
    description: "Full reference for @vhyxseal/core, @vhyxseal/react, and @vhyxseal/nextjs.",
    color: "#a855f7",
  },
];

export default function DocsPage() {
  return (
    <main style={{ maxWidth: "900px", margin: "0 auto", padding: "56px 24px" }}>
      <div style={{ marginBottom: "48px" }}>
        <h1 style={{ fontSize: "36px", fontWeight: 800, color: "#f8fafc", marginBottom: "12px" }}>
          Documentation
        </h1>
        <p style={{ fontSize: "17px", color: "#64748b", lineHeight: 1.7 }}>
          VhyxSeal is a semantic contract layer for web UI. These docs cover installation,
          core concepts, and the full API surface.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
          gap: "16px",
        }}
      >
        {sections.map(({ title, href, description, color }) => (
          <a
            key={title}
            href={href}
            style={{
              display: "block",
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "10px",
              padding: "24px",
              textDecoration: "none",
              transition: "border-color 0.15s",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: color,
                marginBottom: "14px",
              }}
            />
            <div
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#f1f5f9",
                marginBottom: "8px",
              }}
            >
              {title}
            </div>
            <div style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6 }}>
              {description}
            </div>
          </a>
        ))}
      </div>

      <div
        style={{
          marginTop: "56px",
          padding: "24px",
          backgroundColor: "#0f172a",
          border: "1px solid #334155",
          borderRadius: "8px",
          fontFamily: "monospace",
          fontSize: "13px",
          color: "#64748b",
        }}
      >
        <div style={{ color: "#3b82f6", marginBottom: "6px" }}>ℹ️  Alpha notice</div>
        VhyxSeal is in early alpha. APIs may change. The schema versioning contract
        (DECISION-009) guarantees additive-only changes within v1.x once stable.
        Not yet published to npm.
      </div>
    </main>
  );
}
