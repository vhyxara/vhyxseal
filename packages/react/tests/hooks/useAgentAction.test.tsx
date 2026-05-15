import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  defineContract,
  clearRelationshipRegistry,
  clearCapabilityRegistry,
} from "@vhyxseal/core";
import { useAgentAction } from "../../src/hooks/index.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeContract(id: string) {
  return defineContract({
    id,
    type: "action",
    intent: "place-order",
    description: "A test action",
    requires: [],
    requiredPermissions: [],
    consequence: "Performs a test action",
    affects: ["test"],
    contractVersion: "1.0.0",
  });
}

// ---------------------------------------------------------------------------
// Test isolation
// ---------------------------------------------------------------------------

beforeEach(() => {
  clearRelationshipRegistry();
  clearCapabilityRegistry();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useAgentAction — initiateAction", () => {
  it("returns an actionId string with the expected prefix", async () => {
    const { result } = renderHook(() => useAgentAction());
    const contract = makeContract("agt-initiate");

    let actionId = "";
    await act(async () => {
      actionId = result.current.initiateAction(contract);
    });

    expect(actionId).toMatch(/^agent-action-\d+-\d+$/);
  });

  it("adds a record with status 'pending' after initiateAction", async () => {
    const { result } = renderHook(() => useAgentAction());
    const contract = makeContract("agt-pending");

    let actionId = "";
    await act(async () => {
      actionId = result.current.initiateAction(contract);
    });

    const record = result.current.actions.find((a) => a.actionId === actionId);
    expect(record?.status).toBe("pending");
    expect(record?.humanConfirmed).toBe(false);
    expect(record?.contractId).toBe("agt-pending");
  });

  it("populates intent and safetyLevel from the contract", async () => {
    const { result } = renderHook(() => useAgentAction());
    const contract = makeContract("agt-fields");

    let actionId = "";
    await act(async () => {
      actionId = result.current.initiateAction(contract);
    });

    const record = result.current.actions.find((a) => a.actionId === actionId);
    expect(record?.intent).toBe("place-order");
    expect(record?.safetyLevel).toBe("high"); // place-order intent default
  });

  it("actions array is newest-first after multiple initiations", async () => {
    const { result } = renderHook(() => useAgentAction());
    const c1 = makeContract("agt-order-1");
    const c2 = makeContract("agt-order-2");

    let id1 = "";
    let id2 = "";
    await act(async () => {
      id1 = result.current.initiateAction(c1);
    });
    await act(async () => {
      id2 = result.current.initiateAction(c2);
    });

    // newest (id2) is first
    expect(result.current.actions[0]?.actionId).toBe(id2);
    expect(result.current.actions[1]?.actionId).toBe(id1);
  });
});

describe("useAgentAction — confirmAction", () => {
  it("sets status to 'confirmed' and humanConfirmed to true", async () => {
    const { result } = renderHook(() => useAgentAction());
    const contract = makeContract("agt-confirm");

    let actionId = "";
    await act(async () => {
      actionId = result.current.initiateAction(contract);
    });
    await act(async () => {
      result.current.confirmAction(actionId);
    });

    const record = result.current.actions.find((a) => a.actionId === actionId);
    expect(record?.status).toBe("confirmed");
    expect(record?.humanConfirmed).toBe(true);
  });
});

describe("useAgentAction — completeAction", () => {
  it("sets status to 'completed' and sets completedAt", async () => {
    const { result } = renderHook(() => useAgentAction());
    const contract = makeContract("agt-complete");

    let actionId = "";
    await act(async () => {
      actionId = result.current.initiateAction(contract);
    });
    await act(async () => {
      result.current.completeAction(actionId);
    });

    const record = result.current.actions.find((a) => a.actionId === actionId);
    expect(record?.status).toBe("completed");
    expect(record?.completedAt).toBeDefined();
    expect(typeof record?.completedAt).toBe("string");
  });
});

describe("useAgentAction — failAction", () => {
  it("sets status to 'failed', records errorMessage and completedAt", async () => {
    const { result } = renderHook(() => useAgentAction());
    const contract = makeContract("agt-fail");

    let actionId = "";
    await act(async () => {
      actionId = result.current.initiateAction(contract);
    });
    await act(async () => {
      result.current.failAction(actionId, "payment declined");
    });

    const record = result.current.actions.find((a) => a.actionId === actionId);
    expect(record?.status).toBe("failed");
    expect(record?.errorMessage).toBe("payment declined");
    expect(record?.completedAt).toBeDefined();
  });
});

