'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { manifestToVhyxChart } from '@vhyxseal/cli/visualize';
import type { VhyxSealManifest } from '@vhyxseal/core';
import { VhyxChart } from '@vhyxchart/react';
import { Alert, Badge, Button, Card, Heading, HStack, Stack, Text, Textarea } from '@vhyxui/react';
import { TabbedPanel } from '@vhyxui/blocks';
import { demoManifest } from './demo-manifest';

const LEGEND: Array<[string, 'success' | 'info' | 'warning' | 'danger' | 'default']> = [
  ['low', 'success'],
  ['medium', 'info'],
  ['high', 'warning'],
  ['critical', 'danger'],
  ['sensitive', 'default'],
];

export default function VisualizePage(): React.ReactElement {
  // Timestamps inside the demo manifest are generated after mount to keep hydration stable.
  const [json, setJson] = useState('');
  useEffect(() => setJson(JSON.stringify(demoManifest(), null, 2)), []);
  const [direction, setDirection] = useState<'LR' | 'TB'>('LR');
  const [status, setStatus] = useState<string | null>(null);

  const result = useMemo((): { source: string; error: string | null } => {
    try {
      // Pasted JSON is untrusted; manifestToVhyxChart only reads known fields and sanitises labels.
      if (json === '') return { source: 'flowchart LR', error: null };
      const manifest = JSON.parse(json) as VhyxSealManifest;
      if (!Array.isArray(manifest.components)) throw new Error('Manifest has no "components" array');
      const normalised: VhyxSealManifest = {
        ...manifest,
        capabilities: Array.isArray(manifest.capabilities) ? manifest.capabilities : [],
        relationships: Array.isArray(manifest.relationships) ? manifest.relationships : [],
      };
      return { source: manifestToVhyxChart(normalised, direction), error: null };
    } catch (e) {
      return { source: '', error: e instanceof Error ? e.message : String(e) };
    }
  }, [json, direction]);

  const loadLive = async (): Promise<void> => {
    setStatus('Loading /__agent__/manifest.json …');
    try {
      const res = await fetch('/__agent__/manifest.json');
      setJson(JSON.stringify(await res.json(), null, 2));
      setStatus('Loaded this site’s live manifest.');
    } catch (e) {
      setStatus(`Could not load: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <Stack gap={6} style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Stack gap={2}>
        <Heading level={1} size="lg">Contract visualizer</Heading>
        <Text tone="subtle">
          Every VhyxSeal manifest becomes an animated map: components coloured by safety level, relationships as edges,
          and each sequence relationship as a playable scenario — exactly the path an AI agent would take.
          Same output as <code>vhyxseal visualize manifest.json</code>.
        </Text>
        <HStack gap={2} wrap>
          {LEGEND.map(([level, variant]) => <Badge key={level} variant={variant}>{level}</Badge>)}
        </HStack>
      </Stack>

      <Card variant="outline" padding="md">
        {result.error ? <Alert variant="danger" title="Invalid manifest">{result.error}</Alert> : <VhyxChart source={result.source} theme="dark" />}
      </Card>

      <TabbedPanel
        items={[
          {
            value: 'manifest',
            label: 'Manifest JSON',
            content: (
              <Stack gap={3}>
                <HStack gap={2} wrap>
                  <Button size="sm" variant="outline" onClick={() => setJson(JSON.stringify(demoManifest(), null, 2))}>Demo shop</Button>
                  <Button size="sm" variant="outline" onClick={() => void loadLive()}>Load this site’s manifest</Button>
                  <Button size="sm" variant="ghost" onClick={() => setDirection((d) => (d === 'LR' ? 'TB' : 'LR'))}>Direction: {direction}</Button>
                </HStack>
                {status && <Text size="sm" tone="subtle">{status}</Text>}
                <Textarea aria-label="Manifest JSON" value={json} onChange={(e) => setJson(e.target.value)} rows={16} style={{ fontFamily: 'var(--vhyx-font-mono)', fontSize: 12 }} />
              </Stack>
            ),
          },
          {
            value: 'source',
            label: 'Generated VhyxChart',
            content: <pre style={{ margin: 0, padding: 16, overflow: 'auto', fontSize: 12, background: 'var(--vhyx-color-bg-subtle)', borderRadius: 8 }}>{result.source}</pre>,
          },
        ]}
      />
    </Stack>
  );
}
