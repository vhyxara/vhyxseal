import { codeToHtml, type BundledLanguage } from "shiki";
import { CopyButton } from "./CopyButton";

interface CodeBlockProps {
  readonly code: string;
  readonly lang?: BundledLanguage | "text";
  readonly filename?: string;
}

/**
 * Syntax-highlighted code block with a copy button.
 *
 * Server component — Shiki runs at render time on the server.
 * CopyButton is a thin client wrapper for clipboard interaction.
 *
 * Dual theme: dark-plus (dark mode) and github-light (light mode).
 * Theme switching is driven by data-theme on <html> via CSS variables
 * injected in globals.css.
 */
export async function CodeBlock({
  code,
  lang = "typescript",
  filename,
}: CodeBlockProps): Promise<React.ReactElement> {
  const html = await codeToHtml(code, {
    lang,
    themes: {
      dark: "dark-plus",
      light: "github-light",
    },
    defaultColor: false,
  });

  return (
    <div
      style={{
        position: "relative",
        borderRadius: "8px",
        border: "1px solid var(--docs-border)",
        overflow: "hidden",
      }}
    >
      {filename !== undefined && filename !== "" && (
        <div
          style={{
            fontSize: "12px",
            color: "var(--docs-text-muted)",
            padding: "8px 16px",
            borderBottom: "1px solid var(--docs-border)",
            backgroundColor: "var(--docs-code-bg)",
            fontFamily: "monospace",
          }}
        >
          {filename}
        </div>
      )}
      <div
        // biome-ignore lint: shiki output is trusted server-side HTML
        dangerouslySetInnerHTML={{ __html: html }}
        style={{ borderRadius: filename !== undefined ? "0 0 8px 8px" : "8px" }}
      />
      <CopyButton code={code} />
    </div>
  );
}
