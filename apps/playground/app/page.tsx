import { ArrowRightIcon, LockIcon, WorkflowIcon } from '@vhyxui/icons';
import Link from 'next/link';

const LEVELS = [
  { href: '/level-0', level: 0, label: 'Level 0 · Zero effort', title: 'Drop it in', text: 'No contract at all. Intent is inferred from the tag, text and ARIA attributes.', fill: 25 },
  { href: '/level-1', level: 1, label: 'Level 1 · One prop', title: 'Name the intent', text: 'One intent prop. The vocabulary fills in safety, confirmation and reversibility.', fill: 55 },
  { href: '/level-2', level: 2, label: 'Level 2 · Partial', title: 'Override what matters', text: 'Set only the fields you care about; intent defaults fill in the rest.', fill: 80 },
  { href: '/level-3', level: 3, label: 'Level 3 · Full contract', title: 'Say everything', text: 'Preconditions, consequences and error states, defined outside your JSX.', fill: 100 },
];

export default function PlaygroundHomePage() {
  return (
    <div className="lab-page">
      <div className="lab-page-head">
        <span className="lab-eyebrow">Interactive playground</span>
        <h1>See what an agent sees</h1>
        <p>Walk the four adoption levels, then try to break a signed manifest in the security lab.</p>
      </div>

      <div className="lab-levels">
        {LEVELS.map((l) => (
          <Link key={l.href} href={l.href} className="lab-level" data-level={l.level}>
            <span className="lab-level-label">{l.label}</span>
            <strong>{l.title}</strong>
            <span className="lab-muted">{l.text}</span>
            <span className="lab-level-bar" aria-hidden="true"><span style={{ width: `${l.fill}%` }} /></span>
          </Link>
        ))}
      </div>

      <div className="lab-grid-2">
        <Link href="/security" className="lab-tool">
          <LockIcon size={22} />
          <strong>Security lab</strong>
          <span className="lab-muted">Tamper with a signed manifest and replay action tokens. Real HMAC-SHA256, in your browser.</span>
          <span className="lab-tool-cta">Open the lab <ArrowRightIcon size={14} /></span>
        </Link>
        <Link href="/visualize" className="lab-tool">
          <WorkflowIcon size={22} />
          <strong>Contract visualizer</strong>
          <span className="lab-muted">Paste any manifest and watch it play as an animated VhyxChart flow.</span>
          <span className="lab-tool-cta">Open the visualizer <ArrowRightIcon size={14} /></span>
        </Link>
      </div>
    </div>
  );
}
