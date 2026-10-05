'use client';

import { ArrowRightIcon, EyeOffIcon, LayersIcon, PackageIcon, PenLineIcon, SparklesIcon, TicketIcon } from '@vhyxui/icons';
import React, { useMemo, useState } from 'react';
import { defineContract } from '@vhyxseal/core';
import { VhyxChart } from '@vhyxchart/react';
import { Badge, Button, HStack, Stack, VhyxUIProvider, toast } from '@vhyxui/react';
import { AGENT_FLOW } from '../components/diagram';
import { ManifestLive } from '../components/landing/ManifestLive';
import { SiteHeader } from '../components/landing/SiteHeader';
import { CountUp, Reveal } from '../components/landing/motion';
import { DOCS, GET_STARTED, GITHUB, NPM, PLAYGROUND, RFC, SECURITY_DOCS, SECURITY_LAB, VHYXCHART, VHYXUI, VHYXARA } from '../components/links';

const INSTALL = 'npm install @vhyxseal/react @vhyxseal/core';

const MARK = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    <path d="M12 15v2" />
  </svg>
);

const base = { requires: [], requiredPermissions: [], contractVersion: '1.0.0' } as const;

// Three real contracts, built in the browser by @vhyxseal/core. Intent defaults
// fill in the safety level, confirmation and reversibility.
const EXAMPLES = [
  {
    key: 'search',
    button: 'Search',
    variant: 'outline' as const,
    contract: { ...base, id: 'search-products', type: 'input' as const, intent: 'search', description: 'Searches the product catalogue', consequence: 'Shows matching products', affects: ['results'] },
  },
  {
    key: 'order',
    button: 'Place order',
    variant: 'primary' as const,
    contract: { ...base, id: 'place-order', type: 'action' as const, intent: 'place-order', description: 'Places the current cart as an order', consequence: 'Creates an order and charges the saved card', affects: ['orders', 'payments'] },
  },
  {
    key: 'delete',
    button: 'Delete account',
    variant: 'destructive' as const,
    contract: { ...base, id: 'delete-account', type: 'action' as const, intent: 'delete-account', description: 'Permanently deletes the account', consequence: 'All account data is erased', affects: ['account', 'data'] },
  },
];

const QUICK_START = `import { SealProvider, Button } from "@vhyxseal/react";
import { defineContract } from "@vhyxseal/core";

const placeOrder = defineContract({
  id: "place-order",
  type: "action",
  intent: "place-order",
  description: "Places the current cart as an order",
  consequence: "Creates an order and charges the saved card",
  affects: ["orders", "payments"],
  requires: [], requiredPermissions: [], contractVersion: "1.0.0",
});

<SealProvider config={{ domain: "example.com", domainVerified: false, verificationToken: "" }}>
  <Button contract={placeOrder} onClick={submitOrder}>Place order</Button>
</SealProvider>`;

const PACKAGES = [
  { name: 'core', text: 'Schema, inference, manifests, signing. Zero dependencies.' },
  { name: 'react', text: 'SealProvider, withAgentContract, hooks, headless components.' },
  { name: 'vue', text: 'Vue 3 plugin, composables and components.' },
  { name: 'vanilla', text: 'Custom elements for any framework, safe during SSR.' },
  { name: 'nextjs', text: 'Config plugin and the manifest route handler.' },
  { name: 'cli', text: 'init, simulate, verify, audit, diff, keygen, sign, visualize.' },
  { name: 'devtools', text: 'In-page panel to inspect every contract.' },
  { name: 'testing', text: 'Matchers, drift detection and a mock agent.' },
];

const SECURITY = [
  { icon: <LayersIcon size={18} />, title: 'Structural trust', text: 'Agents decide from typed fields — safety level, confirmation, destructive — never from free text alone.' },
  { icon: <PenLineIcon size={18} />, title: 'Signed manifests', text: 'HMAC-SHA256 over a canonical payload, bound to your domain. Tampering is detected.' },
  { icon: <SparklesIcon size={18} />, title: 'Injection sanitising', text: 'Every string field is checked for prompt injection and length-limited before an agent sees it.' },
  { icon: <TicketIcon size={18} />, title: 'Single-use tokens', text: 'Each agent action carries a short-lived token that is rejected on replay.' },
  { icon: <EyeOffIcon size={18} />, title: 'Abstract conditions', text: 'Contracts say user.hasPaymentMethod, never your database fields.' },
  { icon: <PackageIcon size={18} />, title: 'Zero dependencies', text: 'The core package ships no runtime dependencies — a smaller supply-chain surface.' },
];

