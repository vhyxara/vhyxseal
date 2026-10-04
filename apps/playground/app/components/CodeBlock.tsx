export function CodeBlock({ value }: { value: unknown }) {
  return (
    // Contracts carry a lastVerified timestamp (set by defineContract), so the prerendered text and
    // the browser render differ by design; keep the server text instead of failing hydration.
    <pre
      suppressHydrationWarning
      style={{
        backgroundColor: "var(--seal-surface)",
        color: "var(--seal-text)",
        padding: "16px",
        borderRadius: "8px",
        fontFamily: "monospace",
        fontSize: "12px",
        overflow: "auto",
        border: "1px solid var(--seal-border)",
      }}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
