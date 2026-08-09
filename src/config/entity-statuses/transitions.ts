// ============================================================================
// Sequential Status Transition Rules
// Users must move through a workflow step by step — no skipping ahead and no
// jumping several steps backward. Derived from the centralized workflow config
// (`workflow.steps` + `workflow.branchStatuses`) so there is one source of truth.
// ============================================================================

import { entityStatusConfigs } from './index';
import { getStatusById, normalizeStatus } from './types';
import type { EntityType, EntityStatusConfig } from './types';

/** Resolve a raw status value to a canonical config id (handles aliases). */
export function canonicalStatus(entityType: EntityType, rawStatus: string): string {
  const config = entityStatusConfigs[entityType];
  if (!config || !rawStatus) return rawStatus;
  const byId = getStatusById(config, rawStatus);
  return byId?.id ?? normalizeStatus(config, rawStatus);
}

/** Find the happy-path step a branch status hangs off (e.g. on_hold → in_progress). */
function findBranchParent(config: EntityStatusConfig, statusId: string): string | null {
  const branches = config.workflow.branchStatuses;
  if (!branches) return null;
  for (const [parent, list] of Object.entries(branches)) {
    if (list.includes(statusId)) return parent;
  }
  return null;
}

/**
 * All statuses a user may move to from `currentStatus`.
 *
 * Rules:
 *  - exactly one step forward, or exactly one step backward, on the happy path
 *  - any branch status explicitly declared for the current step
 *  - a branch status may return to its parent step or continue to the step after it
 *  - negative terminal statuses (cancelled/rejected) are always reachable while active
 *  - terminal statuses are dead ends — nothing can be changed from them
 */
export function getAllowedTransitions(entityType: EntityType, currentStatus: string): string[] {
  const config = entityStatusConfigs[entityType];
  if (!config) return [];

  const current = canonicalStatus(entityType, currentStatus);
  const currentDef = getStatusById(config, current);
  const { steps, branchStatuses } = config.workflow;

  // Terminal states are final — reopening must go through a dedicated action.
  if (currentDef?.isTerminal) return [];

  const allowed = new Set<string>();
  const index = steps.indexOf(current);

  if (index >= 0) {
    if (index + 1 < steps.length) allowed.add(steps[index + 1]);
    if (index - 1 >= 0) allowed.add(steps[index - 1]);
    for (const branch of branchStatuses?.[current] ?? []) allowed.add(branch);
  } else {
    // Off happy-path status (e.g. on_hold, partially_completed, modified)
    const parent = findBranchParent(config, current);
    if (parent) {
      const parentIndex = steps.indexOf(parent);
      allowed.add(parent);
      if (parentIndex >= 0 && parentIndex + 1 < steps.length) allowed.add(steps[parentIndex + 1]);
    } else {
      // Unknown/legacy status: let the user re-enter the pipeline at its start.
      if (steps.length > 0) allowed.add(steps[0]);
    }
  }

  // Aborting is always possible from an active state.
  for (const s of config.statuses) {
    if (s.isNegative && s.isTerminal) allowed.add(s.id);
  }

  allowed.delete(current);
  return Array.from(allowed);
}

/** Whether a user-initiated move from one status to another is permitted. */
export function isTransitionAllowed(
  entityType: EntityType,
  currentStatus: string,
  nextStatus: string
): boolean {
  const current = canonicalStatus(entityType, currentStatus);
  const next = canonicalStatus(entityType, nextStatus);
  if (!next || current === next) return true;
  return getAllowedTransitions(entityType, current).includes(next);
}
