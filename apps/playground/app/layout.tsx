import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VhyxSeal Playground — Interactive contract examples",
  description: "Interactive playground demonstrating all four VhyxSeal developer experience levels.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          backgroundColor: "#0f172a",
          color: "#f1f5f9",
        }}
      >
        <nav
          style={{
            borderBottom: "1px solid #1e293b",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <a
            href="/"
            style={{
              color: "#f1f5f9",
              textDecoration: "none",
              fontFamily: "monospace",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            VhyxSeal Playground
          </a>
          <a
            href="http://localhost:3000"
            style={{
              color: "#64748b",
              textDecoration: "none",
              fontSize: "13px",
            }}
          >
            ← Docs
          </a>
          <span style={{ color: "#334155", fontSize: "13px" }}>
            /
          </span>
          <a href="/level-0" style={{ color: "#64748b", textDecoration: "none", fontSize: "13px" }}>Level 0</a>
          <a href="/level-1" style={{ color: "#64748b", textDecoration: "none", fontSize: "13px" }}>Level 1</a>
          <a href="/level-2" style={{ color: "#64748b", textDecoration: "none", fontSize: "13px" }}>Level 2</a>
          <a href="/level-3" style={{ color: "#64748b", textDecoration: "none", fontSize: "13px" }}>Level 3</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
