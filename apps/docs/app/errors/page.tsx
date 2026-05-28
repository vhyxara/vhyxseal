import { ErrorFilter } from "./ErrorFilter";
import { OnThisPage } from "../../components/OnThisPage";
import { PrevNext } from "../../components/PrevNext";

export default function ErrorsPage(): React.ReactElement {
  return (
    <div>
      <OnThisPage />
      <h1
        style={{
          fontSize: "32px",
          fontWeight: 800,
          color: "var(--docs-text)",
          marginBottom: "8px",
        }}
      >
        Error Codes
      </h1>
      <p
        style={{
          fontSize: "16px",
          color: "var(--docs-text-muted)",
          marginBottom: "16px",
          lineHeight: 1.6,
        }}
      >
        All 21 <code style={{ fontFamily: "monospace", fontSize: "14px" }}>VHYX_*</code> error
        codes from <code style={{ fontFamily: "monospace", fontSize: "14px" }}>@vhyxseal/core</code>.
        VhyxSeal errors are always typed — never plain strings. Every error includes a severity
        level, structured context, and a concrete suggestion for how to fix it.
      </p>

      <div
        style={{
          padding: "14px 18px",
          backgroundColor: "var(--docs-surface)",
          border: "1px solid var(--docs-border)",
          borderLeft: "4px solid var(--vhyxseal-color-info)",
          borderRadius: "0 6px 6px 0",
          marginBottom: "32px",
          fontSize: "14px",
          color: "var(--docs-text)",
          lineHeight: 1.6,
        }}
      >
        Errors at any severity level never crash the visual layer. In production, contract errors
        are logged silently and the component renders without a contract. In development, DevTools
        surfaces them prominently alongside a suggestion.
      </div>

      <ErrorFilter />
      <PrevNext />
    </div>
  );
}
