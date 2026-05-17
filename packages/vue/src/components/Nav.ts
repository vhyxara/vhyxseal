import { defineComponent, inject, onMounted, onUnmounted, h, type PropType } from "vue";
import { SEAL_CONTEXT_KEY } from "../plugin/index.js";
import type { SealContextValue } from "../plugin/index.js";
import type { ComponentContract } from "@vhyxseal/core";

/**
 * Headless navigation wrapper with optional VhyxSeal contract registration.
 * Renders a native <nav> element. All standard HTML attributes are forwarded.
 * Degrades gracefully when no VhyxSealPlugin is installed.
 *
 * @example
 * <Nav :contract="navContract">...</Nav>
 */
export const Nav = defineComponent({
  name: "VhyxSealNav",
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

    return () => h("nav", attrs, slots.default?.() ?? []);
  },
});
