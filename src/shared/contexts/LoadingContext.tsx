import React, { createContext, useContext, useState, useCallback } from 'react';

interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
  progress?: number;
}

interface LoadingContextType {
  loadingState: LoadingState;
  setLoading: (loading: boolean, message?: string, progress?: number) => void;
  setProgress: (progress: number) => void;
  withLoading: <T>(
    asyncFn: () => Promise<T>,
    message?: string
  ) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: React.ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    loadingMessage: undefined,
    progress: undefined,
  });

  const setLoading = useCallback((loading: boolean, message?: string, progress?: number) => {
    setLoadingState({
      isLoading: loading,
      loadingMessage: message,
      progress: progress,
    });
  }, []);

  const setProgress = useCallback((progress: number) => {
    setLoadingState(prev => ({
      ...prev,
      progress: Math.max(0, Math.min(100, progress)),
    }));
  }, []);

  const withLoading = useCallback(async <T,>(
    asyncFn: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    let progressInterval: ReturnType<typeof setInterval> | undefined;
    try {
      setLoading(true, message, 0);
      
      // Simulate progress updates
      progressInterval = setInterval(() => {
        setLoadingState(prev => {
          if (prev.progress !== undefined && prev.progress < 90) {
            return { ...prev, progress: prev.progress + Math.random() * 10 };
          }
          return prev;
        });
      }, 100);

      const result = await asyncFn();
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Keep the completed state briefly
      setTimeout(() => {
        setLoading(false);
      }, 200);
      
      return result;
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      setLoading(false);
      throw error;
    }
  }, [setLoading, setProgress]);

  const value: LoadingContextType = {
    loadingState,
    setLoading,
    setProgress,
    withLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};
