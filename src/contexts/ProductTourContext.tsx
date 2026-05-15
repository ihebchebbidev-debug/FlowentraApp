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
    throw new Error('useProductTourContext must be used within ProductTourProvider');
  }
  return context;
};
