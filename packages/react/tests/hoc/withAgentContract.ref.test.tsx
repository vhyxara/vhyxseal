import { describe, it, expect, vi } from "vitest";
import { createRef, forwardRef } from "react";
import { render } from "@testing-library/react";
import { defineContract } from "@vhyxseal/core";
import { withAgentContract } from "../../src/hoc/index.js";

const contract = defineContract({
  id: "ref-test-btn",
  type: "action",
  intent: "submit-form",
  description: "Ref forwarding test",
  requires: [],
  requiredPermissions: [],
  consequence: "Nothing",
  affects: [],
  reversible: true,
  safetyLevel: "low",
  requiresConfirmation: false,
  destructive: false,
  contractVersion: "1.0.0",
});

describe("withAgentContract — refs and warnings", () => {
  it("forwards refs to the wrapped component", () => {
    const Inner = forwardRef<HTMLButtonElement, { label: string }>((props, ref) => (
      <button ref={ref}>{props.label}</button>
    ));
    const Wrapped = withAgentContract(Inner, contract);
    const ref = createRef<HTMLButtonElement>();
    // Wrapped is typed as ComponentType<P>; ref support is provided at runtime by forwardRef.
    const AnyWrapped = Wrapped as unknown as React.ComponentType<{ label: string; ref: React.Ref<HTMLButtonElement> }>;
    render(<AnyWrapped label="Go" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.textContent).toBe("Go");
  });

  it("warns only once per contract id outside a SealProvider", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const Wrapped = withAgentContract((): React.ReactElement => <span>x</span>, { ...contract, id: "warn-once" });
    render(<><Wrapped /><Wrapped /><Wrapped /></>);
    const matching = warn.mock.calls.filter((c) => String(c[0]).includes("warn-once"));
    expect(matching.length).toBe(1);
    warn.mockRestore();
  });
});
