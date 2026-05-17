export function DocsNav() {
  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        height: "56px",
        backgroundColor: "#1e293b",
        borderBottom: "1px solid #334155",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <span style={{ fontFamily: "monospace", fontWeight: "bold", color: "#f1f5f9" }}>
        🔒 VhyxSeal
      </span>
      <div style={{ display: "flex", gap: "24px" }}>
        <a href="/" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "14px" }}>Home</a>
        <a href="/docs" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "14px" }}>Docs</a>
        <a href="/docs/getting-started" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "14px" }}>Get Started</a>
        <a href="https://github.com/vhyxara/vhyxseal" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "14px" }}>GitHub</a>
      </div>
    </nav>
  );
}
