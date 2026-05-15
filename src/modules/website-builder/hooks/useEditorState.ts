/**
 * Editor state hook — manages components, selection, history, clipboard.
 *
 * Uses a components ref to avoid stale closures in all callbacks.
 * History is also ref-based for the same reason.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { BuilderComponent, DeviceView, AnimationSettings } from '../types';
import { COMPONENT_PALETTE } from '../utils/palette';
import { generateId } from '../utils/storage';
import { toast } from 'sonner';

interface UseEditorStateProps {
  initialComponents: BuilderComponent[];
  onSave: (components: BuilderComponent[]) => void;
  resetKey?: string;
}

export function useEditorState({ initialComponents, onSave, resetKey }: UseEditorStateProps) {
  const [components, setComponents] = useState<BuilderComponent[]>(initialComponents);
  const [selectedId, setSelectedIdRaw] = useState<string | null>(null);
  const [device, setDevice] = useState<DeviceView>('desktop');
  const [clipboard, setClipboard] = useState<BuilderComponent | null>(null);
  const [hasPendingPropChanges, setHasPendingPropChanges] = useState(false);

  // Ref mirrors state — callbacks always read the latest value
  const componentsRef = useRef(components);
  componentsRef.current = components;

  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  // ── History (ref-based to avoid stale closures) ──
  const historyRef = useRef<BuilderComponent[][]>([initialComponents]);
  const historyIdxRef = useRef(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncHistoryFlags = useCallback(() => {
    setCanUndo(historyIdxRef.current > 0);
    setCanRedo(historyIdxRef.current < historyRef.current.length - 1);
  }, []);

  // Reset on page/language change
  const prevResetKey = useRef(resetKey);
  useEffect(() => {
    if (resetKey !== prevResetKey.current) {
      prevResetKey.current = resetKey;
      setComponents(initialComponents);
      componentsRef.current = initialComponents;
      historyRef.current = [initialComponents];
      historyIdxRef.current = 0;
      setSelectedId(null);
      syncHistoryFlags();
    }
  }, [resetKey, initialComponents, syncHistoryFlags]);

  // ── Core helpers ──

  const pushHistory = useCallback((newComponents: BuilderComponent[]) => {
    const trimmed = historyRef.current.slice(0, historyIdxRef.current + 1);
    trimmed.push(newComponents);
    historyRef.current = trimmed;
    historyIdxRef.current = trimmed.length - 1;
    syncHistoryFlags();
  }, [syncHistoryFlags]);

  /** Apply an update, persist, and optionally record in history */
  const commit = useCallback((updated: BuilderComponent[], trackHistory = true) => {
    setComponents(updated);
    componentsRef.current = updated;
    if (trackHistory) pushHistory(updated);
    onSaveRef.current(updated);
  }, [pushHistory]);

  // ── Component CRUD ──

  /** Add a component — inserts after the currently selected block, or at bottom if none selected */
  const addComponent = useCallback((type: string) => {
    const palette = COMPONENT_PALETTE.find(p => p.type === type);
    if (!palette) return;
    const newComp: BuilderComponent = {
      id: generateId(),
      type: palette.type,
      label: palette.label,
      props: { ...palette.defaultProps },
      styles: palette.defaultStyles || {},
    };
    const comps = componentsRef.current;
    const sid = selectedIdRef.current;
    let updated: BuilderComponent[];
    if (sid) {
      const idx = comps.findIndex(c => c.id === sid);
      updated = [...comps];
      updated.splice(idx + 1, 0, newComp);
    } else {
      updated = [...comps, newComp];
    }
    commit(updated);
    setSelectedId(newComp.id);
  }, [commit]);

  /** Insert a component at a specific index */
  const insertComponentAt = useCallback((type: string, index: number) => {
    const palette = COMPONENT_PALETTE.find(p => p.type === type);
    if (!palette) return;
    const newComp: BuilderComponent = {
      id: generateId(),
      type: palette.type,
      label: palette.label,
      props: { ...palette.defaultProps },
      styles: palette.defaultStyles || {},
    };
    const updated = [...componentsRef.current];
    updated.splice(index, 0, newComp);
    commit(updated);
    setSelectedId(newComp.id);
  }, [commit]);

  const insertComponent = useCallback((comp: BuilderComponent) => {
    commit([...componentsRef.current, comp]);
    setSelectedId(comp.id);
  }, [commit]);

  const removeComponent = useCallback((id: string) => {
    commit(componentsRef.current.filter(c => c.id !== id));
    if (selectedIdRef.current === id) setSelectedId(null);
  }, [commit]);

  /** Prop updates — no history push (too frequent during editing) */
  const updateComponentProps = useCallback((id: string, newProps: Record<string, any>) => {
    const updated = componentsRef.current.map(c =>
      c.id === id ? { ...c, props: { ...c.props, ...newProps } } : c
    );
    setComponents(updated);
    componentsRef.current = updated;
    onSaveRef.current(updated);
    setHasPendingPropChanges(true);
  }, []);

  const commitPropsToHistory = useCallback(() => {
    if (hasPendingPropChanges) {
      pushHistory(componentsRef.current);
      setHasPendingPropChanges(false);
    }
  }, [pushHistory, hasPendingPropChanges]);

  /** Commit pending prop changes and set selection — ensures undo works for prop edits */
  const setSelectedId = useCallback((id: string | null) => {
    // Commit any pending prop changes to history before switching selection
    if (hasPendingPropChanges) {
      pushHistory(componentsRef.current);
      setHasPendingPropChanges(false);
    }
    setSelectedIdRaw(id);
  }, [pushHistory, hasPendingPropChanges]);

  const updateComponentAnimation = useCallback((id: string, animation: AnimationSettings) => {
    const updated = componentsRef.current.map(c =>
      c.id === id ? { ...c, animation } : c
    );
    setComponents(updated);
    componentsRef.current = updated;
    onSaveRef.current(updated);
    setHasPendingPropChanges(true);
  }, []);

  /** Style (dimensions/layout) updates */
  const updateComponentStyles = useCallback((id: string, newStyles: Record<string, any>) => {
    const updated = componentsRef.current.map(c =>
      c.id === id ? { ...c, styles: { ...c.styles, ...newStyles } } : c
    );
    setComponents(updated);
    componentsRef.current = updated;
    onSaveRef.current(updated);
    setHasPendingPropChanges(true);
  }, []);

  const reorderComponents = useCallback((activeId: string, overId: string) => {
    const comps = componentsRef.current;
    const oldIndex = comps.findIndex(c => c.id === activeId);
    const newIndex = comps.findIndex(c => c.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    const updated = [...comps];
    const [moved] = updated.splice(oldIndex, 1);
    updated.splice(newIndex, 0, moved);
    commit(updated);
  }, [commit]);

  const duplicateComponent = useCallback((id: string) => {
    const comps = componentsRef.current;
    const comp = comps.find(c => c.id === id);
    if (!comp) return;
    const dupe: BuilderComponent = {
      ...JSON.parse(JSON.stringify(comp)),
      id: generateId(),
      label: `${comp.label} (copy)`,
    };
    const idx = comps.findIndex(c => c.id === id);
    const updated = [...comps];
    updated.splice(idx + 1, 0, dupe);
    commit(updated);
    setSelectedId(dupe.id);
  }, [commit]);

  const moveComponent = useCallback((id: string, direction: 'up' | 'down') => {
    const comps = componentsRef.current;
    const idx = comps.findIndex(c => c.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === comps.length - 1) return;
    const updated = [...comps];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    commit(updated);
  }, [commit]);

  // ── History navigation ──

  const undo = useCallback(() => {
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current -= 1;
    const snapshot = historyRef.current[historyIdxRef.current];
    setComponents(snapshot);
    componentsRef.current = snapshot;
    onSaveRef.current(snapshot);
    syncHistoryFlags();
    toast('Undo', { description: `Reverted to step ${historyIdxRef.current + 1}`, duration: 1500 });
  }, [syncHistoryFlags]);

  const redo = useCallback(() => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current += 1;
    const snapshot = historyRef.current[historyIdxRef.current];
    setComponents(snapshot);
    componentsRef.current = snapshot;
    onSaveRef.current(snapshot);
    syncHistoryFlags();
    toast('Redo', { description: `Restored step ${historyIdxRef.current + 1}`, duration: 1500 });
  }, [syncHistoryFlags]);

  // ── Clipboard ──

  const copyComponent = useCallback((id: string) => {
    const comp = componentsRef.current.find(c => c.id === id);
    if (!comp) return;
    setClipboard(JSON.parse(JSON.stringify(comp)));
    toast.success(`"${comp.label}" copied to clipboard`);
  }, []);

  const pasteComponent = useCallback(() => {
    if (!clipboard) {
      toast.error('Nothing to paste');
      return;
    }
    const pasted: BuilderComponent = {
      ...JSON.parse(JSON.stringify(clipboard)),
      id: generateId(),
      label: `${clipboard.label} (pasted)`,
    };
    const comps = componentsRef.current;
    const sid = selectedIdRef.current;
    let updated: BuilderComponent[];
    if (sid) {
      const idx = comps.findIndex(c => c.id === sid);
      updated = [...comps];
      updated.splice(idx + 1, 0, pasted);
    } else {
      updated = [...comps, pasted];
    }
    commit(updated);
    setSelectedId(pasted.id);
    toast.success(`"${pasted.label}" pasted`);
  }, [clipboard, commit]);

  // ── Derived values ──

  const selectedComponent = components.find(c => c.id === selectedId) || null;
  const hasClipboard = clipboard !== null;

  return {
    components,
    selectedId,
    selectedComponent,
    device,
    setDevice,
    setSelectedId,
    addComponent,
    insertComponent,
    insertComponentAt,
    removeComponent,
    updateComponentProps,
    commitPropsToHistory,
    updateComponentStyles,
    updateComponentAnimation,
    reorderComponents,
    duplicateComponent,
    moveComponent,
    copyComponent,
    pasteComponent,
    hasClipboard,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
