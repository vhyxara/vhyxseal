import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h, defineComponent } from "vue";
import { Confirmation } from "../../src/components/Confirmation.js";

describe("Confirmation", () => {
  // Helper that mounts Confirmation with a render-function scoped slot
  // and exposes the slot props captured at mount time plus a trigger div for testing
  function mountConfirmation() {
    let slotConfirmed = false;
    let slotIsPending = false;
    let slotFns: {
      requestConfirmation: () => void;
      confirm: () => void;
      cancel: () => void;
      reset: () => void;
    } | undefined;

    const Wrapper = defineComponent({
      components: { Confirmation },
      render() {
        return h(Confirmation, {}, {
          default: (props: {
            confirmed: boolean;
            isPending: boolean;
            requestConfirmation: () => void;
            confirm: () => void;
            cancel: () => void;
            reset: () => void;
          }) => {
            slotConfirmed = props.confirmed;
            slotIsPending = props.isPending;
            slotFns = {
              requestConfirmation: props.requestConfirmation,
              confirm: props.confirm,
              cancel: props.cancel,
              reset: props.reset,
            };
            return [
              h("span", { id: "confirmed" }, String(props.confirmed)),
              h("span", { id: "pending" }, String(props.isPending)),
              h("button", { id: "request", onClick: props.requestConfirmation }, "Request"),
              h("button", { id: "confirm", onClick: props.confirm }, "Confirm"),
              h("button", { id: "cancel", onClick: props.cancel }, "Cancel"),
              h("button", { id: "reset", onClick: props.reset }, "Reset"),
            ];
          },
        });
      },
    });

    const wrapper = mount(Wrapper);
    return { wrapper, getSlotFns: () => slotFns!, getConfirmed: () => slotConfirmed, getIsPending: () => slotIsPending };
  }

  it("scoped slot receives confirmed, isPending, and all control functions", () => {
    const { wrapper } = mountConfirmation();
    expect(wrapper.find("#confirmed").text()).toBe("false");
    expect(wrapper.find("#pending").text()).toBe("false");
    expect(wrapper.find("#request").exists()).toBe(true);
    expect(wrapper.find("#confirm").exists()).toBe(true);
    expect(wrapper.find("#cancel").exists()).toBe(true);
    expect(wrapper.find("#reset").exists()).toBe(true);
  });

  it("requestConfirmation sets isPending to true", async () => {
    const { wrapper } = mountConfirmation();
    await wrapper.find("#request").trigger("click");
    expect(wrapper.find("#pending").text()).toBe("true");
    expect(wrapper.find("#confirmed").text()).toBe("false");
  });

  it("confirm sets confirmed to true and clears isPending", async () => {
    const { wrapper } = mountConfirmation();
    await wrapper.find("#request").trigger("click");
    await wrapper.find("#confirm").trigger("click");
    expect(wrapper.find("#confirmed").text()).toBe("true");
    expect(wrapper.find("#pending").text()).toBe("false");
  });

  it("cancel clears isPending without confirming", async () => {
    const { wrapper } = mountConfirmation();
    await wrapper.find("#request").trigger("click");
    expect(wrapper.find("#pending").text()).toBe("true");
    await wrapper.find("#cancel").trigger("click");
    expect(wrapper.find("#pending").text()).toBe("false");
    expect(wrapper.find("#confirmed").text()).toBe("false");
  });

  it("reset returns both confirmed and isPending to false", async () => {
    const { wrapper } = mountConfirmation();
    await wrapper.find("#request").trigger("click");
    await wrapper.find("#confirm").trigger("click");
    expect(wrapper.find("#confirmed").text()).toBe("true");
    await wrapper.find("#reset").trigger("click");
    expect(wrapper.find("#confirmed").text()).toBe("false");
    expect(wrapper.find("#pending").text()).toBe("false");
  });
});
