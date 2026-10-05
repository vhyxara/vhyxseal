import React from "react";
import {
  ArrowRightIcon,
  BookOpenIcon,
  CodeIcon,
  FileTextIcon,
  PuzzleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TerminalIcon,
  TriangleAlertIcon,
  WorkflowIcon,
} from "@vhyxui/icons";
import { CopyButton } from "../components/CopyButton";
import { SearchLauncher } from "../components/home/SearchLauncher";
import { GITHUB, PLAYGROUND, SITE, VHYXARA, VHYXCHART, VHYXUI } from "../components/links";

const INSTALL = "pnpm add @vhyxseal/core @vhyxseal/react";

const STEPS = [
  { n: "01", title: "Install and wrap", text: "Add the packages, wrap your app in SealProvider, and your manifest goes live.", href: "/getting-started" },
  { n: "02", title: "Describe your actions", text: "Give a control an intent, or a full contract with safety level and consequences.", href: "/schema" },
  { n: "03", title: "Lock it down", text: "Sign the manifest, bind it to your domain and set what agents may do.", href: "/security" },
];

const SECTIONS = [
  { icon: <FileTextIcon />, title: "Contract schema", text: "Every field an agent reads: intent, safety, preconditions, consequences.", href: "/schema" },
  { icon: <SparklesIcon />, title: "Intent vocabulary", text: "Built-in intents with safe defaults, and how to register your own.", href: "/intents" },
  { icon: <ShieldCheckIcon />, title: "Security", text: "Eight layers: signing, domain binding, injection filtering, tokens and more.", href: "/security" },
  { icon: <PuzzleIcon />, title: "Frameworks", text: "React, Next.js, Vue and vanilla JS — one schema everywhere.", href: "/frameworks" },
  { icon: <TerminalIcon />, title: "CLI", text: "init, simulate, verify, audit, diff, keygen, sign and visualize.", href: "/cli" },
  { icon: <WorkflowIcon />, title: "Visualize", text: "Draw a manifest as an animated flow and see where agents must stop.", href: "/visualize" },
  { icon: <CodeIcon />, title: "Manifest endpoint", text: "What /__agent__/manifest.json returns and how agents fetch it.", href: "/__agent__/manifest.json" },
  { icon: <TriangleAlertIcon />, title: "Error codes", text: "Every VHYX_ error with its cause and the fix.", href: "/errors" },
  { icon: <BookOpenIcon />, title: "RFC-0001", text: "The specification: design goals, guarantees and versioning.", href: "/rfc/0001" },
];

const FRAMEWORKS = [
  { label: "React", href: "/frameworks/react" },
  { label: "Next.js", href: "/frameworks/nextjs" },
  { label: "Vue", href: "/frameworks/vue" },
  { label: "Vanilla JS", href: "/frameworks/vanilla" },
];

/** Docs start page: search, install, where to begin, and a map of the docs. The pitch lives at vhyxseal.com. */
export default function HomePage(): React.ReactElement {
  return (
    <div className="dh">
      <section className="dh-hero atmo-hero">
        <div className="atmo-aurora" aria-hidden="true"><span /><span /><span /></div>
        <div className="dh-inner dh-hero-inner">
          <a href={`${PLAYGROUND}/security`} className="dh-pill"><b>Live</b> Try to fool an agent in the security lab <ArrowRightIcon size="1em" /></a>
          <span className="atmo-eyebrow">Documentation</span>
          <h1 className="dh-title">Learn VhyxSeal, <span className="atmo-gradient-text">one contract at a time</span>.</h1>
          <p className="dh-lead">
            Set up the provider, describe what each action does, and publish a signed manifest agents can trust.
          </p>
          <div className="dh-actions">
            <SearchLauncher />
            <span className="dh-install">
              <span className="dh-install-prompt" aria-hidden="true">$</span>
              <code>{INSTALL}</code>
              <CopyButton code={INSTALL} />
            </span>
          </div>
        </div>
      </section>

      <section className="dh-section">
        <div className="dh-inner">
          <h2 className="dh-h2">Start here</h2>
          <div className="dh-steps">
            {STEPS.map((s) => (
              <a key={s.n} href={s.href} className="atmo-card">
                <span className="dh-step-n">{s.n}</span>
                <strong>{s.title}</strong>
                <p>{s.text}</p>
                <span className="atmo-card-more">Read <ArrowRightIcon size="1em" /></span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="dh-section">
        <div className="dh-inner">
          <h2 className="dh-h2">Explore the docs</h2>
          <div className="dh-grid">
            {SECTIONS.map((s) => (
              <a key={s.title} href={s.href} className="atmo-card">
                <span className="atmo-card-icon" aria-hidden="true">{s.icon}</span>
                <strong>{s.title}</strong>
                <p>{s.text}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="dh-section">
        <div className="dh-inner">
          <div className="dh-heading-row">
            <h2 className="dh-h2">Pick your framework</h2>
            <a href="/frameworks" className="dh-link">Compare adapters <ArrowRightIcon size="1em" /></a>
          </div>
          <div className="dh-chips">
            {FRAMEWORKS.map((f) => <a key={f.href} href={f.href} className="dh-chip">{f.label}</a>)}
          </div>
        </div>
      </section>

      <section className="dh-section">
        <div className="dh-inner">
          <div className="atmo-card dh-banner">
            <div>
              <strong>See what an agent sees</strong>
              <p>Walk the four adoption levels, tamper with a signed manifest in the security lab, or paste your own manifest into the visualizer.</p>
            </div>
            <div className="dh-banner-actions">
              <a href={PLAYGROUND} className="dh-btn dh-btn--primary">Open playground</a>
              <a href={SITE} className="dh-btn dh-btn--ghost">About VhyxSeal</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="dh-footer">
        <span className="atmo-family-bar" aria-hidden="true" />
        <div className="dh-footer-row">
          <span>A <a href={VHYXARA}>Vhyxara</a> project · MIT licensed</span>
          <span className="dh-footer-links">
            <a href={VHYXUI}>VhyxUI</a>
            <a href={VHYXCHART}>VhyxChart</a>
            <a href={GITHUB}>GitHub</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
