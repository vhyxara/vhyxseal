"use client";

import { LockIcon, MenuIcon, MoonIcon, SearchIcon, SunIcon, XIcon } from '@vhyxui/icons';
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { GITHUB, PLAYGROUND, VHYXCHART, VHYXUI } from "./links";

function GitHubIcon(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

const NAV: Array<{ label: string; href: string; match?: (path: string) => boolean }> = [
  { label: "Docs", href: "/getting-started", match: (p) => ["/getting-started", "/intents", "/frameworks", "/errors", "/rfc", "/changelog", "/visualize"].some((s) => p.startsWith(s)) },
  { label: "Schema", href: "/schema", match: (p) => p.startsWith("/schema") },
  { label: "Security", href: "/security", match: (p) => p.startsWith("/security") },
  { label: "CLI", href: "/cli", match: (p) => p.startsWith("/cli") },
  { label: "Playground", href: PLAYGROUND },
];

interface HeaderProps {
  menuOpen: boolean;
  onMenuToggle: () => void;
}

/** Top bar shared across the Vhyxara sites: brand + family | main menu (centred) | search, theme, GitHub. */
export function Header({ menuOpen, onMenuToggle }: HeaderProps): React.ReactElement {
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname() ?? "/";
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isDark = !mounted || resolvedTheme !== "light";

  return (
    <header className="seal-header">
      <div className="seal-header-start">
        <button
          type="button"
          className="seal-icon-btn seal-hamburger"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="seal-sidebar"
          onClick={onMenuToggle}
        >
          {menuOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
        </button>
        <a href="/" className="seal-brand">
          <LockIcon size={22} className="seal-brand-mark" />
          <span>VhyxSeal</span>
        </a>
        <nav className="seal-family" aria-label="Vhyxara libraries">
          <a href={VHYXUI} className="seal-family-link">UI</a>
          <a href="/" className="seal-family-link" aria-current="true">Seal</a>
          <a href={VHYXCHART} className="seal-family-link">Chart</a>
        </nav>
      </div>

      <nav className="seal-nav" aria-label="Main navigation">
        {NAV.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="seal-nav-link"
            aria-current={item.match?.(pathname) ? "page" : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="seal-header-actions">
        <button
          type="button"
          className="seal-search"
          aria-label="Search documentation (Cmd+K)"
          onClick={() => { window.dispatchEvent(new Event("vhyxseal:opensearch")); }}
        >
          <SearchIcon size={15} />
          <span className="seal-search-label">Search</span>
          <kbd>⌘K</kbd>
        </button>
        <button
          type="button"
          className="seal-icon-btn"
          aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
          onClick={() => { setTheme(isDark ? "light" : "dark"); }}
        >
          {isDark ? <SunIcon size={17} /> : <MoonIcon size={17} />}
        </button>
        <a href={GITHUB} className="seal-icon-btn" aria-label="VhyxSeal on GitHub" target="_blank" rel="noopener noreferrer">
          <GitHubIcon />
        </a>
      </div>
    </header>
  );
}
