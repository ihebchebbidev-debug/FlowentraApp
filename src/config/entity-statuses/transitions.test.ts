import { describe, it, expect } from 'vitest';
import { getAllowedTransitions, isTransitionAllowed } from './transitions';
import { entityStatusConfigs } from './index';
import type { EntityType } from './types';

describe('sequential status transitions', () => {
  it('dispatch: only one step forward/back plus branches', () => {
    expect(getAllowedTransitions('dispatch', 'assigned').sort()).toEqual(
      ['confirmed', 'cancelled', 'rejected'].sort()
    );
    expect(isTransitionAllowed('dispatch', 'assigned', 'completed')).toBe(false);
    expect(isTransitionAllowed('dispatch', 'completed', 'assigned')).toBe(false);
    // legacy statuses re-enter the pipeline at 'assigned'
    expect(isTransitionAllowed('dispatch', 'planned', 'assigned')).toBe(true);
  });

  it('service order: no skipping ahead', () => {
    expect(isTransitionAllowed('service_order', 'pending', 'invoiced')).toBe(false);
  });

  it('offer: draft cannot jump to accepted', () => {
    expect(isTransitionAllowed('offer', 'draft', 'accepted')).toBe(false);
    expect(isTransitionAllowed('offer', 'draft', 'sent')).toBe(true);
  });

  it('every entity: happy path moves exactly one step at a time', () => {
    (Object.keys(entityStatusConfigs) as EntityType[]).forEach((entity) => {
      const steps = entityStatusConfigs[entity].workflow.steps;
      steps.forEach((step, i) => {
        const allowed = getAllowedTransitions(entity, step);
        if (entityStatusConfigs[entity].statuses.find((s) => s.id === step)?.isTerminal) return;
        steps.forEach((other, j) => {
          if (Math.abs(i - j) > 1) expect(allowed).not.toContain(other);
        });
      });
    });
  });
});
