import { CheckIcon, FingerprintIcon, GlobeIcon, KeyIcon, LayersIcon, PackageIcon, ShieldCheckIcon, ShieldIcon, TimerIcon } from '@vhyxui/icons';
import { CodeBlock } from "../components/CodeBlock";
import { CopyButton } from "../components/CopyButton";
import { CheckoutFlow } from "../components/home/CheckoutFlow";
import { GITHUB, PLAYGROUND, VHYXARA, VHYXCHART, VHYXUI } from "../components/links";

const INSTALL = "pnpm add @vhyxseal/core @vhyxseal/react";

const step2Code = `import { SealProvider } from '@vhyxseal/react'

export default function App({ children }) {
  return <SealProvider>{children}</SealProvider>
}`;

const step3Code = `import { withAgentContract } from '@vhyxseal/react'
import { defineContract } from '@vhyxseal/core'

const contract = defineContract({
  intent: 'place-order',
  safetyLevel: 'high',
  requiresConfirmation: true,
  consequence: 'charges payment method and triggers fulfillment'
})

export const CheckoutButton = withAgentContract(
  ({ onClick }) => <button onClick={onClick}>Place Order</button>,
  contract
)`;

const LEVELS = [
  { level: 0, label: "Level 0 · zero effort", code: "<Button>Place order</Button>", fill: 25, text: "Intent inferred from text and ARIA" },
  { level: 1, label: "Level 1 · one prop", code: 'intent="place-order"', fill: 55, text: "Safety and confirmation filled in" },
  { level: 2, label: "Level 2 · partial", code: "contract={{ reversibleWindow: 300 }}", fill: 80, text: "Override the fields that matter" },
  { level: 3, label: "Level 3 · full contract", code: "defineContract({ … })", fill: 100, text: "Preconditions, consequences, errors" },
];

const LAYERS = [
  { icon: <KeyIcon size={16} />, text: "Signed manifests" },
  { icon: <ShieldIcon size={16} />, text: "Injection filtering" },
  { icon: <GlobeIcon size={16} />, text: "Domain binding" },
  { icon: <ShieldCheckIcon size={16} />, text: "Agent policy" },
  { icon: <FingerprintIcon size={16} />, text: "Single-use tokens" },
  { icon: <PackageIcon size={16} />, text: "Zero dependencies" },
  { icon: <LayersIcon size={16} />, text: "Data abstraction" },
  { icon: <TimerIcon size={16} />, text: "Rate limits" },
];

