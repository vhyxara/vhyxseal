import { generateManifest } from "@vhyxseal/core";
import type { VhyxSealManifest, ManifestConfig, ComponentContract } from "@vhyxseal/core";

/**
 * Returns a generated manifest for use in React Server Components.
 * Call this in a Server Component to embed manifest data in the page.
 *
 * @param contracts - Component contracts to include
 * @param config - Manifest configuration
 * @returns Generated VhyxSealManifest or null if generation fails
 * @example
 * // app/layout.tsx (Server Component)
 * const manifest = await getSealManifest([], { domain: 'example.com', domainVerified: false, verificationToken: '' })
 */
export async function getSealManifest(
  contracts: ReadonlyArray<Readonly<ComponentContract>>,
  config: ManifestConfig,
): Promise<Readonly<VhyxSealManifest> | null> {
  try {
    return generateManifest([...contracts], config);
  } catch {
    return null;
  }
}
