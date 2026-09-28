'use client';

import React, { useMemo, useState } from 'react';
import { defineContract } from '@vhyxseal/core';
import { VhyxChart } from '@vhyxchart/react';
import { Badge, Button, Card, Container, Heading, HStack, Stack, Text, VhyxUIProvider, toast } from '@vhyxui/react';
import { CTASection, FeatureGrid, Hero, MarketingLayout } from '@vhyxui/blocks';
import { AGENT_FLOW } from '../components/diagram';
import { DOCS, GITHUB, NPM, RFC, VHYXCHART, VHYXUI, VHYXARA } from '../components/links';

const INSTALL = 'npm install @vhyxseal/react @vhyxseal/core';

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

function copyInstall(): void {
  void navigator.clipboard?.writeText(INSTALL).then(
    () => toast.success('Install command copied'),
    () => toast.danger('Could not copy — select the command instead'),
  );
}

function ContractInspector() {
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
    <div className="split">
      <Card variant="outline" padding="lg">
        <Stack gap={4}>
          <Text size="sm" tone="subtle">What a person sees</Text>
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
          <Text size="sm" tone="muted">
            To a person, these are three buttons. Choose one to see what an AI agent reads for it.
          </Text>
        </Stack>
      </Card>
      <Card variant="elevated" padding="lg">
        <Stack gap={3}>
          <HStack gap={2} align="center">
            <Text size="sm" tone="subtle">What an agent reads</Text>
            <Badge variant={contract.safetyLevel === 'low' ? 'success' : contract.safetyLevel === 'critical' ? 'danger' : 'warning'}>
              {contract.safetyLevel}
            </Badge>
            {contract.requiresConfirmation && <Badge variant="info">human confirms</Badge>}
          </HStack>
          <pre className="code" aria-live="polite">{agentView}</pre>
          <Text size="xs" tone="subtle">Generated live by <code>defineContract()</code> from @vhyxseal/core.</Text>
        </Stack>
      </Card>
    </div>
  );
}

