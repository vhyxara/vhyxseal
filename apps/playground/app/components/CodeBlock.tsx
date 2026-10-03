export function CodeBlock({ value }: { value: unknown }) {
  return (
    <pre
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