function copyInstall(): void {
  void navigator.clipboard?.writeText(INSTALL).then(
    () => toast.success('Install command copied'),
    () => toast.danger('Could not copy — select the command instead'),
  );
}

function ContractInspector(): React.ReactElement {
  const [key, setKey] = useState('order');
  const example = EXAMPLES.find((e) => e.key === key) ?? EXAMPLES[1]!;
  const contract = useMemo(() => defineContract(example.contract), [example]);
  const agentView = JSON.stringify(
    {
      id: contract.id,
      intent: contract.intent,
      safetyLevel: contract.safetyLevel,
      requiresConfirmation: contract.requiresConfirmation,
      destructive: contract.destructive,
      reversible: contract.reversible,
      consequence: contract.consequence,
    },
    null,
    2,
  );
  return (
    <div className="lp-split">
      <Reveal>
        <div className="lp-tile" style={{ minHeight: 0 }}>
          <span className="lp-eyebrow" style={{ color: 'var(--vhyx-color-text-muted)' }}>What a person sees</span>
          <HStack gap={2} wrap role="tablist" aria-label="Example component">
            {EXAMPLES.map((e) => (
              <Button
                key={e.key}
                variant={e.key === key ? e.variant : 'ghost'}
                role="tab"
                aria-selected={e.key === key}
                onClick={() => setKey(e.key)}
                contract={{ id: 'contract-inspector', intent: 'apply-filter', description: 'Choose which example contract to inspect' }}
              >
                {e.button}
              </Button>
            ))}
          </HStack>
          <p>To a person, these are three buttons. Choose one to see what an AI agent reads for it.</p>
        </div>
      </Reveal>
      <Reveal delay={100}>
        <div className="lp-tile" style={{ minHeight: 0 }}>
          <HStack gap={2} align="center">
            <span className="lp-eyebrow" style={{ color: 'var(--vhyx-color-text-muted)' }}>What an agent reads</span>
            <Badge variant={contract.safetyLevel === 'low' ? 'success' : contract.safetyLevel === 'critical' ? 'danger' : 'warning'}>{contract.safetyLevel}</Badge>
            {contract.requiresConfirmation && <Badge variant="info">human confirms</Badge>}
          </HStack>
          <pre className="lp-code" aria-live="polite">{agentView}</pre>
          <p>Generated live by <code>defineContract()</code> from @vhyxseal/core.</p>
        </div>
      </Reveal>
    </div>
  );
}

const FAMILY = [
  { lib: 'ui', name: 'VhyxUI', role: 'Components', text: 'Accessible React components with VhyxSeal contracts built in — no extra code.', href: VHYXUI, current: false },
  { lib: 'seal', name: 'VhyxSeal', role: 'Agent contracts', text: 'The contract layer that tells AI agents what your UI does — and when to ask a person.', href: '/', current: true },
  { lib: 'chart', name: 'VhyxChart', role: 'Diagrams', text: 'Animated diagrams — vhyxseal visualize draws your contracts as a flow.', href: VHYXCHART, current: false },
] as const;

