const levels = [
  {
    href: "/level-0",
    label: "Level 0",
    title: "Zero Effort",
    description: "Drop in a component with no contract. The library infers intent from tag name, text, and ARIA attributes.",
    color: "#eab308",
    tag: "inferred",
  },
  {
    href: "/level-1",
    label: "Level 1",
    title: "One Prop",
    description: "Add a single intent prop. The intent vocabulary fills in safetyLevel, requiresConfirmation, and more.",
    color: "#3b82f6",
    tag: "partial",
  },
  {
    href: "/level-2",
    label: "Level 2",
    title: "Partial Contract",
    description: "Override specific fields. Intent defaults merge with your explicit values for a richer contract.",
    color: "#a855f7",
    tag: "mixed",
  },
  {
    href: "/level-3",
    label: "Level 3",
    title: "Full Contract",
    description: "Define the complete contract outside JSX. Agents get the full picture — preconditions, consequences, error states.",
    color: "#22c55e",
    tag: "full",
  },
];

export default function PlaygroundHomePage() {
  return (
    <main style={{ maxWidth: "900px", margin: "0 auto", padding: "64px 24px" }}>
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
        Interactive Playground
      </div>
      <h1
        style={{
          fontSize: "clamp(24px, 4vw, 40px)",
          fontWeight: 800,
          color: "#f8fafc",
          marginBottom: "12px",
          lineHeight: 1.2,
        }}
      >
        The four levels of VhyxSeal
      </h1>
      <p
        style={{
          fontSize: "16px",
          color: "#94a3b8",
          lineHeight: 1.7,
          maxWidth: "560px",
          marginBottom: "48px",
        }}
      >
        Every level adds value. No level is required to get to the next.
        Start with zero config and add contracts progressively.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
          gap: "20px",
        }}
      >
        {levels.map(({ href, label, title, description, color, tag }) => (
          <a
            key={href}
            href={href}
            style={{
              display: "block",
              backgroundColor: "#1e293b",
              border: `1px solid #334155`,
              borderRadius: "10px",
              padding: "24px",
              textDecoration: "none",
              transition: "border-color 0.15s",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "11px",
                  color,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 700,
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "10px",
                  color: "#475569",
                  backgroundColor: "#0f172a",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  border: "1px solid #334155",
                }}
              >
                {tag}
              </span>
            </div>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#f1f5f9",
                margin: "0 0 8px",
              }}
            >
              {title}
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "#94a3b8",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {description}
            </p>
            <div
              style={{
                marginTop: "16px",
                fontSize: "12px",
                color,
                fontFamily: "monospace",
              }}
            >
              Open demo →
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
