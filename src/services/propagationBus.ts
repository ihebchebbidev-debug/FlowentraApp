/**
 * Lightweight in-memory pub/sub for propagation results.
 *
 * activityLogger publishes a PropagationEvent whenever
 * logDispatchActivityWithPropagation finishes; UI components (e.g. the
 * inline PropagationChecklist rendered in dispatch tabs) subscribe to it
 * so they can display a per-hop result checklist without threading the
 * return value through every mutation callsite.
 */

import type { PropagationResult } from "./activityLogger";

export interface PropagationEvent {
  dispatchId: number;
  result: PropagationResult;
  at: number;
}

type Listener = (event: PropagationEvent) => void;

const listeners = new Set<Listener>();

export const subscribePropagation = (fn: Listener): (() => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export const publishPropagation = (event: PropagationEvent): void => {
  for (const fn of Array.from(listeners)) {
    try {
      fn(event);
    } catch (e) {
      // A misbehaving subscriber must not break the primary flow.
      // eslint-disable-next-line no-console
      console.warn("propagation subscriber failed:", e);
    }
  }
};

export const hasPropagationSubscribers = (): boolean => listeners.size > 0;