export default function Home() {
  return (
    <VhyxUIProvider>
      <SiteHeader
        brand="VhyxSeal"
        mark={MARK}
        current="seal"
        family={{ ui: VHYXUI, seal: '/', chart: VHYXCHART }}
        nav={[
          { label: 'How it works', href: '#how' },
          { label: 'Security', href: '#security' },
          { label: 'Packages', href: '#packages' },
          { label: 'Docs', href: DOCS },
          { label: 'Playground', href: PLAYGROUND },
        ]}
        github={GITHUB}
        getStarted={GET_STARTED}
      />

      <main id="vhyx-main">
        <section className="lp-hero">
          <div className="lp-aurora" aria-hidden="true"><span /><span /><span /></div>
          <div className="lp-inner lp-hero-grid">
            <div className="lp-hero-copy">
              <a className="lp-pill" href={SECURITY_LAB}><b>Live</b> Try to fool an agent in the security lab <ArrowRightIcon size={14} /></a>
              <h1 className="lp-title">
                Tell AI agents what your UI does — and when to <span className="lp-gradient-text">ask a human</span>.
              </h1>
              <p className="lp-lead">
                AI agents now use websites for people — but they only see pixels. VhyxSeal gives every component a
                machine-readable contract and publishes them as one signed manifest agents can trust.
              </p>
              <div className="lp-actions">
                <Button size="lg" asChild><a href={GET_STARTED}>Get started</a></Button>
                <Button size="lg" variant="outline" asChild><a href={SECURITY_LAB}>Try the security lab</a></Button>
              </div>
              <div className="lp-install">
                <span aria-hidden="true">$</span>
                <code>{INSTALL}</code>
                <button type="button" onClick={copyInstall}>Copy</button>
              </div>
            </div>
            <Reveal delay={150}>
              <ManifestLive />
            </Reveal>
          </div>
        </section>

        <div className="lp-inner">
          <Reveal className="lp-stats">
            <div className="lp-stat"><strong><CountUp to={8} /></strong><span>security layers</span></div>
            <div className="lp-stat"><strong><CountUp to={9} /></strong><span>packages</span></div>
            <div className="lp-stat"><strong><CountUp to={4} /></strong><span>frameworks: React, Vue, vanilla, Next.js</span></div>
            <div className="lp-stat"><strong><CountUp to={0} /></strong><span>runtime dependencies in core</span></div>
          </Reveal>
        </div>

        <section className="lp-section">
          <div className="lp-inner">
            <Reveal className="lp-head">
              <span className="lp-eyebrow">The problem</span>
              <h2 className="lp-h2">Agents are guessing</h2>
              <p className="lp-sub">A web page was built for eyes. An agent reading it has to infer everything that matters.</p>
            </Reveal>
            <div className="lp-problems">
              {[
                { title: 'What does it do?', text: 'A button labelled “Continue” could save a draft or charge a card.' },
                { title: 'How risky is it?', text: 'Nothing in the markup says an action is destructive or irreversible.' },
                { title: 'Who must approve?', text: 'There is no standard way to say “a person has to confirm this”.' },
              ].map((p, i) => (
                <Reveal key={p.title} delay={i * 80}>
                  <div className="lp-tile" style={{ minHeight: 0 }}>
                    <h3>{p.title}</h3>
                    <p>{p.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="lp-section">
          <div className="lp-inner">
            <Reveal className="lp-head">
              <span className="lp-eyebrow">One component, two audiences</span>
              <h2 className="lp-h2">OpenAPI for your UI</h2>
              <p className="lp-sub">Nothing changes for people. Agents get a precise, typed contract they can trust.</p>
            </Reveal>
            <ContractInspector />
          </div>
        </section>

        <section className="lp-section">
          <div className="lp-inner lp-split">
            <Reveal>
              <Stack gap={4}>
                <span className="lp-eyebrow">The manifest</span>
                <h2 className="lp-h2">How an agent uses your site</h2>
                <p className="lp-sub">
                  Your site publishes every contract as a signed manifest at <code>/__agent__/manifest.json</code>. The agent
                  verifies the signature, acts freely on low-risk actions, and stops to ask a person before anything that needs
                  confirmation. Each action carries a single-use token.
                </p>
                <p className="lp-sub" style={{ fontSize: 14 }}>
                  This page publishes its own manifest — try <a href="/__agent__/manifest.json">/__agent__/manifest.json</a>.
                  Diagram by <a href={VHYXCHART}>VhyxChart</a>.
                </p>
              </Stack>
            </Reveal>
            <Reveal delay={100}>
              <VhyxChart source={AGENT_FLOW} autoplay loop aria-label="Sequence of an AI agent reading a signed manifest and asking a person to confirm an order" />
            </Reveal>
          </div>
        </section>

        <section id="security" className="lp-section">
          <div className="lp-inner">
            <Reveal className="lp-head">
              <span className="lp-eyebrow">Security</span>
              <h2 className="lp-h2">Security is the foundation, not a feature</h2>
              <p className="lp-sub">VhyxSeal sits between agents and your site, so every layer assumes the one above it can fail.</p>
            </Reveal>
            <div className="lp-bento">
              {SECURITY.map((s, i) => (
                <Reveal key={s.title} className="lp-tile lp-tile--2" delay={(i % 3) * 80}>
                  <span className="lp-tile-icon">{s.icon}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </Reveal>
              ))}
            </div>
            <Reveal delay={100}>
              <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Button variant="outline" asChild><a href={SECURITY_DOCS}>Security architecture</a></Button>
                <Button variant="ghost" asChild><a href={RFC}>Read RFC-0001</a></Button>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="lp-section">
          <div className="lp-inner lp-split">
            <Reveal>
              <Stack gap={4}>
                <span className="lp-eyebrow">Quick start</span>
                <h2 className="lp-h2">Add it in minutes</h2>
                <p className="lp-sub">
                  Wrap your app in a provider and attach a contract. Intent defaults fill in the rest: <code>place-order</code> is
                  high risk and needs confirmation automatically.
                </p>
                <p className="lp-sub" style={{ fontSize: 14 }}>
                  Using <a href={VHYXUI}>VhyxUI</a>? Its components already carry contracts — no extra code.
                </p>
              </Stack>
            </Reveal>
            <Reveal delay={100}>
              <pre className="lp-code">{QUICK_START}</pre>
            </Reveal>
          </div>
        </section>

        <section id="packages" className="lp-section">
          <div className="lp-inner">
            <Reveal className="lp-head">
              <span className="lp-eyebrow">Packages</span>
              <h2 className="lp-h2">Works where you work</h2>
              <p className="lp-sub">One contract schema across frameworks, tooling and tests.</p>
            </Reveal>
            <div className="lp-packages">
              {PACKAGES.map((p, i) => (
                <Reveal key={p.name} delay={(i % 4) * 60}>
                  <div className="lp-pkg"><code>@vhyxseal/{p.name}</code><span>{p.text}</span></div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section">
          <div className="lp-inner">
            <Reveal className="lp-head lp-head--center">
              <div className="lp-mark" aria-hidden="true" />
              <h2 className="lp-h2">Part of the Vhyxara family</h2>
              <p className="lp-sub">Three libraries built to work together: components, the contracts agents read, and the diagrams that explain them.</p>
            </Reveal>
            <div className="lp-family-grid">
              {FAMILY.map((f, i) => (
                <Reveal key={f.lib} delay={i * 90}>
                  <a className="lp-fam" data-lib={f.lib} href={f.href} aria-current={f.current ? 'page' : undefined}>
                    <span className="lp-fam-name">{f.name}<small>{f.role}</small></span>
                    <p>{f.text}</p>
                    <span className="go">{f.current ? 'You are here' : `Visit ${f.name} →`}</span>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section">
          <div className="lp-inner">
            <Reveal className="lp-cta">
              <h2 className="lp-h2">Make your UI safe for agents</h2>
              <p className="lp-sub">Give every component a contract, publish a signed manifest, and keep people in control.</p>
              <div className="lp-actions" style={{ justifyContent: 'center' }}>
                <Button size="lg" asChild><a href={GET_STARTED}>Get started</a></Button>
                <Button size="lg" variant="outline" asChild><a href={PLAYGROUND}>Open playground</a></Button>
                <Button size="lg" variant="ghost" asChild><a href={GITHUB}>Star on GitHub</a></Button>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <div className="lp-inner">
        <footer className="lp-footer">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 700, color: 'var(--vhyx-color-text)', fontSize: 16 }}>
              <span style={{ color: 'var(--lp-brand)', display: 'inline-flex' }}>{MARK}</span>VhyxSeal
            </span>
            <span>Seal the contract between your UI and the agentic web. MIT licensed, by <a href={VHYXARA}>Vhyxara</a>.</span>
            <div className="lp-mark" aria-hidden="true" style={{ width: 120 }} />
          </div>
          <nav aria-label="Footer">
            <div><strong>Learn</strong><a href={DOCS}>Documentation</a><a href={SECURITY_DOCS}>Security architecture</a><a href={RFC}>RFC-0001</a></div>
            <div><strong>Try it</strong><a href={PLAYGROUND}>Playground</a><a href={SECURITY_LAB}>Security lab</a></div>
            <div><strong>Family</strong><a href={VHYXUI}>VhyxUI</a><a href={VHYXCHART}>VhyxChart</a><a href={VHYXARA}>Vhyxara</a></div>
            <div><strong>Project</strong><a href={NPM}>npm</a><a href={GITHUB}>GitHub</a></div>
          </nav>
        </footer>
      </div>
    </VhyxUIProvider>
  );
}
