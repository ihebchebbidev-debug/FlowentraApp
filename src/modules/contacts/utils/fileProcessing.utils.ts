// Large file processing utilities
export interface FileProcessingConfig {
  maxFileSize: number; // in MB
  chunkSize: number; // rows per chunk
  maxPreviewRows: number;
  memoryThreshold: number; // in MB
}

export const DEFAULT_CONFIG: FileProcessingConfig = {
  maxFileSize: 50, // 50MB max file size
  chunkSize: 1000, // Process 1000 rows at a time
  maxPreviewRows: 10000, // Show max 10k rows in preview
  memoryThreshold: 100 // 100MB memory threshold
};

export class LargeFileProcessor {
  private config: FileProcessingConfig;

  constructor(config: Partial<FileProcessingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  validateFileSize(file: File): { valid: boolean; message?: string } {
    const fileSizeMB = file.size / (1024 * 1024);
    
    if (fileSizeMB > this.config.maxFileSize) {
      return {
        valid: false,
        message: `File size (${fileSizeMB.toFixed(1)}MB) exceeds maximum allowed size of ${this.config.maxFileSize}MB`
      };
    }

    return { valid: true };
  }

  async processFileInChunks<T>(
    data: T[],
    processor: (chunk: T[], chunkIndex: number) => Promise<any>,
    onProgress?: (progress: number, processedRows: number, totalRows: number) => void
  ): Promise<any[]> {
    const results: any[] = [];
    const totalChunks = Math.ceil(data.length / this.config.chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      const startIdx = i * this.config.chunkSize;
      const endIdx = Math.min(startIdx + this.config.chunkSize, data.length);
      const chunk = data.slice(startIdx, endIdx);
      
      try {
        const result = await processor(chunk, i);
        results.push(result);
        
        // Update progress
        const progress = ((i + 1) / totalChunks) * 100;
        const processedRows = Math.min(endIdx, data.length);
        onProgress?.(progress, processedRows, data.length);
        
        // Yield control to prevent UI blocking
        await new Promise(resolve => setTimeout(resolve, 10));
        
      } catch (error) {
        console.error(`Error processing chunk ${i}:`, error);
        throw error;
      }
    }
    
    return results;
  }

  shouldUseSampling(dataLength: number): boolean {
    return dataLength > this.config.maxPreviewRows;
  }

  createSample<T>(data: T[], sampleSize: number = 1000): T[] {
    if (data.length <= sampleSize) return data;
    
    // Use systematic sampling for better representation
    const step = Math.floor(data.length / sampleSize);
    const sample: T[] = [];
    
    for (let i = 0; i < data.length; i += step) {
      sample.push(data[i]);
      if (sample.length >= sampleSize) break;
    }
    
    return sample;
  }

  estimateMemoryUsage(data: any[]): number {
    if (data.length === 0) return 0;
    
    // Estimate memory usage based on first few rows
    const sampleSize = Math.min(10, data.length);
    const sample = data.slice(0, sampleSize);
    const avgRowSize = JSON.stringify(sample).length / sampleSize;
    
    return (avgRowSize * data.length) / (1024 * 1024); // Convert to MB
  }

  async processWithMemoryManagement<T>(
    data: T[],
    processor: (item: T) => any,
    onProgress?: (progress: number) => void
  ): Promise<any[]> {
    const estimatedMemory = this.estimateMemoryUsage(data);
    
    if (estimatedMemory > this.config.memoryThreshold) {
      console.warn(`Large dataset detected (${estimatedMemory.toFixed(1)}MB). Using chunked processing.`);
      
      return this.processFileInChunks(
        data,
        async (chunk) => chunk.map(processor),
        (progress) => onProgress?.(progress)
      ).then(chunks => chunks.flat());
    }
    
    // Process normally for smaller datasets
    return data.map(processor);
  }
}

export const largeFileProcessor = new LargeFileProcessor();