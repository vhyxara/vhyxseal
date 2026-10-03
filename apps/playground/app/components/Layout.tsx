import type { ReactNode } from 'react';

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
    <div className="lab-page">
      <div className="lab-page-head">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="lab-grid-2 lab-grid-2--top">
        <div className="lab-col">{left}</div>
        <div className="lab-col">{right}</div>
      </div>
    </div>
  );
}
