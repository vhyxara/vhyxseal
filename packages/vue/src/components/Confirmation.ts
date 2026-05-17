import { defineComponent, inject, onMounted, onUnmounted, ref, h, type PropType } from "vue";
import { SEAL_CONTEXT_KEY } from "../plugin/index.js";
import type { SealContextValue } from "../plugin/index.js";
import type { ComponentContract } from "@vhyxseal/core";

/**
 * Confirmation gate component with scoped slot exposing full lifecycle state.
 * Uses a scoped slot so the consumer controls all rendering — no DOM output of its own.
 * Degrades gracefully when no VhyxSealPlugin is installed.
 *
 * @example
 * <Confirmation :contract="deleteContract" v-slot="{ isPending, requestConfirmation, confirm, cancel }">
 *   <button @click="requestConfirmation">Delete</button>
 *   <dialog v-if="isPending">
 *     <button @click="confirm">Yes, delete</button>
 *     <button @click="cancel">Cancel</button>
 *   </dialog>
 * </Confirmation>
 */
export const Confirmation = defineComponent({
  name: "VhyxSealConfirmation",
  props: {
    contract: {
      type: Object as PropType<Readonly<ComponentContract>>,
      required: false,
    },
  },
  setup(props, { slots }) {
    const ctx = inject<SealContextValue>(SEAL_CONTEXT_KEY);

    const confirmed = ref(false);
    const isPending = ref(false);

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

    function requestConfirmation(): void {
      isPending.value = true;
    }

    function confirm(): void {
      confirmed.value = true;
      isPending.value = false;
    }

    function cancel(): void {
      isPending.value = false;
    }

    function reset(): void {
      confirmed.value = false;
      isPending.value = false;
    }

    return () =>
      slots.default?.({
        confirmed: confirmed.value,
        isPending: isPending.value,
        requestConfirmation,
        confirm,
        cancel,
        reset,
      }) ?? null;
  },
});
