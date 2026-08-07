 // Generic Import System Types
 
 export interface ImportField {
   key: string;
   label: string;
   required: boolean;
   type?: 'string' | 'number' | 'boolean' | 'date';
   validate?: (value: any) => string | null; // Returns error message or null
 }
 
 export interface ImportEntity<T = any> {
   id: string;
   originalIndex?: number;
   data: T;
   status: 'valid' | 'invalid' | 'duplicate' | 'empty';
   errors: string[];
   warnings: string[];
   selected: boolean;
   duplicateOf?: string;
   duplicateFields?: string[];
 }
 
 export interface ColumnMapping {
   [sourceColumn: string]: string | null;
 }
 
 export interface ImportPreview<T = any> {
   rows: ImportEntity<T>[];
   totalRows: number;
   validRows: number;
   invalidRows: number;
   excludedRows: number;
   duplicateRows: number;
   emptyRows: number;
   isLargeDataset?: boolean;
   previewRows?: number;
 }
 
 export interface ImportResult {
   successCount: number;
   errorCount: number;
   errors: string[];
 }
 
export interface ImportConfig<T = any> {
  entityName: string;
  fields: ImportField[];
  requiredFields: string[];
  duplicateCheckFields: string[];
  templateFilename: string;
  templateSheetName: string;
  exampleData?: Record<string, any>[]; // Example rows for template download
  transformRow: (mappedData: Record<string, any>) => T;
  validateRow?: (data: T) => { errors: string[]; warnings: string[] };
}
 
 export interface BulkImportRequest<T = any> {
   items: T[];
   skipDuplicates?: boolean;
   updateExisting?: boolean;
 }
 
 export interface BulkImportResult {
   totalProcessed: number;
   successCount: number;
   failedCount: number;
   skippedCount: number;
   errors: string[];
   importedItems?: any[];
 }