/** Landing page: hero with a live-looking manifest, adoption levels, security + flow, setup, footer. */
export default function HomePage(): React.ReactElement {
  return (
    <div className="seal-home">
      <section className="seal-hero seal-grid-bg">
        <div className="seal-home-inner seal-hero-grid">
          <div className="seal-hero-copy">
            <span className="seal-eyebrow">The contract layer for the agentic web</span>
            <h1 className="seal-hero-title">Tell AI agents what your UI does — and when to ask a human.</h1>
            <p className="seal-hero-lead">
              Every component gets a contract: intent, preconditions, consequences, safety. Your site
              publishes them as one signed manifest agents can trust.
            </p>
            <div className="seal-actions">
              <a href="/getting-started" className="seal-btn seal-btn--primary">Get started</a>
              <a href={PLAYGROUND} className="seal-btn seal-btn--ghost">Open security lab</a>
              <span className="seal-install">
                <span className="seal-install-prompt" aria-hidden="true">$</span>
                <code>{INSTALL}</code>
                <CopyButton code={INSTALL} />
              </span>
            </div>
          </div>

          <div className="seal-manifest" aria-label="Example manifest response">
            <div className="seal-manifest-head">
              <span>GET /__agent__/manifest.json</span>
              <span className="seal-manifest-status">200 · signed</span>
            </div>
            <pre>{"{\n  "}<span className="k">&quot;domain&quot;</span>{': "shop.example",\n  '}<span className="k">&quot;components&quot;</span>{": 18,\n  "}<span className="k">&quot;capabilities&quot;</span>{': ["purchase-item", "manage-account"],\n  '}<span className="k">&quot;signature&quot;</span>{': "hmac-sha256:9f2c…41ab"\n}'}</pre>
            <div className="seal-checks">
              <span className="seal-check"><CheckIcon size={14} /> Signature valid</span>
              <span className="seal-check"><CheckIcon size={14} /> Domain bound</span>
              <span className="seal-check"><CheckIcon size={14} /> Injection-clean</span>
            </div>
          </div>
        </div>
      </section>

      <section className="seal-section">
        <div className="seal-home-inner">
          <div className="seal-section-head">
            <h2 className="seal-h2">Adopt at your own pace</h2>
            <p className="seal-section-lead">Start with zero code. Each level makes the contract richer, and agents get safer at every step.</p>
          </div>
          <div className="seal-levels">
            {LEVELS.map((l) => (
              <div key={l.level} className="seal-level" data-level={l.level}>
                <span className="seal-mono-label seal-level-label">{l.label}</span>
                <code>{l.code}</code>
                <div className="seal-level-bar" aria-hidden="true"><span style={{ width: `${l.fill}%` }} /></div>
                <p className="seal-level-text">{l.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="seal-section">
        <div className="seal-home-inner seal-split">
          <div className="seal-panel">
            <h2>Eight layers of security</h2>
            <p className="seal-panel-text">An agent can only act on what your manifest declares, and every manifest is verified before it is read.</p>
            <ul className="seal-layers">
              {LAYERS.map((l) => <li key={l.text}>{l.icon}{l.text}</li>)}
            </ul>
            <a href="/security" className="seal-chip" style={{ alignSelf: "flex-start" }}>Security architecture →</a>
          </div>
          <div className="seal-panel">
            <span className="seal-mono-label seal-panel-label">Your manifest as a flow · VhyxChart</span>
            <CheckoutFlow />
            <p className="seal-panel-text">
              Run <code>vhyxseal visualize</code> to see exactly where agents must stop for a person.
            </p>
            <div className="seal-chips">
              <a href="/frameworks/react" className="seal-chip">React</a>
              <a href="/frameworks/nextjs" className="seal-chip">Next.js</a>
              <a href="/frameworks/vue" className="seal-chip">Vue</a>
              <a href="/frameworks/vanilla" className="seal-chip">Vanilla JS</a>
            </div>
          </div>
        </div>
      </section>

      <section className="seal-section">
        <div className="seal-home-inner">
          <div className="seal-section-head">
            <h2 className="seal-h2">Up in three minutes</h2>
            <p className="seal-section-lead">
              A button labelled &ldquo;Submit&rdquo; could place a $500 order or delete an account. The contract tells the agent which, before it acts.
            </p>
          </div>
          <div className="seal-steps">
            <div className="seal-step"><span className="seal-mono-label">01 · Install</span><CodeBlock code={INSTALL} lang="bash" /></div>
            <div className="seal-step"><span className="seal-mono-label">02 · Wrap your app</span><CodeBlock code={step2Code} lang="tsx" /></div>
            <div className="seal-step"><span className="seal-mono-label">03 · Add a contract</span><CodeBlock code={step3Code} lang="tsx" /></div>
          </div>
          <p className="seal-panel-text" style={{ marginTop: 20 }}>
            Your manifest is now live at <code>/__agent__/manifest.json</code>.
          </p>
        </div>
      </section>

      <footer className="seal-footer">
        <span>A <a href={VHYXARA}>Vhyxara</a> project · MIT licensed</span>
        <span className="seal-footer-links">
          <a href={VHYXUI}>VhyxUI</a>
          <a href={VHYXCHART}>VhyxChart</a>
          <a href={GITHUB}>GitHub</a>
        </span>
      </footer>
    </div>
  );
}
