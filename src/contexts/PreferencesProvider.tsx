import React from 'react';
import { PreferencesContext, usePreferencesManager } from '@/hooks/usePreferences';

interface PreferencesProviderProps {
  children: React.ReactNode;
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const preferencesManager = usePreferencesManager();

  return (
    <PreferencesContext.Provider value={preferencesManager}>
      {children}
    </PreferencesContext.Provider>
  );
}