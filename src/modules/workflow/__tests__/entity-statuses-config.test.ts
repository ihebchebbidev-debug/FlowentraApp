/**
 * Tests that the workflow builder's status trigger/action nodes
 * correctly resolve statuses from the centralized config for every entity type.
 *
 * This validates the full chain:
 *   1. Config file (offer.config.ts, etc.)
 *   2. → entityStatusConfigs map (index.ts)
 *   3. → toStatusOptions() in entity-statuses.ts
 *   4. → getStatusesByEntityType() used by NodeConfigurationModal / NodeConfigPanel
 *   5. → getEntityTypeFromNodeType() resolves node type → entity type
 */
import { describe, it, expect } from 'vitest';
import {
  getStatusesByEntityType,
  getEntityTypeFromNodeType,
  getWorkflowSteps,
  getTerminalStatuses,
  getBranchStatuses,
  offerStatuses,
  saleStatuses,
  serviceOrderStatuses,
  dispatchStatuses,
  statusTriggerNodes,
  statusActionNodes,
  communicationActionNodes,
  type EntityType,
  type StatusOption,
} from '../data/entity-statuses';

import { entityStatusConfigs } from '@/config/entity-statuses';

// ─── Config Integrity ───────────────────────────────────────────────

describe('Centralized Config Integrity', () => {
  const entityTypes: EntityType[] = ['offer', 'sale', 'service_order', 'dispatch'];

  it.each(entityTypes)('entityStatusConfigs contains "%s"', (et) => {
    expect(entityStatusConfigs[et]).toBeDefined();
    expect(entityStatusConfigs[et].statuses.length).toBeGreaterThan(0);
  });

  it.each(entityTypes)('every status in "%s" has required fields', (et) => {
    for (const s of entityStatusConfigs[et].statuses) {
      expect(s.id).toBeTruthy();
      expect(s.translationKey).toBeTruthy();
      expect(s.workflowTranslationKey).toBeTruthy();
      expect(s.color).toBeTruthy();
      expect(typeof s.isTerminal).toBe('boolean');
    }
  });

  it.each(entityTypes)('workflow steps for "%s" reference valid status IDs', (et) => {
    const validIds = entityStatusConfigs[et].statuses.map(s => s.id);
    for (const step of entityStatusConfigs[et].workflow.steps) {
      expect(validIds).toContain(step);
    }
  });

  it.each(entityTypes)('terminal statuses for "%s" reference valid status IDs', (et) => {
    const validIds = entityStatusConfigs[et].statuses.map(s => s.id);
    for (const ts of entityStatusConfigs[et].workflow.terminalStatuses) {
      expect(validIds).toContain(ts);
    }
  });

  it.each(entityTypes)('branch statuses for "%s" reference valid status IDs', (et) => {
    const validIds = entityStatusConfigs[et].statuses.map(s => s.id);
    const branches = entityStatusConfigs[et].workflow.branchStatuses ?? {};
    for (const [parent, children] of Object.entries(branches) as [string, string[]][]) {
      expect(validIds).toContain(parent);
      for (const child of children) {
        expect(validIds).toContain(child);
      }
    }
  });
});

// ─── Workflow Module Mapping ────────────────────────────────────────

describe('getStatusesByEntityType (used by workflow dropdowns)', () => {
  it('returns correct offer statuses from config', () => {
    const statuses = getStatusesByEntityType('offer');
    expect(statuses.length).toBe(entityStatusConfigs.offer.statuses.length);
    expect(statuses.map(s => s.value)).toEqual(entityStatusConfigs.offer.statuses.map(s => s.id));
    // Verify shape
    for (const s of statuses) {
      expect(s).toHaveProperty('value');
      expect(s).toHaveProperty('labelKey');
      expect(s).toHaveProperty('color');
      expect(s).toHaveProperty('isTerminal');
    }
  });

  it('returns correct sale statuses from config', () => {
    const statuses = getStatusesByEntityType('sale');
    expect(statuses.map(s => s.value)).toContain('created');
    expect(statuses.map(s => s.value)).toContain('in_progress');
    expect(statuses.map(s => s.value)).toContain('closed');
    expect(statuses.map(s => s.value)).toContain('cancelled');
  });

  it('returns correct service_order statuses from config', () => {
    const statuses = getStatusesByEntityType('service_order');
    expect(statuses.map(s => s.value)).toContain('draft');
    expect(statuses.map(s => s.value)).toContain('pending');
    expect(statuses.map(s => s.value)).toContain('in_progress');
    expect(statuses.map(s => s.value)).toContain('technically_completed');
    expect(statuses.map(s => s.value)).toContain('closed');
  });

  it('returns correct dispatch statuses from config', () => {
    const statuses = getStatusesByEntityType('dispatch');
    expect(statuses.map(s => s.value)).toContain('pending');
    expect(statuses.map(s => s.value)).toContain('planned');
    expect(statuses.map(s => s.value)).toContain('confirmed');
    expect(statuses.map(s => s.value)).toContain('rejected');
    expect(statuses.map(s => s.value)).toContain('in_progress');
    expect(statuses.map(s => s.value)).toContain('completed');
    expect(statuses.map(s => s.value)).toContain('cancelled');
  });
});

