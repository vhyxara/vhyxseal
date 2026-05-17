import { defineComponent, inject, onMounted, onUnmounted, h, type PropType } from "vue";
import { SEAL_CONTEXT_KEY } from "../plugin/index.js";
import type { SealContextValue } from "../plugin/index.js";
import type { ComponentContract } from "@vhyxseal/core";

/**
 * Headless display wrapper with optional VhyxSeal contract registration.
 * Renders a native <div> with aria-live="polite" by default for accessibility.
 * The aria-live value can be overridden via the aria-live attribute.
 * Degrades gracefully when no VhyxSealPlugin is installed.
 *
 * @example
 * <Display :contract="statusContract" aria-live="assertive">Order placed!</Display>
 */
export const Display = defineComponent({
  name: "VhyxSealDisplay",
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

    return () => {
      // aria-live defaults to "polite" when not provided via attrs
      // attr values for aria-* are always strings — safe narrowing
      const ariaLive = attrs["aria-live"];
      const resolvedAriaLive = typeof ariaLive === "string" ? ariaLive : "polite";
      return h(
        "div",
        { ...attrs, "aria-live": resolvedAriaLive },
        slots.default?.() ?? [],
      );
    };
  },
});
