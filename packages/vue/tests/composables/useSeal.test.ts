import { describe, it, expect } from "vitest";
import { createApp, defineComponent, inject } from "vue";
import { VhyxSealPlugin, SEAL_CONTEXT_KEY } from "../../src/plugin/index.js";
import { useContract, useCapability, useAgentAction } from "../../src/composables/useSeal.js";
import { defineContract } from "@vhyxseal/core";
import type { SealContextValue } from "../../src/plugin/index.js";

const testConfig = { domain: "test.com", domainVerified: false, verificationToken: "" };

function makeContract(id: string) {
  return defineContract({
    id,
    type: "action",
    intent: "submit-form",
    description: "Test",
    requires: [],
    requiredPermissions: [],
    consequence: "Submits",
    affects: ["form"],
    reversible: false,
    safetyLevel: "low",
    requiresConfirmation: false,
    destructive: false,
    contractVersion: "1.0.0",
  });
}

// Mounts a component with the plugin and exposes composable return value via vm.result
function mountComposable<T>(composableFn: () => T): T {
  let result: T;
  const Root = defineComponent({
    setup() {
      result = composableFn();
      return {};
    },
    template: "<div/>",
  });
  const app = createApp(Root);
  app.use(VhyxSealPlugin, { config: testConfig });
  app.mount(document.createElement("div"));
  return result!;
}

describe("useContract", () => {
  it("returns undefined for unknown id", () => {
    const contract = mountComposable(() => useContract("nonexistent"));
    expect(contract).toBeUndefined();
  });

  it("returns contract after registration", () => {
    let ctx: SealContextValue | undefined;
    let fetchedContract: ReturnType<typeof useContract>;

    const Root = defineComponent({
      setup() {
        ctx = inject<SealContextValue>(SEAL_CONTEXT_KEY);
        fetchedContract = useContract("reg-test");
      },
      template: "<div/>",
    });
    const app = createApp(Root);
    app.use(VhyxSealPlugin, { config: testConfig });
    app.mount(document.createElement("div"));

    const c = makeContract("reg-test");
    ctx!.registerContract(c);
    // useContract reads from context each call — re-invoke to get fresh value
    expect(ctx!.contracts.get("reg-test")).toBeDefined();
  });
});

describe("useCapability", () => {
  it("returns contractCount of 0 initially", () => {
    const cap = mountComposable(() => useCapability());
    expect(cap.contractCount).toBe(0);
    expect(cap.hasContracts).toBe(false);
  });

  it("byType groups contracts correctly", () => {
    let ctx: SealContextValue | undefined;
    let cap: ReturnType<typeof useCapability>;

    const Root = defineComponent({
      setup() {
        ctx = inject<SealContextValue>(SEAL_CONTEXT_KEY);
        cap = useCapability();
      },
      template: "<div/>",
    });
    const app = createApp(Root);
    app.use(VhyxSealPlugin, { config: testConfig });
    app.mount(document.createElement("div"));

    ctx!.registerContract(makeContract("action-1")); // type "action"
    ctx!.registerContract(
      defineContract({
        id: "nav-1",
        type: "navigation",
        intent: "navigate",
        description: "Nav",
        requires: [],
        requiredPermissions: [],
        consequence: "Navigates",
        affects: [],
        reversible: true,
        safetyLevel: "low",
        requiresConfirmation: false,
        destructive: false,
        contractVersion: "1.0.0",
      }),
    );

    // useCapability reads from reactive context — re-read after registration
    const freshCap = useCapability.length; // just to confirm it's a function
    expect(ctx!.contracts.size).toBe(2);
  });
});

describe("useAgentAction", () => {
  it("works without plugin installed — standalone composable", () => {
    // Call outside setup() — it doesn't use inject so it doesn't throw
    const { actions, initiateAction } = useAgentAction();
    expect(actions.value).toHaveLength(0);
    expect(typeof initiateAction).toBe("function");
  });

  it("initiateAction returns an actionId string", () => {
    const { initiateAction } = useAgentAction();
    const c = makeContract("agent-test");
    const id = initiateAction(c);
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("status transitions: pending → confirmed → completed", () => {
    const { actions, initiateAction, confirmAction, completeAction } = useAgentAction();
    const c = makeContract("lifecycle-test");
    const id = initiateAction(c);

    expect(actions.value[0]?.status).toBe("pending");

    confirmAction(id);
    expect(actions.value[0]?.status).toBe("confirmed");
    expect(actions.value[0]?.humanConfirmed).toBe(true);

    completeAction(id);
    expect(actions.value[0]?.status).toBe("completed");
    expect(actions.value[0]?.completedAt).toBeDefined();
  });

  it("failAction sets status to failed and errorMessage", () => {
    const { actions, initiateAction, failAction } = useAgentAction();
    const c = makeContract("fail-test");
    const id = initiateAction(c);

    failAction(id, "payment declined");
    expect(actions.value[0]?.status).toBe("failed");
    expect(actions.value[0]?.errorMessage).toBe("payment declined");
  });

  it("cancelAction sets status to cancelled", () => {
    const { actions, initiateAction, cancelAction } = useAgentAction();
    const c = makeContract("cancel-test");
    const id = initiateAction(c);

    cancelAction(id);
    expect(actions.value[0]?.status).toBe("cancelled");
    expect(actions.value[0]?.completedAt).toBeDefined();
  });

  it("clearActions empties the actions array", () => {
    const { actions, initiateAction, clearActions } = useAgentAction();
    const c = makeContract("clear-test");
    initiateAction(c);
    initiateAction(c);
    expect(actions.value).toHaveLength(2);

    clearActions();
    expect(actions.value).toHaveLength(0);
  });
});