describe("useAgentAction — cancelAction", () => {
  it("sets status to 'cancelled' and sets completedAt", async () => {
    const { result } = renderHook(() => useAgentAction());
    const contract = makeContract("agt-cancel");

    let actionId = "";
    await act(async () => {
      actionId = result.current.initiateAction(contract);
    });
    await act(async () => {
      result.current.cancelAction(actionId);
    });

    const record = result.current.actions.find((a) => a.actionId === actionId);
    expect(record?.status).toBe("cancelled");
    expect(record?.completedAt).toBeDefined();
  });
});

describe("useAgentAction — clearActions", () => {
  it("empties the actions array", async () => {
    const { result } = renderHook(() => useAgentAction());
    const c1 = makeContract("agt-clear-1");
    const c2 = makeContract("agt-clear-2");

    await act(async () => {
      result.current.initiateAction(c1);
      result.current.initiateAction(c2);
    });
    expect(result.current.actions).toHaveLength(2);

    await act(async () => {
      result.current.clearActions();
    });
    expect(result.current.actions).toHaveLength(0);
  });
});

describe("useAgentAction — isActionInProgress", () => {
  it("is false initially", () => {
    const { result } = renderHook(() => useAgentAction());
    expect(result.current.isActionInProgress).toBe(false);
  });

  it("is true when any action has status 'pending'", async () => {
    const { result } = renderHook(() => useAgentAction());
    const contract = makeContract("agt-progress-pending");

    await act(async () => {
      result.current.initiateAction(contract);
    });

    expect(result.current.isActionInProgress).toBe(true);
  });

  it("is true when any action has status 'confirmed'", async () => {
    const { result } = renderHook(() => useAgentAction());
    const contract = makeContract("agt-progress-confirmed");

    let actionId = "";
    await act(async () => {
      actionId = result.current.initiateAction(contract);
    });
    await act(async () => {
      result.current.confirmAction(actionId);
    });

    expect(result.current.isActionInProgress).toBe(true);
  });

  it("is false when all actions are completed, failed, or cancelled", async () => {
    const { result } = renderHook(() => useAgentAction());
    const c1 = makeContract("agt-done-1");
    const c2 = makeContract("agt-done-2");
    const c3 = makeContract("agt-done-3");

    let id1 = "", id2 = "", id3 = "";
    await act(async () => {
      id1 = result.current.initiateAction(c1);
      id2 = result.current.initiateAction(c2);
      id3 = result.current.initiateAction(c3);
    });
    await act(async () => {
      result.current.completeAction(id1);
      result.current.failAction(id2, "error");
      result.current.cancelAction(id3);
    });

    expect(result.current.isActionInProgress).toBe(false);
  });
});

describe("useAgentAction — currentAction", () => {
  it("is null initially", () => {
    const { result } = renderHook(() => useAgentAction());
    expect(result.current.currentAction).toBeNull();
  });

  it("is the most recently initiated action after initiateAction", async () => {
    const { result } = renderHook(() => useAgentAction());
    const c1 = makeContract("agt-current-1");
    const c2 = makeContract("agt-current-2");

    let id2 = "";
    await act(async () => {
      result.current.initiateAction(c1);
    });
    await act(async () => {
      id2 = result.current.initiateAction(c2);
    });

    // currentAction is actions[0] — newest
    expect(result.current.currentAction?.actionId).toBe(id2);
  });
});

describe("useAgentAction — multiple in-flight actions", () => {
  it("tracks multiple actions simultaneously", async () => {
    const { result } = renderHook(() => useAgentAction());
    const c1 = makeContract("agt-multi-1");
    const c2 = makeContract("agt-multi-2");
    const c3 = makeContract("agt-multi-3");

    let id1 = "", id2 = "", id3 = "";
    await act(async () => {
      id1 = result.current.initiateAction(c1);
      id2 = result.current.initiateAction(c2);
      id3 = result.current.initiateAction(c3);
    });
    await act(async () => {
      result.current.completeAction(id1);
      result.current.confirmAction(id2);
    });

    // id3 and id2 are still in progress
    expect(result.current.isActionInProgress).toBe(true);
    expect(result.current.actions.find((a) => a.actionId === id1)?.status).toBe("completed");
    expect(result.current.actions.find((a) => a.actionId === id2)?.status).toBe("confirmed");
    expect(result.current.actions.find((a) => a.actionId === id3)?.status).toBe("pending");
    expect(result.current.actions).toHaveLength(3);
  });
});

describe("useAgentAction — standalone (no SealProvider)", () => {
  it("works without any SealProvider in the tree", async () => {
    const { result } = renderHook(() => useAgentAction());
    const contract = makeContract("agt-standalone");

    let actionId = "";
    await act(async () => {
      actionId = result.current.initiateAction(contract);
    });

    expect(actionId).toMatch(/^agent-action-/);
    expect(result.current.actions[0]?.contractId).toBe("agt-standalone");
  });
});
