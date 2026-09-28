import React from "react";

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
  return <Svg {...props}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Svg>;
}

/** Circle with a check: healthy / no confirmation needed. */
export function CheckCircleIcon(props: StatusIconProps): React.ReactElement {
  return <Svg {...props}><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.5 2.5L16 9.5" /></Svg>;
}

/** Circle with a cross: missing or broken. */
export function XCircleIcon(props: StatusIconProps): React.ReactElement {
  return <Svg {...props}><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></Svg>;
}

/** Triangle with an exclamation mark: needs attention. */
export function AlertIcon(props: StatusIconProps): React.ReactElement {
  return <Svg {...props}><path d="M10.3 4.2 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" /><path d="M12 9.5v4" /><path d="M12 17h.01" /></Svg>;
}
