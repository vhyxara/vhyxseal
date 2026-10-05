'use client';

import React, { useEffect, useState } from 'react';

const CHECKS = ['Signature valid', 'Domain bound', 'Injection-clean'];

const STEPS = [
  { line: 'read  search-products', verdict: 'low · allowed', tone: 'ok' },
  { line: 'read  place-order', verdict: 'high · asks a person', tone: 'warn' },
  { line: 'read  delete-account', verdict: 'critical · asks a person', tone: 'stop' },
] as const;

/**
 * Hero visual: an agent fetches the signed manifest, each security check turns green in turn, then the agent
 * reads contracts and stops before risky actions. Loops; shows the finished state under reduced motion.
 */
export function ManifestLive(): React.ReactElement {
  // 0 fetching · 1–3 checks pass · 4–6 contract reads · 7 hold
  const [phase, setPhase] = useState(7);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return undefined;
    setPhase(0);
    const id = window.setInterval(() => setPhase((p) => (p >= 9 ? 0 : p + 1)), 850);
    return () => window.clearInterval(id);
  }, []);
  const status = phase === 0 ? 'fetching…' : '200 · signed';

  return (
    <div className="lp-frame">
      <div className="lp-frame-inner">
        <div className="lp-frame-bar" aria-hidden="true">
          <i />
          <i />
          <i />
          <span>agent session</span>
        </div>
        <div className="mf">
          <div className="mf-head">
            <span>GET /__agent__/manifest.json</span>
            <span className="mf-status" data-ok={phase > 0 ? 'true' : 'false'}>{status}</span>
          </div>
          <pre className="mf-json">
            {'{\n  '}<span className="k">&quot;domain&quot;</span>{': "shop.example",\n  '}<span className="k">&quot;components&quot;</span>{': 18,\n  '}<span className="k">&quot;capabilities&quot;</span>{': ["purchase-item", "manage-account"],\n  '}<span className="k">&quot;signature&quot;</span>{': "hmac-sha256:9f2c…41ab"\n}'}
          </pre>
          <div className="mf-checks">
            {CHECKS.map((c, i) => (
              <span key={c} className="mf-check" data-on={phase > i ? 'true' : 'false'}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                {c}
              </span>
            ))}
          </div>
          <ol className="mf-log">
            {STEPS.map((s, i) => (
              <li key={s.line} data-on={phase > 3 + i ? 'true' : 'false'} data-tone={s.tone}>
                <span>› {s.line}</span>
                <b>{s.verdict}</b>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
