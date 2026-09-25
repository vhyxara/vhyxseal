import {
  forwardRef,
  useContext,
  useEffect,
  type ComponentType,
  type ForwardedRef,
  type PropsWithoutRef,
  type ReactNode,
} from "react";
import type { ComponentContract } from "@vhyxseal/core";
import { SealContext } from "../provider/context.js";

// Contract ids already warned about for rendering outside a SealProvider.
// Warning once per id keeps dev consoles readable in apps that intentionally
// render without a provider (tests, storybook, opt-out).
const warnedOutsideProvider = new Set<string>();

function isProduction(): boolean {
  try {
    return process.env.NODE_ENV === "production";
  } catch {
    // `process` is undefined in plain browser bundles (Vite, esbuild, Deno).
    return false;
  }
}

/**
 * Wraps any React component with a VhyxSeal contract without modifying the original.
 *
 * The contract is registered in SealContext on mount and unregistered on unmount.
 * When rendered outside a SealProvider the component still renders — the contract
 * is silently skipped and a console.warn is emitted in non-production environments.
 * This follows the "errors never crash the visual layer" principle.
 *
 * For stable behavior, define the contract outside the render function using
 * defineContract() from @vhyxseal/core. Inline contract objects will trigger
 * re-registration on every render.
 *
 * @param WrappedComponent - Any React component. Receives all its original props unchanged.
 * @param contract - A complete ComponentContract. Use defineContract() for fingerprinting.
 * @returns A new component with the same props interface.
 * @example
 * import { withAgentContract } from '@vhyxseal/react';
 * import { defineContract } from '@vhyxseal/core';
 *
 * const orderContract = defineContract({ id: 'checkout-btn', intent: 'place-order', ... });
 *
 * const PlaceOrderButton = withAgentContract(
 *   ({ onClick, disabled }) => (
 *     <button onClick={onClick} disabled={disabled}>Place Order</button>
 *   ),
 *   orderContract,
 * );
 */
export function withAgentContract<P extends object>(
  WrappedComponent: ComponentType<P>,
  contract: Readonly<ComponentContract>,
): ComponentType<P> {
  // Refs are forwarded so wrapped components keep imperative handles
  // (focus management, measurement) on React 18, where `ref` is not a prop.
  const WithAgentContract = forwardRef(function WithAgentContract(
    props: PropsWithoutRef<P>,
    ref: ForwardedRef<unknown>,
  ): ReactNode {
    const ctx = useContext(SealContext);

    useEffect(() => {
      if (ctx === null) {
        if (!isProduction() && !warnedOutsideProvider.has(contract.id)) {
          warnedOutsideProvider.add(contract.id);
          console.warn(
            `[VhyxSeal] withAgentContract: component "${contract.id}" rendered ` +
              `outside SealProvider. Contract not registered.`,
          );
        }
        return;
      }

      ctx.registerContract(contract);

      return () => {
        ctx.unregisterContract(contract.id);
      };
      // contract.fingerprint as sole dep: re-register when fingerprint changes, not on every
      // render. ctx.registerContract / unregisterContract are stable useCallback references
      // from SealProvider — intentionally omitted to avoid [ctx] infinite-render issues.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contract.fingerprint]);

    // PropsWithoutRef<P> is P minus `ref`; re-adding the forwarded ref restores
    // the full prop object the wrapped component expects.
    const forwarded = (ref === null ? props : { ...props, ref }) as P;
    return <WrappedComponent {...forwarded} />;
  });

  WithAgentContract.displayName = `WithAgentContract(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;
  // forwardRef returns an exotic component; it is callable with P exactly like
  // the ComponentType<P> this HOC has always promised, so the public
  // signature stays unchanged for existing consumers.
  return WithAgentContract as unknown as ComponentType<P>;
}
