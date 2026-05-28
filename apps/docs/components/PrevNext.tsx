"use client";

import { usePathname } from "next/navigation";

const PAGE_ORDER = [
  { label: "Getting Started", href: "/getting-started" },
  { label: "Schema Reference", href: "/schema" },
  { label: "Security Guide", href: "/security" },
  { label: "React Guide", href: "/frameworks/react" },
  { label: "Vue Guide", href: "/frameworks/vue" },
  { label: "Next.js Guide", href: "/frameworks/nextjs" },
  { label: "Vanilla JS Guide", href: "/frameworks/vanilla" },
  { label: "RFC-0001", href: "/rfc/0001" },
  { label: "Intent Vocabulary", href: "/intents" },
  { label: "Error Codes", href: "/errors" },
  { label: "Changelog", href: "/changelog" },
] as const;

export function PrevNext(): React.ReactElement {
  const pathname = usePathname();
  const idx = PAGE_ORDER.findIndex((p) => p.href === pathname);

  const prev = idx > 0 ? (PAGE_ORDER[idx - 1] ?? null) : null;
  const next =
    idx !== -1 && idx < PAGE_ORDER.length - 1
      ? (PAGE_ORDER[idx + 1] ?? null)
      : null;

  if (prev === null && next === null) return <></>;

  return (
    <nav
      aria-label="Previous and next pages"
      style={{
        display: "flex",
        justifyContent: "space-between",
        paddingTop: "32px",
        marginTop: "48px",
        borderTop: "1px solid var(--docs-border)",
        gap: "16px",
      }}
    >
      {prev !== null ? (
        <a
          href={prev.href}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            color: "var(--docs-link)",
            textDecoration: "none",
            fontSize: "14px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--docs-text-muted)",
              fontWeight: 600,
            }}
          >
            ← Previous
          </span>
          <span style={{ fontWeight: 600 }}>{prev.label}</span>
        </a>
      ) : (
        <div />
      )}
      {next !== null ? (
        <a
          href={next.href}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            alignItems: "flex-end",
            color: "var(--docs-link)",
            textDecoration: "none",
            fontSize: "14px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--docs-text-muted)",
              fontWeight: 600,
            }}
          >
            Next →
          </span>
          <span style={{ fontWeight: 600 }}>{next.label}</span>
        </a>
      ) : (
        <div />
      )}
    </nav>
  );
}
