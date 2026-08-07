// Memory management utilities
export class MemoryManager {
  private static instance: MemoryManager;
  private memoryUsage: Map<string, number> = new Map();

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  getMemoryInfo(): { used: number; total: number; available: number } {
    // Use performance.memory if available (Chrome/Edge)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize / (1024 * 1024), // MB
        total: memory.totalJSHeapSize / (1024 * 1024), // MB
        available: memory.jsHeapSizeLimit / (1024 * 1024) // MB
      };
    }
    
    // Fallback estimation
    return {
      used: 0,
      total: 0,
      available: 256 // Assume 256MB available
    };
  }

  trackMemoryUsage(key: string, data: any): void {
    const size = this.estimateObjectSize(data);
    this.memoryUsage.set(key, size);
  }

  releaseMemory(key: string): void {
    this.memoryUsage.delete(key);
  }

  private estimateObjectSize(obj: any): number {
    try {
      return new Blob([JSON.stringify(obj)]).size / (1024 * 1024); // MB
    } catch {
      return 0;
    }
  }

  getTotalTrackedMemory(): number {
    return Array.from(this.memoryUsage.values()).reduce((sum, size) => sum + size, 0);
  }

  shouldOptimizeForMemory(): boolean {
    const memInfo = this.getMemoryInfo();
    const trackedMemory = this.getTotalTrackedMemory();
    
    // If we're using more than 70% of available memory, optimize
    return trackedMemory > (memInfo.available * 0.7);
  }

  async garbageCollect(): Promise<void> {
    // Force garbage collection if possible
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
    
    // Clear large data structures
    this.memoryUsage.clear();
    
    // Wait for next tick
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  optimizeDataForMemory<T>(data: T[], maxItems: number = 1000): T[] {
    if (data.length <= maxItems) return data;
    
    console.warn(`Optimizing large dataset (${data.length} items) for memory usage`);
    
    // Use systematic sampling
    const step = Math.ceil(data.length / maxItems);
    const optimized: T[] = [];
    
    for (let i = 0; i < data.length; i += step) {
      optimized.push(data[i]);
    }
    
    return optimized;
  }
}

export const memoryManager = MemoryManager.getInstance();