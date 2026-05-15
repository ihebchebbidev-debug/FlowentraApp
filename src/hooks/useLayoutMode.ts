import { useState, useEffect, createContext, useContext } from 'react';

type LayoutMode = 'sidebar' | 'topbar';

interface LayoutModeContextType {
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  isMobile: boolean;
}

export const LayoutModeContext = createContext<LayoutModeContextType | undefined>(undefined);

export function useLayoutMode() {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('flowsolution-layout') as LayoutMode) || 'sidebar';
    }
    return 'sidebar';
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const setLayoutModeValue = (newMode: LayoutMode) => {
    localStorage.setItem('flowsolution-layout', newMode);
    setLayoutMode(newMode);
  };

  return {
    layoutMode,
    setLayoutMode: setLayoutModeValue,
    isMobile,
  };
}

export function useLayoutModeContext() {
  const context = useContext(LayoutModeContext);
  if (context === undefined) {
    // Return a default value instead of throwing an error to prevent React hook issues
    return {
      layoutMode: 'sidebar' as LayoutMode,
      setLayoutMode: () => {},
      isMobile: false,
    };
  }
  return context;
}