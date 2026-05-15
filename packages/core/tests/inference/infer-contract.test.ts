import { describe, it, expect } from "vitest";
import { inferContract } from "../../src/inference/index.js";
import type { InferenceInput } from "../../src/inference/index.js";

// ---------------------------------------------------------------------------
// data-intent attribute — Priority 1
// ---------------------------------------------------------------------------

describe("data-intent attribute inference", () => {
  it("sets intent and defaults from a known data-intent, high confidence", () => {
    const result = inferContract({
      tagName: "button",
      dataAttributes: { "data-intent": "place-order" },
    });
    expect(result.confidence).toBe("high");
    expect(result.inferred.intent).toBe("place-order");
    expect(result.inferred.safetyLevel).toBe("high");
    expect(result.inferred.requiresConfirmation).toBe(true);
    expect(result.inferred.reversible).toBe(true);
    expect(result.inferred.destructive).toBe(false);
  });

  it("sets intent from an unknown data-intent with medium confidence", () => {
    const result = inferContract({
      tagName: "button",
      dataAttributes: { "data-intent": "custom-unregistered-action" },
    });
    expect(result.confidence).toBe("medium");
    expect(result.inferred.intent).toBe("custom-unregistered-action");
    // No defaults merged since intent is unknown
    expect(result.inferred.safetyLevel).toBeUndefined();
  });

  it("high confidence from data-intent is preserved even with tag-level signals", () => {
    const result = inferContract({
      tagName: "button",
      textContent: "Delete",
      dataAttributes: { "data-intent": "sign-out" },
    });
    expect(result.confidence).toBe("high");
    expect(result.inferred.intent).toBe("sign-out");
  });

  it("does not use data-intent when key is absent", () => {
    const result = inferContract({
      tagName: "button",
      dataAttributes: { "data-foo": "bar" },
    });
    expect(result.inferred.intent).toBeUndefined();
  });

  it("does not use data-intent when value is empty string", () => {
    const result = inferContract({
      tagName: "button",
      dataAttributes: { "data-intent": "" },
    });
    expect(result.inferred.intent).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// input[type] inference — Priority 2
// ---------------------------------------------------------------------------

describe("input type inference", () => {
  it("input[type=password] → collect-password intent, sensitive safety, high confidence", () => {
    const result = inferContract({ tagName: "input", inputType: "password" });
    expect(result.inferred.type).toBe("input");
    expect(result.inferred.intent).toBe("collect-password");
    expect(result.inferred.safetyLevel).toBe("sensitive");
    expect(result.confidence).toBe("high");
  });

  it("input[type=email] → collect-email intent, low safety, high confidence", () => {
    const result = inferContract({ tagName: "input", inputType: "email" });
    expect(result.inferred.type).toBe("input");
    expect(result.inferred.intent).toBe("collect-email");
    expect(result.inferred.safetyLevel).toBe("low");
    expect(result.confidence).toBe("high");
  });

  it("input[type=submit] → action type, submit-form intent, medium confidence", () => {
    const result = inferContract({ tagName: "input", inputType: "submit" });
    expect(result.inferred.type).toBe("action");
    expect(result.inferred.intent).toBe("submit-form");
    expect(result.confidence).toBe("medium");
  });

  it("input[type=search] → search intent, low safety, high confidence", () => {
    const result = inferContract({ tagName: "input", inputType: "search" });
    expect(result.inferred.type).toBe("input");
    expect(result.inferred.intent).toBe("search");
    expect(result.inferred.safetyLevel).toBe("low");
    expect(result.confidence).toBe("high");
  });

  it("input[type=text] → input type, low confidence, no intent", () => {
    const result = inferContract({ tagName: "input", inputType: "text" });
    expect(result.inferred.type).toBe("input");
    expect(result.inferred.intent).toBeUndefined();
    expect(result.confidence).toBe("low");
  });

  it("input with no inputType → input type, low confidence, no intent", () => {
    const result = inferContract({ tagName: "input" });
    expect(result.inferred.type).toBe("input");
    expect(result.inferred.intent).toBeUndefined();
    expect(result.confidence).toBe("low");
  });

  it("data-intent from P1 takes priority over input type intent inference", () => {
    const result = inferContract({
      tagName: "input",
      inputType: "email",
      dataAttributes: { "data-intent": "authenticate" },
    });
    expect(result.inferred.intent).toBe("authenticate");
    expect(result.confidence).toBe("high");
  });
});

// ---------------------------------------------------------------------------
// Semantic HTML tag inference — Priority 3
// ---------------------------------------------------------------------------

describe("semantic HTML tag inference", () => {
  it("button element → action type, medium confidence", () => {
    const result = inferContract({ tagName: "button" });
    expect(result.inferred.type).toBe("action");
    expect(result.confidence).toBe("medium");
  });

  it("a element with href → navigation type, navigate intent, high confidence", () => {
    const result = inferContract({ tagName: "a", href: "/dashboard" });
    expect(result.inferred.type).toBe("navigation");
    expect(result.inferred.intent).toBe("navigate");
    expect(result.confidence).toBe("high");
  });

  it("a element without href → action type, low confidence, no intent", () => {
    const result = inferContract({ tagName: "a" });
    expect(result.inferred.type).toBe("action");
    expect(result.inferred.intent).toBeUndefined();
    expect(result.confidence).toBe("low");
  });

  it("form element → input type, medium confidence", () => {
    const result = inferContract({ tagName: "form" });
    expect(result.inferred.type).toBe("input");
    expect(result.confidence).toBe("medium");
  });

  it("nav element → navigation type, high confidence", () => {
    const result = inferContract({ tagName: "nav" });
    expect(result.inferred.type).toBe("navigation");
    expect(result.confidence).toBe("high");
  });

  it("dialog element → confirmation type, medium confidence", () => {
    const result = inferContract({ tagName: "dialog" });
    expect(result.inferred.type).toBe("confirmation");
    expect(result.confidence).toBe("medium");
  });

  it("select element → input type, medium confidence", () => {
    const result = inferContract({ tagName: "select" });
    expect(result.inferred.type).toBe("input");
    expect(result.confidence).toBe("medium");
  });

  it("textarea element → input type, medium confidence", () => {
    const result = inferContract({ tagName: "textarea" });
    expect(result.inferred.type).toBe("input");
    expect(result.confidence).toBe("medium");
  });

  it("unknown tag → no type inferred, low confidence", () => {
    const result = inferContract({ tagName: "div" });
    expect(result.inferred.type).toBeUndefined();
    expect(result.confidence).toBe("low");
  });
});

// ---------------------------------------------------------------------------
// ARIA role inference — Priority 4
// ---------------------------------------------------------------------------

describe("ARIA role inference", () => {
  it("div with ariaRole=button → action type, confidence stays low (upgrade only applies from medium)", () => {
    const result = inferContract({ tagName: "div", ariaRole: "button" });
    expect(result.inferred.type).toBe("action");
    // div has no semantic hints → starts at "low"; upgrade only fires if was "medium"
    expect(result.confidence).toBe("low");
  });

  it("button element with ariaRole=button → high confidence", () => {
    const result = inferContract({ tagName: "button", ariaRole: "button" });
    expect(result.inferred.type).toBe("action");
    expect(result.confidence).toBe("high");
  });

  it("ariaRole=dialog → confirmation type", () => {
    const result = inferContract({ tagName: "div", ariaRole: "dialog" });
    expect(result.inferred.type).toBe("confirmation");
  });

  it("ariaRole=alertdialog → confirmation type", () => {
    const result = inferContract({ tagName: "div", ariaRole: "alertdialog" });
    expect(result.inferred.type).toBe("confirmation");
  });

  it("ariaRole=link → navigation type", () => {
    const result = inferContract({ tagName: "span", ariaRole: "link" });
    expect(result.inferred.type).toBe("navigation");
  });

  it("ariaRole=textbox → input type", () => {
    const result = inferContract({ tagName: "div", ariaRole: "textbox" });
    expect(result.inferred.type).toBe("input");
  });

  it("ariaRole=searchbox → input type", () => {
    const result = inferContract({ tagName: "div", ariaRole: "searchbox" });
    expect(result.inferred.type).toBe("input");
  });

  it("ariaRole=navigation → navigation type, high confidence", () => {
    const result = inferContract({ tagName: "div", ariaRole: "navigation" });
    expect(result.inferred.type).toBe("navigation");
    expect(result.confidence).toBe("high");
  });

  it("ARIA overrides type derived from tag semantics", () => {
    // button says "action", but ariaRole=textbox should override
    const result = inferContract({ tagName: "button", ariaRole: "textbox" });
    expect(result.inferred.type).toBe("input");
  });
});

// ---------------------------------------------------------------------------
// Text content heuristics — Priority 5
// ---------------------------------------------------------------------------

describe("text content heuristics", () => {
  it("button with text 'Delete item' → delete-item intent", () => {
    const result = inferContract({ tagName: "button", textContent: "Delete item" });
    expect(result.inferred.intent).toBe("delete-item");
    expect(result.inferred.type).toBe("action");
  });

  it("button with text 'Sign out' → sign-out intent", () => {
    const result = inferContract({ tagName: "button", textContent: "Sign out" });
    expect(result.inferred.intent).toBe("sign-out");
  });

  it("button with text 'Log out' → sign-out intent", () => {
    const result = inferContract({ tagName: "button", textContent: "Log out" });
    expect(result.inferred.intent).toBe("sign-out");
  });

  it("button with text 'Logout' → sign-out intent", () => {
    const result = inferContract({ tagName: "button", textContent: "Logout" });
    expect(result.inferred.intent).toBe("sign-out");
  });

  it("button with text 'Pay now' → place-order intent with defaults merged", () => {
    const result = inferContract({ tagName: "button", textContent: "Pay now" });
    expect(result.inferred.intent).toBe("place-order");
    expect(result.inferred.safetyLevel).toBe("high");
    expect(result.inferred.requiresConfirmation).toBe(true);
  });

  it("button with text 'Checkout' → place-order intent", () => {
    const result = inferContract({ tagName: "button", textContent: "Checkout" });
    expect(result.inferred.intent).toBe("place-order");
  });

  it("button with text 'Purchase' → place-order intent", () => {
    const result = inferContract({ tagName: "button", textContent: "Purchase" });
    expect(result.inferred.intent).toBe("place-order");
  });

  it("button with text 'Send message' → send-message intent", () => {
    const result = inferContract({ tagName: "button", textContent: "Send message" });
    expect(result.inferred.intent).toBe("send-message");
  });

  it("button with text 'Search' → search intent", () => {
    const result = inferContract({ tagName: "button", textContent: "Search" });
    expect(result.inferred.intent).toBe("search");
  });

  it("button with text 'Upload file' → upload-file intent", () => {
    const result = inferContract({ tagName: "button", textContent: "Upload file" });
    expect(result.inferred.intent).toBe("upload-file");
  });

  it("button with text 'Download' → download-file intent", () => {
    const result = inferContract({ tagName: "button", textContent: "Download" });
    expect(result.inferred.intent).toBe("download-file");
  });

  it("button with text 'Share' → share-item intent", () => {
    const result = inferContract({ tagName: "button", textContent: "Share" });
    expect(result.inferred.intent).toBe("share-item");
  });

  it("button with text 'Publish' → publish-content intent", () => {
    const result = inferContract({ tagName: "button", textContent: "Publish" });
    expect(result.inferred.intent).toBe("publish-content");
  });

  it("button with text 'Sign in' → sign-in intent", () => {
    const result = inferContract({ tagName: "button", textContent: "Sign in" });
    expect(result.inferred.intent).toBe("sign-in");
  });

  it("button with text 'Login' → sign-in intent", () => {
    const result = inferContract({ tagName: "button", textContent: "Login" });
    expect(result.inferred.intent).toBe("sign-in");
  });

  it("button with text 'Submit' → submit-form intent", () => {
    const result = inferContract({ tagName: "button", textContent: "Submit" });
    expect(result.inferred.intent).toBe("submit-form");
  });

  it("button with text 'Save' → submit-form intent", () => {
    const result = inferContract({ tagName: "button", textContent: "Save" });
    expect(result.inferred.intent).toBe("submit-form");
  });

  it("button with text 'Cancel booking' → cancel-booking intent", () => {
    const result = inferContract({ tagName: "button", textContent: "Cancel booking" });
    expect(result.inferred.intent).toBe("cancel-booking");
  });

  it("button with unrecognizable text → no intent inferred", () => {
    const result = inferContract({ tagName: "button", textContent: "Frobnicate" });
    expect(result.inferred.intent).toBeUndefined();
    expect(result.inferred.type).toBe("action");
  });

  it("text heuristics are case-insensitive", () => {
    const result = inferContract({ tagName: "button", textContent: "SIGN OUT" });
    expect(result.inferred.intent).toBe("sign-out");
  });

  it("text heuristics are not applied for non-action types", () => {
    const result = inferContract({ tagName: "form", textContent: "Delete" });
    // form → input type, so text heuristic should not set intent
    expect(result.inferred.type).toBe("input");
    expect(result.inferred.intent).toBeUndefined();
  });

  it("text heuristics confidence is medium, not high", () => {
    const result = inferContract({ tagName: "button", textContent: "Sign out" });
    expect(result.confidence).toBe("medium");
  });

  it("data-intent from P1 takes priority over text heuristic", () => {
    const result = inferContract({
      tagName: "button",
      textContent: "Delete",
      dataAttributes: { "data-intent": "sign-out" },
    });
    expect(result.inferred.intent).toBe("sign-out");
    expect(result.confidence).toBe("high");
  });
});

// ---------------------------------------------------------------------------
// Missing fields
// ---------------------------------------------------------------------------

describe("missing fields", () => {
  it("id is always in the missing array", () => {
    const result = inferContract({ tagName: "button" });
    expect(result.missing).toContain("id");
  });

  it("description is always in the missing array", () => {
    const result = inferContract({ tagName: "button" });
    expect(result.missing).toContain("description");
  });

  it("contractVersion is always in the missing array", () => {
    const result = inferContract({ tagName: "button" });
    expect(result.missing).toContain("contractVersion");
  });

  it("requires is always in the missing array", () => {
    const result = inferContract({ tagName: "button" });
    expect(result.missing).toContain("requires");
  });

  it("requiredPermissions is always in the missing array", () => {
    const result = inferContract({ tagName: "button" });
    expect(result.missing).toContain("requiredPermissions");
  });

  it("consequence is always in the missing array", () => {
    const result = inferContract({ tagName: "button" });
    expect(result.missing).toContain("consequence");
  });

  it("affects is always in the missing array", () => {
    const result = inferContract({ tagName: "button" });
    expect(result.missing).toContain("affects");
  });

  it("safetyLevel is in missing when no intent defaults are available", () => {
    const result = inferContract({ tagName: "button" });
    expect(result.missing).toContain("safetyLevel");
  });

  it("safetyLevel is NOT in missing when intent defaults supply it", () => {
    const result = inferContract({
      tagName: "button",
      dataAttributes: { "data-intent": "place-order" },
    });
    expect(result.missing).not.toContain("safetyLevel");
  });

  it("reversible is NOT in missing when intent defaults supply it", () => {
    const result = inferContract({ tagName: "input", inputType: "email" });
    expect(result.missing).not.toContain("reversible");
  });

  it("requiresConfirmation is in missing when no intent is inferred", () => {
    const result = inferContract({ tagName: "div" });
    expect(result.missing).toContain("requiresConfirmation");
  });

  it("destructive is NOT in missing when intent defaults supply it", () => {
    const result = inferContract({
      tagName: "button",
      dataAttributes: { "data-intent": "delete-item" },
    });
    expect(result.missing).not.toContain("destructive");
  });
});

// ---------------------------------------------------------------------------
// Never throws
// ---------------------------------------------------------------------------

describe("never throws", () => {
  it("completely unknown input does not throw", () => {
    expect(() => {
      inferContract({ tagName: "xyz-custom-element" });
    }).not.toThrow();
  });

  it("minimal input (tagName only) does not throw", () => {
    expect(() => {
      inferContract({ tagName: "span" });
    }).not.toThrow();
  });

  it("completely empty-looking input does not throw", () => {
    const input: InferenceInput = { tagName: "" };
    expect(() => {
      inferContract(input);
    }).not.toThrow();
  });

  it("returns low confidence for completely unknown tag", () => {
    const result = inferContract({ tagName: "xyz-unknown" });
    expect(result.confidence).toBe("low");
  });

  it("returns non-empty reasoning even for unknown input", () => {
    const result = inferContract({ tagName: "xyz-unknown" });
    expect(result.reasoning.length).toBeGreaterThan(0);
  });

  it("always returns the seven always-missing fields even for unknown input", () => {
    const result = inferContract({ tagName: "xyz-unknown" });
    expect(result.missing).toContain("id");
    expect(result.missing).toContain("description");
    expect(result.missing).toContain("contractVersion");
    expect(result.missing).toContain("requires");
    expect(result.missing).toContain("requiredPermissions");
    expect(result.missing).toContain("consequence");
    expect(result.missing).toContain("affects");
  });

  it("all optional inputs omitted does not throw", () => {
    // exactOptionalPropertyTypes: true means we omit optional fields rather than setting them undefined
    const input: InferenceInput = { tagName: "button" };
    expect(() => inferContract(input)).not.toThrow();
  });
});
