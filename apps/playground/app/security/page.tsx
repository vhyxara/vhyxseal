'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  issueToken,
  randomHex,
  signManifest,
  verifyManifest,
  verifyToken,
  type VhyxSealManifest,
} from '@vhyxseal/core';
import { Alert, Badge, Button, Card, Grid, Heading, HStack, Stack, Switch, Text } from '@vhyxui/react';
import { demoManifest } from '../visualize/demo-manifest';

type TokenLog = { at: string; ok: boolean; note: string };

function Mono({ children }: { children: React.ReactNode }): React.ReactElement {
  return <code style={{ fontFamily: 'var(--vhyx-font-mono)', fontSize: 12, wordBreak: 'break-all' }}>{children}</code>;
}

export default function SecurityLabPage(): React.ReactElement {
  // Generated after mount: random values must not differ between prerender and hydration.
  const [secret, setSecret] = useState('');
  useEffect(() => setSecret(randomHex(32)), []);
  const [tamper, setTamper] = useState(false);
  const [wrongKey, setWrongKey] = useState(false);
  const manifest = useMemo(demoManifest, [secret]);
  const key = useMemo(() => ({ algorithm: 'hmac-sha256' as const, keyHex: secret, domain: manifest.domain }), [secret, manifest.domain]);
  const signed = useMemo(() => (secret ? signManifest(manifest, key) : { signature: '…', signedAt: '', algorithm: 'hmac-sha256' }), [manifest, key, secret]);

  // What the agent receives: possibly tampered in transit.
  const received: VhyxSealManifest = useMemo(
    () =>
      tamper
        ? { ...manifest, components: manifest.components.map((c) => (c.id === 'confirm-payment' ? { ...c, safetyLevel: 'low', requiresConfirmation: false } : c)) }
        : manifest,
    [manifest, tamper],
  );
  const otherKey = useMemo(() => (secret ? randomHex(32) : ''), [secret]);
  const verifyKey = wrongKey ? { ...key, keyHex: otherKey } : key;
  const verification = secret ? verifyManifest(received, signed.signature, verifyKey) : { valid: false, reason: 'Generating key…' };

  const [tokenId, setTokenId] = useState<string | null>(null);
  const [log, setLog] = useState<TokenLog[]>([]);
  const claim = { contractId: 'checkout-contract', componentId: 'checkout-btn', intent: 'place-order' };
  const push = (ok: boolean, note: string): void => setLog((l) => [{ at: new Date().toLocaleTimeString(), ok, note }, ...l].slice(0, 6));

  return (
    <Stack gap={6} style={{ maxWidth: 1100, margin: '0 auto' }}>
      <Stack gap={2}>
        <Heading level={1} size="lg">Security lab</Heading>
        <Text tone="subtle">
          Real HMAC-SHA256 manifest signing and single-use action tokens, running in your browser — the same zero-dependency
          code runs on Node, edge runtimes and Deno.
        </Text>
      </Stack>

      <Grid minChildWidth="22rem" gap={6}>
        <Card variant="outline" padding="md">
          <Stack gap={4}>
            <HStack justify="between"><Heading level={2} size="xs">1 · Sign the manifest</Heading><Badge variant="info">hmac-sha256</Badge></HStack>
            <Text size="sm" tone="subtle">Server-side secret (never shipped to agents):</Text>
            <Mono>{secret}</Mono>
            <Button size="sm" variant="outline" onClick={() => setSecret(randomHex(32))}>Rotate key</Button>
            <Text size="sm" tone="subtle">Signature over the canonical manifest:</Text>
            <Mono>{signed.signature}</Mono>
          </Stack>
        </Card>

        <Card variant="outline" padding="md">
          <Stack gap={4}>
            <Heading level={2} size="xs">2 · Agent verifies</Heading>
            <HStack as="label" gap={3}><Switch checked={tamper} onCheckedChange={setTamper} aria-label="Tamper" /><Text as="span" size="sm">Attacker downgrades <code>confirm-payment</code> to safety “low”</Text></HStack>
            <HStack as="label" gap={3}><Switch checked={wrongKey} onCheckedChange={setWrongKey} aria-label="Wrong key" /><Text as="span" size="sm">Verify with a different key</Text></HStack>
            {verification.valid ? (
              <Alert variant="success" title="Signature valid">The agent can trust these contracts.</Alert>
            ) : (
              <Alert variant="danger" title="Rejected">{verification.reason} — the agent falls back to maximum-safety defaults.</Alert>
            )}
          </Stack>
        </Card>

        <Card variant="outline" padding="md">
          <Stack gap={4}>
            <HStack justify="between"><Heading level={2} size="xs">3 · Single-use action tokens</Heading><Badge variant="warning">60s TTL</Badge></HStack>
            <Text size="sm" tone="subtle">Scoped to contractId + componentId + intent. Replays and cross-component use are rejected.</Text>
            <HStack gap={2} wrap>
              <Button size="sm" onClick={() => { const id = issueToken(claim.contractId, claim.componentId, claim.intent); setTokenId(id); push(true, `issued ${id.slice(0, 12)}…`); }}>Issue token</Button>
              <Button size="sm" variant="outline" disabled={!tokenId} onClick={() => tokenId && push(verifyToken(tokenId, claim), 'submit place-order')}>Submit action</Button>
              <Button size="sm" variant="ghost" disabled={!tokenId} onClick={() => tokenId && push(verifyToken(tokenId, { ...claim, intent: 'delete-account' }), 'reuse for delete-account')}>Misuse</Button>
            </HStack>
            <Stack gap={1} aria-live="polite">
              {log.map((l, i) => (
                <HStack key={i} gap={2}><Badge variant={l.ok ? 'success' : 'danger'} size="sm">{l.ok ? 'accepted' : 'rejected'}</Badge><Text as="span" size="sm" mono>{l.at} · {l.note}</Text></HStack>
              ))}
            </Stack>
          </Stack>
        </Card>
      </Grid>
    </Stack>
  );
}
