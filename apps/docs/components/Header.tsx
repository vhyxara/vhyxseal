"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/**
 * Sticky docs site header.
 *
 * Client component — uses next-themes useTheme() to read and toggle the
 * active theme. Renders a sun/moon button that switches between light and
 * dark mode. Uses resolvedTheme (not theme) so "system" preference is
 * always resolved to an actual mode for display purposes.
 *
 * The Search button dispatches a custom "vhyxseal:opensearch" event.
 * The Search modal (rendered in layout.tsx) listens for this event.
 * This avoids prop drilling and state lifting across the layout.
 *
 * Zero hardcoded color values — all colors via --docs-* CSS custom properties.
 */
export function Header(): React.ReactElement {
  const { resolvedTheme, setTheme } = useTheme();

  // Avoid hydration mismatch — theme is unknown on the server.
  // Render a placeholder toggle until the component mounts.
  const [mounted, setMounted] = useState<boolean>(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  function toggleTheme(): void {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  }

  function openSearch(): void {
    window.dispatchEvent(new Event("vhyxseal:opensearch"));
  }

  return (
    <header style={headerStyle}>
      {/* Wordmark */}
      <a href="/" style={wordmarkStyle}>
        🔒 VhyxSeal
      </a>

      {/* Center nav */}
      <nav style={navStyle} aria-label="Main navigation">
        <a href="/getting-started" style={navLinkStyle}>
          Getting Started
        </a>
        <a href="/schema" style={navLinkStyle}>
          Schema
        </a>
        <a href="/security" style={navLinkStyle}>
          Security
        </a>
        <a href="/frameworks" style={navLinkStyle}>
          Frameworks
        </a>
        <a href="/rfc/0001" style={navLinkStyle}>
          RFC
        </a>
      </nav>

      {/* Right — Search, GitHub link, theme toggle */}
      <div style={actionsStyle}>
        {/* Search button — triggers the Search modal via custom event */}
        <button
          onClick={openSearch}
          style={searchButtonStyle}
          aria-label="Search documentation (Cmd+K)"
        >
          Search{" "}
          <kbd style={{ fontSize: "11px", opacity: 0.7 }}>⌘K</kbd>
        </button>

        <a
          href="https://github.com/vhyxara/vhyxseal"
          target="_blank"
          rel="noopener noreferrer"
          style={navLinkStyle}
          aria-label="VhyxSeal on GitHub"
        >
          GitHub
        </a>

        {/* Theme toggle — only rendered after mount to avoid hydration mismatch */}
        {mounted ? (
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} mode`}
            style={themeButtonStyle}
          >
            {resolvedTheme === "light" ? "🌙" : "☀️"}
          </button>
        ) : (
          // Placeholder preserves layout during SSR / before hydration
          <span style={themeButtonPlaceholderStyle} aria-hidden="true">
            ◐
          </span>
        )}
      </div>
    </header>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
// All colors via CSS custom properties — zero hardcoded hex values.

const headerStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  height: "var(--docs-header-height)",
  backgroundColor: "var(--docs-surface)",
  borderBottom: "1px solid var(--docs-border)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 24px",
  zIndex: 100,
  gap: "24px",
};

const wordmarkStyle: React.CSSProperties = {
  fontFamily: "monospace",
  fontWeight: "bold",
  fontSize: "15px",
  color: "var(--docs-text)",
  textDecoration: "none",
  flexShrink: 0,
  letterSpacing: "-0.01em",
};

const navStyle: React.CSSProperties = {
  display: "flex",
  gap: "20px",
  alignItems: "center",
  flex: 1,
  justifyContent: "center",
};

const navLinkStyle: React.CSSProperties = {
  color: "var(--docs-text-muted)",
  textDecoration: "none",
  fontSize: "14px",
  whiteSpace: "nowrap",
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  alignItems: "center",
  flexShrink: 0,
};

const searchButtonStyle: React.CSSProperties = {
  background: "none",
  border: "1px solid var(--docs-border)",
  borderRadius: "6px",
  padding: "6px 12px",
  color: "var(--docs-text-muted)",
  fontSize: "13px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const themeButtonStyle: React.CSSProperties = {
  background: "none",
  border: "1px solid var(--docs-border)",
  borderRadius: "6px",
  cursor: "pointer",
  padding: "4px 8px",
  color: "var(--docs-text-muted)",
  fontSize: "15px",
  lineHeight: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const themeButtonPlaceholderStyle: React.CSSProperties = {
  display: "inline-flex",
  width: "36px",
  height: "28px",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--docs-text-muted)",
  fontSize: "15px",
};
