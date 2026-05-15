/**
 * VhyxSeal registry layer — public exports.
 *
 * Exposes relationship and capability registry functions.
 */

export {
  defineRelationship,
  defineSequence,
  getRelationship,
  getAllRelationships,
  getRelationshipsByType,
  clearRelationshipRegistry,
} from "./relationship-registry.js";

export {
  defineCapability,
  getCapability,
  getAllCapabilities,
  clearCapabilityRegistry,
} from "./capability-registry.js";
