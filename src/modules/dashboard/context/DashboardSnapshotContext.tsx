import { createContext, useContext, type ReactNode } from 'react';
import type { DashboardData } from '../hooks/useDashboardData';

/**
 * When a public (shared) dashboard is viewed, this context provides
 * a static data snapshot so widgets can render without authenticated API calls.
 */
const DashboardSnapshotContext = createContext<DashboardData | null>(null);

export function DashboardSnapshotProvider({
  snapshot,
  children,
}: {
  snapshot: DashboardData;
  children: ReactNode;
}) {
  return (
    <DashboardSnapshotContext.Provider value={snapshot}>
      {children}
    </DashboardSnapshotContext.Provider>
  );
}

/** Returns snapshot data if inside a public view, otherwise null */
export function useDashboardSnapshot(): DashboardData | null {
  return useContext(DashboardSnapshotContext);
}
