import { useCallback, useEffect, useRef, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';

/**
 * Simple undo/redo stack for the workflow canvas.
 *
 * Design notes:
 * - We snapshot `{nodes, edges}` (shallow clones — React Flow already produces
 *   new arrays on every meaningful change, so structural equality is enough).
 * - Snapshots are debounced: rapid changes like dragging a node emit dozens of
 *   position updates per second; without debouncing the stack fills up with
 *   near-identical entries and undo feels broken. 300ms strikes a good balance
 *   between "one drag = one entry" and responsiveness.
 * - Cap the stack at 50 states so a long editing session doesn't leak memory.
 * - The caller must set `isReplayingRef.current = true` while applying an undo
 *   or redo, then reset it, so the resulting state change doesn't push a new
 *   snapshot on top of what we just restored.
 */

export interface HistorySnapshot {
  nodes: Node[];
  edges: Edge[];
}

const MAX_HISTORY = 50;
const DEBOUNCE_MS = 300;

export function useWorkflowHistory(initial: HistorySnapshot) {
  const pastRef = useRef<HistorySnapshot[]>([]);
  const futureRef = useRef<HistorySnapshot[]>([]);
  const presentRef = useRef<HistorySnapshot>(initial);
  const isReplayingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncFlags = useCallback(() => {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  /** Replace the current baseline without pushing to history — call on load/save. */
  const reset = useCallback((snap: HistorySnapshot) => {
    pastRef.current = [];
    futureRef.current = [];
    presentRef.current = snap;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    syncFlags();
  }, [syncFlags]);

  /**
   * Called after every canvas change. If this change was produced by a replay
   * (undo/redo), we swallow it. Otherwise we debounce and push the *previous*
   * present onto the past stack.
   */
  const record = useCallback((snap: HistorySnapshot) => {
    if (isReplayingRef.current) {
      presentRef.current = snap;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pastRef.current.push(presentRef.current);
      if (pastRef.current.length > MAX_HISTORY) pastRef.current.shift();
      presentRef.current = snap;
      futureRef.current = []; // any new edit forks the timeline
      syncFlags();
    }, DEBOUNCE_MS);
  }, [syncFlags]);

  const undo = useCallback((): HistorySnapshot | null => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const prev = pastRef.current.pop();
    if (!prev) return null;
    futureRef.current.push(presentRef.current);
    presentRef.current = prev;
    syncFlags();
    return prev;
  }, [syncFlags]);

  const redo = useCallback((): HistorySnapshot | null => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const next = futureRef.current.pop();
    if (!next) return null;
    pastRef.current.push(presentRef.current);
    presentRef.current = next;
    syncFlags();
    return next;
  }, [syncFlags]);

  // Clean up any pending debounce on unmount so tests / route changes don't
  // fire late state updates against an unmounted component.
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  return { record, undo, redo, reset, canUndo, canRedo, isReplayingRef };
}