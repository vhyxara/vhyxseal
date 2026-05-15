/**
 * SealProvider — root React context provider for VhyxSeal.
 *
 * Collects component contracts from the subtree, generates a manifest
 * whenever contracts change, and exposes both via SealContext.
 */

import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import {
  generateManifest,
  type ComponentContract,
  type VhyxSealManifest,
  type ManifestConfig,
} from "@vhyxseal/core";
import { SealContext, type SealContextValue } from "./context.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Props for the SealProvider component.
 */
export interface SealProviderProps {
  /** Child components — the component tree that can register contracts. */
  children: ReactNode;
  /** Configuration forwarded to generateManifest on each contract change. */
  config: ManifestConfig;
  /**
   * Enable development mode features: verbose console logging, DevTools.
   * Defaults to `process.env.NODE_ENV !== "production"` when process is available,
   * or `true` in browser environments where process is not defined.
   */
  dev?: boolean;
  /**
   * Called each time a new manifest is successfully generated.
   * Useful for testing, debugging, or forwarding the manifest to a server.
   */
  onManifestGenerated?: (manifest: Readonly<VhyxSealManifest>) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Root context provider for the VhyxSeal React adapter.
 *
 * Place this at the top of the component tree (or around any subtree where
 * VhyxSeal components will be used). Child components call `registerContract`
 * via the context to contribute their contracts to the manifest.
 *
 * The manifest is regenerated automatically whenever the set of registered
 * contracts changes. Generation errors are caught internally — they never
 * propagate to the render tree.
 *
 * @example
 * <SealProvider config={{ domain: "example.com", domainVerified: false, verificationToken: "" }}>
 *   <App />
 * </SealProvider>
 */
export function SealProvider({
  children,
  config,
  dev,
  onManifestGenerated,
}: SealProviderProps): ReactNode {
  // Determine development mode once. Process may not exist in all environments.
  const isDev = useMemo<boolean>(() => {
    if (dev !== undefined) {
      return dev;
    }
    if (typeof process !== "undefined" && process.env !== undefined) {
      return process.env["NODE_ENV"] !== "production";
    }
    return true;
  }, [dev]);

  // The contracts map — keyed by component id.
  const [contracts, setContracts] = useState<
    ReadonlyMap<string, Readonly<ComponentContract>>
  >(new Map());

  /**
   * Adds or replaces a contract in the registry.
   * Warns in dev mode when the same id is re-registered with a different fingerprint.
   */
  const registerContract = useCallback(
    (contract: Readonly<ComponentContract>): void => {
      setContracts((prev) => {
        const existing = prev.get(contract.id);
        if (
          isDev &&
          existing !== undefined &&
          existing.fingerprint !== contract.fingerprint
        ) {
          console.warn(
            `[VhyxSeal] Contract "${contract.id}" was re-registered with a different fingerprint. ` +
              "This may indicate the contract definition changed unexpectedly.",
          );
        }
        const next = new Map(prev);
        next.set(contract.id, contract);
        return next;
      });
    },
    [isDev],
  );

  /**
   * Removes a contract from the registry by id. Silent if not found.
   */
  const unregisterContract = useCallback((id: string): void => {
    setContracts((prev) => {
      if (!prev.has(id)) {
        return prev;
      }
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // Generate manifest whenever contracts or config changes.
  const manifest = useMemo<Readonly<VhyxSealManifest> | null>(() => {
    try {
      const contractsArray = Array.from(contracts.values());
      return generateManifest(contractsArray, config);
    } catch (err) {
      if (isDev) {
        console.error("[VhyxSeal] Manifest generation failed:", err);
      }
      return null;
    }
  }, [contracts, config, isDev]);

  // Notify the caller when a new manifest is produced.
  useEffect(() => {
    if (manifest !== null && onManifestGenerated !== undefined) {
      onManifestGenerated(manifest);
    }
  }, [manifest, onManifestGenerated]);

  // Memoize the context value to avoid unnecessary re-renders of consumers.
  const contextValue = useMemo<SealContextValue>(
    () => ({
      contracts,
      registerContract,
      unregisterContract,
      manifest,
      isDev,
    }),
    [contracts, registerContract, unregisterContract, manifest, isDev],
  );

  return (
    <SealContext.Provider value={contextValue}>{children}</SealContext.Provider>
  );
}
