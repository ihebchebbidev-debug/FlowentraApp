import React from 'react';

/**
 * Lightweight skeleton shown while a lazy block chunk is loading.
 * Keeps visual layout stable (no layout shift) during chunk fetch.
 */
export const BlockFallback: React.FC = () => (
  <div className="w-full py-6 px-6 animate-pulse">
    <div className="max-w-5xl mx-auto space-y-3">
      <div className="h-4 w-1/3 rounded bg-muted" />
      <div className="h-3 w-2/3 rounded bg-muted/70" />
      <div className="h-3 w-1/2 rounded bg-muted/50" />
    </div>
  </div>
);
