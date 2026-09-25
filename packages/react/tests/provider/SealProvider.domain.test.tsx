import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { useContext } from "react";
import { SealProvider } from "../../src/provider/SealProvider.js";
import { SealContext } from "../../src/provider/context.js";

describe("SealProvider — empty domain fallback", () => {
  it("generates a manifest for the current host instead of failing", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    let domain: string | undefined;
    function Probe(): null {
      domain = useContext(SealContext)?.manifest?.domain;
      return null;
    }
    render(
      <SealProvider config={{ domain: "", domainVerified: false, verificationToken: "" }}>
        <Probe />
      </SealProvider>,
    );
    expect(domain).toBe(window.location.hostname || "localhost");
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });
});
