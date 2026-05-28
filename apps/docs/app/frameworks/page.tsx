export default function FrameworksPage(): React.ReactElement {
  const frameworks = [
    {
      label: "React",
      href: "/frameworks/react",
      description:
        "React 18+ adapter with SealProvider, withAgentContract HOC, and useContract / useCapability / useAgentAction hooks.",
    },
    {
      label: "Next.js",
      href: "/frameworks/nextjs",
      description:
        "Next.js integration with vhyxsealPlugin(), handleManifestRoute(), and App Router server component support.",
    },
    {
      label: "Vue",
      href: "/frameworks/vue",
      description:
        "Vue 3 adapter with VhyxSealPlugin and composables mirroring the React hook API.",
    },
    {
      label: "Vanilla JS",
      href: "/frameworks/vanilla",
      description:
        "Web Components adapter — SealButton, SealInput, SealForm, SealNav, SealDisplay, SealConfirmation.",
    },
  ] as const;

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
        Framework Guides
      </h1>
      <p
        style={{
          fontSize: "16px",
          color: "var(--docs-text-muted)",
          marginBottom: "48px",
          lineHeight: 1.6,
        }}
      >
        VhyxSeal ships first-party adapters for React, Next.js, Vue, and
        Vanilla JS. Every adapter wraps the same{" "}
        <code style={{ fontFamily: "monospace", fontSize: "14px" }}>
          @vhyxseal/core
        </code>{" "}
        — contracts defined in one framework are compatible with any other.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "16px",
        }}
      >
        {frameworks.map((fw) => (
          <a
            key={fw.href}
            href={fw.href}
            style={{
              display: "block",
              padding: "20px 24px",
              border: "1px solid var(--docs-border)",
              borderRadius: "8px",
              textDecoration: "none",
              backgroundColor: "var(--docs-surface)",
            }}
          >
            <div
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--docs-text)",
                marginBottom: "8px",
              }}
            >
              {fw.label}
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "var(--docs-text-muted)",
                lineHeight: 1.6,
              }}
            >
              {fw.description}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
