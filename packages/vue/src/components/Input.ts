import { defineComponent, inject, onMounted, onUnmounted, h, type PropType } from "vue";
import { SEAL_CONTEXT_KEY } from "../plugin/index.js";
import type { SealContextValue } from "../plugin/index.js";
import type { ComponentContract } from "@vhyxseal/core";

/**
 * Headless input with optional VhyxSeal contract registration.
 * Renders a native <input> element. All standard HTML input attributes are forwarded.
 * Degrades gracefully when no VhyxSealPlugin is installed.
 *
 * @example
 * <Input :contract="searchContract" type="text" placeholder="Search..." />
 */
export const Input = defineComponent({
  name: "VhyxSealInput",
  inheritAttrs: false,
  props: {
    contract: {
      type: Object as PropType<Readonly<ComponentContract>>,
      required: false,
    },
  },
  setup(props, { attrs }) {
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

    return () => h("input", attrs);
  },
});