export default function Home() {
  return (
    <VhyxUIProvider theme="system">
      <MarketingLayout
        navbar={{
          brand: <b>VhyxSeal</b>,
          links: [
            { label: 'How it works', href: '#how' },
            { label: 'Security', href: '#security' },
            { label: 'Packages', href: '#packages' },
            { label: 'RFC', href: RFC, external: true },
            { label: 'GitHub', href: GITHUB, external: true },
          ],
          actions: (
            <Button size="sm" asChild contract={{ id: 'get-started', intent: 'navigate', description: 'Open the VhyxSeal documentation' }}>
              <a href={DOCS}>Get started</a>
            </Button>
          ),
        }}
        footer={{
          brand: 'VhyxSeal',
          tagline: <>Seal the contract between your UI and the agentic web. MIT licensed, by <a href={VHYXARA} className="brand-link">Vhyxara</a>.</>,
          columns: [
            { title: 'Project', links: [{ label: 'Documentation', href: DOCS }, { label: 'RFC-0001', href: RFC }, { label: 'npm', href: NPM }, { label: 'GitHub', href: GITHUB }] },
            { title: 'Family', links: [{ label: 'VhyxUI — components', href: VHYXUI }, { label: 'VhyxChart — animated diagrams', href: VHYXCHART }] },
          ],
          legal: <>© 2026 <a href={VHYXARA} className="brand-link">Vhyxara</a></>,
        }}
      >
        <Hero
          eyebrow="Release candidate · React, Vue, vanilla, Next.js · MIT"
          title="Seal the contract between your UI and the agentic web."
          description="AI agents now use websites for people — but they only see pixels. VhyxSeal gives every component a machine-readable contract: what it does, how risky it is, and when a human must confirm."
          actions={[
            { label: 'Get started', href: DOCS },
            { label: 'Read the RFC', href: RFC, variant: 'outline' },
          ]}
        />

        <Container size="md">
          <div className="install">
              <pre className="code">{INSTALL}</pre>
            <Button variant="outline" onClick={copyInstall} contract={{ id: 'copy-install', intent: 'copy-text', description: 'Copy the npm install command' }}>
              Copy
            </Button>
          </div>
        </Container>

        <section className="section section--tint">
          <Container size="xl">
            <div className="section-head">
              <Heading level={2}>Agents are guessing</Heading>
              <Text tone="muted">A web page was built for eyes. An agent reading it has to infer everything that matters.</Text>
            </div>
            <div className="problems">
              {[
                { title: 'What does it do?', text: 'A button labelled “Continue” could save a draft or charge a card.' },
                { title: 'How risky is it?', text: 'Nothing in the markup says an action is destructive or irreversible.' },
                { title: 'Who must approve?', text: 'There is no standard way to say “a person has to confirm this”.' },
              ].map((p) => (
                <Card key={p.title} variant="outline" padding="lg">
                  <Stack gap={2}>
                    <Text weight="semibold">{p.title}</Text>
                    <Text size="sm" tone="muted">{p.text}</Text>
                  </Stack>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        <section id="how" className="section">
          <Container size="xl">
            <div className="section-head">
              <Heading level={2}>One component, two audiences</Heading>
              <Text tone="muted">Nothing changes for people. Agents get a precise, typed contract — OpenAPI for your UI.</Text>
            </div>
            <ContractInspector />
          </Container>
        </section>

        <section className="section section--tint">
          <Container size="xl">
            <div className="split">
              <Stack gap={4}>
                <Heading level={2}>How an agent uses your site</Heading>
                <Text tone="muted">
                  Your site publishes every contract as a signed manifest at <code>/__agent__/manifest.json</code>. The
                  agent verifies the signature, acts freely on low-risk actions, and stops to ask a person before anything
                  that needs confirmation. Each action carries a single-use token.
                </Text>
                <Text size="sm" tone="subtle">
                  This page publishes its own manifest — try <a href="/__agent__/manifest.json">/__agent__/manifest.json</a>.
                  Diagram by <a href={VHYXCHART}>VhyxChart</a>.
                </Text>
              </Stack>
              <Card variant="elevated" padding="lg">
                <VhyxChart source={AGENT_FLOW} autoplay loop controls aria-label="Sequence of an AI agent reading a signed manifest and asking a person to confirm an order" />
              </Card>
            </div>
          </Container>
        </section>

        <div id="security">
          <FeatureGrid
            title="Security is the foundation, not a feature"
            description="VhyxSeal sits between agents and your site, so every layer assumes the one above it can fail."
            features={[
              { icon: '🧱', title: 'Structural trust', description: 'Agents decide from typed fields — safety level, confirmation, destructive — never from free text alone.' },
              { icon: '✍️', title: 'Signed manifests', description: 'HMAC-SHA256 over a canonical payload, bound to your domain. Tampering is detected.' },
              { icon: '🧼', title: 'Injection sanitising', description: 'Every string field is checked for prompt injection and length-limited before an agent sees it.' },
              { icon: '🎟️', title: 'Single-use tokens', description: 'Each agent action carries a short-lived token that is rejected on replay.' },
              { icon: '🫥', title: 'Abstract conditions', description: 'Contracts say user.hasPaymentMethod, never your database fields.' },
              { icon: '📦', title: 'Zero dependencies', description: 'The core package ships no runtime dependencies — a smaller supply-chain surface.' },
            ]}
          />
        </div>

        <section className="section">
          <Container size="xl">
            <div className="split">
              <Stack gap={4}>
                <Heading level={2}>Add it in minutes</Heading>
                <Text tone="muted">
                  Wrap your app in a provider and attach a contract. Intent defaults fill in the rest: <code>place-order</code>{' '}
                  is high risk and needs confirmation automatically.
                </Text>
                <Text size="sm" tone="subtle">
                  Using <a href={VHYXUI}>VhyxUI</a>? Its components already carry contracts — no extra code.
                </Text>
              </Stack>
              <pre className="code">{QUICK_START}</pre>
            </div>
          </Container>
        </section>

        <section id="packages" className="section section--tint">
          <Container size="xl">
            <div className="section-head">
              <Heading level={2}>Works where you work</Heading>
              <Text tone="muted">One contract schema across frameworks, tooling and tests.</Text>
            </div>
            <div className="family">
              {PACKAGES.map((p) => (
                <Card key={p.name} variant="outline" padding="lg">
                  <Stack gap={2}>
                    <Text weight="semibold"><code>@vhyxseal/{p.name}</code></Text>
                    <Text size="sm" tone="muted">{p.text}</Text>
                  </Stack>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        <section className="section">
          <Container size="xl">
            <div className="section-head">
              <Heading level={2}>Part of the <a href={VHYXARA} className="brand-link">Vhyxara</a> family</Heading>
            </div>
            <div className="family">
              {[
                { name: 'VhyxUI', role: 'Components', text: 'Accessible React components with VhyxSeal contracts built in.', href: VHYXUI },
                { name: 'VhyxSeal', role: 'Agents', text: 'The contract layer between your UI and AI agents.', href: GITHUB },
                { name: 'VhyxChart', role: 'Diagrams', text: 'Animated diagrams — vhyxseal visualize draws your contracts.', href: VHYXCHART },
              ].map((p) => (
                <Card key={p.name} variant="outline" padding="lg">
                  <Stack gap={2}>
                    <HStack gap={2} align="center"><Text weight="semibold">{p.name}</Text><Badge>{p.role}</Badge></HStack>
                    <Text size="sm" tone="muted">{p.text}</Text>
                    <Text size="sm"><a href={p.href}>Learn more →</a></Text>
                  </Stack>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        <Container size="xl" style={{ paddingBlock: 'var(--vhyx-space-16)' }}>
          <CTASection
            title="Make your UI safe for agents"
            description="Give every component a contract, publish a signed manifest, and keep people in control."
            actions={[
              { label: 'Get started', href: DOCS },
              { label: 'Star on GitHub', href: GITHUB, variant: 'outline' },
            ]}
          />
        </Container>
      </MarketingLayout>
    </VhyxUIProvider>
  );
}
