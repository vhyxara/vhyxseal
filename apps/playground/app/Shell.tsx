'use client';

import { BracesIcon, LockIcon, MenuIcon, MoonIcon, SunIcon, WorkflowIcon, XIcon } from '@vhyxui/icons';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { VhyxUIProvider } from '@vhyxui/react';
import { DOCS, GITHUB, VHYXCHART, VHYXUI } from './links';

const NAV = [
  {
    label: 'Adoption levels',
    items: [
      { label: 'Overview', href: '/' },
      { label: 'Level 0 · Zero effort', href: '/level-0' },
      { label: 'Level 1 · One prop', href: '/level-1' },
      { label: 'Level 2 · Partial', href: '/level-2' },
      { label: 'Level 3 · Full contract', href: '/level-3' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { label: 'Security lab', href: '/security', icon: <LockIcon size={15} /> },
      { label: 'Contract visualizer', href: '/visualize', icon: <WorkflowIcon size={15} /> },
      { label: 'Agent manifest', href: '/__agent__/manifest.json', icon: <BracesIcon size={15} />, external: true },
    ],
  },
];

const MAIN = [
  { label: 'Docs', href: `${DOCS}/getting-started` },
  { label: 'Schema', href: `${DOCS}/schema` },
  { label: 'Security', href: `${DOCS}/security` },
  { label: 'CLI', href: `${DOCS}/cli` },
];

function GitHubIcon(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

type Theme = 'dark' | 'light';

/** Playground frame: the family header shared with the docs, a tools sidebar, and the page. */
export function Shell({ children }: { children: React.ReactNode }): React.ReactElement {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>('dark');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem('theme') === 'light') setTheme('light');
    } catch {
      // storage blocked: keep the dark default
    }
  }, []);

  function toggleTheme(): void {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem('theme', next); } catch { /* storage blocked */ }
  }

  return (
    <VhyxUIProvider theme={theme} domain="playground.vhyxseal.com">
      <header className="lab-header">
        <div className="lab-header-start">
          <button type="button" className="lab-icon-btn lab-hamburger" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="lab-sidebar" onClick={() => { setMenuOpen((o) => !o); }}>
            {menuOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
          </button>
          <Link href="/" className="lab-brand">
            <LockIcon size={22} className="lab-brand-mark" />
            <span>VhyxSeal</span>
            <span className="lab-brand-tag">Playground</span>
          </Link>
          <nav className="lab-family" aria-label="Vhyxara libraries">
            <a href={VHYXUI} className="lab-family-link">UI</a>
            <a href={DOCS} className="lab-family-link" aria-current="true">Seal</a>
            <a href={VHYXCHART} className="lab-family-link">Chart</a>
          </nav>
        </div>
        <nav className="lab-nav" aria-label="Main navigation">
          {MAIN.map((m) => <a key={m.label} href={m.href} className="lab-nav-link">{m.label}</a>)}
          <Link href="/" className="lab-nav-link" aria-current="page">Playground</Link>
        </nav>
        <div className="lab-header-actions">
          <button type="button" className="lab-icon-btn" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} onClick={toggleTheme}>
            {theme === 'dark' ? <SunIcon size={17} /> : <MoonIcon size={17} />}
          </button>
          <a href={GITHUB} className="lab-icon-btn" aria-label="VhyxSeal on GitHub" target="_blank" rel="noopener noreferrer"><GitHubIcon /></a>
        </div>
      </header>

      <div className="lab-body">
        <aside id="lab-sidebar" className="lab-sidebar" data-open={menuOpen ? 'true' : 'false'} aria-label="Playground">
          {NAV.map((group) => (
            <div key={group.label} className="lab-sidebar-group">
              <span className="lab-sidebar-label">{group.label}</span>
              {group.items.map((item) => {
                const props = {
                  className: 'lab-sidebar-link',
                  'aria-current': item.href === pathname ? ('page' as const) : undefined,
                  onClick: () => { setMenuOpen(false); },
                };
                const content = <>{'icon' in item ? item.icon : null}<span>{item.label}</span></>;
                return 'external' in item
                  ? <a key={item.href} href={item.href} {...props}>{content}</a>
                  : <Link key={item.href} href={item.href} {...props}>{content}</Link>;
              })}
            </div>
          ))}
        </aside>
        {menuOpen && <div className="lab-scrim" aria-hidden="true" onClick={() => { setMenuOpen(false); }} />}
        <main id="lab-main" className="lab-main">{children}</main>
      </div>
    </VhyxUIProvider>
  );
}
