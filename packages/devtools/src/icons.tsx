import React from "react";

// Inline copies of the Vhyxara drawings from @vhyxui/icons (packages here never depend on VhyxUI).

/** Props for the small DevTools status icons. */
export interface StatusIconProps {
  /** Accessible name. Omit for decorative icons. */
  title?: string;
}

function Svg({ title, children }: StatusIconProps & { children: React.ReactNode }): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ verticalAlign: "-0.125em", flexShrink: 0 }}
      focusable="false"
      {...(title !== undefined ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
    >
      {title !== undefined ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/** Padlock: the VhyxSeal mark in DevTools. */
export function LockIcon(props: StatusIconProps): React.ReactElement {
  return <Svg {...props}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /><path d="M12 15v2" /></Svg>;
}

/** Circle with a check: healthy / no confirmation needed. */
export function CheckCircleIcon(props: StatusIconProps): React.ReactElement {
  return <Svg {...props}><circle cx="12" cy="12" r="9" /><path d="m8.5 12.25 2.5 2.5 4.75-5" /></Svg>;
}

/** Circle with a cross: missing or broken. */
export function XCircleIcon(props: StatusIconProps): React.ReactElement {
  return <Svg {...props}><circle cx="12" cy="12" r="9" /><path d="m9.25 9.25 5.5 5.5M14.75 9.25l-5.5 5.5" /></Svg>;
}

/** Triangle with an exclamation mark: needs attention. */
export function AlertIcon(props: StatusIconProps): React.ReactElement {
  return <Svg {...props}><path d="M10.27 4.25 2.94 17A2 2 0 0 0 4.67 20h14.66a2 2 0 0 0 1.73-3L13.73 4.25a2 2 0 0 0-3.46 0Z" /><path d="M12 9.25v4" /><path d="M12 16.5h.01" /></Svg>;
}
