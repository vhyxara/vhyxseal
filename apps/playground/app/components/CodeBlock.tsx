export function CodeBlock({ value }: { value: unknown }) {
  return (
    <pre
      style={{
        backgroundColor: "#1e293b",
        color: "#e2e8f0",
        padding: "16px",
        borderRadius: "8px",
        fontFamily: "monospace",
        fontSize: "12px",
        overflow: "auto",
        border: "1px solid #334155",
      }}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
