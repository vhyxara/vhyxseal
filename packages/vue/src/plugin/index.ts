import { type App, ref, computed } from "vue";
import { generateManifest } from "@vhyxseal/core";
import type { ComponentContract, VhyxSealManifest, ManifestConfig } from "@vhyxseal/core";

export const SEAL_CONTEXT_KEY = Symbol("vhyxseal");

/** Shape of the context provided by VhyxSealPlugin to all descendant components. */
export interface SealContextValue {
  contracts: Readonly<Map<string, Readonly<ComponentContract>>>;
  registerContract: (contract: Readonly<ComponentContract>) => void;
  unregisterContract: (id: string) => void;
  manifest: Readonly<VhyxSealManifest> | null;
  isDev: boolean;
}

export interface VhyxSealPluginOptions {
  /** Forwarded to generateManifest on each contract change. */
  config: ManifestConfig;
  /** Override dev detection. Defaults to process.env.NODE_ENV !== "production". */
  dev?: boolean;
}

/**
 * VhyxSeal Vue plugin. Install with app.use(VhyxSealPlugin, options).
 * Provides SealContext to the entire app via Vue's provide/inject system.
 *
 * @param app - The Vue app instance
 * @param options - Plugin options including manifest config and dev flag
 * @example
 * import { createApp } from 'vue'
 * import { VhyxSealPlugin } from '@vhyxseal/vue'
 *
 * const app = createApp(App)
 * app.use(VhyxSealPlugin, {
 *   config: { domain: 'example.com', domainVerified: false, verificationToken: '' }
 * })
 */
export const VhyxSealPlugin = {
  install(app: App, options: VhyxSealPluginOptions): void {
    const contracts = ref(new Map<string, Readonly<ComponentContract>>());

    const manifest = computed((): Readonly<VhyxSealManifest> | null => {
      try {
        return generateManifest([...contracts.value.values()], options.config);
      } catch {
        return null;
      }
    });

    const isDev =
      options.dev ??
      (typeof process !== "undefined" &&
        process.env?.["NODE_ENV"] !== "production");

    const registerContract = (contract: Readonly<ComponentContract>): void => {
      contracts.value = new Map(contracts.value).set(contract.id, contract);
    };

    const unregisterContract = (id: string): void => {
      const next = new Map(contracts.value);
      next.delete(id);
      contracts.value = next;
    };

    const context: SealContextValue = {
      get contracts() { return contracts.value; },
      registerContract,
      unregisterContract,
      get manifest() { return manifest.value; },
      isDev,
    };

    app.provide(SEAL_CONTEXT_KEY, context);
  },
};
