import type { ReactNode } from 'react';
import { Heading, Stack, Text } from '@vhyxui/react';

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
    <Stack gap={6} style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <Stack gap={2}>
        <Heading level={1} size="lg" style={{ fontFamily: 'var(--vhyx-font-mono)' }}>{title}</Heading>
        <Text tone="subtle">{description}</Text>
      </Stack>
      <Stack direction="row" gap={6} align="start" collapseBelow="lg">
        <div style={{ flex: 1, minWidth: 0 }}>{left}</div>
        <div style={{ flex: 1, minWidth: 0 }}>{right}</div>
      </Stack>
    </Stack>
  );
}
