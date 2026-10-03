'use client';

import { ShieldCheckIcon, ShieldXIcon } from '@vhyxui/icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  issueToken,
  randomHex,
  signManifest,
  verifyManifest,
  verifyToken,
  type VhyxSealManifest,
} from '@vhyxseal/core';
import { Button, Switch } from '@vhyxui/react';
import { demoManifest } from '../visualize/demo-manifest';

type TokenEvent = { id: number; at: string; ok: boolean; label: string; note: string };

let eventId = 0;

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
  const payment = received.components.find((c) => c.id === 'confirm-payment');

  const [tokenId, setTokenId] = useState<string | null>(null);
  const [events, setEvents] = useState<TokenEvent[]>([]);
  const claim = { contractId: 'checkout-contract', componentId: 'checkout-btn', intent: 'place-order' };
  const push = (ok: boolean, label: string, note: string): void =>
    setEvents((list) => [...list, { id: ++eventId, at: new Date().toLocaleTimeString('en-GB', { hour12: false }), ok, label, note }].slice(-6));

  return (
    <div className="lab-page">
      <div className="lab-page-head">
        <h1>Security lab</h1>
        <p>
          Try to fool an agent. Edit a signed manifest or replay a used token, and watch VhyxSeal catch it. Real
          HMAC-SHA256 signing and single-use tokens, running in your browser.
        </p>
      </div>

      <div className="lab-grid-2">
        <section className="lab-card" aria-labelledby="lab-tamper">
          <div className="lab-card-head">
            <strong id="lab-tamper">1 · Tamper with the manifest</strong>
            <Button size="sm" variant="outline" onClick={() => { setTamper(false); setWrongKey(false); }}>Reset</Button>
          </div>
          <pre className="lab-code">
            {'{\n  "id": "confirm-payment",\n  "intent": "make-payment",\n'}
            <span className={tamper ? 'lab-diff' : undefined}>{`  "safetyLevel": "${payment?.safetyLevel ?? ''}",${tamper ? '        ← was "critical"' : ''}\n`}</span>
            <span className={tamper ? 'lab-diff' : undefined}>{`  "requiresConfirmation": ${String(payment?.requiresConfirmation ?? '')},${tamper ? '  ← was true' : ''}\n`}</span>
            {`  "signature": "${signed.signature.slice(0, 22)}…"\n}`}
          </pre>
          <div className="lab-controls">
            <label className="lab-toggle"><Switch checked={tamper} onCheckedChange={setTamper} aria-label="Downgrade confirm-payment" /><span>Attacker downgrades <code>confirm-payment</code> to safety “low”</span></label>
            <label className="lab-toggle"><Switch checked={wrongKey} onCheckedChange={setWrongKey} aria-label="Verify with a different key" /><span>Agent verifies with a different key</span></label>
          </div>
          <dl className="lab-facts">
            <div><dt>Server secret</dt><dd>{secret || '…'}</dd></div>
            <div><dt>Signature</dt><dd>{signed.signature}</dd></div>
          </dl>
          <Button size="sm" variant="ghost" onClick={() => setSecret(randomHex(32))}>Rotate key</Button>
        </section>

        <section className="lab-verdict" data-valid={verification.valid ? 'true' : 'false'} aria-live="polite" aria-labelledby="lab-verdict-title">
          <div className="lab-verdict-head">
            {verification.valid ? <ShieldCheckIcon size={24} /> : <ShieldXIcon size={24} />}
            <strong id="lab-verdict-title">{verification.valid ? 'Signature valid' : 'Rejected — signature does not match'}</strong>
          </div>
          <p>
            {verification.valid
              ? 'The payload is exactly what the server signed, so the agent can trust these contracts.'
              : `${verification.reason ?? 'Verification failed'}. The agent ignores the whole manifest and falls back to the strictest defaults.`}
          </p>
          <ul className="lab-checks">
            <li data-tone="ok">✓ canonical payload rebuilt</li>
            <li data-tone={verification.valid ? 'ok' : 'stop'}>{verification.valid ? '✓ hmac matches' : '✗ hmac mismatch'}</li>
            <li data-tone={verification.valid ? 'ok' : 'warn'}>{verification.valid ? '→ agents act within each contract' : '→ every action needs a human'}</li>
          </ul>
        </section>
      </div>

      <section className="lab-card" aria-labelledby="lab-tokens">
        <div className="lab-card-head">
          <strong id="lab-tokens">2 · Replay an action token</strong>
          <span className="lab-pill">single use · 60 s</span>
        </div>
        <p className="lab-muted">Tokens are scoped to contract + component + intent. Use one twice, or for another intent, and it is refused.</p>
        <div className="lab-actions">
          <Button size="sm" onClick={() => { const id = issueToken(claim.contractId, claim.componentId, claim.intent); setTokenId(id); push(true, 'Issued', `token ${id.slice(0, 8)}… for place-order`); }}>Issue token</Button>
          <Button size="sm" variant="outline" disabled={!tokenId} onClick={() => { if (tokenId) { const ok = verifyToken(tokenId, claim); push(ok, ok ? 'Used' : 'Replay blocked', ok ? 'order placed, token burned' : 'same token sent again — refused'); } }}>Use token</Button>
          <Button size="sm" variant="ghost" disabled={!tokenId} onClick={() => { if (tokenId) { const ok = verifyToken(tokenId, { ...claim, intent: 'delete-account' }); push(ok, ok ? 'Accepted' : 'Misuse blocked', 'token reused for delete-account'); } }}>Misuse for delete-account</Button>
        </div>
        {events.length > 0 && (
          <ol className="lab-timeline" aria-live="polite">
            {events.map((e) => (
              <li key={e.id} data-ok={e.ok ? 'true' : 'false'}>
                <span className="lab-timeline-label">{e.at} · {e.label}</span>
                <span>{e.note}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
