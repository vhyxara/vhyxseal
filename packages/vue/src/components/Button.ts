import { defineComponent, inject, onMounted, onUnmounted, h, type PropType } from "vue";
import { SEAL_CONTEXT_KEY } from "../plugin/index.js";
import type { SealContextValue } from "../plugin/index.js";
import type { ComponentContract } from "@vhyxseal/core";

/**
 * Headless action button with optional VhyxSeal contract registration.
 * Renders a native <button> element. All standard HTML button attributes are forwarded.
 * Degrades gracefully when no VhyxSealPlugin is installed.
 *
 * @example
 * <Button :contract="orderContract" @click="handleCheckout">Place Order</Button>
 */
export const Button = defineComponent({
  name: "VhyxSealButton",
  inheritAttrs: false,
  props: {
    contract: {
      type: Object as PropType<Readonly<ComponentContract>>,
      required: false,
    },
  },
  setup(props, { slots, attrs }) {
    const ctx = inject<SealContextValue>(SEAL_CONTEXT_KEY);

    onMounted(() => {
      if (props.contract !== undefined && ctx) {
        ctx.registerContract(props.contract);
      }
    });

    onUnmounted(() => {
      if (props.contract !== undefined && ctx) {
        ctx.unregisterContract(props.contract.id);
      }
    });

    return () => h("button", attrs, slots.default?.() ?? []);
  },
});
