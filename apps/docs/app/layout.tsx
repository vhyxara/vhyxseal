import type { Metadata } from "next";
import { DocsNav } from "./components/Nav";

export const metadata: Metadata = {
  title: "VhyxSeal — Semantic contract layer for the agentic web",
  description: "OpenAPI for your UI layer. Make your web application readable and safe for AI agents.",
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
        <DocsNav />
        {children}
      </body>
    </html>
  );
}
