"use client";

import { usePathname } from "next/navigation";

/**
 * Docs site sidebar navigation.
 *
 * Client component — highlights the current page. Fixed left panel on desktop,
 * a slide-in drawer below 1024px (opened from the header menu button).
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
      { label: "CLI", href: "/cli" },
      { label: "Visualize contracts", href: "/visualize" },
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

interface SidebarProps {
  open?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ open = false, onNavigate }: SidebarProps): React.ReactElement {
  const pathname = usePathname() ?? "/";
  return (
    <aside id="seal-sidebar" className="seal-sidebar" data-open={open ? "true" : "false"} aria-label="Docs navigation">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title} className="seal-sidebar-section">
          <div className="seal-sidebar-title">{section.title}</div>
          <ul className="seal-sidebar-list">
            {section.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="seal-sidebar-link"
                  aria-current={pathname === link.href ? "page" : undefined}
                  onClick={onNavigate}
                >
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
