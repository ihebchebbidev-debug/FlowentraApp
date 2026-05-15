import React, { useEffect, useState } from 'react';
import { useLoading } from '../contexts/LoadingContext';

export const TopProgressBar: React.FC = () => {
  const { loadingState } = useLoading();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (loadingState.isLoading) {
      setVisible(true);
      setProgress(loadingState.progress || 0);
    } else {
      // Complete the progress bar before hiding
      setProgress(100);
      const timer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loadingState.isLoading, loadingState.progress]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-background/10">
      <div 
        className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary transition-all duration-300 ease-out"
        style={{ 
          width: `${progress}%`,
          boxShadow: progress > 0 ? '0 0 10px rgba(var(--primary), 0.5)' : 'none'
        }}
      />
      {loadingState.loadingMessage && (
        <div className="absolute top-1 left-4 text-xs text-primary font-medium">
          {loadingState.loadingMessage}
        </div>
      )}
    </div>
  );
};