// ─── Static Exports Match Config ────────────────────────────────────

describe('Static status arrays match config', () => {
  it('offerStatuses matches offer config', () => {
    expect(offerStatuses).toEqual(getStatusesByEntityType('offer'));
  });
  it('saleStatuses matches sale config', () => {
    expect(saleStatuses).toEqual(getStatusesByEntityType('sale'));
  });
  it('serviceOrderStatuses matches service_order config', () => {
    expect(serviceOrderStatuses).toEqual(getStatusesByEntityType('service_order'));
  });
  it('dispatchStatuses matches dispatch config', () => {
    expect(dispatchStatuses).toEqual(getStatusesByEntityType('dispatch'));
  });
});

// ─── Node Type → Entity Type Resolution ─────────────────────────────

describe('getEntityTypeFromNodeType (used by NodeConfigurationModal)', () => {
  it.each([
    ['offer-status-trigger', 'offer'],
    ['update-offer-status', 'offer'],
    ['sale-status-trigger', 'sale'],
    ['update-sale-status', 'sale'],
    ['service-order-status-trigger', 'service_order'],
    ['update-service-order-status', 'service_order'],
    ['dispatch-status-trigger', 'dispatch'],
    ['update-dispatch-status', 'dispatch'],
  ])('resolves "%s" → "%s"', (nodeType, expected) => {
    expect(getEntityTypeFromNodeType(nodeType)).toBe(expected);
  });

  it('returns null for non-entity node types', () => {
    expect(getEntityTypeFromNodeType('send-notification')).toBeNull();
    expect(getEntityTypeFromNodeType('request-approval')).toBeNull();
    expect(getEntityTypeFromNodeType('if-else')).toBeNull();
    expect(getEntityTypeFromNodeType('delay')).toBeNull();
  });
});

// ─── Trigger / Action Node Arrays ───────────────────────────────────

describe('statusTriggerNodes and statusActionNodes', () => {
  it('trigger nodes all resolve to an entity type', () => {
    for (const node of statusTriggerNodes) {
      const et = getEntityTypeFromNodeType(node);
      expect(et).not.toBeNull();
      const statuses = getStatusesByEntityType(et!);
      expect(statuses.length).toBeGreaterThan(0);
    }
  });

  it('action nodes all resolve to an entity type', () => {
    for (const node of statusActionNodes) {
      const et = getEntityTypeFromNodeType(node);
      expect(et).not.toBeNull();
      const statuses = getStatusesByEntityType(et!);
      expect(statuses.length).toBeGreaterThan(0);
    }
  });

  it('communication nodes do NOT resolve to entity types', () => {
    for (const node of communicationActionNodes) {
      expect(getEntityTypeFromNodeType(node)).toBeNull();
    }
  });

  it('statusActionNodes does NOT include communication nodes', () => {
    const actionSet = new Set(statusActionNodes as readonly string[]);
    for (const comm of communicationActionNodes) {
      expect(actionSet.has(comm)).toBe(false);
    }
  });
});

// ─── Workflow Steps & Terminal Helpers ───────────────────────────────

describe('Workflow step helpers', () => {
  it.each<EntityType>(['offer', 'sale', 'service_order', 'dispatch'])('getWorkflowSteps("%s") returns non-empty array', (et) => {
    const steps = getWorkflowSteps(et);
    expect(steps.length).toBeGreaterThan(0);
    // Every step must be a valid status ID
    const validIds = getStatusesByEntityType(et).map(s => s.value);
    for (const step of steps) {
      expect(validIds).toContain(step);
    }
  });

  it.each<EntityType>(['offer', 'sale', 'service_order', 'dispatch'])('getTerminalStatuses("%s") returns non-empty array', (et) => {
    const terminals = getTerminalStatuses(et);
    expect(terminals.length).toBeGreaterThan(0);
    const validIds = getStatusesByEntityType(et).map(s => s.value);
    for (const t of terminals) {
      expect(validIds).toContain(t);
    }
  });

  it.each<EntityType>(['offer', 'sale', 'service_order', 'dispatch'])('getBranchStatuses("%s") keys are valid step IDs', (et) => {
    const branches = getBranchStatuses(et);
    const stepIds = getWorkflowSteps(et);
    const validIds = getStatusesByEntityType(et).map(s => s.value);
    for (const [parent, children] of Object.entries(branches)) {
      // Parent must be a workflow step
      expect(stepIds).toContain(parent);
      // Children must be valid status IDs
      for (const child of children) {
        expect(validIds).toContain(child);
      }
    }
  });
});

// ─── Translation Key Format ─────────────────────────────────────────

describe('Translation key format consistency', () => {
  it.each<EntityType>(['offer', 'sale', 'service_order', 'dispatch'])('"%s" workflow translation keys follow status.<entity>.<id> format', (et) => {
    const statuses = getStatusesByEntityType(et);
    const entityKeyPart = et === 'service_order' ? 'serviceOrder' : et;
    for (const s of statuses) {
      expect(s.labelKey).toMatch(new RegExp(`^status\\.${entityKeyPart}\\.\\w+$`));
    }
  });
});
