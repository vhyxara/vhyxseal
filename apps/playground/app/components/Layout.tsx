import type { ReactNode } from "react";

export function DemoLayout({
  title,
  description,
  left,
  right,
}: {
  title: string;
  description: string;
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ color: "#f1f5f9", fontFamily: "monospace" }}>{title}</h1>
      <p style={{ color: "#94a3b8", marginBottom: "32px" }}>{description}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div>{left}</div>
        <div>{right}</div>
      </div>
    </div>
  );
}
