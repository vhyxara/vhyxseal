'use client';

import { LockIcon } from '@vhyxui/icons';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge, HStack, Text, VhyxUIProvider } from '@vhyxui/react';
import { AppShell } from '@vhyxui/blocks';

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
      { label: 'Contract visualizer', href: '/visualize', icon: '◈' },
      { label: 'Security lab', href: '/security', icon: <LockIcon /> },
      { label: 'Agent manifest', href: '/__agent__/manifest.json', icon: '{}', external: true },
    ],
  },
];

/** App frame for the playground — built entirely from VhyxUI (dogfooding). */
export function Shell({ children }: { children: React.ReactNode }): React.ReactElement {
  const pathname = usePathname();
  const nav = NAV.map((g) => ({ ...g, items: g.items.map((i) => ({ ...i, active: i.href === pathname })) }));
  return (
    <VhyxUIProvider theme="dark" domain="playground.vhyxseal.com">
      <AppShell
        brand={<HStack gap={2}><Text as="span" weight="bold" mono>VhyxSeal</Text><Badge size="sm" variant="info">playground</Badge></HStack>}
        nav={nav}
        linkAs={Link}
        header={<Text size="sm" tone="subtle">Seal the contract between your UI and the agentic web</Text>}
      >
        {children}
      </AppShell>
    </VhyxUIProvider>
  );
}
