"use client";

import { useState } from "react";

interface CopyButtonProps {
  readonly code: string;
}

/**
 * Copy-to-clipboard button for code blocks.
 *
 * Shows a checkmark for 2 seconds after a successful copy, then resets.
 * Client component — uses navigator.clipboard.
 */
export function CopyButton({ code }: CopyButtonProps): React.ReactElement {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <button
      onClick={() => void handleCopy()}
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        background: "var(--docs-surface)",
        border: "1px solid var(--docs-border)",
        borderRadius: "6px",
        padding: "4px 10px",
        fontSize: "12px",
        color: copied ? "var(--vhyxseal-color-full)" : "var(--docs-text-muted)",
        cursor: "pointer",
        transition: "color 0.15s",
      }}
      aria-label="Copy code"
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}
