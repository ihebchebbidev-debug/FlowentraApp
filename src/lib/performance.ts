// Performance utilities for enterprise-scale React applications

/**
 * Debounce function - delays execution until after wait milliseconds 
 * have elapsed since the last call
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Throttle function - ensures function is called at most once per limit milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          func.apply(this, lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

/**
 * Memoize function with configurable cache size (LRU-like)
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  options: { maxSize?: number; keyGenerator?: (...args: Parameters<T>) => string } = {}
): T {
  const { maxSize = 100, keyGenerator } = options;
  const cache = new Map<string, ReturnType<T>>();
  const keys: string[] = [];
  
  return function (this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func.apply(this, args);
    
    // LRU eviction
    if (keys.length >= maxSize) {
      const oldestKey = keys.shift()!;
      cache.delete(oldestKey);
    }
    
    cache.set(key, result);
    keys.push(key);
    
    return result;
  } as T;
}

/**
 * Batch multiple rapid calls into a single execution
 */
export function batchCalls<T>(
  func: (items: T[]) => void,
  wait: number = 50
): (item: T) => void {
  let batch: T[] = [];
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (item: T) => {
    batch.push(item);
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func([...batch]);
      batch = [];
      timeoutId = null;
    }, wait);
  };
}

/**
 * Request idle callback polyfill with timeout
 */
export function requestIdleCallback(
  callback: () => void,
  options: { timeout?: number } = {}
): number {
  const { timeout = 1000 } = options;
  
  if ('requestIdleCallback' in window) {
    return (window as any).requestIdleCallback(callback, { timeout });
  }
  
  // Fallback for browsers without requestIdleCallback
  return (globalThis as any).setTimeout(callback, 1) as number;
}

/**
 * Cancel idle callback polyfill
 */
export function cancelIdleCallback(id: number): void {
  if ('cancelIdleCallback' in window) {
    (window as any).cancelIdleCallback(id);
  } else {
    (globalThis as any).clearTimeout(id);
  }
}

/**
 * Chunk array processing to prevent blocking the main thread
 */
export async function processInChunks<T, R>(
  items: T[],
  processor: (item: T, index: number) => R,
  chunkSize: number = 100,
  delayBetweenChunks: number = 0
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = chunk.map((item, idx) => processor(item, i + idx));
    results.push(...chunkResults);
    
    if (delayBetweenChunks > 0 && i + chunkSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenChunks));
    }
  }
  
  return results;
}

/**
 * Virtual scrolling helper - calculate visible range
 */
export function getVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan: number = 5
): { start: number; end: number } {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(totalItems - 1, start + visibleCount + overscan * 2);
  
  return { start, end };
}

/**
 * Measure component render time (development only)
 */
export function measureRender(componentName: string): () => void {
  if (import.meta.env.MODE !== 'development') {
    return () => {};
  }
  
  const start = performance.now();
  
  return () => {
    const duration = performance.now() - start;
    if (duration > 16) { // Longer than a single frame
      console.warn(`[Performance] ${componentName} took ${duration.toFixed(2)}ms to render`);
    }
  };
}

/**
 * Create a performance observer for long tasks
 */
export function observeLongTasks(
  callback: (entry: PerformanceEntry) => void,
  threshold: number = 50
): (() => void) | null {
  if (!('PerformanceObserver' in window)) {
    return null;
  }
  
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > threshold) {
          callback(entry);
        }
      }
    });
    
    observer.observe({ entryTypes: ['longtask'] });
    
    return () => observer.disconnect();
  } catch {
    return null;
  }
}

/**
 * Preload critical resources
 */
export function preloadResource(
  url: string,
  type: 'script' | 'style' | 'image' | 'font' | 'fetch'
): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  
  switch (type) {
    case 'script':
      link.as = 'script';
      break;
    case 'style':
      link.as = 'style';
      break;
    case 'image':
      link.as = 'image';
      break;
    case 'font':
      link.as = 'font';
      link.crossOrigin = 'anonymous';
      break;
    case 'fetch':
      link.as = 'fetch';
      link.crossOrigin = 'anonymous';
      break;
  }
  
  document.head.appendChild(link);
}

/**
 * Defer non-critical work
 */
export function deferWork(callback: () => void): void {
  if ('scheduler' in window && 'postTask' in (window as any).scheduler) {
    (window as any).scheduler.postTask(callback, { priority: 'background' });
  } else {
    requestIdleCallback(callback, { timeout: 5000 });
  }
}
