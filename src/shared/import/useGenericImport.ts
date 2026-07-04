 import { useState, useCallback } from 'react';
 import { useToast } from '@/hooks/use-toast';
 import type { 
   ImportConfig, 
   ColumnMapping, 
   ImportPreview, 
   ImportResult,
   BulkImportResult 
 } from './types';
import { 
  parseExcelFile, 
  generateImportPreview, 
  autoMapColumns,
  generateExcelTemplate 
} from './utils';
import { BulkImportRequestError } from './parseBulkImportResponse';
 
 export type ImportStep = 'upload' | 'analyzing' | 'mapping' | 'preview' | 'summary';

 export interface ImportSummary {
   totalInFile: number;
   validRows: number;
   invalidRows: number;
   duplicateRows: number;
   emptyRows: number;
   selectedForImport: number;
   successCount: number;
   failedCount: number;
   skippedCount: number;
   errors: string[];
   invalidDetails: Array<{ rowIndex: number; name: string; errors: string[] }>;
   duplicateDetails: Array<{ rowIndex: number; name: string; fields: string[] }>;
   /** True when every selected row failed (request or server-side batch). */
   requestFailed?: boolean;
   /** Primary error line for total failures. */
   primaryError?: string;
   /** HTTP status when the whole request failed. */
   httpStatus?: number;
 }
 
 export interface UseGenericImportOptions<T> {
   config: ImportConfig<T>;
   onImport: (items: T[]) => Promise<BulkImportResult>;
   onSuccess?: () => void;
 }
 
 export function useGenericImport<T>({ config, onImport, onSuccess }: UseGenericImportOptions<T>) {
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);
   const [uploadProgress, setUploadProgress] = useState(0);
   const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
   const [rawData, setRawData] = useState<any[]>([]);
   const [headers, setHeaders] = useState<string[]>([]);
   const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
   const [preview, setPreview] = useState<ImportPreview<T> | null>(null);
   const [fileName, setFileName] = useState<string>('');
   const [analysisMessage, setAnalysisMessage] = useState<string>('');
   const [fileMetadata, setFileMetadata] = useState<any>(null);
   const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
   const [importError, setImportError] = useState<string | null>(null);
   const [importErrorDetails, setImportErrorDetails] = useState<string[]>([]);

   const processFile = useCallback(async (file: File) => {
     setIsLoading(true);
     setUploadProgress(0);
     setFileName(file.name);

     try {
       setAnalysisMessage('📄 Reading Excel file...');
       setUploadProgress(10);
       
       const result = await parseExcelFile(file);
       const { headers: fileHeaders, data, metadata } = result;
       
       setFileMetadata(metadata);
       setAnalysisMessage('✅ File parsed successfully');
       setUploadProgress(30);
       
       if (fileHeaders.length === 0) throw new Error('No headers found in the file');
       if (data.length === 0) throw new Error('No data rows found in the file');

       setHeaders(fileHeaders);
       setRawData(data);
       
       setCurrentStep('analyzing');
       setUploadProgress(50);
       setAnalysisMessage('🔍 Analyzing columns...');
       
       const autoMapping = autoMapColumns(fileHeaders, config);
       setColumnMapping(autoMapping);
       
       setUploadProgress(100);
       setAnalysisMessage('🎉 Ready for column mapping!');
       
       await new Promise(resolve => setTimeout(resolve, 300));
       setCurrentStep('mapping');

       toast({
         title: "File processed successfully!",
         description: `Found ${fileHeaders.length} columns and ${data.length} rows`
       });

     } catch (error) {
       const message = error instanceof Error ? error.message : 'Failed to process file';
       toast({
         title: "Upload Failed",
         description: message,
         variant: "destructive"
       });
       resetImport();
     } finally {
       setIsLoading(false);
       setUploadProgress(0);
       setAnalysisMessage('');
     }
   }, [config, toast]);

   const updateColumnMapping = useCallback((mapping: ColumnMapping) => {
     setColumnMapping(mapping);
   }, []);

   const generatePreview = useCallback(() => {
     if (rawData.length > 0 && Object.keys(columnMapping).length > 0) {
       const previewData = generateImportPreview(rawData, columnMapping, config);
       setPreview(previewData);
       setCurrentStep('preview');
     }
   }, [rawData, columnMapping, config]);

   const toggleRowSelection = useCallback((rowId: string) => {
     setPreview(prev => {
       if (!prev) return prev;
       return {
         ...prev,
         rows: prev.rows.map(row => 
           row.id === rowId ? { ...row, selected: !row.selected } : row
         )
       };
     });
   }, []);

   const toggleAllRowsSelection = useCallback((selected: boolean) => {
     setPreview(prev => {
       if (!prev) return prev;
       return {
         ...prev,
         rows: prev.rows.map(row => 
           row.status === 'valid' ? { ...row, selected } : row
         )
       };
     });
   }, []);

   const executeImport = useCallback(async (): Promise<ImportResult> => {
     if (!preview) throw new Error('No preview data available');

     const selectedRows = preview.rows.filter(row => row.selected && row.status === 'valid');
     if (selectedRows.length === 0) throw new Error('No valid rows selected for import');

     setIsLoading(true);
     setImportError(null);
     setImportErrorDetails([]);

     try {
       const itemsToImport = selectedRows.map(row => row.data);
       const result = await onImport(itemsToImport);

       const requestFailed =
         result.successCount === 0 &&
         selectedRows.length > 0 &&
         (result.failedCount >= selectedRows.length || result.errors.length > 0);

       const primaryError = result.errors[0];

       // Build detailed summary
       const invalidDetails = preview.rows
         .filter(r => r.status === 'invalid')
         .slice(0, 20)
         .map(r => ({
           rowIndex: (r.originalIndex ?? 0) + 2, // +2 for 1-indexed + header row
           name: String((r.data as any)?.name || (r.data as any)?.sku || `Row ${(r.originalIndex ?? 0) + 2}`),
           errors: r.errors,
         }));

       const duplicateDetails = preview.rows
         .filter(r => r.status === 'duplicate')
         .slice(0, 20)
         .map(r => ({
           rowIndex: (r.originalIndex ?? 0) + 2,
           name: String((r.data as any)?.name || (r.data as any)?.sku || `Row ${(r.originalIndex ?? 0) + 2}`),
           fields: r.duplicateFields || [],
         }));

       const summary: ImportSummary = {
         totalInFile: preview.totalRows,
         validRows: preview.validRows,
         invalidRows: preview.invalidRows,
         duplicateRows: preview.duplicateRows,
         emptyRows: preview.emptyRows,
         selectedForImport: selectedRows.length,
         successCount: result.successCount,
         failedCount: result.failedCount,
         skippedCount: result.skippedCount,
         errors: result.errors,
         invalidDetails,
         duplicateDetails,
         requestFailed,
         primaryError,
       };

       setImportSummary(summary);
       setCurrentStep('summary');

       const totalInFile = preview.totalRows;
       if (requestFailed && result.successCount === 0) {
         const detailLines = result.errors.length > 0 ? result.errors : ['No details returned by the server.'];
         setImportError(primaryError ?? detailLines[0] ?? 'Import failed');
         setImportErrorDetails(detailLines);
         toast({
           title: 'Import failed',
           description: primaryError ?? detailLines[0] ?? 'All rows failed to import.',
           variant: 'destructive',
         });
       } else if (result.successCount > 0) {
         toast({
           title: `✅ ${result.successCount}/${totalInFile} imported successfully`,
           description: result.failedCount > 0 
             ? `${result.failedCount} failed, ${result.skippedCount} skipped`
             : result.skippedCount > 0 
               ? `${result.skippedCount} skipped (duplicates)`
               : 'All items imported without errors',
         });
       } else if (result.failedCount > 0 || result.errors.length > 0) {
         toast({
           title: 'Import completed with errors',
           description: `${result.failedCount} failed · ${result.errors[0] ?? 'See summary for details'}`,
           variant: 'destructive',
         });
       }

       return {
         successCount: result.successCount,
         errorCount: result.failedCount,
         errors: result.errors
       };

     } catch (error) {
       const bulkError = error instanceof BulkImportRequestError
         ? error
         : new BulkImportRequestError(
             error instanceof Error ? error.message : 'Import failed',
             { details: [error instanceof Error ? error.message : 'Import failed'] },
           );
       const detailLines = bulkError.details.length > 0
         ? bulkError.details
         : bulkError.message.split('\n').map((l) => l.trim()).filter(Boolean);

       setImportError(bulkError.message);
       setImportErrorDetails(detailLines);
       setImportSummary(null);

       toast({
         title: bulkError.status ? `Import failed (HTTP ${bulkError.status})` : 'Import failed',
         description: bulkError.message,
         variant: 'destructive',
       });

       console.error(
         'Bulk import failed:',
         bulkError.message,
         bulkError.status != null ? `(HTTP ${bulkError.status})` : '',
         detailLines,
       );
       
       return {
         successCount: 0,
         errorCount: selectedRows.length,
         errors: detailLines,
       };
     } finally {
       setIsLoading(false);
     }
   }, [preview, onImport, toast]);

   const closeSummary = useCallback(() => {
     onSuccess?.();
     resetImport();
   }, [onSuccess]);

   const resetImport = useCallback(() => {
     setCurrentStep('upload');
     setRawData([]);
     setHeaders([]);
     setColumnMapping({});
     setPreview(null);
     setFileName('');
     setUploadProgress(0);
     setAnalysisMessage('');
     setFileMetadata(null);
     setImportSummary(null);
     setImportError(null);
     setImportErrorDetails([]);
   }, []);

  const downloadTemplate = useCallback((localizedHeaders?: string[], exampleData?: Record<string, any>[]) => {
    generateExcelTemplate(config, localizedHeaders, exampleData);
  }, [config]);

   const deleteDuplicateRows = useCallback((duplicateIds: string[]) => {
     if (!preview) return;
     
     const updatedRows = preview.rows.filter(row => !duplicateIds.includes(row.id));
     const validRows = updatedRows.filter(row => row.status === 'valid');
     const invalidRows = updatedRows.filter(row => row.status === 'invalid');
     const duplicateRows = updatedRows.filter(row => row.status === 'duplicate');
     const emptyRows = updatedRows.filter(row => row.status === 'empty');
     
     setPreview({
       ...preview,
       rows: updatedRows,
       totalRows: updatedRows.length,
       validRows: validRows.length,
       invalidRows: invalidRows.length,
       duplicateRows: duplicateRows.length,
       emptyRows: emptyRows.length
     });
     
     toast({
       title: "Duplicates removed",
       description: `${duplicateIds.length} duplicate records have been removed.`
     });
   }, [preview, toast]);

   const keepDuplicateRows = useCallback((duplicateIds: string[]) => {
     if (!preview) return;
     
     const updatedRows = preview.rows.map(row => 
       duplicateIds.includes(row.id) 
         ? { ...row, status: 'valid' as const, selected: true }
         : row
     );
     
     const validRows = updatedRows.filter(row => row.status === 'valid');
     const duplicateRows = updatedRows.filter(row => row.status === 'duplicate');
     
     setPreview({
       ...preview,
       rows: updatedRows,
       validRows: validRows.length,
       duplicateRows: duplicateRows.length
     });
     
     toast({
       title: "Duplicates kept",
       description: `${duplicateIds.length} duplicate records will be imported.`
     });
   }, [preview, toast]);

   const canProceedToPreview = useCallback(() => {
     const mappedFields = Object.values(columnMapping).filter(f => f !== null);
     const hasRequiredField = config.requiredFields.some(rf => mappedFields.includes(rf));
     return hasRequiredField;
   }, [columnMapping, config.requiredFields]);
   
   return {
     // State
     isLoading,
     uploadProgress,
     currentStep,
     headers,
     rawData,
     columnMapping,
     preview,
     fileName,
     analysisMessage,
     fileMetadata,
     importSummary,
     importError,
     importErrorDetails,

     // Actions
     processFile,
     updateColumnMapping,
     generatePreview,
     toggleRowSelection,
     toggleAllRowsSelection,
     executeImport,
     resetImport,
     downloadTemplate,
     deleteDuplicateRows,
     keepDuplicateRows,
     canProceedToPreview,
     closeSummary,
     
     // Navigation
     setCurrentStep
   };
 }