// ============================================================================
// Centralized Entity Status Configuration Types
// Single source of truth for all entity statuses across the application
// ============================================================================

export type StatusColor = 
  | 'default'    // neutral/gray
  | 'primary'    // blue/primary
  | 'success'    // green
  | 'warning'    // yellow/orange
  | 'destructive'// red
  | 'info'       // light blue
  | 'muted';     // subdued

export interface StatusDefinition {
  /** The status ID/value stored in database */
  id: string;
  /** Translation key within the module's i18n namespace (e.g., 'status.draft') */
  translationKey: string;
  /** Translation key in the workflow module's flat format (e.g., 'status.offer.draft') */
  workflowTranslationKey: string;
  /** Semantic color for badges and indicators */
  color: StatusColor;
  /** Whether this is a terminal/end state */
  isTerminal: boolean;
  /** Whether this is a negative/cancellation state */
  isNegative?: boolean;
  /** Legacy/alternative IDs that should normalize to this status */
  aliases?: string[];
}

export interface WorkflowStepConfig {
  /** The ordered happy-path workflow steps (first to last) */
  steps: string[];
  /** Terminal/end statuses that exit the workflow */
  terminalStatuses: string[];
  /** Branch statuses (alternatives at decision points, e.g., accepted/declined) */
  branchStatuses?: Record<string, string[]>;
}

export interface EntityStatusConfig {
  /** Entity type identifier */
  entityType: EntityType;
  /** Human-readable entity name translation key */
  entityLabelKey: string;
  /** All possible statuses for this entity */
  statuses: StatusDefinition[];
  /** Workflow progression configuration */
  workflow: WorkflowStepConfig;
  /** Default status for new entities */
  defaultStatus: string;
}

export type EntityType = 'offer' | 'sale' | 'service_order' | 'dispatch' | 'job';

/** Helper to get a status definition by ID from a config */
export function getStatusById(config: EntityStatusConfig, statusId: string): StatusDefinition | undefined {
  const normalizedId = statusId?.toLowerCase();
  // Direct match first
  const direct = config.statuses.find(s => s.id === normalizedId);
  if (direct) return direct;
  // Alias match — resolve to canonical status
  return config.statuses.find(s => s.aliases?.includes(normalizedId));
}

/** Helper to get the next workflow step */
export function getNextWorkflowStep(config: EntityStatusConfig, currentStatus: string): string | null {
  const { steps } = config.workflow;
  const currentIndex = steps.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex >= steps.length - 1) return null;
  return steps[currentIndex + 1];
}

/** Helper to get the previous workflow step */
export function getPreviousWorkflowStep(config: EntityStatusConfig, currentStatus: string): string | null {
  const { steps } = config.workflow;
  const currentIndex = steps.indexOf(currentStatus);
  if (currentIndex <= 0) return null;
  return steps[currentIndex - 1];
}

/** Helper to check if a status is terminal */
export function isTerminalStatus(config: EntityStatusConfig, statusId: string): boolean {
  return config.workflow.terminalStatuses.includes(statusId);
}

/** Helper to get workflow step index (for progress calculation) */
export function getWorkflowStepIndex(config: EntityStatusConfig, statusId: string): number {
  return config.workflow.steps.indexOf(statusId);
}

/** Helper to get workflow completion percentage */
export function getWorkflowProgress(config: EntityStatusConfig, statusId: string): number {
  const { steps, terminalStatuses } = config.workflow;
  if (terminalStatuses.includes(statusId)) {
    const status = getStatusById(config, statusId);
    return status?.isNegative ? 0 : 100;
  }
  const index = steps.indexOf(statusId);
  if (index === -1) return 0;
  return Math.round((index / (steps.length - 1)) * 100);
}

/** Normalize a raw status value to its canonical config ID using aliases */
export function normalizeStatus(config: EntityStatusConfig, rawStatus: string): string {
  // Direct match - status exists in config
  if (config.statuses.some(s => s.id === rawStatus)) return rawStatus;
  // Alias match - check if any status has this as an alias
  const aliased = config.statuses.find(s => s.aliases?.includes(rawStatus));
  if (aliased) return aliased.id;
  // Fallback to default
  return config.defaultStatus;
}

/** Get position in workflow for any status, including branch statuses */
export function getWorkflowPosition(config: EntityStatusConfig, statusId: string): number {
  const { steps, branchStatuses } = config.workflow;
  // Direct match in happy-path steps
  const directIndex = steps.indexOf(statusId);
  if (directIndex >= 0) return directIndex;
  // Check if it's a branch status (maps to next step after parent)
  if (branchStatuses) {
    for (const [parentStep, branches] of Object.entries(branchStatuses)) {
      if (branches.includes(statusId)) {
        const parentIndex = steps.indexOf(parentStep);
        return parentIndex >= 0 ? Math.min(parentIndex + 1, steps.length - 1) : 0;
      }
    }
  }
  return 0;
}

/** Get all non-terminal statuses (active/in-progress) */
export function getActiveStatuses(config: EntityStatusConfig): string[] {
  return config.statuses.filter(s => !s.isTerminal).map(s => s.id);
}

/** Get all positive terminal statuses (completed/won without isNegative) */
export function getPositiveTerminalStatuses(config: EntityStatusConfig): string[] {
  return config.statuses.filter(s => s.isTerminal && !s.isNegative).map(s => s.id);
}

/** Get all negative terminal statuses */
export function getNegativeStatuses(config: EntityStatusConfig): string[] {
  return config.statuses.filter(s => s.isNegative === true).map(s => s.id);
}
