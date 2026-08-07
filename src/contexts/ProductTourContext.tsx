import React, { createContext, useContext, ReactNode } from 'react';
import { useProductTour, UseProductTourReturn } from '@/hooks/useProductTour';

const ProductTourContext = createContext<UseProductTourReturn | null>(null);

export const ProductTourProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const tour = useProductTour();
  
  return (
    <ProductTourContext.Provider value={tour}>
      {children}
    </ProductTourContext.Provider>
  );
};

export const useProductTourContext = (): UseProductTourReturn => {
  const context = useContext(ProductTourContext);
  if (!context) {
    // Fallback no-op tour so components outside a ProductTourProvider
    // (e.g. Support module) don't crash the whole page.
    return {
      isRunning: false,
      stepIndex: 0,
      steps: [],
      startTour: () => {},
      endTour: () => {},
      nextStep: () => {},
      prevStep: () => {},
      goToStep: () => {},
    } as unknown as UseProductTourReturn;
  }
  return context;
};
