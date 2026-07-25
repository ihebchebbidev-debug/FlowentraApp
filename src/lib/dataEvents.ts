// Lightweight cross-module data-invalidation event bus.
// Emit when a mutation may affect data cached/displayed in another module
// (e.g. deleting a role should refresh any list that shows role badges).

export type DataEvent =
  | 'roles:changed'
  | 'skills:changed'
  | 'users:changed'
  | 'userGroups:changed';

type Listener = () => void;

const listeners = new Map<DataEvent, Set<Listener>>();

export function onDataEvent(event: DataEvent, listener: Listener): () => void {
  let set = listeners.get(event);
  if (!set) {
    set = new Set();
    listeners.set(event, set);
  }
  set.add(listener);
  return () => set!.delete(listener);
}

export function emitDataEvent(event: DataEvent): void {
  const set = listeners.get(event);
  if (!set) return;
  // Copy to avoid mutation during iteration
  Array.from(set).forEach((fn) => {
    try {
      fn();
    } catch (err) {
      // Never let one listener break the others
      // eslint-disable-next-line no-console
      console.error(`[dataEvents] listener for ${event} threw`, err);
    }
  });
}
