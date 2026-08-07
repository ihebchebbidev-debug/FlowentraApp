import { useEffect, useState } from 'react';

interface SmoothUpdateProgressProps {
  isReloading: boolean;
  progress: number; // 0-100
  onCancel?: () => void;
}

/**
 * Subtle progress bar that appears at the top during silent reload
 * Barely noticeable unless user is looking for it
 */
export function SmoothUpdateProgress({
  isReloading,
  progress,
  onCancel,
}: SmoothUpdateProgressProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isReloading) {
      setVisible(true);
    }
  }, [isReloading]);

  if (!visible) {
    return null;
  }

  return (
    <>
      {/* Subtle progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 z-[10000] shadow-lg"
        style={{
          width: `${progress}%`,
          opacity: progress > 0 ? 0.8 : 0,
          transition: 'width 0.3s ease-out, opacity 0.2s ease-out',
        }}
      />

      {/* Minimal notification during reload */}
      {progress > 40 && (
        <div className="fixed top-4 right-4 z-[9999] flex items-center gap-2 px-3 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md animate-fade-in">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Updating app...
            </span>
          </div>
          
          {onCancel && progress < 90 && (
            <button
              onClick={onCancel}
              className="ml-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Ensure smooth fade-in animation exists */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
