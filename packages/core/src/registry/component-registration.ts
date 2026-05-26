/**
 * Component fingerprint and version tracking store — in-memory implementation.
 *
 * Tracks component contract fingerprints and versions for drift detection.
 * Persistent storage is a Stage 4B concern.
 */

export interface ComponentRegistration {
  componentId: string;
  fingerprint: string;
  contractVersion: string;
  registeredAt: string;
  lastSeenAt: string;
}

export interface ComponentRegistrationStore {
  register: (componentId: string, fingerprint: string, contractVersion: string) => ComponentRegistration;
  getRegistration: (componentId: string) => ComponentRegistration | undefined;
  updateSeen: (componentId: string) => void;
  getAllRegistrations: () => ReadonlyArray<ComponentRegistration>;
  hasChanged: (componentId: string, fingerprint: string) => boolean;
  /** Empties all registrations. **Test use only.** */
  clear: () => void;
}

/**
 * Creates an in-memory component registration store.
 * Tracks component contract fingerprints and versions for drift detection.
 *
 * This is the in-memory implementation. Persistent storage
 * is a Stage 4B concern.
 *
 * @returns ComponentRegistrationStore instance
 */
export function createComponentRegistrationStore(): ComponentRegistrationStore {
  const store = new Map<string, ComponentRegistration>();

  function register(
    componentId: string,
    fingerprint: string,
    contractVersion: string,
  ): ComponentRegistration {
    const existing = store.get(componentId);
    const now = new Date().toISOString();
    const record: ComponentRegistration = {
      componentId,
      fingerprint,
      contractVersion,
      registeredAt: existing?.registeredAt ?? now,
      lastSeenAt: now,
    };
    store.set(componentId, record);
    return record;
  }

  function getRegistration(componentId: string): ComponentRegistration | undefined {
    return store.get(componentId);
  }

  function updateSeen(componentId: string): void {
    const record = store.get(componentId);
    if (record === undefined) return;
    record.lastSeenAt = new Date().toISOString();
  }

  function getAllRegistrations(): ReadonlyArray<ComponentRegistration> {
    return Array.from(store.values());
  }

  function hasChanged(componentId: string, fingerprint: string): boolean {
    const record = store.get(componentId);
    if (record === undefined) return false;
    return record.fingerprint !== fingerprint;
  }

  function clear(): void {
    store.clear();
  }

  return { register, getRegistration, updateSeen, getAllRegistrations, hasChanged, clear };
}
