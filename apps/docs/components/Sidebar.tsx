/**
 * Docs site sidebar navigation.
 *
 * Server component — no hooks, no browser APIs. Renders a fixed left panel
 * with six navigation sections covering the full docs structure.
 *
 * Zero hardcoded color values — all colors via --docs-* CSS custom properties.
 * Theme switching is handled by next-themes on <html data-theme="…"> and
 * flows through automatically via the CSS custom property cascade.
 */

interface NavLink {
  readonly label: string;
  readonly href: string;
}

interface NavSection {
  readonly title: string;
  readonly links: readonly NavLink[];
}

const NAV_SECTIONS: readonly NavSection[] = [
  {
    title: "Introduction",
    links: [
      { label: "Getting Started", href: "/getting-started" },
    ],
  },
  {
    title: "Schema",
    links: [
      { label: "Schema Reference", href: "/schema" },
      { label: "Intent Vocabulary", href: "/intents" },
    ],
  },
  {
    title: "Frameworks",
    links: [
      { label: "React", href: "/frameworks/react" },
      { label: "Next.js", href: "/frameworks/nextjs" },
      { label: "Vue", href: "/frameworks/vue" },
      { label: "Vanilla JS", href: "/frameworks/vanilla" },
    ],
  },
  {
    title: "Security",
    links: [
      { label: "Security Architecture", href: "/security" },
    ],
  },
  {
    title: "Reference",
    links: [
      { label: "Error Codes", href: "/errors" },
    ],
  },
  {
    title: "RFC",
    links: [
      { label: "RFC-0001 — Contract Layer", href: "/rfc/0001" },
    ],
  },
  {
    title: "Releases",
    links: [
      { label: "Changelog", href: "/changelog" },
    ],
  },
] as const;

export function Sidebar(): React.ReactElement {
  return (
    <aside style={sidebarStyle} aria-label="Docs navigation">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title} style={sectionStyle}>
          <div style={sectionTitleStyle}>{section.title}</div>
          <ul style={listStyle}>
            {section.links.map((link) => (
              <li key={link.href}>
                <a href={link.href} style={linkStyle}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
// All colors via CSS custom properties — zero hardcoded hex values.

const sidebarStyle: React.CSSProperties = {
  position: "fixed",
  top: "var(--docs-header-height)",
  left: 0,
  width: "var(--docs-sidebar-width)",
  height: "calc(100vh - var(--docs-header-height))",
  overflowY: "auto",
  borderRight: "1px solid var(--docs-border)",
  backgroundColor: "var(--docs-surface)",
  padding: "24px 0",
};

const sectionStyle: React.CSSProperties = {
  marginBottom: "24px",
};

const sectionTitleStyle: React.CSSProperties = {
  padding: "0 20px 8px",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--docs-text-muted)",
};

const listStyle: React.CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
};

const linkStyle: React.CSSProperties = {
  display: "block",
  padding: "6px 20px",
  fontSize: "14px",
  color: "var(--docs-text-muted)",
  textDecoration: "none",
};
