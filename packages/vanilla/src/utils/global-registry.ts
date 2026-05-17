import { createSealRegistry } from "./registry.js";
import type { SealRegistry } from "./registry.js";

/**
 * The global VhyxSeal registry shared by all custom elements.
 * Custom elements register and unregister contracts here automatically.
 * @internal
 */
export const globalRegistry: SealRegistry = createSealRegistry();
