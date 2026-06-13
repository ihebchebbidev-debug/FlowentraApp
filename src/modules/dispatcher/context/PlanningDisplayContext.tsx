import { createContext, useContext } from 'react';
import type { PlanningCardField } from '../types/planningProfile';
import { DEFAULT_PLANNING_SETTINGS } from '../types/planningProfile';

/**
 * Holds the active profile's card-display preferences so deeply-nested calendar
 * blocks and the unassigned list can render configurable labels/hover without
 * prop-drilling through the whole board.
 */
export interface PlanningDisplay {
  cardPrimaryFields: PlanningCardField[];
  cardSeparator: string;
  hoverFields: PlanningCardField[];
  showJobsOnHover: boolean;
}

const DEFAULT: PlanningDisplay = {
  cardPrimaryFields: DEFAULT_PLANNING_SETTINGS.cardPrimaryFields,
  cardSeparator: DEFAULT_PLANNING_SETTINGS.cardSeparator,
  hoverFields: DEFAULT_PLANNING_SETTINGS.hoverFields,
  showJobsOnHover: DEFAULT_PLANNING_SETTINGS.showJobsOnHover,
};

const PlanningDisplayContext = createContext<PlanningDisplay>(DEFAULT);

export const PlanningDisplayProvider = PlanningDisplayContext.Provider;

export function usePlanningDisplay(): PlanningDisplay {
  return useContext(PlanningDisplayContext);
}
