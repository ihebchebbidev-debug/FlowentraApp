import { ReactNode } from 'react';
import { LayoutModeContext, useLayoutMode } from '@/hooks/useLayoutMode';

interface LayoutModeProviderProps {
  children: ReactNode;
}

export function LayoutModeProvider({ children }: LayoutModeProviderProps) {
  const layoutModeValue = useLayoutMode();

  return (
    <LayoutModeContext.Provider value={layoutModeValue}>
      {children}
    </LayoutModeContext.Provider>
  );
}